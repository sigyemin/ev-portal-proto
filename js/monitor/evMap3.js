// evMap3.js  –  evMap.js Leaflet 포팅 버전
// version 1.0

/* ============================================================
 *  공통 유틸리티 (evMap.js에서 그대로 재사용)
 * ============================================================ */
function compare(a, b) {
    if (a.snm < b.snm) return -1;
    if (a.snm > b.snm) return  1;
    return 0;
}

/* --- Custom EVMap (해시맵 구현) --- */
var EVMap = function() { this.map = new Object(); };
EVMap.prototype = {
    put          : function(k, v)  { this.map[k] = v; },
    get          : function(k)     { return this.map[k]; },
    containsKey  : function(k)     { return k in this.map; },
    containsValue: function(v)     { for (var p in this.map) { if (this.map[p] === v) return true; } return false; },
    isEmpty      : function()      { return this.size() === 0; },
    clear        : function()      { for (var p in this.map) { delete this.map[p]; } },
    remove       : function(k)     { delete this.map[k]; },
    keys         : function()      { var ks = []; for (var p in this.map) { ks.push(p); } return ks; },
    values       : function()      { var vs = []; for (var p in this.map) { vs.push(this.map[p]); } return vs; },
    size         : function()      { var c = 0; for (var p in this.map) { c++; } return c; }
};

/* --- Charger --- */
var Charger = function(sid, cid, ctp, cst, tst) {
    this.sid = sid; this.cid = cid; this.ctp = ctp; this.cst = cst; this.tst = tst;
    this.updateStat = function(nStat, tStat) { this.cst = nStat; this.tst = tStat; };
};

/* --- Station --- */
var Station = function(sid, snm, x, y, hol, park, utime, ctp, chgeMange, skindt, zscode, limit, power, trf, smt) {
    this.smt  = (smt === 'Y' ? 'Y' : 'N');
    this.trf  = trf;
    this.sid  = sid;
    this.snm  = snm;
    this.x    = x;
    this.y    = y;
    this.hol  = hol;
    this.stat = '';
    this.park   = park;
    this.utime  = utime;
    this.skindt = skindt;
    this.ctp    = ctp;
    this.ctpl   = (ctp === '02' ? 1 : 0);
    this.ctps   = (ctp === '02' ? 0 : 1);
    this.chgeMange = (chgeMange == null || chgeMange === '') ? '00' : chgeMange;
    this.zcode  = (zscode + '').substring(0, 2);
    this.zscode = zscode + '';
    this.limit  = limit;
    this.power  = Number(power);
    this.mode   = (limit === 'Y' ? '_l' : '') +
                  (power >= 350 ? '_p2' : '') +
                  (power >= 200 && power < 350 ? '_p1' : '') +
                  (power >= 100 && power < 200 ? '_p0' : '');
    this.marker   = null;
    this.chargers = new EVMap();

    this.setMode = function(limit, power, ctp) {
        this.limit = (this.limit > limit) ? limit : this.limit;
        this.power = (this.power > power) ? this.power : power;
        this.mode  = (limit === 'Y' ? '_l' : '') +
                     (power >= 350 ? '_p2' : '') +
                     (power >= 200 && power < 350 ? '_p1' : '') +
                     (power >= 100 && power < 200 ? '_p0' : '');
        this.ctpl += (ctp === '02' ? 1 : 0);
        this.ctps += (ctp === '02' ? 0 : 1);
    };

    this.setSmt = function(smt) {
        if (this.smt === 'Y') return false;
        this.smt = (smt === 'Y' ? 'Y' : 'N');
    };

    this.setStat = function(ArryTypefilter, ArryMngFilter, ArryTrfFilter, ArraySmrtFilter) {
        var nStat  = '';
        var tKeys  = this.chargers.keys();
        
        if (this.isContainExcept(ArryMngFilter, this.chgeMange)) return;

        for (var i = 0; i < tKeys.length; i++) {
            var cChgr = this.chargers.get(tKeys[i]);
            if (this.isContainExcept(ArryTypefilter, cChgr.ctp))      continue;
            if (this.isContainExcept(ArryTrfFilter,  this.trf))       continue;
            if (this.isContainExcept(ArraySmrtFilter,this.smt))       continue;
            nStat = (this.getStatOrder(nStat) >= this.getStatOrder(cChgr.cst)) ? nStat : cChgr.cst;
        }
        this.stat = nStat;
    };

    this.isContainExcept = function(arr, val) {
        if (!arr || !arr.length) return false;
        return arr.includes(val);
    };

    this.getStatOrder = function(stat) {
        var s = String(stat);
        if (s === '2') return '8';
        if (s === '3') return '7';
        if (s === '5') return '6';
        if (s === '1') return '5';
        if (s === '8') return '4';
        if (s === '9') return '3';
        if (s === '4') return '2';
        if (s === '7') return '1';
        return '0';
    };

    this.getStatName = function(stat) {
        if (stat === '1' || stat === 1) return '통신미연결';
        if (stat === '4' || stat === 4) return '운영중지';
        if (stat === '5' || stat === 5) return '점검중';
        if (stat === '2' || stat === 2) return '사용가능';
        if (stat === '3' || stat === 3) return '충전중';
        if (stat === '6' || stat === 6) return '예약중';
        if (stat === '7' || stat === 7) return '시범운영';
        if (stat === '9' || stat === 9) return '기타(정보미제공)';
        return '알수없음';
    };
};

/* ============================================================
 *  전역 상태
 * ============================================================ */
var m_mapStations = new EVMap();
var m_finedStats  = [];
var upChk = 0;
var _isLoad_me  = false;
var _isLoad_etc = false;
var m_timer     = null;
var _marker_kind = 'I';   // 'I': logo icon,  'P': point
var lastFocusEl;

var dflStat   = [];
dflStat['17']  = '3'; dflStat['18']  = '3'; dflStat['27']  = '3';
dflStat['125'] = '3'; dflStat['60']  = '3';

/* ============================================================
 *  아이콘 캐시 (L.icon 인스턴스)
 * ============================================================ */
var iconCache         = {};
var markerCache       = {}; // L.marker 인스턴스 캐시
var logoCache         = {};

function _ctxPath() {
    return $('div#map').data('contextpath') || '';
}

