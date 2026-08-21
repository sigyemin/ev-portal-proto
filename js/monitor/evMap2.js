/**
 * evMap2.js - 성능 개선 버전 (Web Worker + Supercluster 기반)
 */

var evMapWorkerInstance = null;

// 레거시 연동용 전역 변수 심화 복원
window.m_mapStations = {
    _data: {},
    put: function(k, v) { this._data[k] = v; },
    get: function(k) { return this._data[k]; },
    keys: function() { return Object.keys(this._data); }
};
var circleLayer = null;
var circleX = null;
var circleY = null;
var loadedOrgs = { me: false, etc: false };

function getWorker() {
    if (!evMapWorkerInstance) {
        evMapWorkerInstance = new Worker( evmonurl.replace('/monitor/evMap', '/js/monitor/evMapWorker2.js') + '?v=1.1.3' );
        evMapWorkerInstance.onmessage = function(e) {
            var data = e.data;
            if (data.type === 'clustersUpdated') {
                processWorkerClusters(data.clusters);
            } else if (data.type === 'dataLoaded') {
                toggleMapLoading(false);
                updateData(false); // 이어지는 Stat 업데이트 트리거 (실시간 상태 반영)
            } else if (data.type === 'statsUpdated') {
                reDrawStatAndMarker(); // 상태 최신화 후 최종 화면 렌더링
                toggleMapLoading(false);
            } else if (data.type === 'filterResults') {
                updateSidebarList(data.stations, data.target);
            } else if (data.type === 'radiusResults') {
                updateRadiusSidebarList(data.stations, data.target);
            } else if (data.type === 'clusterExtentResult') {
                var extent = ol.proj.transformExtent(data.extent, 'EPSG:4326', 'EPSG:3857');
                baseGround.getView().fit(extent, { duration: 400, padding: [50, 50, 50, 50], maxZoom: 17 });
            } else if (data.type === 'bookmarkResults') {
                if (typeof renderBookmarkResults === 'function') {
                    renderBookmarkResults(data.stations, data.target);
                }
            }
        };
    }
    return evMapWorkerInstance;
}

function toggleMapLoading(show) {
    if (show) {
        $("#mapLoading").fadeIn(100);
        $(".data-loading").show();
    } else {
        $("#mapLoading").fadeOut(300);
        $(".data-loading").hide();
    }
}

function updateSidebarList(stations, target) {
    var $list = (target === 'mobile') ? $("#mobileStatList") : $("#statList");
    $list.empty();
    
    if (!stations || stations.length === 0) {
        $list.html("<ul><li class='force_justify_center'> 검색된 결과가 없습니다!</li></ul>");
        return;
    }

    var $ul = $("<ul>").addClass("chargerList").css("overflow", "auto");
    var limit = 500;
    var count = 0;

    for (var i = 0; i < stations.length; i++) {
        var st = stations[i];
        // 레거시 브라우저/함수 연동을 위해 캐시 업데이트
        window.m_mapStations.put(st.sid, st);

        if (typeof TagStatList === 'function') {
            $ul.append(TagStatList(st, "onClickStationOfList"));
        }
        count++;
        if (count >= limit) {
            $ul.append("<li class='force_justify_center'>이하 생략...</li>");
            break;
        }
    }
    $list.append($ul);
    
    if (target === 'mobile') {
        $('#mobile_pop_search .noResult').hide();
        $('#mobile_pop_search .yesResult').show();
        $list.show();
    }
    
    $list.trigger("ChangeFindData");
}
function renderBookmarkResults(stations, target) {
    var $container = (target === 'mobile') ? $("#mobileBookmarkList") : $("#bookList");
    
    $container.empty();
    
    if (!stations || stations.length === 0) {
        var emptyMsg = "<ul class='chargerList'><li class='force_justify_center'><br/>즐겨찾는 충전소가 없습니다.<br/></li></ul>";
        $container.html(emptyMsg);
        if (target === 'mobile') {
            $("#mobile_pop_bookmark .noResult").show();
            $("#mobileBookmarkList").hide();
        }
        return;
    }
    
    var $ul = $("<ul>").addClass("chargerList").attr("id", target === 'mobile' ? "bookmarkListMobile" : "bookmarkList").css("overflow", "auto");
    stations.forEach(function(st) {
        // 레거시 연동을 위해 캐시 업데이트
        window.m_mapStations.put(st.sid, st);
        if (typeof TagStatList === 'function') {
            $ul.append(TagStatList(st, "onClickStationOfList"));
        }
    });
    
    $container.append($ul);
    
    if (target === 'mobile') {
        $container.show();
        $("#mobile_pop_bookmark .noResult").hide();
    }
    
    // UI 트리거 (레거시 호환)
    $container.trigger("ChangeFindData");
}

