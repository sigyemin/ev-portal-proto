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
  var FALLBACK_TOAST_KO = '사업자·시간대·할인·로밍에 따라 실제 결제금액이 다릅니다.';
  var FALLBACK_TOAST_EN = 'The amount you actually pay varies by operator, time of day, discounts and roaming.';
  // 배지별 부가설명 키 지정 가능(data-toast-key) — 요금=안내가 / 보조금=예상액 등 문맥별 분기
  function discMsg(key) {
    key = key || 'charging.fee.disc.toast';
    try {
      if (window.__i18n && window.__i18n.t) {
        var m = window.__i18n.t(key);
        if (m && m !== key) return m;
      }
    } catch (e) {}
    return (window.__i18n && window.__i18n.getLang && window.__i18n.getLang() === 'en') ? FALLBACK_TOAST_EN : FALLBACK_TOAST_KO;
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

  // ── i18n 헬퍼(폴백 포함) ──
  function i18n(key, fallback) {
    try {
      if (window.__i18n && window.__i18n.t) {
        var m = window.__i18n.t(key);
        if (m && m !== key) return m;
      }
    } catch (e) {}
    return fallback;
  }
  function isEn() {
    try { return window.__i18n && window.__i18n.getLang && window.__i18n.getLang() === 'en'; } catch (e) { return false; }
  }

  /* ── C. 상단 고정 고지 띠 (요금 전용 페이지: charging-fee·h2) ──
     · 닫기 = sessionStorage 세션 기억(영구 아님) → 닫으면 요금표 헤더 축약 배지([data-fee-notice-mini]) 노출
     · ★B 배지·각주는 상시 유지(닫기 불가) — 띠를 닫아도 요금 숫자 옆 배지는 항상 노출
     · 아이콘(느낌표 SVG)+텍스트 병용 · role=region · 자동소멸 없음 · 진입 모달 아님(상시 고정 배너)
     HTML 계약: <div data-fee-notice data-fee-notice-variant="ev|h2"></div> (삽입 지점) ·
                요금표 헤더에 <span data-fee-notice-mini hidden></span> (축약 배지) */
  var NOTICE_KEY = 'evax.feeNotice.closed';
  var WARN_SVG = '<svg class="fee-notice-ico" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>';
  function noticeClosed() { try { return sessionStorage.getItem(NOTICE_KEY) === '1'; } catch (e) { return false; } }
  function setNoticeClosed(v) { try { v ? sessionStorage.setItem(NOTICE_KEY, '1') : sessionStorage.removeItem(NOTICE_KEY); } catch (e) {} }
  var _notices = [], _minis = [];
  function noticeTexts(variant) {
    var en = isEn();
    return {
      title: i18n('charging.fee.notice.title', en ? 'Reference price (guide only)' : '안내요금(참고용)'),
      main: i18n('charging.fee.notice.main', en
        ? 'The price shown is a guide only — the amount you actually pay can differ by operator, time of day, discounts and roaming.'
        : '표시된 요금은 참고용입니다 — 사업자·시간대·할인·로밍에 따라 실제 결제금액이 다를 수 있습니다.'),
      roam: i18n('charging.fee.notice.roam', en
        ? 'In particular, charging at another operator (roaming) can cost significantly more.'
        : '특히 타 사업자(로밍) 충전 시 요금이 크게 다를 수 있습니다.'),
      mini: i18n('charging.fee.notice.mini', en ? 'Guide price — actual payment may differ' : '안내요금 — 실결제와 다를 수 있음'),
      reopen: i18n('charging.fee.notice.reopen', en ? 'Show fee notice again' : '요금 고지 다시 보기'),
      close: i18n('charging.fee.notice.close', en ? 'Close notice' : '고지 닫기')
    };
  }
  function showMinis(show) { _minis.forEach(function (m) { m.hidden = !show; }); }
  function renderNotice(host) {
    var variant = host.getAttribute('data-fee-notice-variant') || 'ev';
    var t = noticeTexts(variant);
    host.className = 'fee-notice';
    host.setAttribute('role', 'region');
    host.setAttribute('aria-label', t.title);
    var roamHTML = (variant === 'ev') ? '<span class="fee-notice-roam"><strong>' + esc(t.roam) + '</strong></span>' : '';
    host.innerHTML = WARN_SVG +
      '<div class="fee-notice-body"><strong>' + esc(t.title) + '</strong> <span>' + esc(t.main) + '</span>' + roamHTML + '</div>' +
      '<button type="button" class="fee-notice-close" aria-label="' + esc(t.close) + '">×</button>';
    host.querySelector('.fee-notice-close').addEventListener('click', function () {
      setNoticeClosed(true); host.hidden = true; showMinis(true);
    });
  }
  function renderMini(mini) {
    var t = noticeTexts('ev');
    mini.className = 'fee-notice-mini';
    mini.innerHTML = '<button type="button" class="fee-notice-mini-btn" aria-label="' + esc(t.reopen) + '"><span class="fnm-ico" aria-hidden="true">ⓘ</span>' + esc(t.mini) + '</button>';
    mini.querySelector('.fee-notice-mini-btn').addEventListener('click', function () {
      setNoticeClosed(false); showMinis(false); _notices.forEach(function (n) { n.hidden = false; });
    });
  }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function initNotice() {
    _notices = [].slice.call(document.querySelectorAll('[data-fee-notice]'));
    _minis = [].slice.call(document.querySelectorAll('[data-fee-notice-mini]'));
    _notices.forEach(renderNotice);
    _minis.forEach(renderMini);
    var closed = noticeClosed();
    _notices.forEach(function (n) { n.hidden = closed; });
    showMinis(closed);
    // 언어 전환 시 재렌더(상태 유지)
    window.addEventListener('langChange', function () {
      _notices.forEach(function (n) { var wasHidden = n.hidden; renderNotice(n); n.hidden = wasHidden; });
      _minis.forEach(function (m) { var wasHidden = m.hidden; renderMini(m); m.hidden = wasHidden; });
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initNotice);
  else initNotice();

  window.FeeDisclaimer = { pulse: pulse };
})();