function getMarkerKey(busi_id, stat_cd, mode) {
    if (_marker_kind === 'P') return ['0', 'st_point_blue', ''];
    if (stat_cd == null || stat_cd === '' || stat_cd === '8' || stat_cd === '9') stat_cd = '0';
    else if (stat_cd === '4' || stat_cd === '5') stat_cd = '1';
    if (stat_cd === '2' && mode != null && mode.includes('_l')) stat_cd = '4';
    var s = dflStat[busi_id + ''];
    if (s !== undefined && s !== '') stat_cd = s;
    return [busi_id, stat_cd, mode || ''];
}

function getLeafletIcon(busi_id, stat_cd, mode) {
    var key = busi_id + '_' + stat_cd + '_' + mode;
    if (iconCache[key]) return iconCache[key];

    var ctx = _ctxPath();
    var markerLayerUrl = ctx + 'img/monitor/marker_layer/' + stat_cd + '.png';
    var logoUrl        = ctx + 'img/monitor/logo_layer/logo_' + busi_id + '.png';

    // DivIcon으로 레이어 겹치기 (marker_layer 위에 logo_layer)
    var html = '<div class="ev-marker-wrap">'
             + '<img class="ev-layer-marker" src="' + markerLayerUrl + '" />'
             + '<img class="ev-layer-logo"   src="' + logoUrl + '" />';
    if (mode && (mode.includes('_p0') || mode.includes('_p1') || mode.includes('_p2'))) {
        html += '<img class="ev-layer-mode" src="' + ctx + 'img/monitor/marker_layer/' + mode + '.png" />';
    }
    html += '</div>';

    var icon = L.divIcon({
        className : '',
        html      : html,
        iconSize  : [35, 35],
        iconAnchor: [17.5, 35],
        popupAnchor:[0, -50]
    });
    iconCache[key] = icon;
    return icon;
}

/* ============================================================
 *  상태 스팬 HTML
 * ============================================================ */
function getStatSpan(busi_id, stat_cd, limit) {
    if (stat_cd == null || stat_cd === '' || stat_cd === '8' || stat_cd === '9') stat_cd = '0';
    else if (stat_cd === '4' || stat_cd === '5') stat_cd = '1';
    if (stat_cd === '2') {
        if (limit === 'Y') return '<span class="state state_trq">이용자제한</span>';
        else               return '<span class="state">사용가능</span>';
    } else if (stat_cd === '3') return '<span class="state state_gr">사용중</span>';
      else if (stat_cd === '1') return '<span class="state state_black">사용불가</span>';
      else if (stat_cd === '0') return '<span class="state state_org">상태미확인</span>';
    return '';
}

/* ============================================================
 *  필터 헬퍼 (evMap.js와 동일)
 * ============================================================ */
function getExceptStat() { return []; }

function getExceptType() {
    var chtypeArr = [['01','B',0],['02','D',0],['03','BC',0],['04','A',0],['05','AB',0],
                     ['06','ABC',0],['07','C',0],['08','E',0],['09','F',0],['10','AF',0]];
    var exceptArr = [];
    $('.filterType').each(function() {
        if ($(this).is(':checked')) {
            for (var i = 0; i < chtypeArr.length; i++) {
                if (chtypeArr[i][1].indexOf($(this).val()) > -1) chtypeArr[i][2] = 1;
            }
        }
    });
    for (var i = 0; i < chtypeArr.length; i++) {
        if (chtypeArr[i][2] === 0) exceptArr.push(chtypeArr[i][0]);
    }
    return exceptArr;
}

function getExceptTypeMobile() {
    var chtypeArr = [['01','B',0],['02','D',0],['03','BC',0],['04','A',0],['05','AB',0],
                     ['06','ABC',0],['07','C',0],['08','E',0],['09','F',0],['10','AF',0]];
    var exceptArr = [];
    var cntAll = 0;
    $('.filterType').each(function() {
        if ($(this).is(':checked')) {
            for (var i = 0; i < chtypeArr.length; i++) {
                if (chtypeArr[i][1].indexOf($(this).val()) > -1) chtypeArr[i][2] = 1;
            }
        }
    });
    for (var i = 0; i < chtypeArr.length; i++) {
        if (chtypeArr[i][2] === 0) exceptArr.push(chtypeArr[i][0]);
        else cntAll++;
    }
    if (cntAll === chtypeArr.length) return [''];
    return exceptArr;
}

function getExceptMng() {
    var exceptArr = [];
    // 운영기관 체크박스를 클래스 및 name 속성으로 모두 찾아내 수집
    $('input[name=filterMng], .filterMng').each(function() {
        if (!$(this).is(':checked')) {
            var val = $(this).val();
            if (val && exceptArr.indexOf(val) === -1) exceptArr.push(val);
        }
    });
    if ($('#chrgmng00').length > 0 && !$('#chrgmng00').prop('checked')) exceptArr.push(null);
    return exceptArr;
}

function getExceptTrf()  { return $('#chktrf').is(':checked')        ? ['N'] : []; }
function getExceptSmrt() { return $('#F_SMART_CHRGR1').is(':checked') ? ['N'] : []; }

/* ============================================================
 *  마커 드로잉  (Leaflet.markercluster 기반)
 * ============================================================ */

// debounce (150ms)
var _redrawTimer = null;
function reDrawStatAndMarker(bNeedListUpdate) {
    if (bNeedListUpdate === undefined) bNeedListUpdate = true;
    clearTimeout(_redrawTimer);
    _redrawTimer = setTimeout(function() {
        _reDrawStatAndMarkerImpl(bNeedListUpdate);
    }, 150);
}

function _reDrawStatAndMarkerImpl(bNeedListUpdate) {
    $('.data-loading').show();
    
    try {
        // 지역명 검색 원 체크
        if ($('#F_SEARCH_TYPE1').val() === 'area' && circleLayer && baseGround.hasLayer(circleLayer)) {
            _reDrawInCircle(circleLayer, bNeedListUpdate);
        } else {
            // 원형 레이어 제거
            if (circleLayer && baseGround.hasLayer(circleLayer)) baseGround.removeLayer(circleLayer);
            _reDrawAllMarkers(bNeedListUpdate);
        }
    } catch (e) {
        console.error("[evMap3] _reDrawStatAndMarkerImpl Error:", e);
    } finally {
        $('.data-loading').hide();
    }
}

