importScripts('supercluster.min.js');
importScripts('pako.min.js');

var m_stations = [];
var m_stationMap = {};
var superclusterIndex = null;

// 17개 시도 중심점 하드코딩 좌표 (Lat, Lon)
const SIDO_COORDS = {
    "11": { x: 37.5665, y: 126.9780 }, // 서울
    "26": { x: 35.1796, y: 129.0756 }, // 부산
    "27": { x: 35.8714, y: 128.6014 }, // 대구
    "28": { x: 37.4563, y: 126.7052 }, // 인천
    "29": { x: 35.1595, y: 126.8526 }, // 광주
    "30": { x: 36.3504, y: 127.3845 }, // 대전
    "31": { x: 35.5384, y: 129.3114 }, // 울산
    "36": { x: 36.4800, y: 127.2890 }, // 세종
    "41": { x: 37.2752, y: 127.0095 }, // 경기
    "42": { x: 37.8854, y: 127.7298 }, // 강원
    "51": { x: 37.8854, y: 127.7298 }, // 강원특별자치도
    "43": { x: 36.6353, y: 127.4912 }, // 충북
    "44": { x: 36.6588, y: 126.6728 }, // 충남
    "45": { x: 35.8205, y: 127.1088 }, // 전북
    "52": { x: 35.8205, y: 127.1088 }, // 전북특별자치도
    "46": { x: 34.8160, y: 126.4629 }, // 전남
    "47": { x: 36.5760, y: 128.5056 }, // 경북
    "48": { x: 35.2376, y: 128.6919 }, // 경남
    "50": { x: 33.4890, y: 126.4983 }  // 제주
};

var m_sidoStats = {};    // 2자리(시도) 집계
var m_sigunguStats = {}; // 5자리(시군구) 집계

// Replicate Map class for compatibility if needed, or use native Map/Object
// The original code used a custom Map function. We can use native JS Map or Object.
// We'll stick to simple Arrays/Objects for the worker data storage to keep it fast.

// --- Class Definitions from evMap1.js (Simplified for Worker) ---

var Charger = function (sid, cid, ctp, cst, tst, smt, fem, fen, po, lm) {
    this.sid = sid; this.cid = cid; this.ctp = ctp; this.cst = cst; this.tst = tst; this.smt = smt;
    this.fem = fem; this.fen = fen; this.po = po; this.lm = lm;
    // this.updateStat = function (nStat, tStat) { this.cst = nStat; this.tst = tStat; }; // Not needed in worker
};

// EvMapMarker.powerBand 와 동일 경계 복제(워커는 모듈 import 불가)
function workerPowerBand(po) {
    var kw = parseInt(po, 10) || 0;
    if (kw < 30) return 'slow';
    if (kw < 50) return 'mid';
    if (kw < 100) return 'fast';
    if (kw < 200) return 'fastplus';
    return 'ultra';
}

// 급속/완속 2택 셀렉트 값을 workerPowerBand() 5밴드에 매핑: 완속=slow만, 급속=slow 제외 전부(mid/fast/fastplus/ultra)
function workerBandMatchesFilter(po, filterBand) {
    if (!filterBand) return true;
    var band = workerPowerBand(po);
    return filterBand === 'slow' ? band === 'slow' : band !== 'slow';
}

// EvMapMarker.normalizeStat 와 동일 규칙 복제(워커는 모듈 import 불가) — 사업자 강제상태 우선, 이용제한(lm='Y')은 available 제외
var WORKER_DEFAULT_STAT = { '17': '3', '18': '3', '27': '3', '125': '3', '60': '3' };
function workerNormalizeStat(cst, lm, cm) {
    var code = (cm != null && WORKER_DEFAULT_STAT[cm + '']) ? WORKER_DEFAULT_STAT[cm + ''] : (cst == null ? '' : cst + '');
    if (code === '' || code === '0' || code === '8' || code === '9') return 'unknown';
    if (code === '1' || code === '4' || code === '5') return 'unavailable';
    if (code === '3') return 'charging';
    if (code === '2') return lm === 'Y' ? 'limited' : 'available';
    return 'unknown';
}

