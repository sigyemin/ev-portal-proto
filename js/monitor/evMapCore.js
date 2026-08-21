// 통합지도 엔진 — 지도 초기화, 워커 연동, 클러스터/마커 렌더, 자동갱신
var EvMapCore = (function () {
	var map = null, adapter = null, pageInfo = {}, worker = null;
	var markerLayer = null, markerSource = null;
	var stationsChangedCb = null;
	var baseLayers = {};
	var currentFiltersObj = {};
	var refreshTimer = null;
	var clusterStyleCache = {};
	var initialized = false;
	var dataReady = false;
	var firstDrawDone = false;

	// 워커는 fetch 로 받아 전역 ajax 로더가 걸리지 않으므로 적재 구간을 직접 제어한다
	var loadingHeld = false;
	function showLoading(on) {
		loadingHeld = !!on;
		if (on) $('.data-loading').show();
		else $('.data-loading').hide();
	}

	function currentFilters() { return currentFiltersObj; }
	function setFilters(f) { currentFiltersObj = f || {}; }

	function initMap(el) {
		var key = $(el).data('vworldkey');
		baseLayers.base = new ol.layer.Tile({
			source: new ol.source.XYZ({ url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png' })
		});
		baseLayers.satellite = new ol.layer.Tile({ visible: false,
			source: new ol.source.XYZ({ url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png' })
		});
		baseLayers.hybrid = new ol.layer.Tile({ visible: false,
			source: new ol.source.XYZ({ url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png' })
		});

		markerSource = new ol.source.Vector();
		markerLayer = new ol.layer.VectorImage({ source: markerSource });

		map = new ol.Map({
			target: el,
			layers: [baseLayers.base, baseLayers.satellite, baseLayers.hybrid, markerLayer],
			view: new ol.View({ center: ol.proj.fromLonLat([127.5, 36.3]), zoom: 7 }),
			controls: []
		});

		map.on('moveend', requestView);
		map.on('singleclick', handleMarkerClick);
		return map;
	}

	// 클러스터는 다음 단계까지 확대, 단건 마커는 사이드 패널 오픈
	function handleMarkerClick(evt) {
		var feature = map.forEachFeatureAtPixel(evt.pixel, function (f) { return f; }, { hitTolerance: 5 });
		if (!feature) return;
		if (feature.get('pointCount')) {
			zoomIntoCluster(feature);
			return;
		}
		var sid = feature.get('sid');
		if (!sid || typeof EvMapPanel === 'undefined') return;
		EvMapPanel.open(sid, feature.get('chgeMange'));
	}

	// 워커는 9/10.5 를 경계로 시도→시군구→거리 기반 클러스터로 바뀐다 — 그 위는 단계적으로만 확대
	function nextClusterZoom(z) {
		if (z < 9) return 9;
		if (z < 10.5) return 10.5;
		return Math.min(z + 2, 18);
	}

	function zoomIntoCluster(feature) {
		var view = map.getView();
		view.animate({
			center: feature.getGeometry().getCoordinates(),
			zoom: nextClusterZoom(view.getZoom()),
			duration: 300
		});
	}

	// 뷰포트 bbox·zoom 을 워커에 보내 클러스터 재계산을 요청
	function requestView() {
		if (!map || !worker) return;
		var view = map.getView();
		var extent = view.calculateExtent(map.getSize());
		var bbox = ol.proj.transformExtent(extent, 'EPSG:3857', 'EPSG:4326');
		worker.postMessage({ type: 'updateMapView', filters: currentFilters(), bbox: bbox, zoom: view.getZoom() });
	}

	// 구독자가 있을 때만 요청 — 470k 행 전체 재집계 비용을 무구독 상태에서 피한다
	// 적재 전에는 요청하지 않는다 — 빈 결과가 "조회된 내용이 없습니다"로 먼저 렌더된다
	function requestSidebarListIfSubscribed() {
		if (!dataReady) return;
		if (stationsChangedCb && worker) worker.postMessage({ type: 'requestSidebarList', filters: currentFilters() });
	}

	function initWorker() {
		worker = new Worker(adapter.workerUrl);
		worker.onmessage = function (e) {
			var d = e.data;
			// 로더는 첫 클러스터가 그려진 뒤에 내린다 — 적재 완료 시점에 내리면 지도가 빈 채로 노출된다
			// 적재 전 moveend 로도 빈 클러스터 응답이 오므로 dataReady 이후에만 로더를 내린다
			if (d.type === 'clustersUpdated') {
				drawClusters(d.clusters);
				if (dataReady) {
					firstDrawDone = true;
					showLoading(false);
				}
			}
			else if (d.type === 'filterResults') { if (stationsChangedCb) stationsChangedCb(d.stations); }
			else if (d.type === 'dataLoaded') {
				dataReady = true;
				// 실시간 상태는 충전소 적재 후에 요청한다 — 먼저 도착하면 반영 대상이 없어 버려진다
				worker.postMessage({ type: 'loadStats', url: adapter.statUrl(currentFilters()) });
				requestView();
				requestSidebarListIfSubscribed();
				// 클러스터 응답이 오지 않아도 로더가 남지 않도록 하는 안전장치
				setTimeout(function () { if (!firstDrawDone) { firstDrawDone = true; showLoading(false); } }, 5000);
			} else if (d.type === 'statsUpdated') {
				if (!dataReady) return;
				requestView();
				requestSidebarListIfSubscribed();
			} else if (d.type === 'bookmarkResults' && d.target === 'focus') {
				focusOnStation(d.stations && d.stations[0]);
			} else if (d.type === 'error') {
				firstDrawDone = true;
				showLoading(false);
				console.error('worker:', d.message);
			}
		};

		showLoading(true);
		// 공통 헤더가 window load·ajaxStop 에서 로더를 숨기므로, 적재 중이면 되살린다
		// (핸들러 등록이 공통 헤더보다 뒤라 항상 나중에 실행된다)
		$(window).on('load', function () { if (loadingHeld) $('.data-loading').show(); });
		$(document).ajaxStop(function () { if (loadingHeld) $('.data-loading').show(); });
		worker.postMessage({ type: 'loadData', files: adapter.listUrl(currentFilters()), clear: true });
	}

	// GeoJSON Feature 배열: 클러스터는 properties.point_count, 단건은 properties.sid 로 구분
	function drawClusters(clusters) {
		markerSource.clear();
		clusters.forEach(function (c) {
			var coords = c.geometry.coordinates; // [경도, 위도]
			var f = new ol.Feature({ geometry: new ol.geom.Point(ol.proj.fromLonLat(coords)) });
			var props = c.properties || {};
			if (props.point_count) {
				f.setStyle(clusterStyle(props.point_count));
				f.set('pointCount', props.point_count);
			} else {
				var s = adapter.markerStyle(props);
				f.setStyle(EvMapMarker.iconStyle(s.state, s.band));
				f.set('sid', props.sid);
				f.set('chgeMange', props.chgeMange);
			}
			markerSource.addFeature(f);
		});
	}

	function clusterStyle(count) {
		var key = 'cluster|' + count;
		if (clusterStyleCache[key]) return clusterStyleCache[key];
		var radius = Math.min(14 + Math.sqrt(count) * 2, 34);
		clusterStyleCache[key] = new ol.style.Style({
			image: new ol.style.Circle({
				radius: radius,
				fill: new ol.style.Fill({ color: 'rgba(93, 135, 255, 0.75)' }),
				stroke: new ol.style.Stroke({ color: '#ffffff', width: 2 })
			}),
			text: new ol.style.Text({
				text: String(count),
				fill: new ol.style.Fill({ color: '#ffffff' }),
				font: 'bold 12px sans-serif'
			})
		});
		return clusterStyleCache[key];
	}

	function initControls(container) {
		var html = ''
			+ '<div class="map-controls__group">'
			+ '  <button type="button" class="button button--icon" data-map-base="base">일반</button>'
			+ '  <button type="button" class="button button--icon" data-map-base="satellite">위성</button>'
			+ '  <button type="button" class="button button--icon" data-map-base="hybrid">지번</button>'
			+ '</div>'
			+ '<div class="map-controls__group">'
			+ '  <button type="button" class="button button--icon" data-map-zoom="1">확대</button>'
			+ '  <button type="button" class="button button--icon" data-map-zoom="-1">축소</button>'
			+ '  <button type="button" class="button button--icon" data-map-locate="1">현재위치</button>'
			+ '</div>';
		$(container).html(html);

		$(container).on('click', '[data-map-base]', function () {
			var name = $(this).data('map-base');
			Object.keys(baseLayers).forEach(function (k) { baseLayers[k].setVisible(k === name); });
		});
		$(container).on('click', '[data-map-zoom]', function () {
			map.getView().setZoom(map.getView().getZoom() + parseInt($(this).data('map-zoom'), 10));
		});
		$(container).on('click', '[data-map-locate]', function () {
			if (!navigator.geolocation) { alert('현재 위치를 사용할 수 없습니다.'); return; }
			navigator.geolocation.getCurrentPosition(function (p) {
				map.getView().animate({ center: ol.proj.fromLonLat([p.coords.longitude, p.coords.latitude]), zoom: 14 });
			}, function () { alert('현재 위치를 가져오지 못했습니다.'); });
		});
	}

	function setAutoRefresh(on) {
		if (refreshTimer) { clearInterval(refreshTimer); refreshTimer = null; }
		if (on) {
			refreshTimer = setInterval(function () {
				worker.postMessage({ type: 'loadStats', url: adapter.statUrl(currentFilters()) });
			}, 30000);
		}
	}

	// 원본 필드명이 뒤바뀜: x 가 위도, y 가 경도 — fromLonLat 에는 경도(y)를 먼저 넘긴다
	function focusOnStation(st) {
		if (!map || !st) return;
		map.getView().animate({ center: ol.proj.fromLonLat([st.y, st.x]), zoom: Math.max(map.getView().getZoom(), 16) });
	}

	// 호출자가 좌표를 주면 그대로 쓰고, 없으면 화면의 마커를 찾고, 그것도 없으면 워커에 단건 조회를 요청
	function focusStation(sid, station) {
		if (!map) return;
		if (station && station.x != null && station.y != null) {
			focusOnStation(station);
			return;
		}
		var found = null;
		var key = String(sid);
		markerSource.forEachFeature(function (f) {
			if (String(f.get('sid')) === key) { found = f; return true; }
		});
		if (found) {
			map.getView().animate({ center: found.getGeometry().getCoordinates(), zoom: Math.max(map.getView().getZoom(), 16) });
			return;
		}
		if (worker) worker.postMessage({ type: 'requestBookmarkList', bookmarkIds: [sid], target: 'focus' });
	}

	return {
		// 1회만 호출 — 재호출 시 Worker·moveend 리스너가 중복 생성되는 것을 막는다
		init: function (a, info) {
			if (initialized) return;
			initialized = true;
			adapter = a; pageInfo = info || {};
			initMap(document.querySelector('.map'));
			initControls(document.querySelector('.map-controls'));
			initWorker();
		},
		search: function (filters) {
			setFilters(filters);
			requestView();
			requestSidebarListIfSubscribed();
		},
		focusStation: focusStation,
		setAutoRefresh: setAutoRefresh,
		onStationsChanged: function (cb) { stationsChangedCb = cb; },
		getMap: function () { return map; }
	};
})();
