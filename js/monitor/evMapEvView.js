// 통합지도 전기차 어댑터 — 데이터 URL, 충전소 집계, 사이드 패널 렌더
var EvMapEvView = (function () {
	var STATION_TYPE = {
		'A0': '공공시설', 'B0': '주차시설', 'C0': '휴게시설', 'D0': '관광시설', 'E0': '상업시설',
		'F0': '차량정비시설', 'G0': '기타시설', 'H0': '공동주택시설', 'I0': '근린생활시설', 'J0': '교육문화시설'
	};

	// 충전기 타입(ctp) 코드표 — 운영 evMapEvView.js:10~12 코드표 원문 그대로, 노출 순서 01→11
	// (완속 취급 코드는 02·08 = evMapMarker.js:37 기준, 나머지 9종은 급속)
	var CHARGER_TYPE = {
		'01': 'DC차데모', '02': 'AC완속', '03': 'DC차데모+AC3상', '04': 'DC콤보',
		'05': 'DC차데모+DC콤보', '06': 'DC차데모+AC3상+DC콤보', '07': 'AC3상', '08': 'DC콤보(완속)',
		'09': 'NACS', '10': 'DC콤보+NACS', '11': 'DC콤보2(버스전용)'
	};
	// 노출 순서 고정용 코드 배열 — Object.keys 는 '10'·'11'(정수 인덱스 키)을 앞으로 끌어올리므로 명시 순서 사용
	var CHARGER_TYPE_ORDER = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11'];

	var BAND_ORDER = ['slow', 'mid', 'fast', 'fastplus', 'ultra'];
	var BAND_LABEL = { slow: '완속', mid: '중속', fast: '급속', fastplus: '급속+', ultra: '초급속' };
	var BAND_RANGE = { slow: '~30kW', mid: '30~50kW', fast: '50~100kW', fastplus: '100~200kW', ultra: '200kW~' };
	var BAND_OUTPUT = { slow: '30kW 미만', mid: '30~50kW', fast: '50~100kW', fastplus: '100~200kW', ultra: '200kW 이상' };
	// 기후에너지환경부 회원카드 결제 요금(원/kWh) — 고시 단가 고정값
	var MEMBER_CARD_FEE = { slow: '295.0', mid: '307.2', fast: '325.6', fastplus: '348.4', ultra: '393.1' };
	var BAND_FIELD = { slow: 'S1', mid: 'S2', fast: 'S3', fastplus: 'S4', ultra: 'S5' };

	// 충전기 표 최초 노출 행 수 — 나머지는 '더보기'로 펼친다(패널 스크롤·금액 오버레이 높이 유지)
	var INITIAL_ROWS = 5;

	// 상태별 뱃지 클래스·라벨 — 이용자제한은 색상 수식어 없이 plain badge--light
	var STATE_BADGE = {
		available: { cls: 'badge--primary', label: '사용가능' },
		charging: { cls: 'badge--secondary', label: '충전중' },
		unavailable: { cls: 'badge--error', label: '사용불가' },
		unknown: { cls: 'badge--warning', label: '상태미확인' },
		limited: { cls: '', label: '이용자제한' }
	};

	// PAGE_INFO 는 이 스크립트보다 뒤에 로드되므로 빈 객체로 시작, JSP 초기화 스크립트가 채운다
	var sidoList = {};
	var gugunList = {};

	// 서버 값을 HTML 에 넣기 전 항상 통과시키는 이스케이프 헬퍼
	function esc(v) {
		return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) {
			return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
		});
	}

	function listUrl(f) {
		return [EV_MAP_URLS.list];
	}

	function statUrl(f) {
		var p = [];
		if (f.orgme === 'Y') p.push('orgme=Y');
		if (f.orgetc === 'Y') p.push('orgetc=Y');
		p.push('enzip=Y');
		return EV_MAP_URLS.stat;
	}

	// 집계는 워커(evMapWorker2.js computeAggregates)가 단일 소유 — 여기서 중복 계산하지 않음
	// props 는 워커가 만든 GeoJSON feature.properties(repState/maxPower 포함)
	function markerStyle(props) {
		return { state: (props && props.repState) || 'unknown', band: EvMapMarker.powerBand(props && props.maxPower) };
	}

	// 충전기 요금 셀 — R_CHARGER 실시간 단가 우선, 없으면 사업자 표준요금(busiFee) 밴드 매칭
	function feeCellHtml(fee, busiFee, band, prefix) {
		if (fee != null) {
			return esc(fee) + '원<div class="badge badge--small badge--primary"><span class="badge__label">실시간</span></div>';
		}
		var std = busiFee ? busiFee[prefix + BAND_FIELD[band]] : null;
		if (std == null) return '-';
		return esc(std) + '원<div class="badge badge--small"><span class="badge__label">표준</span></div>';
	}

	// chargerList 에는 사업자 코드가 없어 호출부(패널 오픈 시 마커/목록에서 넘어온 cm)로 보정
	function chargerState(c, cm) {
		return EvMapMarker.normalizeStat(c.MAIN_STAT, c.LIMIT_YN, cm);
	}

	function statusCounts(chargerList, cm) {
		var c = { available: 0, charging: 0, etc: 0 };
		(chargerList || []).forEach(function (row) {
			var state = chargerState(row, cm);
			if (state === 'available') c.available++;
			else if (state === 'charging') c.charging++;
			else c.etc++;
		});
		return c;
	}

	function statusSummaryHtml(chargerList, cm) {
		var c = statusCounts(chargerList, cm);
		return '<div class="data-set-group">'
			+ '<dl class="data-set data-set--emphasis"><dt class="data-set__label">사용가능</dt>'
			+ '<dd class="data-set__figure">' + c.available + '</dd>'
			+ '<dd class="data-set__description">(대비 없음)</dd></dl>'
			+ '<dl class="data-set data-set--positive"><dt class="data-set__label">사용중</dt>'
			+ '<dd class="data-set__figure">' + c.charging + '</dd>'
			+ '<dd class="data-set__description">(충전 진행)</dd></dl>'
			+ '<dl class="data-set"><dt class="data-set__label">그 외</dt>'
			+ '<dd class="data-set__figure">' + c.etc + '</dd>'
			+ '<dd class="data-set__description">(점검·통신·중지)</dd></dl>'
			+ '</div>';
	}

	// 이 충전소가 보유한 출력 밴드 — 요금 카드에서 강조 표시할 대상
	function stationBands(chargerList) {
		var has = {};
		(chargerList || []).forEach(function (c) {
			has[EvMapMarker.powerBand(c.CHGE_OUTPUT)] = true;
		});
		return has;
	}

	function memberCardFeeHtml(chargerList) {
		var has = stationBands(chargerList);
		return '<div class="heading-group"><h2 class="heading-subtitle">기후에너지환경부 회원카드 결제 요금</h2></div>'
			+ '<div class="data-set-group">'
			+ BAND_ORDER.map(function (k) {
				var figure = has[k] ? '<b>' + MEMBER_CARD_FEE[k] + '</b>' : MEMBER_CARD_FEE[k];
				return '<dl class="data-set' + (has[k] ? ' data-set--emphasis' : '') + '">'
					+ '<dt class="data-set__label">' + BAND_LABEL[k] + '</dt>'
					+ '<dd class="data-set__figure">' + figure + '</dd>'
					+ '<dd class="data-set__description">' + BAND_OUTPUT[k] + '</dd></dl>';
			}).join('')
			+ '</div>';
	}

	function chargerRowHtml(c, idx, busiFee, cm) {
		var state = chargerState(c, cm);
		var badge = STATE_BADGE[state] || STATE_BADGE.unknown;
		var band = EvMapMarker.powerBand(c.CHGE_OUTPUT);
		var recv = esc(c.RECV_DATE || '');
		// 충전중일 때만 경과시간(PASS_TIME)을 상태 아래에 덧붙인다
		var pass = (state === 'charging' && c.PASS_TIME)
			? '<b class="text-size-small text-secondary">' + esc(c.PASS_TIME) + '</b><br />' : '';

		return '<tr' + (idx >= INITIAL_ROWS ? ' class="js-charger-more" hidden' : '') + '><td>' + (idx + 1) + '</td>'
			+ '<td>' + BAND_LABEL[band] + '<br /><span class="text-size-small">(' + (parseInt(c.CHGE_OUTPUT, 10) || 0) + 'kW)</span></td>'
			+ '<td>' + esc(c.CHGER_TYPE_NM) + '</td>'
			+ '<td>' + feeCellHtml(c.MEMBER_FEE, busiFee, band, 'M_') + '</td>'
			+ '<td>' + feeCellHtml(c.NONMEMBER_FEE, busiFee, band, 'N_') + '</td>'
			+ '<td><span class="badge badge--light' + (badge.cls ? ' ' + badge.cls : '') + '">' + badge.label + '</span><br />'
			+ pass
			+ '<span class="text-size-small">' + recv + '</span></td>'
			+ '<td class="text-left">' + esc(c.POSITION_DESC) + '</td></tr>';
	}

	function chargerTableHtml(chargerList, busiFee, cm) {
		var list = chargerList || [];
		var rows = list.length
			? list.map(function (c, i) { return chargerRowHtml(c, i, busiFee, cm); }).join('')
			: '<tr><td colspan="7">조회된 충전기가 없습니다.</td></tr>';

		return '<div class="board-toolbar">'
			+ '<div class="disclosure"><div class="disclosure-heading">'
			+ '<h2 class="heading-subtitle">충전기 현황</h2>'
			+ '<button type="button" class="disclosure-button" aria-expanded="false" aria-controls="disclosureDescription">안내</button>'
			+ '</div>'
			+ '<div id="disclosureDescription" class="disclosure-container" aria-hidden="true">'
			+ '<div class="disclosure-content"><p>사업자·시간대·할인·로밍에 따라 실제 결제금액이 다릅니다.</p></div>'
			+ '</div></div>'
			+ '<div class="board-toolbar__total"><p class="total-number">총 <b class="total-number__total">' + list.length + '</b>기</p></div>'
			+ '</div>'
			+ '<div class="board-data">'
			+ '<div class="notifications notifications--warning notifications--overlay is-active">'
			+ '<i class="svg-icon caution" aria-hidden="true"></i>'
			+ '<p>이 금액은 안내가(추정)입니다.<br />실제 결제액은 사업자·시간대·할인·로밍 등에 따라 달라질 수 있습니다.</p>'
			+ '<button type="button" class="button button--primary js-fee-view"><span class="button__label">금액 보기</span></button>'
			+ '</div>'
			+ '<div class="table-scroll table-scroll--horizontal"><table class="table table--narrow">'
			+ '<caption>구분, 타입, 회원가, 비회원가, 상태, 위치 등 충전기 현황표</caption>'
			+ '<colgroup><col style="width: 54px" /><col style="width: 60px" /><col style="width: 84px" /><col style="width: 80px" /><col style="width: 80px" /><col style="width: 120px" /><col /></colgroup>'
			+ '<thead><tr><th scope="col">no</th><th scope="col">구분</th><th scope="col">타입</th>'
			+ '<th scope="col">회원가</th><th scope="col">비회원가</th><th scope="col">상태</th><th scope="col">위치</th></tr></thead>'
			+ '<tbody>' + rows + '</tbody></table></div></div>';
	}

	// 사업자별 요금 매트릭스 섹션으로 이동하는 텍스트링크 — URL 미제공 레이아웃에선 평문
	function priceGuideLink() {
		var url = (typeof EV_MAP_URLS !== 'undefined' && EV_MAP_URLS.priceGuide) ? EV_MAP_URLS.priceGuide : '';
		if (!url) return '전기차 충전요금 안내 페이지';
		return '<a href="' + url + '" class="button button--link button--text">전기차 충전요금 안내 페이지</a>';
	}

	function moreButtonHtml(hiddenCount) {
		if (!hiddenCount) return '';
		return '<div class="button-group">'
			+ '<button type="button" class="button button--secondary flex-fill js-charger-more-btn">'
			+ '<i class="svg-icon plus" aria-hidden="true"></i>'
			+ '<span class="button__label">더보기 (' + hiddenCount + ')</span>'
			+ '</button></div>';
	}

	function legendHtml(hiddenCount) {
		return '<div class="board-description">'
			+ '<div class="notifications notifications--warning js-fee-caution" style="display: none;">'
			+ '<i class="svg-icon info" aria-hidden="true"></i>'
			+ '<div class="notifications__description"><p>충전기별 회원가·비회원가는 공시 회원가 기준 참고값입니다.<br />회원·할인·시간대·로밍에 따라 실제 결제금액과 다를 수 있습니다.</p></div>'
			+ '</div>'
			+ moreButtonHtml(hiddenCount)
			+ '<p class="bullet bullet--refer">충전기별 실시간 요금은 공시 회원가 기준 참고값입니다. 회원·할인·시간대·로밍에 따라 실제 결제금액과 다를 수 있습니다. 실시간 미제공 충전기의 사업자 표준요금은 ' + priceGuideLink() + '에서 확인하세요.</p>'
			+ '<p class="bullet bullet--refer">밴드: '
			+ BAND_ORDER.map(function (k) { return '<span class="text-title">' + BAND_LABEL[k] + '</span><span class="text-size-small">(' + BAND_RANGE[k] + ')</span>'; }).join(' · ')
			+ '</p>'
			+ '<p class="bullet bullet--refer">상태: '
			+ '<span class="badge badge--small badge--light badge--primary">사용가능</span> '
			+ '<span class="badge badge--small badge--light badge--secondary">충전중</span> '
			+ '<span class="badge badge--small badge--light badge--error">사용불가</span> '
			+ '<span class="badge badge--small badge--light badge--warning">상태미확인</span> '
			+ '<span class="badge badge--small badge--light">이용자제한</span>'
			+ '</p></div>';
	}

	function facilityRow(label, value) {
		if (value == null || value === '') return '';
		return '<dt class="definition-list__label">' + label + '</dt><dd class="definition-list__description">' + esc(value) + '</dd>';
	}

	function facilityHtml(statInfo) {
		var s = statInfo || {};
		var rows = facilityRow('운영시간', s.USE_TIME)
			+ facilityRow('충전 요금', s.FYN)
			+ facilityRow('주차 요금', s.PARKING_FREE)
			+ facilityRow('연락처', s.PHONE_NO)
			+ facilityRow('운영사', s.BNAME)
			+ facilityRow('업종', s.BUSI_KIND_NM);
		var limit = s.LIMIT_DETAIL
			? '<dt class="definition-list__label">이용자 제한</dt><dd class="definition-list__description">'
				+ '<span class="badge badge--outline badge--primary">' + esc(s.LIMIT_DETAIL) + '</span></dd>'
			: '';

		return '<div class="board-toolbar"><div class="heading-group"><h2 class="heading-subtitle">시설 정보</h2></div></div>'
			+ '<dl class="definition-list">' + rows + limit + '</dl>';
	}

	function remarkHtml(statInfo) {
		var etc = (statInfo && statInfo.ETC) ? esc(statInfo.ETC) : '-';
		return '<div class="board-toolbar"><div class="heading-group"><h2 class="heading-subtitle">참고사항(비고)</h2></div></div>'
			+ '<div class="board-write"><div class="textarea">' + etc + '</div></div>';
	}

	// 위치사진(AS-IS evMapInfo.jsp:237~249 이식) — ATCH 첨부(/file/viewImage.do?atch_id=)를 썸네일 나열, 없으면 '이미지 준비중'
	// 섹션 제목·alt·빈 상태 문구는 운영 원문 그대로, 마크업 클래스는 프로토 체계(.station-photos)
	function photosHtml(imgList) {
		var list = imgList || [];
		var body = list.length
			? '<div class="station-photos">'
				+ list.map(function (img) {
					var src = (img && img.src) ? img.src : '';
					return '<button type="button" class="station-photos__item js-station-photo">'
						+ '<img src="' + esc(src) + '" alt="충전소 사진" class="station-photos__img" /></button>';
				}).join('')
				+ '</div>'
			: '<div class="station-photos station-photos--empty"><p class="station-photos__empty">이미지 준비중</p></div>';
		return '<div class="board-toolbar"><div class="heading-group"><h2 class="heading-subtitle">위치사진</h2></div></div>'
			+ body;
	}

	// 썸네일 클릭 확대 오버레이 — 폭 = min(500, max(200, naturalWidth)) (AS-IS detailImage() 상한500·하한200)
	function openPhotoZoom(src) {
		var $ov = $('<div class="station-photo-zoom"><div class="station-photo-zoom__dim"></div>'
			+ '<div class="station-photo-zoom__body"><img alt="충전소 사진" class="station-photo-zoom__img" />'
			+ '<button type="button" class="station-photo-zoom__close" aria-label="닫기">&times;</button></div></div>');
		var img = $ov.find('.station-photo-zoom__img')[0];
		img.onload = function () {
			img.style.width = Math.min(500, Math.max(200, img.naturalWidth || 0)) + 'px';
		};
		img.src = src;
		function onKey(e) { if (e.key === 'Escape' || e.keyCode === 27) close(); }
		function close() { $ov.remove(); $(document).off('keydown.photozoom', onKey); }
		$ov.find('.station-photo-zoom__dim, .station-photo-zoom__close').on('click', close);
		$(document).on('keydown.photozoom', onKey);
		$('body').append($ov);
	}

	// cm: 마커/목록 클릭에서 넘어온 사업자 코드(EvMapPanel.open 의 3번째 인자) — 없으면 보정 없이 계산
	function renderPanel(el, res, cm) {
		var list = res.chargerList || [];
		var hiddenCount = Math.max(0, list.length - INITIAL_ROWS);
		var html = '<div class="energy-station">'
			+ statusSummaryHtml(list, cm)
			+ memberCardFeeHtml(list)
			+ '<div class="board-wrapper">'
			+ chargerTableHtml(list, res.busiFee, cm)
			+ legendHtml(hiddenCount)
			+ facilityHtml(res.statInfo)
			+ remarkHtml(res.statInfo)
			+ photosHtml(res.imgList)
			+ '</div></div>';
		el.innerHTML = html;

		// 요금 오버레이 — 확인 후에만 금액을 노출하고 참고 안내를 함께 띄운다
		$(el).find('.js-fee-view').on('click', function () {
			$(this).closest('.notifications--overlay').removeClass('is-active');
			$(el).find('.js-fee-caution').show();
		});

		$(el).find('.js-charger-more-btn').on('click', function () {
			$(el).find('.js-charger-more').removeAttr('hidden');
			$(this).closest('.button-group').remove();
		});

		// 위치사진 썸네일 → 확대 오버레이
		$(el).find('.js-station-photo').on('click', function () {
			openPhotoZoom($(this).find('img').attr('src'));
		});
	}

	// 시설유형(zs) / 충전기타입(ctp) 코드표 — 필터 패널이 체크박스 구성에 사용
	var filterFields = {
		stationType: Object.keys(STATION_TYPE).map(function (code) {
			return { code: code, label: STATION_TYPE[code] };
		}),
		chargerType: CHARGER_TYPE_ORDER.map(function (code) {
			return { value: code, label: CHARGER_TYPE[code] };
		})
	};

	return {
		listUrl: listUrl,
		statUrl: statUrl,
		infoUrl: (typeof EV_MAP_URLS !== 'undefined' ? EV_MAP_URLS.info : null),
		bookmarkUrl: (typeof EV_MAP_URLS !== 'undefined' ? EV_MAP_URLS.bookmark : null),
		workerUrl: (typeof EV_MAP_URLS !== 'undefined' ? EV_MAP_URLS.worker : null),
		filterFields: filterFields,
		markerStyle: markerStyle,
		renderPanel: renderPanel,
		sidoList: sidoList,
		gugunList: gugunList
	};
})();