// EvMapMarker.statOrder 와 동일 우선순위 복제 — 대표 상태(repState) 산출에 사용
var WORKER_STAT_ORDER = { available: 8, charging: 7, limited: 6, unavailable: 5, unknown: 0 };

var Station = function (sid, snm, x, y, hol, park, utime, ctp, chgeMange, skindt, zscode, limit, power, trf, smt, fl) {
    this.smt = (smt == "Y" ? "Y" : "N");
    this.trf = trf;
    this.sid = sid;
    this.snm = snm;
    this.x = parseFloat(x);
    this.y = parseFloat(y);
    // Pre-calculate Web Mercator here to save time on main thread? 
    // Supercluster expects [lon, lat]. OpenLayers Render expects Web Mercator.
    // We will return GeoJSON with Web Mercator coordinates preferably, or LonLat and let OL transform (VectorImage is fast).
    // Let's stick to LonLat for Supercluster.

    this.hol = hol;
    this.stat = "";
    // park: 원본 PARKING_FREE (0=무료, 1=유료), 그 외 값은 미표시
    this.park = park;
    this.utime = utime;
    this.skindt = skindt;
    this.ctp = ctp;
    this.chgeMange = (chgeMange == null || chgeMange == '') ? '00' : chgeMange;
    this.zcode = (zscode + "").substring(0, 2);
    this.zscode = zscode + "";
    this.fl = fl;

    this.chargers = {}; // Object instead of custom Map

    // 충전소 단위 집계(요금 정렬·밴드별 대수·상태별 대수·대표상태) — 소비 시점에 계산
    // rawAvailableCnt 는 cst=='2' 단순 집계로 마커 available 속성 전용(정규화 상태 집계와 별개)
    this.computeAggregates = function () {
        var minFee = null, maxPower = 0, availableCnt = 0, chargingCnt = 0, totalCnt = 0, rawAvailableCnt = 0, limitedCnt = 0;
        var bands = { slow: 0, mid: 0, fast: 0, fastplus: 0, ultra: 0 };
        var repState = null;
        for (var cid in this.chargers) {
            var c = this.chargers[cid];
            totalCnt++;
            if (c.cst == '2') rawAvailableCnt++;
            if (c.lm === 'Y') limitedCnt++;
            var cState = workerNormalizeStat(c.cst, c.lm, this.chgeMange);
            if (cState === 'available') availableCnt++;
            else if (cState === 'charging') chargingCnt++;
            if (!repState || WORKER_STAT_ORDER[cState] > WORKER_STAT_ORDER[repState]) repState = cState;
            if (c.fem !== null && c.fem !== undefined && c.fem !== '' && !isNaN(c.fem)) {
                if (minFee === null || c.fem < minFee) minFee = c.fem;
            }
            var p = parseFloat(c.po) || 0;
            if (p > maxPower) maxPower = p;
            bands[workerPowerBand(c.po)]++;
        }
        this.minFee = minFee;
        this.bands = bands;
        this.rawAvailableCnt = rawAvailableCnt;
        this.availableCnt = availableCnt;
        this.chargingCnt = chargingCnt;
        this.etcCnt = totalCnt - availableCnt - chargingCnt;
        this.totalCnt = totalCnt;
        this.maxPower = maxPower;
        this.repState = repState || 'unknown';
        // 이용제한: 전 충전기 제한이면 폐쇄형(Y), 일부면 P, 없으면 개방형(N)
        this.limitYn = (limitedCnt === 0) ? 'N' : (limitedCnt === totalCnt ? 'Y' : 'P');
    };

    this.setMode = function (limit, power, ctp) {
        this.limit = (this.limit > limit) ? limit : this.limit;
        this.power = (this.power > power) ? this.power : power;
        this.mode = (limit == "Y" ? '_l' : '') + (power >= 350 ? '_p2' : '') + (power >= 200 && power < 350 ? '_p1' : '') + (power >= 100 && power < 200 ? '_p0' : '');
    };

    // filterBand: 급속/완속 2택 셀렉트 값 — workerBandMatchesFilter()로 5밴드에 매핑해 판정(미지정 시 기존 동작과 동일)
    this.setStat = function (filterType, filterMng, filterTrf, filterSmrt, filterBand) {
        var nStat = "";
        var allStat = "";

        // Check Chargers
        for (var cid in this.chargers) {
            var cChgr = this.chargers[cid];
            allStat = (this.getStatOrder(allStat) >= this.getStatOrder(cChgr.cst)) ? allStat : cChgr.cst;

            if (this.isContainExcept(filterMng, this.chgeMange)) continue;
            if (this.isContainExcept(filterType, cChgr.ctp)) continue;
            if (this.isContainExcept(filterTrf, this.trf)) continue;
            if (this.isContainExcept(filterSmrt, this.smt)) continue;
            if (!workerBandMatchesFilter(cChgr.po, filterBand)) continue;

            nStat = (this.getStatOrder(nStat) >= this.getStatOrder(cChgr.cst)) ? nStat : cChgr.cst;
        }

        if (this.stat == nStat) {
            return false;
        } else {
            this.stat = nStat;
            return true; // Status changed
        }
    };

    this.isContainExcept = function (filterArry, stat) {
        if (typeof filterArry == "undefined" || filterArry == null || !filterArry.length) return false;
        return filterArry.includes(stat);
    };

    this.getStatOrder = function (stat) {
        if (stat == "2") return "8";
        if (stat == "3") return "7";
        if (stat == "5") return "6";
        if (stat == "1") return "5";
        if (stat == "8") return "4";
        if (stat == "9") return "3";
        if (stat == "4") return "2";
        if (stat == "7") return "1";
        return "0";
    };
};