function processWorkerClusters(clusters) {
    var format = new ol.format.GeoJSON();
    var features = format.readFeatures({
        type: "FeatureCollection",
        features: clusters
    }, {
        dataProjection: 'EPSG:4326',
        featureProjection: 'EPSG:3857'
    });

    clusterDrawing(features);
}

var styleCache = {};
function clusterDrawing(features) {
    if (window.clusterLayer && window.clusterLayer.getSource) {
        var source = window.clusterLayer.getSource();
        source.clear();
        source.addFeatures(features);
    } else {
        var vectorSource = new ol.source.Vector({ features: features });
        // Legacy moveend 이벤트의 setDistance 호출 충돌 방지용 더미 함수
        vectorSource.setDistance = function() {};
        
        window.clusterLayer = new ol.layer.Vector({
            name: 'clusterLayer', id: 'cluster',
            source: vectorSource,
            style: simplifiedStyle,
            zIndex: 20
        });
        baseGround.addLayer(window.clusterLayer);
    }
}

// 최적화된 마커 스타일링 (이미지 캐시 무시하고 Circle로 고속 렌더링 가능하게 설계)
var logoStyleCache = {};
var circleStyleCache = {};

function simplifiedStyle(feature) {
    var size = feature.get('point_count');
    
    if (size) {
        // [개선] 숫자가 매우 커져도 원의 크기가 과도하게 벌어지지 않도록 로그 함수 적용
        // 최소 약 22px에서 최대 약 35px 사이로 원 크기를 안정화함
        var radius = 22 + Math.min(13, Math.floor(Math.log2(size)));
        
        var cacheKey = 'c_' + size;
        if (styleCache[cacheKey]) return styleCache[cacheKey];

        var style = new ol.style.Style({
            image: new ol.style.Circle({
                radius: radius,
                fill: new ol.style.Fill({ color: 'rgba(0, 76, 161, 0.75)' }), // 레거시 블루
                stroke: new ol.style.Stroke({ color: '#fff', width: 2.5 })
            }),
            text: new ol.style.Text({
                text: size.toString(),
                fill: new ol.style.Fill({ color: '#fff' }),
                font: 'bold 15px Arial', // 레거시 폰트 크기
                textAlign: 'center'
            })
        });
        styleCache[cacheKey] = style;
        return style;
    }
 else {
        // 단일 마커 스타일
        var bid = feature.get('chgeMange');
        var stat = feature.get('stat');
        var mode = feature.get('mode');
        var cacheKey = 'm_' + bid + '_' + stat + '_' + mode;

        if (styleCache[cacheKey]) return styleCache[cacheKey];

        var stat_cd = stat;
        if (stat_cd == null || stat_cd == "" || stat_cd == "8" || stat_cd == "9") stat_cd = "0"; //상태미확인
        else if (stat_cd == "4" || stat_cd == "5") stat_cd = "1";	//사용불가

        var contextPath = $("div#map").data("contextpath") || "";
        contextPath = contextPath.endsWith('/') ? contextPath : contextPath + '/';
        
        var styles = [];
        
        // 배경 마커 핀 (상태별)
        styles.push(new ol.style.Style({
            image: new ol.style.Icon({
                src: contextPath + 'img/monitor/marker_layer/' + stat_cd + '.png'
            })
        }));

        // 환경부/기관 로고
        styles.push(new ol.style.Style({
            image: new ol.style.Icon({
                src: contextPath + 'img/monitor/logo_layer/logo_' + bid + '.png',
            })
        }));

        // 부가 모드 아이콘 (교통약자 등)
        if (mode && (mode.includes("_p0") || mode.includes("_p1") || mode.includes("_p2"))) {
            styles.push(new ol.style.Style({
                image: new ol.style.Icon({
                    src: contextPath + 'img/monitor/marker_layer/' + mode + '.png'
                })
            }));
        }

        styleCache[cacheKey] = styles;
        return styles;
    }
}

