/* ────────────────────────────────────────────────────────────────────
 * 전기차 충전요금 안내 페이지 — h_evax_prototype/fee.html 이식
 * MATRIX / ROAMING / EV_MODELS 데이터 + TOU 차트 + 매트릭스 + 시뮬레이터
 * ──────────────────────────────────────────────────────────────────── */
(function(){
  'use strict';
  function init(){
    try {

  // ── 탭 전환 (data-tab → data-tab-content, 전역 검색) ─────────────────
  // main.js의 기본 탭 핸들러는 parent.parentElement만 검색하므로 별도 분리된
  // tab-content 영역(상단 nav + 하단 section 구조)에서는 동작하지 않음 → 여기서 처리.
  (function initFeeTabs(){
    const tabs = document.querySelectorAll('#feeTabs .tab[data-tab]');
    tabs.forEach(tab => {
      tab.addEventListener('click', e => {
        const target = tab.dataset.tab;
        if (!target) return;
        // 같은 그룹 내 active 토글
        document.querySelectorAll('#feeTabs .tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        // tab-content 전환 (전역 검색)
        document.querySelectorAll('[data-tab-content]').forEach(c => c.classList.remove('active'));
        const el = document.querySelector(`[data-tab-content="${target}"]`);
        if (el) el.classList.add('active');
        e.stopPropagation();
      }, true); // capture 단계에서 우선 실행 (main.js 기본 핸들러보다 먼저)
    });
  })();

  // ── URL 탭 자동 진입 (?tab=ev|h2|compare) ─────────────────────────────
  (function(){
    const tab = new URL(location.href).searchParams.get('tab');
    if (tab) {
      const btn = document.querySelector(`#feeTabs .tab[data-tab="${tab}"]`);
      if (btn) btn.click();
    }
  })();

  // ── TOU 시간대별 요금 차트 (정률 + 봄·가을 주말 11~14시 50% 할인) ────
  const TOU_BASE = { fast50: 324.4, fast100: 347.2 };
  const DISCOUNT_SAT = 48.6;
  const DISCOUNT_SUN = 42.7;
  const DISCOUNT_HRS = [11, 12, 13];

  function renderTOU() {
    // v0.17 계절시간제 확장: 인라인 렌더러(용량 5종·회원/비회원·할인 3종)가 우선
    if (window.__renderTOU && window.__renderTOU !== renderTOU) return;
    const capKey = (document.getElementById('tou-capacity') || {}).value || 'fast50';
    const base = TOU_BASE[capKey];
    const season = (document.querySelector('#tou-season-tabs [data-season].active') || {}).dataset?.season || 'spring';
    const day = (document.querySelector('#tou-day-tabs [data-day].active') || {}).dataset?.day || 'weekday';

    const touBars = document.getElementById('touBars');
    const touAxis = document.getElementById('touAxis');
    const touLegend = document.getElementById('touLegend');
    const touSum = document.getElementById('tou-summary');
    if (!touBars) return;
    touBars.innerHTML = '';
    if (touAxis) touAxis.innerHTML = '';
    if (touLegend) touLegend.innerHTML = '';
    if (touSum) touSum.innerHTML = '';

    const hasDiscount = (season === 'spring') && (day === 'saturday' || day === 'sunday');
    const discAmt = day === 'saturday' ? DISCOUNT_SAT : DISCOUNT_SUN;
    const SCALE_MAX = base * 1.15;

    const rates = Array.from({length: 24}, (_, i) =>
      hasDiscount && DISCOUNT_HRS.includes(i) ? +(base - discAmt).toFixed(1) : base
    );

    rates.forEach((r, i) => {
      const isDisc = hasDiscount && DISCOUNT_HRS.includes(i);
      const color = isDisc ? '#4FB8A7' : '#4A90D9';
      const h = Math.max(5, r / SCALE_MAX * 100).toFixed(1);
      touBars.insertAdjacentHTML('beforeend',
        `<div class="bar" style="height:${h}%;background:${color};" data-label="${String(i).padStart(2,'0')}시 · ${r}원/kWh"></div>`
      );
      if (touAxis) touAxis.insertAdjacentHTML('beforeend', `<div>${i % 3 === 0 ? i : ''}</div>`);
    });

    if (touSum) {
      const items = [{ label: '기본 단가', value: `${base}원/kWh`, color: '#4A90D9' }];
      if (hasDiscount) {
        const discRate = +(base - discAmt).toFixed(1);
        items.push(
          { label: '할인 단가 (11~14시)', value: `${discRate}원/kWh`, color: '#4FB8A7' },
          { label: '주말 할인폭', value: `-${discAmt}원/kWh`, color: '#E26B84' }
        );
      }
      items.forEach(({label, value, color}) => {
        touSum.insertAdjacentHTML('beforeend',
          `<div class="tou-summary-card">
            <div class="ts-label">${label}</div>
            <div class="ts-value" style="color:${color};">${value}</div>
          </div>`
        );
      });
    }

    if (touLegend) {
      const items = [{ color: '#4A90D9', label: `기본 요금 ${base}원/kWh` }];
      if (hasDiscount) {
        items.push({ color: '#4FB8A7', label: `주말 할인 11~14시 ${+(base - discAmt).toFixed(1)}원/kWh` });
      }
      items.forEach(({color, label}) => {
        touLegend.insertAdjacentHTML('beforeend',
          `<span class="lg-item" style="display:inline-flex;align-items:center;gap:8px;margin-right:20px;">
            <span style="width:14px;height:14px;border-radius:3px;background:${color};flex-shrink:0;"></span>${label}
          </span>`
        );
      });
    }
  }

  (function initTOU() {
    const mo = new Date().getMonth();
    const autoSeason = [2,3,4,8,9].includes(mo) ? 'spring' : [5,6,7].includes(mo) ? 'summer' : 'winter';
    document.querySelectorAll('#tou-season-tabs [data-season]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.season === autoSeason);
    });
    document.querySelectorAll('#tou-season-tabs [data-season]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('#tou-season-tabs [data-season]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        renderTOU();
      });
    });
    document.querySelectorAll('#tou-day-tabs [data-day]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('#tou-day-tabs [data-day]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        renderTOU();
      });
    });
    const capSel = document.getElementById('tou-capacity');
    if (capSel) capSel.addEventListener('change', renderTOU);
    renderTOU();
  })();

  // ── 사업자별 충전 요금 매트릭스 데이터 ────────────────────────────────
  // 사업자명·BID·충전기 수: 환경부 전기차충전소 DB 등록 CPO 중 TOP 22 (시연용 더미)
  // 요금 데이터: 사업자 공시 요금 2026-04-21 기준 추정치 (더미)
  const MATRIX = {
    basic: [
      { bid:'ME', name:'기후에너지환경부',     type:'공공', cc:9800,  ti:76.7, grade:'우수',     s35:null,  s7:null,  s11:null,  mid:null,  f50:324.4, f100:347.2, u200:347.2, u350:347.2, nmr:347.2, note:'회원·비회원 동일' },
      { bid:'KP', name:'한국전력공사',         type:'공공', cc:11029, ti:61.7, grade:'보통',     s35:null,  s7:null,  s11:null,  mid:null,  f50:324.4, f100:347.2, u200:347.2, u350:347.2, nmr:324.4, note:'아파트 계절시간제 별도' },
      { bid:'HE', name:'한국전기차충전서비스', type:'공공', cc:6657,  ti:85.1, grade:'우수',     s35:298,   s7:298,   s11:298,   mid:null,  f50:null,  f100:347.2, u200:347.2, u350:347.2, nmr:550,   note:'해피차저' },
      { bid:'CV', name:'채비',                type:'민간', cc:15580, ti:84.6, grade:'우수',     s35:275,   s7:275,   s11:275,   mid:315,   f50:410,   f100:430,   u200:430,   u350:430,   nmr:590,   note:'중속30kW=315원' },
      { bid:'EV', name:'에버온',              type:'민간', cc:54189, ti:80.6, grade:'우수',     s35:296,   s7:296,   s11:296,   mid:324.4, f50:324.4, f100:347.2, u200:347.2, u350:347.2, nmr:380,   note:'' },
      { bid:'PI', name:'GS차지비',            type:'민간', cc:90491, ti:73.4, grade:'우수',     s35:319,   s7:319,   s11:319,   mid:335,   f50:335,   f100:345,   u200:345,   u350:345,   nmr:470,   note:'국내 최대 충전망' },
      { bid:'ST', name:'SK일렉링크',          type:'민간', cc:10662, ti:78.7, grade:'우수',     s35:295,   s7:295,   s11:295,   mid:410,   f50:410,   f100:320,   u200:320,   u350:320,   nmr:590,   note:'초급속 대폭 인하' },
      { bid:'EC', name:'이지차저',            type:'민간', cc:14148, ti:64.3, grade:'보통',     s35:289,   s7:289,   s11:289,   mid:350,   f50:350,   f100:null,  u200:null,  u350:null,  nmr:450,   note:'' },
      { bid:'PC', name:'아이파킹',            type:'민간', cc:9895,  ti:74.4, grade:'우수',     s35:299,   s7:299,   s11:299,   mid:345,   f50:345,   f100:345,   u200:345,   u350:345,   nmr:450,   note:'' },
      { bid:'LU', name:'LG유플러스 볼트업',   type:'민간', cc:40697, ti:61.7, grade:'보통',     s35:318,   s7:318,   s11:318,   mid:350,   f50:350,   f100:350,   u200:350,   u350:350,   nmr:null,  note:'' },
      { bid:'NT', name:'NICE인프라',          type:'민간', cc:19615, ti:74.5, grade:'우수',     s35:324,   s7:324,   s11:324,   mid:350,   f50:350,   f100:null,  u200:null,  u350:null,  nmr:null,  note:'회원·비회원 동일' },
      { bid:'HM', name:'휴맥스이브이',        type:'민간', cc:18679, ti:75.0, grade:'우수',     s35:280,   s7:280,   s11:280,   mid:320,   f50:320,   f100:340,   u200:340,   u350:340,   nmr:480,   note:'투루차저' },
      { bid:'SF', name:'스타코프',            type:'민간', cc:20805, ti:77.9, grade:'우수',     s35:260,   s7:318,   s11:318,   mid:null,  f50:null,  f100:null,  u200:null,  u350:null,  nmr:370,   note:'3.5kW 콘센트=260원' },
      { bid:'PW', name:'파워큐브',            type:'민간', cc:69210, ti:70.4, grade:'우수',     s35:319,   s7:319,   s11:319,   mid:null,  f50:null,  f100:null,  u200:null,  u350:null,  nmr:null,  note:'완속 전문' },
      { bid:'PL', name:'플러그링크',          type:'민간', cc:42871, ti:55.5, grade:'보통',     s35:324.4, s7:324.4, s11:324.4, mid:324.4, f50:324.4, f100:324.4, u200:324.4, u350:324.4, nmr:null,  note:'아파트 완속 전문' },
      { bid:'HW', name:'한화솔루션',          type:'민간', cc:13943, ti:49.5, grade:'개선필요', s35:258,   s7:258,   s11:258,   mid:null,  f50:null,  f100:null,  u200:null,  u350:null,  nmr:null,  note:'완속 전문' },
      { bid:'JA', name:'이브이시스',          type:'민간', cc:7163,  ti:80.5, grade:'우수',     s35:229,   s7:229,   s11:229,   mid:283,   f50:283,   f100:298,   u200:298,   u350:298,   nmr:400,   note:'' },
      { bid:'KE', name:'한국전기차인프라기술', type:'민간', cc:4555,  ti:61.1, grade:'보통',     s35:278,   s7:278,   s11:278,   mid:278,   f50:278,   f100:null,  u200:null,  u350:null,  nmr:380,   note:'KEVIT' },
      { bid:'EP', name:'이카플러그',          type:'민간', cc:4866,  ti:59.6, grade:'보통',     s35:253,   s7:253,   s11:253,   mid:347,   f50:347,   f100:null,  u200:null,  u350:null,  nmr:null,  note:'' },
      { bid:'KL', name:'클린일렉스',          type:'민간', cc:5869,  ti:54.9, grade:'보통',     s35:295,   s7:295,   s11:295,   mid:370,   f50:370,   f100:null,  u200:null,  u350:null,  nmr:590,   note:'' },
      { bid:'IN', name:'신세계아이앤씨',      type:'민간', cc:7706,  ti:60.5, grade:'보통',     s35:269,   s7:269,   s11:269,   mid:null,  f50:null,  f100:null,  u200:null,  u350:null,  nmr:null,  note:'완속 전문' },
      { bid:'BN', name:'블루네트웍스',        type:'민간', cc:2926,  ti:60.6, grade:'보통',     s35:249,   s7:249,   s11:249,   mid:null,  f50:327,   f100:null,  u200:null,  u350:null,  nmr:null,  note:'⚠ 이채움 · 저신뢰(2차 출처)' },
    ],
    special: [
      { bid:'CV', name:'채비',    type:'민간', s35:271, s7:271, s11:271, mid:345, f50:345, f100:345, u200:345, u350:345, nmr:null, note:'서울시 설치지원' },
      { bid:'PI', name:'GS차지비',type:'민간', s35:255, s7:271, s11:271, mid:345, f50:345, f100:null,u200:null,u350:null,nmr:null, note:'서울시 설치지원 (3.5kW 과금형=255원)' },
      { bid:'PI', name:'GS차지비',type:'민간', s35:null,s7:319, s11:319, mid:345, f50:345, f100:null,u200:null,u350:null,nmr:null, note:'완성차 브랜드 충전소' },
      { bid:'EC', name:'이지차저',type:'민간', s35:null,s7:null,s11:null,mid:null,f50:329, f100:null,u200:null,u350:null,nmr:369,  note:'고속도로 구간' },
      { bid:'PW', name:'파워큐브',type:'민간', s35:280, s7:324, s11:324, mid:null,f50:null,f100:null,u200:null,u350:null,nmr:null, note:'3.5kW 과금형=280원 / 7kW 저압=324원' },
      { bid:'SF', name:'스타코프',type:'민간', s35:260, s7:318, s11:318, mid:null,f50:null,f100:null,u200:null,u350:null,nmr:null, note:'과금형 콘센트 3.5kW=260원' },
    ],
    tou: [
      { bid:'KP', name:'한전 KEPCO', type:'공공',
        note:'아파트 공용 완속충전기 · 2023-01-01 기준 · 완속 7kW',
        times: { off:'22~08시', mid:'08~09, 12~16, 19~22시', on:'09~12, 16~19시' },
        rows: [
          { season:'봄·가을 (3~5월, 9~10월)', off:269.7, mid:280.8, on:285.3 },
          { season:'여름 (6~8월)',              off:289.9, mid:332,   on:333.2 },
          { season:'겨울 (11~2월)',             off:306.1, mid:332,   on:333.2 },
        ]
      },
      { bid:'JA', name:'이브이시스', type:'민간',
        note:'⚠ 추정치 · 자체 회원가(완속 229원) 기준 ±15% 적용 · 완속 7kW',
        times: { off:'23~07시', mid:'07~09, 12~17, 21~23시', on:'09~12, 17~21시' },
        rows: [
          { season:'봄·가을 (3~5월, 9~10월)', off:195, mid:235, on:255 },
          { season:'여름 (6~8월)',              off:225, mid:295, on:320 },
          { season:'겨울 (11~2월)',             off:245, mid:295, on:315 },
        ]
      },
      { bid:'EV', name:'에버온', type:'민간',
        note:'⚠ 추정치 · 자체 회원가(완속 296원) 기준 ±20% 적용 · 완속 7kW',
        times: { off:'23~07시', mid:'07~10, 12~17, 21~23시', on:'10~12, 17~21시' },
        rows: [
          { season:'봄·가을 (3~5월, 9~10월)', off:240, mid:295, on:320 },
          { season:'여름 (6~8월)',              off:270, mid:340, on:365 },
          { season:'겨울 (11~2월)',             off:290, mid:340, on:360 },
        ]
      }
    ]
  };
  window.__FEE_BASIC = MATRIX.basic;
  window.__FEE_SPECIAL = MATRIX.special;
  window.__FEE_TOU = MATRIX.tou;

  // 5밴드(출력 구분) — 매트릭스 8필드(s35..u350)를 렌더 단계에서 5밴드로 접어서 표시
  //   완속←s7(폴백 s11→s35) · 중속←mid · 급속100미만←f50 · 급속100이상←f100 · 초급속←u200(=u350)
  const CAPS = [
    { key:'slow',    label:'완속',            group:'slow',  srcs:['s7','s11','s35'], range:'30kW 미만',     gov:294.3 },
    { key:'mid',     label:'중속',            group:'mid',   srcs:['mid'],            range:'30~50kW 미만',  gov:306.0 },
    { key:'fast50',  label:'급속\n100kW미만',  group:'fast',  srcs:['f50'],            range:'50~100kW 미만', gov:324.4 },
    { key:'fast100', label:'급속\n100kW이상',  group:'fast',  srcs:['f100'],           range:'100~200kW 미만',gov:347.2 },
    { key:'ultra',   label:'초급속',          group:'ultra', srcs:['u200','u350'],    range:'200kW 이상',    gov:391.9 },
  ];
  // 검색 결과의 충전기 출력키(s35..u350) → 5밴드 소속
  const OUT_BAND = { s35:'slow', s7:'slow', s11:'slow', mid:'mid', f50:'fast50', f100:'fast100', u200:'ultra', u350:'ultra' };
  window.__FEE_CAPS = CAPS; window.__FEE_OUTBAND = OUT_BAND;
  const GRP_LINE = { slow:'#0EA5E9', mid:'#F59E0B', fast:'#EC4899', ultra:'#8B5CF6' };
  const HDR_BG = '#F8FAFC';
  const HDR_TEXT = '#475569';

  let matrixSort = { col: null, dir: 1 };
  let matrixFavOnly = false;

  function fmtMx(v) {
    if (v == null) return '<span style="color:#cbd5e1;font-size:14px;">—</span>';
    return `<span style="font-weight:600;font-size:15px;color:var(--text-primary);">${v}</span>`;
  }

  // 사업자 즐겨찾기 별 셀 HTML
  function providerFavBtnHTML(bid) {
    const F = window.EVFavorites;
    if (!F) return '';
    const isF = F.isFav(bid, 'provider');
    return `<button type="button" class="cf-fav-btn" data-fav-bid="${bid}" aria-pressed="${isF ? 'true':'false'}" aria-label="사업자 즐겨찾기" title="사업자 즐겨찾기" style="background:transparent;border:1px solid transparent;width:28px;height:28px;display:inline-flex;align-items:center;justify-content:center;border-radius:999px;cursor:pointer;margin-right:6px;vertical-align:middle;transition:background var(--t-fast),border-color var(--t-fast);">${F.renderStar(isF)}</button>`;
  }

  function renderMatrix() {
    const wrap = document.getElementById('matrix-wrap');
    if (!wrap) return;
    const mtype = (document.querySelector('#matrix-type-tabs [data-mtype].active') || {}).dataset?.mtype || 'basic';
    const mmem = (document.querySelector('#matrix-mem-tabs [data-mmem].active') || {}).dataset?.mmem || 'member';
    const isMem = mmem === 'member';
    const cnt = document.getElementById('matrix-count');
    // v0.12 [35] 별표 바인딩 헬퍼 — 기본/지원조건별/계절시간제 모든 탭에서 동작
    const bindMatrixFav = (w) => {
      w.querySelectorAll('.cf-fav-btn[data-fav-bid]').forEach(btn => {
        btn.addEventListener('click', e => {
          e.stopPropagation(); e.preventDefault();
          if (!window.EVFavorites) return;
          const bid = btn.getAttribute('data-fav-bid');
          const op = (MATRIX.basic.find(x => x.bid === bid) || {});
          const item = { id: bid, kind: 'provider', bid, name: op.name || bid, type: op.type || '', cc: op.cc, ti: op.ti, grade: op.grade };
          const nowFav = window.EVFavorites.toggle(item, 'provider');
          window.EVFavorites.toast(nowFav ? `${item.name} 즐겨찾기에 추가했습니다.` : `${item.name} 즐겨찾기에서 해제했습니다.`, nowFav ? 'add' : 'remove');
          renderMatrix();
        });
      });
    };

    if (mtype === 'tou') {
      const ops = MATRIX.tou;
      const typeChipPublic = `<span style="font-size:12px;color:var(--text-primary);font-weight:600;">공공</span>`;
      const typeChipPrivate = `<span style="font-size:12px;color:var(--text-primary);font-weight:600;">민간</span>`;
      let tbodyHtml = '';
      ops.forEach(op => {
        const span = op.rows.length + 1;
        const chip = op.type === '공공' ? typeChipPublic : typeChipPrivate;
        const nameCell = `<td rowspan="${span}" style="font-weight:600;font-size:14.5px;min-width:140px;padding:10px 14px;vertical-align:middle;border-right:2px solid #e5e7eb;color:var(--text-primary);">${providerFavBtnHTML(op.bid)}${chip}<br>${op.name}<div style="font-size:11.5px;font-weight:500;color:var(--color-gray-500);margin-top:5px;">${op.bid}</div></td>`;
        tbodyHtml += `<tr style="background:#f0f7ff;">${nameCell}
          <td style="font-size:12.5px;color:var(--color-gray-600);font-weight:600;padding:8px 12px;">시간대</td>
          <td class="num" style="font-size:12.5px;color:var(--color-gray-600);padding:8px 12px;">${op.times.off}</td>
          <td class="num" style="font-size:12.5px;color:var(--color-gray-600);padding:8px 12px;">${op.times.mid}</td>
          <td class="num" style="font-size:12.5px;color:var(--color-gray-600);padding:8px 12px;">${op.times.on}</td></tr>`;
        op.rows.forEach(r => {
          tbodyHtml += `<tr>
            <td style="padding:10px 12px;font-size:14px;"><strong>${r.season}</strong></td>
            <td class="num" style="font-size:15px;font-weight:600;padding:10px 12px;">${r.off}</td>
            <td class="num" style="font-size:15px;font-weight:600;padding:10px 12px;">${r.mid}</td>
            <td class="num" style="font-size:15px;font-weight:600;padding:10px 12px;">${r.on}</td></tr>`;
        });
      });
      const notes = ops.map(op => op.note).join(' · ');
      const S = 'position:sticky;top:0;z-index:3;background:#f8fafc;box-shadow:0 1px 0 #e2e8f0;font-size:13px;font-weight:600;color:var(--color-gray-700);padding:10px 12px;';
      wrap.innerHTML = `<table class="data-table" style="border:none;overflow:visible;">
        <thead><tr>
          <th style="${S}min-width:120px;">사업자</th>
          <th style="${S}">계절</th>
          <th class="num" style="${S}">경부하</th>
          <th class="num" style="${S}">중간부하</th>
          <th class="num" style="${S}">최대부하</th>
        </tr></thead>
        <tbody>${tbodyHtml}</tbody></table>
        <div style="padding:12px 18px;font-size:13px;color:var(--color-gray-500);line-height:1.7;">${notes} · 비회원 별도 미공시</div>`;
      if (cnt) cnt.textContent = `${ops.length}개 사업자`;
      bindMatrixFav(wrap); // v0.12 [35] 계절시간제 별표 동작
      return;
    }

    let rows = MATRIX[mtype];
    // 즐겨찾기만 보기 필터
    if (matrixFavOnly && window.EVFavorites) {
      rows = rows.filter(r => window.EVFavorites.isFav(r.bid, 'provider'));
    }
    const getVal = (r, key) => {
      const cap = CAPS.find(c => c.key === key);
      if (!cap) return null;
      let v = null;
      for (let i = 0; i < cap.srcs.length; i++) { if (r[cap.srcs[i]] != null) { v = r[cap.srcs[i]]; break; } }
      return isMem ? v : (cap.group === 'slow' ? v : (r.nmr ?? null));
    };

    const sorted = [...rows].sort((a, b) => {
      if (!matrixSort.col) return 0;
      const av = matrixSort.col === 'name' ? a.name : getVal(a, matrixSort.col);
      const bv = matrixSort.col === 'name' ? b.name : getVal(b, matrixSort.col);
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === 'string') return matrixSort.dir * av.localeCompare(bv, 'ko');
      return matrixSort.dir * (av - bv);
    });

    const si = col => matrixSort.col === col
      ? `<span style="font-size:10px;margin-left:3px;">${matrixSort.dir === 1 ? '▲' : '▼'}</span>`
      : `<span style="font-size:9px;margin-left:3px;opacity:0.25;">⇅</span>`;

    const thCells = CAPS.map(c => {
      const line = GRP_LINE[c.group];
      // 굵은 라인 대신 라벨 위 미세 도트로 그룹 식별 — 모던 클린
      const dotHtml = `<span style="display:inline-block;width:5px;height:5px;border-radius:50%;background:${line};margin-bottom:5px;"></span><br>`;
      return `<th class="num" data-sort-col="${c.key}" style="background:${HDR_BG};color:${HDR_TEXT};font-size:12.5px;font-weight:600;white-space:pre-line;padding:8px 10px 10px;cursor:pointer;user-select:none;position:sticky;top:0;z-index:3;border-bottom:1px solid var(--border-light);letter-spacing:-0.005em;">${dotHtml}${c.label}${si(c.key)}</th>`;
    }).join('');

    const tbody = sorted.map(r => {
      const typeChip = r.type === '공공'
        ? `<span style="font-size:12px;color:var(--text-primary);font-weight:600;">공공</span>`
        : `<span style="font-size:12px;color:var(--text-primary);font-weight:600;">민간</span>`;
      const cells = CAPS.map(c => `<td class="num" style="padding:10px 10px;">${fmtMx(getVal(r, c.key))}</td>`).join('');
      return `<tr style="height:48px;">
        <td style="white-space:nowrap;padding:10px 14px;position:sticky;left:0;z-index:2;background:#fff;box-shadow:1px 0 0 #f0f0f0;">${providerFavBtnHTML(r.bid)}<strong onclick="openOpModal('${r.bid}')" style="cursor:pointer;color:#1a73e8;font-size:14.5px;">${r.name}</strong>&nbsp;<small style="color:var(--color-gray-400);font-size:11.5px;font-weight:500;">${r.bid}</small>&nbsp;<span style="font-size:11px;color:var(--color-gray-500);">${typeChip}</span></td>
        ${cells}</tr>`;
    }).join('');

    const memNote = isMem ? '회원 요금 기준 (원/kWh) · 사업자 공시 요금'
                          : '비회원(미가입) 기준 · 완속은 회원 요금 동일, 급속·초급속은 단일요금';
    wrap.innerHTML = `<table class="data-table" style="border:none;min-width:720px;border-collapse:collapse;overflow:visible;">
      <thead><tr style="height:44px;">
        <th data-sort-col="name" style="cursor:pointer;user-select:none;padding:10px 14px;position:sticky;left:0;top:0;z-index:5;background:#f8fafc;box-shadow:1px 1px 0 #e2e8f0;font-size:13px;font-weight:600;color:var(--color-gray-700);">사업자${si('name')}</th>${thCells}
      </tr></thead>
      <tbody>${tbody}</tbody>
    </table>
    <!-- v0.12 [38] 인표 꼬리말(회원 요금 기준·FEE_TABLE) 삭제 — 표 아래 charge-fine-note로 동일 안내 제공 -->`;
    if (cnt) {
      const total = MATRIX[mtype].length;
      cnt.textContent = matrixFavOnly ? `즐겨찾기 ${rows.length}개 (전체 ${total})` : `${total}개 사업자`;
    }

    // 즐겨찾기만 보기인데 결과 0건일 때 안내
    if (matrixFavOnly && rows.length === 0) {
      wrap.innerHTML += `<div style="padding:32px 18px;text-align:center;background:#fff;border:1px dashed var(--border-medium);border-radius:var(--radius-md);margin-top:8px;">
        <div style="font-size:15px;font-weight:700;color:var(--text-primary);margin-bottom:4px;">즐겨찾기로 등록한 사업자가 없습니다</div>
        <div style="font-size:13px;color:var(--text-secondary);margin-bottom:12px;">사업자명 옆 ★ 버튼을 눌러 자주 이용하는 사업자를 등록해 보세요.</div>
        <button type="button" class="btn btn-secondary btn-sm" onclick="document.getElementById('matrixFavOnly').checked=false;document.getElementById('matrixFavOnly').dispatchEvent(new Event('change'))">전체 사업자 보기</button>
      </div>`;
    }

    wrap.querySelectorAll('th[data-sort-col]').forEach(th => {
      th.addEventListener('click', () => {
        const col = th.dataset.sortCol;
        if (matrixSort.col === col) matrixSort.dir = -matrixSort.dir;
        else { matrixSort.col = col; matrixSort.dir = 1; }
        renderMatrix();
      });
    });

    bindMatrixFav(wrap); // v0.12 [35]
  }

  // 외부(charging-fee.html)에서 발생하는 즐겨찾기만 보기 토글 이벤트 수신
  document.addEventListener('cf:fav-only-changed', (e) => {
    matrixFavOnly = !!(e && e.detail && e.detail.on);
    renderMatrix();
  });

  (function initMatrix() {
    document.querySelectorAll('#matrix-type-tabs [data-mtype]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('#matrix-type-tabs [data-mtype]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        matrixSort = { col: null, dir: 1 };
        const isTou = btn.dataset.mtype === 'tou';
        document.querySelectorAll('#matrix-mem-tabs [data-mmem]').forEach(b => {
          b.style.opacity = isTou ? '0.4' : '';
          b.style.pointerEvents = isTou ? 'none' : '';
        });
        renderMatrix();
      });
    });
    document.querySelectorAll('#matrix-mem-tabs [data-mmem]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('#matrix-mem-tabs [data-mmem]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        renderMatrix();
      });
    });
    renderMatrix();
  })();

  // ── 로밍 요금 매트릭스 데이터 ───────────────────────────────────────
  const ROAMING_MATRIX = {
    cols: [
      { bid:'ME', name:'기후에너지환경부', slow_m:null,  fast_m:324.4, ultra_m:347.2 },
      { bid:'KP', name:'한국전력공사',     slow_m:null,  fast_m:324.4, ultra_m:347.2 },
      { bid:'HE', name:'한국전기차충전서비스', slow_m:298, fast_m:347.2, ultra_m:347.2 },
      { bid:'ST', name:'SK일렉링크', slow_m:295,   fast_m:410,   ultra_m:320   },
      { bid:'PI', name:'GS차지비',   slow_m:319,   fast_m:335,   ultra_m:345   },
      { bid:'EV', name:'에버온',     slow_m:296,   fast_m:324.4, ultra_m:347.2 },
      { bid:'LU', name:'LG유플러스 볼트업', slow_m:318, fast_m:350, ultra_m:350 },
      { bid:'CV', name:'채비',       slow_m:275,   fast_m:410,   ultra_m:430   },
      { bid:'EC', name:'이지차저',   slow_m:289,   fast_m:350,   ultra_m:null  },
      { bid:'PC', name:'아이파킹',   slow_m:299,   fast_m:345,   ultra_m:345   },
      { bid:'HM', name:'휴맥스이브이', slow_m:280, fast_m:320,   ultra_m:340   },
      { bid:'SF', name:'스타코프',   slow_m:318,   fast_m:null,  ultra_m:null  },
      { bid:'PL', name:'플러그링크', slow_m:324.4, fast_m:324.4, ultra_m:324.4 },
      { bid:'NT', name:'NICE인프라', slow_m:324,   fast_m:350,   ultra_m:null  },
      { bid:'JA', name:'이브이시스', slow_m:229,   fast_m:283,   ultra_m:298   },
      { bid:'KE', name:'한국전기차인프라기술', slow_m:278, fast_m:278, ultra_m:null },
      { bid:'BN', name:'블루네트웍스',slow_m:249,  fast_m:327,   ultra_m:null  },
      { bid:'EP', name:'이카플러그', slow_m:253,   fast_m:347,   ultra_m:null  },
      { bid:'KL', name:'클린일렉스', slow_m:295,   fast_m:370,   ultra_m:null  },
      { bid:'SB', name:'소프트베리(이브이인프라)', slow_m:306, fast_m:420, ultra_m:null },
      { bid:'PW', name:'파워큐브',   slow_m:319,   fast_m:null,  ultra_m:null  },
      { bid:'EZ', name:'차지인',     slow_m:350,   fast_m:420,   ultra_m:null  },
      { bid:'EA', name:'에바',       slow_m:340,   fast_m:400,   ultra_m:null  },
      { bid:'SD', name:'모두의충전(스칼라데이터)', slow_m:420, fast_m:450, ultra_m:null },
      { bid:'EO', name:'E1',         slow_m:null,  fast_m:null,  ultra_m:null  },
      { bid:'EL', name:'엔라이튼',   slow_m:null,  fast_m:null,  ultra_m:null  },
      { bid:'CG', name:'서울씨엔지', slow_m:360,   fast_m:360,   ultra_m:null  },
      { bid:'DO', name:'대한송유관공사', slow_m:350, fast_m:350, ultra_m:370  },
      { bid:'WJ', name:'우진산전',   slow_m:347,   fast_m:347,   ultra_m:null  },
      { bid:'HY', name:'현대엔지니어링', slow_m:350, fast_m:430, ultra_m:430 },
      { bid:'JE', name:'제주전기자동차서비스', slow_m:280, fast_m:340, ultra_m:340 },
      { bid:'TBU',name:'티비유(일렉베리)', slow_m:312, fast_m:411, ultra_m:null },
      { bid:'GN', name:'지에스커넥트', slow_m:null,  fast_m:null,  ultra_m:null },
      { bid:'PK', name:'펌프킨',     slow_m:null,  fast_m:null,  ultra_m:null  },
      { bid:'HS', name:'홈앤서비스', slow_m:null,  fast_m:null,  ultra_m:null  },
      { bid:'EPIT', name:'현대 E-pit', slow_m:null, fast_m:null, ultra_m:null },
      { bid:'TBU',  name:'티비유',     slow_m:null, fast_m:null, ultra_m:null },
      { bid:'DY',   name:'대영채비',   slow_m:null, fast_m:null, ultra_m:null },
      { bid:'PNES', name:'피앤이시스템즈', slow_m:null, fast_m:null, ultra_m:null },
      { bid:'PLM',  name:'피라인모터스', slow_m:null, fast_m:null, ultra_m:null },
      { bid:'JDO',  name:'제주도청',   slow_m:null, fast_m:null, ultra_m:null },
      { bid:'KAEM', name:'한국자동차환경협회', slow_m:null, fast_m:null, ultra_m:null },
    ],
    rows: [
      { bid:'ME', name:'기후부 통합카드', roaming_type:'free',
        note:'모든 사업자 로밍 수수료 없음 (정부 협약)' },
      { bid:'NT', name:'나이스차저', roaming_type:'flat',
        flat:{slow:324.4, fast:324.4, ultra:347.2} },
      { bid:'EV', name:'에버온', roaming_type:'flat',
        flat:{slow:420, fast:420, ultra:420} },
      { bid:'PI', name:'GS차지비', roaming_type:'flat',
        flat:{slow:450, fast:450, ultra:450} },
      { bid:'ST', name:'SK일렉링크', roaming_type:'flat',
        flat:{slow:465, fast:465, ultra:465}, note:'GS차지비 양방향 공식 협약(2026)' },
      { bid:'SF', name:'스타코프', roaming_type:'partners',
        partners:[
          { bid:'ME',   slow:324.4, fast:324.4, ultra:347.2 },
          { bid:'ST',   slow:null,  fast:485,   ultra:485   },
          { bid:'PI',   slow:450,   fast:450,   ultra:450   },
          { bid:'EPIT', slow:null,  fast:410,   ultra:510   },
          { bid:'CV',   slow:400,   fast:400,   ultra:450   },
          { bid:'SB',   slow:374,   fast:374,   ultra:374   },
          { bid:'HE',   slow:420,   fast:420,   ultra:420   },
          { bid:'TBU',  slow:334,   fast:334,   ultra:334   },
          { bid:'EV',   slow:420,   fast:420,   ultra:420   },
          { bid:'SD',   slow:360,   fast:360,   ultra:450   },
          { bid:'EP',   slow:380,   fast:380,   ultra:380   },
          { bid:'PC',   slow:360,   fast:360,   ultra:360   },
          { bid:'HM',   slow:400,   fast:400,   ultra:460   },
          { bid:'LU',   slow:350,   fast:350,   ultra:350   },
          { bid:'JA',   slow:400,   fast:400,   ultra:460   },
          { bid:'EC',   slow:350,   fast:350,   ultra:420   },
          { bid:'EA',   slow:340,   fast:340,   ultra:400   },
          { bid:'EZ',   slow:380,   fast:380,   ultra:380   },
        ]},
      { bid:'PL', name:'플러그링크', roaming_type:'partners',
        partners:[
          { bid:'ME',   slow:324.4, fast:324.4, ultra:347.2 },
          { bid:'DO',   slow:350,   fast:350,   ultra:370   },
          { bid:'CG',   slow:470,   fast:470,   ultra:470   },
          { bid:'SB',   slow:369,   fast:389,   ultra:409   },
          { bid:'PC',   slow:400,   fast:450,   ultra:450   },
          { bid:'EA',   slow:420,   fast:420,   ultra:450   },
          { bid:'EV',   slow:420,   fast:420,   ultra:420   },
          { bid:'JA',   slow:440,   fast:440,   ultra:440   },
          { bid:'EC',   slow:400,   fast:460,   ultra:460   },
          { bid:'CV',   slow:450,   fast:475,   ultra:475   },
          { bid:'PW',   slow:420,   fast:460,   ultra:460   },
          { bid:'KAEM', slow:324.4, fast:324.4, ultra:347.2 },
          { bid:'HE',   slow:420,   fast:420,   ultra:420   },
          { bid:'HM',   slow:430,   fast:480,   ultra:480   },
          { bid:'PI',   slow:450,   fast:450,   ultra:450   },
          { bid:'LU',   slow:420,   fast:420,   ultra:420   },
          { bid:'NT',   slow:400,   fast:450,   ultra:450   },
        ]},
      { bid:'HM', name:'휴맥스이브이', roaming_type:'partners',
        partners:[
          { bid:'PNES', slow:230, fast:320, ultra:320 },
          { bid:'PLM',  slow:270, fast:320, ultra:320 },
          { bid:'JE',   slow:280, fast:340, ultra:340 },
          { bid:'JDO',  slow:320, fast:320, ultra:320 },
          { bid:'KP',   slow:324, fast:347, ultra:347 },
          { bid:'ME',   slow:324.4, fast:347.2, ultra:347.2 },
          { bid:'WJ',   slow:347, fast:347, ultra:347 },
          { bid:'HY',   slow:350, fast:430, ultra:430 },
          { bid:'KE',   slow:360, fast:420, ultra:420 },
          { bid:'DY',   slow:370, fast:460, ultra:460 },
          { bid:'KL',   slow:380, fast:460, ultra:460 },
          { bid:'PW',   slow:400, fast:400, ultra:400 },
          { bid:'SF',   slow:400, fast:460, ultra:460 },
          { bid:'EL',   slow:400, fast:400, ultra:400 },
          { bid:'PI',   slow:420, fast:480, ultra:480 },
          { bid:'EV',   slow:420, fast:420, ultra:420 },
          { bid:'HE',   slow:420, fast:420, ultra:420 },
          { bid:'EPIT', slow:null,fast:410, ultra:510 },
          { bid:'PL',   slow:430, fast:480, ultra:480 },
          { bid:'EO',   slow:430, fast:450, ultra:450 },
          { bid:'ST',   slow:430, fast:480, ultra:480 },
          { bid:'LU',   slow:460, fast:460, ultra:460 },
        ]},
    ]
  };
  window.__ROAMING_ROWS = ROAMING_MATRIX.rows;
  window.__ROAMING_COLS = ROAMING_MATRIX.cols;

  // ── 로밍 요금 표 (v0.12 [27~33] 다중카드 선택·8속도 탭·계약기반 합집합 필터·행별 최저/최대 강조 · 더미데이터) ──
  // 로밍은 출력별로 금액이 달라지지 않음 → 5밴드(라벨 일관성)만 유지, 출력별 오프셋 제거
  const ROAM_SPEEDS = [
    {key:'slow',    label:'완속',           grp:'slow',  tier:'slow'},
    {key:'mid',     label:'중속',           grp:'mid',   tier:'slow'},
    {key:'fast50',  label:'급속 100kW미만',  grp:'fast',  tier:'fast'},
    {key:'fast100', label:'급속 100kW이상',  grp:'fast',  tier:'fast'},
    {key:'ultra',   label:'초급속',         grp:'ultra', tier:'ultra'},
  ];
  const ROAM_SPEED_OFFSET = {};
  // 카드별 계약(보유) 속도 — 예시 더미데이터
  const ROAM_CONTRACTS = {
    ME:['f50','f100','u200','u350'], NT:['s7','s11','f50','f100'],
    EV:['s35','s7','s11','mid','f50','f100','u200','u350'], PI:['s7','s11','f50','f100','u200'],
    ST:['f50','f100','u200','u350'], SF:['s35','s7','s11'],
    PL:['s35','s7','s11','mid'], HM:['s7','s11','f50','f100','u200','u350'],
  };
  const roamContract = (bid) => ROAM_CONTRACTS[bid] || ROAM_SPEEDS.map(s=>s.key);
  const roamTierOf = (k) => { const s=ROAM_SPEEDS.find(x=>x.key===k); return s?s.tier:'fast'; };
  function roamFee(card, col, speedKey){
    const tier = roamTierOf(speedKey), tkey = tier + '_m';
    let base = null;
    if (col.bid === card.bid) base = col[tkey];
    else if (card.roaming_type === 'free'){ const G={slow:324.4,fast:324.4,ultra:347.2}; base = G[tier]; }
    else if (card.roaming_type === 'flat') base = card.flat ? card.flat[tier] : null;
    else if (card.roaming_type === 'partners'){ const p=(card.partners||[]).find(pp=>pp.bid===col.bid); base = p ? p[tier] : null; }
    if (base == null) return null;
    return Math.round((base + (ROAM_SPEED_OFFSET[speedKey]||0)) * 10) / 10;
  }

  let roamSelected = new Set();
  let roamSpeed = 'slow';

  // 계약된 출력만 노출 로직 제거 → 전 밴드 모두 노출 (로밍은 출력별 금액 불변)
  function roamVisibleSpeeds(){
    return ROAM_SPEEDS.map(s=>s.key);
  }
  // 체크박스형 멀티셀렉트 드롭다운(검색 포함) — CPO 수십 개 다중선택·모바일 접근성
  function renderRoamCardSelect(){
    const box = document.getElementById('roaming-card-select');
    if(!box) return;
    const rows = ROAMING_MATRIX.rows;
    if(!document.getElementById('roamDdBtn')){
      box.innerHTML =
        '<div class="roam-dd">'
        +  '<button type="button" id="roamDdBtn" class="roam-card-dd roam-dd-btn" aria-haspopup="true" aria-expanded="false" aria-controls="roamDdPanel"><span id="roamDdLabel">내 카드 선택</span></button>'
        +  '<div id="roamDdPanel" class="roam-dd-panel" role="group" aria-label="내 카드 목록" hidden>'
        +    '<div class="roam-dd-search"><input type="text" id="roamDdSearch" placeholder="카드명 검색…" aria-label="카드명 검색" autocomplete="off"></div>'
        +    '<ul class="roam-dd-list" id="roamDdList">'
        +      rows.map(function(c){ return '<li><label class="roam-dd-item"><input type="checkbox" data-roamcb="'+c.bid+'"><span>'+c.name+' <small>'+c.bid+'</small></span></label></li>'; }).join('')
        +    '</ul>'
        +    '<div class="roam-dd-foot"><button type="button" class="roam-card-clear" data-roamclear="1">전체 해제</button><button type="button" class="roam-dd-close" data-roamclose="1">닫기</button></div>'
        +  '</div>'
        + '</div>'
        + '<div class="roam-card-tags" id="roamCardTags"></div>';
    }
    syncRoamCardUI();
  }
  function syncRoamCardUI(){
    const rows = ROAMING_MATRIX.rows;
    document.querySelectorAll('#roamDdList [data-roamcb]').forEach(function(cb){ cb.checked = roamSelected.has(cb.getAttribute('data-roamcb')); });
    var lbl = document.getElementById('roamDdLabel');
    if(lbl) lbl.textContent = roamSelected.size ? ('내 카드 ' + roamSelected.size + '개 선택') : '내 카드 선택';
    var tags = document.getElementById('roamCardTags');
    if(tags){
      tags.innerHTML = Array.from(roamSelected).map(function(bid){
        var c = rows.find(function(x){return x.bid===bid;}); if(!c) return '';
        return '<span class="roam-card-tag"><span>'+c.name+'</span><button type="button" class="roam-card-tag-x" data-roamremove="'+c.bid+'" aria-label="'+c.name+' 선택 제거">✕</button></span>';
      }).join('') + (roamSelected.size ? '<button type="button" class="roam-card-clear" data-roamclear="1">전체 해제</button>' : '');
    }
  }
  function renderRoamTabs(){
    const tabs = document.getElementById('roaming-tier-tabs');
    if(!tabs) return;
    const vis = roamVisibleSpeeds();
    if(!vis.includes(roamSpeed)) roamSpeed = vis[0] || ROAM_SPEEDS[0].key;
    tabs.innerHTML = vis.map(k=>{
      const s = ROAM_SPEEDS.find(x=>x.key===k);
      return `<button type="button" class="tab${k===roamSpeed?' active':''}" data-rspeed="${k}">${s.label}</button>`;
    }).join('');
  }
  function renderRoamTable(){
    const wrap = document.getElementById('roaming-wrap');
    if(!wrap) return;
    const STICKY_TH='position:sticky;top:0;z-index:3;background:#f8fafc;box-shadow:0 1px 0 #e2e8f0;';
    const STICKY_CORNER='position:sticky;top:0;left:0;z-index:5;background:#f8fafc;box-shadow:1px 1px 0 #e2e8f0;';
    const STICKY_COL='position:sticky;left:0;z-index:2;background:#fff;box-shadow:1px 0 0 #f0f0f0;';
    const cols = ROAMING_MATRIX.cols;
    const TOU_BIDS = ['ME','KP','EV'];  // 계절시간제 적용 사업자 (전기차 충전요금 > 계절시간제 탭 참조)
    const touBadge = `<span title="계절시간제 적용 — 시간대별 단가는 [전기차 충전 요금]의 계절시간제 탭 참조" style="display:inline-block;margin-left:5px;padding:1px 6px;border-radius:5px;font-size:10px;font-weight:700;background:var(--color-primary-50);color:var(--color-primary-700);border:1px solid var(--color-primary-200);vertical-align:middle;">계시</span>`;
    const rows = roamSelected.size ? ROAMING_MATRIX.rows.filter(c=>roamSelected.has(c.bid)) : ROAMING_MATRIX.rows;
    const corner = `<th style="${STICKY_CORNER}padding:0;min-width:172px;height:64px;">`
      + `<div style="position:relative;width:172px;height:64px;">`
      + `<svg viewBox="0 0 172 64" preserveAspectRatio="none" style="position:absolute;inset:0;width:100%;height:100%;" aria-hidden="true"><line x1="0" y1="0" x2="172" y2="64" stroke="#cbd5e1" stroke-width="1" vector-effect="non-scaling-stroke"/></svg>`
      + `<span style="position:absolute;top:7px;right:12px;font-size:12px;font-weight:600;color:var(--color-gray-600);">충전기 사업자</span>`
      + `<span style="position:absolute;bottom:7px;left:12px;font-size:12px;font-weight:600;color:var(--color-gray-600);">내 카드</span>`
      + `</div></th>`;
    const colThs = cols.map(c=>`<th class="num" style="${STICKY_TH}font-size:13px;font-weight:600;color:var(--color-gray-700);white-space:nowrap;padding:10px 12px;">${c.name}${TOU_BIDS.indexOf(c.bid)>=0?touBadge:''}<br><small style="font-weight:500;color:var(--color-gray-400);font-size:11px;">${c.bid}</small></th>`).join('');
    const CELL='width:84px;min-width:84px;max-width:84px;height:48px;padding:6px 8px;text-align:center;vertical-align:middle;white-space:nowrap;font-variant-numeric:tabular-nums;';
    const tbody = rows.map(card=>{
      const fees = cols.map(col=>roamFee(card,col,roamSpeed));
      const nums = fees.filter(v=>v!=null);
      const mn = nums.length?Math.min.apply(null,nums):null;
      const mx = nums.length?Math.max.apply(null,nums):null;
      const uniform = (mn!=null && mn===mx);
      const cells = fees.map(v=>{
        if(v==null) return `<td class="num" style="${CELL}background:#FAFBFC;color:#CBD5E1;font-weight:400;">—</td>`;
        let bg='#fff',color='#374151',fw='600';
        if(!uniform && v===mn){ bg='#F0FDF4'; color='#166534'; fw='700'; }
        else if(!uniform && v===mx){ bg='#FEF2F2'; color='#991B1B'; fw='700'; }
        return `<td class="num" style="${CELL}background:${bg};color:${color};font-weight:${fw};"><span style="font-size:14.5px;">${v}</span></td>`;
      }).join('');
      return `<tr style="height:50px;"><td style="${STICKY_COL}padding:10px 14px;white-space:nowrap;min-width:172px;"><strong style="font-size:14.5px;color:var(--text-primary);">${card.name}</strong> <small style="color:var(--color-gray-400);font-size:11.5px;font-weight:500;">${card.bid}</small></td>${cells}</tr>`;
    }).join('');
    const emptyMsg = rows.length ? '' : `<div style="padding:28px;text-align:center;color:var(--color-gray-500);font-size:14px;">선택한 카드가 없습니다.</div>`;
    wrap.innerHTML = `<table class="data-table" style="border:none;border-collapse:collapse;overflow:visible;"><thead><tr style="height:64px;">${corner}${colThs}</tr></thead><tbody>${tbody}</tbody></table>${emptyMsg}`;
  }
  function renderRoaming(){ renderRoamCardSelect(); renderRoamTabs(); renderRoamTable(); }
  window.__renderRoaming = renderRoaming;

  (function initRoaming(){
    const cardBox = document.getElementById('roaming-card-select');
    const tabBox  = document.getElementById('roaming-tier-tabs');
    if(cardBox){
      function openDd(on){
        var p=document.getElementById('roamDdPanel'), b=document.getElementById('roamDdBtn');
        if(!p||!b) return;
        p.hidden = !on; b.setAttribute('aria-expanded', on?'true':'false');
        if(on){ var s=document.getElementById('roamDdSearch'); if(s){ s.value=''; filterDd(''); setTimeout(function(){s.focus();},0); } }
      }
      function filterDd(q){
        q=(q||'').trim().toLowerCase();
        document.querySelectorAll('#roamDdList li').forEach(function(li){
          var t=li.textContent.toLowerCase();
          li.style.display = (!q || t.indexOf(q)>=0) ? '' : 'none';
        });
      }
      cardBox.addEventListener('click', e=>{
        if(e.target.closest('#roamDdBtn')){ var open=document.getElementById('roamDdPanel').hidden; openDd(open); return; }
        if(e.target.closest('[data-roamclose]')){ openDd(false); return; }
        const clr = e.target.closest('[data-roamclear]');
        if(clr){ roamSelected.clear(); renderRoaming(); return; }
        const rm = e.target.closest('[data-roamremove]');
        if(rm){ roamSelected.delete(rm.getAttribute('data-roamremove')); renderRoaming(); return; }
      });
      // 체크박스 토글 → 선택 갱신 (드롭다운은 열린 채 유지)
      cardBox.addEventListener('change', e=>{
        var cb = e.target.closest('[data-roamcb]'); if(!cb) return;
        var bid = cb.getAttribute('data-roamcb');
        if(cb.checked) roamSelected.add(bid); else roamSelected.delete(bid);
        renderRoamTabs(); renderRoamTable(); syncRoamCardUI();
      });
      // 검색 필터
      cardBox.addEventListener('input', e=>{ if(e.target.id==='roamDdSearch') filterDd(e.target.value); });
      // 외부 클릭 / ESC 닫기
      document.addEventListener('click', e=>{ if(!e.target.closest('#roaming-card-select')) openDd(false); });
      document.addEventListener('keydown', e=>{ if(e.key==='Escape') openDd(false); });
    }
    if(tabBox){
      tabBox.addEventListener('click', e=>{
        const t = e.target.closest('[data-rspeed]');
        if(t){ roamSpeed = t.getAttribute('data-rspeed'); renderRoamTabs(); renderRoamTable(); }
      });
    }
    renderRoaming();
  })();

  // ── 충전비용 시뮬레이터 ────────────────────────────────────────────
  (function initSimulator() {
    const cardSel    = document.getElementById('simCard');
    const chargerSel = document.getElementById('simCharger');
    const nonmemberToggle = document.getElementById('simNonmember');
    // 회원유형 자동: 비회원 토글 ON → 비회원 / OFF → 회원(카드=충전기 자사, 카드≠충전기 로밍)
    function isNonmember(){ return !!(nonmemberToggle && nonmemberToggle.checked); }
    const speedSel   = document.getElementById('simSpeed');
    const condRow    = document.getElementById('simConditionRow');
    const condSel    = document.getElementById('simCondition');
    const touBlock   = document.getElementById('simTouInputs');
    const seasonSel  = document.getElementById('simSeason');
    const daySel     = document.getElementById('simDay');
    const hourInput  = document.getElementById('simHour');
    const hourLabel  = document.getElementById('simHourVal');
    const kwhInput   = document.getElementById('simKwh');
    // [DEV] 계절시간제 할인 = TNCC_RMNG_SEAS_FEE(SEAS_SE 시즌·DAY_TYPE 요일·STRT_HR~END_HR·DSCNT_SE 방식·DSCNT_VAL 값·TRGT_SE 대상·CTYPE 용량)
    //  (계절·요일·시각)이 규칙 창에 들고 출력밴드(cap)가 대상이면 기본단가에 할인 적용. 겹치면 SEQ 큰 규칙이 덮어씀. 부하 3단(경/중/최대) 아님. / 더미
    //  mode: percent(정률 base×(1−값/100))·amount(정액 base−값)·fixed(고정 값) · cap: 급속/완속 · target: 회원/공통 · base: 기본단가 미공시 시 대체
    const SIM_TOU_RULES = [
      { bid:'ST', seq:1, seasons:['여름'],   days:['weekday'],                     startHr:22, endHr:8,  cap:'급속', mode:'percent', value:20,   target:'회원', base:null   },
      { bid:'KP', seq:1, seasons:['봄·가을'], days:['weekday','saturday','sunday'], startHr:23, endHr:9,  cap:'완속', mode:'amount',  value:48.6, target:'공통', base:307.5 },
      { bid:'ME', seq:1, seasons:['봄·가을'], days:['saturday'],                    startHr:11, endHr:14, cap:'급속', mode:'amount',  value:48.6, target:'회원', base:null   }
    ];
    // 출력밴드 → 용량구분(CTYPE)
    const BAND_CAP = { slow:'완속', mid:'중속', fast50:'급속', fast100:'급속', ultra:'급속' };
    // 출력밴드 → 대표 출력(kW) — 충전시간(=충전량÷출력) 산출용
    const BAND_KW = { slow:7, mid:14, fast50:50, fast100:100, ultra:200 };
    // 시각 창 매칭(자정 넘김 지원): start<=end → [start,end), 아니면 [start,24)∪[0,end)
    function inHourWindow(h, s, e){ return s <= e ? (h >= s && h < e) : (h >= s || h < e); }
    function hasTouRule(bid){ return SIM_TOU_RULES.some(r => r.bid === bid); }
    // (계절·요일·시각·용량밴드) 매칭 규칙 → 겹치면 SEQ 큰 규칙 우선
    function matchTouRule(bid, season, day, hour, speed){
      const cap = BAND_CAP[speed];
      const hits = SIM_TOU_RULES.filter(r => r.bid === bid
        && r.seasons.indexOf(season) >= 0 && r.days.indexOf(day) >= 0
        && inHourWindow(hour, r.startHr, r.endHr) && r.cap === cap);
      return hits.length ? hits.sort((a, b) => b.seq - a.seq)[0] : null;
    }
    // 완속 등 기본단가 미공시 시 규칙 base로 대체
    function touBaseFallback(bid, speed){
      const cap = BAND_CAP[speed];
      const r = SIM_TOU_RULES.find(x => x.bid === bid && x.cap === cap && x.base != null);
      return r ? r.base : null;
    }
    function applyTouMode(base, mode, v){
      if (mode==='percent') return Math.round(base*(1-v/100)*10)/10;
      if (mode==='fixed')   return v;
      return Math.round((base-v)*10)/10;
    }
    const kwhLabel   = document.getElementById('simKwhVal');
    const priceEl    = document.getElementById('simPrice');
    const rateEl     = document.getElementById('simRateLine');
    const noteEl     = document.getElementById('simNote');
    const lblEl      = document.getElementById('simLbl');
    const brandSel   = document.getElementById('simBrand');
    const modelSel   = document.getElementById('simModel');
    const modelInfo  = document.getElementById('simModelInfo');
    const batteryEl  = document.getElementById('simBatteryVal');
    const socEl      = document.getElementById('simSocVal');
    if (!cardSel || !chargerSel) return;

    const EV_MODELS = {
      '현대': [
        { name:'아이오닉 5', battery:77.4, soc:'표출 가능' },
        { name:'아이오닉 6', battery:77.4, soc:'표출 가능' },
        { name:'코나 일렉트릭', battery:64.8, soc:'부분 표출' },
        { name:'캐스퍼 일렉트릭', battery:49.0, soc:'표출 가능' },
      ],
      '기아': [
        { name:'EV6', battery:77.4, soc:'표출 가능' },
        { name:'EV9', battery:99.8, soc:'표출 가능' },
        { name:'EV3', battery:81.4, soc:'표출 가능' },
        { name:'니로 EV', battery:64.8, soc:'부분 표출' },
      ],
      'KG모빌리티': [
        { name:'토레스 EVX', battery:73.4, soc:'부분 표출' },
        { name:'코란도 EV', battery:61.5, soc:'부분 표출' },
      ],
    };

    Object.keys(EV_MODELS).forEach(brand => {
      const o = document.createElement('option');
      o.value = brand; o.textContent = brand;
      brandSel.appendChild(o);
    });

    function onBrandChange() {
      const brand = brandSel.value;
      modelSel.innerHTML = '<option value="">선택</option>';
      if (!brand) {
        modelSel.innerHTML = '<option value="">제조사 먼저 선택</option>';
        modelInfo.style.display = 'none';
        return;
      }
      EV_MODELS[brand].forEach((m, i) => {
        const o = document.createElement('option');
        o.value = i; o.textContent = `${m.name} (${m.battery} kWh)`;
        modelSel.appendChild(o);
      });
    }
    function onModelChange() {
      const brand = brandSel.value;
      const idx = modelSel.value;
      if (!brand || idx === '') { modelInfo.style.display = 'none'; return; }
      const m = EV_MODELS[brand][parseInt(idx)];
      if (!m) { modelInfo.style.display = 'none'; return; }
      modelInfo.style.display = 'flex';
      batteryEl.textContent = m.battery + ' kWh';
      socEl.innerHTML = m.soc === '표출 가능'
        ? '<span style="color:#15803d;">✓ 표출 가능</span>'
        : '<span style="color:#b45309;">△ ' + m.soc + '</span>';
      const maxKwh = Math.ceil(m.battery);
      kwhInput.max = maxKwh;
      kwhInput.value = Math.round(m.battery * 0.95);
      update();
    }
    function getSelectedBattery() {
      const brand = brandSel.value;
      const idx = modelSel.value;
      if (!brand || idx === '') return null;
      const m = EV_MODELS[brand]?.[parseInt(idx)];
      return m ? m.battery : null;
    }
    brandSel.addEventListener('change', onBrandChange);
    modelSel.addEventListener('change', onModelChange);

    // 5밴드 통일 — 단가는 매트릭스 8필드를 밴드별 srcs로 매핑(완속←s7→s11→s35 / 중속←mid / 급속100미만←f50 / 급속100이상←f100 / 초급속←u200→u350)
    const SIM_BANDS = [
      { key:'slow',    label:'완속',           srcs:['s7','s11','s35'], roamTier:'slow'  },
      { key:'mid',     label:'중속',           srcs:['mid'],            roamTier:'slow'  },
      { key:'fast50',  label:'급속 100kW미만',  srcs:['f50'],            roamTier:'fast'  },
      { key:'fast100', label:'급속 100kW이상',  srcs:['f100'],           roamTier:'fast'  },
      { key:'ultra',   label:'초급속',         srcs:['u200','u350'],    roamTier:'ultra' },
    ];
    const bandSrcVal = (op, bk) => { const b=SIM_BANDS.find(x=>x.key===bk); if(!b||!op) return null; for(let i=0;i<b.srcs.length;i++){ if(op[b.srcs[i]]!=null) return op[b.srcs[i]]; } return null; };
    const bandRoamTier = (bk) => { const b=SIM_BANDS.find(x=>x.key===bk); return b?b.roamTier:'fast'; };

    const allOps = ROAMING_MATRIX.cols.slice();
    const optHtml = allOps.map(o => {
      const hasFee = MATRIX.basic.some(r => r.bid === o.bid);
      const mark = hasFee ? '' : ' ⚠';
      return `<option value="${o.bid}">${o.name} (${o.bid})${mark}</option>`;
    }).join('');
    cardSel.innerHTML = optHtml;
    chargerSel.innerHTML = optHtml;
    cardSel.value = 'ME';
    chargerSel.value = 'ST';

    // 회원: 결제카드·이용충전기 모두 선택 가능(다르면 로밍 자동 반영) · 비회원: 이용충전기만
    function syncCardCharger() {
      if (isNonmember()) {
        cardSel.disabled = true;
        chargerSel.disabled = false;
      } else {
        cardSel.disabled = false;
        chargerSel.disabled = false;
      }
    }
    // 로밍 자동 판정: 회원 + 결제카드(발급) ≠ 이용충전기(운영)
    function isRoamingNow() {
      return !isNonmember() && cardSel.value !== chargerSel.value;
    }

    // 출력 5밴드 — 라벨만(단가는 결과 흐름에 표시)
    function rebuildSpeedDropdown() {
      const prev = speedSel.value;
      speedSel.innerHTML = SIM_BANDS.map(c => `<option value="${c.key}">${c.label}</option>`).join('');
      speedSel.value = SIM_BANDS.some(c => c.key === prev) ? prev : 'fast50';
    }

    // 계절시간제 규칙 적용 대상: 회원 + 결제카드=이용충전기(자사) + 규칙 보유
    function touActive() {
      return !isNonmember() && cardSel.value === chargerSel.value && hasTouRule(cardSel.value);
    }
    function rebuildConditionRow() {
      const nonOrRoam = isNonmember() || isRoamingNow();
      const specials = nonOrRoam ? [] : MATRIX.special.filter(s => s.bid === cardSel.value);
      // 특례(조건) 드롭다운 — 특례 보유 시에만 노출
      const condField = document.getElementById('simCondField');
      if (specials.length) {
        let opts = '<option value="">기본 (조건 없음)</option>';
        specials.forEach((s, i) => { opts += `<option value="special:${i}">${s.note || ('조건 '+(i+1))}</option>`; });
        condSel.innerHTML = opts;
        if (condField) condField.style.display = '';
      } else {
        condSel.innerHTML = '<option value="">기본 (조건 없음)</option>'; condSel.value = '';
        if (condField) condField.style.display = 'none';
      }
      // 계절·요일·시각 — 상시 표시. 규칙 없으면(평단가·비회원·로밍) 비활성 + 안내
      const disabled = !touActive();
      [seasonSel, daySel, hourInput].forEach(el => { if (el) el.disabled = disabled; });
      if (touBlock) touBlock.classList.toggle('is-disabled', disabled);
      const touNote = document.getElementById('simTouNote');
      if (touNote) touNote.hidden = !disabled;
    }

    function calcRate(hourOverride) {
      const cardBid = cardSel.value;
      const chargerBid = chargerSel.value;
      const m = isNonmember() ? 'nonmember' : 'member';
      const speed = speedSel.value;
      const cardOp = MATRIX.basic.find(r => r.bid === cardBid);
      const chargerOp = MATRIX.basic.find(r => r.bid === chargerBid);
      const nmOf = (bid, op) => op?.name || ROAMING_MATRIX.cols.find(c=>c.bid===bid)?.name || bid;
      const chargerNm = nmOf(chargerBid, chargerOp);
      const cardNm = nmOf(cardBid, cardOp);

      // [DEV] 비회원 = TNCC_RMNG_RTCPCTY_FEE(이용충전기 운영사·정격용량구간, NONMEMBER_FEE) / 더미
      if (m === 'nonmember') {
        if (!chargerOp || chargerOp.nmr == null) return { applied:null, roaming:false, note:`${chargerNm} 비회원 요금 미공시` };
        return { base:chargerOp.nmr, applied:chargerOp.nmr, disc:null, roaming:false, note:`${chargerNm} 비회원 단일가` };
      }

      // 회원 — 결제카드(발급) ≠ 이용 충전기(운영)면 로밍 자동 반영(안내멘트 없음)
      if (cardBid !== chargerBid) {
        // [DEV] 로밍단가 = TNCC_RMNG_CHRGNG_UNTPC.TARINSP_UNTPC(발급 BID × 운영 TBID × 용량구간, 협약 R_BUSI_REQ 활성) / 더미
        const tier = bandRoamTier(speed);
        const cardRow = ROAMING_MATRIX.rows.find(r => r.bid === cardBid);
        let r = null;
        if (cardRow) {
          if (cardRow.roaming_type === 'free') { const G = { slow:324.4, fast:324.4, ultra:347.2 }; r = G[tier]; }
          else if (cardRow.roaming_type === 'flat') { r = cardRow.flat ? (cardRow.flat[tier] ?? null) : null; }
          else if (cardRow.roaming_type === 'partners') { const p = (cardRow.partners || []).find(pp => pp.bid === chargerBid); r = p ? (p[tier] ?? null) : null; }
        }
        if (r == null) return { applied:null, roaming:true, note:`${cardNm} → ${chargerNm} 로밍 요금 미공시` };
        return { base:r, applied:r, disc:null, roaming:true, note:`${cardNm} 카드로 ${chargerNm} 충전기 이용` };
      }

      // 회원 — 자사(결제카드 = 이용 충전기)
      if (!cardOp) return { applied:null, roaming:false, note:'사업자 요금 미공시' };
      const cv = condSel?.value || '';
      // [DEV] 기본단가 = TNCC_RMNG_RTCPCTY_FEE(자사·정격용량구간, MEMBER_FEE) · special=서울시 설치지원 등 대체단가 / 더미
      let base = bandSrcVal(cardOp, speed);
      if (cv.startsWith('special:')) {
        const idx = parseInt(cv.split(':')[1]);
        const sp = MATRIX.special.filter(s => s.bid === cardBid)[idx];
        if (sp) { const sr = bandSrcVal(sp, speed); if (sr != null) base = sr; }
      }
      if (base == null) base = touBaseFallback(cardBid, speed); // 완속 등 기본단가 미공시 시 규칙 base
      if (base == null) return { applied:null, roaming:false, note:`${cardNm} 해당 출력 요금 미공시` };

      // [DEV] 할인 = TNCC_RMNG_SEAS_FEE(SEAS_SE·DAY_TYPE·STRT_HR~END_HR·DSCNT_SE·DSCNT_VAL·CTYPE) 매칭 → SEQ 큰 규칙 적용 / 더미
      let applied = base, disc = null;
      const seasonMap = { spring_fall:'봄·가을', summer:'여름', winter:'겨울' };
      const _hr = (hourOverride != null) ? hourOverride : parseInt(hourInput.value, 10);
      const rule = matchTouRule(cardBid, seasonMap[seasonSel.value], daySel ? daySel.value : 'weekday', _hr, speed);
      if (rule) {
        applied = applyTouMode(base, rule.mode, rule.value); // 정액 base−값 / 정률 base×(1−값/100) / 고정 값
        disc = { mode:rule.mode, value:rule.value, cut:Math.round((base - applied) * 10) / 10 };
      }
      return { base, applied, disc, roaming:false, note:`${cardNm} 회원 자사 요금` };
    }

    // [DEV] 안내 산식 = 구간 분할 합산(공급 시점 단가 원칙). 실제 과금의 경계 처리 방식(시작시각 고정/분할/기타)은
    //       CPO·로밍 정산 정책으로 DB·소스에 미정의(정산 서버 미추출) → 백엔드 개발 시 정산 주체와 확정 필요.
    //       확정 전까지 시뮬레이터는 '분할 안내가' 기준(시작시각 고정 적용 금지 — 왜곡 안내).
    //  충전시간 = 충전량÷출력 → [시작~종료]를 계절시간제 시간대 경계로 분할 → 세그먼트별 kWh×적용단가 합산(자정 넘김 포함).
    function fmtHM(hf) {
      const hh = ((Math.floor(hf) % 24) + 24) % 24;
      let m = Math.round((hf - Math.floor(hf)) * 60), h = hh;
      if (m === 60) { m = 0; h = (h + 1) % 24; }
      return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
    }
    function calcSegments(kwh) {
      const R0 = calcRate();  // 기본단가·적용유형(비회원/로밍/자사) 판정 + 안내문구
      if (R0.applied == null) return { applied: null, note: R0.note, segments: [] };
      const kW = BAND_KW[speedSel.value] || 50;
      const dur = kwh / kW;                       // 충전시간(h)
      const start = parseInt(hourInput.value, 10);
      // 계절시간제 미적용(비회원·로밍·규칙 없음) → 단일 구간
      if (!touActive()) {
        const amount = Math.round(R0.applied * kwh);
        return { total: amount, base: R0.base, applied: R0.applied, disc: R0.disc, note: R0.note, split: false,
          segments: [{ t0: start, t1: start + dur, hours: dur, kwh: kwh, applied: R0.applied, base: R0.base, disc: R0.disc, amount }] };
      }
      // 자사 회원 + 규칙 보유 → 시각 경계로 세그먼트 분할(자정 넘김 포함)
      let t = start, rem = dur; const raw = []; let guard = 0;
      while (rem > 1e-6 && guard++ < 240) {
        const hb = ((Math.floor(t) % 24) + 24) % 24;
        const R = calcRate(hb);
        const nextB = Math.floor(t + 1e-9) + 1;   // 다음 정시 경계
        const t1 = Math.min(t + rem, nextB);
        raw.push({ t0: t, t1: t1, hours: t1 - t, applied: R.applied, base: R.base, disc: R.disc });
        rem -= (t1 - t); t = t1;
      }
      // 인접 동일단가 병합
      const merged = [];
      raw.forEach(s => {
        const sig = s.applied + '|' + (s.disc ? (s.disc.mode + s.disc.value) : 'n');
        const last = merged[merged.length - 1];
        if (last && last.sig === sig) { last.t1 = s.t1; last.hours += s.hours; }
        else merged.push(Object.assign({ sig }, s));
      });
      merged.forEach(s => { s.kwh = s.hours * kW; s.amount = Math.round(s.applied * s.kwh); });
      const total = merged.reduce((a, s) => a + s.amount, 0);
      return { total, base: R0.base, applied: R0.applied, disc: R0.disc, note: R0.note, split: merged.length > 1, segments: merged };
    }
    function renderSegments(SEG, kwh) {
      const host = document.getElementById('simSegments');
      if (!host) return;
      if (!SEG.segments || !SEG.segments.length) { host.innerHTML = ''; host.hidden = true; return; }
      host.hidden = false;
      const r1 = (v) => Math.round(v * 10) / 10;
      const rows = SEG.segments.map(s => {
        const rate = s.disc
          ? `<span class="seg-base">${s.base}</span> <span class="seg-arrow">→</span> <strong>${s.applied}</strong> <span class="seg-disc">할인</span>`
          : `<strong>${s.applied}</strong>`;
        return `<tr><td>${fmtHM(s.t0)}~${fmtHM(s.t1)}</td><td class="num">${rate} <span class="seg-unit">원/kWh</span></td><td class="num">${r1(s.kwh)} kWh</td><td class="num">${s.amount.toLocaleString()}원</td></tr>`;
      }).join('');
      host.innerHTML = `<div class="seg-title">시간대별 적용 내역${SEG.split ? ' <span class="seg-split-badge">구간 분할</span>' : ''}</div>`
        + `<div style="overflow-x:auto;"><table class="seg-table"><thead><tr><th>시간 구간</th><th class="num">적용 단가</th><th class="num">충전량</th><th class="num">금액</th></tr></thead>`
        + `<tbody>${rows}</tbody>`
        + `<tfoot><tr><td>합계</td><td></td><td class="num">${r1(kwh)} kWh</td><td class="num"><strong>${SEG.total.toLocaleString()}원</strong></td></tr></tfoot></table></div>`;
    }

    const bandLabelOf = (k) => { const b = SIM_BANDS.find(x => x.key === k); return b ? b.label : k; };
    // 계산 조건(통합) — 결제카드·이용충전기(+출력)·회원구분·계절·요일·시각
    function condRows() {
      const nmOf = (bid) => MATRIX.basic.find(r => r.bid === bid)?.name || ROAMING_MATRIX.cols.find(c => c.bid === bid)?.name || bid;
      const isNon = isNonmember();
      // 회원구분: 비회원 / 로밍(카드≠충전기) / 회원 자동 반영
      const memLbl = isNon ? '비회원' : (isRoamingNow() ? '로밍' : '회원');
      const rows = [
        ['결제카드', isNon ? '—' : nmOf(cardSel.value)],
        ['이용 충전기', `${nmOf(chargerSel.value)} · ${bandLabelOf(speedSel.value)}`],
        ['회원구분', memLbl]
      ];
      // 계절시간제 적용 사업자(자사)일 때만 계절·요일·시각 노출
      if (touActive()) {
        rows.push(['계절', { spring_fall:'봄·가을', summer:'여름', winter:'겨울' }[seasonSel.value]]);
        rows.push(['요일', { weekday:'평일', saturday:'토요일', sunday:'일·공휴일' }[daySel.value]]);
        rows.push(['시각', `${parseInt(hourInput.value, 10)}시`]);
      }
      return rows.map(r => `<dt>${r[0]}</dt><dd>${r[1]}</dd>`).join('');
    }
    function update() {
      const kwh = parseInt(kwhInput.value);
      const battery = getSelectedBattery();
      kwhLabel.textContent = battery ? `${kwh} kWh (${Math.round(kwh / battery * 100)}%)` : `${kwh} kWh`;
      if (hourLabel && hourInput) hourLabel.textContent = `${parseInt(hourInput.value, 10)}시`;

      const R = calcRate();
      // A 명칭(ISS-020): 결과 라벨 = '예상 금액'(안내가/추정 구분). i18n 값 사용, 안내가 배지는 별도 span이라 유지
      const _simLbl = (window.__i18n && window.__i18n.t) ? window.__i18n.t('charging.fee.sim.result.lbl') : '1회 충전 예상 금액';
      const _lblText = document.getElementById('simLblText');
      if (_lblText) _lblText.textContent = _simLbl;
      else if (lblEl) lblEl.textContent = _simLbl;

      const flowEl = document.getElementById('simRateFlow');
      const helpEl = document.getElementById('simRateHelp');
      const condEl = document.getElementById('simCond');

      if (R.applied == null) {
        priceEl.textContent = '—';
        if (flowEl) flowEl.innerHTML = '<span class="base">단가 미공시</span>';
        if (helpEl) helpEl.textContent = '';
        noteEl.innerHTML = `<span style="color:#b91c1c;">⚠ ${R.note || '요금 미공시'}</span>`;
        renderSegments({ segments: [] });   // 미공시 → 내역 숨김
      } else {
        // 총액 = 구간 분할 합산(경계 걸침 시 단순 단가×kWh와 다를 수 있음) · '약' prefix(안내가)
        const SEG = calcSegments(kwh);
        priceEl.textContent = `약 ${SEG.total.toLocaleString()}원`;
        renderSegments(SEG, kwh);
        // 결과 최초 산정 1회만 스트립 펄스(세션 내 재계산 시 재펄스 없음)
        if (window.FeeDisclaimer) window.FeeDisclaimer.pulse(document.getElementById('feeStripSim'), 'fee-sim');
        if (flowEl) {
          if (R.disc) {
            // 기본단가 → [할인 배지] → 적용단가 (할인규칙 있을 때만)
            const badge = R.disc.mode === 'percent' ? `−${R.disc.value}%`
                        : R.disc.mode === 'fixed'   ? `고정 ${R.disc.value}원`
                        : `−${R.disc.value}원`;
            flowEl.innerHTML = `<span class="base struck">${R.base}</span><span class="arrow">→</span><span class="badge">${badge}</span><span class="arrow">→</span><span class="applied">${R.applied}</span>`;
          } else {
            // 로밍·평단가 등 할인 없음 → 계산된 적용단가만 표기
            flowEl.innerHTML = `<span class="applied">${R.applied}</span>`;
          }
        }
        if (helpEl) helpEl.textContent = R.disc ? `${R.disc.cut}원/kWh 할인 · 단위 원/kWh` : '단위 원/kWh';
        noteEl.textContent = ''; // 로밍/회원 설명 문구 표기하지 않음
      }
      if (condEl) condEl.innerHTML = condRows();
    }

    function fullRefresh() {
      syncCardCharger();
      rebuildSpeedDropdown();
      rebuildConditionRow();
      update();
    }

    cardSel   .addEventListener('change', () => { syncCardCharger(); rebuildSpeedDropdown(); rebuildConditionRow(); update(); });
    chargerSel.addEventListener('change', () => { rebuildSpeedDropdown(); rebuildConditionRow(); update(); });
    if (nonmemberToggle) nonmemberToggle.addEventListener('change', fullRefresh);
    speedSel  .addEventListener('change', update);
    condSel   .addEventListener('change', update);
    seasonSel .addEventListener('change', update);
    if (daySel) daySel.addEventListener('change', update);
    if (hourInput) hourInput.addEventListener('input', update);
    kwhInput  .addEventListener('input', update);

    fullRefresh();
  })();

  // ── 탭 클릭 시 섹션으로 스크롤 ────────────────────────────────────
  (function initTabScroll() {
    document.querySelectorAll('#feeTabs [data-scroll-to]').forEach(btn => {
      btn.addEventListener('click', e => {
        const sel = btn.getAttribute('data-scroll-to');
        if (!sel) return;
        e.preventDefault(); e.stopPropagation();
        document.querySelectorAll('#feeTabs .tab').forEach(b => b.classList.remove('active'));
        const evBtn = document.querySelector('#feeTabs [data-tab="ev"]');
        evBtn?.classList.add('active');
        document.querySelectorAll('[data-tab-content]').forEach(c => c.classList.remove('active'));
        document.querySelector('[data-tab-content="ev"]')?.classList.add('active');
        btn.classList.add('active');
        const target = document.querySelector(sel);
        if (target) target.scrollIntoView({ behavior:'smooth', block:'start' });
      });
    });
  })();

  // ─── 전기충전소 요금 검색 ────────────────────────────────────────
  (function initEvSearch(){
    const STATIONS = [
      { no:1,  name:'서울 강남 롯데타워 충전소',  addr:'서울 송파구 올림픽로 300', sido:'서울', op:'ME', opName:'기후부',           speed:'fast', out:'f100',  member:347.2, nonmember:347.2, status:'on'  },
      { no:2,  name:'서울 양재 SK일렉링크 허브',  addr:'서울 서초구 강남대로 311', sido:'서울', op:'ST', opName:'SK일렉링크',       speed:'ultra', out:'u200', member:320,   nonmember:590,   status:'on'  },
      { no:3,  name:'서울 상암 GS차지비 1호점',    addr:'서울 마포구 월드컵북로 396', sido:'서울', op:'PI', opName:'GS차지비',          speed:'fast', out:'f100',  member:335,   nonmember:470,   status:'on'  },
      { no:4,  name:'서울 송파 휴맥스이브이 거점', addr:'서울 송파구 위례성대로 220', sido:'서울', op:'HM', opName:'휴맥스이브이',     speed:'ultra', out:'u200', member:340,   nonmember:480,   status:'on'  },
      { no:5,  name:'경기 분당 채비 야탑 충전소',  addr:'경기 성남시 분당구 야탑동 343', sido:'경기', op:'CV', opName:'채비',         speed:'ultra', out:'u350', member:430,   nonmember:590,   status:'busy' },
      { no:6,  name:'경기 화성 에버온 동탄 충전소',addr:'경기 화성시 동탄대로 1호',   sido:'경기', op:'EV', opName:'에버온',          speed:'fast', out:'mid',  member:296, nonmember:380,   status:'on'  },
      { no:7,  name:'경기 평택 한전 KEPCO 충전소',addr:'경기 평택시 청북읍 백봉리 11', sido:'경기', op:'KP', opName:'한전 KEPCO',     speed:'fast', out:'f100',  member:324.4, nonmember:324.4, status:'on'  },
      { no:8,  name:'경기 안산 LG U+ 볼트업',     addr:'경기 안산시 단원구 광덕대로 100', sido:'경기', op:'LU', opName:'볼트업(LG U+)', speed:'fast', out:'f50',  member:350,   nonmember:null,  status:'on'  },
      { no:9,  name:'인천 송도 GS차지비 컨벤시아',addr:'인천 연수구 컨벤시아대로 165', sido:'인천', op:'PI', opName:'GS차지비',         speed:'ultra', out:'u350', member:345,   nonmember:470,   status:'on'  },
      { no:10, name:'인천공항 T2 SK일렉링크',     addr:'인천 중구 공항로 272',         sido:'인천', op:'ST', opName:'SK일렉링크',      speed:'ultra', out:'u200', member:320,   nonmember:590,   status:'on'  },
      { no:11, name:'대전 둔산 해피차저',         addr:'대전 서구 둔산동 1004',        sido:'대전', op:'HE', opName:'해피차저',         speed:'fast', out:'f100',  member:347.2, nonmember:550,   status:'on'  },
      { no:12, name:'대전 유성 나이스차저',       addr:'대전 유성구 대학로 99',        sido:'대전', op:'NT', opName:'나이스차저',      speed:'fast', out:'s11',  member:296,   nonmember:380,  status:'on'  },
      { no:13, name:'부산 해운대 채비 신세계',    addr:'부산 해운대구 센텀남대로 35',  sido:'부산', op:'CV', opName:'채비',           speed:'ultra', out:'u350', member:430,   nonmember:590,   status:'on'  },
      { no:14, name:'부산 강서 GS차지비 명지점', addr:'부산 강서구 명지동 1234',     sido:'부산', op:'PI', opName:'GS차지비',         speed:'fast', out:'f50',  member:335,   nonmember:470,   status:'on'  },
      { no:15, name:'대구 동성로 SK일렉링크',     addr:'대구 중구 동성로 62',          sido:'대구', op:'ST', opName:'SK일렉링크',      speed:'ultra', out:'u350', member:320,   nonmember:590,   status:'on'  },
      { no:16, name:'광주 첨단 에버온',           addr:'광주 광산구 첨단3로 88',       sido:'광주', op:'EV', opName:'에버온',          speed:'fast', out:'s35',  member:296, nonmember:380,   status:'on'  },
      { no:17, name:'울산 매암 휴맥스이브이',     addr:'울산 남구 매암동 137',         sido:'울산', op:'HM', opName:'휴맥스이브이',    speed:'fast', out:'f100',  member:320,   nonmember:480,   status:'on'  },
      { no:18, name:'세종 정부청사 기후부 충전소',addr:'세종 어진동 670',              sido:'세종', op:'ME', opName:'기후부',          speed:'ultra', out:'u200', member:347.2, nonmember:347.2, status:'on'  },
      { no:19, name:'제주 함덕 한전 KEPCO',       addr:'제주 제주시 함덕리 55',        sido:'제주', op:'KP', opName:'한전 KEPCO',     speed:'fast', out:'f100',  member:324.4, nonmember:324.4, status:'on'  },
      { no:20, name:'제주 서귀포 GS차지비',       addr:'제주 서귀포시 중앙로 105',     sido:'제주', op:'PI', opName:'GS차지비',         speed:'fast', out:'f50',  member:335,   nonmember:470,   status:'maint' },
      { no:21, name:'강원 춘천 에버온 명동',      addr:'강원 춘천시 명동길 22',        sido:'강원', op:'EV', opName:'에버온',          speed:'slow', out:'s7',  member:296,   nonmember:380,   status:'on'  },
      { no:22, name:'충북 청주 SK일렉링크 청주IC',addr:'충북 청주시 흥덕구 옥산면',    sido:'충북', op:'ST', opName:'SK일렉링크',      speed:'ultra', out:'u200', member:320,   nonmember:590,   status:'on'  },
      { no:23, name:'충남 천안 채비 두정점',      addr:'충남 천안시 서북구 두정동 21', sido:'충남', op:'CV', opName:'채비',           speed:'fast', out:'f100',  member:410,   nonmember:590,   status:'on'  },
      { no:24, name:'전북 전주 GS차지비 송천점',  addr:'전북 전주시 덕진구 송천동',    sido:'전북', op:'PI', opName:'GS차지비',         speed:'fast', out:'f50',  member:335,   nonmember:470,   status:'on'  },
    ];

    const PAGE_SIZE = 12;
    let curr = 1, filtered = STATIONS.slice();

    const sidoSel  = document.getElementById('evSido');
    const opSel    = document.getElementById('evOperator');
    const speedSel = document.getElementById('evSpeed');
    const memSel   = document.getElementById('evMember');
    const kwInput  = document.getElementById('evKeyword');
    const tbody    = document.getElementById('evResultTbody');
    const cntEl    = document.getElementById('evResultCount');
    const pageNav  = document.querySelector('.ev-result-pagination');

    if (!tbody || !pageNav) return;

    const OUTPUT = {
      s35:['slow','완속 3.5kW'], s7:['slow','완속 7kW'], s11:['slow','완속 11kW'],
      mid:['mid','중속 14kW'],
      f50:['fast','급속 50kW'], f100:['fast','급속 100kW'],
      u200:['ultra','초급속 200kW'], u350:['ultra','초급속 350kW'],
    };
    function outChip(o) {
      const [cls, label] = OUTPUT[o] || ['slow','—'];
      return `<span class="ev-result-chip ${cls}">${label}</span>`;
    }
    function msValues(id) {
      return Array.prototype.map.call(
        document.querySelectorAll('#' + id + ' .ms-list input[type=checkbox]:checked'),
        function (c) { return c.value; });
    }
    function statusEl(s) {
      const map = { on:['on','정상'], busy:['busy','이용중'], maint:['maint','점검중'] };
      const [cls, label] = map[s] || ['maint','—'];
      return `<span class="ev-status-dot ${cls}">${label}</span>`;
    }
    function fmtPrice(v) { return v != null ? v.toLocaleString() + '원' : '—'; }

    function render() {
      const start = (curr - 1) * PAGE_SIZE;
      const slice = filtered.slice(start, start + PAGE_SIZE);
      if (!slice.length) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:48px;color:var(--color-gray-500);font-size:14.5px;">조건에 맞는 충전소가 없습니다. 검색 조건을 바꿔 보세요.</td></tr>`;
      } else {
        tbody.innerHTML = slice.map(s => `
          <tr>
            <td style="text-align:center;color:var(--color-gray-500);font-weight:500;">${s.no}</td>
            <td>
              <div class="station-name">${s.name}</div>
              <div class="station-addr">${s.addr}</div>
            </td>
            <td>${s.opName}</td>
            <td>${outChip(s.out)}</td>
            <td class="num">${fmtPrice(s.member)}</td>
            <td class="num">${fmtPrice(s.nonmember)}</td>
            <td style="text-align:center;">${statusEl(s.status)}</td>
          </tr>`).join('');
      }
      cntEl.textContent = filtered.length;
      const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
      const buttons = [`<button type="button" class="ev-page-btn" aria-label="이전" ${curr===1?'disabled style="opacity:0.4;cursor:not-allowed;"':''}>‹</button>`];
      for (let i = 1; i <= totalPages; i++) {
        buttons.push(`<button type="button" class="ev-page-btn ${i===curr?'active':''}" ${i===curr?'aria-current="page"':''}>${i}</button>`);
      }
      buttons.push(`<button type="button" class="ev-page-btn" aria-label="다음" ${curr===totalPages?'disabled style="opacity:0.4;cursor:not-allowed;"':''}>›</button>`);
      pageNav.innerHTML = buttons.join('');
      pageNav.querySelectorAll('.ev-page-btn').forEach((btn, idx) => {
        btn.addEventListener('click', () => {
          if (btn.disabled) return;
          if (idx === 0) curr = Math.max(1, curr - 1);
          else if (idx === pageNav.children.length - 1) curr = Math.min(totalPages, curr + 1);
          else curr = parseInt(btn.textContent);
          render();
        });
      });
    }

    function applyFilter() {
      const sido = sidoSel.value;
      const ops  = msValues('evOperatorMs');   // 다중선택(빈 배열=전체)
      const outs = msValues('evSpeedMs');       // 다중선택(빈 배열=전체)
      const member = memSel.value;
      const kw = (kwInput.value || '').trim().toLowerCase();
      filtered = STATIONS.filter(s => {
        if (sido && s.sido !== sido) return false;
        if (ops.length && ops.indexOf(s.op) < 0) return false;
        if (outs.length && outs.indexOf(OUT_BAND[s.out]) < 0) return false;
        if (member === 'member' && s.member == null) return false;
        if (member === 'nonmember' && s.nonmember == null) return false;
        if (kw && !(s.name.toLowerCase().includes(kw) || s.addr.toLowerCase().includes(kw))) return false;
        return true;
      });
      curr = 1;
      render();
      if (window.__toast) window.__toast(`${filtered.length}건의 결과가 검색되었습니다.`, 'success');
    }

    // ── 다중선택 체크박스 드롭다운 (사업자·출력) ──
    function initMs(id) {
      const dd = document.getElementById(id); if (!dd) return;
      const btn = dd.querySelector('.ms-btn');
      const pop = dd.querySelector('.ms-pop');
      const allCb = dd.querySelector('.ms-all');
      const boxes = Array.prototype.slice.call(dd.querySelectorAll('.ms-list input[type=checkbox]'));
      const allLabel = dd.dataset.allLabel || '전체';
      function sync() {
        const checked = boxes.filter(b => b.checked);
        if (checked.length === 0) { allCb.checked = true; btn.textContent = allLabel; }
        else { allCb.checked = false; btn.textContent = checked.length === 1 ? checked[0].closest('label').textContent.trim() : checked.length + '개 선택'; }
      }
      btn.addEventListener('click', e => { e.stopPropagation(); const open = pop.hidden; pop.hidden = !open; btn.setAttribute('aria-expanded', String(open)); });
      allCb.addEventListener('change', () => { if (allCb.checked) boxes.forEach(b => b.checked = false); else allCb.checked = true; sync(); });
      boxes.forEach(b => b.addEventListener('change', () => { if (b.checked) allCb.checked = false; sync(); }));
      document.addEventListener('click', e => { if (!dd.contains(e.target)) { pop.hidden = true; btn.setAttribute('aria-expanded', 'false'); } });
      sync();
    }
    function resetMs(id) {
      const dd = document.getElementById(id); if (!dd) return;
      dd.querySelectorAll('.ms-list input').forEach(b => b.checked = false);
      const all = dd.querySelector('.ms-all'); if (all) all.checked = true;
      const btn = dd.querySelector('.ms-btn'); if (btn) btn.textContent = dd.dataset.allLabel || '전체';
    }
    initMs('evOperatorMs'); initMs('evSpeedMs');

    document.getElementById('evSearchBtn')?.addEventListener('click', applyFilter);
    document.getElementById('evSearchForm')?.addEventListener('submit', applyFilter);
    document.getElementById('evResetBtn')?.addEventListener('click', () => {
      sidoSel.value = ''; memSel.value = 'all'; kwInput.value = '';
      resetMs('evOperatorMs'); resetMs('evSpeedMs');
      filtered = STATIONS.slice(); curr = 1; render();
      if (window.__toast) window.__toast('검색 조건이 초기화되었습니다.', 'info');
    });
    render();
  })();

    } catch(e) { console.warn('charging-fee init:', e); }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

