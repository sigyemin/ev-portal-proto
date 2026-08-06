/* ==========================================================================
   ai-helpdesk-v2.js — 메인 인라인 AI 헬프데스크 로직 (검색형 답변 + 상세 계산기 모달)
   - ev-portal-0522(원본 시안)의 인라인 AI 헬프데스크 IIFE를 그대로 이식
   - 의존: 동일 페이지에 #aiSectionAnchor(.section-ai-help) 섹션 + #detailCalcModal 모달 존재
   - 선택 의존: window.__i18n, window.__toast (없어도 가드 처리되어 안전)
   ========================================================================== */
  // ============ AI 헬프데스크 — 검색형 답변 + 상세 계산기 모달 ============
  (function(){
    // 플로우별 해시태그
    const CHIPS = {
      subsidy:  ['보조금 계산','충전소 찾기','통계조회','차량 등록'],
      charge:   ['충전소 찾기','충전요금','회원카드','충전기고장','결제오류']
    };

    // 플로우별 응답 템플릿 — [ISS-087] 답변 텍스트만(body). 링크카드(actions)·관련메뉴(related)·후속질문(SUGGEST_FOLLOWUP) 데이터 제거.
    const ANSWER_TEMPLATES = {
      subsidy: {
        body: '고객님의 조건에 따른 예상 보조금은 약 <strong>800만원</strong>입니다. 전기차 구매 시 <strong>국고 보조금(최대 450만원)</strong>과 <strong>지방자치단체 보조금(최대 350만원)</strong>을 합산하여 받으실 수 있습니다.'
      },
      charge: {
        body: '<strong>충전 컨시어지</strong>가 충전소 찾기·요금·회원카드부터 충전기 장애 대응까지 도와드립니다. 충전기 고장·시스템 오류 문의는 즉시 담당 운영사에 전달되며, 복구 경과를 <strong>SMS·이메일</strong>로 안내해드립니다. 긴급한 경우 통합 콜센터 <strong>1661-0970</strong>로 연락해 주시기 바랍니다.'
      }
    };

    const flowBtns   = document.querySelectorAll('.ai-flow-btn');
    const hashChips  = document.getElementById('aiHashChips');
    const searchForm = document.getElementById('aiSearchForm');
    const searchInput= document.getElementById('aiSearchInput');
    const answer     = document.getElementById('aiAnswer');
    const messages   = document.getElementById('aiMessages');
    // [ISS-087] aiSuggest·aiTurnBadge·aiReset·aiSaveChat 제거 — 참조 삭제
    const followupForm = document.getElementById('aiFollowupForm');
    const followupInput= document.getElementById('aiFollowupInput');
    const topbarFlow = document.getElementById('aiTopbarFlow');
    const answerClose= document.getElementById('aiAnswerClose');

    const FLOW_NAMES = { subsidy: '보조금 큐레이터', charge: '충전 컨시어지' };

    let currentFlow = 'subsidy';
    let activeChip  = null;
    // [ISS-087] turnCount 제거 (턴 뱃지 삭제)

    function renderChips(flow) {
      hashChips.innerHTML = CHIPS[flow].map(tag =>
        `<button type="button" data-tag="${tag}" class="${activeChip === tag ? 'is-active' : ''}"><span class="hash">#</span>${tag}</button>`
      ).join('');
      hashChips.querySelectorAll('button').forEach(b => b.addEventListener('click', () => {
        activeChip = b.dataset.tag;
        hashChips.querySelectorAll('button').forEach(x => x.classList.toggle('is-active', x.dataset.tag === activeChip));
        ask(autoQuestion(currentFlow, b.dataset.tag));
      }));
    }

    function autoQuestion(flow, tag) {
      const QMAP = {
        '보조금 계산': '전기차 보조금은 얼마인가요?',
        '충전소 찾기': '우리 지역 충전소를 찾아주세요.',
        '통계조회': '보급 대수 통계를 알려주세요.',
        '차량 등록': '전기차 등록 절차는 어떻게 되나요?',
        '충전요금': '충전 요금은 어떻게 되나요?',
        '회원카드': '충전 회원카드는 어떻게 발급하나요?',
        '충전기고장': '충전기가 고장났을 때 어떻게 신고하나요?',
        '결제오류': '결제 중 오류가 발생했습니다.'
      };
      return QMAP[tag] || `${tag}에 대해 알고 싶습니다.`;
    }

    function appendUserBubble(text) {
      const el = document.createElement('div');
      el.className = 'ai-msg ai-msg-user';
      el.innerHTML = `<div class="ai-msg-inner">
        <strong>내 질문</strong>
        <p>${escapeHtml(text)}</p>
      </div>`;
      messages.appendChild(el);
    }

    function appendTyping() {
      const el = document.createElement('div');
      el.className = 'ai-msg ai-msg-bot ai-msg-typing';
      el.innerHTML = `<div class="ai-msg-inner">
        <strong>AI 답변</strong>
        <div class="ai-typing"><span></span><span></span><span></span></div>
      </div>`;
      messages.appendChild(el);
      return el;
    }

    function appendAnswerBubble(flow) {
      // [ISS-087] AI 답변 = 말풍선(아바타 + bubble) · 텍스트만. 링크카드(actions)·관련메뉴(related) 제거.
      //   [ISS-087 정정] 답변 툴 아이콘 3종 전부 삭제. [DEV] 향후 차트/표 슬롯은 body 아래에 렌더.
      const tmpl = ANSWER_TEMPLATES[flow] || ANSWER_TEMPLATES.subsidy;
      const el = document.createElement('div');
      el.className = 'ai-msg ai-msg-bot';
      el.innerHTML = `<div class="ai-msg-avatar" aria-hidden="true">
          <svg class="ai-answer-spark" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3 L13.5 10.5 L21 12 L13.5 13.5 L12 21 L10.5 13.5 L3 12 L10.5 10.5 Z"/></svg>
        </div>
        <div class="ai-msg-bubble">
          <!-- [ISS-087 정정] 답변 툴 아이콘 3종 전부 삭제 — 말풍선은 텍스트만 -->
          <p class="ai-answer-body">${tmpl.body}</p>
          ${flow === 'subsidy' ? '<p class="ai-amt-badge"><span class="ai-amt-pill">ⓘ 안내가</span> 위 금액은 추정치이며 실제 지급액과 다를 수 있습니다.</p>' : ''}
          <!-- [DEV] 향후 차트/표 슬롯 — 데이터 연동 시 body 아래에 렌더 추가 -->
        </div>`;
      messages.appendChild(el);
    }

    // [ISS-087] renderSuggest(후속질문)·updateTurn(턴 뱃지) 함수 제거

    function scrollToBottom() {
      messages.scrollTop = messages.scrollHeight;
      if (answer.hidden) return;
      setTimeout(() => messages.scrollTop = messages.scrollHeight, 60);
    }

    function ask(q) {
      if (!q) return;
      openAnswerPanel();
      appendUserBubble(q);
      const typing = appendTyping();
      scrollToBottom();
      setTimeout(() => {
        typing.remove();
        appendAnswerBubble(currentFlow);
        // [ISS-087] updateTurn(턴 뱃지)·renderSuggest(후속질문) 제거
        scrollToBottom();
      }, 650);
    }

    function openAnswerPanel() {
      if (!answer.hasAttribute('hidden') === false) {
        // 이미 표시되면 재오픈 생략
        if (!answer.hasAttribute('hidden')) return;
      }
      answer.removeAttribute('hidden');
      answer.setAttribute('aria-hidden','false');
      setTimeout(() => answer.scrollIntoView({ behavior:'smooth', block:'center' }), 100);
    }

    function hideAnswer() {
      answer.setAttribute('hidden', '');
      answer.setAttribute('aria-hidden','true');
    }

    // 초기 진입 시 답변 패널 닫힘
    answer.setAttribute('hidden', '');
    answer.setAttribute('aria-hidden','true');
    // [ISS-087] resetChat(초기화)·suggest 관련 로직 제거

    function escapeHtml(s) { return s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
    function escapeAttr(s) { return s.replace(/"/g, '&quot;'); }

    // 플로우 버튼 전환
    flowBtns.forEach(b => b.addEventListener('click', () => {
      flowBtns.forEach(x => { x.classList.remove('active'); x.setAttribute('aria-selected','false'); });
      b.classList.add('active');
      b.setAttribute('aria-selected','true');
      currentFlow = b.dataset.flow;
      activeChip = null;
      topbarFlow.textContent = FLOW_NAMES[currentFlow];
      renderChips(currentFlow);
      syncSubsidyNotice();   // [ISS-092] 보조금 큐레이터 탭 진입 시마다 고지
    }));

    // [ISS-092] 보조금 큐레이터 탭 진입 시마다 '안내가' 고지 배너 (세션 스킵 없음 — 탭 전환할 때마다 노출)
    var subsidyNotice = document.createElement('div');
    subsidyNotice.className = 'ai-amt-notice';
    subsidyNotice.setAttribute('role', 'note');
    subsidyNotice.hidden = true;
    subsidyNotice.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg><span>보조금 큐레이터가 안내하는 금액은 <strong>안내가(추정)</strong>이며, 실제 지급액은 지자체 예산·차량 효율 등급 등에 따라 달라질 수 있습니다.</span>';
    (function () { var flowsEl = document.querySelector('.ai-flows'); if (flowsEl) flowsEl.insertAdjacentElement('afterend', subsidyNotice); })();
    function syncSubsidyNotice() { subsidyNotice.hidden = (currentFlow !== 'subsidy'); }
    syncSubsidyNotice();

    // 상단 검색 제출
    searchForm.addEventListener('submit', e => {
      e.preventDefault();
      const v = searchInput.value.trim();
      if (!v) return;
      ask(v);
      searchInput.value = '';
    });

    // 후속 질문 제출
    followupForm.addEventListener('submit', e => {
      e.preventDefault();
      const v = followupInput.value.trim();
      if (!v) return;
      ask(v);
      followupInput.value = '';
    });

    answerClose.addEventListener('click', hideAnswer);
    // [ISS-087] resetBtn 핸들러 제거

    // ============ 상세 보조금 계산기 모달 ============
    const calcModal = document.getElementById('detailCalcModal');
    const calcForm  = document.getElementById('detailCalcForm');
    const calcResult= document.getElementById('detailCalcResult');

    // 차량 종류·지역별 계수 (단순 시뮬레이터)
    const GOV_BASE = {
      passenger: 450, van: 7000, truck: 1100, motorcycle: 150, h2: 2250  // 만원
    };
    const LOCAL_RATE = {
      seoul: 350, busan: 450, daegu: 500, incheon: 400, gwangju: 500,
      daejeon: 450, ulsan: 500, sejong: 500, gyeonggi: 500, gangwon: 600,
      chungbuk: 550, chungnam: 550, jeonbuk: 600, jeonnam: 600,
      gyeongbuk: 550, gyeongnam: 550, jeju: 700
    };
    const MODEL_MULT = {
      ioniq6: 1.0, ioniq5: 1.0, ev6: 1.0, ev9: 1.05, kona: 0.95, niroev: 0.95,
      model3: 0.9, modely: 0.9, nexo: 1.2
    };

    function openDetailCalc() {
      calcModal.removeAttribute('hidden');
      calcModal.setAttribute('aria-hidden','false');
      document.body.style.overflow = 'hidden';
      calcResult.setAttribute('hidden', '');
    }
    function closeDetailCalc() {
      calcModal.setAttribute('hidden', '');
      calcModal.setAttribute('aria-hidden','true');
      document.body.style.overflow = '';
    }
    // 초기 진입 시 반드시 닫힘 상태 보장
    calcModal.setAttribute('hidden', '');
    calcModal.setAttribute('aria-hidden','true');

    // 이벤트 델리게이션 — SVG·자식 요소 클릭도 정확히 포착
    calcModal.addEventListener('click', e => {
      const closer = e.target.closest('[data-dcm-close]');
      if (closer) {
        e.preventDefault();
        e.stopPropagation();
        closeDetailCalc();
      }
    });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && !calcModal.hidden) closeDetailCalc(); });

    calcForm.addEventListener('submit', e => {
      e.preventDefault();
      const vehicle = document.getElementById('dcmVehicle').value;
      const region  = document.getElementById('dcmRegion').value;
      const model   = document.getElementById('dcmModel').value;
      const price   = parseFloat(document.getElementById('dcmPrice').value) || 5200;

      const gov = Math.round((GOV_BASE[vehicle] || 450) * (MODEL_MULT[model] || 1));
      const local = LOCAL_RATE[region] || 400;
      const bonus = Math.round((price > 5500 ? 50 : 100));  // 차량가격별 추가 인센티브
      const total = gov + local + bonus;

      document.getElementById('dcmGovVal').textContent = gov.toLocaleString('ko-KR') + '만원';
      document.getElementById('dcmLocalVal').textContent = local.toLocaleString('ko-KR') + '만원';
      document.getElementById('dcmBonusVal').textContent = bonus.toLocaleString('ko-KR') + '만원';
      document.getElementById('dcmTotalVal').textContent = total.toLocaleString('ko-KR') + '만원';
      calcResult.hidden = false;
    });

    // 초기: 보조금 큐레이터 칩 표시
    renderChips(currentFlow);

    // ─── URL 쿼리 파라미터 라우팅 (?ai=subsidy|charge) ───
    // GNB > 소통·지원 > AI 헬프데스크 > 각 메뉴 클릭 시 해당 플로우 자동 활성화 + 섹션 스크롤
    // [ISS-101] personal 플로우 폐지 → 구 personal 링크는 subsidy로 리다이렉트(하위호환)
    (function aiDeepLink(){
      const params = new URLSearchParams(location.search);
      let target = params.get('ai');
      if (target === 'personal') target = 'subsidy';
      if (!['subsidy','charge'].includes(target)) return;
      // DOMContentLoaded 후 실행 보장 (이미 IIFE는 readyState 이후이지만 헤더 partials 주입 후 안정화 위해 약간 지연)
      setTimeout(() => {
        const btn = document.querySelector(`.ai-flow-btn[data-flow="${target}"]`);
        if (!btn) return;
        btn.click();
        // 헤더 높이 보정하여 섹션 상단으로 스크롤
        const sec = document.getElementById('aiSectionAnchor');
        if (sec) {
          const headerH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--header-height')) || 96;
          const top = sec.getBoundingClientRect().top + window.pageYOffset - headerH - 20;
          window.scrollTo({ top, behavior: 'smooth' });
        }
        // 시각 강조: 버튼에 잠시 펄스 효과
        btn.style.animation = 'aiFlowPulse 0.8s ease-out';
        setTimeout(() => { btn.style.animation = ''; }, 800);
      }, 250);
    })();
  })();

/* ==========================================================================
   [요청 2] 홈(최상단) 버튼 — 클릭 시 메인페이지 최상단으로 부드럽게 스크롤
   ========================================================================== */
(function () {
  var homeBtn = document.getElementById('aiHomeBtn');
  if (!homeBtn) return;
  homeBtn.addEventListener('click', function () {
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, left: 0, behavior: reduce ? 'auto' : 'smooth' });
  });
})();
