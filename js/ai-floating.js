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
    if (aiParam === 'personal') aiParam = 'subsidy';   // [ISS-101] personal 폐지 → subsidy 리다이렉트
    if (aiParam) {
      window.addEventListener('load', function () {
        var fb = document.querySelector('.ai-flow-btn[data-flow="' + aiParam + '"]');
        if (fb) fb.click();
      });
    }
  }

  // ===== 데이터 =====
  // [ISS-101] 배치 순서: 충전 컨시어지 → 보조금 큐레이터 (기본 선택 active는 subsidy 유지, setFlow('subsidy'))
  var FLOWS = {
    charge: {
      label: '충전 컨시어지',
      headerSub: '충전소·요금·회원카드부터 장애 대응까지',
      placeholder: '예: 인근 충전소? 충전요금? 충전이 안 돼요',
      chips: [
        { tag:'회원카드 신청', q:'환경부 회원카드는 어떻게 신청하나요?' },
        { tag:'충전기 고장 신고', q:'환경부 충전기가 작동하지 않을 때 현장에서 어떻게 고장 신고를 하나요?' },
        { tag:'충전내역 조회', q:'환경부 회원카드로 충전한 내역은 어디에서 확인하나요?' },
        { tag:'결제 후 충전 오류', q:'결제는 되었지만 충전이 시작되지 않을 때 어떻게 처리하나요?' },
        { tag:'전기차 충전요금', q:'환경부 충전기에서 전기차를 충전할 때 요금은 완속·급속 등 충전 속도별로 얼마인가요?' }
      ],  // [ISS-101 후속] {tag,q} 확정본
      // [ISS-085] cards·actions·suggest 제거 — 응답은 text만
      // [ISS-101] 충전 전반 catch-all 인사말. 장애 트러블슈팅은 후속 안내로 유지.
      answer: {
        text: '<strong>충전 컨시어지</strong>입니다. 충전소 찾기·요금·회원카드부터 충전기 장애 대응까지 도와드려요.<br>충전이 안 될 땐 (1) 카드 칩 청결 확인 → (2) 카드 재등록 → (3) 다른 충전기 시도 순으로 점검해 주세요. 문제 지속 시 <strong>1661-0970</strong>(평일 09~18시)으로 문의해 주세요.'
      }
    },
    subsidy: {
      label: '보조금 큐레이터',
      headerSub: '내가 받을 수 있는 보조금을 한 번에',
      placeholder: '예: 보조금 얼마? 신청 절차?',
      chips: [
        { tag:'서울 전기차 보조금', q:'2026년 서울시 전기승용차 구매보조금은 중·대형, 소형, 초소형 차량별로 최대 얼마인가요?' },
        { tag:'서울 개인·법인 보조금 자격', q:'2026년 서울시 전기승용차 구매보조금은 개인, 개인사업자, 법인이 모두 신청할 수 있나요?' },
        { tag:'서울 보조금 신청 절차', q:'2026년 서울시 전기승용차 구매보조금은 구매계약 후 제작·수입사를 통해 어떻게 신청하나요?' },
        { tag:'보조금 선정순서', q:'2026년 서울시 전기승용차 보조금 대상자는 신청 순서로 선정하나요, 차량 출고·등록 순서로 선정하나요?' },
        { tag:'2년 내 전기차 판매', q:'서울시 보조금으로 구매한 전기차를 등록 후 2년 이내에 다른 지역 사람에게 판매하면 서울시 보조금을 반환해야 하나요?' }
      ],  // [ISS-101 후속] {tag,q} 확정본
      // [ISS-085] cards·actions·suggest 제거 — 응답은 text만
      answer: {
        text: '<strong>2026년 보조금 큐레이션</strong>입니다. 일반 승용 BEV 기준 국비 480만원 + 지방비 100만원 = 최대 580만원 지원. 차량가 7천만원 이상은 100% 단가 적용 대상에서 제외됩니다.'
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
    /* [ISS-087 정정] 답변 피드백 아이콘(👍/👎) 정의 삭제 — 답변 말풍선 텍스트만 */
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
    if (flow === 'personal') flow = 'subsidy';   // [ISS-101] personal 폐지 → subsidy 리다이렉트

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
        + '<button class="aif-flow-btn" data-flow="charge" type="button">' + ICON.bolt + '<span data-i18n="mega.community.ai.charge">충전 컨시어지</span></button>'
        + '<button class="aif-flow-btn active" data-flow="subsidy" type="button">' + ICON.money + '<span data-i18n="mega.community.ai.subsidy">보조금 큐레이터</span></button>'
      + '</nav>'
      + '<div class="aif-chips-wrap"><div class="aif-chips-label">자주 묻는 질문</div><div class="aif-chips" id="aifChips"></div></div>'
      + '<div class="aif-feed" id="aifFeed"></div>'
      + '<form class="aif-followup" id="aifFollowupForm" autocomplete="off" hidden>'
        + '<input type="text" class="aif-followup-input" id="aifFollowupInput" placeholder="이 주제로 더 궁금한 점은?" aria-label="추가 질문">'
        + '<button type="submit" class="aif-followup-send" aria-label="전송">' + ICON.send + '</button>'
      + '</form>'
      // [ISS-085] 하단 바(FAQ·전체화면 버튼) 제거
    + '</aside>';
  document.body.appendChild(box);

  // [ISS-101 잔여] 플로팅 위젯 i18n(ko/en) — flow 라벨(data-i18n=mega.community.ai.*)·빈상태 제목(t()).
  //   ★applyLang 재호출 안 함 — __i18n가 로드/언어전환 시 doc 전체에 data-i18n을 적용하므로 위젯 버튼은 자동 번역. t()는 __i18n.t만 사용(재귀 없음).
  function t(key, ko){ try{ if(window.__i18n && __i18n.t){ var m=__i18n.t(key); if(m&&m!==key) return m; } }catch(e){} return ko; }

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
    // [ISS-085] 빈 상태 추천카드 제거 — 상단 '자주 묻는 질문' 칩으로 시작 유도. (환영 문구/일러스트는 유지)
    var f = FLOWS[currentFlow];
    feed.innerHTML =
      '<div class="aif-empty">'
        + '<div class="aif-empty-illust">' + ICON.bot + '</div>'
        + '<h4 class="aif-empty-title">' + escHtml(t('mega.community.ai.' + currentFlow, f.label)) + '</h4>'
        + '<p class="aif-empty-sub">' + escHtml(f.headerSub) + '<br>상단의 자주 묻는 질문을 눌러 시작해 보세요.</p>'
      + '</div>';
  }

  // ===== 칩 =====
  function renderChips() {
    var chips = FLOWS[currentFlow].chips || [];
    // [ISS-101 후속] 칩 라벨=#tag, 클릭 전송값=q(풀 질문)
    chipsBox.innerHTML = chips.map(function (c) {
      return '<button class="aif-chip" type="button" data-q="' + escHtml(c.q) + '">#' + escHtml(c.tag) + '</button>';
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

  // [ISS-101 잔여] 언어 전환 시: 버튼 라벨은 data-i18n 자동 반영(langChange 시 __i18n이 이미 doc 적용). 빈상태 제목(JS 렌더)만 재렌더.
  // ★applyLang() 재호출 금지 — langChange 핸들러 안에서 applyLang을 부르면 리스너가 재발화되어 무한재귀.
  function onLangChange(){ if (!convStarted) renderEmpty(); }
  if (window.__i18n && __i18n.on) { try { __i18n.on(onLangChange); } catch(e){} }
  window.addEventListener('langChange', onLangChange);

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
    // [ISS-085] 응답 말풍선 = 텍스트만. 링크(action)카드·후속질문칩(suggest)·피드백(rate) 전부 제거.
    var div = document.createElement('div');
    div.className = 'aif-msg bot';
    div.innerHTML =
      '<div class="aif-msg-avatar">' + ICON.bot + '</div>'
      + '<div class="aif-msg-bubble">'
        + ans.text
        // [DEV] 향후 차트/표 슬롯 — 데이터 연동 시 여기에 렌더 추가: + renderChart(ans.chart) + renderTable(ans.table)
      + '</div>';
    feed.appendChild(div);
    scrollEnd();
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
    // 대체: 패널 열 때 첫 진입 요소(자주 묻는 질문 칩 → 닫기 버튼)로 포커스  // [ISS-085] 추천카드 제거로 칩 우선
    setTimeout(function () {
      try {
        var first = chipsBox.querySelector('.aif-chip') || closeBtn;
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
