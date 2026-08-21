/**
 * AI 챗 SSE 응답 렌더 공통 — 토큰 누적·차트 이벤트 수집 후 완료 시 Markdown·ECharts 렌더
 */
'use strict';

window.AiChatRender = (function () {

	// Markdown·차트 등 렌더가 필요한 문법 감지 — 감지되면 스트림 중 원문 대신 대기 문구만 표시
	var RICH_PATTERN = /(^|\n)[ \t]{0,3}(#{1,6}[ \t]|[-*+][ \t]|\d+\.[ \t]|>[ \t]?|\|)|```|\[[^\]]*\]\([^)]*\)|!\[|<[A-Za-z][^>]*>|\*\*|__|~~|\{[\s]*"/;
	var WAIT_TEXT = '답변 작성 중';

	function getMd(el) {
		return el.getAttribute('data-md') || '';
	}

	function configure(opts) {
		if (window.AiChatMd) {
			window.AiChatMd.configure(opts);
		}
	}

	/** 렌더 대상 문법 감지 시 감지 지점 앞 평문만 남기고 이후 원문은 완료까지 숨김 */
	function markDeferred(el, md) {
		if (el.getAttribute('data-deferred') === '1') {
			return;
		}
		el.setAttribute('data-deferred', '1');
		el.removeAttribute('data-loading');
		var match = RICH_PATTERN.exec(md || '');
		var prefix = match ? md.slice(0, match.index).replace(/\s+$/, '') : '';
		el.textContent = prefix || WAIT_TEXT;
	}

	/** 스트림 중 평문만 실시간 표시, 원문은 data-md 에 보관. 비평문 감지 시 대기 표시로 전환 */
	function appendToken(el, piece) {
		if (!el || !piece) {
			return;
		}
		var md = getMd(el) + piece;
		el.setAttribute('data-md', md);
		if (el.getAttribute('data-deferred') === '1') {
			return;
		}
		if (RICH_PATTERN.test(md)) {
			markDeferred(el, md);
			return;
		}
		if (el.getAttribute('data-loading') === '1') {
			el.removeAttribute('data-loading');
		}
		el.textContent = md;
	}

	/** message/chart 이벤트에서 차트 설정을 추출해 본문에 삽입. 처리 여부 반환 */
	function appendChart(el, event) {
		var config = extractChartConfig(event);
		if (!el || !config) {
			return false;
		}
		var md = getMd(el) + '\n\n' + JSON.stringify(config) + '\n\n';
		el.setAttribute('data-md', md);
		markDeferred(el, md);
		return true;
	}

	/** content.type=loading 프레임이면 안내 문구만 반환 */
	function extractLoadingText(event) {
		if (!event || event.type !== 'message') {
			return null;
		}
		var content = event.content;
		if (content && typeof content === 'object' && content.type === 'loading') {
			return typeof content.content === 'string' ? content.content : '';
		}
		return null;
	}

	/** loading 안내는 본문(data-md)에 넣지 않고 완료 전까지만 임시 표시. deferred 중엔 평문 유지 */
	function showLoading(el, text) {
		if (!el || el.getAttribute('data-deferred') === '1') {
			return;
		}
		el.setAttribute('data-loading', '1');
		el.textContent = text || WAIT_TEXT;
	}

	/** message/chart 이벤트 공통 처리 — 차트는 본문 삽입, loading 은 content 만 표시. 처리 여부 반환 */
	function appendMessage(el, event) {
		if (appendChart(el, event)) {
			return true;
		}
		var loadingText = extractLoadingText(event);
		if (loadingText !== null) {
			showLoading(el, loadingText);
			return true;
		}
		return false;
	}

	function extractChartConfig(event) {
		if (!event || !window.AiChatMd) {
			return null;
		}
		if (event.type === 'message') {
			return window.AiChatMd.parseSseChartMessage(event);
		}
		if (event.type === 'chart') {
			var content = event.content;
			if (content && typeof content === 'object') {
				if (window.AiChatMd.isHighchartsConfig(content)) {
					return content;
				}
				return window.AiChatMd.parseSseChartMessage({ type: 'message', content: content });
			}
			if (typeof content === 'string') {
				return window.AiChatMd.tryParseChart(content);
			}
		}
		return null;
	}

	/** 스트림 종료 시 누적 원문을 Markdown 렌더 후 차트 초기화 */
	function finalize(el) {
		if (!el || !window.AiChatMd) {
			return;
		}
		var source = getMd(el);
		if (!source) {
			if (el.getAttribute('data-deferred') === '1' || el.getAttribute('data-loading') === '1') {
				el.removeAttribute('data-deferred');
				el.removeAttribute('data-loading');
				el.textContent = '';
			}
			return;
		}
		el.removeAttribute('data-loading');
		el.removeAttribute('data-deferred');
		el.classList.add('ai-chat-rendered');
		el.innerHTML = window.AiChatMd.render(source);
		initCharts(el);
	}

	/** chatType 별 대화 스레드 컨테이너 — 없으면 생성 */
	function getThread(container, type) {
		if (!container) {
			return null;
		}
		var el = container.querySelector('.chat__thread[data-chat-thread="' + type + '"]');
		if (!el) {
			el = document.createElement('div');
			el.className = 'chat__thread';
			el.setAttribute('data-chat-thread', type);
			container.appendChild(el);
		}
		return el;
	}

	/** 해당 chatType 스레드만 표시, 나머지 숨김. 표시된 스레드 반환 */
	function showThread(container, type) {
		var active = getThread(container, type);
		if (!active) {
			return null;
		}
		var all = container.querySelectorAll('.chat__thread');
		Array.prototype.forEach.call(all, function (el) {
			el.style.display = (el === active) ? '' : 'none';
		});
		resizeChartsIn(active);
		return active;
	}

	function calcChartSize(el) {
		var width = el.clientWidth || (el.parentElement ? el.parentElement.clientWidth : 0) || 320;
		width = Math.max(220, width);
		var height = Math.max(200, Math.min(Math.round(width * 0.62), 360));
		return { width: width, height: height };
	}

	function initCharts(root) {
		if (!window.echarts || !window.AiChatMd) {
			return;
		}
		var els = root.querySelectorAll('.chatbot-chart[data-chart]');
		Array.prototype.forEach.call(els, function (el) {
			if (el.getAttribute('data-chart-init') === '1') {
				return;
			}
			try {
				var hc = JSON.parse(el.getAttribute('data-chart'));
				var options = window.AiChatMd.convertHighchartsToEcharts(hc);
				if (!options) {
					return;
				}
				var size = calcChartSize(el);
				el.style.height = size.height + 'px';
				var chart = window.echarts.init(el, null, { width: size.width, height: size.height });
				chart.setOption(options);
				el.echartsChart = chart;
				el.chartConfig = hc;
				el.setAttribute('data-chart-init', '1');
				appendChartTools(el, hc);
			} catch (e) {
				// 차트 파싱 실패 시 본문만 유지
			}
		});
	}

	/** 차트 아래 CSV·이미지 저장 버튼 삽입 — exporting.enabled=false 면 생략 */
	function appendChartTools(el, hc) {
		if (!el.parentNode || (hc.exporting && hc.exporting.enabled === false)) {
			return;
		}
		var tools = document.createElement('div');
		tools.className = 'chatbot-chart-tools';
		tools.innerHTML = '<button type="button" class="button button--xsmall button--secondary" data-chart-action="csv" title="CSV 저장">'
			+ '<span class="button__label">CSV</span></button>'
			+ '<button type="button" class="button button--xsmall button--secondary" data-chart-action="image" title="이미지 저장">'
			+ '<span class="button__label">이미지</span></button>';
		el.parentNode.insertBefore(tools, el.nextSibling);
		tools.addEventListener('click', function (e) {
			var btn = findActionButton(e.target, tools);
			if (!btn) {
				return;
			}
			e.preventDefault();
			if (btn.getAttribute('data-chart-action') === 'csv') {
				downloadChartCsv(el);
			} else {
				downloadChartImage(el);
			}
		});
	}

	function findActionButton(node, root) {
		while (node && node !== root) {
			if (node.getAttribute && node.getAttribute('data-chart-action')) {
				return node;
			}
			node = node.parentNode;
		}
		return null;
	}

	/** 파일명용 제목 정리 — 경로·특수문자 제거 후 날짜 접미 */
	function chartFileName(hc, ext) {
		var title = hc && hc.title && hc.title.text ? String(hc.title.text) : '';
		var name = title.replace(/[\\/:*?"<>|,;]/g, '').replace(/\s+/g, '_').slice(0, 60);
		var now = new Date();
		var stamp = now.getFullYear()
			+ ('0' + (now.getMonth() + 1)).slice(-2)
			+ ('0' + now.getDate()).slice(-2);
		return (name || 'chart') + '_' + stamp + '.' + ext;
	}

	function csvCell(value) {
		var s = (value === null || value === undefined) ? '' : String(value);
		return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
	}

	/** Highcharts 원본 설정 → 카테고리 행 · 시리즈 열 CSV */
	function buildChartCsv(hc) {
		var categories = (hc.xAxis && Array.isArray(hc.xAxis.categories)) ? hc.xAxis.categories : [];
		var series = Array.isArray(hc.series) ? hc.series : [];
		var axisName = (hc.xAxis && hc.xAxis.title && hc.xAxis.title.text) ? hc.xAxis.title.text : '구분';
		var rows = [[axisName].concat(series.map(function (s) { return s.name; }))];
		categories.forEach(function (category, i) {
			rows.push([category].concat(series.map(function (s) {
				return Array.isArray(s.data) && s.data[i] !== undefined ? s.data[i] : '';
			})));
		});
		return rows.map(function (row) {
			return row.map(csvCell).join(',');
		}).join('\r\n');
	}

	function downloadBlob(blob, filename) {
		if (window.navigator && window.navigator.msSaveOrOpenBlob) {
			window.navigator.msSaveOrOpenBlob(blob, filename);
			return;
		}
		var url = window.URL.createObjectURL(blob);
		var link = document.createElement('a');
		link.href = url;
		link.download = filename;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		setTimeout(function () {
			window.URL.revokeObjectURL(url);
		}, 0);
	}

	function downloadChartCsv(el) {
		var hc = el.chartConfig;
		if (!hc) {
			return;
		}
		// 엑셀 한글 깨짐 방지용 BOM
		var blob = new Blob(['\ufeff' + buildChartCsv(hc)], { type: 'text/csv;charset=utf-8;' });
		downloadBlob(blob, chartFileName(hc, 'csv'));
	}

	function dataUrlToBlob(dataUrl) {
		var parts = dataUrl.split(',');
		var mime = (parts[0].match(/:(.*?);/) || [])[1] || 'image/png';
		var binary = window.atob(parts[1]);
		var bytes = new Uint8Array(binary.length);
		var i;
		for (i = 0; i < binary.length; i++) {
			bytes[i] = binary.charCodeAt(i);
		}
		return new Blob([bytes], { type: mime });
	}

	function downloadChartImage(el) {
		if (!el.echartsChart) {
			return;
		}
		var dataUrl = el.echartsChart.getDataURL({ type: 'png', pixelRatio: 2, backgroundColor: '#fff' });
		downloadBlob(dataUrlToBlob(dataUrl), chartFileName(el.chartConfig, 'png'));
	}

	function resizeChartsIn(root) {
		if (!root) {
			return;
		}
		var els = root.querySelectorAll('.chatbot-chart[data-chart-init="1"]');
		Array.prototype.forEach.call(els, function (el) {
			if (!el.echartsChart) {
				return;
			}
			var size = calcChartSize(el);
			el.style.height = size.height + 'px';
			el.echartsChart.resize({ width: size.width, height: size.height });
		});
	}

	var reflowRaf = null;
	window.addEventListener('resize', function () {
		if (reflowRaf) {
			return;
		}
		reflowRaf = requestAnimationFrame(function () {
			reflowRaf = null;
			resizeChartsIn(document);
		});
	});

	return {
		configure: configure,
		appendToken: appendToken,
		appendChart: appendChart,
		appendMessage: appendMessage,
		finalize: finalize,
		getThread: getThread,
		showThread: showThread
	};
})();