function _reDrawAllMarkers(bNeedListUpdate) {
    var searchName = ($('#F_STAT_NAME1').val() || '').replace(/\s+/g, "").toLowerCase();
    var statType   = $('#F_STAT_TYPE1').val() || '';
    var chgeType   = $('#F_CHGE_TYPE1').val() || '';
    var zcode      = $('#F_SI_DO1').val() || '';
    var zscode     = $('#F_GU_GUN1').val() || '';

    var filterType = getExceptType();
    var filterMng  = getExceptMng();
    var filterTrf  = getExceptTrf();
    var filterSmrt = getExceptSmrt();
    var f_24h      = $('#F_24HOUR1').is(':checked');

    var tKeys = m_mapStations.keys();
    var newMarkers = [];
    var filteredStations = [];

    for (var i = 0; i < tKeys.length; i++) {
        var theStation = m_mapStations.get(tKeys[i]);
        
        // 1. 기본 필터 (검색어 제외: 지도는 검색어와 무관하게 마커 유지)
        if (statType !== '' && theStation.skindt !== statType) continue;
        if (chgeType !== '' && theStation.ctp !== chgeType) continue;
        if (zscode !== '' && theStation.zscode !== zscode) continue;
        if (zcode !== '' && theStation.zcode !== zcode) continue;
        if (f_24h && theStation.utime !== '24시간 이용가능') continue;

        theStation.setStat(filterType, filterMng, filterTrf, filterSmrt);
        if (!theStation.stat) continue;

        var sid = String(theStation.sid);
        var mk = getMarkerKey(theStation.chgeMange, theStation.stat, theStation.mode);
        var icon = getLeafletIcon(mk[0], mk[1], mk[2]);
        
        var marker = markerCache[sid];
        if (!marker) {
            marker = L.marker([parseFloat(theStation.x), parseFloat(theStation.y)], { icon: icon });
            marker._stationSid = theStation.sid;
            marker.on('click', _onMarkerClick);
            markerCache[sid] = marker;
        } else {
            if (marker.options.icon !== icon) {
                marker.setIcon(icon);
            }
        }
        newMarkers.push(marker);
        filteredStations.push(theStation);
    }

    clusterGroup.clearLayers();
    clusterGroup.addLayers(newMarkers);
    
    if (bNeedListUpdate) {
        $('#statList').trigger('ChangeFindData');
    } else {
        $('.data-loading').hide();
    }
}

function _reDrawInCircle(circleL, bNeedListUpdate) {
    var filterType = getExceptType();
    var filterMng  = getExceptMng();
    var filterTrf  = getExceptTrf();
    var filterSmrt = getExceptSmrt();

    var center = circleL.getLatLng();
    var radius = circleL.getRadius();   // 미터

    var tKeys  = m_mapStations.keys();
    var newMarkers = [];
    stationSpot = [];

    for (var i = 0; i < tKeys.length; i++) {
        var theStation = m_mapStations.get(tKeys[i]);
        theStation.setStat(filterType, filterMng, filterTrf, filterSmrt);
        if (!theStation.stat) continue;

        var latlng = L.latLng(parseFloat(theStation.x), parseFloat(theStation.y));
        if (center.distanceTo(latlng) > radius) continue;

        stationSpot.push(theStation);

        var mk   = getMarkerKey(theStation.chgeMange, theStation.stat, theStation.mode);
        var icon = getLeafletIcon(mk[0], mk[1], mk[2]);
        var marker = L.marker(latlng, { icon: icon });
        marker._stationSid = theStation.sid;
        marker.on('click', _onMarkerClick);
        newMarkers.push(marker);
    }

    clusterGroup.clearLayers();
    clusterGroup.addLayers(newMarkers);

    if (bNeedListUpdate) {
        $('#statList').trigger('ChangeFindData');
    } else {
        $('.data-loading').hide();
    }
}

/* ============================================================
 *  마커 클릭 → 팝업
 * ============================================================ */
function _onMarkerClick(e) {
    var sid = e.target._stationSid;
    if (!sid) return;
    openPopup(sid, e.target.getLatLng());
}

function openPopup(sid, latlng) {
    lastFocusEl = document.activeElement;
    $('#pop_station_info').load(evmonurl.replace(/\/$/, '') + '/evMapInfo.do?sid=' + sid, function(response, status) {
        if (status === 'success') {
            pop_ex();
            $('#pop_station_info').attr('tabindex', '-1').focus();
            if (typeof setupFocusTrap === 'function') setupFocusTrap($('#pop_station_info'));
        }
    });
    if (latlng) baseGround.panTo(latlng);
}

function closePopup() {
    $('#pop_station_info').removeAttr('tabindex');
    $('#pop_station_info').off('keydown.focusTrap');
    if (lastFocusEl) lastFocusEl.focus();
}

/* ============================================================
 *  클러스터 그룹 클릭 (여러 마커 묶임 팝업 리스트)
 * ============================================================ */
function _onClusterClick(e) {
    var cluster = e.layer;
    var markers = cluster.getAllChildMarkers();
    
    // 1. 하나만 있으면 바로 상세 정보 팝업
    if (markers.length === 1) {
        openPopup(markers[0]._stationSid, markers[0].getLatLng());
        return;
    }

    // 2. 확대 가능 여부 판단 (모든 마커가 같은 좌표면 확대해도 의미 없음)
    var bounds = cluster.getBounds();
    var isSameLocation = bounds.getNorthEast().equals(bounds.getSouthWest());
    var canZoomMore = baseGround.getZoom() < baseGround.getMaxZoom();

    // 확대가 가능한 상황이면 팝업을 띄우지 않고 확대 인터랙션을 우선함
    if (!isSameLocation && canZoomMore) {
        return; 
    }

    // 3. 더 이상 확대할 수 없거나 위치가 겹치는 경우에만 목록 팝업 표시
    var latlng = cluster.getLatLng();

    var html = '<div class="cluster-popup-wrap">'
             + '  <div class="cluster-pop-header">지점 목록 (' + markers.length + ')</div>'
             + '  <ul class="cluster-pop-list">';

    for (var i = 0; i < markers.length && i < 30; i++) {
        var sid = markers[i]._stationSid;
        var sta = m_mapStations.get(sid);
        if (!sta) continue;
        
        var cm = sta.chgeMange || '00';
        var logoUrl = _ctxPath() + 'img/monitor/logo/logo_' + cm + '.png';
        var statRes = getStatSpan(cm, sta.stat, sta.limit);
        var statNm  = (sta.stat === '2' || sta.stat === '1') ? '사용가능' : (sta.stat === '3' ? '사용중' : '점검중');
        var sClass  = (sta.stat === '2' || sta.stat === '1') ? '2' : (sta.stat === '3' ? '3' : '1');

        html += '<li onclick="onClickStationOfList(\'' + sid + '\', \'0\'); return false;">'
             +  '  <div class="pop-brand-logo" style="background-image:url(' + logoUrl + ')"></div>'
             +  '  <div class="pop-info-wrap">'
             +  '    <div class="pop-sta-name">' + sta.snm + '</div>'
             +  '    <div class="pop-sta-stat stat-' + sClass + '">' + statNm + '</div>'
             +  '  </div>'
             +  '</li>';
    }
    if (markers.length > 30) html += '<li style="justify-content:center; color:#888; font-size:12px; padding:10px;">이하 생략...</li>';
    html += '</ul></div>';

    if (typeof stationListOverlay !== 'undefined' && stationListOverlay) {
        stationListOverlay.setLatLng(latlng).setContent(html).openOn(baseGround);
    } else {
        L.popup({ maxWidth: 350, minWidth: 280, autoPan: false })
         .setLatLng(latlng)
         .setContent(html)
         .openOn(baseGround);
    }
}