/* === 행정구역 레이어 관리 (Sido/Sigungu) === */
var regionLayer = null;
var regionSigLayer = null;

function initRegionLayers() {
    if (regionLayer) return; // 이미 초기화됨
    if (typeof baseGround === 'undefined' || !baseGround) return;

    var format = new ol.format.GeoJSON();
    
    // 1. 시도 레이어 (Sido)
    var regionFeatures = [];
    if (typeof _region !== 'undefined' && Array.isArray(_region)) {
        _region.forEach(function(fc) {
            if (fc && fc.features) {
                regionFeatures = regionFeatures.concat(format.readFeatures(fc, {
                    dataProjection: 'EPSG:4326',
                    featureProjection: 'EPSG:3857'
                }));
            }
        });
    }
    
    regionLayer = new ol.layer.Vector({
        name: 'regionLayer',
        source: new ol.source.Vector({ features: regionFeatures }),
        style: new ol.style.Style({
            stroke: new ol.style.Stroke({ color: '#ff5533', width: 2.5 })
        }),
        zIndex: 10,
        visible: false
    });
    baseGround.addLayer(regionLayer);

    // 2. 시군구 레이어 (Sigungu)
    var regionSigFeatures = [];
    if (typeof _regionsig !== 'undefined') {
        for (var key in _regionsig) {
            if (Object.prototype.hasOwnProperty.call(_regionsig, key)) {
                var fc = _regionsig[key];
                if (fc && fc.features) {
                    regionSigFeatures = regionSigFeatures.concat(format.readFeatures(fc, {
                        dataProjection: 'EPSG:4326',
                        featureProjection: 'EPSG:3857'
                    }));
                }
            }
        }
    }
    
    regionSigLayer = new ol.layer.Vector({
        name: 'regionSigLayer',
        source: new ol.source.Vector({ features: regionSigFeatures }),
        style: new ol.style.Style({
            stroke: new ol.style.Stroke({ color: '#3388ff', width: 1.2, lineDash: [4, 4] })
        }),
        zIndex: 9,
        visible: false
    });
    baseGround.addLayer(regionSigLayer);
}

function toggleRegionLayer(visible) {
    if (!regionLayer) {
        initRegionLayers();
    }
    if (regionLayer) regionLayer.setVisible(visible);
    if (regionSigLayer) regionSigLayer.setVisible(visible);
}

var isEvMap2Bound = false;

