/* ════════════════════════════════════════════════════════════════════
   충전사업자 투명성지수 (T-INDEX) 풀스크린 모달
   - 데이터 출처: tindex/data_v3.json (159개사 중 핵심 22개사 + 분포 통계)
   - 역할별 뷰: 사용자(public) / 사업자(cpo) / 담당자(admin)
   ════════════════════════════════════════════════════════════════════ */
(function(){
  'use strict';

  // ── 전체 데이터 (window.__TINDEX_DATA — 159개사 실데이터) ──
  const TX = window.__TINDEX_DATA || {
    version:'v3', generated_at:'2026-04-20', total_chargers:596368, total_operators:159,
    distribution:{excellent:19, normal:109, weak:31, avg:58.3, median:57.6, max:85.1},
    operators: []
  };
  const ALL_OPS = TX.operators;     // T-Index 순으로 정렬되어 있음
  const STATS = {
    total: TX.total_operators,
    excellent: TX.distribution.excellent,
    normal: TX.distribution.normal,
    weak: TX.distribution.weak,
    avgScore: TX.distribution.avg,
    medianScore: TX.distribution.median,
    maxScore: TX.distribution.max,
    totalChargers: TX.total_chargers
  };

  /* ─── [작업15] 개선필요 → 보통 편입 ───
     개선 필요(weak) 등급을 보통(normal)으로 편입하여 집계/표시한다.
     원본 데이터(window.__TINDEX_DATA)는 변경하지 않고, 인라인 표시용 값만 보정한다. */
  const FOLD_GRADE = (g) => (g === '개선필요' ? '보통' : g);
  const STATS_FOLD = {
    total: STATS.total,
    excellent: STATS.excellent,
    normal: STATS.normal,
    weak: 0,
    avgScore: STATS.avgScore,
    medianScore: STATS.medianScore,
    maxScore: STATS.maxScore,
    totalChargers: STATS.totalChargers
  };

  // ── 사업자별 주지표 + 운영 지표 (tindex/data_v3.json 추출) ──
  const AXIS_SCORES = {
    HE:{ s_price:17.2, s_api:6,    s_state:19.9, s_use:11.7, s_uptime:8.9, s_infra:11.4, s_trust:10,  share:1.12,  normal_rate:89.5, anomaly_rate:10.67, flags:['r1_usage','system_only'] },
    CV:{ s_price:15.9, s_api:8.8,  s_state:16.8, s_use:11.7, s_uptime:7.7, s_infra:13.7, s_trust:10,  share:2.61,  normal_rate:77.2, anomaly_rate:10.67, flags:['system_only'] },
    EV:{ s_price:17.2, s_api:8.8,  s_state:15.1, s_use:14.7, s_uptime:7.0, s_infra:7.8,  s_trust:10,  share:9.09,  normal_rate:70.4, anomaly_rate:10.67, flags:[] },
    JA:{ s_price:12.9, s_api:8.8,  s_state:19.2, s_use:11.7, s_uptime:8.7, s_infra:13.2, s_trust:6.0, share:1.20,  normal_rate:86.9, anomaly_rate:10.67, flags:['system_only'] },
    ST:{ s_price:11.4, s_api:10.0, s_state:17.3, s_use:14.7, s_uptime:7.9, s_infra:13.4, s_trust:4.0, share:1.79,  normal_rate:79.2, anomaly_rate:10.67, flags:[] },
    SF:{ s_price:13,   s_api:8.8,  s_state:20,   s_use:14.7, s_uptime:9.5, s_infra:6.9,  s_trust:5.0, share:3.49,  normal_rate:94.6, anomaly_rate:10.67, flags:[] },
    ME:{ s_price:10.5, s_api:8.8,  s_state:18.8, s_use:12.7, s_uptime:8.5, s_infra:13.4, s_trust:4.0, share:1.64,  normal_rate:85.1, anomaly_rate:10.67, flags:['physics_error','short_session'] },
    HM:{ s_price:12.0, s_api:8.8,  s_state:17.0, s_use:14.7, s_uptime:7.8, s_infra:8.7,  s_trust:6.0, share:3.13,  normal_rate:78.1, anomaly_rate:10.67, flags:[] },
    NT:{ s_price:14,   s_api:7.3,  s_state:17.3, s_use:14.7, s_uptime:7.9, s_infra:7.3,  s_trust:6.0, share:3.29,  normal_rate:79.4, anomaly_rate:10.67, flags:['r1_usage'] },
    PC:{ s_price:13,   s_api:8.0,  s_state:18.0, s_use:14.7, s_uptime:8.2, s_infra:7.5,  s_trust:5.0, share:1.66,  normal_rate:82.2, anomaly_rate:10.67, flags:['r1_usage'] },
    PI:{ s_price:11.3, s_api:10.0, s_state:16.4, s_use:14.7, s_uptime:7.6, s_infra:8.4,  s_trust:5.0, share:15.17, normal_rate:75.6, anomaly_rate:10.67, flags:[] },
    LU:{ s_price:9.7,  s_api:10.0, s_state:7.7,  s_use:14.7, s_uptime:8.1, s_infra:7.5,  s_trust:4.0, share:6.82,  normal_rate:80.9, anomaly_rate:10.67, flags:['state_anomaly'] },
    PW:{ s_price:8.0,  s_api:8.8,  s_state:18.0, s_use:14.7, s_uptime:8.2, s_infra:7.7,  s_trust:5.0, share:11.61, normal_rate:82.0, anomaly_rate:10.67, flags:[] },
    PL:{ s_price:3.5,  s_api:9.5,  s_state:15.4, s_use:11.7, s_uptime:7.9, s_infra:7.5,  s_trust:0,   share:7.19,  normal_rate:79.4, anomaly_rate:10.67, flags:['state_anomaly','system_only'] },
    HW:{ s_price:3.5,  s_api:8.8,  s_state:15.0, s_use:11.7, s_uptime:3.5, s_infra:7.0,  s_trust:0,   share:2.34,  normal_rate:35.2, anomaly_rate:10.67, flags:['system_only'] },
    KE:{ s_price:3.5,  s_api:8.8,  s_state:18.5, s_use:14.7, s_uptime:8.4, s_infra:7.2,  s_trust:0,   share:0.76,  normal_rate:84.2, anomaly_rate:10.67, flags:[] },
    EP:{ s_price:3.5,  s_api:8.5,  s_state:16.4, s_use:14.7, s_uptime:7.6, s_infra:8.9,  s_trust:0,   share:0.82,  normal_rate:75.5, anomaly_rate:10.67, flags:[] },
    KL:{ s_price:3.5,  s_api:8.8,  s_state:15.0, s_use:14.7, s_uptime:5.5, s_infra:7.4,  s_trust:0,   share:0.98,  normal_rate:54.7, anomaly_rate:10.67, flags:[] },
    IN:{ s_price:3.5,  s_api:8.8,  s_state:18.0, s_use:14.7, s_uptime:8.2, s_infra:7.3,  s_trust:0,   share:1.29,  normal_rate:81.9, anomaly_rate:10.67, flags:[] },
    BN:{ s_price:3.5,  s_api:8.8,  s_state:15.8, s_use:12.7, s_uptime:7.3, s_infra:12.5, s_trust:0,   share:0.49,  normal_rate:73.1, anomaly_rate:10.67, flags:['physics_error'] },
    EC:{ s_price:13,   s_api:7.3,  s_state:10.0, s_use:14.7, s_uptime:5.2, s_infra:9.1,  s_trust:5.0, share:2.37,  normal_rate:51.5, anomaly_rate:10.67, flags:['r1_usage','state_anomaly'] },
    KP:{ s_price:6.5,  s_api:9.5,  s_state:15.0, s_use:11.7, s_uptime:5.9, s_infra:13.1, s_trust:0,   share:1.85,  normal_rate:58.5, anomaly_rate:10.67, flags:['system_only'] },
  };
  const FLAG_LABEL = {
    r1_usage:'r1 사용', double_slash:'URL 중복', api_inactive:'API 비활성',
    state_anomaly:'상태 이상', system_only:'S=100%', physics_error:'물리 오류', short_session:'단발 세션'
  };
  let selectedDetailBid = null;

  // ── 주지표 평가 가중치 + 상세 설명
  const PILLARS = [
    { key:'p_uptime', weight:20, cls:'p1', ko:'통신 가동', en:'Comm Uptime', aux:false, sub:'주지표 · 정보 누락 여부', sub_en:'Main · core of data gaps', desc:'충전기가 살아서 상태를 보고 중인가', desc_en:'Are chargers alive and reporting status' },
    { key:'p_state', weight:18, cls:'p3', ko:'상태 정합', en:'Status Validity', aux:false, sub:'주지표 · 코드 규칙 정합', sub_en:'Main · status-code validity', desc:'상태값이 코드 규칙에 맞고 모순 없나', desc_en:'Status values valid & consistent' },
    { key:'p_phys', weight:15, cls:'p4', ko:'물리 정합', en:'Physics Validity', aux:false, sub:'주지표 · 수치 물리 성립', sub_en:'Main · physical plausibility', desc:'전력÷시간·SOC 등이 물리적으로 성립하나', desc_en:'Power/time, SOC physically valid' },
    { key:'p_link', weight:12, cls:'p2', ko:'연계 정합', en:'Linkage', aux:false, sub:'주지표 · API 연동 정합', sub_en:'Main · API integration', desc:'환경부·통합포털 API 연동이 살아있나', desc_en:'MoE/portal API integration alive' },
    { key:'p_price', weight:12, cls:'p5', ko:'요금 공시', en:'Fee Disclosure', aux:false, sub:'주지표 · 공시 성실성', sub_en:'Main · disclosure diligence', desc:'요금을 빠짐없이·최신으로 공시하나', desc_en:'Complete & up-to-date fee disclosure' },
    { key:'p_trust', weight:8, cls:'p6', ko:'신뢰', en:'Reliability', aux:false, sub:'주지표 · 외부 검증', sub_en:'Main · external verification', desc:'제공정보가 실제와 일치하나 (민원 수집 기반·누적 중)', desc_en:'Matches reality (complaint-based, accruing)' },
    { key:'a_infra', weight:6, cls:'p7', ko:'인프라 규모', en:'Scale', aux:true, sub:'보조지표 · 등급 미반영', sub_en:'Aux · not in grade', desc:'충전기 수·지역 커버리지·출력 다양성', desc_en:'Charger count, coverage, power diversity' },
    { key:'a_use', weight:5, cls:'p8', ko:'이용도', en:'Usage', aux:true, sub:'보조지표 · 등급 미반영', sub_en:'Aux · not in grade', desc:'충전 건수·가동시간 대비 이용', desc_en:'Charge count vs uptime' },
    { key:'a_pricelv', weight:4, cls:'p9', ko:'가격 수준', en:'Price Level', aux:true, sub:'보조지표 · 등급 미반영', sub_en:'Aux · not in grade', desc:'단가가 시장 대비 합리적인가', desc_en:'Rate vs market median' },
  ];

  /* ── 다국어 (인라인 대시보드 전용; 사업자명 등 고유명사는 한글 유지) ── */
  function EN(){ return _txLang === 'en'; }
  var _txLang = (window.__i18n && window.__i18n.getLang && window.__i18n.getLang()) || 'ko';
  function L(ko,en){ return EN()? en : ko; }
  var GRADE_EN = {'우수':'Excellent','보통':'Average','개선필요':'Needs Improvement','개선 필요':'Needs Improvement'};
  function G(g){ return EN()? (GRADE_EN[g]||g) : g; }
  var FLAG_LABEL_EN = { r1_usage:'R1 usage', double_slash:'URL dup', api_inactive:'API inactive', state_anomaly:'Status anomaly', system_only:'S=100%', physics_error:'Physics error', short_session:'Short session' };
  function FL(f){ return EN()? (FLAG_LABEL_EN[f]||FLAG_LABEL[f]||f) : (FLAG_LABEL[f]||f); }
  var AXIS_EN = {'가격':'Price','상태':'Status','이용':'Usage','인프라':'Infrastructure','연계':'Linkage','신뢰':'Reliability','가동':'Uptime'};
  function axisLabel(k){ return EN()? (AXIS_EN[k]||k) : k; }

  // ── DOM (인라인용: data.html '충전사업자 투명성지수(임시)' 섹션 / charging-fee 모달과 독립)
  const body = document.getElementById('tindexInlineBody');
  if (!body) return;
  const roleBtns = document.querySelectorAll('.tx-inline-role-btn');

  // CSS 동적 로드 (charging-fee.html에 link가 추가되지 않았어도 동작)
  if (!document.querySelector('link[href*="tindex-modal.css"]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet'; link.href = 'css/tindex-modal.css';
    document.head.appendChild(link);
  }

  let currentRole = 'public';
  let cpoSelectedBid = '';
  let rankFilter = 'all';
  let rankSearch = '';

  /* ─── 전체 159개사 (T-Index 내림차순) ─── */
  function getOperators() {
    // [작업15] 개선필요 → 보통 편입: 원본을 변경하지 않고 등급만 보정한 사본 반환
    const src = (ALL_OPS && ALL_OPS.length)
      ? ALL_OPS
      : [...(window.__FEE_BASIC || [])].sort((a,b) => (b.ti || 0) - (a.ti || 0));
    return src.map(o => (o.grade === '개선필요' ? { ...o, grade: '보통' } : o));
  }

  /* ─── 등급 → 색상 클래스 ─── */
  function gradeColor(grade) {
    return grade === '우수' ? 'green' : grade === '보통' ? 'yellow' : 'red';
  }

  /* ─── 익명화 (사용자/사업자 모드: 우수만 실명, 보통/개선필요는 비공개 #순위) ─── */
  function displayName(op, role) {
    if (role === 'admin') return op.name;
    if (role === 'cpo' && op.bid === cpoSelectedBid) return op.name;
    if (op.grade === '우수') return op.name;
    return `<span class="anon">${L('비공개','Private')} #${op.rank || '—'}</span>`;
  }
  function detailDisplayName(op, role) {
    if (role === 'admin') return op.name;
    if (role === 'cpo' && op.bid === cpoSelectedBid) return op.name;
    if (op.grade === '우수') return op.name;
    return `${L('비공개','Private')} #${op.rank || '—'}`;
  }

  /* ─── 역할 안내 배너 ─── */
  function renderRoleBanner(role) {
    const map = {
      public: {
        ico:'public', title:L('사용자 모드','User Mode'),
        desc:L('우수 등급 사업자만 실명을 공개하며, 보통·개선필요 등급은 익명 처리됩니다. 일반 시민이 안심하고 이용할 수 있는 충전 사업자를 한눈에 비교해 보세요.','Only Excellent-grade operators are shown by name; Average and Needs-Improvement grades are anonymized. Compare trustworthy charging operators at a glance.')
      },
      cpo: {
        ico:'cpo', title:L('사업자 담당자 모드','Operator Mode'),
        desc:L('우측 셀렉터에서 자사를 선택하면 자사 순위·등급·주지표 점수와 개선 포인트가 강조 표시됩니다. 다른 사업자명은 익명으로 처리됩니다.','Select your company from the selector on the right to highlight your rank, grade, 6-axis scores, and improvement points. Other operators are anonymized.')
      },
      admin: {
        ico:'admin', title:L('담당자 모드','Administrator Mode'),
        desc:L('전 사업자 실명 + 주지표 상세 점수 + 이상 플래그가 모두 공개됩니다. 외부 공유는 금지되며, 정책·감사 목적의 내부 활용만 허용됩니다.','All operators'+"'"+' real names, detailed 6-axis scores, and anomaly flags are shown. External sharing is prohibited; for internal policy/audit use only.')
      }
    };
    const m = map[role];
    return `
      <div class="tx-role-banner">
        <div class="tx-role-banner-ico ${m.ico}">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            ${role==='public' ? '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>' : ''}
            ${role==='cpo'    ? '<path d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-4"/><path d="M9 9h.01M9 12h.01M9 15h.01M9 18h.01"/>' : ''}
            ${role==='admin'  ? '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/>' : ''}
          </svg>
        </div>
        <div class="tx-role-banner-text">
          <strong>${m.title}</strong>
          <p>${m.desc}</p>
        </div>
      </div>
    `;
  }

  /* ─── 사업자 모드 — 자사 셀렉터 (전체 159개 가나다순 + 순위) ─── */
  function renderCpoSelector(ops) {
    const sorted = [...ops].sort((a,b) => a.name.localeCompare(b.name, 'ko'));
    const opts = sorted.map(o => {
      const dot = o.color === 'green' ? '🟢' : o.color === 'yellow' ? '🟡' : '🔴';
      return `<option value="${o.bid}" ${cpoSelectedBid===o.bid?'selected':''}>${dot} ${o.name} (${o.bid}) · #${o.rank}</option>`;
    }).join('');
    const warn = !cpoSelectedBid
      ? `<span class="tx-cpo-warn">${L('로그인할 사업자를 선택하세요','Select your operator')}</span>`
      : '';
    return `
      <div class="tx-cpo-selector">
        <span class="tx-cpo-tag">${L('사업자 담당자 모드','Operator Mode')}</span>
        <span class="tx-cpo-divider">·</span>
        <label for="txCpoSelect">${L('내 사업자','My Operator')}</label>
        <select id="txCpoSelect" aria-label="${L('자사 선택','Select your company')}">
          <option value="">${L('담당 사업자 선택…','Select operator…')}</option>
          ${opts}
        </select>
        ${warn}
      </div>
    `;
  }

  /* ─── 자사 핵심 지표 (사업자 모드에서 자사 선택 시) ─── */
  function renderMineSummary(op, ops) {
    if (!op) return '';
    const rank = ops.findIndex(o => o.bid === op.bid) + 1;
    const totalRanked = ops.length;
    const axes = [
      { lbl:'통신가동', val:op.p_uptime ?? '—', max:20 },
      { lbl:'상태정합', val:op.p_state ?? '—', max:18 },
      { lbl:'물리정합', val:op.p_phys ?? '—', max:15 },
      { lbl:'연계', val:op.p_link ?? '—', max:12 },
      { lbl:'요금공시', val:op.p_price ?? '—', max:12 },
      { lbl:'신뢰', val:op.p_trust ?? '—', max:8 },
    ];
    return `
      <section class="tx-section">
        <div class="tx-section-head">
          <h3 class="tx-section-title"><span class="tx-num">★</span> ${L('자사 운영 현황','My Operation Status')}</h3>
          <span class="tx-section-hint">${L('T-Index 기준 자사 순위 + 개선 포인트','Your rank by T-Index + improvement points')}</span>
        </div>
        <div class="tx-mine-grid">
          <div class="tx-mine-summary">
            <div class="tx-mine-name">
              ${op.name}
              <span class="tx-grade-chip ${gradeColor(op.grade)}">${G(op.grade)}</span>
            </div>
            <div class="tx-mine-meta">
              <div class="tx-mine-meta-item"><div class="lbl">${L('자사 순위','My Rank')}</div><div class="val">${EN()?('#'+rank+' / '+totalRanked):(rank+'위 / '+totalRanked)}</div></div>
              <div class="tx-mine-meta-item"><div class="lbl">${L('T-Index 점수','T-Index Score')}</div><div class="val">${EN()?op.ti:(op.ti+'점')}</div></div>
              <div class="tx-mine-meta-item"><div class="lbl">${L('충전기 수','Chargers')}</div><div class="val">${(op.cc||0).toLocaleString()}${L('기','')}</div></div>
            </div>
            <div>
              <div class="tx-section-hint" style="margin-bottom:8px;">${L('주지표 점수 상세 (만점 기준 비율)','6-axis detail (ratio to max)')}</div>
              <div class="tx-axis-grid" style="margin-top:0;">
                ${axes.map(a => `
                  <div class="tx-axis-cell">
                    <div class="ax-label">${axisLabel(a.lbl)}</div>
                    <div class="ax-val">${a.val}<span class="ax-max"> / ${a.max}</span></div>
                  </div>`).join('')}
              </div>
            </div>
          </div>
          <div class="tx-mine-summary">
            <div class="tx-section-hint" style="margin-bottom:6px;">${L('개선 권장 포인트','Recommended improvements')}</div>
            ${suggestImprovement(op, axes)}
          </div>
        </div>
      </section>
    `;
  }

  /* ─── 개선 권장 포인트 ─── */
  function suggestImprovement(op, axes) {
    const ratio = a => (a.val === '—' ? 0 : a.val / a.max);
    const sorted = axes.filter(a => a.val !== '—').sort((a,b) => ratio(a) - ratio(b)).slice(0, 3);
    return `
      <ul style="list-style:none; padding:0; margin:0; display:flex; flex-direction:column; gap:10px;">
        ${sorted.map((a, i) => `
          <li style="display:flex; align-items:flex-start; gap:10px; padding:12px 14px; background:var(--color-gray-50); border-radius:var(--radius-md);">
            <span style="display:inline-grid; place-items:center; width:24px; height:24px; border-radius:50%; background:var(--color-primary-50); color:var(--color-primary-700); font-size:12px; font-weight:700; flex-shrink:0;">${i+1}</span>
            <div style="flex:1;">
              <div style="font-size:14.5px; font-weight:600; color:var(--text-primary);">${EN()?(axisLabel(a.lbl)+' score '+a.val+'/'+a.max):(a.lbl+' 점수 '+a.val+'/'+a.max)}</div>
              <div style="font-size:13px; color:var(--text-secondary); margin-top:2px;">${suggestionText(a.lbl)}</div>
            </div>
          </li>
        `).join('')}
        <li style="font-size:12.5px; color:var(--text-tertiary); padding:0 4px;">
          ${L('※ 점수 비율이 가장 낮은 3개 축을 우선 개선 권장합니다.','* The 3 lowest-ratio axes are recommended for priority improvement.')}
        </li>
      </ul>
    `;
  }
  function suggestionText(label) {
    var ko = {
      '가격':'요금 신고 성실성·격차 축소·갱신 주기 단축이 필요합니다.',
      '연계':'API r2 마이그레이션과 URL 정합성 확보가 필요합니다.',
      '상태':'충전기 가동률 점검 및 이상 패턴 모니터링이 필요합니다.',
      '이용':'이용 이상 비율 감소 및 물리 오류 검증이 필요합니다.',
      '인프라':'충전기 규모 확대 및 초급속 비율 향상이 권장됩니다.',
      '신뢰':'국민 제보·리뷰 검증 활동을 통한 신뢰 등급 상승이 필요합니다.'
    };
    var en = {
      '가격':'Improve fee-reporting accuracy, narrow gaps, and shorten update cycles.',
      '연계':'Migrate to API r2 and ensure URL consistency.',
      '상태':'Check charger uptime and monitor anomaly patterns.',
      '이용':'Reduce the abnormal-usage ratio and verify physics errors.',
      '인프라':'Expand the charger fleet and increase the ultra-fast ratio.',
      '신뢰':'Raise the trust grade through public reports and review verification.'
    };
    return (EN()? en : ko)[label] || '';
  }

  /* ─── 메타 툴바 (날짜·사업자수·충전기수·주지표 만점) ─── */
  function renderMetaBar() {
    return `
      <div class="tx-meta-bar">
        <span class="tx-meta-chip"><span class="ic-cal">📅</span> ${TX.generated_at}</span>
        <span class="tx-meta-chip"><span class="ic-bld">🏢</span> ${STATS.total} ${L('사업자','operators')}</span>
        <span class="tx-meta-chip"><span class="ic-bolt">⚡</span> ${STATS.totalChargers.toLocaleString()}${L('기',' chargers')}</span>
        <span class="tx-meta-chip primary"><span class="ic-star">★</span> ${L('주지표 (총 100점)','6 axes (100 pts total)')}</span>
        <span class="tx-meta-version">${TX.version}</span>
      </div>
    `;
  }

  /* ─── 분포 KPI 4카드 ─── */
  function renderKPI() {
    return `
      <section class="tx-section">
        <div class="tx-section-head">
          <h3 class="tx-section-title"><span class="tx-num">01</span> ${L('전국 사업자 분포','National Operator Distribution')}</h3>
          <span class="tx-section-hint">${L('데이터 출처','Source')} · tindex/data_v3.json (${EN()?(STATS.total+' operators as of '+TX.generated_at):(TX.generated_at+' 기준 '+STATS.total+'개사')})</span>
        </div>
        <div class="tx-kpi-grid">
          <div class="tx-kpi-card green">
            <div class="ico">${L('우수','Excellent')}</div>
            <div class="num">${STATS.excellent}<span class="unit">${L('개사',' ops')}</span></div>
            <div class="label">${L('우수 사업자','Excellent operators')}</div>
            <div class="crit">주지표 환산 ≥ 70</div>
          </div>
          <div class="tx-kpi-card yellow">
            <div class="ico">${L('보통','Average')}</div>
            <div class="num">${STATS_FOLD.normal}<span class="unit">${L('개사',' ops')}</span></div>
            <div class="label">${L('보통 사업자','Average operators')}</div>
            <div class="crit">${L('주지표 환산 &lt; 70','Main-scaled &lt; 70')}</div>
          </div>
          <!-- [삭제 작업12·15] 전국 사업자 분포 '개선 필요' 카드 주석처리 (개선필요 31개사는 보통으로 편입)
          <div class="tx-kpi-card red">
            <div class="ico">개선</div>
            <div class="num">${STATS.weak}<span class="unit">개사</span></div>
            <div class="label">개선 필요</div>
            <div class="crit">T-Index &lt; 50</div>
          </div>
          -->
          <div class="tx-kpi-card blue">
            <div class="ico">${L('평균','Avg')}</div>
            <div class="num">${STATS.avgScore}<span class="unit">${L('점','pts')}</span></div>
            <div class="label">${L('전체 평균 T-Index','Overall avg T-Index')}</div>
            <div class="crit">${L('중앙','Median')} ${STATS.medianScore} · ${L('최고','Max')} ${STATS.maxScore}</div>
          </div>
        </div>
      </section>
    `;
  }

  /* ─── 주지표 평가 체계 — 컴팩트 카드 ─── */
  function renderPillars() {
    return `
      <section class="tx-section">
        <div class="tx-section-head">
          <h3 class="tx-section-title"><span class="tx-num">02</span> ${L('T-Index 주지표 지표 설명','T-Index 6-Axis Indicators')}</h3>
          <span class="tx-section-hint">${L('총 100점 만점 · 가중치 기반 종합 평가 · 가동률은 보조 지표','Out of 100 · weighted composite · uptime is a supplementary metric')}</span>
        </div>
        <div class="tx-pillars-grid">
          ${PILLARS.map(p => `
            <div class="tx-pillar-card ${p.cls}">
              <div class="tx-pillar-head">
                <span class="tx-pillar-title">
                  <strong>${L(p.ko,p.en)}</strong>
                  ${EN()?'':'<em>('+p.en+')</em>'}
                </span>
                <span class="tx-pillar-weight">${p.weight}</span>
              </div>
              <div class="tx-pillar-sub">${L(p.sub,p.sub_en)}</div>
              <div class="tx-pillar-desc">${L(p.desc,p.desc_en)}</div>
            </div>
          `).join('')}
        </div>
      </section>
    `;
  }

  /* ─── 사업자 랭킹 ─── */
  function renderRanking(ops, role) {
    const isAdmin = role === 'admin';
    const showAxes = isAdmin;

    // 사용자/사업자 모드: 우수 사업자만 리스트로 노출, 보통/개선필요는 집계만
    // 담당자 모드: 전체 표시
    let visible;
    if (isAdmin) {
      visible = ops.filter(o => {
        if (rankFilter !== 'all' && o.grade !== rankFilter) return false;
        if (rankSearch) {
          const kw = rankSearch.toLowerCase();
          if (!o.name.toLowerCase().includes(kw) && !o.bid.toLowerCase().includes(kw)) return false;
        }
        return true;
      });
    } else {
      visible = ops.filter(o => {
        if (o.grade !== '우수') return false;
        if (rankSearch) {
          const kw = rankSearch.toLowerCase();
          if (!o.name.toLowerCase().includes(kw) && !o.bid.toLowerCase().includes(kw)) return false;
        }
        return true;
      });
    }

    const colspan = showAxes ? 8 : 7;
    const rows = visible.map(op => {
      const idx = ops.findIndex(o => o.bid === op.bid) + 1;
      const rankCls = idx === 1 ? 'top1' : idx === 2 ? 'top2' : idx === 3 ? 'top3' : '';
      const isMine = role === 'cpo' && op.bid === cpoSelectedBid;
      const isSelected = op.bid === selectedDetailBid;
      const tiPct = Math.min(100, (op.ti || 0));
      const flagsHtml = showAxes && op.note?.startsWith('⚠')
        ? `<span class="tx-flag">${op.note.replace('⚠ ','').replace('· 저신뢰(2차 출처)', EN()?'Low trust':'저신뢰')}</span>` : '';
      const axisCells = showAxes
        ? `<td class="num" style="font-size:12.5px; color:var(--text-secondary);">
             ${L('통신가동','Uptime')} ${op.p_uptime ?? '—'} · ${L('상태정합','Status')} ${op.p_state ?? '—'} · ${L('물리','Physics')} ${op.p_phys ?? '—'}
             ${flagsHtml ? `<div style="margin-top:4px;"><div class="tx-flag-list">${flagsHtml}</div></div>` : ''}
           </td>`
        : '';
      return `
        <tr class="${isMine ? 'is-mine' : ''} ${isSelected ? 'is-selected' : ''}" data-bid="${op.bid}">
          <td><span class="rank ${rankCls}">${idx}</span></td>
          <td><strong>${op.name}</strong> ${isAdmin ? `<small style="color:var(--text-tertiary); margin-left:4px;">${op.bid}</small>` : ''}</td>
          <td><span class="tx-grade-chip ${gradeColor(op.grade)}">${G(op.grade)}</span></td>
          <td class="num">
            <span class="tx-tindex-bar">
              <span class="bar"><span class="fill" style="width:${tiPct}%;"></span></span>
              <span class="val">${op.ti}</span>
            </span>
          </td>
          <td class="num">${(op.cc || 0).toLocaleString()}</td>
          <td class="num">${(op.f50 ?? '—') + (op.f50 ? L('원','') : '')}</td>
          <td class="num">${(op.nmr ?? '—') + (op.nmr ? L('원','') : '')}</td>
          ${axisCells}
        </tr>
      `;
    }).join('') || `<tr><td colspan="${colspan}" style="text-align:center; padding:48px; color:var(--text-tertiary);">${L('조건에 맞는 사업자가 없습니다.','No operators match the criteria.')}</td></tr>`;

    // 비공개 집계 카드 (사용자/사업자 모드 전용)
    let hiddenSummary = '';
    if (!isAdmin) {
      const normalCount   = STATS_FOLD.normal;  // [작업15] 109 + 31 = 140 (개선필요 편입)
      const weakCount     = STATS.weak;       // 31
      const totalHidden   = STATS_FOLD.normal; // [작업15] 개선필요 편입 후 보통만 익명 집계
      hiddenSummary = `
        <div class="tx-hidden-summary" role="region" aria-label="${L('비공개 사업자 집계','Anonymized operator summary')}">
          <div class="tx-hidden-head">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
            <h4>${L('비공개 사업자 집계','Anonymized Operator Summary')}</h4>
            <span class="tx-hidden-meta">${EN()?('Only Excellent grade is named in '+(role==='public'?'User':'Operator')+' mode'):((role==='public'?'사용자':'사업자')+' 모드는 우수 등급만 실명 공개')}</span>
          </div>
          <div class="tx-hidden-grid">
            <div class="tx-hidden-card yellow">
              <div class="ico">${L('보통','Average')}</div>
              <div class="num">${normalCount}<span class="unit">${L('개사',' ops')}</span></div>
              <div class="label">${L('보통 사업자','Average operators')}</div>
              <div class="crit">${L('T-Index &lt; 70 · 익명 처리 · 사업자명·요금 비공개','T-Index &lt; 70 · anonymized · name/fees hidden')}</div>
            </div>
            <!-- [삭제 작업13·15] 사업자 랭킹 하단 '개선' 카드 주석처리 (개선필요는 보통으로 편입)
            <div class="tx-hidden-card red">
              <div class="ico">개선</div>
              <div class="num">${weakCount}<span class="unit">개사</span></div>
              <div class="label">개선 필요 사업자</div>
              <div class="crit">T-Index &lt; 50 · 익명 처리 · 사업자명·요금 비공개</div>
            </div>
            -->
            <div class="tx-hidden-total">
              <span>${EN()?('<strong>'+totalHidden+'</strong> operators are counted anonymously.'):('총 <strong>'+totalHidden+'</strong>개 사업자가 익명 집계됩니다.')}</span>
              <span class="hint">${L('상세 데이터는 담당자 모드에서만 열람 가능','Detailed data is available in Administrator mode only')}</span>
            </div>
          </div>
        </div>
      `;
    }

    // 검색·필터 툴바
    const toolbar = isAdmin
      ? `
        <div class="tx-rank-toolbar">
          <div class="filter-chips">
            <button type="button" class="tx-chip ${rankFilter==='all'?'active':''}" data-rfilter="all">${L('전체','All')} (${ops.length})</button>
            <button type="button" class="tx-chip ${rankFilter==='우수'?'active':''}" data-rfilter="우수">${L('우수','Excellent')}</button>
            <button type="button" class="tx-chip ${rankFilter==='보통'?'active':''}" data-rfilter="보통">${L('보통','Average')}</button>
            <!-- [삭제 작업15] 개선필요 필터 칩 주석처리 (개선필요는 보통으로 편입)
            <button type="button" class="tx-chip ${rankFilter==='개선필요'?'active':''}" data-rfilter="개선필요">개선필요</button>
            -->
          </div>
          <div class="tx-rank-search">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input type="text" id="txRankSearch" value="${rankSearch}" placeholder="${L('사업자명 또는 BID 검색','Search by operator or BID')}" aria-label="${L('사업자 검색','Search operators')}">
          </div>
        </div>
      `
      : `
        <div class="tx-rank-toolbar">
          <div class="filter-chips">
            <span class="tx-chip active" style="cursor:default;">${EN()?('Excellent · '+STATS.excellent+' operators'):('우수 등급 '+STATS.excellent+'개사')}</span>
          </div>
          <div class="tx-rank-search">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input type="text" id="txRankSearch" value="${rankSearch}" placeholder="${L('우수 사업자명 또는 BID 검색','Search Excellent operators or BID')}" aria-label="${L('우수 사업자 검색','Search Excellent operators')}">
          </div>
        </div>
      `;

    return `
      <section class="tx-section">
        <div class="tx-section-head">
          <h3 class="tx-section-title"><span class="tx-num">03</span> ${L('사업자 랭킹','Operator Ranking')}</h3>
          <span class="tx-section-hint">${L('행 클릭 → 아래에 주지표 레이더·세부 점수 펼침','Click a row to expand the 6-axis radar and detailed scores below')}</span>
        </div>
        <div class="tx-rank-wrap">
          ${toolbar}
          <div style="overflow-x:auto;">
            <table class="tx-rank-table">
              <thead>
                <tr>
                  <th style="width:60px;">${L('순위','Rank')}</th>
                  <th>${L('사업자','Operator')}</th>
                  <th style="width:100px;">${L('등급','Grade')}</th>
                  <th class="num" style="width:160px;">T-Index</th>
                  <th class="num" style="width:110px;">${L('충전기','Chargers')}</th>
                  <th class="num" style="width:110px;">${L('급속 회원','Fast (member)')}</th>
                  <th class="num" style="width:110px;">${L('비회원','Non-member')}</th>
                  ${showAxes ? '<th class="num" style="width:240px;">'+L('주지표 상세 + 플래그','6-axis detail + flags')+'</th>' : ''}
                </tr>
              </thead>
              <tbody>${rows}</tbody>
            </table>
          </div>
          ${hiddenSummary}
        </div>
        ${renderDetailPanel(ops, role)}
      </section>
    `;
  }

  /* ─── 사업자 상세 패널 (랭킹 행 클릭 또는 자사 선택 시) ─── */
  function renderDetailPanel(ops, role) {
    // CPO 모드는 셀렉터 선택 사업자 우선, 그 외는 클릭한 사업자
    const targetBid = (role === 'cpo' && cpoSelectedBid) ? cpoSelectedBid : selectedDetailBid;
    const op = targetBid ? ops.find(o => o.bid === targetBid) : null;
    if (!op) {
      return `
        <div class="tx-detail-panel tx-detail-empty" id="txDetailPanel" data-empty="true">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <p>${L('위 표에서 사업자를 클릭하면 주지표 점수 · 운영 지표 · 세부 분해 차트가 표시됩니다.','Click an operator in the table above to see 6-axis scores, operational metrics, and a breakdown chart.')}</p>
        </div>
      `;
    }
    // op 자체에 모든 점수가 들어있음 (159개사 풀데이터)
    const flags = op.flags || [];
    const flagsHtml = flags.length
      ? flags.map(f => `<span class="tx-detail-flag">${FL(f)}</span>`).join('')
      : '';
    const statusBanner = flags.length > 0
      ? `<div class="tx-detail-status warn">⚠ ${EN()?(flags.length+' anomaly flag(s) — '):(flags.length+'건의 이상 플래그 — ')}${flags.map(f => FL(f)).join(' · ')}</div>`
      : `<div class="tx-detail-status ok">✓ ${L('이상 없음','No anomalies')}</div>`;
    const radar = renderRadar(op);
    const bars = renderAxisBars(op);
    const usageRate = (100 - (op.anomaly_rate || 0)).toFixed(1);
    const dispName = detailDisplayName(op, role);
    const isAnon = (role !== 'admin') && op.grade !== '우수' && (role !== 'cpo' || op.bid !== cpoSelectedBid);

    return `
      <div class="tx-detail-panel" id="txDetailPanel">
        <div class="tx-detail-head">
          <span class="tx-detail-grade ${gradeColor(op.grade)}"></span>
          <h4>${dispName}${!isAnon ? ` <span class="tx-detail-bid">(${op.bid})</span>` : ''} <span class="tx-detail-rank">#${op.rank}</span></h4>
          <button type="button" class="tx-chip tx-detail-action" id="txDetailMore">${L('상세 보기','View details')}</button>
        </div>
        ${statusBanner}
        ${flagsHtml ? `<div class="tx-detail-flags">${flagsHtml}</div>` : ''}
        <div class="tx-detail-kpi">
          <div class="tx-detail-kpi-tile share">
            <div class="lbl">${L('점유율','Share')}</div>
            <div class="val">${op.share}<span class="unit">%</span></div>
            <div class="cap" data-tone="ok">${op.share >= 5 ? L('대형','Large') : op.share >= 1 ? L('중형','Mid') : L('소형','Small')}</div>
          </div>
          <div class="tx-detail-kpi-tile uptime">
            <div class="lbl">${L('가동률','Uptime')}</div>
            <div class="val">${(op.normal_rate || 0).toFixed(2)}<span class="unit">%</span></div>
            <div class="cap" data-tone="${op.normal_rate >= 90 ? 'ok' : op.normal_rate >= 75 ? 'warn' : 'bad'}">${op.normal_rate >= 90 ? L('우수','Excellent') : op.normal_rate >= 75 ? L('양호','Good') : L('개선 필요','Needs improvement')}</div>
          </div>
          <div class="tx-detail-kpi-tile usage">
            <div class="lbl">${L('정상 이용률','Normal usage')}</div>
            <div class="val">${usageRate}<span class="unit">%</span></div>
            <div class="cap" data-tone="${usageRate >= 90 ? 'ok' : usageRate >= 80 ? 'warn' : 'bad'}">${usageRate >= 90 ? L('활발','Active') : usageRate >= 80 ? L('보통','Moderate') : L('저조','Low')}</div>
          </div>
        </div>
        <div class="tx-detail-charts">
          <div class="tx-detail-chart">
            <div class="tx-detail-chart-head">${L('주지표 레이더','6-axis radar')}</div>
            ${radar}
          </div>
          <div class="tx-detail-chart">
            <div class="tx-detail-chart-head">${L('세부 점수 분해','Score breakdown')}</div>
            ${bars}
          </div>
        </div>
      </div>
    `;
  }

  /* ─── 주지표 레이더 차트 (SVG) ─── */
  function renderRadar(ax) {
    const labels = ['통신가동','상태정합','물리정합','연계','요금공시','신뢰'];
    const scores = [
      (ax.p_uptime??0)/20, (ax.p_state??0)/18, (ax.p_phys??0)/15,
      (ax.p_link??0)/12, (ax.p_price??0)/12, (ax.p_trust??0)/8
    ];
    const cx = 130, cy = 125, R = 90;
    const angleStep = Math.PI * 2 / 6;
    const startAngle = -Math.PI / 2; // 12시 방향 시작

    // 그리드(3단계 hexagon)
    let grid = '';
    for (let r = 1; r <= 3; r++) {
      const points = [];
      for (let i = 0; i < 6; i++) {
        const a = startAngle + angleStep * i;
        points.push(`${cx + Math.cos(a) * (R * r/3)},${cy + Math.sin(a) * (R * r/3)}`);
      }
      grid += `<polygon points="${points.join(' ')}" fill="none" stroke="#E2E8F0" stroke-width="1"/>`;
    }
    // 축 라인
    let axes = '';
    for (let i = 0; i < 6; i++) {
      const a = startAngle + angleStep * i;
      axes += `<line x1="${cx}" y1="${cy}" x2="${cx + Math.cos(a) * R}" y2="${cy + Math.sin(a) * R}" stroke="#E2E8F0" stroke-width="1"/>`;
    }
    // 데이터 폴리곤
    const dataPoints = scores.map((s, i) => {
      const a = startAngle + angleStep * i;
      const dist = R * Math.max(0, Math.min(1, s));
      return `${cx + Math.cos(a) * dist},${cy + Math.sin(a) * dist}`;
    });
    const polygon = `<polygon points="${dataPoints.join(' ')}" fill="rgba(26,173,108,0.18)" stroke="#1AAD6C" stroke-width="2" stroke-linejoin="round"/>`;
    const dots = scores.map((s, i) => {
      const a = startAngle + angleStep * i;
      const dist = R * Math.max(0, Math.min(1, s));
      return `<circle cx="${cx + Math.cos(a) * dist}" cy="${cy + Math.sin(a) * dist}" r="3.5" fill="#1AAD6C"/>`;
    }).join('');
    // 라벨
    const labelEls = labels.map((l, i) => {
      const a = startAngle + angleStep * i;
      const lx = cx + Math.cos(a) * (R + 18);
      const ly = cy + Math.sin(a) * (R + 18);
      return `<text x="${lx}" y="${ly}" text-anchor="middle" dominant-baseline="middle" font-size="12" font-weight="600" fill="var(--color-gray-600)">${axisLabel(l)}</text>`;
    }).join('');

    return `
      <svg class="tx-radar-svg" viewBox="0 0 260 250" role="img" aria-label="${L('주지표 레이더 차트','6-axis radar chart')}">
        ${grid}${axes}${polygon}${dots}${labelEls}
      </svg>
    `;
  }

  /* ─── 세부 점수 분해 (가로 바차트) — 화사한 프리미엄 보석 톤 + 그라데이션 ─── */
  function renderAxisBars(ax) {
    const items = [
      { label:'통신가동', val:ax.p_uptime, max:20, color:'linear-gradient(90deg, #6366F1, #818CF8)' },
      { label:'상태정합', val:ax.p_state,  max:18, color:'linear-gradient(90deg, #F43F5E, #FB7185)' },
      { label:'물리정합', val:ax.p_phys,   max:15, color:'linear-gradient(90deg, #10B981, #34D399)' },
      { label:'연계',     val:ax.p_link,   max:12, color:'linear-gradient(90deg, #06B6D4, #22D3EE)' },
      { label:'요금공시', val:ax.p_price,  max:12, color:'linear-gradient(90deg, #F59E0B, #FBBF24)' },
      { label:'신뢰',     val:ax.p_trust,  max:8,  color:'linear-gradient(90deg, #A855F7, #C084FC)' },
      { label:'인프라', val:ax.a_infra,   max:6, color:'linear-gradient(90deg, #94A3B8, #CBD5E1)' },
      { label:'이용도', val:ax.a_use,     max:5, color:'linear-gradient(90deg, #94A3B8, #CBD5E1)' },
      { label:'가격수준', val:ax.a_pricelv, max:4, color:'linear-gradient(90deg, #94A3B8, #CBD5E1)' },
    ];
    return `
      <div class="tx-axis-bars">
        ${items.map(i => `
          <div class="tx-axis-bar-row">
            <span class="ab-label">${axisLabel(i.label)}</span>
            <span class="ab-track"><span class="ab-fill" style="width:${(i.val/i.max*100).toFixed(1)}%; background:${i.color};"></span></span>
            <span class="ab-val">${i.val}</span>
          </div>
        `).join('')}
      </div>
    `;
  }

  /* ─── 전체 렌더링 ─── */
  function render() {
    const ops = getOperators();
    const cpoOp = currentRole === 'cpo' && cpoSelectedBid ? ops.find(o => o.bid === cpoSelectedBid) : null;

    const html = `
      <div class="tx-inner">
        ${renderMetaBar()}
        ${renderRoleBanner(currentRole)}
        ${currentRole === 'cpo' ? renderCpoSelector(ops) : ''}
        ${currentRole === 'cpo' && cpoOp ? renderMineSummary(cpoOp, ops) : ''}
        ${renderKPI()}
        ${renderPillars()}
        ${renderRanking(ops, currentRole)}
      </div>
    `;
    body.innerHTML = html;
    bindBodyEvents();
  }

  /* ─── 바디 내 이벤트 바인딩 ─── */
  function bindBodyEvents() {
    // 필터 칩
    body.querySelectorAll('[data-rfilter]').forEach(btn => {
      btn.addEventListener('click', () => {
        rankFilter = btn.dataset.rfilter;
        render();
      });
    });
    // 검색
    const search = body.querySelector('#txRankSearch');
    if (search) {
      let timer = null;
      search.addEventListener('input', () => {
        rankSearch = search.value;
        clearTimeout(timer);
        timer = setTimeout(render, 200);
      });
    }
    // 자사 셀렉터
    const cpoSel = body.querySelector('#txCpoSelect');
    if (cpoSel) {
      cpoSel.addEventListener('change', () => {
        cpoSelectedBid = cpoSel.value;
        render();
      });
    }
    // 랭킹 행 클릭 → 상세 패널 표시
    body.querySelectorAll('.tx-rank-table tbody tr[data-bid]').forEach(tr => {
      tr.addEventListener('click', () => {
        selectedDetailBid = tr.dataset.bid;
        render();
        setTimeout(() => {
          document.getElementById('txDetailPanel')?.scrollIntoView({ behavior:'smooth', block:'center' });
        }, 50);
      });
    });
    // 상세 데이터 버튼
    body.querySelector('#txDetailMore')?.addEventListener('click', () => {
      if (window.__toast) window.__toast(L('사업자 상세 페이지는 곧 오픈 예정입니다.','The operator detail page is coming soon.'), 'info');
    });
  }

  /* ─── 인라인 초기화 (모달 열기/닫기 로직 제거, 페이지 로드 시 즉시 렌더) ─── */
  function init() { render(); }

  // 역할 전환 (인라인 섹션 헤더의 .tx-inline-role-btn)
  roleBtns?.forEach(btn => {
    btn.addEventListener('click', () => {
      roleBtns.forEach(b => { b.classList.remove('active'); b.setAttribute('aria-selected', 'false'); });
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');
      currentRole = btn.dataset.role;
      if (currentRole !== 'cpo') cpoSelectedBid = '';
      render();
    });
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  // [다국어] 언어 전환 시 인라인 대시보드 전체 재렌더(현재 역할/선택 상태 유지)
  window.addEventListener('langChange', function(e){ _txLang = (e && e.detail && e.detail.lang) || (window.__i18n && window.__i18n.getLang ? window.__i18n.getLang() : _txLang); try { render(); } catch(e){} });

})();
