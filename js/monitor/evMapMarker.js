var EvMapMarker = (function () {
	// 실시간 상태 미제공 사업자 — 사용중으로 고정
	var DEFAULT_STAT = { '17': '3', '18': '3', '27': '3', '125': '3', '60': '3' };

	var STAT_ORDER = { available: 8, charging: 7, limited: 6, unavailable: 5, unknown: 0 };

	var STAT_COLOR = {
		available: '#1BA877',
		charging: '#5D87FF',
		unavailable: '#F85950',
		unknown: '#FCA42D',
		limited: '#747E90'
	};

	var BAND_COLOR = {
		slow: '#7ACA93',
		mid: '#00D0FF',
		fast: '#0660E7',
		fastplus: '#FFB813',
		ultra: '#F85950'
	};

	function normalizeStat(cst, lm, cm) {
		var code = (cm != null && DEFAULT_STAT[cm + '']) ? DEFAULT_STAT[cm + ''] : (cst == null ? '' : cst + '');

		if (code === '' || code === '0' || code === '8' || code === '9') return 'unknown';
		if (code === '1' || code === '4' || code === '5') return 'unavailable';
		if (code === '3') return 'charging';
		if (code === '2') return lm === 'Y' ? 'limited' : 'available';
		return 'unknown';
	}

	function statOrder(state) {
		return STAT_ORDER[state] || 0;
	}

	function powerBand(po) {
		var kw = parseInt(po, 10) || 0;
		if (kw < 30) return 'slow';
		if (kw < 50) return 'mid';
		if (kw < 100) return 'fast';
		if (kw < 200) return 'fastplus';
		return 'ultra';
	}

	function svgPin(statColor, bandColor) {
		return '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="37" viewBox="0 0 32 37">'
			+ '<path d="M1.68055 14.5121C1.68037 14.5122 1.68005 14.5121 1.68005 14.5119'
			+ 'C1.68045 6.56406 8.34627 0.16762 16.4158 0.578769C23.7587 0.953183 29.655 7.14046 29.68 14.4639'
			+ 'C29.6989 19.8447 26.655 24.5224 22.1835 26.8623C19.6162 28.206 17.5005 30.2668 16.3031 32.8976'
			+ 'L16.0499 33.4548C15.9063 33.7716 15.4547 33.7716 15.3111 33.4548L15.0569 32.8956'
			+ 'C13.8635 30.2747 11.7638 28.209 9.20446 26.8762C4.73208 24.5474 1.68132 19.8839 1.68105 14.5123'
			+ 'C1.68105 14.512 1.68074 14.5119 1.68055 14.5121Z"'
			+ ' fill="' + statColor + '" fill-opacity="0.85"'
			+ ' stroke="' + statColor + '" stroke-width="0.559998"/>'
			+ '<circle cx="15.6801" cy="14.5599" r="9.79997" fill="white"/>'
			+ '<path d="M14.894 15.9855H10.2148L18.7689 6.71997L16.4659 13.1344H21.1451'
			+ 'L12.591 22.3999L14.8933 15.9855H14.894Z" fill="' + bandColor + '"/>'
			+ '</svg>';
	}

	var styleCache = {};

	// 반환값은 상태|밴드 조합별로 공유되므로 호출부에서 변형 금지
	function iconStyle(state, band) {
		var key = state + '|' + band;
		if (styleCache[key]) return styleCache[key];

		var svg = svgPin(STAT_COLOR[state] || STAT_COLOR.unknown, BAND_COLOR[band] || BAND_COLOR.slow);
		styleCache[key] = new ol.style.Style({
			image: new ol.style.Icon({
				src: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg),
				anchor: [0.5, 1],
				scale: 1
			})
		});
		return styleCache[key];
	}

	return {
		normalizeStat: normalizeStat,
		statOrder: statOrder,
		powerBand: powerBand,
		iconStyle: iconStyle,
		STAT_COLOR: STAT_COLOR,
		BAND_COLOR: BAND_COLOR
	};
})();
