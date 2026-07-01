/* home-v2.js — 메인(index) 시안 main_03 전용 인터랙션.
   index.html 에서만 로드. AI검색은 ai-floating.js(window.AIFloating)에 위임,
   요금 카드비교/상세비교 탭·상세행 패널 전환, 푸터 정책링크 보강을 처리합니다. */

(function(){
  document.body.classList.add('main03-active');

  // [언어 정책 통일] 메인 페이지도 다른 페이지와 동일하게 사용자가 선택한 언어(localStorage 'site-lang')를 유지한다.
  //  과거에는 메인 진입 시 강제로 한국어(applyLang('ko'))로 되돌렸으나, 그 결과 헤더에서 EN을 골라도
  //  메인에 오면 한국어로 보이는 문제가 있었다. 강제 전환을 제거하여 EN이면 메인 본문도 EN으로 표시되도록 한다.
  //  (i18n.js init()이 세션 첫 진입 시에만 ko 디폴트를 적용하므로 최초 방문 기본값은 여전히 한국어다.)

  function getFlowFromText(q){
    q = q || '';
    if (q.indexOf('충전소') >= 0 || q.indexOf('충전') >= 0 || q.indexOf('장애') >= 0 || q.indexOf('고장') >= 0) return 'charge';
    if (q.indexOf('보조금') >= 0 || q.indexOf('지원금') >= 0 || q.indexOf('지급') >= 0) return 'subsidy';
    return 'personal';
  }
  function openAiChat(q, flow){
    q = (q || '').trim() || '무공해차 보조금과 충전소를 한 번에 안내해줘';
    flow = flow || getFlowFromText(q);
    if (window.AIFloating && typeof window.AIFloating.ask === 'function') {
      window.AIFloating.ask(q, flow);
    } else if (window.AIFloating && typeof window.AIFloating.open === 'function') {
      window.AIFloating.open(flow);
      setTimeout(function(){
        var input = document.getElementById('aifSearchInput');
        var form = document.getElementById('aifSearchForm');
        if (input && form) { input.value = q; form.dispatchEvent(new Event('submit', {bubbles:true, cancelable:true})); }
      }, 220);
    } else if (window.__toast) {
      window.__toast('AI 대화창을 준비 중입니다. 잠시 후 다시 시도해 주세요.', 'info');
    }
  }

  var form = document.getElementById('main03SearchForm');
  var input = document.getElementById('main03SearchInput');
  if (form && input) {
    input.removeAttribute('readonly');
    input.removeAttribute('disabled');
    form.addEventListener('submit', function(e){
      e.preventDefault();
      openAiChat(input.value, getFlowFromText(input.value));
    });
  }
  document.querySelectorAll('[data-ai-query]').forEach(function(btn){
    btn.addEventListener('click', function(e){
      e.preventDefault();
      openAiChat(btn.getAttribute('data-ai-query'), btn.getAttribute('data-ai-flow'));
    });
  });

  var cards = document.querySelector('.m03-fee-cards');
  var detail = document.querySelector('.m03-fee-detail');
  var typeSel = document.getElementById('m03FeeType');
  document.querySelectorAll('[data-main03-tab]').forEach(function(btn){
    btn.addEventListener('click', function(){
      var mode = btn.getAttribute('data-main03-tab');
      document.querySelectorAll('[data-main03-tab]').forEach(function(b){ b.classList.toggle('active', b === btn); });
      if (cards) cards.classList.toggle('is-hidden', mode === 'detail');
      if (detail) detail.hidden = mode !== 'detail';
      // 충전유형은 카드비교에서만 의미 있음(상세는 유형별 행을 모두 노출) → 상세비교 시 숨김
      if (typeSel) typeSel.style.display = (mode === 'detail') ? 'none' : '';
    });
  });
  // [상세비교] 리스트+단일패널 구조는 카드 캐러셀(js/fee-compare.js)로 대체됨 — 관련 로직 이관.

  // [푸터 정책링크 복원] partials.js 푸터에는 정책 링크 nav 가 없어, 시안(이미지)처럼
  //  로고 우측에 개인정보처리방침 등 4개 링크를 보강한다. 푸터는 partials.js 가
  //  DOMContentLoaded 에 주입하므로, 주입 이후 시점에 삽입한다(중복 방지 가드 포함).
  //  ※ index.html 에서만 로드되는 스크립트라 다른 페이지 푸터에는 영향 없음.
  //  각 링크 클릭 동작은 추후 구현(현재 앞 3개는 자리표시 href="#").
  // [푸터 통일] 과거에는 partials.js 푸터에 정책 링크가 없어 메인에서만 별도 주입했으나,
  //  현재 partials.js 푸터가 정책 링크(.ref-footer-policy)와 다국어 키를 모두 포함하므로
  //  메인 전용 주입은 불필요하다. 모든 페이지가 partials.js 푸터를 동일하게 사용하도록 주입 로직을 제거한다.

})();
