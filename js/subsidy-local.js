/* subsidy-local.js — 지자체별 차종·모델 보조금 (지자체 아코디언형)
   ──────────────────────────────────────────────────────────────
   대민이 "지자체별 차량의 보조금"을 보러 오는 페이지. 보여줄 값 5종:
     국비 / 지방비(도비+시비) / 소계(=국비+지방비) / 전환지원금 국비 / 전환지원금 지방비
   · 소계는 전환지원금을 포함하지 않음(전환은 노후경유차 폐차·전환 시에만, 택시 포함 → 조건부 옵트인 별도 컬럼).
   · 국비는 전국 공통(지자체 무관 동일값). 지방비만 지자체별 변주(mock, f 계수).
   · 빈상태 2종: '미공시'(지원 대상이나 미공고) / '해당없음'(그 차종이 해당 지자체 지원 항목 아님).
   · 데이터는 mock(실값 기반). 실연동 시 지자체 공고 / PS_MODEL_LOCAL·H2_MODEL_LOCAL 매핑.
   · 차종/차급 분류는 기존 데이터/레거시 코드그룹 기준(임의 신설 금지).
   ────────────────────────────────────────────────────────────── */
(function () {
  'use strict';
  var fmt = function (n) { return Number(Math.round(n)).toLocaleString('ko-KR'); };

  /* ── 차종(대분류) ── */
  var CATS = [
    { key: 'ev_car', label: '전기승용' },
    { key: 'ev_truck', label: '전기화물' },
    { key: 'ev_bus', label: '전기승합' },
    { key: 'ev_moto', label: '전기이륜' },
    { key: 'const_eq', label: '건설기계' },
    { key: 'h2', label: '수소자동차' }
  ];
  var CAT_LABEL = {}; CATS.forEach(function (c) { CAT_LABEL[c.key] = c.label; });

  /* ── 차급 × 모델 [제작·수입사, 모델, 국비, 지방비(기준 합계), 전환지원금 국비] (만원) ──
     전환지원금 국비가 0이면 전환 비대상 차량. 지방비/전환지방비는 지자체 변주로 산출. */
  var TIERS = {
    ev_car: [
      { tier: '경형·소형', models: [['기아', '레이 EV', 594, 118, 0], ['현대', '캐스퍼 일렉트릭', 646, 118, 0]] },
      { tier: '중형', models: [['현대', '아이오닉 6', 741, 130, 100], ['기아', 'EV6', 741, 130, 100], ['테슬라', 'Model Y', 252, 76, 100], ['KG모빌리티', '토레스 EVX', 453, 100, 100]] }
    ],
    ev_truck: [
      { tier: '초소형', models: [['디피코', '포트로-탑', 380, 114, 0]] },
      { tier: '소형(카고)', models: [['현대', '포터Ⅱ 일렉트릭', 968, 420, 100], ['기아', '봉고 EV', 1000, 430, 100], ['현대', 'ST1 카고', 1200, 490, 100]] },
      { tier: '소형(밴)', models: [['KG모빌리티', 'MUSSO EV', 639, 289, 75]] }
    ],
    ev_bus: [
      { tier: '소형', models: [['현대', '스타리아 일렉트릭 11인승', 1500, 450, 0], ['MTR', 'ST1 승합 CV1', 1471, 441, 0]] },
      { tier: '중형', models: [['현대', '카운티 일렉트릭', 5000, 1500, 0], ['현대', '카운티 어린이버스', 8313, 2494, 0]] },
      { tier: '대형', models: [['현대', '일렉시티', 6994, 1694, 0], ['현대', '일렉시티 이층버스', 11069, 3321, 0]] }
    ],
    ev_moto: [
      { tier: '경형', models: [['디앤에이모터스', 'EM-1', 75, 23, 0]] },
      { tier: '소형', models: [['이오모터스', 'BONO', 100, 30, 0], ['그린모빌리티', 'GMT-V6', 96, 29, 0]] },
      { tier: '중형', models: [['케이알모터스', 'E-SKO TRI', 123, 37, 0]] },
      { tier: '대형', models: [['디앤에이모터스', 'ED-1A', 115, 35, 0]] }
    ],
    const_eq: [
      { tier: '지게차', models: [['HD현대사이트솔루션', '25B-X 지게차', 380, 114, 0], ['클라크', 'L70XE 지게차', 1250, 375, 0]] },
      { tier: '굴착기', models: [['HD건설기계', 'ROBEX300LC-E 굴착기', 2365, 710, 0], ['볼보그룹코리아', 'EC300F 굴착기', 2500, 750, 0]] }
    ],
    h2: [
      { tier: '승용', models: [['현대', '넥쏘', 2250, 1050, 0]] },
      { tier: '버스', models: [['현대', '일렉시티 FCEV', 21000, 5000, 0], ['우진산전', '아폴로 900 H2', 20457, 5000, 0]] },
      { tier: '트럭', models: [['현대', '엑시언트 수소트럭', 25000, 6000, 0]] }
    ]
  };

  /* ── 시·도 → 시·군·구 (mock, 대표 6개 시·도 × 2~3개) ──
     f = 지방비 변주계수. st = 차종별 상태 맵(미지정 = '공시'). */
  var SIDOS = [
    ['전체', '전체'], ['서울', '서울특별시'], ['부산', '부산광역시'], ['경기', '경기도'],
    ['경남', '경상남도'], ['전남', '전라남도'], ['제주', '제주특별자치도']
  ];
  var SIDO_LABEL = {}; SIDOS.forEach(function (s) { SIDO_LABEL[s[0]] = s[1]; });

  var LOCALES = [
    { sido: '서울', gu: '강남구', f: 0.95, st: { h2: '미공시', const_eq: '해당없음' } },
    { sido: '서울', gu: '송파구', f: 0.95, st: { ev_moto: '미공시' } },
    { sido: '부산', gu: '해운대구', f: 1.00, st: { const_eq: '해당없음' } },
    { sido: '부산', gu: '부산진구', f: 1.00, st: {} },
    { sido: '경기', gu: '성남시', f: 1.10, st: { h2: '미공시' } },
    { sido: '경기', gu: '수원시', f: 1.10, st: {} },
    { sido: '경기', gu: '고양시', f: 1.10, st: { const_eq: '해당없음' } },
    { sido: '경남', gu: '양산시', f: 1.05, st: {} },
    { sido: '경남', gu: '창원시', f: 1.05, st: { ev_moto: '해당없음' } },
    { sido: '전남', gu: '여수시', f: 1.25, st: { h2: '미공시' } },
    { sido: '전남', gu: '순천시', f: 1.25, st: {} },
    { sido: '제주', gu: '제주시', f: 1.15, st: { const_eq: '해당없음' } },
    { sido: '제주', gu: '서귀포시', f: 1.15, st: { h2: '미공시' } }
  ];
  LOCALES.forEach(function (l) { l.full = SIDO_LABEL[l.sido] + ' ' + l.gu; });

  function statusOf(loc, cat) { return (loc.st && loc.st[cat]) || '공시'; }

  /* 모델 금액 산출 — 국비 전국 공통, 지방비/전환지방비만 지자체 변주 */
  function modelCalc(m, loc) {
    var gukbi = m[2];
    var jibangbi = Math.round(m[3] * loc.f);
    var convG = m[4];                                   // 전환지원금 국비(전국 공통)
    var convL = convG > 0 ? Math.round(convG * 0.5 * loc.f) : 0; // 전환지원금 지방비(지자체 변주)
    return {
      maker: m[0], name: m[1],
      gukbi: gukbi, jibangbi: jibangbi, sub: gukbi + jibangbi,
      convG: convG, convL: convL, hasConv: convG > 0
    };
  }

  /* ── 상태 ── */
  var state = { cat: 'all', sido: '전체', sigungu: '전체', localeQ: '', tier: '전체', modelQ: '', open: null, sort: { key: 'sub', dir: 'desc' } };
  var els = {};

  function visibleCats() { return state.cat === 'all' ? CATS.map(function (c) { return c.key; }) : [state.cat]; }

  function filteredLocales() {
    return LOCALES.filter(function (loc) {
      if (state.sido !== '전체' && loc.sido !== state.sido) return false;
      if (state.sigungu !== '전체' && loc.gu !== state.sigungu) return false;
      if (state.localeQ && loc.full.indexOf(state.localeQ) < 0 && loc.gu.indexOf(state.localeQ) < 0) return false;
      return true;
    });
  }

  /* ── 빈상태 셀 렌더 ── */
  function cellLocal(value, status) {
    if (status === '미공시') return '<span class="sl-st sl-st-miss">미공시</span>';
    if (status === '해당없음') return '<span class="sl-st sl-st-na">해당 없음</span>';
    return fmt(value);
  }
  function cellConvNational(c) { return c.hasConv ? fmt(c.convG) : '<span class="sl-na-dash">–</span>'; }
  function cellConvLocal(c, status) {
    if (!c.hasConv) return '<span class="sl-na-dash">–</span>';
    if (status === '미공시') return '<span class="sl-st sl-st-miss">미공시</span>';
    if (status === '해당없음') return '<span class="sl-st sl-st-na">해당 없음</span>';
    return fmt(c.convL);
  }

  /* ── 정렬 ── */
  var SORT_KEYS = ['maker', 'name', 'gukbi', 'jibangbi', 'sub', 'convG', 'convL'];
  function sortVal(c, status, key) {
    if (key === 'maker') return c.maker;
    if (key === 'name') return c.name;
    if (key === 'gukbi') return c.gukbi;                                   // 국비 전국 공통
    if (key === 'convG') return c.hasConv ? c.convG : -Infinity;
    // 지자체 의존 컬럼: 미공시/해당없음/비대상은 맨 아래로
    if (status !== '공시') return -Infinity;
    if (key === 'jibangbi') return c.jibangbi;
    if (key === 'sub') return c.sub;
    if (key === 'convL') return c.hasConv ? c.convL : -Infinity;
    return 0;
  }
  function sortRows(rows, loc, cat) {
    var k = state.sort.key, dir = state.sort.dir === 'asc' ? 1 : -1, status = statusOf(loc, cat);
    return rows.slice().sort(function (a, b) {
      var va = sortVal(a, status, k), vb = sortVal(b, status, k);
      if (typeof va === 'string') return va.localeCompare(vb, 'ko') * dir;
      if (va < vb) return -1 * dir; if (va > vb) return 1 * dir; return 0;
    });
  }

  /* ── 패널(펼친 지자체 표) ── */
  function renderPanel(loc) {
    var cats = visibleCats();
    var note = '<p class="sl-note">'
      + '단위: <strong>만원</strong> · 2026년 지자체 공고 기준(지자체 공고에 따라 변동) · 출처: 각 지자체 공고<br>'
      + '<strong>국비는 전국 공통</strong>(지자체 무관 동일값)이며 지방비만 지자체별로 다릅니다. '
      + '<strong>소계 = 국비 + 지방비</strong>이며 <strong>전환지원금은 소계에 포함되지 않습니다</strong>(조건부 옵트인, 별도 컬럼).'
      + '</p>';

    var convTip = '전환지원금 <span class="sl-tip" tabindex="0">ⓘ'
      + '<span class="sl-tip-box" role="tooltip">노후경유차 폐차·전환 시에만 지원(택시 포함). 모든 구매자가 받는 값이 아닙니다.</span></span>';

    var thead = '<thead><tr>'
      + '<th class="l sl-th-sort" data-sk="maker">제조사<span class="sl-arrow"></span></th>'
      + '<th class="l sl-th-sort" data-sk="name">모델<span class="sl-arrow"></span></th>'
      + '<th class="num sl-th-sort" data-sk="gukbi">국비<span class="sl-arrow"></span></th>'
      + '<th class="num sl-th-sort" data-sk="jibangbi">지방비<span class="sl-arrow"></span></th>'
      + '<th class="num sl-th-sort" data-sk="sub">소계<span class="sl-arrow"></span></th>'
      + '<th class="num sl-th-sort" data-sk="convG">' + convTip + ' 국비<span class="sl-arrow"></span></th>'
      + '<th class="num sl-th-sort" data-sk="convL">전환지원금 지방비<span class="sl-arrow"></span></th>'
      + '</tr></thead>';

    var bodies = '';
    cats.forEach(function (cat) {
      (TIERS[cat] || []).forEach(function (t) {
        if (state.cat !== 'all' && state.tier !== '전체' && t.tier !== state.tier) return;
        var status = statusOf(loc, cat);
        var rows = t.models.map(function (m) { return modelCalc(m, loc); });
        if (state.modelQ) rows = rows.filter(function (c) { return c.name.indexOf(state.modelQ) >= 0 || c.maker.indexOf(state.modelQ) >= 0; });
        if (!rows.length) return;
        rows = sortRows(rows, loc, cat);
        bodies += '<tbody><tr class="sl-grp"><td colspan="7">'
          + '<span class="sl-cat-chip cat-' + cat + '">' + CAT_LABEL[cat] + '</span>' + t.tier + '</td></tr>';
        rows.forEach(function (c) {
          bodies += '<tr>'
            + '<td class="l">' + c.maker + '</td>'
            + '<td class="l"><strong>' + c.name + '</strong></td>'
            + '<td class="num">' + fmt(c.gukbi) + '</td>'
            + '<td class="num">' + cellLocal(c.jibangbi, status) + '</td>'
            + '<td class="num sub">' + (status === '공시' ? '<strong>' + fmt(c.sub) + '</strong>' : cellLocal(c.sub, status)) + '</td>'
            + '<td class="num">' + cellConvNational(c) + '</td>'
            + '<td class="num">' + cellConvLocal(c, status) + '</td>'
            + '</tr>';
        });
        bodies += '</tbody>';
      });
    });
    if (!bodies) bodies = '<tbody><tr><td colspan="7" style="padding:28px;text-align:center;color:var(--text-tertiary);">조건에 맞는 차량이 없습니다.</td></tr></tbody>';

    // 정렬 화살표 표시
    var html = note + '<div class="sl-tablewrap"><table class="sl-vtable">' + thead + bodies + '</table></div>';
    var tmp = document.createElement('div'); tmp.innerHTML = html;
    tmp.querySelectorAll('.sl-th-sort').forEach(function (th) {
      if (th.dataset.sk === state.sort.key) { th.classList.add('sorted'); th.querySelector('.sl-arrow').textContent = state.sort.dir === 'asc' ? '▲' : '▼'; }
    });
    return tmp.innerHTML;
  }

  /* ── 아코디언 리스트 ── */
  function renderList() {
    var cats = visibleCats();
    var rows = filteredLocales();
    if (!rows.length) { els.list.innerHTML = '<div class="sl-empty">조건에 맞는 지자체가 없습니다.</div>'; return; }
    els.list.innerHTML = rows.map(function (loc, i) {
      var open = state.open === loc.full;
      var pid = 'slpanel-' + i;
      var badges = cats.map(function (k) {
        var st = statusOf(loc, k);
        var sfx = st === '공시' ? '' : ' (' + (st === '미공시' ? '미공시' : '해당없음') + ')';
        return '<span class="sl-badge">' + CAT_LABEL[k] + sfx + '</span>';
      }).join('');
      return '<div class="sl-acc' + (open ? ' open' : '') + '" data-full="' + loc.full + '">'
        + '<button type="button" class="sl-acc-head" aria-expanded="' + (open ? 'true' : 'false') + '" aria-controls="' + pid + '">'
        + '<span class="sl-acc-name">' + loc.gu + '<small>' + SIDO_LABEL[loc.sido] + '</small></span>'
        + '<span class="sl-acc-badges">' + badges + '</span>'
        + '<span class="sl-acc-chev"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg></span>'
        + '</button>'
        + '<div class="sl-acc-panel" id="' + pid + '" role="region"' + (open ? '' : ' hidden') + '>'
        + (open ? renderPanel(loc) : '') + '</div>'
        + '</div>';
    }).join('');
  }

  function findLocale(full) { for (var i = 0; i < LOCALES.length; i++) if (LOCALES[i].full === full) return LOCALES[i]; return null; }

  function toggleLocale(full) {
    state.open = (state.open === full) ? null : full; // single-open
    renderList();
    if (state.open) {
      var el = els.list.querySelector('.sl-acc[data-full="' + state.open + '"]');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  /* 현재 펼친 패널만 다시 그림(필터/정렬 변경 시) */
  function refreshOpenPanel() {
    if (!state.open) return;
    var loc = findLocale(state.open); if (!loc) return;
    var acc = els.list.querySelector('.sl-acc[data-full="' + state.open + '"]');
    if (!acc) return;
    var panel = acc.querySelector('.sl-acc-panel');
    if (panel) panel.innerHTML = renderPanel(loc);
  }

  /* ── 규격 셀렉트 채우기(선택 차종 기준 · 소스 '규격구분') ── */
  function fillTierSelect() {
    var sel = els.tier; if (!sel) return;
    var opts = ['<option value="전체">전체 규격</option>'];
    if (state.cat !== 'all') {
      (TIERS[state.cat] || []).forEach(function (t) { opts.push('<option value="' + t.tier + '">' + t.tier + '</option>'); });
      sel.disabled = false;
    } else { sel.disabled = true; }
    sel.innerHTML = opts.join('');
    state.tier = '전체';
  }

  /* ── 차종 셀렉트 / 시군구 셀렉트(광역시도 종속) ── */
  var SIGUNGU_BY_SIDO = {};
  LOCALES.forEach(function (l) { (SIGUNGU_BY_SIDO[l.sido] = SIGUNGU_BY_SIDO[l.sido] || []).push(l.gu); });
  function fillCatSelect() {
    if (!els.cat) return;
    els.cat.innerHTML = '<option value="all">전체 차종</option>' + CATS.map(function (c) { return '<option value="' + c.key + '">' + c.label + '</option>'; }).join('');
  }
  function fillSigungu() {
    if (!els.sigungu) return;
    if (state.sido === '전체') { els.sigungu.innerHTML = '<option value="전체">전체 시군구</option>'; els.sigungu.disabled = true; }
    else { els.sigungu.innerHTML = '<option value="전체">전체 시군구</option>' + (SIGUNGU_BY_SIDO[state.sido] || []).map(function (g) { return '<option value="' + g + '">' + g + '</option>'; }).join(''); els.sigungu.disabled = false; }
    state.sigungu = '전체';
  }

  function updateCompareLink() {
    if (els.compare) els.compare.href = 'compare-tool.html' + (state.cat !== 'all' ? '?cat=' + encodeURIComponent(state.cat) : '');
  }

  function init() {
    els.cat = document.getElementById('slCat');
    els.sido = document.getElementById('slSido');
    els.sigungu = document.getElementById('slSigungu');
    els.localeSearch = document.getElementById('slLocaleSearch');
    els.tier = document.getElementById('slTier');
    els.modelSearch = document.getElementById('slModelSearch');
    els.list = document.getElementById('slList');
    els.compare = document.getElementById('slCompareBtn');
    if (!els.list) return;

    // 광역시도 / 차종 셀렉트 채우기
    if (els.sido) els.sido.innerHTML = SIDOS.map(function (s) { return '<option value="' + s[0] + '">' + s[1] + '</option>'; }).join('');
    fillCatSelect();

    // 차종 셀렉트 → 규격 셀렉트 갱신
    if (els.cat) els.cat.addEventListener('change', function () {
      state.cat = this.value;
      fillTierSelect(); updateCompareLink();
      renderList();
    });
    // 광역시도 → 시군구 종속 / 시군구 / 지자체 검색
    if (els.sido) els.sido.addEventListener('change', function () { state.sido = this.value; fillSigungu(); state.open = null; renderList(); });
    if (els.sigungu) els.sigungu.addEventListener('change', function () { state.sigungu = this.value; state.open = null; renderList(); });
    if (els.localeSearch) els.localeSearch.addEventListener('input', function () { state.localeQ = this.value.trim(); state.open = null; renderList(); });
    // 규격 / 모델 검색 → 펼친 패널 갱신
    if (els.tier) els.tier.addEventListener('change', function () { state.tier = this.value; refreshOpenPanel(); });
    if (els.modelSearch) els.modelSearch.addEventListener('input', function () { state.modelQ = this.value.trim(); refreshOpenPanel(); });

    // 아코디언 토글 + 정렬 (이벤트 위임)
    els.list.addEventListener('click', function (e) {
      var th = e.target.closest('.sl-th-sort');
      if (th) {
        var k = th.dataset.sk;
        if (state.sort.key === k) state.sort.dir = (state.sort.dir === 'asc' ? 'desc' : 'asc');
        else { state.sort.key = k; state.sort.dir = (k === 'maker' || k === 'name') ? 'asc' : 'desc'; }
        refreshOpenPanel();
        return;
      }
      var head = e.target.closest('.sl-acc-head'); if (!head) return;
      var acc = head.closest('.sl-acc'); if (acc) toggleLocale(acc.dataset.full);
    });

    fillTierSelect(); updateCompareLink();
    renderList();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();

  window.__subsidyLocal = { CATS: CATS, TIERS: TIERS, LOCALES: LOCALES, modelCalc: modelCalc };
})();