// --- Worker Logic ---

// zcode/zscode/statType 는 스칼라(단일 문자열)와 배열(전기 다중선택) 을 모두 받는다 — 하위호환
// 값이 없으면(빈 문자열·빈 배열·null) 전건 통과, 배열이면 포함 여부, 스칼라면 기존대로 equality
function hasFilterVal(v) {
    return Array.isArray(v) ? v.length > 0 : (v != null && v !== '');
}
function matchesFilterVal(v, target) {
    if (!hasFilterVal(v)) return true;
    if (Array.isArray(v)) return v.indexOf(target) !== -1;
    return v === target;
}

// 목록/지도 공통 충전소 필터 판정 — 두 경로가 같은 술어를 쓰게 한다(미지정 시 전건 통과)
function passesFilters(st, filters) {
    filters = filters || {};
    if (filters.orgme === 'N' && st.chgeMange === '00') return false;
    if (filters.orgetc === 'N' && st.chgeMange !== '00') return false;
    if (filters.search) {
        var cleanQuery = String(filters.search).replace(/\s+/g, "").toLowerCase();
        var stationName = String(st.snm == null ? '' : st.snm).replace(/\s+/g, "").toLowerCase();
        if (stationName.indexOf(cleanQuery) === -1) return false;
    }
    // zscode(시군구) 가 지정되면 zcode(시도) 는 무시 — 기존 우선순위 유지
    if (hasFilterVal(filters.zscode)) {
        if (!matchesFilterVal(filters.zscode, st.zscode)) return false;
    } else if (hasFilterVal(filters.zcode)) {
        if (!matchesFilterVal(filters.zcode, st.zcode)) return false;
    }
    if (hasFilterVal(filters.statType) && !matchesFilterVal(filters.statType, st.skindt)) return false;
    // 충전기 타입(chgerType) — 선택 타입 충전기를 하나라도 보유한 충전소만 통과(include, 배열). 전체(빈배열)면 무시.
    if (filters.chgerType && filters.chgerType.length) {
        var hit = false;
        for (var cid in st.chargers) { if (filters.chgerType.indexOf(st.chargers[cid].ctp) >= 0) { hit = true; break; } }
        if (!hit) return false;
    }
    if (filters.is24 && st.utime != "24시간 이용가능") return false;
    if (filters.isSmart && st.smt != "Y") return false;
    // 즐겨찾기만 보기 — bookmarkMap 은 { STAT_ID: 1 } 형태로 전달된다
    if (filters.bookmarkOnly && !(filters.bookmarkMap && filters.bookmarkMap[st.sid])) return false;
    return true;
}

