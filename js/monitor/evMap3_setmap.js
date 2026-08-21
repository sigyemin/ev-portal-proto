/**
 * evMap3_setmap.js  – Leaflet edition of evmonitor_setmap.js
 *
 * zIndexes (Leaflet pane):
 *   tilePane      (200) : baseLayer, satelLayer, hybridLayer
 *   overlayPane   (400) : regionLayer (GeoJSON)
 *   markerPane    (600) : markerClusterGroup
 *   popupPane     (700) : popups
 */

var vWorldKey   = '83A75653-EA63-384B-B284-D56C49332972';
var mapCenter   = [37.55236577, 126.97077348];   // [lat, lng]  ← Leaflet 순서
var defaultZoom = 12;

var declusterZoom     = 15;   // 이 줌 이상에서 개별 마커 표시
var clusterMaxZoom    = 14;   // MarkerClusterGroup 최대 클러스터 줌
var clusterDistance   = 80;   // spiderfyDistanceMultiplier 조정용 픽셀

/* === 전역 레이어 참조 === */
var baseGround   = null;   // L.map 인스턴스
var baseLayer    = null;
var satelLayer   = null;
var hybridLayer  = null;
var regionLayer       = null;   // 시도 경계 GeoJSON
var regionSigLayer    = null;   // 시군구 경계 GeoJSON
var clusterGroup = null;   // L.markerClusterGroup
var circleLayer  = null;   // 지역 검색 원형 (L.circle)

/* === 마커 상태 데이터 === */
var stationSpot  = [];
var clustersAlone = [];

/* === VWorld 타일 URL 팩토리 === */
function _vwUrl(map) {
    return 'https://api.vworld.kr/req/wmts/1.0.0/' + vWorldKey + '/' + map + '/{z}/{y}/{x}.' + (map === 'Satellite' ? 'jpeg' : 'png');
}

/* === Leaflet 지도 초기화 === */
function initLeafletMap() {

    baseLayer = L.tileLayer(_vwUrl('Base'), {
        attribution : '© VWorld',
        minZoom: 7, maxZoom: 19,
        tileSize: 256
    });

    satelLayer = L.tileLayer(_vwUrl('Satellite'), {
        attribution : '© VWorld',
        minZoom: 7, maxZoom: 19
    });

    hybridLayer = L.tileLayer(_vwUrl('Hybrid'), {
        attribution : '© VWorld',
        minZoom: 7, maxZoom: 19,
        zIndex: 2
    });

    var mapContainer = document.getElementById('map');
    if (!mapContainer) {
        console.error('[evMap3] initLeafletMap: #map 요소를 찾을 수 없습니다.');
        return;
    }

    baseGround = L.map(mapContainer, {
        center      : mapCenter,
        zoom        : defaultZoom,
        minZoom     : 7,
        maxZoom     : 19,
        maxBounds   : [[32, 118], [45, 140]],
        maxBoundsViscosity: 1.0,
        zoomControl : false,
        zoomSnap    : 1,           // 줌 단위를 정수로 고정
        zoomDelta   : 1,
        wheelPxPerZoomLevel: 120, // 한 단계 줌을 위해 필요한 스크롤 양을 늘림 (안정화)
        wheelDebounceTime: 60,    // 이벤트 발생 간격을 늘려 튀는 현상 방지
        layers      : [baseLayer]
    });

    // 줌 컨트롤 우측 하단
    L.control.zoom({ position: 'bottomright' }).addTo(baseGround);
}

/* === VWorld API (지역명 지오코딩) === */
function Vapi() {}
Vapi.prototype = {
    execute: function(apiParam, sCallback, fCallback) {
        this.call(apiParam, sCallback, fCallback);
    },
    call: function(apiParam, sCallback, fCallback) {
        $.ajax({
            url      : $('div#map').data('contextpath') + 'web/vworldapijson.do',
            data     : { 'apiParam': apiParam },
            type     : 'POST',
            dataType : 'json',
            success  : function(response) {
                try {
                    var rst = { LIST: response };
                    if (sCallback) sCallback(rst.LIST);
                } catch (ex) { }
            },
            error: function(jqXHR, textStatus, errorThrown) {
                if (fCallback) fCallback();
            }
        });
    }
};

/* ============================================================
 * GeoJSON 래퍼 유틸리티
 * evmregion.js   → _region    (표준 GeoJSON FeatureCollection)
 * evmregionsig.js → _regionsig (표준 GeoJSON FeatureCollection)
 * ============================================================ */

/**
 * GeoJSON FeatureCollection을 Leaflet GeoJSON 레이어로 래핑
 * @param {Object}   geojson   - FeatureCollection 객체
 * @param {Object}   options   - L.geoJSON 옵션
 * @returns {L.GeoJSON}
 */
function wrapGeoJsonAsLeaflet(geojson, options) {
    if (!geojson || geojson.type !== 'FeatureCollection') {
        console.warn('[evMap3] wrapGeoJsonAsLeaflet: 유효하지 않은 GeoJSON 형식');
        return null;
    }
    var defaults = {
        style: {
            color    : '#3a7bd5',
            weight   : 1.5,
            opacity  : 0.7,
            fill     : false
        },
        interactive: false,
        pane: 'overlayPane'
    };
    return L.geoJSON(geojson, $.extend(true, defaults, options || {}));
}

/**
 * 시도 경계 레이어 생성 (_region 전역 변수 사용)
 * _region[0]에 FeatureCollection이 들어있음
 */
function createRegionLayer() {
    if (typeof _region === 'undefined' || !_region[0]) return null;
    return wrapGeoJsonAsLeaflet(_region[0], {
        style: { color: '#3a7bd5', weight: 1.8, opacity: 0.65, fill: false }
    });
}

/**
 * 시군구 경계 레이어 생성 (_regionsig 전역 변수 사용)
 * _regionsig는 SIG_CD를 키로 하는 FeatureCollection 배열임
 */
function createRegionSigLayer() {
    if (typeof _regionsig === 'undefined') return null;
    
    // 모든 FeatureCollection의 features를 하나로 합침
    var mergedFeatures = [];
    for (var key in _regionsig) {
        if (_regionsig.hasOwnProperty(key) && _regionsig[key].features) {
            mergedFeatures = mergedFeatures.concat(_regionsig[key].features);
        }
    }
    
    if (mergedFeatures.length === 0) return null;
    
    var mergedGeoJson = {
        type: "FeatureCollection",
        features: mergedFeatures
    };

    return wrapGeoJsonAsLeaflet(mergedGeoJson, {
        style: { color: '#7b3ab5', weight: 1.2, opacity: 0.5, fill: false }
    });
}

/**
 * 지도 배경 레이어 전환
 * @param {string} type - 'base' | 'satel'
 */
function switchMapLayer(type) {
    if (!baseGround) return;
    if (type === 'satel') {
        if (baseGround.hasLayer(baseLayer)) baseGround.removeLayer(baseLayer);
        if (!baseGround.hasLayer(satelLayer)) baseGround.addLayer(satelLayer);
        if (!baseGround.hasLayer(hybridLayer)) baseGround.addLayer(hybridLayer);
    } else {
        if (baseGround.hasLayer(satelLayer)) baseGround.removeLayer(satelLayer);
        if (baseGround.hasLayer(hybridLayer)) baseGround.removeLayer(hybridLayer);
        if (!baseGround.hasLayer(baseLayer)) baseGround.addLayer(baseLayer);
    }
}