var stationListOverlay = null;

function stationListClose() {
    if (stationListOverlay) stationListOverlay.remove();
    baseGround.closePopup();
}

function _statColor(stat) {
    if (stat === '2') return '#22cc55';
    if (stat === '3') return '#3399ff';
    if (stat === '1' || stat === '4' || stat === '5') return '#333';
    return '#aaa';
}

/* ============================================================
 *  데이터 로드
 * ============================================================ */
function decompressGzipData(gzipData) {
    if (typeof pako !== 'undefined') {
        try {
            var uint8Array = new Uint8Array(gzipData);
            return pako.ungzip(uint8Array, { to: 'string' });
        } catch (error) {
            throw new Error('Pako 실패: ' + error.message);
        }
    }
    throw new Error('Pako 미존재');
}

function base64ToArrayBuffer(base64) {
    var binaryString = window.atob(base64);
    var bytes = new Uint8Array(binaryString.length);
    for (var i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
    return bytes;
}

var _isLoadingData = false;
function initData(noZip) {
    if (_isLoadingData) return;
    var chkme  = ($('#orgme').is(':checked')  ? 'Y' : 'N');
    var chketc = ($('#orgetc').is(':checked') ? 'Y' : 'N');

    var loadMe  = (chkme  === 'Y' && !_isLoad_me);
    var loadEtc = (chketc === 'Y' && !_isLoad_etc);

    if (!loadMe && !loadEtc) {
        reDrawStatAndMarker(false);
        return;
    }

    _isLoadingData = true;
    var currentTarget = loadMe ? 'me' : 'etc';

    var objParam = {
        orgme  : currentTarget === 'me' ? 'Y' : 'N',
        orgetc : currentTarget === 'etc' ? 'Y' : 'N',
        enzip  : (noZip == null || noZip === '') ? 'Y' : 'N'
    };

    $('.data-loading').show();

    $.ajax({
        type    : 'POST',
        url     : evmonurl + 'evMapList.do',
        data    : objParam,
        dataType: objParam.enzip === 'Y' ? 'text' : 'json',
        success : function(raw) {
            clearInterval(m_timer);
            if (objParam.enzip === 'Y') {
                try {
                    var decompressed = decompressGzipData(base64ToArrayBuffer(raw));
                    processData(JSON.parse(decompressed));
                } catch (e) {
                    try { processData(JSON.parse(raw)); } catch(ee) {}
                }
            } else {
                processData(raw);
            }

            if (currentTarget === 'me') _isLoad_me  = true;
            else                        _isLoad_etc = true;

            _isLoadingData = false;
            
            // 더 불러올 데이터가 있거나, 초기 로드가 끝났으면 다음 단계로
            if (chkme === 'Y' && !_isLoad_me) {
                initData(noZip);
            } else if (chketc === 'Y' && !_isLoad_etc) {
                initData(noZip);
            } else {
                if ($('#chktimer').prop('checked')) {
                    if (!m_timer) m_timer = setInterval(function() { updateData(false); }, 30000);
                } else {
                    updateData(false); // fetch status once
                }
                reDrawStatAndMarker(false);
            }
        },
        error: function() {
            _isLoadingData = false;
            $('.data-loading').hide();
            if (confirm('충전기 정보 수신을 실패 하였습니다. 다시 시도 하겠습니까?')) initData('noZip');
        },
        complete: function() {
            if (typeof isUserLoggedIn !== 'undefined' && isUserLoggedIn) {
                if ($('.mapTab.bookmarkTab').is(':visible')) populateBookmarkList();
            }
        }
    });
}

function processData(jsnData) {
    if (jsnData && jsnData.chargerList) {
        $.each(jsnData.chargerList, function(index, item) {
            if (item.sid && item.cid && item.x && item.y) {
                var sid = String(item.sid);
                var cid = String(item.cid);
                var theStation = m_mapStations.get(sid);
                if (!theStation) {
                    theStation = new Station(sid, item.snm, item.x, item.y, item.hol, item.p,
                                             item.ut, item.ctp, item.cm, item.st, item.zs, item.lm, item.po, item.trf, item.smt);
                } else {
                    theStation.setMode(item.lm, item.po, item.ctp);
                    theStation.setSmt(item.smt);
                }
                var theCharger = theStation.chargers.get(cid);
                if (!theCharger) {
                    theCharger = new Charger(sid, cid, item.ctp, item.cst, item.tst);
                    theStation.chargers.put(cid, theCharger);
                    if (item.cst === '7') theStation.chgeMange = '01';
                }
                m_mapStations.put(sid, theStation);
            }
        });
    }
}

function updateData(reDraw, noZip) {
    if ($('.filterMng:checked').length === 0) return;
    var chkme  = ($('#orgme').is(':checked')  ? 'Y' : 'N');
    var chketc = ($('#orgetc').is(':checked') ? 'Y' : 'N');
    var enzip  = (noZip == null || noZip === '') ? 'Y' : 'N';
    if (chkme === 'N' && chketc === 'N') return;

    if (!$('#chktimer').prop('checked') && m_timer) { clearInterval(m_timer); m_timer = null; }
    if (upChk !== 0) return;
    upChk = 1;

    var objParam = { orgme: chkme, orgetc: chketc, enzip: enzip };

    $.ajax({
        type    : 'POST',
        url     : evmonurl + 'evMapStatList.do',
        dataType: enzip === 'Y' ? 'text' : 'json',
        data    : objParam,
        success : function(raw) {
            if (enzip === 'Y') {
                try {
                    var decompressed = decompressGzipData(base64ToArrayBuffer(raw));
                    processStatData(JSON.parse(decompressed));
                } catch (e) {
                    try { processStatData(JSON.parse(raw)); } catch(ee) {}
                }
            } else {
                processStatData(raw);
            }
            if (!reDraw) reDrawStatAndMarker(false);
            upChk = 0;
            $('.data-loading').hide();
        },
        error: function() {
            upChk = 0;
            $('.data-loading').hide();
            if (!noZip) { updateData(reDraw, 'noZip'); }
        }
    });
}

function getStatSpan(busi_id, stat_cd, limit) {
    if (stat_cd == null || stat_cd == "" || stat_cd == "8" || stat_cd == "9") 
        stat_cd = "0";
    else if (stat_cd == "4" || stat_cd == "5") 
        stat_cd = "1";
    
    if(stat_cd == '2'){//충전기대기
        if(limit == "Y")
            return '<span class="state state_trq">이용자제한</span>';
        else
            return '<span class="state">사용가능</span>';
    }else if(stat_cd == '3'){//충전중
        return '<span class="state state_gr">사용중</span>';
    }else if(stat_cd == '1'){//운영중지
        return '<span class="state state_black">사용불가</span>';
    }else if(stat_cd == '0'){//타기관
        return '<span class="state state_org">상태미확인</span>';
    } else return '';
}

function TagStatList(theStation, funcCall) {
    var stat = getStatSpan(theStation.chgeMange, theStation.stat, theStation.limit);
    if (stat == "") return "";

    var fn = "javascript:" + funcCall + "('"+ theStation.sid + "', '0')";
    var ctx = _ctxPath();

    var returnVal =
        '<li id="' + theStation.sid + '" sid=" ' + theStation.sid + '" >'
        + '<a href="#" onclick="' + fn + '; return false;" onkeypress="this.onclick;" title="' + theStation.snm + '">'
        + '<div class="icon" style="background: url(' + ctx + 'img/monitor/logo/logo_' + theStation.chgeMange + '.png) center no-repeat; background-size: 60% !important;"></div>' // 아이콘
        + '<div>'
        +   '<p class="title">' + theStation.snm + '</p>'  // 첫줄 (층전서 이름)
        +   '<p>';  // ---- 2번 줄

    returnVal += stat;

    if(theStation.ctp != '02'){
        returnVal += '<span class="type">급속</span>'
    }else if(theStation.ctp == '02'){
        returnVal += '<span class="type">완속</span>'
    }

    returnVal += '</p></div></a></li>';

    return returnVal;
}

function processStatData(jsnData) {
    if (jsnData && jsnData.chargerStatList) {
        $.each(jsnData.chargerStatList, function(index, item) {
            var theStation = m_mapStations.get(String(item.sid));
            if (theStation) {
                var theCharger = theStation.chargers.get(String(item.cid));
                if (theCharger) {
                    theCharger.updateStat(item.cst, item.tst);
                }
            }
        });
    }
}

/* ============================================================
 *  충전소 리스트 태그
 * ============================================================ */
function TagStatList(theStation, funcCall) {
    var stat = getStatSpan(theStation.chgeMange, theStation.stat, theStation.limit);
    if (!stat) return '';
    var fn = "javascript:" + funcCall + "('" + theStation.sid + "','0')";
    var ctx = _ctxPath();
    var isQuick = theStation.ctp !== '02';
    return '<li id="' + theStation.sid + '" sid="' + theStation.sid + '">'
         + '<a href="#" onclick="' + fn + '; return false;" title="' + theStation.snm + '">'
         + '<div class="icon" style="background:url(' + ctx + 'img/monitor/logo/logo_' + theStation.chgeMange + '.png) center no-repeat;background-size:100% !important;"></div>'
         + '<div><p class="title">' + theStation.snm + '</p><p>'
         + stat
         + (isQuick ? '<span class="state state_blue">급속</span>' : '<span class="state state_trq">완속</span>')
         + '</p></div></a></li>';
}


function createNearbyList(theStation, stationMap, funcCall) {
    var stat = getStatSpan(theStation.chgeMange, theStation.stat, theStation.limit);
    if (!stat) return '';
    var fn = "javascript:" + funcCall + "('" + theStation.sid + "','0')";
    return '<li id="' + theStation.sid + '" sid="' + theStation.sid + '">'
         + '<a href="#" onclick="' + fn + '; return false;">'
         + '<div class="icon" style="background:url(../img/monitor/logo/logo_' + theStation.chgeMange + '.png) center/100% no-repeat !important;"></div>'
         + '<div><p class="title">' + theStation.snm + '</p><p>' + stat + '</p></div></a></li>';
}

/* ============================================================
 *  검색 / 이동
 * ============================================================ */
function onClickStationOfList(sid, tabidx) {
    lastFocusEl = document.activeElement;
    var theStation = m_mapStations.get(sid);
    if (!theStation) return;

    var latlng = L.latLng(parseFloat(theStation.x), parseFloat(theStation.y));
    baseGround.setView(latlng, 17);

    $('#pop_station_info').load(evmonurl.replace(/\/$/, '') + '/evMapInfo.do?sid=' + sid, function(response, status) {
        if (status === 'success') {
            pop_ex();
            $('#pop_station_info').attr('tabindex', '-1').focus();
            if (typeof setupFocusTrap === 'function') setupFocusTrap($('#pop_station_info'));
        }
    });

    if (theStation.stat === '') alert('선택하신 충전소는 충전기상태 또는 충전기종류로 필터링 되어 있습니다.');
    else if (theStation.hol === 'Y') alert('선택하신 충전소는 금일 휴무일 입니다. 충전 할 수 없습니다.');
}

function clearSearch() {
    stationListClose();
    // 폼 필드 초기화
    $('#F_SI_DO1').val('').trigger('change');
    $('#F_GU_GUN1').val('');
    $('#sido_change').text('시/도');
    $('#sigungu_change').text('시/군');
    $('#F_STAT_TYPE1').val('');
    $('#F_CHGE_TYPE1').val('');
    $('#F_STAT_NAME1').val('');
    $('#F_24HOUR1, #F_SMART_CHRGR1').prop('checked', false);
    
    // 리스트 영역 초기화
    $('#statList').html('<ul class="chargerList"><li class="force_justify_center">검색 결과가 없습니다.</li><li class="force_justify_center">[검색하기]를 클릭하세요.</li></ul>');
    
    // 지역명 검색 타입 원형 레이어 제거
    if (circleLayer && baseGround.hasLayer(circleLayer)) {
        baseGround.removeLayer(circleLayer);
    }
    $('#F_SEARCH_TYPE1').val('station').trigger('change');
}

function clearMap() {
    if (circleLayer && baseGround.hasLayer(circleLayer)) baseGround.removeLayer(circleLayer);
    stationListClose();
    reDrawStatAndMarker(false);
}

function parseMapLeftWrapEv() {
    var searchData = '';
    if ($('#sido_change').text() !== '시/도' && $('#sido_change').text() !== '') {
        if ($('#sigungu_change').text() !== '시/군' && $('#sigungu_change').text() !== '') {
            searchData = $('#sido_change').text() + ' ' + $('#sigungu_change').text();
        } else {
            searchData = $('#sido_change').text();
        }
    }

    var zcode      = $('#F_SI_DO1').val() || '';
    var zscode     = $('#F_GU_GUN1').val() || '';
    var snm       = $('#F_STAT_NAME1').val() || '';
    var statType  = $('#F_STAT_TYPE1').val() || '';
    var f_24hour  = $('#F_24HOUR1').is(':checked');
    var f_smart   = $('#F_SMART_CHRGR1').is(':checked');
    
    // PC와 모바일 필터 클래스 모두 통합 체크
    var f_chgeType = [];
    $('.filterType:checked, .filterTypeMobile:checked').each(function() { f_chgeType.push($(this).val()); });
    if (f_chgeType.length === 0) f_chgeType = ['A','B','C','D','E','F',''];

    console.log("[Search Log] 필터 조건 -> 지역(zcode):" + zcode + ", 시군구(zscode):" + zscode + ", 검색어:" + snm + ", 분류:" + statType + ", 24h:" + f_24hour + ", 스마트:" + f_smart + ", 타입:" + f_chgeType.join(","));

    m_finedStats.length = 0;

    if ($('#F_SEARCH_TYPE1').val() === 'area') {
        // 이미 지도에 원이 그려져 있고 마커가 추출된 상태(stationSpot)라면 해당 데이터를 리스트로 사용
        if (stationSpot && stationSpot.length > 0) {
            console.log("[Search Log] 지역명 검색 모드 (기존 stationSpot 개수: " + stationSpot.length + ")");
            // 마커 클릭 패딩 등을 고려하여 상태 필터 재계산
            $.each(stationSpot, function(i, sta) {
                sta.setStat(getExceptType(), getExceptMng(), getExceptTrf(), getExceptSmrt());
            });
            return stationSpot.sort(compare);
        }
        
        // 원이 없는 상태라면 VWorld API 검색을 수행
        var sido  = $('#sido_change').text();
        var gungu = $('#sigungu_change').text();
        if (gungu === '전체' || gungu === '시/군') gungu = '';
        if (sido  === '전체' || sido  === '시/도') sido  = '';
        console.log("[Search Log] 지역명 검색 실행 (VWorld): " + $.trim(sido + ' ' + gungu + ' ' + snm));
        onLocalSearch($.trim(sido + ' ' + gungu + ' ' + snm), 'WEB');
        return null;
    }

    var tKeys = m_mapStations.keys();
    var arrStation = [];
    console.log("[Search Log] 일반 검색 시작 (최적화 모드)");

    var foundCnt = 0;
    for (var i = 0; i < tKeys.length; i++) {
        var theStation = m_mapStations.get(tKeys[i]);
        
        // 지역 필터 (가장 빠름)
        if (zscode !== '' && theStation.zscode != zscode) continue;
        if (zcode !== '' && theStation.zcode != zcode) continue;

        // 명칭 필터
        var cleanSnm = snm.replace(/\s+/g, '').toLowerCase();
        if (cleanSnm !== '' && theStation.snm.replace(/\s+/g, '').toLowerCase().indexOf(cleanSnm) < 0) continue;

        // 기본 속성 필터
        if (statType !== '' && theStation.skindt != statType) continue;
        if (f_24hour && theStation.utime !== '24시간 이용가능') continue;
        if (f_smart  && theStation.smt   !== 'Y') continue;

        // 상태 계산 (무거운 연산) - 상위 200건까지만 수행하여 속도 개선
        theStation.setStat(getExceptType(), getExceptMng(), getExceptTrf(), getExceptSmrt());
        if (!theStation.stat) continue;

        m_finedStats.push(theStation.sid);
        arrStation.push(theStation);
        
        if (foundCnt++ > 200) break; // 최대 200건에서 중단하여 검색 속도 확보
    }
    console.log("[Search Log] 최종 개수: " + arrStation.length);
    return arrStation.sort(compare);
}

/* ============================================================
 *  지역명 검색 (VWorld API → 원형 표시)
 * ============================================================ */
var vapi = null;
function onLocalSearch(query, mode) {
    if (!vapi) vapi = new Vapi();
    var apiParam = 'service=search&request=search&version=2.0&crs=EPSG:4326&size=10'
                 + '&page=1&type=district&format=json&errorformat=json&key=' + vWorldKey
                 + '&query=' + encodeURIComponent(query);
    vapi.execute(apiParam, function(data) {
        _handleLocalSearchResult(data, mode);
    }, function() {
        alert('지역 검색에 실패 하였습니다.');
    });
}

function _handleLocalSearchResult(data, mode) {
    if (!data || !data.response || data.response.status !== 'OK') {
        if (mode === 'WEB') alert('검색 결과가 없습니다.');
        return;
    }
    var item = data.response.result.items[0];
    if (!item) { if (mode === 'WEB') alert('검색 결과가 없습니다.'); return; }

    var bbox   = item.bbox;            // {minX, minY, maxX, maxY}  EPSG:4326 (lng, lat)
    var lat    = (parseFloat(bbox.minY) + parseFloat(bbox.maxY)) / 2;
    var lng    = (parseFloat(bbox.minX) + parseFloat(bbox.maxX)) / 2;
    var radius = L.latLng(parseFloat(bbox.minY), parseFloat(bbox.minX))
                  .distanceTo(L.latLng(parseFloat(bbox.maxY), parseFloat(bbox.maxX))) / 2;

    if (circleLayer) baseGround.removeLayer(circleLayer);
    circleLayer = L.circle([lat, lng], {
        radius  : radius,
        color   : '#3a7bd5',
        weight  : 2,
        opacity : 0.9,
        fillOpacity: 0.08
    }).addTo(baseGround);

    baseGround.fitBounds(circleLayer.getBounds());
    reDrawStatAndMarker();
}

/* ============================================================
 *  지도 레이어 전환 (기존 UI 버튼 연동)
 * ============================================================ */
var _currentBaseLayer = 'base';

function switchMapLayer(type) {
    if (type === 'base') {
        if (baseGround.hasLayer(satelLayer)) baseGround.removeLayer(satelLayer);
        if (baseGround.hasLayer(hybridLayer)) baseGround.removeLayer(hybridLayer);
        if (!baseGround.hasLayer(baseLayer)) baseGround.addLayer(baseLayer);
        _currentBaseLayer = 'base';
    } else if (type === 'satel') {
        if (baseGround.hasLayer(baseLayer)) baseGround.removeLayer(baseLayer);
        if (!baseGround.hasLayer(satelLayer)) baseGround.addLayer(satelLayer);
        if (!baseGround.hasLayer(hybridLayer)) baseGround.addLayer(hybridLayer);
        _currentBaseLayer = 'satel';
    }
}

/* ============================================================
 *  GPS (모바일)
 * ============================================================ */
var curX = '', curY = '', curUtX = '', curUtY = '', gpsInfo = '';
var Marker_user_position  = null;
var Marker_user_position2 = null;

function feat_chkVis(marker) { return marker && baseGround.hasLayer(marker); }

function successCallback(position) {
    try {
        gpsInfo = 'Y';
        curX = position.coords.latitude;
        curY = position.coords.longitude;
        baseGround.panTo([curX, curY]);
    } catch (ex) { console.log('GPS error: ' + ex.message); }
}
function errorCallback() { gpsInfo = ''; }

/* ============================================================
 *  Haversine 거리 계산 (레거시 호환)
 * ============================================================ */
function calcDistance(lat1, lon1, lat2, lon2) {
    var theta = lon1 - lon2;
    var dist  = Math.sin(deg2rad(lat1)) * Math.sin(deg2rad(lat2))
              + Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.cos(deg2rad(theta));
    dist = Math.acos(dist);
    dist = rad2deg(dist);
    dist = dist * 111.18957696;
    return Number(dist).toFixed(1);
}
function deg2rad(d) { return d * Math.PI / 180; }
function rad2deg(r) { return r * 180 / Math.PI; }

/* ============================================================
 *  주변 충전소 (모바일)
 * ============================================================ */
function getNearbyStationList(objParam) {
    var dl = $('<ul class="chargerList" id="nearbyStationList">').css('overflow', 'auto');
    $('.data-loading').show();
    xhr_post('Loc.do', objParam)
    .done(function(data) {
        $('.data-loading').hide();
        if (data.resultCd === '500') {
            $('#mobile_pop_nearby .yesResult').hide();
            $('#mobile_pop_nearby .noResult p').text(data.msg);
            $('#mobile_pop_nearby .noResult').show();
            return;
        }
        $.each(data.list, function(index, entry) {
            var theStation = m_mapStations.get(entry.STAT_ID);
            if (!theStation) return true;
            $(dl).append(createNearbyList(theStation, entry, 'onClickStationOfList'));
        });
        $('#mobile_pop_nearby .yesResult').empty('').append(dl);
        $(dl).children().slice(20).hide();
        if ($(dl).children().size() > 20)
            $('#mobile_pop_nearby .yesResult').append('<a href="#" class="btn_more">더보기 (20/' + $(dl).children().size() + ')</a>');
        $('#mobile_pop_nearby .noResult').hide();
        $('#mobile_pop_nearby .yesResult').show();
        $('#mobile_pop_nearby').css('display', 'flex');
        $('.dim').show();
    })
    .fail(function() {
        var msg = '주변충전소 검색 실패 하였습니다. 다시 시도 하겠습니까?';
        if (confirm(msg)) xhr_post('Loc.do', objParam);
    });
}

/* ============================================================
 *  북마크
 * ============================================================ */
function populateBookmarkList() {
    if (typeof _populateBookmarkList === 'function') { _populateBookmarkList(); return; }
    // placeholder – 기존 구현 의존
}
function populateBookmarkListMobile() {
    if (typeof _populateBookmarkListMobile === 'function') { _populateBookmarkListMobile(); return; }
}

/* ============================================================
 *  필터 동기화 (기존 UI 재사용)
 * ============================================================ */
function syncFilterOrg() {
    $('.filterOrg').prop('checked', true);
    $('.filterMng').prop('disabled', false).siblings('label').removeClass('chkdisabled');
    $('#chrgmngall').prop('checked', true);
    $('.filterMng').prop('checked', true);

    $('.typeChk .filterOrg').on('change', function() {
        $('#' + $(this).attr('id').replace('mobile_', '')).prop('checked', $(this).prop('checked')).change();
    });
}

function syncFilterType() {
    $('#chrgtypeall').prop('checked', false);
    $('#F_24HOUR1').prop('checked', false);
    $('#F_SMART_CHRGR1').prop('checked', false);
    $('.filterType').prop('checked', true);
    $('.filterTypeGroup').prop('checked', true);
    $('.filterTypeMobile').prop('checked', true);
    $('#mobile_F_24HOUR1_all').prop('checked', true).click();

    $('#mobile_chrgtype_group_1').on('change', function() {
        $('#mobile_pop_filter .chrgtype_group_1').prop('checked', $(this).is(':checked'));
    });
    $('#mobile_chrgtype_group_2').on('change', function() {
        $('#mobile_pop_filter .chrgtype_group_2').prop('checked', $(this).is(':checked'));
    });
    $('#mobile_pop_filter input[type=checkbox].filterTypeMobile').each(function() {
        $(this).on('change', function() {
            var g1ok = $('#mobile_pop_filter input[type=checkbox].chrgtype_group_1:checked').length === 3;
            var g2ok = $('#mobile_pop_filter input[type=checkbox].chrgtype_group_2:checked').length === 1;
            $('#mobile_chrgtype_group_1').prop('checked', g1ok);
            $('#mobile_chrgtype_group_2').prop('checked', g2ok);
        });
    });
}

function applyFilterType() {
    $('#mobile_pop_filter input[type=checkbox].filterTypeMobile').each(function() {
        $('#' + $(this).attr('id').replace('mobile_', '')).prop('checked', $(this).is(':checked')).change();
    });
    if ($('#mobile_F_24HOUR1_all').is(':checked')) $('#F_24HOUR1').prop('checked', false).change();
    else $('#F_24HOUR1').prop('checked', true).change();
    reDrawStatAndMarker();
}

/* ============================================================
 *  $(document).ready – 지도 완전 초기화
 * ============================================================ */
$(function() {
    /* 1. Leaflet 지도 생성 */
    initLeafletMap();

    /* 2. 마커 클러스터 그룹 */
    clusterGroup = L.markerClusterGroup({
        maxClusterRadius : 60,
        disableClusteringAtZoom: 16,
        spiderfyOnMaxZoom: true,
        showCoverageOnHover: false,
        chunkedLoading: false,
        animate: false,
        iconCreateFunction: function(cluster) {
            var count = cluster.getChildCount();
            var bracket = Math.floor(count / 200);
            var r = (bracket * 2) + 20; // 레거시 evMap.js와 동일한 크기 (단위 px)
            return L.divIcon({
                className: 'ev-cluster',
                html: '<div class="ev-cluster-inner" style="width:' + (r*2) + 'px;height:' + (r*2) + 'px;line-height:' + (r*2) + 'px;">' + count + '</div>',
                iconSize: [r*2, r*2]
            });
        }
    });
    clusterGroup.on('clusterclick', _onClusterClick);
    if (baseGround) {
        baseGround.addLayer(clusterGroup);
    }

    /* 3. 팝업 오버레이 (클러스터 리스트) */
    stationListOverlay = L.popup({ maxWidth: 320, minWidth: 150, autoPan: true, closeButton: true });

    /* 4. 지역 경계 GeoJSON 래퍼 레이어 추가 */
    var regionLayer    = createRegionLayer();
    var regionSigLayer = createRegionSigLayer();
    // regionLayer/regionSigLayer are hidden by default per user request
    // if (regionLayer)    regionLayer.addTo(baseGround);
    // if (regionSigLayer) regionSigLayer.addTo(baseGround);

    /* 5. 줌/이동 이벤트 처리 */
    baseGround.on('moveend', function() {
        // 지역명 검색(반경) 모드일 때만 이동 시 마커를 재계산함
        if ($('#F_SEARCH_TYPE1').val() === 'area') {
            reDrawStatAndMarker(false);
        }
    });
    
    baseGround.on('zoomend', function() {
        // 줌 변경 시에도 특정 조건에서만 갱신하거나, 리플렛 클러스터가 자동 처리하도록 맡김
        // 현재는 별도 처리 없이 유지 (깜빡임 방지)
    });

    /* 6. 검색 버튼 및 필터 이벤트 바인딩 */
    $('#BTN_FIND_BY_NAME').on('click', function() {
        // 검색하기 버튼은 리스트만 독립적으로 갱신 (지도 마커 재그리기 제외)
        $('#statList').trigger('ChangeFindData');
    });
    syncFilterOrg();
    syncFilterType();

    // 운영기관, 충전기타입 등 모든 필터 체크박스에 대한 통합 이벤트
    $(document).on('change', 'input[name=filterMng], input[name=filterType], .filterStat, .filterType, .filterTypeMobile, #chktrf, #F_SMART_CHRGR1, #F_24HOUR1', function() {
        console.log("[Filter Log] 필터 클릭 발생: " + $(this).attr('name') + " / " + $(this).val());
        reDrawStatAndMarker(false); // 필터 변경 시 지도의 마커만 즉시 갱신
    });
    $(document).on('change', '#orgme, #orgetc', function() {
        var isEtcChecked = $('#orgetc').is(':checked');
        $('.filterMng').not('#chrgmng00').prop('disabled', !isEtcChecked)
                       .siblings('label').toggleClass('chkdisabled', !isEtcChecked);
        if (isEtcChecked) {
            $('#chrgmngall, .filterMng').prop('checked', true);
        }
        initData();
    });

    /* 7. 지도 타입 토글 */
    $('input[name="mapType"]').on('change', function() {
        switchMapLayer($(this).val());
    });

    /* 8. 검색 탭 이벤트 (기존 구조 유지) */
    $(document).on('click', '.mapLeftWrap.ev .subPageTab li', function() {
        var idx = $(this).index();
        $('.mapLeftWrap.ev .subPageTab li').removeClass('on');
        $(this).addClass('on');
        $('.mapLeftWrap.ev .mapTab').removeClass('on');
        $('.mapLeftWrap.ev .mapTab').eq(idx).addClass('on');
        if (idx === 1) populateBookmarkList();
    });

    /* 9. 지역 선택 드롭다운 */
    $('#F_SI_DO1').on('change', function() {
        var val = $(this).val();
        $('#sido_change').text($(this).find('option:selected').text());
        // gugun은 기존 로직 연동
    });
    $('#F_GU_GUN1').on('change', function() {
        $('#sigungu_change').text($(this).find('option:selected').text());
    });

    /* 10. 검색 타입 전환 */
    $('#F_SEARCH_TYPE1').on('change', function() {
        var v = $(this).val();
        if (v === 'area') {
            $('#lblSearchName').hide();
            $('#lblSearchArea').show();
        } else {
            $('#lblSearchName').show();
            $('#lblSearchArea').hide();
        }
    });

    /* 11. statList 갱신 이벤트 */
    $('#statList').on('ChangeFindData', function() {
        var arrStation = parseMapLeftWrapEv();
        if (!arrStation || arrStation.length === 0) {
            $('#statList').html('<ul class="chargerList"><li class="force_justify_center">검색 결과가 없습니다.</li></ul>');
            return;
        }
        var dl = $('<ul class="chargerList">');
        var lCnt = 0;
        $.each(arrStation, function(i, sta) {
            $(dl).append(TagStatList(sta, 'onClickStationOfList'));
            if (lCnt++ > 500) { $(dl).append('<li class="force_justify_center">이하 생략...</li>'); return false; }
        });
        $('#statList').html('').append(dl);
    });

    /* 12. 데이터 초기 로드 */
    initData();
});