// 데이터 초기화 오버라이드
function initData() {
    if (!isEvMap2Bound && baseGround) {
        // 지도 조작 시 리렌더링
        baseGround.on('moveend', function() {
            reDrawStatAndMarker();
        });

        // 마커 및 클러스터 클릭 이벤트 (레거시 동작 완벽 복원)
        baseGround.on('click', function(e) {
            var feature = baseGround.forEachFeatureAtPixel(e.pixel, function(f) { return f; });
            if (feature) {
                var clusterId = feature.get('cluster_id');
                if (clusterId) {
                    // 클러스터 클릭 시: 해당 클러스터 범위(Extent)로 지도 맞춤 (워커 연동)
                    getWorker().postMessage({
                        type: 'getClusterExtent',
                        clusterId: clusterId
                    });
                } else {
                    var sid = feature.get('sid');
                    if (sid) {
                        // 단일 마커 클릭 시: 레거시 팝업 엔진 호출
                        if (typeof openPopup === 'function') {
                            openPopup(feature);
                        } else if (typeof onClickStationOfList === 'function') {
                            onClickStationOfList(sid);
                        }
                    }
                }
            }
        });
        
        // 포인터 커서 처리
        baseGround.on('pointermove', function(e) {
            var pixel = baseGround.getEventPixel(e.originalEvent);
            var hit = baseGround.hasFeatureAtPixel(pixel);
            baseGround.getTargetElement().style.cursor = hit ? 'pointer' : '';
        });

        // 검색 버튼 바인딩
        $("#BTN_FIND_BY_NAME").off('click').on('click', function(e) {
            e.preventDefault();
            $("#statList").empty(); // 검색 시작 시 이전 결과 초기화
            // 응답이 빠르므로 대기 이미지 제거
            
            var filters = {
                type: getExceptType(),
                mng: getExceptMng(),
                trf: getExceptTrf() || [],
                smrt: getExceptSmrt() || [],
                search: $("#F_STAT_NAME1").val(),
                statType: $.trim($("#F_STAT_TYPE1").val()),
                is24: $("#F_24HOUR1").is(":checked"),
                isSmart: $("#F_SMART_CHRGR1").is(":checked"),
                zcode: $("#F_SI_DO1").val() || "",
                zscode: $("#F_GU_GUN1").val() || ""
            };

            // 지역명(area) 검색인 경우 레거시 onLocalSearch 호출
            if ($("#F_SEARCH_TYPE1").val() === "area") {
                if (typeof onLocalSearch === 'function') {
                    onLocalSearch(filters.search, "WEB");
                }
                return;
            }

            getWorker().postMessage({
                type: 'requestSidebarList',
                filters: filters
            });
        });

        // 엔터키 검색 지원
        $("#F_STAT_NAME1").off('keypress').on('keypress', function(e) {
            if ((e.keyCode ? e.keyCode : e.which) == '13') {
                $("#BTN_FIND_BY_NAME").trigger("click");
            }
        });

        // 검색 타입 변경 핸들러 (지역명 선택 시 반경 노출)
        $("#F_SEARCH_TYPE1").off('change').on('change', function() {
            if ($(this).val() === "area") {
                $("#f_search_area").show();
            } else {
                $("#f_search_area").hide();
                if (circleLayer) baseGround.removeLayer(circleLayer);
            }
        });

        // Context Path URL 보정 (jsessionid 등 특수 상황 대응 및 404 방지)
        var cp = $("div#map").data("contextpath");
        if (cp) {
            if (cp.indexOf(';') > -1) cp = cp.substring(0, cp.indexOf(';'));
            if (!cp.endsWith('/')) cp += '/';
            $("div#map").data("contextpath", cp);
        }

        isEvMap2Bound = true;
    }

    var chkme = ($("#orgme").is(":checked") ? 'Y' : 'N');
    var chketc = ($("#orgetc").is(":checked") ? 'Y' : 'N');
    
    var files = [];
    // 이미 로드된 데이터는 다시 요청하지 않음 (불필요한 호출 제거)
    if (chkme === 'Y' && !loadedOrgs.me) {
        files.push(evmonurl + "List.do?orgme=Y&enzip=Y");
        loadedOrgs.me = true;
    }
    if (chketc === 'Y' && !loadedOrgs.etc) {
        files.push(evmonurl + "List.do?orgetc=Y&enzip=Y");
        loadedOrgs.etc = true;
    }
    
    if (files.length > 0) {
        getWorker().postMessage({ type: 'loadData', files: files, clear: false });
    }
}

// 상태 정보 업데이트 체인 추가 (Legacy 함수 완전 대체)
function updateData(reDraw, noZip) {
    if ($(".filterMng:checked").length == 0) return;

    var chkme = ($("#orgme").is(":checked") ? 'Y':'N');
    var chketc = ($("#orgetc").is(":checked") ? 'Y':'N');
    var enzip = (( noZip == undefined || noZip == null || noZip == "" ) ? 'Y' : 'N');

    if (chkme == 'N' && chketc == 'N') return;

    // 20230622 : 충전소상태 자동갱신
    if (!$("#chktimer").prop("checked") && window.m_timer) {
        clearInterval(window.m_timer);
        window.m_timer = null;
    }

    if (window.upChk != 0 ) return;
    window.upChk = 1;

    var statParams = [];
    if (chkme === 'Y') statParams.push("orgme=Y");
    if (chketc === 'Y') statParams.push("orgetc=Y");
    statParams.push("enzip=" + enzip);
    
    var statUrl = evmonurl + "StatList.do?" + statParams.join("&");
    toggleMapLoading(true);
    getWorker().postMessage({ type: 'loadStats', url: statUrl });
    
    window.upChk = 0;
}

