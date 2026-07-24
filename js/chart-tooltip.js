/* ============================================================================
   chart-tooltip.js — 차트 공용 툴팁 컴포넌트 (단일 구현 · 여러 페이지 공유)
   ----------------------------------------------------------------------------
   [ISS-069정정] data.html · kev100-companies.html 등 인라인 SVG 차트가 공유한다.
   중복 구현 금지 — 툴팁이 필요한 페이지는 이 파일만 로드하고 ChartTooltip.attach() 호출.

   ★접근성(공인인증 대비)
     - 마우스 전용 금지: hover / focus 양쪽에서 동일 문구 노출
     - 트리거 tabindex="0" → 키보드 Tab으로 순회 가능, Esc로 닫기
     - 트리거 aria-label = 툴팁과 동일 문구(스크린리더가 툴팁 없이도 읽음)
     - 툴팁 노드 role="tooltip" + 트리거 aria-describedby 연결
     - 색상 단독 구분 금지 → 범례·sr-only 데이터표는 별도로 유지(툴팁이 대체하지 않음)

   사용법
     ChartTooltip.attach(root)   // root(기본 document) 하위의 [data-tip] 요소를 툴팁 트리거로 연결
     ChartTooltip.promoteTitles(root)  // SVG <title>/title 속성을 data-tip으로 승격(빌더 수정 없이 적용)
   ============================================================================ */
(function (w, d) {
  'use strict';
  var TIP_ID = 'chartTipBubble';
  var tip = null;

  function ensure() {
    if (tip && d.body.contains(tip)) return tip;
    tip = d.createElement('div');
    tip.id = TIP_ID;
    tip.className = 'chart-tip';
    tip.setAttribute('role', 'tooltip');
    tip.hidden = true;
    d.body.appendChild(tip);
    return tip;
  }

  function show(el) {
    var text = el.getAttribute('data-tip');
    if (!text) return;
    var t = ensure();
    t.textContent = text;
    t.hidden = false;
    var r = el.getBoundingClientRect();
    var tw = t.offsetWidth, th = t.offsetHeight;
    var left = r.left + r.width / 2 - tw / 2;
    var top = r.top - th - 10;
    if (top < 4) top = r.bottom + 10;                       // 위 공간 없으면 아래로
    left = Math.max(6, Math.min(left, w.innerWidth - tw - 6)); // 화면 밖 이탈 방지
    t.style.left = Math.round(left + w.scrollX) + 'px';
    t.style.top = Math.round(top + w.scrollY) + 'px';
  }

  function hide() { if (tip) tip.hidden = true; }

  function wire(el) {
    if (el.__tipWired) return;
    el.__tipWired = true;
    // 키보드 접근 — 이미 포커스 가능한 요소(button 등)는 tabindex 부여하지 않음
    var focusable = /^(a|button|input|select|textarea)$/i.test(el.tagName) || el.hasAttribute('tabindex');
    if (!focusable) el.setAttribute('tabindex', '0');
    // 스크린리더는 툴팁 없이도 읽을 수 있게 aria-label 동기화
    if (!el.getAttribute('aria-label')) el.setAttribute('aria-label', el.getAttribute('data-tip'));
    el.setAttribute('aria-describedby', TIP_ID);
    el.addEventListener('mouseenter', function () { show(el); });
    el.addEventListener('mouseleave', hide);
    el.addEventListener('focus', function () { show(el); });
    el.addEventListener('blur', hide);
    el.addEventListener('keydown', function (e) { if (e.key === 'Escape') hide(); });
  }

  w.ChartTooltip = {
    attach: function (root) {
      (root || d).querySelectorAll('[data-tip]').forEach(wire);
      ensure();
    },
    /* 기존 차트 빌더를 고치지 않고 적용 — SVG <title> / title 속성을 data-tip으로 승격 */
    promoteTitles: function (root) {
      var scope = root || d;
      scope.querySelectorAll('svg title').forEach(function (t) {
        var host = t.parentNode;
        if (host && host.nodeType === 1 && !host.getAttribute('data-tip')) {
          host.setAttribute('data-tip', (t.textContent || '').trim());
        }
      });
      scope.querySelectorAll('svg [title]').forEach(function (el) {
        if (!el.getAttribute('data-tip')) el.setAttribute('data-tip', el.getAttribute('title'));
      });
      this.attach(scope);
    }
  };

  d.addEventListener('scroll', hide, true);
  w.addEventListener('resize', hide);
})(window, document);
