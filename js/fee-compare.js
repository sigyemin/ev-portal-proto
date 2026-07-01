/* fee-compare.js — 메인페이지 '충전 요금 비교'
   [카드비교] 충전유형(급속/초급속/완속) × 요금기준(회원가/로밍가/비회원가) 단가 1개를 CPO별 카드로 비교 · 최저가 좌측 오름차순 · 무한 캐러셀
   [상세비교] 좌측 CPO 카드(선택) + 우측 상세 패널(충전유형별 회원가/비회원가/로밍가/회원 절감)
   · 로밍가는 '보유 카드'가 선택됐을 때만 표시(그 외 '-'), 협약 미체결(roaming=null)은 미공시
   · 카드/패널 → 충전 요금 안내 페이지 매트릭스로 이동(+행 하이라이트)
   · KO/EN 다국어 (langChange 시 재렌더링)
*/
(function () {
  'use strict';

  var track = document.getElementById('m03FeeTrack');
  var detailGrid = document.getElementById('m03DetailGrid');
  var panel = document.getElementById('m03OpPanel');
  if (!track || !panel) return;

  // member/roaming/guest = '급속' 대표 단가. roaming:null = 로밍 협약 미체결(미공시).
  var OPERATORS = [
    { id:'everon',    name:'에버온',      letter:'E', color:'#64aee6', member:292.9, roaming:347.6, guest:380.0, on:true,
      desc:'환경부 인증 · 전국 12,340기', desc_en:'MoE certified · 12,340 nationwide' },
    { id:'chaevi',    name:'대영채비',    letter:'D', color:'#e0533d', member:298.0, roaming:350.0, guest:384.0, on:true,
      desc:'대형마트 제휴 · 전국 9,980기', desc_en:'Mart partnerships · 9,980 nationwide' },
    { id:'kepco',     name:'한국전력',    letter:'K', color:'#2f6fbf', member:305.0, roaming:352.0, guest:388.0, on:true,
      desc:'공공 운영 · 전국 14,500기', desc_en:'Public operator · 14,500 nationwide' },
    { id:'starcof',   name:'스타코프',    letter:'S', color:'#3cbf7a', member:310.0, roaming:358.0, guest:392.0, on:true,
      desc:'급속 특화 · 전국 8,720기', desc_en:'Fast-charge focus · 8,720 nationwide' },
    { id:'chajevi',   name:'차지비',      letter:'C', color:'#9461e9', member:320.0, roaming:365.0, guest:398.0, on:true,
      desc:'할인 다양 · 전국 7,150기', desc_en:'Various discounts · 7,150 nationwide' },
    { id:'powercube', name:'파워큐브',    letter:'P', color:'#f0a128', member:324.4, roaming:null,  guest:405.0, on:true,
      desc:'초고속 전문 · 전국 5,640기', desc_en:'Ultra-fast specialist · 5,640 nationwide' },
    { id:'ikaplug',   name:'이카플러그',  letter:'I', color:'#4263eb', member:301.0, roaming:349.0, guest:386.0, on:false,
      desc:'주거지 특화 · 전국 6,210기', desc_en:'Residential focus · 6,210 nationwide' },
    { id:'cleanelex', name:'클린일렉스',  letter:'X', color:'#1098ad', member:308.0, roaming:353.0, guest:389.0, on:false,
      desc:'완속 특화 · 전국 5,980기', desc_en:'Slow-charge focus · 5,980 nationwide' },
    { id:'chargein',  name:'차지인',      letter:'J', color:'#f76707', member:312.0, roaming:null,  guest:390.0, on:false,
      desc:'사업장 특화 · 전국 4,730기', desc_en:'Workplace focus · 4,730 nationwide' },
    { id:'elink',     name:'SK일렉링크',  letter:'L', color:'#d6336c', member:315.0, roaming:360.0, guest:395.0, on:false,
      desc:'고속도로 거점 · 전국 5,120기', desc_en:'Highway hubs · 5,120 nationwide' },
    { id:'humax',     name:'휴맥스이브이', letter:'H', color:'#0ca678', member:318.0, roaming:362.0, guest:396.0, on:false,
      desc:'주차장 연계 · 전국 4,410기', desc_en:'Parking-linked · 4,410 nationwide' },
    { id:'gscaltex',  name:'GS칼텍스',    letter:'G', color:'#5c940d', member:322.0, roaming:366.0, guest:399.0, on:false,
      desc:'주유소 거점 · 전국 3,860기', desc_en:'Gas-station hubs · 3,860 nationwide' }
  ];

  var L = {
    won:     { ko: '원', en: 'KRW' },
    lowest:  { ko: '최저가', en: 'Lowest' },
    opLabel: { ko: '충전기 사업자 선택', en: 'Select Operators' },
    basisMember:  { ko: '회원가', en: 'Member' },
    basisRoaming: { ko: '로밍가', en: 'Roaming' },
    basisGuest:   { ko: '비회원가', en: 'Guest' },
    cardHold: { ko: '보유 카드', en: 'My card' },
    typeFast:  { ko: '급속', en: 'Fast' },
    typeUltra: { ko: '초급속', en: 'Ultra' },
    typeSlow:  { ko: '완속', en: 'Slow' },
    basisSuffix: { ko: ' 기준', en: '' },
    myCard:    { ko: '내 카드', en: 'My card' },
    naPrice:   { ko: '로밍 미지원', en: 'No roaming' },
    naShort:   { ko: '미공시', en: 'N/A' },
    naHint:    { ko: '협약 미체결 · 미공시', en: 'No partner agreement' },
    empty:     { ko: '충전기 사업자를 1개 이상 선택하세요.', en: 'Select at least one operator.' },
    thType:    { ko: '충전유형', en: 'Type' },
    thMember:  { ko: '회원가', en: 'Member' },
    thGuest:   { ko: '비회원가', en: 'Guest' },
    thRoaming: { ko: '로밍가', en: 'Roaming' },
    thSave:    { ko: '회원 절감', en: 'Member saving' },
    unit:      { ko: '(단위: 원)', en: '(KRW)' },
    findCta:   { ko: '충전소 찾기', en: 'Find stations' }
  };

  function lang(){ return (window.__i18n && window.__i18n.getLang) ? window.__i18n.getLang() : 'ko'; }
  function en(){ return lang() === 'en'; }
  function t(k){ return en() ? L[k].en : L[k].ko; }
  function esc(s){ return String(s).replace(/[&<>"]/g, function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }

  var basisSel = document.getElementById('m03FeeBasis');
  var typeSel = document.getElementById('m03FeeType');
  var cardSel = document.getElementById('m03CardSel');
  var cardRow = document.getElementById('m03CardRow');
  var panelEl = document.getElementById('m03DetailPanel');
  var selDetail = null;
  var detailList = [];
  var PAGE = 4, detailPage = 0;

  function basis(){ return basisSel ? basisSel.value : 'member'; }
  function ctype(){ return typeSel ? typeSel.value : 'fast'; }
  function basisLabel(){
    var b = basis();
    return b === 'roaming' ? t('basisRoaming') : (b === 'guest' ? t('basisGuest') : t('basisMember'));
  }
  function typeLabel(k){ return k === 'ultra' ? t('typeUltra') : (k === 'slow' ? t('typeSlow') : t('typeFast')); }
  function stationOf(o){ return (en() ? o.desc_en : o.desc).split(' · ').pop(); }

  // 충전유형별 단가(더미): 초급속 +12 / 완속 -8. roaming=null 이면 전부 null.
  function typeRates(o) {
    function band(base) {
      if (base == null) return { fast:null, ultra:null, slow:null };
      return { fast:base, ultra:+(base + 12).toFixed(1), slow:+(base - 8).toFixed(1) };
    }
    var m = band(o.member), r = band(o.roaming), g = band(o.guest);
    return {
      fast:  { member:m.fast,  roaming:r.fast,  guest:g.fast  },
      ultra: { member:m.ultra, roaming:r.ultra, guest:g.ultra },
      slow:  { member:m.slow,  roaming:r.slow,  guest:g.slow  }
    };
  }
  // 카드비교 유효 단가: 로밍가는 보유카드 사업자=회원가 / 그 외=로밍가(null 가능)
  function effRate(o, tkey) {
    var b = basis(), R = typeRates(o);
    if (b === 'guest') return R[tkey].guest;
    if (b === 'roaming') return (cardSel && o.id === cardSel.value) ? R[tkey].member : R[tkey].roaming;
    return R[tkey].member;
  }
  function isMyCard(o){ return basis() === 'roaming' && cardSel && cardSel.value === o.id; }
  // 상세 패널 로밍가: 보유 카드가 선택됐을 때만 표시(그 외 '-')
  function panelRoaming(o, tkey) {
    if (basis() !== 'roaming') return '-';
    var card = cardSel && cardSel.value;
    if (!card || card === o.id) return '-';
    var v = typeRates(o)[tkey].roaming;
    return v == null ? '-' : v.toFixed(1);
  }
  function matrixHref(o){ return 'charging-fee.html?tab=ev&op=' + encodeURIComponent(o.name) + '#section-matrix'; }
  function findHref(o){ return 'charging-find.html?tab=map&operator=' + o.id; }
  function cmp(a, b){ if (a == null && b == null) return 0; if (a == null) return 1; if (b == null) return -1; return a - b; }

  // ----- 드롭다운 체크박스 -----
  function buildPanel() {
    panel.innerHTML = OPERATORS.map(function (o) {
      return '<label class="m03-op-item">' +
        '<input type="checkbox" value="' + o.id + '"' + (o.on ? ' checked' : '') + '>' +
        '<i class="logo" style="background:' + o.color + '">' + o.letter + '</i>' +
        '<span>' + esc(o.name) + '</span></label>';
    }).join('');
  }
  function selectedIds() {
    return Array.prototype.slice.call(panel.querySelectorAll('input:checked')).map(function (i) { return i.value; });
  }
  function selectedOps() {
    var ids = selectedIds();
    return OPERATORS.filter(function (o) { return ids.indexOf(o.id) >= 0; });
  }
  function syncLabel() {
    var el = document.getElementById('m03OpLabel');
    if (el) el.textContent = t('opLabel') + ' (' + selectedIds().length + ')';
  }

  // ----- 보유 카드 선택 (로밍가일 때만 노출) -----
  function buildCardSelect() {
    if (!cardSel) return;
    var ops = selectedOps();
    var prev = cardSel.value;
    cardSel.innerHTML = ops.map(function (o) { return '<option value="' + o.id + '">' + t('cardHold') + ': ' + esc(o.name) + '</option>'; }).join('');
    if (prev && ops.some(function (o) { return o.id === prev; })) cardSel.value = prev;
  }
  function updateBasisUI() {
    var roaming = basis() === 'roaming';
    if (cardRow) cardRow.hidden = !roaming;
    if (roaming) buildCardSelect();
  }

  // ===== [카드비교] 카드 1장 — 충전유형 × 요금기준 단가 1개 =====
  function cardHTML(o, min) {
    var p = effRate(o, ctype());
    var href = matrixHref(o);
    var label = basisLabel() + ' · ' + typeLabel(ctype()) + t('basisSuffix');
    var head = '<div class="m03-fee-top"><i class="logo" style="background:' + o.color + '">' + o.letter + '</i>' +
      '<div><strong>' + esc(o.name) + '</strong><span>' + esc(stationOf(o)) + '</span></div></div>';

    if (p == null) {
      return '<a class="m03-fee-card is-na" href="' + href + '">' + head +
        '<div class="m03-price-box na"><small>' + label + '</small>' +
        '<span class="m03-price-val"><em class="na-em">' + t('naPrice') + '</em></span>' +
        '<mark class="na-mark">' + t('naShort') + '</mark></div></a>';
    }
    var pct = min > 0 ? ((p - min) / min * 100) : 0;
    var lowest = pct <= 0;
    var badge = lowest
      ? '<mark>' + t('lowest') + '</mark>'
      : '<mark>' + (en() ? '+' + pct.toFixed(1) + '% vs lowest' : '최저대비 +' + pct.toFixed(1) + '%') + '</mark>';
    var cls = 'm03-fee-card' + (lowest ? ' is-lowest' : '');
    var myc = isMyCard(o) ? '<span class="m03-mycard-tag">' + t('myCard') + '</span>' : '';
    return '<a class="' + cls + '" href="' + href + '">' + head +
      '<div class="m03-price-box"><small>' + label + myc + '</small>' +
      '<span class="m03-price-val"><em>' + p.toFixed(1) + '</em><b>' + t('won') + '</b></span>' +
      badge + '</div></a>';
  }

  // ===== [상세비교] 좌측 카드 1장 — 충전유형별 단가(선택 시 우측 패널 갱신) =====
  function detailHTML(o, sel) {
    var myc = isMyCard(o);
    var na = basis() === 'roaming' && !myc && o.roaming == null;
    var chip = myc ? '<span class="m03-dcard-chip mycard">' + t('myCard') + '</span>' : '';
    var head = '<div class="m03-dcard-top"><i class="logo" style="background:' + o.color + '">' + o.letter + '</i>' +
      '<div class="m03-dcard-name"><strong>' + esc(o.name) + '</strong>' +
      '<span class="m03-dcard-stations">' + esc(stationOf(o)) + '</span>' + chip + '</div></div>';
    var cls = 'm03-dcard' + (o.id === sel ? ' selected' : '');

    if (na) {
      return '<button type="button" class="' + cls + ' is-na" data-id="' + o.id + '">' + head +
        '<div class="m03-dcard-na"><i class="ti ti-ban"></i><span>' + t('naPrice') + '</span><small>' + t('naHint') + '</small></div></button>';
    }
    var types = [['fast', t('typeFast')], ['ultra', t('typeUltra')], ['slow', t('typeSlow')]];
    var rows = types.map(function (rw) {
      var v = effRate(o, rw[0]);
      return '<div class="m03-dcard-row"><span>' + rw[1] + '</span><strong>' + (v == null ? t('naShort') : v.toFixed(1)) + '</strong></div>';
    }).join('');
    return '<button type="button" class="' + cls + '" data-id="' + o.id + '">' + head + rows + '</button>';
  }

  // ===== [상세비교] 우측 상세 패널 =====
  function renderPanel() {
    if (!panelEl) return;
    var o = OPERATORS.filter(function (x) { return x.id === selDetail; })[0];
    if (!o) { panelEl.innerHTML = ''; return; }
    var rows = [['fast', t('typeFast')], ['ultra', t('typeUltra')], ['slow', t('typeSlow')]].map(function (rw) {
      var R = typeRates(o)[rw[0]];
      var save = (R.member - R.guest).toFixed(1);
      return '<tr><th>' + rw[1] + '</th>' +
        '<td class="blue">' + R.member.toFixed(1) + '</td>' +
        '<td>' + R.guest.toFixed(1) + '</td>' +
        '<td>' + panelRoaming(o, rw[0]) + '</td>' +
        '<td class="red">' + save + '</td></tr>';
    }).join('');
    panelEl.innerHTML =
      '<div class="m03-detail-panel-top"><span class="logo" style="background:' + o.color + '">' + o.letter + '</span>' +
      '<div><h3>' + esc(o.name) + '</h3></div><small>' + t('unit') + '</small></div>' +
      '<table class="m03-detail-table"><thead><tr>' +
      '<th>' + t('thType') + '</th><th>' + t('thMember') + '</th><th>' + t('thGuest') + '</th><th>' + t('thRoaming') + '</th><th>' + t('thSave') + '</th>' +
      '</tr></thead><tbody>' + rows + '</tbody></table>' +
      '<a href="' + findHref(o) + '" class="m03-detail-cta">' + t('findCta') + '</a>';
  }

  // ----- 상세비교 좌측 2×2 그리드 + 페이지네이션 -----
  function renderDetailGrid() {
    if (!detailGrid) return;
    var pages = Math.max(1, Math.ceil(detailList.length / PAGE));
    if (detailPage >= pages) detailPage = 0;
    var slice = detailList.slice(detailPage * PAGE, detailPage * PAGE + PAGE);
    detailGrid.innerHTML = detailList.length
      ? slice.map(function (o) { return detailHTML(o, selDetail); }).join('')
      : '<p class="m03-fee-empty">' + t('empty') + '</p>';
    var pager = document.getElementById('m03DetailPager');
    var lbl = document.getElementById('m03DetailPageLabel');
    if (lbl) lbl.textContent = (detailPage + 1) + ' / ' + pages;
    if (pager) pager.hidden = pages <= 1;
  }

  // ----- 트랙 렌더 -----
  function resetTrack(el) { el.style.transition = 'none'; el.style.transform = 'translateX(0)'; }
  function render() {
    var list = selectedOps().slice().sort(function (a, b) { return cmp(effRate(a, ctype()), effRate(b, ctype())); });
    var valid = list.filter(function (o) { return effRate(o, ctype()) != null; });
    var min = valid.length ? effRate(valid[0], ctype()) : 0;

    resetTrack(track);
    track.innerHTML = list.length
      ? list.map(function (o) { return cardHTML(o, min); }).join('')
      : '<p class="m03-fee-empty">' + t('empty') + '</p>';

    if (detailGrid) {
      detailList = list;
      if (!list.length) selDetail = null;
      else if (!list.some(function (o) { return o.id === selDetail; })) selDetail = list[0].id;
      renderDetailGrid();
      renderPanel();
    }
    syncLabel();
  }

  // ----- 무한 루프 캐러셀 (트랙별 바인딩) -----
  function bindCarousel(trackEl, prevBtn, nextBtn) {
    if (!trackEl) return;
    var GAP = 16, animating = false;
    function step() { var c = trackEl.querySelector('.m03-fee-card, .m03-dcard'); return c ? c.getBoundingClientRect().width + GAP : 0; }
    function goNext() {
      if (animating || trackEl.children.length < 2) return; animating = true;
      var s = step();
      trackEl.style.transition = 'transform .35s cubic-bezier(.22,1,.36,1)';
      trackEl.style.transform = 'translateX(-' + s + 'px)';
      var done = function () {
        trackEl.removeEventListener('transitionend', done);
        trackEl.style.transition = 'none'; trackEl.style.transform = 'translateX(0)';
        trackEl.appendChild(trackEl.firstElementChild); void trackEl.offsetWidth; animating = false;
      };
      trackEl.addEventListener('transitionend', done);
    }
    function goPrev() {
      if (animating || trackEl.children.length < 2) return; animating = true;
      var s = step();
      trackEl.insertBefore(trackEl.lastElementChild, trackEl.firstElementChild);
      trackEl.style.transition = 'none'; trackEl.style.transform = 'translateX(-' + s + 'px)';
      void trackEl.offsetWidth;
      trackEl.style.transition = 'transform .35s cubic-bezier(.22,1,.36,1)';
      trackEl.style.transform = 'translateX(0)';
      var done = function () { trackEl.removeEventListener('transitionend', done); animating = false; };
      trackEl.addEventListener('transitionend', done);
    }
    if (prevBtn) prevBtn.addEventListener('click', goPrev);
    if (nextBtn) nextBtn.addEventListener('click', goNext);
  }

  bindCarousel(track, document.getElementById('m03FeePrev'), document.getElementById('m03FeeNext'));

  // 상세비교 좌측 그리드 페이지네이션 (2×2)
  function pageBy(d) {
    var pages = Math.max(1, Math.ceil(detailList.length / PAGE));
    detailPage = (detailPage + d + pages) % pages;
    renderDetailGrid();
  }
  var dPrev = document.getElementById('m03DetailPrev');
  var dNext = document.getElementById('m03DetailNext');
  if (dPrev) dPrev.addEventListener('click', function () { pageBy(-1); });
  if (dNext) dNext.addEventListener('click', function () { pageBy(1); });

  // 상세비교 카드 클릭 → 선택(페이지 이동 X) → 우측 패널 갱신
  if (detailGrid) {
    detailGrid.addEventListener('click', function (e) {
      var btn = e.target.closest('.m03-dcard');
      if (!btn) return;
      selDetail = btn.getAttribute('data-id');
      Array.prototype.forEach.call(detailGrid.children, function (c) {
        if (c.classList) c.classList.toggle('selected', c.getAttribute('data-id') === selDetail);
      });
      renderPanel();
    });
  }

  // ----- 드롭다운 토글 -----
  var dd = document.getElementById('m03OpDropdown');
  var toggle = document.getElementById('m03OpToggle');
  if (toggle) {
    toggle.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = dd.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      panel.hidden = !open;
    });
    document.addEventListener('click', function (e) {
      if (!dd.contains(e.target)) { dd.classList.remove('open'); toggle.setAttribute('aria-expanded', 'false'); panel.hidden = true; }
    });
  }
  panel.addEventListener('change', function () { buildCardSelect(); render(); });
  if (basisSel) basisSel.addEventListener('change', function () { updateBasisUI(); render(); });
  if (typeSel) typeSel.addEventListener('change', render);
  if (cardSel) cardSel.addEventListener('change', render);
  window.addEventListener('langChange', function () { buildPanel(); updateBasisUI(); syncLabel(); render(); });

  buildPanel();
  updateBasisUI();
  render();
})();
