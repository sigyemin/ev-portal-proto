/* ════════════════════════════════════════════════════════════
   충전요금 '안내가' 디스클레이머 3층 — 공통 동작 (v0.20)
   [DEV] 디스클레이머 3층 = 라벨(안내가)·결과 스트립(1회 펄스)·표 캡션.
         진입 팝업 채택 안 함(타이밍·인지율·민폐). 법무적 고지 요구 발생 시
         첫 방문 1회 스낵바 절충안 별도 검토.
   · 핵심 메시지(실제 결제 금액과 다를 수 있음)는 인터랙션 없이 상시 노출(스트립·캡션).
   · 배지 클릭/탭은 '못 눌러도 손해 없는' 부가설명 토스트일 뿐.
   ════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var FALLBACK_TOAST = '현장 단가·사업자 프로모션·로밍 할증·멤버십에 따라 실제 결제 금액이 달라질 수 있습니다.';
  // 배지별 토스트 키 지정 가능(data-toast-key) — 요금=안내가 / 보조금=예상액 등 문맥별 부가설명 분기
  function toastMsg(key) {
    key = key || 'charging.fee.disc.toast';
    try {
      if (window.__i18n && window.__i18n.t) {
        var m = window.__i18n.t(key);
        if (m && m !== key) return m;
      }
    } catch (e) {}
    return FALLBACK_TOAST;
  }

  // 배지 클릭/탭 → 부가설명 토스트 (window.__toast 재사용 · 못 눌러도 손해 없는 부가설명)
  //   data-toast-text=리터럴 우선 · 없으면 data-toast-key(i18n) · 그래도 없으면 기본 요금 문구
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-fee-badge]');
    if (!b) return;
    e.preventDefault();
    var msg = b.getAttribute('data-toast-text') || toastMsg(b.getAttribute('data-toast-key'));
    if (window.__toast) window.__toast(msg, 'info');
  });

  // 결과 최초 렌더 시 1회만 링 펄스 (세션 내 재펄스 없음)
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