// 필터링 및 뷰 기준 리렌더링 (Worker 호출) - 지도 마커 전용
function reDrawStatAndMarker() {
    var filters = {
        type: getExceptType(),
        mng: getExceptMng(),
        trf: getExceptTrf() || [],
        smrt: [] // "스마트제어 충전기" 체크 시 지도 마커는 영향 없도록 처리
    };
    
    var view = baseGround.getView();
    var zoom = view.getZoom();
    
    var extent = view.calculateExtent(baseGround.getSize());

    // Supercluster가 bbox 밖 클러스터로 포인트를 흡수해 빈 구간이 생기지 않도록 충분한 버퍼 확보
    var bufferSize = ol.extent.getWidth(extent) * 0.50;
    var bufferedExtent = ol.extent.buffer(extent, bufferSize);
    var bbox = ol.proj.transformExtent(bufferedExtent, 'EPSG:3857', 'EPSG:4326');

    getWorker().postMessage({
        type: 'updateMapView',
        filters: filters,
        bbox: bbox,
        zoom: zoom
    });
}

// 반경 검색 레거시 포팅
function radiusChange(value) {
    if (circleX != "" && circleX != null) {
        onClickStatAddr(circleX, circleY);
    } else {
        alert('지역명 리스트를 선택해 주시기 바랍니다.');
    }
}

// 반경 검색 결과 상세 리스트 UI 주입
function updateRadiusSidebarList(stations, target) {
    var $searchResultDiv = (target === 'mobile') ? $("#mobileNearbyList") : $("#statList");
    $("#circleList").remove(); // 기존 반경 리스트 제거
    
    if (!stations || stations.length === 0) {
        alert("반경 내 충전소가 없습니다.");
        return;
    }

    var $ul = $('<ul class="chargerList circleList" id="circleList" style="background: #fdfdfd; border-left: 3px solid #3b82f6; margin: 10px 0;">');
    for (var i = 0; i < stations.length; i++) {
        var st = stations[i];
        window.m_mapStations.put(st.sid, st);
        if (typeof TagStatList === 'function') {
            $ul.append(TagStatList(st, "onClickStationOfList"));
        }
    }
    
    // 클릭된 주소 항목 바로 뒤에 삽입
    var $activeItem = $("div.localInfo.active");
    if ($activeItem.length) {
        $activeItem.after($ul);
    } else {
        $searchResultDiv.prepend($ul);
    }
}

function onClickStatAddr(x, y) {
    if (window.circleLayer) baseGround.removeLayer(window.circleLayer);
    
    // 현재 선택된 주소 항목 표시 전처리
    $("div.localInfo").removeClass("active");
    $(event.target).closest("div.localInfo").addClass("active");

    circleX = x;
    circleY = y;

    var km = 3;
    if ($("#chk01").is(":checked")) km = 3;
    if ($("#chk02").is(":checked")) km = 5;
    if ($("#chk03").is(":checked")) km = 10;

    // 워커에 반경 내 리스트 요청
    var filters = {
        x: x, y: y, radius: km,
        type: getExceptType(),
        mng: getExceptMng(),
        trf: getExceptTrf() || [],
        smrt: getExceptSmrt() || []
    };

    getWorker().postMessage({
        type: 'requestSidebarRadiusList',
        filters: filters
    });

    var transformCenter = ol.proj.transform([parseFloat(x), parseFloat(y)], 'EPSG:4326', 'EPSG:3857');
    var view = baseGround.getView();

    // 점 해상도 보정 (거리 정확도 향상)
    var pointResolution = ol.proj.getPointResolution(view.getProjection(), view.getResolution(), transformCenter);
    var resolutionFactor = view.getResolution() / pointResolution;
    var actualRadius = (km * 1000) * resolutionFactor;

    var circleFeature = new ol.Feature({
        geometry : new ol.geom.Circle(transformCenter, actualRadius)
    });

    window.circleLayer = new ol.layer.Vector({
        source: new ol.source.Vector({ features: [circleFeature] }),
        style: new ol.style.Style({
            fill: new ol.style.Fill({ color: 'rgba(37, 99, 235, 0.15)' }),
            stroke: new ol.style.Stroke({
                color: '#2563eb',
                width: 2,
                lineDash: [4, 8]
            })
        }),
        zIndex: 5
    });

    baseGround.addLayer(window.circleLayer);
    view.animate({
        center: transformCenter,
        zoom: km === 3 ? 15 : (km === 5 ? 14 : 13),
        duration: 500
    });
}

// Legacy 렌더링 무력화 (커스텀 엔진으로 대체)
var markerDrawing = function() {};
var reDrawStatAndMarker_ = function() {};
