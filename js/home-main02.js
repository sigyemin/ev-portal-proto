/* home-main02.js — 메인페이지 시안(main_02) 전용 인터랙션
   · 구매 보조금 계산기 (더미 데이터 · 작동 예시)
   · Quick 버튼 메뉴 (AI 헬프데스크 슬라이드 패널 + 회원카드 추가)
   · 전기차 이용자 서비스 5카드 슬라이더 화살표
   · 보조금·차량 카드 클릭 → charging-fee.html?tab=ev
   · 인라인 AI 검색/칩/탭 → window.AIFloating 위임
   AI 슬라이드 패널·요금 카드/상세 탭은 ai-floating.js / home-v2.js 가 처리.
*/
(function () {
  'use strict';
  document.body.classList.add('m02-home');

  /* ===== 1) 구매 보조금 계산기 ============================================
     더미 데이터 출처: subsidy-vehicles.html(보조금 지급대상 차종) 차종 일부.
     ※ 국고/지방 보조금 분리값과 지역계수는 데모용 가정값입니다(실데이터 아님).
        기본 표시값(아이오닉6·서울·5,200만원 → 국고 500 / 지방 180 / 합계 680)은
        업로드된 시안 이미지와 동일하게 맞춘 예시입니다.
  ============================================================================ */
  // 차량유형 → 차종 목록
  var VEHICLES = {
    ev_sedan: [
      { id: 'ioniq6',  name: '아이오닉 6', maker: '현대',   nat: 500, price: 5200 },
      { id: 'model3',  name: 'Model 3',   maker: '테슬라', nat: 340, price: 5699 }
    ],
    ev_suv: [
      { id: 'ev6',      name: 'EV6',        maker: '기아',  nat: 480, price: 4900 },
      { id: 'toresevx', name: '토레스 EVX', maker: 'KGM',  nat: 460, price: 4395 }
    ],
    ev_truck: [
      { id: 'porter', name: '포터 II 일렉트릭', maker: '현대', nat: 1100, price: 4395 }
    ],
    fcev: [
      { id: 'nexo', name: '넥쏘', maker: '현대', nat: 2250, price: 6765 }
    ]
  };
  var TYPE_LABEL = { ev_sedan: '전기 승용(세단)', ev_suv: '전기 승용(SUV)', ev_truck: '전기 화물(트럭)', fcev: '수소 전기차' };
  // 지자체 지방보조금(만원) — 데모용 가정값
  var REGIONS = {
    '서울특별시': 180, '부산광역시': 300, '대구광역시': 350, '인천광역시': 320,
    '경기도': 400, '제주특별자치도': 400, '전라남도': 520, '강원특별자치도': 480
  };

  var elType  = document.getElementById('m02CalcType');
  var elModel = document.getElementById('m02CalcModel');
  var elRegion= document.getElementById('m02CalcRegion');
  var elPrice = document.getElementById('m02CalcPrice');
  var elRun   = document.getElementById('m02CalcRun');

  function fmt(n) { return Number(n).toLocaleString('ko-KR'); }

  /* ===== 다국어 유틸 (i18n.js 코어 사용) ============================
     · 차량 제조사/차종명: EN 모드에서 영문 표기로 변환(고유명사 매핑)
     · 금액: KO 'N만원' / EN 'KRW X.XM' (subsidy 페이지 표기 규칙과 동일,
       1만원 = 0.0001조 → 만원/100 = 백만원(M) 단위)
     · 지역 select 의 option value 는 한글(서울특별시 등)이라 REGIONS 조회는 언어와 무관하게 동작 */
  var _lang = (window.__i18n && window.__i18n.getLang) ? window.__i18n.getLang() : 'ko';
  function EN() { return _lang === 'en'; }
  var MAKER_EN = { '현대': 'Hyundai', '기아': 'Kia', '테슬라': 'Tesla', 'KGM': 'KGM' };
  var NAME_EN  = { '아이오닉 6': 'Ioniq 6', 'Model 3': 'Model 3', 'EV6': 'EV6',
                   '토레스 EVX': 'Torres EVX', '포터 II 일렉트릭': 'Porter II Electric', '넥쏘': 'Nexo' };
  function trMaker(m) { return EN() ? (MAKER_EN[m] || m) : m; }
  function trName(n)  { return EN() ? (NAME_EN[n]  || n) : n; }
  function trimNum(x) { return (Math.round(x * 100) / 100).toString(); }
  // 만원 단위 금액 → 표시 문자열 (셀용: 단위 포함)
  function money(manwon) {
    if (EN()) return 'KRW ' + trimNum(manwon / 100) + 'M';
    return fmt(manwon) + '만원';
  }

  function fillModels(typeKey, selectId) {
    if (!elModel) return;
    var list = VEHICLES[typeKey] || [];
    elModel.innerHTML = list.map(function (v) {
      return '<option value="' + v.id + '">' + trMaker(v.maker) + ' ' + trName(v.name) + '</option>';
    }).join('');
    if (selectId) {
      var opt = Array.prototype.find.call(elModel.options, function (o) { return o.value === selectId; });
      if (opt) opt.selected = true;
    }
  }

  function currentVehicle() {
    var list = VEHICLES[elType.value] || [];
    var id = elModel.value;
    return list.find(function (v) { return v.id === id; }) || list[0];
  }

  function calc() {
    if (!elType) return;
    var v = currentVehicle();
    if (!v) return;
    var nat = v.nat;                                   // 국고 보조금(만원)
    var local = REGIONS[elRegion.value] != null ? REGIONS[elRegion.value] : 0; // 지방 보조금(만원)
    var total = nat + local;
    var price = parseInt(String(elPrice.value).replace(/[^0-9]/g, ''), 10);
    if (isNaN(price) || price <= 0) price = v.price;
    var real = Math.max(price - total, 0);

    setText('m02ResTotal', EN() ? trimNum(total / 100) : fmt(total));  // 단위(m02ResTotalUnit)는 data-i18n 로 표시
    setText('m02ResNat', money(nat));
    setText('m02ResLocal', money(local));
    setText('m02ResPrice', money(price));
    setText('m02ResReal', money(real));
  }
  function setText(id, t) { var el = document.getElementById(id); if (el) el.textContent = t; }

  if (elType) {
    fillModels(elType.value, 'ioniq6');
    elType.addEventListener('change', function () {
      fillModels(elType.value);
      var v = currentVehicle(); if (v) elPrice.value = fmt(v.price);
      calc();
    });
    elModel.addEventListener('change', function () {
      // 차종 변경 시 판매가 기본값을 해당 차량 가격으로 동기화
      var v = currentVehicle(); if (v) elPrice.value = fmt(v.price);
      calc();
    });
    elRegion.addEventListener('change', calc);
    elPrice.addEventListener('input', function () {
      var raw = elPrice.value.replace(/[^0-9]/g, '');
      elPrice.value = raw ? fmt(raw) : '';
    });
    if (elRun) elRun.addEventListener('click', calc);
    calc(); // 초기 표시(시안 기본값)

    // [다국어] 언어 전환 시 차종 목록(제조사/차종명)·금액 표기 재계산
    window.addEventListener('langChange', function (e) {
      _lang = (e && e.detail && e.detail.lang) || (window.__i18n && window.__i18n.getLang ? window.__i18n.getLang() : _lang);
      fillModels(elType.value, elModel ? elModel.value : null);
      calc();
    });
  }

  /* ===== 2) Quick 버튼 메뉴 ============================================== */
  var quick = document.getElementById('m02Quick');
  if (quick) {
    var qToggle = quick.querySelector('.m02-quick-toggle');
    qToggle.addEventListener('click', function (e) {
      e.stopPropagation();
      quick.classList.toggle('open');
      qToggle.setAttribute('aria-expanded', quick.classList.contains('open') ? 'true' : 'false');
    });
    document.addEventListener('click', function (e) {
      if (!quick.contains(e.target)) quick.classList.remove('open');
    });
    // AI 헬프데스크 → 우측 슬라이드 AI 헬프데스크 패널 열기 (aif). 없으면 히어로로 이동(폴백)
    var aiBtn = quick.querySelector('[data-quick="ai"]');
    if (aiBtn) aiBtn.addEventListener('click', function () {
      quick.classList.remove('open');
      if (window.AIFloating && typeof window.AIFloating.open === 'function') {
        window.AIFloating.open('personal');
      } else {
        location.href = 'index.html?ai=personal#aiSectionAnchor';
      }
    });
    // 회원카드 추가 → 발급 신청 페이지로 이동(링크는 마크업의 href 사용)
  }

  /* ===== 3) 전기차 이용자 서비스 — 무한 루프 캐러셀(5개 노출) ============= */
  var track = document.getElementById('m02EvsvcTrack');
  if (track) {
    var prevBtn = document.querySelector('.m02-evsvc-nav.prev');
    var nextBtn = document.querySelector('.m02-evsvc-nav.next');
    var GAP = 16;
    var animating = false;

    function cardStep() {
      var card = track.querySelector('.m02-evsvc-card');
      return card ? card.getBoundingClientRect().width + GAP : 0;
    }
    // next: 첫 카드를 끝으로 보내며 한 칸 이동 (무한 루프)
    function goNext() {
      if (animating) return; animating = true;
      var step = cardStep();
      track.style.transition = 'transform .35s cubic-bezier(.22,1,.36,1)';
      track.style.transform = 'translateX(-' + step + 'px)';
      var done = function () {
        track.removeEventListener('transitionend', done);
        track.style.transition = 'none';
        track.style.transform = 'translateX(0)';
        track.appendChild(track.firstElementChild);   // 첫 카드 → 맨 뒤
        void track.offsetWidth;                        // reflow
        animating = false;
      };
      track.addEventListener('transitionend', done);
    }
    // prev: 마지막 카드를 앞으로 가져와 반대 방향 이동
    function goPrev() {
      if (animating) return; animating = true;
      var step = cardStep();
      track.insertBefore(track.lastElementChild, track.firstElementChild); // 마지막 → 맨 앞
      track.style.transition = 'none';
      track.style.transform = 'translateX(-' + step + 'px)';
      void track.offsetWidth;
      track.style.transition = 'transform .35s cubic-bezier(.22,1,.36,1)';
      track.style.transform = 'translateX(0)';
      var done = function () {
        track.removeEventListener('transitionend', done);
        animating = false;
      };
      track.addEventListener('transitionend', done);
    }
    if (nextBtn) nextBtn.addEventListener('click', goNext);
    if (prevBtn) prevBtn.addEventListener('click', goPrev);
  }

  /* ===== 4) 보조금·차량 카드 클릭 → 보조금 지급대상 차종(해당 차량 검색 필터 적용) === */
  document.querySelectorAll('.m02-veh-card').forEach(function (card) {
    card.addEventListener('click', function () {
      var nameEl = card.querySelector('.m02-veh-name');
      var q = nameEl ? nameEl.textContent.trim() : '';
      window.location.href = 'subsidy-vehicles.html' + (q ? '?q=' + encodeURIComponent(q) : '');
    });
    card.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); card.click(); }
    });
  });

  /* ===== 5) 인라인 AI 검색/칩/탭 → AIFloating 위임 ====================== */
  function flowFromText(q) {
    q = q || '';
    if (/충전|장애|고장/.test(q)) return 'charge';
    if (/보조금|지원금|지급/.test(q)) return 'subsidy';
    return 'personal';
  }
  function askAI(q, flow) {
    q = (q || '').trim();
    if (!q) return;
    if (window.AIFloating && window.AIFloating.ask) window.AIFloating.ask(q, flow || flowFromText(q));
  }
  var aiForm = document.getElementById('m02AiForm');
  var aiInput = document.getElementById('m02AiInput');
  if (aiForm) aiForm.addEventListener('submit', function (e) {
    e.preventDefault(); askAI(aiInput.value, currentAiFlow());
  });
  var _aiFlow = 'personal';
  function currentAiFlow() { return _aiFlow; }
  document.querySelectorAll('.m02-ai-tab').forEach(function (tab) {
    tab.addEventListener('click', function () {
      document.querySelectorAll('.m02-ai-tab').forEach(function (t) { t.classList.remove('active'); });
      tab.classList.add('active');
      _aiFlow = tab.getAttribute('data-flow') || 'personal';
      if (window.AIFloating && window.AIFloating.setFlow) { /* 패널 열기 전엔 플로우만 기억 */ }
    });
  });
  document.querySelectorAll('.m02-ai-chips button').forEach(function (chip) {
    chip.addEventListener('click', function () { askAI(chip.textContent.replace(/^#/, ''), currentAiFlow()); });
  });
  /* (푸터 정책 링크는 공통 partials.js 푸터로 이동 — 전 페이지 통일) */
})();