self.onmessage = function (e) {
    var data = e.data;

    try {
        switch (data.type) {
            case 'loadData':
                loadData(data.files, data.clear !== false);
                break;
            case 'updateMapView':
                updateMapView(data.filters, data.bbox, data.zoom);
                break;
            case 'requestSidebarList':
                requestSidebarList(data.filters);
                break;
            case 'requestSidebarRadiusList':
                requestSidebarRadiusList(data.filters);
                break;
            case 'loadStats':
                loadStats(data.url);
                break;
            case 'getClusters':
                getClusters(data.bbox, data.zoom);
                break;
            case 'getClusterExtent':
                getClusterExtent(data.clusterId);
                break;
            case 'requestBookmarkList':
                requestBookmarkList(data.bookmarkIds, data.target);
                break;
        }
    } catch (err) {
        console.error("Worker onmessage Global Error:", err);
        self.postMessage({ type: 'error', message: 'Global: ' + err.toString() });
    }
};

// Utility function to convert Base64 to ArrayBuffer
function base64ToArrayBuffer(base64) {
    var binaryString = self.atob(base64);
    var bytes = new Uint8Array(binaryString.length);
    for (var i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}

function decompressGzipData(gzipData) {
    if (typeof pako !== 'undefined') {
        var uint8Array = new Uint8Array(gzipData);
        return pako.ungzip(uint8Array, { to: 'string' });
    } else {
        throw new Error('Pako is not loaded in Worker.');
    }
}

// Haversine Distance (km)
function haversineDistance(lat1, lon1, lat2, lon2) {
    var R = 6371; // km
    var dLat = (lat2 - lat1) * Math.PI / 180;
    var dLon = (lon2 - lon1) * Math.PI / 180;
    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

async function loadData(files, clear) {
    if (clear) {
        m_stations = [];
        m_stationMap = {};
    }
    var totalLoaded = 0;

    try {
        const fetchPromises = files.map(async (url) => {
            try {
                const response = await fetch(url);
                if (!response.ok) throw new Error('Network response(' + response.status + ') was not ok for ' + url);

                const textStr = await response.text();
                const trimmedText = textStr.trim();
                

                // 패턴 매칭 방식을 더 유연하게 변경 (H4sI가 포함되어 있고, JSON 시작 문자가 아님)
                const isGzip = (trimmedText.includes('H4sI') && !trimmedText.startsWith('{') && !trimmedText.startsWith('[')) || url.includes('enzip=Y');

                let jsonString = textStr;
                if (isGzip) {
                    try {
                        const cleanBase64 = trimmedText.replace(/^"/, '').replace(/"$/, '').trim();
                        const arrayBuffer = base64ToArrayBuffer(cleanBase64);
                        jsonString = decompressGzipData(arrayBuffer);
                    } catch (e) {
                        console.error("Worker Decompression Fail: " + url, e);
                        throw new Error('Decompression failed for ' + url + ': ' + e.message);
                    }
                }
                
                try {
                    return JSON.parse(jsonString);
                } catch (e) {
                    // Log a snippet of the string to help debugging
                    console.error("JSON Parse Error Snippet:", jsonString.substring(0, 100));
                    throw new Error('JSON parse failed for ' + url + ': ' + e.message);
                }
            } catch (e) {
                console.error("Fetch/Process Error for " + url, e);
                throw e; // Re-throw to be caught by Promise.all
            }
        });

        const results = await Promise.all(fetchPromises);

        // Process Data
        // Use a temporary map to merge duplicates by SID (or use existing if clear is false)
        let stationMap = m_stationMap;

        results.forEach(data => {
            if (data.chargerList) {
                data.chargerList.forEach(item => {
                    let st = stationMap[item.sid];
                    if (!st) {
                        st = new Station(
                            item.sid, item.snm, item.x, item.y,
                            item.hol, item.p, item.ut, item.ctp,
                            item.cm || '00', item.st || "", item.zs, item.lm, item.po,
                            item.trf, item.smt, item.fl
                        );
                        stationMap[item.sid] = st;
                    }

                    var chgr = new Charger(item.sid, item.cid, item.ctp, item.cst, item.tst, item.smt, item.fem, item.fen, item.po, item.lm);
                    st.chargers[item.cid] = chgr;

                    // Update existing logic
                    if (stationMap[item.sid]) {
                        st.setMode(item.lm, item.po, item.ctp);
                        if (item.cm && item.cm !== '00') {
                            st.chgeMange = item.cm;
                        }
                    }
                });
            }
        });

        // Convert map to array for indexing
        m_stationMap = stationMap;
        m_stations = Object.values(stationMap);

        // 데이터 로드 완료 후 즉시 인덱스 빌드 (줌 상태 유지)
        rebuildIndex(lastZoom);
        
        self.postMessage({ type: 'dataLoaded', count: m_stations.length });

    } catch (err) {
        console.error("Worker Load Error:", err);
        self.postMessage({ type: 'error', message: err.toString() });
    }
}

async function loadStats(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) return;

        const textStr = await response.text();
        if (!textStr) return;

        const trimmedText = textStr.trim();
        const isGzip = (trimmedText.includes('H4sI') && !trimmedText.startsWith('{') && !trimmedText.startsWith('[')) || url.includes('enzip=Y');

        let jsonString = textStr;
        if (isGzip) {
            try {
                const cleanBase64 = trimmedText.replace(/^"/, '').replace(/"$/, '').trim();
                const arrayBuffer = base64ToArrayBuffer(cleanBase64);
                jsonString = decompressGzipData(arrayBuffer);
            } catch (e) {
                console.error("loadStats Decompression Error:", e);
                return;
            }
        }
        
        let jsonData;
        try {
            jsonData = JSON.parse(jsonString);
        } catch (e) {
            console.error("loadStats JSON Parse Error for " + url, e);
            return;
        }

        if (jsonData) {
            let chgList = jsonData.chargerList || jsonData;
            if (Array.isArray(chgList)) {
                chgList.forEach(item => {
                    const st = m_stationMap[item.sid];
                    if (st && st.chargers && st.chargers[item.cid]) {
                        st.chargers[item.cid].cst = item.cst;
                        st.chargers[item.cid].tst = item.tst;
                    }
                });
            }
        }
        
        // 상태 업데이트 후 인덱스(마커 색상 등) 반영을 위해 리빌드 (줌 상태 유지)
        rebuildIndex(lastZoom);
        
        self.postMessage({ type: 'statsUpdated' });
    } catch (e) {
        console.error("Worker loadStats Error: ", e);
    }
}