/* ── 사업자 요금 상세 모달 (전역 함수) ────────────────────────────── */
function openOpModal(bid) {
  const op = (window.__FEE_BASIC || []).find(r => r.bid === bid);
  if (!op) return;

  document.getElementById('op-modal-name').textContent = op.name;
  document.getElementById('op-modal-bid').textContent  = op.bid + ' · 사업자 공시 요금';
  document.getElementById('op-modal-type').textContent = op.type;

  const CAPS_DEF = [
    { key:'s35',  label:'완속 3.5kW',  group:'slow' },
    { key:'s7',   label:'완속 7kW',    group:'slow' },
    { key:'s11',  label:'완속 11kW',   group:'slow' },
    { key:'mid',  label:'중속 14kW',   group:'mid' },
    { key:'f50',  label:'급속 50kW',   group:'fast' },
    { key:'f100', label:'급속 100kW',  group:'fast' },
    { key:'u200', label:'초급속 200kW',group:'ultra' },
    { key:'u350', label:'초급속 350kW',group:'ultra' },
  ];

  function rateCell(v, group, label) {
    const valHtml = v != null
      ? `<div class="cap-value">${v}<span class="unit">원</span></div>`
      : `<div class="cap-value null-val">—</div>`;
    return `<div class="op-rate-cell group-${group}">
      <div class="cap-label">${label}</div>${valHtml}</div>`;
  }

  const basicGrid = CAPS_DEF.map(c => rateCell(op[c.key], c.group, c.label)).join('');

  // 비회원 요금 — accent 톤 카드
  const nmrHtml = op.nmr != null
    ? `<div class="op-nmr-card">
        <span class="nmr-ico" aria-hidden="true">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        </span>
        <div class="nmr-meta">
          <div class="nmr-label">비회원 (미가입) 단일요금</div>
          <div class="nmr-value">${op.nmr}<span class="unit"> 원/kWh</span></div>
          <div class="nmr-hint">급속·초급속 기준 · 완속 동일 적용 사업자도 있음</div>
        </div>
      </div>`
    : `<div class="op-nmr-empty">비회원 요금 미공시</div>`;

  // 지원·조건별
  const specials = (window.__FEE_SPECIAL || []).filter(r => r.bid === bid);
  let specialHtml = '';
  if (specials.length) {
    const rows = specials.map(s => {
      const cells = CAPS_DEF.map(c => rateCell(s[c.key], c.group, c.label)).join('');
      const noteStr = s.note ? `<div class="op-sub-card-note">${s.note}</div>` : '';
      return `<div class="op-sub-card">
        <div class="op-rate-grid">${cells}</div>${noteStr}</div>`;
    }).join('');
    specialHtml = `<section>
      <div class="op-section-title">지원·조건별 요금</div>
      ${rows}
    </section>`;
  }

  // 계절시간제
  const touOp = (window.__FEE_TOU || []).find(t => t.bid === bid);
  let touHtml = '';
  if (touOp) {
    const timeRow = `<tr style="background:var(--color-secondary-50);">
      <td style="font-size:var(--fs-xs);color:var(--text-secondary);font-weight:600;">시간대</td>
      <td class="num" style="font-size:var(--fs-xs);color:var(--text-secondary);">${touOp.times.off}</td>
      <td class="num" style="font-size:var(--fs-xs);color:var(--text-secondary);">${touOp.times.mid}</td>
      <td class="num" style="font-size:var(--fs-xs);color:var(--text-secondary);">${touOp.times.on}</td></tr>`;
    const dataRows = touOp.rows.map(r =>
      `<tr><td><strong style="font-size:var(--fs-sm);">${r.season}</strong></td>
        <td class="num" style="font-weight:600;font-size:var(--fs-sm);">${r.off}</td>
        <td class="num" style="font-weight:600;font-size:var(--fs-sm);">${r.mid}</td>
        <td class="num" style="font-weight:600;font-size:var(--fs-sm);">${r.on}</td></tr>`
    ).join('');
    touHtml = `<section>
      <div class="op-section-title">계절시간제 (원/kWh)</div>
      <div class="op-sub-card" style="margin-top:0;padding:0;overflow:hidden;">
        <div style="overflow-x:auto;">
          <table class="op-roaming-table">
            <thead><tr>
              <th style="text-align:left;">계절</th>
              <th class="num">경부하</th>
              <th class="num">중간부하</th>
              <th class="num">최대부하</th>
            </tr></thead>
            <tbody>${timeRow}${dataRows}</tbody>
          </table>
        </div>
      </div>
      <div style="font-size:var(--fs-xs);color:var(--text-tertiary);margin-top:var(--space-3);line-height:1.6;">${touOp.note}</div>
    </section>`;
  }

  // 비고
  const noteHtml = op.note
    ? `<div class="op-note"><strong>비고</strong> · ${op.note}</div>` : '';

  // 로밍
  const rmRow = (window.__ROAMING_ROWS || []).find(r => r.bid === bid);
  let roamHtml = '';
  if (rmRow) {
    if (rmRow.roaming_type === 'free') {
      roamHtml = `<section>
        <div class="op-section-title">로밍 정책</div>
        <div class="op-note"><strong>전 사업자 통합 로밍</strong> · 모든 사업자 충전기를 자체 요금으로 이용 가능 (정부 협약, 추가 수수료 없음)</div>
      </section>`;
    } else if (rmRow.roaming_type === 'flat') {
      const f = rmRow.flat;
      const noteLine = rmRow.note ? `<div style="font-size:var(--fs-xs);color:var(--text-tertiary);margin-top:var(--space-3);">${rmRow.note}</div>` : '';
      roamHtml = `<section>
        <div class="op-section-title">로밍 요금 — 이 카드로 타 사업자 충전기 이용 시</div>
        <div class="op-rate-grid" style="grid-template-columns:repeat(3,1fr);">
          <div class="op-rate-cell group-slow"><div class="cap-label">완속</div><div class="cap-value">${f.slow ?? '—'}<span class="unit">원</span></div></div>
          <div class="op-rate-cell group-fast"><div class="cap-label">급속</div><div class="cap-value">${f.fast ?? '—'}<span class="unit">원</span></div></div>
          <div class="op-rate-cell group-ultra"><div class="cap-label">초급속</div><div class="cap-value">${f.ultra ?? '—'}<span class="unit">원</span></div></div>
        </div>
        ${noteLine}
      </section>`;
    } else if (rmRow.partners && rmRow.partners.length) {
      const pRows = rmRow.partners.map(p => {
        const col = (window.__ROAMING_COLS || []).find(c => c.bid === p.bid);
        return `<tr>
          <td>${col ? col.name : p.bid} <small style="color:var(--text-tertiary);font-size:var(--fs-xs);margin-left:4px;font-weight:500;">${p.bid}</small></td>
          <td class="num">${p.slow ?? '—'}</td>
          <td class="num">${p.fast ?? '—'}</td>
          <td class="num">${p.ultra ?? '—'}</td></tr>`;
      }).join('');
      roamHtml = `<section>
        <div class="op-section-title">로밍 파트너 요금 — 협약 사업자별 요금 (원/kWh)</div>
        <div class="op-sub-card" style="margin-top:0;padding:0;overflow:hidden;">
          <div style="max-height:240px;overflow-y:auto;">
            <table class="op-roaming-table">
              <thead><tr>
                <th style="text-align:left;position:sticky;top:0;z-index:1;">이용 충전기</th>
                <th class="num" style="position:sticky;top:0;z-index:1;">완속</th>
                <th class="num" style="position:sticky;top:0;z-index:1;">급속</th>
                <th class="num" style="position:sticky;top:0;z-index:1;">초급속</th>
              </tr></thead>
              <tbody>${pRows}</tbody>
            </table>
          </div>
        </div>
      </section>`;
    }
  }

  document.getElementById('op-modal-body').innerHTML = `
    <section>
      <div class="op-section-title">기본요금 (회원 기준 · 원/kWh)</div>
      <div class="op-rate-grid">${basicGrid}</div>
    </section>
    <section>
      <div class="op-section-title">비회원 요금</div>
      ${nmrHtml}
    </section>
    ${specialHtml}
    ${touHtml}
    ${roamHtml}
    ${noteHtml}
  `;

  const overlay = document.getElementById('op-modal-overlay');
  overlay.classList.add('open');
  overlay.setAttribute('aria-hidden', 'false');
  // 포커스 이동 (닫기 버튼)
  setTimeout(() => document.getElementById('op-modal-close')?.focus(), 100);
  document.body.style.overflow = 'hidden';
}

/* 모달 닫기 — 외부 클릭 / ESC / 닫기 버튼 (Header 또는 Footer) */
(function(){
  function closeOpModal() {
    const overlay = document.getElementById('op-modal-overlay');
    if (!overlay) return;
    overlay.classList.remove('open');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }
  document.addEventListener('DOMContentLoaded', () => {
    const overlay = document.getElementById('op-modal-overlay');
    overlay?.addEventListener('click', e => {
      if (e.target.id === 'op-modal-overlay') closeOpModal();
    });
    document.getElementById('op-modal-close')?.addEventListener('click', closeOpModal);
    document.getElementById('op-modal-close-2')?.addEventListener('click', closeOpModal);
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && overlay?.classList.contains('open')) closeOpModal();
    });
  });
})();
