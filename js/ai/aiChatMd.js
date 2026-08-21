/**
 * AI 챗 경량 Markdown 렌더러 — 표·아코디언·링크 렌더, 응답 내 Highcharts JSON → ECharts 옵션 변환
 */
'use strict';

window.AiChatMd = (function () {
  var BLOCK_RE = /^<(h[1-3]|ul|ol|blockquote|hr|table|details|pre|div)/;
  var apiOrigin = '';

  function configure(opts) {
    if (opts && opts.apiOrigin) {
      apiOrigin = String(opts.apiOrigin).replace(/\/$/, '');
    }
  }

  /** https 절대 URL 또는 apiOrigin + /경로 상대경로만 허용 */
  function resolveHref(href) {
    href = decodeEscEntities(String(href || '')).trim();
    if (!href || /^javascript:/i.test(href)) {
      return null;
    }
    if (/^https?:\/\//i.test(href)) {
      return href;
    }
    if (href.charAt(0) === '/' && href.charAt(1) !== '/' && apiOrigin) {
      return apiOrigin + href;
    }
    return null;
  }

  function esc(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function escAttr(s) {
    return esc(s).replace(/"/g, '&quot;');
  }

  function isTableLine(line) {
    return /^\s*\|.+\|\s*$/.test(line);
  }

  function isTableDivider(line) {
    return /^\s*\|(?:\s*:?-{3,}:?\s*\|)+\s*$/.test(line);
  }

  function splitTableRow(line) {
    return line.trim().slice(1, -1).split('|').map(function (cell) {
      return cell.trim();
    });
  }

  function renderTables(text) {
    var lines = text.split('\n');
    var out = [];
    var i = 0;
    while (i < lines.length) {
      if (i + 1 < lines.length && isTableLine(lines[i]) && isTableDivider(lines[i + 1])) {
        var headers = splitTableRow(lines[i]);
        var table = ['<table><thead><tr>'];
        headers.forEach(function (cell) { table.push('<th>' + cell + '</th>'); });
        table.push('</tr></thead><tbody>');
        i += 2;
        while (i < lines.length && isTableLine(lines[i])) {
          var cols = splitTableRow(lines[i]);
          table.push('<tr>');
          headers.forEach(function (_, idx) {
            table.push('<td>' + (cols[idx] || '') + '</td>');
          });
          table.push('</tr>');
          i++;
        }
        table.push('</tbody></table>');
        out.push(table.join(''));
        continue;
      }
      out.push(lines[i]);
      i++;
    }
    return out.join('\n');
  }

  function buildImageTag(src, alt) {
    src = String(src || '').replace(/&amp;/g, '&');
    alt = String(alt || '').replace(/&amp;/g, '&');
    if (/^\s*javascript:/i.test(src)) return '';
    return '<img class="md-image" src="' + escAttr(src) + '" alt="' + escAttr(alt) + '">';
  }

  function renderImages(text) {
    var out = text;
    out = out.replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)/g, function (_, alt, src) {
      return buildImageTag(src, alt);
    });
    out = out.replace(/&lt;img\s+([\s\S]*?)&gt;/gi, function (_, attrs) {
      var srcMatch = attrs.match(/src=&quot;([^"]+)&quot;/i);
      if (!srcMatch || !srcMatch[1]) return '';
      var altMatch = attrs.match(/alt=&quot;([^"]*)&quot;/i);
      return buildImageTag(srcMatch[1], altMatch ? altMatch[1] : '');
    });
    return out;
  }

  function isHighchartsConfig(obj) {
    if (!obj || typeof obj !== 'object') return false;
    if (!obj.chart || typeof obj.chart !== 'object' || typeof obj.chart.type !== 'string') return false;
    if (!obj.title || typeof obj.title !== 'object' || typeof obj.title.text !== 'string') return false;
    if (!obj.xAxis || typeof obj.xAxis !== 'object' || !Array.isArray(obj.xAxis.categories)) return false;
    if (!obj.yAxis || typeof obj.yAxis !== 'object' || !obj.yAxis.title || typeof obj.yAxis.title.text !== 'string') {
      return false;
    }
    if (!Array.isArray(obj.series) || !obj.series.length) return false;
    var i;
    for (i = 0; i < obj.series.length; i++) {
      var s = obj.series[i];
      if (!s || typeof s.name !== 'string' || !Array.isArray(s.data)) return false;
      var j;
      for (j = 0; j < s.data.length; j++) {
        if (typeof s.data[j] !== 'number') return false;
      }
    }
    return true;
  }

  function stripTrailingCommas(s) {
    return String(s || '').replace(/,(\s*[}\]])/g, '$1');
  }

  /** 외부 `{}` 없이 `"chart": ...` 속성만 나열된 JSON 조각 보정 */
  function normalizeChartJson(raw) {
    var s = stripTrailingCommas(String(raw || '').trim());
    if (!s) return s;
    if (s.charAt(0) === '{') return s;
    if (/^"chart"\s*:/.test(s)) {
      return '{' + s.replace(/,\s*$/, '') + '}';
    }
    return s;
  }

  function tryParseChart(raw) {
    try {
      var obj = JSON.parse(normalizeChartJson(raw));
      return isHighchartsConfig(obj) ? obj : null;
    } catch (e) {
      return null;
    }
  }

  function buildChartPlaceholder(config) {
    return '<div class="chatbot-chart" data-chart="' + escAttr(JSON.stringify(config)) + '"></div>';
  }

  /** SSE type=message, content.type=chart (content.content: JSON 문자열) */
  function parseSseChartMessage(obj) {
    if (!obj || obj.type !== 'message' || !obj.content || typeof obj.content !== 'object') return null;
    var inner = obj.content;
    if (inner.type !== 'chart') return null;
    if (typeof inner.content === 'string') return tryParseChart(inner.content);
    if (inner.content && typeof inner.content === 'object' && isHighchartsConfig(inner.content)) {
      return inner.content;
    }
    return null;
  }

  function isChartFenceLang(lang) {
    var l = String(lang || '').trim().toLowerCase();
    return !l || l === 'json' || l === 'chart' || l === 'highcharts';
  }

  function extractBalancedBlock(text, start) {
    if (!text || text.charAt(start) !== '{') return null;
    var depth = 0;
    var inStr = false;
    var escaped = false;
    var i;
    for (i = start; i < text.length; i++) {
      var c = text.charAt(i);
      if (escaped) {
        escaped = false;
        continue;
      }
      if (c === '\\' && inStr) {
        escaped = true;
        continue;
      }
      if (c === '"') {
        inStr = !inStr;
        continue;
      }
      if (!inStr) {
        if (c === '{') depth++;
        else if (c === '}') {
          depth--;
          if (depth === 0) {
            return { raw: text.slice(start, i + 1), end: i + 1 };
          }
        }
      }
    }
    return null;
  }

  function regionsOverlap(a, b) {
    return !(a.end <= b.start || a.start >= b.end);
  }

  function dedupeChartRegions(regions) {
    var sorted = regions.slice().sort(function (a, b) {
      return a.start - b.start || (b.end - b.start) - (a.end - a.start);
    });
    var out = [];
    sorted.forEach(function (r) {
      var hit = null;
      var i;
      for (i = 0; i < out.length; i++) {
        if (regionsOverlap(out[i], r)) {
          hit = out[i];
          break;
        }
      }
      if (!hit) {
        out.push(r);
        return;
      }
      if ((r.end - r.start) > (hit.end - hit.start)) {
        out[i] = r;
      }
    });
    return out;
  }

  function scanObjectCharts(text) {
    var regions = [];
    var i = 0;
    while (i < text.length) {
      if (text.charAt(i) !== '{') {
        i++;
        continue;
      }
      var block = extractBalancedBlock(text, i);
      if (!block) {
        i++;
        continue;
      }
      var chart = tryParseChart(block.raw);
      if (chart) {
        regions.push({ start: i, end: block.end, config: chart });
        i = block.end;
      } else {
        i++;
      }
    }
    return regions;
  }

  function scanPropertyCharts(text) {
    var regions = [];
    var re = /"chart"\s*:/g;
    var m;
    while ((m = re.exec(text)) !== null) {
      var start = m.index;
      var lastGood = null;
      var end;
      for (end = start + 1; end <= text.length; end++) {
        var chart = tryParseChart(text.slice(start, end));
        if (chart) lastGood = { end: end, config: chart };
      }
      if (lastGood) {
        regions.push({ start: start, end: lastGood.end, config: lastGood.config });
        re.lastIndex = lastGood.end;
      }
    }
    return regions;
  }

  function applyChartRegions(text, regions) {
    var out = text;
    var i;
    regions.sort(function (a, b) { return b.start - a.start; });
    for (i = 0; i < regions.length; i++) {
      var r = regions[i];
      out = out.slice(0, r.start) + buildChartPlaceholder(r.config) + out.slice(r.end);
    }
    return out;
  }

  /** 응답 본문 어디에 있든 스키마 일치 JSON을 차트로 치환 */
  function replaceChartsAnywhere(text) {
    var regions = dedupeChartRegions(scanObjectCharts(text).concat(scanPropertyCharts(text)));
    if (!regions.length) return text;
    return applyChartRegions(text, regions);
  }

  function stripChartRegions(text, regions) {
    var out = text;
    var i;
    regions.sort(function (a, b) { return b.start - a.start; });
    for (i = 0; i < regions.length; i++) {
      var r = regions[i];
      out = out.slice(0, r.start) + out.slice(r.end);
    }
    return out;
  }

  function stripFencedCharts(text) {
    return text.replace(/```([^\n]*)\n([\s\S]*?)```/g, function (full, lang, code) {
      if (!isChartFenceLang(lang)) return full;
      return tryParseChart(code) ? '' : full;
    });
  }

  /** 클립보드 복사용 — Highcharts JSON·차트 펜스 제거 후 본문만 반환 */
  function stripChartsFromMd(md) {
    if (!md) return '';
    var h = stripFencedCharts(md);
    var regions = dedupeChartRegions(scanObjectCharts(h).concat(scanPropertyCharts(h)));
    h = stripChartRegions(h, regions);
    return h.replace(/\n{3,}/g, '\n\n').trim();
  }

  function renderFencedCharts(text) {
    return text.replace(/```([^\n]*)\n([\s\S]*?)```/g, function (full, lang, code) {
      if (!isChartFenceLang(lang)) return full;
      var chart = tryParseChart(code);
      return chart ? buildChartPlaceholder(chart) : full;
    });
  }

  function renderFencedCode(text) {
    return text.replace(/```([^\n]*)\n([\s\S]*?)```/g, function (_, lang, code) {
      return '<pre><code>' + code + '</code></pre>';
    });
  }

  function renderChartBlocks(text) {
    var h = renderFencedCharts(text);
    h = replaceChartsAnywhere(h);
    h = renderFencedCode(h);
    return h;
  }

  function applyInlineMd(text) {
    var h = text;
    h = h.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    h = h.replace(/\*(.+?)\*/g, '<em>$1</em>');
    h = h.replace(/`([^`]+)`/g, '<code>$1</code>');
    return h;
  }

  function decodeEscEntities(s) {
    return String(s || '')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"');
  }

  function stripHtmlTags(s) {
    return String(s || '')
      .replace(/<[^>]+>/g, '')
      .replace(/&lt;[^&]*?&gt;/g, '');
  }

  function sanitizeAnchor(href, innerText) {
    var resolved = resolveHref(href);
    if (!resolved) {
      return esc(stripHtmlTags(innerText));
    }
    var text = stripHtmlTags(decodeEscEntities(innerText)).trim();
    if (!text) text = resolved;
    return '<a href="' + escAttr(resolved) + '" target="_blank" rel="noopener noreferrer">' + applyInlineMd(esc(text)) + '</a>';
  }

  function renderEscapedAnchors(text) {
    return text.replace(
      /&lt;a\s+[\s\S]*?href="([^"]*)"[\s\S]*?&gt;([\s\S]*?)&lt;\/a&gt;/gi,
      function (_, href, inner) {
        return sanitizeAnchor(href, inner);
      }
    );
  }

  /** 자동 링크에 딸려온 짝 없는 닫는 괄호·끝 문장부호·escape 엔티티를 링크 밖으로 분리 */
  function trimUrlTail(url) {
    var rest = '';
    var depth = 0;
    for (var i = 0; i < url.length; i++) {
      var ch = url.charAt(i);
      if (ch === '(') {
        depth++;
      } else if (ch === ')') {
        if (depth === 0) {
          rest = url.slice(i);
          url = url.slice(0, i);
          break;
        }
        depth--;
      }
    }
    var prev;
    do {
      prev = url;
      url = url.replace(/(&quot;|&#39;|&gt;|&amp;)$/, function (entity) {
        rest = entity + rest;
        return '';
      });
      url = url.replace(/[.,;:!?'"\]}]$/, function (tailChar) {
        rest = tailChar + rest;
        return '';
      });
    } while (url !== prev);
    return { url: url, rest: rest };
  }

  function applyMdRules(h) {
    h = h.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, function (_, label, url) {
      var resolved = resolveHref(url);
      if (!resolved) {
        return esc(label);
      }
      return '<a href="' + escAttr(resolved) + '" target="_blank" rel="noopener noreferrer">' + esc(label) + '</a>';
    });
    h = h.replace(/(^|[\s(])(https?:\/\/[^\s<]+)/gm, function (matched, lead, url) {
      var tail = trimUrlTail(url);
      if (!tail.url) {
        return matched;
      }
      return lead + '<a href="' + tail.url + '" target="_blank" rel="noopener noreferrer">' + tail.url + '</a>' + tail.rest;
    });
    h = h.replace(/`([^`]+)`/g, '<code>$1</code>');
    h = h.replace(/^### (.+)$/gm, '<h3>$1</h3>');
    h = h.replace(/^## (.+)$/gm, '<h2>$1</h2>');
    h = h.replace(/^# (.+)$/gm, '<h1>$1</h1>');
    h = h.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    h = h.replace(/\*(.+?)\*/g, '<em>$1</em>');
    h = h.replace(/^&gt; (.+)$/gm, '<blockquote>$1</blockquote>');
    h = h.replace(/^---$/gm, '<hr>');
    h = h.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');
    h = h.replace(/^- (.+)$/gm, '<li>$1</li>');
    h = h.replace(/(<li>[\s\S]*?<\/li>\n?)+/g, function (m) { return '<ul>' + m + '</ul>'; });
    h = h.split(/\n\n+/).map(function (block) {
      if (BLOCK_RE.test(block.trim())) return block;
      var lines = block.split('\n').filter(function (l) { return l.trim(); });
      if (!lines.length) return '';
      return '<p>' + lines.join('<br>') + '</p>';
    }).join('\n');
    return h;
  }

  function renderBodyMd(body) {
    var h = renderTables(body);
    h = renderImages(h);
    h = renderEscapedAnchors(h);
    return applyMdRules(h);
  }

  function renderDetails(text) {
    return text.replace(/&lt;details(?:\s[^&]*?)?&gt;\s*([\s\S]*?)\s*&lt;\/details&gt;/gi, function (_, inner) {
      var sm = inner.match(/^\s*&lt;summary(?:\s[^&]*?)?&gt;([\s\S]*?)&lt;\/summary&gt;\s*/i);
      if (!sm) return '&lt;details&gt;' + inner + '&lt;/details&gt;';
      var summaryHtml = applyInlineMd(esc(stripHtmlTags(sm[1])));
      var body = inner.slice(sm[0].length);
      var bodyHtml = renderBodyMd(body.trim());
      return '<details class="chatbot-accordion"><summary>' + summaryHtml + '</summary>' + bodyHtml + '</details>';
    });
  }

  /** 클립보드 복사용 — HTML 태그를 읽기 쉬운 텍스트로 변환 */
  function htmlToPlainText(md) {
    if (!md) return '';
    var s = String(md);
    s = s.replace(/<a\s+[^>]*href\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi, function (_, href, text) {
      var label = text.replace(/<[^>]+>/g, '').trim();
      return (label || href) + ' (' + href + ')';
    });
    s = s.replace(/<details[^>]*>[\s\S]*?<summary[^>]*>[\s\S]*?<\/summary>([\s\S]*?)<\/details>/gi, function (_, body) {
      return '\n' + body.trim() + '\n';
    });
    s = s.replace(/<[^>]+>/g, '');
    return s.replace(/\n{3,}/g, '\n\n').trim();
  }

  function render(md) {
    var h = esc(md);
    h = renderChartBlocks(h);
    h = renderTables(h);
    h = renderImages(h);
    h = renderEscapedAnchors(h);
    h = renderDetails(h);
    h = applyMdRules(h);
    return h;
  }

  function mapHighchartsChartType(type) {
    var t = String(type || 'column').toLowerCase();
    if (t === 'column') return { type: 'bar', horizontal: false, donut: false };
    if (t === 'bar') return { type: 'bar', horizontal: true, donut: false };
    if (t === 'line') return { type: 'line', horizontal: false, donut: false };
    if (t === 'area') return { type: 'area', horizontal: false, donut: false };
    if (t === 'pie') return { type: 'pie', horizontal: false, donut: false };
    if (t === 'donut') return { type: 'pie', horizontal: false, donut: true };
    return { type: 'bar', horizontal: false, donut: false };
  }

  /** Highcharts JSON → ECharts options (통계 대시보드 팔레트·축 스타일 준용, data-chart 원본은 그대로 유지) */
  function convertHighchartsToEcharts(hc) {
    if (!hc || typeof hc !== 'object') return null;
    var mapped = mapHighchartsChartType(hc.chart && hc.chart.type);
    var categories = hc.xAxis && Array.isArray(hc.xAxis.categories) ? hc.xAxis.categories : [];
    var yTitle = hc.yAxis && hc.yAxis.title && hc.yAxis.title.text ? hc.yAxis.title.text : '';
    var seriesSrc = (hc.series || []).map(function (s) {
      return { name: s.name, data: s.data };
    });
    var showLegend = seriesSrc.length > 1;
    var options = {
      color: ['#1BA877', '#5D87FF', '#FF7452', '#7ACA93', '#258045', '#5CBE7D', '#C5E7CF'],
      textStyle: { fontFamily: 'ONEMobile, sans-serif' },
      title: {
        text: hc.title && hc.title.text ? hc.title.text : undefined,
        left: 'center',
        textStyle: { fontSize: 14, fontWeight: 600 }
      },
      legend: { show: showLegend, bottom: 0, textStyle: { color: '#747E90' } }
    };

    if (mapped.type === 'pie') {
      var pieData = categories.map(function (name, i) {
        return { name: name, value: seriesSrc.length && Array.isArray(seriesSrc[0].data) ? seriesSrc[0].data[i] : 0 };
      });
      options.tooltip = { trigger: 'item', textStyle: { fontFamily: 'ONEMobile' } };
      options.legend = { show: true, bottom: 0, textStyle: { color: '#747E90' } };
      options.series = [{
        type: 'pie',
        name: seriesSrc.length ? seriesSrc[0].name : '',
        radius: mapped.donut ? ['40%', '65%'] : '65%',
        center: ['50%', '52%'],
        data: pieData,
        label: { show: false },
        emphasis: { label: { show: true } }
      }];
      return options;
    }

    var categoryAxis = {
      type: 'category',
      data: categories,
      axisTick: { alignWithLabel: true },
      axisLine: { lineStyle: { color: '#DAE0E9' } },
      axisLabel: { color: '#747E90', fontFamily: 'ONEMobile' }
    };
    var valueAxis = {
      type: 'value',
      name: yTitle || undefined,
      axisLine: { lineStyle: { color: '#DAE0E9' } },
      axisLabel: { color: '#747E90', fontFamily: 'ONEMobile' },
      splitLine: { lineStyle: { color: '#DAE0E9' } }
    };
    options.tooltip = {
      trigger: 'axis',
      axisPointer: { type: mapped.type === 'bar' ? 'shadow' : 'line' },
      textStyle: { fontFamily: 'ONEMobile' }
    };
    options.grid = { left: 12, right: 16, top: 40, bottom: showLegend ? 32 : 8, containLabel: true };
    options.xAxis = mapped.horizontal ? valueAxis : categoryAxis;
    options.yAxis = mapped.horizontal ? categoryAxis : valueAxis;
    options.series = seriesSrc.map(function (s) {
      var item = { name: s.name, type: mapped.type === 'area' ? 'line' : mapped.type, data: s.data };
      if (mapped.type === 'bar') {
        item.barMaxWidth = 30;
        item.itemStyle = { borderRadius: mapped.horizontal ? [0, 8, 8, 0] : [8, 8, 0, 0] };
      }
      if (mapped.type === 'line') { item.symbolSize = 8; }
      if (mapped.type === 'area') { item.areaStyle = {}; item.symbolSize = 8; }
      return item;
    });
    return options;
  }

  return {
    configure: configure,
    resolveHref: resolveHref,
    render: render,
    isHighchartsConfig: isHighchartsConfig,
    tryParseChart: tryParseChart,
    buildChartPlaceholder: buildChartPlaceholder,
    parseSseChartMessage: parseSseChartMessage,
    stripChartsFromMd: stripChartsFromMd,
    htmlToPlainText: htmlToPlainText,
    convertHighchartsToEcharts: convertHighchartsToEcharts
  };
})();
