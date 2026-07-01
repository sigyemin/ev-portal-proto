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
      personal: ['차량번호변경','결제카드등록·변경','카드배송','회원가입','마이페이지'],
      subsidy:  ['보조금 계산','충전소 찾기','통계조회','차량 등록'],
      charge:   ['시스템·홈페이지오류','충전기설치요청','충전기고장','결제오류']
    };

    // 플로우별 응답 템플릿
    const ANSWER_TEMPLATES = {
      subsidy: {
        body: '고객님의 조건에 따른 예상 보조금은 약 <strong>800만원</strong>입니다. 전기차 구매 시 <strong>국고 보조금(최대 450만원)</strong>과 <strong>지방자치단체 보조금(최대 350만원)</strong>을 합산하여 받으실 수 있습니다.',
        actions: [
          { label: '상세 계산하기', type: 'primary', action: 'open-calc' },
          { label: '신청 방법 보기', type: 'secondary', href: 'subsidy-target.html' }
        ],
        related: [
          { crumb: ['자동차 분석','저공해 조치','제작사별 저공해 조치 현황'], title: '제작사별 저공해조치 현황', desc: '자동차 제작사별 저공해 조치 이행 현황 및 통계를 확인할 수 있습니다.', href: 'subsidy-vehicles.html' },
          { crumb: ['충전 인프라','데이터 서비스','저공해차 충전소 현황'], title: '저공해차 충전소 현황', desc: '전국 저공해차 충전소 설치 및 이용 현황을 지도와 함께 확인할 수 있습니다.', href: 'charging-find.html' }
        ]
      },
      personal: {
        body: '고객님께 필요한 정보를 종합해 안내해드립니다. <strong>차량번호 변경</strong>·<strong>결제카드 등록</strong>·<strong>통합카드 배송 조회</strong> 등 자주 찾으시는 업무는 아래 관련 메뉴에서 바로 처리 가능합니다.',
        actions: [
          { label: '마이페이지 이동', type: 'primary', href: '#', action: 'notify:로그인 후 이용 가능합니다.' },
          { label: '카드 관리', type: 'secondary', href: 'charging-card.html' }
        ],
        related: [
          { crumb: ['소통·지원','민원·문의','자주 묻는 질문'], title: 'FAQ (자주 묻는 질문)', desc: '카테고리별 자주 묻는 질문 428건을 AI 추천 엔진이 연결해드립니다.', href: 'inquiry-faq.html' },
          { crumb: ['충전 인프라','카드 관리','정보 수정'], title: '회원카드 정보 수정', desc: '차량번호 변경, 결제카드 등록, 주소 변경을 한 화면에서 처리할 수 있습니다.', href: 'charging-card-edit.html' }
        ]
      },
      charge: {
        body: '충전기 고장·시스템 오류 문의는 즉시 담당 운영사에 전달되며, 복구 경과를 <strong>SMS·이메일</strong>로 안내해드립니다. 긴급한 경우 통합 콜센터 <strong>1661-0970</strong>로 연락해 주시기 바랍니다.',
        actions: [
          { label: '장애 신고 접수', type: 'primary', href: 'inquiry-complaint.html' },
          { label: '운영 현황 확인', type: 'secondary', href: 'charging-help.html?tab=status' }
        ],
        related: [
          { crumb: ['충전소·요금 정보','수소충전소 Help Desk','운영 현황'], title: '실시간 운영 현황', desc: '전국 247개 수소충전소의 정상·정비·장애 상태를 실시간으로 확인합니다.', href: 'charging-help.html?tab=status' },
          { crumb: ['소통·지원','민원·문의','불편 민원 신고'], title: '불편 민원 신고', desc: '시스템 오류·서비스 불편 사항을 접수하면 3일 이내 처리됩니다.', href: 'inquiry-complaint.html' }
        ]
      }
    };

    // 플로우별 후속 질문 제안 (suggest chips)
    const SUGGEST_FOLLOWUP = {
      subsidy: ['의무운행 기간이 얼마인가요?', '지자체별 지원금이 다른 이유는?', '보조금 환수 대상 사유', '신청부터 수령까지 얼마나 걸리나요?'],
      personal: ['마이페이지 비밀번호 찾기', '통합카드 재발급 비용', '주소 변경 후 반영까지', '이메일 알림 설정'],
      charge:   ['충전기 예약이 가능한가요?', '로밍 수수료 면제 사업자', '심야 할인 시간대', '장애 신고 후 복구까지']
    };

    const flowBtns   = document.querySelectorAll('.ai-flow-btn');
    const hashChips  = document.getElementById('aiHashChips');
    const searchForm = document.getElementById('aiSearchForm');
    const searchInput= document.getElementById('aiSearchInput');
    const answer     = document.getElementById('aiAnswer');
    const messages   = document.getElementById('aiMessages');
    const suggest    = document.getElementById('aiSuggest');
    const suggestChips = document.getElementById('aiSuggestChips');
    const followupForm = document.getElementById('aiFollowupForm');
    const followupInput= document.getElementById('aiFollowupInput');
    const topbarFlow = document.getElementById('aiTopbarFlow');
    const turnBadge  = document.getElementById('aiTurnBadge');
    const answerClose= document.getElementById('aiAnswerClose');
    const resetBtn   = document.getElementById('aiReset');

    const FLOW_NAMES = { personal: 'AI 맞춤 상담', subsidy: '보조금 큐레이터', charge: '장애 대응 안내' };

    let currentFlow = 'subsidy';
    let activeChip  = null;
    let turnCount   = 0;

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
        '차량번호변경': '충전카드 차량번호를 변경하려면?',
        '결제카드등록·변경': '결제카드를 등록·변경하고 싶습니다.',
        '카드배송': '통합카드 배송은 얼마나 걸리나요?',
        '회원가입': '회원가입 방법을 알려주세요.',
        '마이페이지': '마이페이지에서 할 수 있는 일이 뭔가요?',
        '시스템·홈페이지오류': '홈페이지 접속 오류가 발생합니다.',
        '충전기설치요청': '충전기 설치를 신청하려면?',
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
      const tmpl = ANSWER_TEMPLATES[flow] || ANSWER_TEMPLATES.subsidy;
      const el = document.createElement('div');
      el.className = 'ai-msg ai-msg-bot';
      const actionsHTML = tmpl.actions.map(a => {
        const cls = 'ai-answer-btn' + (a.type === 'primary' ? ' primary' : '');
        if (a.action === 'open-calc') {
          return `<button type="button" class="${cls}" data-action="open-calc">${a.label}</button>`;
        }
        if (a.action && a.action.startsWith('notify:')) {
          return `<button type="button" class="${cls}" data-action="notify" data-action-label="${a.action.slice(7)}">${a.label}</button>`;
        }
        return `<a href="${a.href}" class="${cls}">${a.label}</a>`;
      }).join('');
      const relHTML = tmpl.related.map(r =>
        `<a href="${r.href}" class="ai-answer-rel-item">
          <div class="rel-breadcrumb">${r.crumb.map((c,i)=>i===r.crumb.length-1?`<strong>${c}</strong>`:c).join(' <span>›</span> ')}</div>
          <div class="rel-title">${r.title}</div>
          <div class="rel-desc">${r.desc}</div>
        </a>`
      ).join('');

      el.innerHTML = `<div class="ai-msg-inner">
        <div class="ai-msg-head">
          <svg class="ai-answer-spark" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3 L13.5 10.5 L21 12 L13.5 13.5 L12 21 L10.5 13.5 L3 12 L10.5 10.5 Z"/></svg>
          <strong>AI 답변</strong>
          <div class="ai-msg-tools">
            <button type="button" class="msg-tool" data-copy title="복사" aria-label="답변 복사">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            </button>
            <button type="button" class="msg-tool" data-helpful="up" title="도움이 되었어요" aria-label="도움이 되었어요">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>
            </button>
            <button type="button" class="msg-tool" data-helpful="down" title="부정확해요" aria-label="부정확해요">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zM17 2h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3"/></svg>
            </button>
          </div>
        </div>
        <p class="ai-answer-body">${tmpl.body}</p>
        <div class="ai-answer-actions">${actionsHTML}</div>
        <div class="ai-answer-related">${relHTML}</div>
      </div>`;
      messages.appendChild(el);

      // 이벤트 바인딩
      el.querySelectorAll('[data-action="open-calc"]').forEach(b => b.addEventListener('click', openDetailCalc));
      el.querySelector('[data-copy]')?.addEventListener('click', e => {
        const txt = el.querySelector('.ai-answer-body').textContent;
        navigator.clipboard?.writeText(txt).then(() => {
          if (window.__toast) window.__toast('답변이 복사되었습니다.', 'success');
        });
      });
      el.querySelectorAll('[data-helpful]').forEach(b => b.addEventListener('click', () => {
        el.querySelectorAll('[data-helpful]').forEach(x => x.classList.remove('is-voted'));
        b.classList.add('is-voted');
        if (window.__toast) window.__toast(b.dataset.helpful === 'up' ? '도움이 되어 기쁩니다!' : '더 나은 답변을 준비하겠습니다.', 'info');
      }));
    }

    function renderSuggest(flow) {
      const list = SUGGEST_FOLLOWUP[flow] || [];
      suggestChips.innerHTML = list.map(q =>
        `<button type="button" data-q="${escapeAttr(q)}">${q}</button>`
      ).join('');
      suggestChips.querySelectorAll('button').forEach(b => b.addEventListener('click', () => ask(b.dataset.q)));
      suggest.hidden = list.length === 0;
    }

    function updateTurn() {
      turnCount++;
      turnBadge.textContent = `${turnCount}회 대화`;
    }

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
        updateTurn();
        renderSuggest(currentFlow);
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

    // 초기 진입 시 답변 패널·후속 질문 패널 모두 확실히 닫힘
    answer.setAttribute('hidden', '');
    answer.setAttribute('aria-hidden','true');
    suggest.setAttribute('hidden', '');

    function resetChat() {
      messages.innerHTML = '';
      suggest.hidden = true;
      turnCount = 0;
      turnBadge.textContent = '새 대화';
      if (window.__toast) window.__toast('대화가 초기화되었습니다.', 'info');
    }

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
    }));

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
    resetBtn.addEventListener('click', resetChat);

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

    // ─── URL 쿼리 파라미터 라우팅 (?ai=personal|subsidy|charge) ───
    // GNB > 소통·지원 > AI 헬프데스크 > 각 메뉴 클릭 시 해당 플로우 자동 활성화 + 섹션 스크롤
    (function aiDeepLink(){
      const params = new URLSearchParams(location.search);
      const target = params.get('ai');
      if (!['personal','subsidy','charge'].includes(target)) return;
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
