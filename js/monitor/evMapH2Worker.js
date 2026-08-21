importScripts('supercluster.min.js');

var m_stations = [];
var m_stationMap = {};

// OPER_STTUS_CD/POS_STTUS_CD -> EvMapMarker 5상태(available/limited/unavailable/unknown), 순서대로 판정
function computeRepState(oper, pos) {
	if (oper === '30' && pos === '0') return 'available';
	if (pos === '3') return 'limited';
	if (oper === '10' || oper === '20') return 'unavailable';
	if (pos === '1' || pos === '2' || pos === '9') return 'unavailable';
	return 'unknown';
}

// '9,800원' -> 9800, '무료' -> 0(getApiStationList 가 NTSL_PC=0/빈값을 '무료' 문자열로 내려줌), 그 외 파싱 불가/빈값 -> null
function parseFeeNum(fee) {
	if (fee === null || fee === undefined) return null;
	if (fee === '무료') return 0;
	var digits = String(fee).replace(/[^0-9]/g, '');
	return digits === '' ? null : parseInt(digits, 10);
}

function buildStation(item) {
	var st = {
		sid: item.sid, snm: item.snm, cst: item.cst, cstnm: item.cstnm,
		pos: item.pos, posnm: item.posnm, adr: item.adr,
		x: parseFloat(item.x), y: parseFloat(item.y),
		zscode: item.zscode, zcode: item.zcode, fee: item.fee, call: item.call,
		ctpcd: item.ctpcd, ctpnm: item.ctpnm, vkcd: item.vkcd, vknm: item.vknm,
		ut: item.ut
	};
	st.repState = computeRepState(st.cst, st.pos);
	st.feeNum = parseFeeNum(st.fee);
	return st;
}

function stationToPlain(st) {
	return {
		sid: st.sid, snm: st.snm, cst: st.cst, cstnm: st.cstnm,
		pos: st.pos, posnm: st.posnm, adr: st.adr, x: st.x, y: st.y,
		zscode: st.zscode, zcode: st.zcode, fee: st.fee, call: st.call,
		ctpcd: st.ctpcd, ctpnm: st.ctpnm, vkcd: st.vkcd, vknm: st.vknm,
		ut: st.ut, repState: st.repState, feeNum: st.feeNum
	};
}

function stationToFeature(st) {
	return {
		type: 'Feature',
		properties: { sid: st.sid, repState: st.repState },
		geometry: { type: 'Point', coordinates: [st.y, st.x] } // x=위도, y=경도
	};
}

function passesFilters(st, filters) {
	filters = filters || {};
	if (filters.zcode && st.zcode !== filters.zcode) return false;
	if (filters.zscode && st.zscode !== filters.zscode) return false;
	if (filters.oper && st.cst !== filters.oper) return false;
	if (filters.ctp && st.ctpcd !== filters.ctp) return false;
	if (filters.vk && st.vkcd !== filters.vk) return false;
	// 즐겨찾기만 보기 — bookmarkMap 은 { STAT_ID: 1 } 형태로 전달된다
	if (filters.bookmarkOnly && !(filters.bookmarkMap && filters.bookmarkMap[st.sid])) return false;
	if (filters.search) {
		var q = String(filters.search).toLowerCase();
		var name = (st.snm || '').toLowerCase();
		var addr = (st.adr || '').toLowerCase();
		if (name.indexOf(q) === -1 && addr.indexOf(q) === -1) return false;
	}
	return true;
}

self.onmessage = function (e) {
	var data = e.data;
	try {
		switch (data.type) {
			case 'loadData': loadData(data.files, data.clear); break;
			case 'loadStats': loadStats(data.url); break;
			case 'updateMapView': updateMapView(data.filters, data.bbox, data.zoom); break;
			case 'requestSidebarList': requestSidebarList(data.filters); break;
			case 'requestBookmarkList': requestBookmarkList(data.bookmarkIds, data.target); break;
		}
	} catch (err) {
		self.postMessage({ type: 'error', message: 'Global: ' + err.toString() });
	}
};

async function loadData(files, clear) {
	try {
		if (clear !== false) { m_stations = []; m_stationMap = {}; }

		var response = await fetch(files);
		if (!response.ok) throw new Error('Network response(' + response.status + ') was not ok for ' + files);
		var data = await response.json();
		var list = (data && data.chargerList) || [];

		list.forEach(function (item) {
			var st = buildStation(item);
			m_stationMap[st.sid] = st;
		});
		m_stations = Object.keys(m_stationMap).map(function (k) { return m_stationMap[k]; });

		self.postMessage({ type: 'dataLoaded', count: m_stations.length });
	} catch (err) {
		self.postMessage({ type: 'error', message: err.toString() });
	}
}

async function loadStats(url) {
	try {
		var response = await fetch(url);
		if (!response.ok) throw new Error('Network response(' + response.status + ') was not ok for ' + url);
		var data = await response.json();
		var list = (data && data.chargerStatList) || [];

		list.forEach(function (item) {
			var st = m_stationMap[item.sid];
			if (!st) return;
			st.cst = String(item.cst);
			st.cstnm = item.cstnm;
			st.pos = String(item.pos);
			st.posnm = item.posnm;
			st.repState = computeRepState(st.cst, st.pos);
		});

		self.postMessage({ type: 'statsUpdated' });
	} catch (err) {
		self.postMessage({ type: 'error', message: err.toString() });
	}
}

function updateMapView(filters, bbox, zoom) {
	try {
		var features = [];
		for (var i = 0; i < m_stations.length; i++) {
			var st = m_stations[i];
			if (passesFilters(st, filters)) features.push(stationToFeature(st));
		}

		var index = new Supercluster({ radius: 60, maxZoom: 16, extent: 256 });
		index.load(features);
		var clusters = index.getClusters(bbox, Math.round(zoom));

		self.postMessage({ type: 'clustersUpdated', clusters: clusters });
	} catch (err) {
		self.postMessage({ type: 'error', message: err.toString() });
	}
}

function requestSidebarList(filters) {
	try {
		var results = [];
		for (var i = 0; i < m_stations.length; i++) {
			var st = m_stations[i];
			if (passesFilters(st, filters)) results.push(stationToPlain(st));
		}
		self.postMessage({ type: 'filterResults', stations: results });
	} catch (err) {
		self.postMessage({ type: 'error', message: err.toString() });
	}
}

function requestBookmarkList(bookmarkIds, target) {
	try {
		var results = [];
		(bookmarkIds || []).forEach(function (sid) {
			var st = m_stationMap[sid];
			if (st) results.push(stationToPlain(st));
		});
		self.postMessage({ type: 'bookmarkResults', stations: results, target: target });
	} catch (err) {
		self.postMessage({ type: 'error', message: err.toString() });
	}
}