// Global States
var mapFilters = {};
var lastZoom = -1;

function updateMapView(filters, bbox, zoom) {
    var intZoom = Math.floor(zoom);
    var filtersChanged = JSON.stringify(filters) !== JSON.stringify(mapFilters);
    var zoomChanged = (intZoom !== lastZoom);
    
    mapFilters = filters;
    lastZoom = intZoom;

    // 필터 변경 또는 인덱스 미생성/데이터 변경 시에만 리빌드 (Supercluster가 줌별 클러스터링 자동 처리)
    if (filtersChanged || !superclusterIndex || m_stations.length !== superclusterIndex.m_indexedCount) {
        rebuildIndex(intZoom);
    }
    getClusters(bbox, zoom);
}

function requestSidebarList(filters) {
    var results = [];
    for (var i = 0; i < m_stations.length; i++) {
        var st = m_stations[i];

        if (!passesFilters(st, filters)) continue;

        st.setStat(filters.type, filters.mng, filters.trf, filters.smrt, filters.band);

        if (st.stat !== "") {
            st.computeAggregates();
            results.push({
                sid: st.sid,
                snm: st.snm,
                x: st.x,
                y: st.y,
                utime: st.utime,
                park: st.park,
                limitYn: st.limitYn,
                chgeMange: st.chgeMange,
                stat: st.stat,
                mode: st.mode,
                zcode: st.zcode,
                zscode: st.zscode,
                ctp: st.ctp,
                limit: st.limit,
                fl: st.fl,
                skindt: st.skindt,
                minFee: st.minFee,
                bands: st.bands,
                availableCnt: st.availableCnt,
                chargingCnt: st.chargingCnt,
                etcCnt: st.etcCnt,
                totalCnt: st.totalCnt,
                maxPower: st.maxPower,
                repState: st.repState
            });
        }
    }

    // 필터 통과 전건을 그대로 보낸다 — 정렬·절단은 렌더(EvMapList)에서만 한다
    self.postMessage({
        type: 'filterResults',
        count: results.length,
        stations: results,
        target: filters.target || 'desktop'
    });
}

