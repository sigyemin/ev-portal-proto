/* ════════════════════════════════════════════════════════════
   충전요금 '안내가' / 보조금 '예상액' 디스클레이머 공통 동작 (v0.20)
   [DEV] 3층 = 라벨(배지)·결과 스트립(1회 펄스)·표 캡션.
   [DEV] 배지 부가설명 = KRDS Disclosure 패턴(인라인 토글 패널). 자동소멸 금지(접근성) → __toast 사용 금지.
         · 열림: 부가설명 텍스트 + 닫기(×) · 사용자가 닫거나 배지 재클릭 전까지 유지(자동 소멸 없음)
         · 배지 aria-expanded 토글 · 패널 role=region·aria-label · 키보드(Enter/Space, 배지=button) 지원
   · 핵심 메시지(실제 결제 금액과 다를 수 있음)는 인터랙션 없이 상시 노출(스트립·캡션).
   ════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var FALLBACK_TOAST = '현장 단가·사업자 프로모션·로밍 할증·멤버십에 따라 실제 결제 금액이 달라질 수 있습니다.';
  // 배지별 부가설명 키 지정 가능(data-toast-key) — 요금=안내가 / 보조금=예상액 등 문맥별 분기
  function discMsg(key) {
    key = key || 'charging.fee.disc.toast';
    try {
      if (window.__i18n && window.__i18n.t) {
        var m = window.__i18n.t(key);
        if (m && m !== key) return m;
      }
    } catch (e) {}
    return FALLBACK_TOAST;
  }

  // ── KRDS Disclosure: 배지 바로 아래 인라인 토글 패널(자동 소멸 없음) ──
  function panelFor(badge) {
    var p = badge.nextElementSibling;
    if (p && p.classList && p.classList.contains('fee-disclosure')) return p;
    p = document.createElement('span');           // heading 내부 삽입 대비 span(display:block)
    p.className = 'fee-disclosure';
    p.setAttribute('role', 'region');
    p.setAttribute('aria-label', (badge.textContent || '').trim() + ' 부가설명');
    p.hidden = true;
    var msg = badge.getAttribute('data-toast-text') || discMsg(badge.getAttribute('data-toast-key'));
    var txt = document.createElement('span'); txt.className = 'fd-text'; txt.textContent = msg;
    var btn = document.createElement('button');
    btn.type = 'button'; btn.className = 'fd-close'; btn.setAttribute('aria-label', '부가설명 닫기'); btn.textContent = '×';
    btn.addEventListener('click', function (e) { e.stopPropagation(); setOpen(badge, p, false); badge.focus(); });
    p.appendChild(txt); p.appendChild(btn);
    badge.insertAdjacentElement('afterend', p);
    return p;
  }
  function setOpen(badge, p, open) {
    p.hidden = !open;
    badge.setAttribute('aria-expanded', open ? 'true' : 'false');
  }
  function toggle(badge) {
    var p = panelFor(badge);
    setOpen(badge, p, p.hidden);
  }

  // 배지 클릭/탭(Enter·Space 포함 — 배지는 <button>) → disclosure 패널 토글
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-fee-badge]');
    if (!b) return;
    e.preventDefault();
    toggle(b);
  });
  // 초기 aria-expanded 세팅
  function initBadges() {
    document.querySelectorAll('[data-fee-badge]').forEach(function (b) {
      if (!b.hasAttribute('aria-expanded')) b.setAttribute('aria-expanded', 'false');
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initBadges);
  else initBadges();

  // 결과 최초 렌더 시 1회만 링 펄스 (세션 내 재펄스 없음 · reduced-motion은 CSS에서 애니메이션 제거)
  var pulsed = {};
  function pulse(el, key) {
    if (!el) return;
    key = key || 'default';
    if (pulsed[key]) return;
    pulsed[key] = true;
    el.classList.remove('fee-pulse');
    void el.offsetWidth;         // reflow → 애니메이션 재기동 보장
    el.classList.add('fee-pulse');
    setTimeout(function () { el.classList.remove('fee-pulse'); }, 1000);
  }

  window.FeeDisclaimer = { pulse: pulse };
})();
