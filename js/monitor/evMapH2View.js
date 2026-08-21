// 통합지도 수소차 어댑터 — 데이터 URL, 사이드 목록/패널 렌더, 코드표
var EvMapH2View = (function () {
	// 실측 코드값(브리프 확정) — 지어내지 않음
	var filterFields = {
		oper: [{ code: '30', name: '운영중' }, { code: '20', name: '영업마감' }, { code: '10', name: '영업정지' }],
		ctp: [{ code: '02', name: '700 bar' }, { code: '03', name: '800 bar' }, { code: '01', name: '350 bar' }],
		vk: [{ code: '01', name: '승용' }, { code: '03', name: '버스' }, { code: '05', name: '승용/버스' }, { code: '06', name: '승용/버스/트럭' }]
	};

	// PAGE_INFO 는 이 스크립트보다 뒤에 로드되므로 빈 객체로 시작, JSP 초기화 스크립트가 채운다
	var sidoList = {};
	var gugunList = {};

	function esc(v) {
		return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) {
			return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
		});
	}

	function listUrl() {
		return H2_MAP_URLS.list;
	}

	function statUrl() {
		return H2_MAP_URLS.stat;
	}

	// 수소차는 출력 밴드 개념이 없어 band 는 항상 slow 로 고정
	function markerStyle(props) {
		return { state: (props && props.repState) || 'unknown', band: 'slow' };
	}

	function dataRow(label, value) {
		if (value === null || value === undefined || value === '') return '';
		return '<li><span class="structured-list__data-label">' + label + '</span>'
			+ '<strong class="structured-list__data-value">' + esc(value) + '</strong></li>';
	}

	// posnm 이 cstnm 과 다르면 괄호로 덧붙인다
	function operStatusText(s) {
		if (s.posnm && s.posnm !== s.cstnm) return (s.cstnm || '') + '(' + s.posnm + ')';
		return s.cstnm;
	}

	// 오늘 이용가능시간(ut = BHR ~ EHR) — 시간이 비면 ' ~ ' 만 오므로 숫자 유무로 판정
	function useTimeText(s) {
		var v = s.ut == null ? '' : String(s.ut).trim();
		return /[0-9]/.test(v) ? v : '';
	}

	// 수소충전소는 주차료·이용제한 데이터가 없어 이용가능시간만 배지로 노출
	function badgesHtml(s) {
		var ut = useTimeText(s);
		if (!ut) return '';
		return '<div class="badges"><span class="badge badge--light badge--secondary">' + esc(ut) + '</span></div>';
	}

	function listItemHtml(s) {
		var rows = dataRow('영업상태', operStatusText(s))
			+ dataRow('충전기', s.ctpnm)
			+ dataRow('차종', s.vknm)
			+ dataRow('요금', s.fee);
		return '<li class="structured-list__item">'
			+ '<button type="button" class="structured-list__button" aria-expanded="false" aria-controls="charging-side-panel" data-sid="' + esc(s.sid) + '">'
			+ '<div class="structured-list__header">'
			+ '<strong class="structured-list__header-title">' + esc(s.snm) + '</strong>'
			+ '<p class="structured-list__header-address">' + esc(s.adr) + '</p>'
			+ '</div>'
			+ '<div class="structured-list__content"><ul class="structured-list__data">' + rows + '</ul>'
			+ badgesHtml(s) + '</div>'
			+ '</button>'
			+ EvMapList.bookmarkHtml(s)
			+ '</li>';
	}

	// BHR/EHR(오늘 기준) 우선, 없으면 요일별 BHR_1..8/EHR_1..8 로 구성
	function operatingHoursText(s) {
		if (s.BHR && s.EHR) return s.BHR + ' ~ ' + s.EHR;
		var days = [['BHR_1', 'EHR_1', '월'], ['BHR_2', 'EHR_2', '화'], ['BHR_3', 'EHR_3', '수'],
			['BHR_4', 'EHR_4', '목'], ['BHR_5', 'EHR_5', '금'], ['BHR_6', 'EHR_6', '토'],
			['BHR_7', 'EHR_7', '일'], ['BHR_8', 'EHR_8', '공휴일']];
		var parts = days.map(function (d) {
			var b = s[d[0]], e = s[d[1]];
			return (b && e) ? (d[2] + ' ' + b + '~' + e) : null;
		}).filter(Boolean);
		return parts.length ? parts.join(', ') : null;
	}

	function restHoursText(s) {
		return (s.BHR_REST && s.EHR_REST) ? (s.BHR_REST + ' ~ ' + s.EHR_REST) : null;
	}

	function statusSetHtml(s) {
		var descParts = [];
		if (s.POS_STTUS_NM) descParts.push(s.POS_STTUS_NM);
		var hours = operatingHoursText(s);
		if (hours) descParts.push(hours);
		var desc = descParts.length ? '(' + esc(descParts.join(' · ')) + ')' : '';
		return '<div class="data-set-group">'
			+ '<dl class="data-set"><dt class="data-set__label">영업상태</dt>'
			+ '<dd class="data-set__figure"><b>' + esc(s.OPER_STTUS_NM) + '</b></dd>'
			+ '<dd class="data-set__description">' + desc + '</dd></dl>'
			+ '</div>';
	}

	// 수소차 충전요금 안내 화면으로 이동하는 텍스트링크 — URL 미제공 레이아웃에선 평문
	function priceGuideLink() {
		var url = (typeof H2_MAP_URLS !== 'undefined' && H2_MAP_URLS.priceGuide) ? H2_MAP_URLS.priceGuide : '';
		if (!url) return '수소차 충전요금 안내 페이지';
		return '<a href="' + url + '" class="button button--link button--text">수소차 충전요금 안내 페이지</a>';
	}

	// 응답의 판매가격은 하나뿐이라(FEE/FREE_YN) 700bar/350bar 2행 대신 1행으로 그린다
	function feeTableHtml(s) {
		var value = s.FREE_YN === 'Y' ? '무료' : (s.FEE ? esc(s.FEE) + '원/kg' : '-');
		return '<div class="board-toolbar"><div class="disclosure"><div class="disclosure-heading">'
			+ '<h2 class="heading-subtitle">충전요금</h2>'
			+ '<button type="button" class="disclosure-button" aria-expanded="false" aria-controls="disclosureDescription">안내</button>'
			+ '</div><div id="disclosureDescription" class="disclosure-container" aria-hidden="true">'
			+ '<div class="disclosure-content"><p>사업자·시간대·할인·로밍에 따라 실제 결제금액이 다릅니다.</p></div>'
			+ '</div></div></div>'
			+ '<div class="board-data"><table class="table table--form">'
			+ '<caption>충전 요금안내표</caption>'
			+ '<colgroup><col style="width: 30%" /><col /></colgroup>'
			+ '<tbody><tr><td>충전 요금</td><td><b>' + value + '</b></td></tr></tbody>'
			+ '</table></div>'
			+ '<div class="board-description"><p class="bullet bullet--refer text-warning">'
			+ '충전기별 실시간 요금은 공시 회원가 기준 참고값입니다. 회원·할인·시간대·로밍에 따라 실제 결제금액과 다를 수 있습니다. '
			+ '실시간 미제공 충전기의 사업자 표준요금은 ' + priceGuideLink() + '에서 확인하세요.</p></div>';
	}

	function facilityRow(label, value) {
		if (value == null || value === '') return '';
		return '<dt class="definition-list__label">' + label + '</dt><dd class="definition-list__description">' + esc(value) + '</dd>';
	}

	function facilityHtml(s) {
		var rows = facilityRow('운영시간', operatingHoursText(s))
			+ facilityRow('휴게시간', restHoursText(s))
			+ facilityRow('연락처', s.CALL);
		if (!rows) return '';
		return '<div class="board-toolbar"><div class="heading-group"><h2 class="heading-subtitle">시설 정보</h2></div></div>'
			+ '<dl class="definition-list">' + rows + '</dl>';
	}

	function remarkHtml(s) {
		if (!s.NOTICE) return '';
		return '<div class="board-toolbar"><div class="heading-group"><h2 class="heading-subtitle">참고사항(비고)</h2></div></div>'
			+ '<div class="board-write"><div class="textarea">' + esc(s.NOTICE) + '</div></div>';
	}

	// res.statInfo(evMapH2Info.ajax 응답)만 사용 — 충전잔량/대기차량은 데이터 없어 제외
	function renderPanel(el, res, cm) {
		var s = (res && res.statInfo) || {};
		var html = '<div class="energy-station">'
			+ statusSetHtml(s)
			+ '<div class="board-wrapper">'
			+ feeTableHtml(s)
			+ facilityHtml(s)
			+ remarkHtml(s)
			+ '</div></div>';
		el.innerHTML = html;
	}

	return {
		workerUrl: (typeof H2_MAP_URLS !== 'undefined' ? H2_MAP_URLS.worker : null),
		infoUrl: (typeof H2_MAP_URLS !== 'undefined' ? H2_MAP_URLS.info : null),
		bookmarkUrl: (typeof H2_MAP_URLS !== 'undefined' ? H2_MAP_URLS.bookmark : null),
		listUrl: listUrl,
		statUrl: statUrl,
		markerStyle: markerStyle,
		renderPanel: renderPanel,
		listItemHtml: listItemHtml,
		sidoList: sidoList,
		gugunList: gugunList,
		filterFields: filterFields
	};
})();
