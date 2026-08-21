// 내 주변 충전소 엔진 — 현재 위치 기준 반경 검색, 유형(전기차/수소차) 전환, 목록 렌더
var EvMapNear = (function () {
	var pageInfo = {};
	var sessions = {};      // key -> { conf, worker, ready, pending }
	var activeKey = null;
	var coords = null;      // { lat, lng }
	var radiusKm = 5;
	var $root = null;
	var configs = [];

	// 한 번에 그리는 항목 상한 — 초과분은 안내 항목 1개로 대체한다
	var RENDER_LIMIT = 300;

	var BAND_LABEL = { slow: '완속', mid: '중속', fast: '급속', fastplus: '급속+', ultra: '초급속' };

	function esc(v) {
		return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) {
			return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
		});
	}

	function showLoading(on) {
		if (on) $('.data-loading').show();
		else $('.data-loading').hide();
	}

	function haversineDistance(lat1, lon1, lat2, lon2) {
		var R = 6371; // km
		var dLat = (lat2 - lat1) * Math.PI / 180;
		var dLon = (lon2 - lon1) * Math.PI / 180;
		var a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
			+ Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
		return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	}

	// 워커는 필터 통과 전건만 보내므로(x=위도, y=경도) 반경 판정·거리 정렬은 여기서 한다
	function withinRadius(stations) {
		var results = [];
		if (!coords) return results;
		(stations || []).forEach(function (s) {
			var lat = parseFloat(s.x), lng = parseFloat(s.y);
			if (isNaN(lat) || isNaN(lng)) return;
			var dist = haversineDistance(coords.lat, coords.lng, lat, lng);
			if (dist > radiusKm) return;
			s.dist = dist;
			results.push(s);
		});
		results.sort(function (a, b) { return a.dist - b.dist; });
		return results;
	}

	function distanceText(km) {
		if (km == null || isNaN(km)) return '';
		if (km < 1) return Math.round(km * 1000) + 'm';
		return (Math.round(km * 10) / 10) + 'km';
	}

	function setMessage(text) {
		$root.find('.structured-list').html('<li class="structured-list__item"><p class="data-none">' + esc(text) + '</p></li>');
		$root.find('.total-number__total').text(0);
	}

	function readRadius() {
		radiusKm = parseFloat($('input[name="kilometer"]:checked').val()) || 5;
		return radiusKm;
	}

	function setNotice() {
		$root.find('.board-toolbar__notice').text('가까운 순 정렬 (현재 위치 기준 ' + radiusKm + 'km)');
	}

	// zcode/zscode -> 지역명(adapter.sidoList/gugunList 맵) + 층, 전기차 목록에 주소 데이터가 없어 대체
	function regionLabel(adapter, s) {
		var sido = adapter.sidoList && adapter.sidoList[s.zcode];
		var gugun = adapter.gugunList && adapter.gugunList[s.zscode];
		var region = gugun ? ((sido && gugun.indexOf(sido) !== 0) ? sido + ' ' + gugun : gugun) : (sido || '');
		if (s.fl) return region ? region + ' · ' + s.fl : s.fl;
		return region;
	}

	function bandSummary(bands) {
		if (!bands) return '';
		return ['slow', 'mid', 'fast', 'fastplus', 'ultra'].map(function (k) {
			return bands[k] ? BAND_LABEL[k] + bands[k] : null;
		}).filter(Boolean).join(' · ');
	}

	function dataRow(label, value) {
		if (value === null || value === undefined || value === '') return '';
		return '<li><span class="structured-list__data-label">' + label + '</span>'
			+ '<strong class="structured-list__data-value">' + esc(value) + '</strong></li>';
	}

	function itemShell(s, title, address, rows, badges) {
		return '<li class="structured-list__item">'
			+ '<button type="button" class="structured-list__button" aria-expanded="false" aria-controls="energyStationDetail"'
			+ ' data-sid="' + esc(s.sid) + '" data-cm="' + esc(s.chgeMange) + '">'
			+ '<div class="structured-list__header">'
			+ '<strong class="structured-list__header-title">' + esc(title) + '</strong>'
			+ '<p class="structured-list__header-address">' + esc(address) + '</p>'
			+ '<span class="distance">' + esc(distanceText(s.dist)) + '</span>'
			+ '</div>'
			+ '<div class="structured-list__content"><ul class="structured-list__data">' + rows + '</ul>'
			+ (badges || '') + '</div>'
			+ '</button></li>';
	}

	// 유형별 목록 항목 렌더러 — 설정의 key 와 같은 이름을 쓴다
	var itemRenderers = {
		ev: function (adapter, s) {
			var rows = dataRow('운영기관', s.chgeMange === '00' ? '기후부' : '타기관')
				+ dataRow('충전기', '총' + (s.totalCnt || 0) + '기 (' + bandSummary(s.bands) + ')');
			var badges = (s.utime === '24시간 이용가능')
				? '<div class="badges"><span class="badge badge--light badge--secondary">24시간 이용가능</span></div>' : '';
			return itemShell(s, s.snm, regionLabel(adapter, s), rows, badges);
		},
		h2: function (adapter, s) {
			var operText = (s.posnm && s.posnm !== s.cstnm) ? (s.cstnm || '') + '(' + s.posnm + ')' : s.cstnm;
			var rows = dataRow('영업상태', operText)
				+ dataRow('충전기', s.ctpnm)
				+ dataRow('차종', s.vknm)
				+ dataRow('요금', s.fee);
			return itemShell(s, s.snm, s.adr, rows, '');
		}
	};

	function render(stations) {
		showLoading(false);
		var list = stations || [];
		$root.find('.total-number__total').text(list.length);
		setNotice();

		if (!list.length) {
			$root.find('.structured-list').html('<li class="structured-list__item"><p class="data-none">조회된 내용이 없습니다.</p></li>');
			return;
		}

		var conf = sessions[activeKey].conf;
		var renderItem = itemRenderers[conf.key];
		var shown = (list.length > RENDER_LIMIT) ? list.slice(0, RENDER_LIMIT) : list;
		var html = shown.map(function (s) { return renderItem(conf.adapter, s); }).join('');
		if (list.length > shown.length) {
			html += '<li class="structured-list__item"><p class="data-none">이하 생략...</p></li>';
		}
		$root.find('.structured-list').html(html);
	}

	// 워커에는 기존 검색폼 필터만 넘긴다 — 반경은 응답을 받은 뒤 withinRadius() 가 적용한다
	function buildFilters(conf) {
		readRadius();
		return conf.buildFilters ? (conf.buildFilters() || {}) : {};
	}

	// 워커가 응답하지 않으면(구버전 캐시·미지원 메시지) 로더가 무한히 돌므로 감시 타이머로 끊는다
	var RESPONSE_TIMEOUT = 20000;

	function clearWatchdog(session) {
		if (session.timer) { clearTimeout(session.timer); session.timer = null; }
	}

	function startWatchdog(session, what, ms) {
		clearWatchdog(session);
		session.timer = setTimeout(function () {
			session.timer = null;
			if (session !== sessions[activeKey]) return;
			showLoading(false);
			console.error('[내 주변 충전소] ' + session.conf.key + ' 워커 무응답(' + what + ') — ' + session.conf.adapter.workerUrl);
			setMessage('충전소 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.');
		}, ms || RESPONSE_TIMEOUT);
	}

	function requestNear(session) {
		if (!coords) return;
		showLoading(true);
		if (!session.ready) { session.pending = true; return; }
		startWatchdog(session, 'requestSidebarList');
		session.worker.postMessage({ type: 'requestSidebarList', filters: buildFilters(session.conf) });
	}

	function createSession(conf) {
		var adapter = conf.adapter;
		var session = { conf: conf, worker: new Worker(adapter.workerUrl), ready: false, pending: false, timer: null };

		session.worker.onmessage = function (e) {
			var d = e.data;
			if (d.type === 'dataLoaded') {
				session.ready = true;
				clearWatchdog(session);
				console.log('[내 주변 충전소] ' + conf.key + ' 충전소 ' + d.count + '건 적재');
				// 실시간 상태는 충전소 적재 후에 요청한다 — 먼저 도착하면 반영 대상이 없어 버려진다
				session.worker.postMessage({ type: 'loadStats', url: adapter.statUrl(session.loadFilters) });
				if (session.pending) { session.pending = false; requestNear(session); }
				else if (session === sessions[activeKey]) showLoading(false);
			} else if (d.type === 'statsUpdated') {
				if (session === sessions[activeKey]) requestNear(session);
			} else if (d.type === 'filterResults') {
				clearWatchdog(session);
				if (session === sessions[activeKey]) render(withinRadius(d.stations));
			} else if (d.type === 'error') {
				clearWatchdog(session);
				console.error('[내 주변 충전소] ' + conf.key + ' 워커 오류: ' + d.message);
				if (session === sessions[activeKey]) {
					showLoading(false);
					// 적재 후(상태 갱신 실패 등)에는 이미 그린 목록을 지우지 않는다
					if (!session.ready) setMessage('충전소 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.');
				}
			}
		};

		// 워커 스크립트 자체가 로드/파싱에 실패하면 onmessage 는 영영 오지 않는다 — 로더를 끊고 원인을 남긴다
		session.worker.onerror = function (err) {
			clearWatchdog(session);
			console.error('[내 주변 충전소] ' + conf.key + ' 워커 로드 실패: ' + adapter.workerUrl, err && err.message);
			if (session === sessions[activeKey]) {
				showLoading(false);
				setMessage('충전소 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.');
			}
		};

		// 적재 대상 파일은 검색폼과 무관하게 전국 전량으로 고정한다 — 반경 판정은 워커가 좌표로 한다
		session.loadFilters = conf.loadFilters || {};
		showLoading(true);
		// 공통 헤더가 window load 시점에 로더를 숨기므로, 적재가 안 끝났으면 되살린다
		$(window).on('load', function () { if (!session.ready) showLoading(true); });
		startWatchdog(session, 'loadData', 60000);
		session.worker.postMessage({ type: 'loadData', files: adapter.listUrl(session.loadFilters), clear: true });
		return session;
	}

	function activate(key) {
		var conf = null;
		configs.forEach(function (c) { if (c.key === key) conf = c; });
		if (!conf) return;

		activeKey = key;
		$('.energy-station .tab .tab__item').each(function () {
			$(this).toggleClass('tab__item--selected', $(this).find('[data-near-type]').data('near-type') === key);
		});
		$('[data-filter-type]').each(function () {
			$(this).toggle($(this).data('filter-type') === key);
		});

		// 유형마다 상세 응답 형식이 달라 패널 어댑터를 매번 다시 연결한다 — 이전 유형의 위임 핸들러는 먼저 푼다
		$('#energyStationDetail').off('click');
		EvMapPanel.init(conf.adapter, pageInfo);

		if (!sessions[key]) sessions[key] = createSession(conf);
		var session = sessions[key];

		if (!coords) { setMessage('현재 위치를 확인할 수 없습니다. 위치 권한을 허용한 뒤 [현재 위치로 검색]을 눌러 주세요.'); return; }
		setMessage('조회 중입니다.');
		if (!session.ready) showLoading(true);
		requestNear(session);
	}

	// 위치 권한은 보안 컨텍스트(HTTPS/localhost)에서만 허용된다
	function locate(onDone) {
		if (!navigator.geolocation) {
			coords = null;
			console.log('[내 주변 충전소] 이 브라우저에서 Geolocation 을 지원하지 않습니다.');
			setMessage('이 브라우저에서는 현재 위치를 사용할 수 없습니다.');
			return;
		}
		setMessage('현재 위치를 확인하는 중입니다.');
		navigator.geolocation.getCurrentPosition(function (p) {
			coords = { lat: p.coords.latitude, lng: p.coords.longitude };
			console.log('[내 주변 충전소] 현재 위치 위도 ' + coords.lat + ', 경도 ' + coords.lng
				+ ' (오차 ' + Math.round(p.coords.accuracy) + 'm)');
			if (onDone) onDone();
		}, function (err) {
			// [프로토] 위치 권한이 없어도 시연이 가능하도록 기본 위치(서울시청)로 대체한다
			console.log('[내 주변 충전소] 현재 위치 조회 실패: ' + (err && err.message) + ' → 기본 위치로 대체');
			coords = { lat: 37.566571, lng: 126.978028 };
			setMessage('현재 위치를 사용할 수 없어 기본 위치(서울시청) 기준으로 조회합니다.');
			if (onDone) onDone();
		}, { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 });
	}

	function search() {
		var session = sessions[activeKey];
		if (!session) return;
		if (!coords) { locate(search); return; }
		setMessage('조회 중입니다.');
		requestNear(session);
	}

	function init(info, list) {
		pageInfo = info || {};
		configs = list || [];
		$root = $('.around-station .search-result');

		readRadius();
		setNotice();

		// 목록은 매 조회마다 다시 그리므로 위임 바인딩으로 상세 패널을 연다
		$root.on('click', '.structured-list__button', function () {
			EvMapPanel.open($(this).data('sid'), $(this).data('cm'));
		});
		$('[data-near-type]').on('click', function () {
			activate($(this).data('near-type'));
		});
		$('input[name="kilometer"]').on('change', function () {
			readRadius();
			search();
		});
		$('.search-form .button--search').on('click', function () {
			locate(search);
		});

		activate(configs.length ? configs[0].key : null);
		locate(search);
	}

	return {
		init: init,
		search: search,
		activate: activate,
		getCoords: function () { return coords; }
	};
})();