function requestSidebarRadiusList(filters) {
    var results = [];
    var centerX = parseFloat(filters.x); // Lon from VWorld
    var centerY = parseFloat(filters.y); // Lat from VWorld
    var radiusKm = filters.radius || 3;

    for (var i = 0; i < m_stations.length; i++) {
        var st = m_stations[i];
        
        // st.x: Lat, st.y: Lon
        var dist = haversineDistance(centerY, centerX, st.x, st.y);

        if (dist > radiusKm) continue;

        // 기타 필터 적용
        st.setStat(filters.type, filters.mng, filters.trf, filters.smrt);
        if (st.stat !== "") {
            results.push({
                sid: st.sid, snm: st.snm, x: st.x, y: st.y,
                utime: st.utime, chgeMange: st.chgeMange, stat: st.stat,
                mode: st.mode, zcode: st.zcode, zscode: st.zscode,
                ctp: st.ctp, limit: st.limit
            });
        }
    }

    self.postMessage({ 
        type: 'radiusResults', 
        count: results.length, 
        stations: results,
        target: filters.target || 'desktop'
    });
}

function requestBookmarkList(bookmarkIds, target) {
    var results = [];
    if (bookmarkIds && bookmarkIds.length > 0) {
        for (var i = 0; i < bookmarkIds.length; i++) {
            var sid = bookmarkIds[i];
            var st = m_stationMap[sid];
            if (st) {
                // 즐겨찾기 목록은 일반 필터링(제외 필터)을 적용하지 않고 모든 상태를 표시함
                st.setStat([], [], [], []); 
                results.push({
                    sid: st.sid, snm: st.snm, x: st.x, y: st.y,
                    utime: st.utime, chgeMange: st.chgeMange, stat: st.stat,
                    mode: st.mode, zcode: st.zcode, zscode: st.zscode,
                    // TagStatList 연동을 위해 누락된 필드 추가
                    ctp: st.ctp, limit: st.limit
                });
            }
        }
    }
    self.postMessage({ type: 'bookmarkResults', stations: results, target: target });
}

function rebuildIndex(zoom) {
    // 1. Filter Points & Aggregate Admin Stats
    var filteredPoints = [];
    m_sidoStats = {};
    m_sigunguStats = {};

    for (var i = 0; i < m_stations.length; i++) {
        var st = m_stations[i];

        // 목록과 동일한 술어를 먼저 적용해 지도 마커가 검색폼 필터를 그대로 따르게 한다
        if (!passesFilters(st, mapFilters)) continue;

        // Status Logic (Mutates st.stat)
        st.setStat(mapFilters.type, mapFilters.mng, mapFilters.trf, mapFilters.smrt, mapFilters.band);

        if (st.stat != "") {
            const z2 = st.zcode;
            const z5 = st.zscode.substring(0, 5);

            // 1. 시도 집계 (하드코딩 좌표 사용)
            if (!m_sidoStats[z2]) {
                const fixed = SIDO_COORDS[z2] || { x: st.x, y: st.y };
                m_sidoStats[z2] = { count: 0, avgX: fixed.x, avgY: fixed.y };
            }
            m_sidoStats[z2].count++;

            // 2. 시군구 집계 (데이터 평균 좌표 사용 예정)
            if (!m_sigunguStats[z5]) m_sigunguStats[z5] = { count: 0, x: 0, y: 0 };
            m_sigunguStats[z5].count++;
            m_sigunguStats[z5].x += st.x;
            m_sigunguStats[z5].y += st.y;

            // 팝업용 available/total 은 computeAggregates 가 같은 순회에서 함께 낸다
            st.computeAggregates();

            // Create GeoJSON Feature for Supercluster
            filteredPoints.push({
                type: 'Feature',
                properties: {
                    sid: st.sid,
                    snm: st.snm,
                    utime: st.utime,
                    chgeMange: st.chgeMange,
                    stat: st.stat,
                    mode: st.mode,
                    repState: st.repState,
                    available: st.rawAvailableCnt,
                    total: st.totalCnt,
                    maxPower: st.maxPower,
                    minFee: st.minFee
                },
                geometry: {
                    type: 'Point',
                    coordinates: [st.y, st.x] // Supercluster uses [Lon, Lat]
                }
            });
        }
    }

    // 시군구 중심점(평균값) 최종 계산
    Object.keys(m_sigunguStats).forEach(key => {
        m_sigunguStats[key].avgX = m_sigunguStats[key].x / m_sigunguStats[key].count;
        m_sigunguStats[key].avgY = m_sigunguStats[key].y / m_sigunguStats[key].count;
    });

    // 2. Create Supercluster (고정 반경 — Supercluster는 줌별 클러스터링을 내부적으로 처리)
    superclusterIndex = new Supercluster({
        log: false,
        radius: 220,
        extent: 512,
        maxZoom: 16
    });
    superclusterIndex.load(filteredPoints);
    superclusterIndex.m_indexedCount = m_stations.length;
}

