/* ==========================================================================
   ai-floating.js — 우측 슬라이딩 AI 헬프데스크 위젯 v2.0
   - 메인 화면(#aiSectionAnchor 존재) → 위젯 비활성, 메뉴 클릭만 무반응 처리
   - 서브 화면 → FAB + 메뉴 클릭 → 우측 슬라이딩 패널 (1/3 넓이)
   ========================================================================== */
(function () {
  if (window.AIFloatingLoaded) return;
  window.AIFloatingLoaded = true;

  var isMainPage = !!document.getElementById('aiSectionAnchor');

  // 메인페이지로 ?ai=플로우 파라미터를 달고 진입한 경우, 인라인 섹션의 해당 플로우 탭 활성화
  if (isMainPage) {
    var aiParam = (location.search.match(/[?&]ai=(personal|subsidy|charge)/) || [])[1];
    if (aiParam) {
      window.addEventListener('load', function () {
        var fb = document.querySelector('.ai-flow-btn[data-flow="' + aiParam + '"]');
        if (fb) fb.click();
      });
    }
  }

  // ===== 데이터 =====
  var FLOWS = {
    personal: {
      label: 'AI 맞춤 상담',
      headerSub: '사용 환경에 맞춘 1:1 안내',
      placeholder: '예: 우리 집 충전기 어떤 게 좋을까요?',
      chips: ['아파트 충전기', '저공해 등급', '내 차에 맞는 보조금', '주행거리 비교', '월 충전비'],
      cards: [
        { title: '내가 받을 수 있는 보조금?', desc: '거주지·차종·소득 맞춤 결과', icon: 'subsidy' },
        { title: '우리 집 충전 환경?', desc: '아파트·주택·완속/급속 추천', icon: 'home' },
        { title: '내 차로 바꾸면?', desc: '주행거리·충전 시간 비교', icon: 'compare' }
      ],
      answer: {
        text: '<strong>맞춤 상담</strong>을 시작합니다.<br>거주지·차종·연소득을 알려주시면 신청 가능한 보조금과 추천 차종을 제안해 드릴게요.',
        actions: [
          { title: '구매 보조금 안내', desc: '신청 자격·금액·절차', href: 'subsidy-info.html', primary: true },
          { title: '지자체별 현황', desc: '시군구 단가·접수 현황', href: 'subsidy-region.html' },
          { title: '대상 차종', desc: '환경부 지원 차종 목록', href: 'subsidy-vehicles.html' }
        ],
        suggest: ['내 차량으로 받을 수 있는 보조금?', '서울에서 신청하려면?', '소득 조건이 있나요?']
      }
    },
    subsidy: {
      label: '보조금 큐레이터',
      headerSub: '내가 받을 수 있는 보조금을 한 번에',
      placeholder: '예: 보조금 얼마? 신청 절차?',
      chips: ['최대 보조금', '신청 자격', '필요 서류', '집행 현황', '서식 다운로드'],
      cards: [
        { title: '2026년 보조금 단가', desc: '국비 + 지방비 통합', icon: 'subsidy' },
        { title: '신청 자격 확인', desc: '거주지·연령·자격', icon: 'check' },
        { title: '필요 서류', desc: '신청서·지급 청구서', icon: 'doc' }
      ],
      answer: {
        text: '<strong>2026년 보조금 큐레이션</strong>입니다. 일반 승용 BEV 기준 국비 480만원 + 지방비 100만원 = 최대 580만원 지원. 차량가 7천만원 이상은 100% 단가 적용 대상에서 제외됩니다.',
        actions: [
          { title: '지원 대상·절차', desc: '5단계 신청 안내', href: 'subsidy-target.html', primary: true },
          { title: '대상 차종 목록', desc: '환경부 지원 차종', href: 'subsidy-vehicles.html' },
          { title: '서식 다운로드', desc: '신청서·청구서 양식', href: 'info-forms.html' }
        ],
        suggest: ['지자체별 보조금 차이', '신청 후 처리 기간', '양도양수 신고 방법']
      }
    },
    charge: {
      label: '장애 대응 안내',
      headerSub: '충전 문제 즉시 해결',
      placeholder: '예: 충전이 안 돼요',
      chips: ['충전기 고장', '결제 오류', '카드 인식 안됨', '인근 충전소', '환불 절차'],
      cards: [
        { title: '충전기 장애 신고', desc: '즉시 신고·복구 안내', icon: 'alert' },
        { title: '근처 사용 가능 충전소', desc: '실시간 상태 지도', icon: 'map' },
        { title: '결제·환불 안내', desc: '오결제·환불 처리', icon: 'card' }
      ],
      answer: {
        text: '<strong>충전기 장애 대응</strong>입니다.<br>(1) 카드 칩 청결 확인 → (2) 카드 재등록 → (3) 다른 충전기 시도 순으로 점검해 주세요. 문제 지속 시 <strong>1661-0970</strong>(평일 09~18시) 또는 우측 액션의 <strong>장애 신고</strong>를 이용해 주세요.',
        actions: [
          { title: '수소충전소 Help Desk', desc: '장애 신고·운영·이력', href: 'charging-help.html', primary: true },
          { title: '인근 충전소 찾기', desc: '실시간 가용 충전기', href: 'charging-find.html' },
          { title: 'FAQ 검색', desc: '자주 묻는 충전 문제', href: 'inquiry-faq.html' }
        ],
        suggest: ['충전 중 갑자기 멈춤', '카드 인식 안 될 때', '환불은 어떻게 받나요?']
      }
    }
  };

  // ===== SVG 아이콘 =====
  var ICON = {
    sparkle: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3 L13.5 10.5 L21 12 L13.5 13.5 L12 21 L10.5 13.5 L3 12 L10.5 10.5 Z"/></svg>',
    user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 22a8 8 0 0 1 16 0"/></svg>',
    money: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M9 14a3 3 0 1 0 6 0c0-3-6-1-6-4a3 3 0 1 1 6 0M12 6v3M12 15v3"/></svg>',
    bolt: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>',
    bot: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="9" width="18" height="12" rx="3"/><path d="M12 9V5"/><circle cx="12" cy="3" r="1.5"/><circle cx="9" cy="14.5" r="0.8"/><circle cx="15" cy="14.5" r="0.8"/></svg>',
    search: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>',
    close: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>',
    send: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>',
    thumbsUp: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9A2 2 0 0 0 19.7 9H14zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>',
    thumbsDown: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9A2 2 0 0 0 4.3 15H10z"/></svg>',
    home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
    compare: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 3h5v5M8 21H3v-5M21 3l-7 7M3 21l7-7"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
    doc: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>',
    alert: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
    map: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>',
    card: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>',
    subsidy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/><circle cx="12" cy="14" r="3"/></svg>',
    faq: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
    phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>',
    expand: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>'
  };

  // ===== 메뉴 가로채기 =====
  // [요청 3] 메인페이지(인라인 AI 헬프데스크 섹션 존재) → 우측 플로팅 패널 대신
  //          해당 인라인 섹션으로 스크롤 + 플로우 활성화 (index.html 진입 시와 동일한 동작).
  //          서브페이지 → 기존대로 우측 슬라이딩 플로팅 패널 오픈.
  document.addEventListener('click', function (e) {
    var link = e.target.closest('a[href*="aiSectionAnchor"]');
    if (!link) return;
    var href = link.getAttribute('href') || '';
    var m = href.match(/[?&]ai=(personal|subsidy|charge)/);
    var flow = m ? m[1] : null;

    if (isMainPage) {
      e.preventDefault();
      // 인라인 섹션의 플로우 버튼 활성화 (있을 때만)
      if (flow) {
        var fb = document.querySelector('.ai-flow-btn[data-flow="' + flow + '"]');
        if (fb) fb.click();
      }
      // 헤더 높이 보정하여 인라인 섹션 상단으로 스크롤
      var sec = document.getElementById('aiSectionAnchor');
      if (sec) {
        var header = document.querySelector('.site-header');
        var hh = header ? header.getBoundingClientRect().height : 0;
        var top = sec.getBoundingClientRect().top + window.pageYOffset - hh;
        var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        window.scrollTo({ top: Math.max(0, Math.round(top)), left: 0, behavior: reduce ? 'auto' : 'smooth' });
      }
      return;
    }

    // 서브페이지: 우측 슬라이딩 패널을 열지 않고, 메인페이지 AI 헬프데스크로 이동
    // (링크 href = index.html?ai=...#aiSectionAnchor 를 그대로 따라가도록 가로채지 않음)
  }, true);

  // ===== 위젯 DOM =====
  var box = document.createElement('div');
  box.id = 'aifWidget';
  box.innerHTML =
    '<button class="aif-fab" id="aifFab" type="button" aria-label="AI 헬프데스크 열기">'
      + '<span class="aif-robot" aria-hidden="true">'
        + '<span class="aif-robot-antenna"></span>'
        + '<span class="aif-robot-head"><span class="aif-robot-face"><span class="eye"></span><span class="eye"></span></span><span class="aif-robot-wing left"></span><span class="aif-robot-wing right"></span></span>'
      + '</span>'
      + '<span class="aif-fab-tip">AI 헬프데스크</span>'
    + '</button>'
    + '<div class="aif-backdrop" id="aifBackdrop"></div>'
    + '<aside class="aif-panel" id="aifPanel" role="dialog" aria-modal="true" aria-label="AI 헬프데스크" aria-hidden="true">'
      + '<header class="aif-head">'
        + '<div class="aif-head-row">'
          + '<div class="aif-head-icon">' + ICON.sparkle + '</div>'
          + '<div class="aif-head-text"><h3>AI 헬프 데스크</h3><div class="aif-status"><span class="aif-status-dot"></span><span>상시 응답 가능</span></div></div>'
        + '</div>'
        + '<p id="aifSub">복잡한 정보 검색도 AI와 대화하듯 간편하게.<br>궁금한 내용을 자연어로 물어보시면 바로 답변해드립니다.</p>'
        + '<button class="aif-close" id="aifClose" type="button" aria-label="닫기">' + ICON.close + '</button>'
      + '</header>'
      + '<nav class="aif-flows" role="tablist">'
        + '<button class="aif-flow-btn" data-flow="personal" type="button">' + ICON.user + '맞춤 상담</button>'
        + '<button class="aif-flow-btn active" data-flow="subsidy" type="button">' + ICON.money + '보조금 큐레이터</button>'
        + '<button class="aif-flow-btn" data-flow="charge" type="button">' + ICON.bolt + '장애 대응</button>'
      + '</nav>'
      + '<div class="aif-chips-wrap"><div class="aif-chips-label">자주 묻는 질문</div><div class="aif-chips" id="aifChips"></div></div>'
      + '<div class="aif-feed" id="aifFeed"></div>'
      + '<form class="aif-followup" id="aifFollowupForm" autocomplete="off" hidden>'
        + '<input type="text" class="aif-followup-input" id="aifFollowupInput" placeholder="이 주제로 더 궁금한 점은?" aria-label="추가 질문">'
        + '<button type="submit" class="aif-followup-send" aria-label="전송">' + ICON.send + '</button>'
      + '</form>'
      + '<footer class="aif-foot">'
        + '<a href="inquiry-faq.html" class="aif-foot-btn">' + ICON.faq + 'FAQ</a>'
        + '<a href="index.html#aiSectionAnchor" class="aif-foot-btn">' + ICON.expand + '전체화면</a>'
      + '</footer>'
    + '</aside>';
  document.body.appendChild(box);

  // 요소 참조
  var fab = document.getElementById('aifFab');
  var panel = document.getElementById('aifPanel');
  var backdrop = document.getElementById('aifBackdrop');
  var closeBtn = document.getElementById('aifClose');
  var flowBtns = panel.querySelectorAll('.aif-flow-btn');
  var chipsBox = document.getElementById('aifChips');
  var feed = document.getElementById('aifFeed');
  var subText = document.getElementById('aifSub');
  var followupForm = document.getElementById('aifFollowupForm');
  var followupInput = document.getElementById('aifFollowupInput');

  var currentFlow = 'subsidy';
  var convStarted = false;
  var prevFocus = null;

  // ===== 유틸 =====
  function escHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (ch) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
    });
  }
  function scrollEnd() {
    requestAnimationFrame(function () { feed.scrollTop = feed.scrollHeight; });
  }

  // ===== 빈 상태 =====
  function renderEmpty() {
    var f = FLOWS[currentFlow];
    var cards = (f.cards || []).map(function (c) {
      return '<button class="aif-empty-card" type="button" data-q="' + escHtml(c.title) + '">'
        + '<span class="aif-empty-card-icon">' + (ICON[c.icon] || ICON.bot) + '</span>'
        + '<span class="aif-empty-card-text"><span class="aif-empty-card-title">' + escHtml(c.title) + '</span><span class="aif-empty-card-desc">' + escHtml(c.desc) + '</span></span>'
      + '</button>';
    }).join('');
    feed.innerHTML =
      '<div class="aif-empty">'
        + '<div class="aif-empty-illust">' + ICON.bot + '</div>'
        + '<h4 class="aif-empty-title">' + escHtml(f.label) + '</h4>'
        + '<p class="aif-empty-sub">' + escHtml(f.headerSub) + '<br>아래 추천 질문을 눌러 시작해 보세요.</p>'
        + '<div class="aif-empty-cards">' + cards + '</div>'
      + '</div>';
    feed.querySelectorAll('.aif-empty-card').forEach(function (c) {
      c.addEventListener('click', function () { runQuery(c.dataset.q); });
    });
  }

  // ===== 칩 =====
  function renderChips() {
    var chips = FLOWS[currentFlow].chips || [];
    chipsBox.innerHTML = chips.map(function (c) {
      return '<button class="aif-chip" type="button" data-q="' + escHtml(c) + '">#' + escHtml(c) + '</button>';
    }).join('');
    chipsBox.querySelectorAll('.aif-chip').forEach(function (chip) {
      chip.addEventListener('click', function () { runQuery(chip.dataset.q); });
    });
  }

  // ===== 플로우 변경 =====
  function setFlow(flow) {
    if (!FLOWS[flow]) flow = 'subsidy';
    currentFlow = flow;
    flowBtns.forEach(function (b) {
      var on = b.dataset.flow === flow;
      b.classList.toggle('active', on);
      b.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    // 서브 설명은 고정 카피로 유지 (탭 전환 시 덮어쓰지 않음)
    // subText.innerHTML 은 헤더 초기값을 그대로 사용
    renderChips();
    if (!convStarted) renderEmpty();
  }
  flowBtns.forEach(function (b) {
    b.addEventListener('click', function () { setFlow(b.dataset.flow); });
  });

  // ===== 메시지 =====
  function addUserMsg(text) {
    if (!convStarted) { feed.innerHTML = ''; convStarted = true; followupForm.hidden = false; }
    var div = document.createElement('div');
    div.className = 'aif-msg user';
    div.innerHTML = '<div class="aif-msg-bubble">' + escHtml(text) + '</div><div class="aif-msg-avatar">' + ICON.user + '</div>';
    feed.appendChild(div);
    scrollEnd();
  }
  function addTyping() {
    var div = document.createElement('div');
    div.className = 'aif-typing';
    div.id = 'aifTyping';
    div.innerHTML = '<span class="aif-typing-dot"></span><span class="aif-typing-dot"></span><span class="aif-typing-dot"></span>';
    feed.appendChild(div);
    scrollEnd();
  }
  function removeTyping() {
    var t = document.getElementById('aifTyping');
    if (t) t.remove();
  }
  function addBotMsg(ans) {
    var actions = (ans.actions || []).map(function (a) {
      return '<a class="aif-action ' + (a.primary ? 'primary' : '') + '" href="' + escHtml(a.href) + '">'
        + '<span class="aif-action-text"><span class="aif-action-title">' + escHtml(a.title) + '</span>'
        + (a.desc ? '<span class="aif-action-desc">' + escHtml(a.desc) + '</span>' : '')
        + '</span><span class="aif-action-arrow">' + ICON.arrow + '</span></a>';
    }).join('');
    var sugg = (ans.suggest && ans.suggest.length)
      ? '<div class="aif-suggest"><div class="aif-suggest-label">이런 질문도 많이 해요</div><div class="aif-suggest-chips">'
        + ans.suggest.map(function (s) { return '<button class="aif-suggest-chip" type="button" data-q="' + escHtml(s) + '">' + escHtml(s) + '</button>'; }).join('')
        + '</div></div>'
      : '';
    var rate =
      '<div class="aif-rate" data-rate>'
        + '<span>도움이 되었나요?</span>'
        + '<button class="aif-rate-btn" type="button" data-r="up" aria-label="도움됨">' + ICON.thumbsUp + '</button>'
        + '<button class="aif-rate-btn" type="button" data-r="down" aria-label="도움 안 됨">' + ICON.thumbsDown + '</button>'
      + '</div>';

    var div = document.createElement('div');
    div.className = 'aif-msg bot';
    div.innerHTML =
      '<div class="aif-msg-avatar">' + ICON.bot + '</div>'
      + '<div class="aif-msg-bubble">'
        + ans.text
        + (actions ? '<div class="aif-actions">' + actions + '</div>' : '')
        + rate
        + sugg
      + '</div>';
    feed.appendChild(div);
    scrollEnd();

    div.querySelectorAll('[data-rate] .aif-rate-btn').forEach(function (b) {
      b.addEventListener('click', function () {
        var r = b.dataset.r;
        var w = b.closest('.aif-rate');
        w.innerHTML = '<span class="aif-rate-thanks">' + (r === 'up' ? '✓ 답변이 도움이 되어 다행이에요!' : '· 더 정확한 답변을 위해 의견이 반영됩니다.') + '</span>';
      });
    });
    div.querySelectorAll('.aif-suggest-chip').forEach(function (c) {
      c.addEventListener('click', function () { runQuery(c.dataset.q); });
    });
  }

  // ===== 질의 =====
  function runQuery(q) {
    q = (q || '').trim();
    if (!q) return;
    addUserMsg(q);
    followupInput.value = '';
    addTyping();
    var ans = FLOWS[currentFlow].answer;
    setTimeout(function () { removeTyping(); addBotMsg(ans); }, 720);
  }
  followupForm.addEventListener('submit', function (e) { e.preventDefault(); runQuery(followupInput.value); });

  // ===== 패널 열고 닫기 =====
  function openPanel(flow) {
    if (flow) setFlow(flow);
    panel.classList.add('is-open');
    backdrop.classList.add('is-open');
    fab.classList.add('is-open');
    panel.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    prevFocus = document.activeElement;
    // 대체: 패널 열 때 첫 진입 요소(추천 카드 → 칩 → 닫기 버튼)로 포커스
    setTimeout(function () {
      try {
        var first = feed.querySelector('.aif-empty-card') || chipsBox.querySelector('.aif-chip') || closeBtn;
        if (first) first.focus();
      } catch (e) {}
    }, 360);
  }
  function closePanel() {
    panel.classList.remove('is-open');
    backdrop.classList.remove('is-open');
    fab.classList.remove('is-open');
    panel.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (prevFocus && prevFocus.focus) { try { prevFocus.focus(); } catch (e) {} }
  }
  fab.addEventListener('click', function () { openPanel(); });
  backdrop.addEventListener('click', closePanel);
  closeBtn.addEventListener('click', closePanel);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && panel.classList.contains('is-open')) closePanel();
  });

  // 초기화
  setFlow('subsidy');

  // 외부 노출
  window.AIFloating = {
    open: openPanel,
    close: closePanel,
    setFlow: setFlow,
    // 외부(메인 검색/인기검색어)에서 한 번에 열고 질의까지 실행
    ask: function (q, flow) { openPanel(flow); runQuery(q); }
  };

  // [요청 4] 소통·지원 > FAQ / 질의응답 / 불편 민원 신고 페이지 진입 시
  //          우측 슬라이드 AI 헬프데스크를 자동으로 연다.
  //   - inquiry-faq.html      : FAQ(자주 묻는 질문)
  //   - inquiry-qna.html      : 질의응답(건의사항)
  //   - inquiry-complaint.html: 불편 민원 신고
  (function autoOpenOnInquiry() {
    var AUTO_OPEN_PAGES = ['inquiry-faq.html', 'inquiry-qna.html', 'inquiry-complaint.html'];
    var file = (location.pathname.split('/').pop() || '').toLowerCase();
    if (AUTO_OPEN_PAGES.indexOf(file) === -1) return;
    // 헤더/언어팩 등 partials 주입 후 안정적으로 열리도록 약간 지연
    window.addEventListener('load', function () {
      window.setTimeout(function () { openPanel(); }, 200);
    });
  })();
})();
