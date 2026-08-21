// 통합지도 사이드바 목록 — 렌더, 항목 클릭 시 상세 패널 오픈, 항목 우상단 즐겨찾기
var EvMapList = (function () {
	var $root = null, adapter = null, pageInfo = {}, lastStations = [], stationBySid = {};
	// { STAT_ID: 1 } — 화면이 넘긴 객체를 그대로 들고 쓰며, 토글 시 이 객체를 갱신해 '즐겨찾기만 보기' 필터와 상태를 공유한다
	var bookmarkMap = null;

	var BAND_LABEL = { slow: '완속', mid: '중속', fast: '급속', fastplus: '급속+', ultra: '초급속' };

	// 한 번에 그리는 항목 상한 — 초과분은 클릭 불가 안내 항목 1개로 대체한다
	var RENDER_LIMIT = 500;

	function esc(v) {
		return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) {
			return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
		});
	}

	// zcode/zscode -> 지역명(adapter.sidoList/gugunList 맵) + 층, 목록에 주소 데이터가 없어 대체
	function regionLabel(s) {
		var sido = adapter && adapter.sidoList && adapter.sidoList[s.zcode];
		var gugun = adapter && adapter.gugunList && adapter.gugunList[s.zscode];
		// gugun 명칭이 시/도명을 포함하므로(예: '서울특별시 강남구') 중복 표기를 피한다
		var region = gugun ? ((sido && gugun.indexOf(sido) !== 0) ? sido + ' ' + gugun : gugun) : (sido || '');
		if (s.fl) return region ? region + ' · ' + s.fl : s.fl;
		return region;
	}

	// 사업자명 데이터가 없어 기후부 직영 여부만 구분(정확한 사업자명은 사이드 패널에서 표시)
	function operatorLabel(s) {
		return s.chgeMange === '00' ? '기후부' : '타기관';
	}

	function bandSummary(bands) {
		if (!bands) return '';
		return ['slow', 'mid', 'fast', 'fastplus', 'ultra'].map(function (k) {
			return bands[k] ? BAND_LABEL[k] + bands[k] : null;
		}).filter(Boolean).join(' · ');
	}

	// 주차료: 원본 PARKING_FREE (0=무료, 1=유료), 그 외 값은 미표시
	function parkLabel(park) {
		var v = (park === null || park === undefined) ? '' : String(park);
		if (v === '0') return '주차료(무료)';
		if (v === '1') return '주차료(유료)';
		return '';
	}

	// 이용제한: 워커 집계값(N=개방형, Y=폐쇄형, P=일부 제한)
	function limitLabel(limitYn) {
		if (limitYn === 'N') return '개방형';
		if (limitYn === 'Y') return '폐쇄형';
		if (limitYn === 'P') return '일부 이용제한';
		return '';
	}

	// 데이터가 있는 항목만 배지로 노출 — 주차료 · 이용가능시간 · 이용제한
	function badgesHtml(s) {
		var labels = [parkLabel(s.park), s.utime, limitLabel(s.limitYn)].filter(function (v) {
			return v !== null && v !== undefined && v !== '';
		});
		if (!labels.length) return '';
		return '<div class="badges">' + labels.map(function (v) {
			return '<span class="badge badge--light badge--secondary">' + esc(v) + '</span>';
		}).join('') + '</div>';
	}

	// 항목 우상단 즐겨찾기 별표 — 어댑터에 bookmarkUrl 이 없으면 노출하지 않는다
	function bookmarkHtml(s) {
		if (!adapter || !adapter.bookmarkUrl) return '';
		var marked = !!(bookmarkMap && bookmarkMap[s.sid]);
		return '<button type="button" class="button button--icon button--borderless button--bookmark js-list-bookmark"'
			+ ' data-sid="' + esc(s.sid) + '" aria-pressed="' + (marked ? 'true' : 'false') + '"'
			+ ' title="' + (marked ? '즐겨찾기 해제' : '즐겨찾기') + '">'
			+ '<i class="svg-icon ' + (marked ? 'star-fill' : 'star-stroke') + '" aria-hidden="true"></i>'
			+ '<span class="button__label ir-pm">즐겨찾기</span>'
			+ '</button>';
	}

	// 뷰어(사이드 패널)와 같은 evMapBook.do 로 등록·해제하고, 응답 확인 후에만 별표를 전환한다
	function toggleBookmark($btn) {
		if (pageInfo.loginYn !== 'Y') {
			alert('로그인 후 이용할 수 있습니다.');
			return;
		}
		var sid = String($btn.data('sid'));
		var s = stationBySid[sid] || {};
		var isMarked = $btn.attr('aria-pressed') === 'true';
		var mode = isMarked ? 'delete' : 'write';
		$.ajax({
			type: 'post', url: adapter.bookmarkUrl,
			data: { mode: mode, sid: sid, stat_id: sid, stat_nm: s.snm || '', stat_addr: s.adr || '' },
			success: function (res) {
				if (!res || res.resultCd !== '200') {
					alert('즐겨찾기 처리에 실패했습니다.');
					return;
				}
				if (bookmarkMap) {
					if (mode === 'write') bookmarkMap[sid] = 1;
					else delete bookmarkMap[sid];
				}
				$btn.attr('aria-pressed', mode === 'write' ? 'true' : 'false')
					.attr('title', mode === 'write' ? '즐겨찾기 해제' : '즐겨찾기');
				$btn.find('.svg-icon')
					.toggleClass('star-fill', mode === 'write')
					.toggleClass('star-stroke', mode !== 'write');
			},
			error: function () {
				alert('즐겨찾기 처리에 실패했습니다.');
			}
		});
	}

	function itemHtml(s) {
		return ''
			+ '<li class="structured-list__item">'
			+ '<button type="button" class="structured-list__button" aria-expanded="false" aria-controls="charging-side-panel" data-sid="' + esc(s.sid) + '" data-cm="' + esc(s.chgeMange) + '">'
			+ '<div class="structured-list__header">'
			+ '<strong class="structured-list__header-title">' + esc(s.snm) + '</strong>'
			+ '<p class="structured-list__header-address">' + esc(regionLabel(s)) + '</p>'
			+ '</div>'
			+ '<div class="structured-list__content">'
			+ '<ul class="structured-list__data">'
			+ '<li><span class="structured-list__data-label">운영기관</span>'
			+ '<strong class="structured-list__data-value">' + esc(operatorLabel(s)) + '</strong></li>'
			+ '<li><span class="structured-list__data-label">충전기</span>'
			+ '<strong class="structured-list__data-value">총' + esc(s.totalCnt || 0) + '기 '
			+ '<span>(' + esc(bandSummary(s.bands)) + ')</span></strong></li>'
			+ '</ul>'
			+ badgesHtml(s)
			+ '</div></button>'
			+ bookmarkHtml(s)
			+ '</li>';
	}

	// 워커가 필터 통과 전건을 보내므로 총건수는 배열 길이와 같다
	function render(stations) {
		lastStations = stations || [];
		// 항목 클릭 시 지도 이동에 쓸 좌표 — data-sid 는 jQuery 가 숫자로 바꾸므로 문자열 키로 둔다
		stationBySid = {};
		lastStations.forEach(function (s) { stationBySid[String(s.sid)] = s; });
		var list = lastStations;
		var totalCount = list.length;
		$root.find('.total-number__total').text(totalCount);

		if (!list.length) {
			$root.find('.structured-list').html('<li class="structured-list__item"><p class="data-none">조회된 내용이 없습니다.</p></li>');
			return;
		}
		// 어댑터가 listItemHtml 을 제공하면 그것을, 없으면 기존 itemHtml 을 쓴다
		var shown = (list.length > RENDER_LIMIT) ? list.slice(0, RENDER_LIMIT) : list;
		var html = shown.map(function (s) {
			return (adapter && adapter.listItemHtml) ? adapter.listItemHtml(s) : itemHtml(s);
		}).join('');
		if (totalCount > shown.length) {
			html += '<li class="structured-list__item"><p class="data-none">이하 생략...</p></li>';
		}
		$root.find('.structured-list').html(html);
	}

	// 화면이 확보한 즐겨찾기 맵을 넘겨받는다 — 이미 그려진 목록은 별표 상태를 반영해 다시 그린다
	function setBookmarks(map) {
		bookmarkMap = map || null;
		if (lastStations.length) render(lastStations);
	}

	function init(container, a, p) {
		$root = $(container);
		adapter = a;
		pageInfo = p || {};

		// 지도 이동 후 패널을 연다 — 목록이 이미 가진 좌표를 넘겨 클러스터에 묶인 충전소도 바로 이동한다
		$root.on('click', '.structured-list__button', function () {
			var sid = $(this).data('sid');
			if (typeof EvMapCore !== 'undefined') EvMapCore.focusStation(sid, stationBySid[String(sid)]);
			EvMapPanel.open(sid, $(this).data('cm'));
		});

		// 별표는 항목 클릭(상세 열기)과 분리한다
		$root.on('click', '.js-list-bookmark', function (e) {
			e.stopPropagation();
			toggleBookmark($(this));
		});
	}

	return {
		init: init,
		render: render,
		setBookmarks: setBookmarks,
		bookmarkHtml: bookmarkHtml
	};
})();