function getClusters(bbox, zoom) {
    if (!superclusterIndex) return;

    var intZoom = Math.round(zoom);
    if (intZoom > 18) intZoom = 18;

    if (zoom < 9) {
        // [시도 단위] 화면 영역 내 데이터만 필터링
        var clusters = Object.keys(m_sidoStats)
            .filter(code => {
                var s = m_sidoStats[code];
                return s.avgY >= bbox[0] && s.avgX >= bbox[1] && s.avgY <= bbox[2] && s.avgX <= bbox[3];
            })
            .map(code => ({
                type: 'Feature',
                properties: { cluster: true, point_count: m_sidoStats[code].count },
                geometry: { type: 'Point', coordinates: [m_sidoStats[code].avgY, m_sidoStats[code].avgX] }
            }));
        self.postMessage({ type: 'clustersUpdated', clusters: clusters });
    } else if (zoom >= 9 && zoom < 10.5) {
        // [시군구 단위] 화면 영역 내 데이터만 필터링
        var clusters = Object.keys(m_sigunguStats)
            .filter(code => {
                var s = m_sigunguStats[code];
                return s.avgY >= bbox[0] && s.avgX >= bbox[1] && s.avgY <= bbox[2] && s.avgX <= bbox[3];
            })
            .map(code => ({
                type: 'Feature',
                properties: { cluster: true, point_count: m_sigunguStats[code].count },
                geometry: { type: 'Point', coordinates: [m_sigunguStats[code].avgY, m_sigunguStats[code].avgX] }
            }));
        self.postMessage({ type: 'clustersUpdated', clusters: clusters });
    } else if (zoom >= 16) {
        // [클러스터링 강제 해제] 줌 16 이상이면 영역 내 모든 마커를 개별로 반환 (속성 동기화)
        var features = [];
        for (var i = 0; i < m_stations.length; i++) {
            var st = m_stations[i];
            if (st.stat != "" && passesFilters(st, mapFilters) && st.y >= bbox[0] && st.x >= bbox[1] && st.y <= bbox[2] && st.x <= bbox[3]) {
                st.computeAggregates();
                features.push({
                    type: 'Feature',
                    properties: {
                        sid: st.sid,
                        snm: st.snm,
                        chgeMange: st.chgeMange,
                        stat: st.stat,
                        mode: st.mode,
                        repState: st.repState,
                        available: st.rawAvailableCnt,
                        total: st.totalCnt,
                        maxPower: st.maxPower,
                        minFee: st.minFee
                    },
                    geometry: { type: 'Point', coordinates: [st.y, st.x] }
                });
            }
        }
        self.postMessage({ type: 'clustersUpdated', clusters: features });
    } else {
        // [거리 기반] Supercluster 동작 (줌 10.5 ~ 14.9)
        var clusters = superclusterIndex.getClusters(bbox, intZoom);

        self.postMessage({ type: 'clustersUpdated', clusters: clusters });
    }
}

function getClusterExtent(clusterId) {
    var leaves = superclusterIndex.getLeaves(clusterId, Infinity);
    var minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    
    for (var i = 0; i < leaves.length; i++) {
        var coord = leaves[i].geometry.coordinates;
        if (coord[0] < minX) minX = coord[0];
        if (coord[1] < minY) minY = coord[1];
        if (coord[0] > maxX) maxX = coord[0];
        if (coord[1] > maxY) maxY = coord[1];
    }
    
    self.postMessage({
        type: 'clusterExtentResult',
        extent: [minX, minY, maxX, maxY]
    });
}
