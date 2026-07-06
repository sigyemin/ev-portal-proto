/* ============================================================
   auth-verify.js — 휴대전화 본인인증 공통 모듈 (PASS 방식 단일 버튼, mock)
   표준 마크업(.cf-auth-card):
     <div class="cf-auth-card" id="xxx">
       <div class="cf-auth-ico">…아이콘…</div>
       <button type="button" class="cf-auth-btn"><span>휴대전화 인증하기</span> …›…</button>
       <span class="cf-auth-live" aria-live="polite"></span>   ← 선택(자동 생성)
     </div>
   사용:
     1) 자동: 카드에 data-cf-auth 부여 → DOMContentLoaded 시 자동 마운트.
     2) 프로그램: var a = AuthVerify.mount('#authCard', { locked:true, session:'signup_auth',
                     onVerified:function(data){ …후속(신청서 활성/제출 허용/조회 노출)… } });
        컨트롤러: a.lock() / a.unlock() / a.isVerified() / a.reset()
     3) 이벤트: 카드에서 'cf-auth:verified'(bubbles) 수신해 후속 처리 가능.
   ── 프로토타입 mock: 실제 PASS 연동 없음. 완료 시 데모 본인정보 반환. ============ */
(function () {
  'use strict';
  var MOCK = { name: '홍길동', phone: '010-1234-5678', birth: '1990.01.01' };
  function toast(m, t) { if (window.__toast) window.__toast(m, t || 'info'); }

  function ensureLive(card) {
    var live = card.querySelector('.cf-auth-live');
    if (!live) {
      live = document.createElement('span');
      live.className = 'cf-auth-live';
      live.setAttribute('aria-live', 'polite');
      card.appendChild(live);
    }
    return live;
  }

  function markVerified(card, opts) {
    if (card.dataset.cfVerified === '1') return null;
    card.dataset.cfVerified = '1';
    card.classList.add('is-verified');
    card.classList.remove('is-locked');
    var btn = card.querySelector('.cf-auth-btn');
    if (btn) {
      btn.classList.add('done');
      btn.disabled = true;
      btn.setAttribute('aria-disabled', 'true');
      var span = btn.querySelector('span');
      if (span) span.textContent = '✓ 본인인증 완료';
    }
    var data = { name: MOCK.name, phone: MOCK.phone, birth: MOCK.birth, verifiedAt: Date.now() };
    if (opts && opts.session) { try { sessionStorage.setItem(opts.session, JSON.stringify(data)); } catch (e) {} }
    ensureLive(card).textContent = '본인인증이 완료되었습니다.';
    toast('본인인증이 완료되었습니다. (데모)', 'success');
    try { card.dispatchEvent(new CustomEvent('cf-auth:verified', { bubbles: true, detail: data })); } catch (e) {}
    if (opts && typeof opts.onVerified === 'function') opts.onVerified(data, card);
    return data;
  }

  function mount(target, opts) {
    opts = opts || {};
    var card = (typeof target === 'string') ? document.querySelector(target) : target;
    if (!card) return null;
    if (card.__cfMounted) return card.__cfCtrl;
    card.__cfMounted = true;
    var btn = card.querySelector('.cf-auth-btn');
    var btnText = (btn && btn.querySelector('span')) ? btn.querySelector('span').textContent : '휴대전화 인증하기';
    if (opts.locked) { card.classList.add('is-locked'); if (btn) btn.disabled = true; }
    if (btn) {
      btn.addEventListener('click', function () {
        if (btn.disabled || card.classList.contains('is-locked')) return;
        markVerified(card, opts);
      });
    }
    var ctrl = {
      card: card,
      lock: function () { card.classList.add('is-locked'); if (btn) btn.disabled = true; },
      unlock: function () { card.classList.remove('is-locked'); if (btn && card.dataset.cfVerified !== '1') btn.disabled = false; },
      verify: function () { return markVerified(card, opts); },
      isVerified: function () { return card.dataset.cfVerified === '1'; },
      reset: function () {
        card.dataset.cfVerified = '';
        card.classList.remove('is-verified');
        if (btn) { btn.classList.remove('done'); btn.removeAttribute('aria-disabled'); btn.disabled = !!card.classList.contains('is-locked'); var s = btn.querySelector('span'); if (s) s.textContent = btnText; }
      }
    };
    card.__cfCtrl = ctrl;
    return ctrl;
  }

  function autoInit() {
    var cards = document.querySelectorAll('.cf-auth-card[data-cf-auth]');
    Array.prototype.forEach.call(cards, function (card) {
      mount(card, { locked: card.classList.contains('is-locked') });
    });
  }

  if (document.readyState !== 'loading') setTimeout(autoInit, 0);
  else document.addEventListener('DOMContentLoaded', autoInit);

  window.AuthVerify = {
    mount: mount,
    verify: function (t, o) { var c = (typeof t === 'string') ? document.querySelector(t) : t; return c ? markVerified(c, o || {}) : null; },
    init: autoInit,
    MOCK: MOCK
  };
})();
