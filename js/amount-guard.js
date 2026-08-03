/* ════════════════════════════════════════════════════════════
   amount-guard.js — 안내가(≠실결제) '빡세게' 고지 툴킷 (ISS-092)
   [DEV] 요구: 매 진입/매 계산 시 재적용, 세션·쿠키 스킵 금지, '오늘 하루 안보기' 없음.
   제공 2종:
   ① 블러 확인  AmountGuard.guard(el, opts)  — el 내부 금액을 흐림+오버레이. [확인하고 금액 보기] 클릭 시 노출.
                선언형: <div data-amount-guard="blur" data-ag-note="…각주…"> …금액… </div> → 로드 시 자동.
                재계산: 결과 렌더 후 AmountGuard.guard(resultEl) 재호출 → 다시 블러.
   ② 진입 팝업  AmountGuard.entryPopup({title, body, confirmLabel, onClose})
                선언형: <template data-amount-guard="popup" data-ag-title="…"> …본문 HTML… </template> → 로드 시 1회(매 진입).
   접근성: 블러 금액 aria-hidden, 확인 버튼 포커스, role/aria-modal, ESC 닫기, 색+아이콘+텍스트 병용.
   ════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var DEFAULT_MSG_KO = '이 금액은 안내가(추정)입니다. 실제 지급액·결제액은 지자체 예산·차량 효율 등급·사업자·시간대·할인 등에 따라 달라질 수 있습니다.';
  var DEFAULT_MSG_EN = 'This is a reference (estimated) amount. The amount actually paid or granted may differ by local budget, vehicle efficiency grade, operator, time and discounts.';
  var DEFAULT_BTN_KO = '확인하고 금액 보기';
  var DEFAULT_BTN_EN = 'Confirm & show amount';

  function isEn() { try { return window.__i18n && window.__i18n.getLang && window.__i18n.getLang() === 'en'; } catch (e) { return false; } }
  function t(key, ko, en) {
    try { if (window.__i18n && window.__i18n.t) { var m = window.__i18n.t(key); if (m && m !== key) return m; } } catch (e) {}
    return isEn() ? en : ko;
  }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  var WARN_SVG = '<svg class="ag-ov-ico" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>';
  var WARN_SVG_SM = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>';

  /* ─────────── ① 블러 확인 ─────────── */
  // el 내부를 .ag-content 로 감싸고 .ag-blurred + 오버레이 부착. 이미 감싼 경우 재블러.
  function guard(el, opts) {
    if (!el) return;
    opts = opts || {};
    // ★__agWrapped 플래그가 아닌 실제 .ag-content 존재로 판정 — innerHTML 교체(재렌더)로 래퍼가 사라진 경우도 안전하게 재래핑
    var wrap = el;
    var content = el.querySelector(':scope > .ag-content');
    var overlay = el.querySelector(':scope > .ag-overlay');
    if (content && overlay) {
      // 재블러(내부 textContent 갱신형): 기존 각주 제거 후 다시 블러
      var oldNote = el.querySelector(':scope > .ag-note'); if (oldNote) oldNote.remove();
    } else {
      // 최초 또는 innerHTML 교체 후: 잔존 래퍼 잔재 제거 후 el 자식 전체를 .ag-content 로 이동
      var stale = el.querySelector(':scope > .ag-content, :scope > .ag-overlay, :scope > .ag-note');
      if (stale) { // 부분 잔존 방지: 남은 가드 요소 정리
        [].slice.call(el.querySelectorAll(':scope > .ag-overlay, :scope > .ag-note')).forEach(function (n) { n.remove(); });
      }
      el.classList.add('ag-wrap');
      content = document.createElement('div');
      content.className = 'ag-content';
      while (el.firstChild) content.appendChild(el.firstChild);
      el.appendChild(content);
      overlay = document.createElement('div');
      overlay.className = 'ag-overlay';
      overlay.setAttribute('role', 'group');
      overlay.setAttribute('aria-label', t('amountguard.overlay.aria', '금액 확인 안내', 'Amount confirmation notice'));
      el.appendChild(overlay);
      el.__agWrapped = true;
    }
    var msg = opts.msg || el.getAttribute('data-ag-msg') || t('amountguard.msg', DEFAULT_MSG_KO, DEFAULT_MSG_EN);
    var btnLabel = opts.confirmLabel || t('amountguard.btn', DEFAULT_BTN_KO, DEFAULT_BTN_EN);
    content.classList.add('ag-blurred');
    content.setAttribute('aria-hidden', 'true');
    overlay.hidden = false;
    overlay.innerHTML = WARN_SVG +
      '<p class="ag-ov-msg">' + esc(msg) + '</p>' +
      '<button type="button" class="ag-ov-btn">' + esc(btnLabel) + '</button>';
    var btn = overlay.querySelector('.ag-ov-btn');
    btn.addEventListener('click', function () {
      reveal(wrap, opts);
    });
    if (opts.focus) { try { btn.focus(); } catch (e) {} }
    return wrap;
  }

  function reveal(wrap, opts) {
    if (!wrap) return;
    opts = opts || {};
    var content = wrap.querySelector(':scope > .ag-content');
    var overlay = wrap.querySelector(':scope > .ag-overlay');
    if (content) { content.classList.remove('ag-blurred'); content.removeAttribute('aria-hidden'); }
    if (overlay) overlay.hidden = true;
    // 상시 각주(노출 후) 부착
    var noteText = opts.note || wrap.getAttribute('data-ag-note');
    if (noteText !== '' && noteText !== 'none') {
      if (!noteText) noteText = t('amountguard.note', DEFAULT_MSG_KO, DEFAULT_MSG_EN);
      if (!wrap.querySelector(':scope > .ag-note')) {
        var note = document.createElement('div');
        note.className = 'ag-note';
        note.innerHTML = '<span class="ag-note-ico" aria-hidden="true">ⓘ</span><span>' + esc(noteText) + '</span>';
        wrap.appendChild(note);
      }
    }
  }

  /* ─────────── ② 진입 팝업 (매 진입) ─────────── */
  var _openModal = null;
  function entryPopup(cfg) {
    cfg = cfg || {};
    closeModal(); // 중복 방지
    var title = cfg.title || t('amountguard.popup.title', '금액 안내 (안내가 · 참고용)', 'Amount notice (reference only)');
    var body = cfg.body || t('amountguard.popup.body',
      '<p>이 페이지에 표시되는 금액은 <strong>안내가(추정)</strong>이며, 실제 지급·결제 금액과 다를 수 있습니다.</p>',
      '<p>Amounts shown on this page are <strong>reference (estimated)</strong> values and may differ from the amount actually granted or paid.</p>');
    var confirmLabel = cfg.confirmLabel || t('amountguard.popup.confirm', '확인', 'OK');
    var modal = document.createElement('div');
    modal.className = 'ag-modal';
    modal.setAttribute('role', 'presentation');
    modal.innerHTML =
      '<div class="ag-modal-back" data-ag-close></div>' +
      '<div class="ag-modal-dialog" role="dialog" aria-modal="true" aria-labelledby="agModalTitle">' +
        '<div class="ag-modal-head"><span class="ag-modal-ico">' + WARN_SVG_SM + '</span><h3 id="agModalTitle">' + esc(title) + '</h3></div>' +
        '<div class="ag-modal-body">' + body + '</div>' +
        '<div class="ag-modal-foot"><button type="button" class="ag-modal-btn" data-ag-close>' + esc(confirmLabel) + '</button></div>' +
      '</div>';
    document.body.appendChild(modal);
    var lastFocus = document.activeElement;
    function close() {
      modal.classList.remove('is-open');
      if (modal.parentNode) modal.parentNode.removeChild(modal);
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      _openModal = null;
      if (lastFocus && lastFocus.focus) { try { lastFocus.focus(); } catch (e) {} }
      if (typeof cfg.onClose === 'function') cfg.onClose();
    }
    function onKey(e) { if (e.key === 'Escape') close(); }
    modal.addEventListener('click', function (e) { if (e.target.closest('[data-ag-close]')) close(); });
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    modal.classList.add('is-open');
    _openModal = { close: close };
    var okBtn = modal.querySelector('.ag-modal-btn');
    if (okBtn) { try { okBtn.focus(); } catch (e) {} }
    return _openModal;
  }
  function closeModal() { if (_openModal) _openModal.close(); }

  /* ─────────── 선언형 자동 초기화 ─────────── */
  function initDeclarative() {
    // 블러: [data-amount-guard="blur"]
    document.querySelectorAll('[data-amount-guard="blur"]').forEach(function (el) { guard(el); });
    // 진입 팝업: <template data-amount-guard="popup" data-ag-title="…">본문</template> (첫 1개만)
    var tpl = document.querySelector('template[data-amount-guard="popup"]');
    if (tpl) {
      entryPopup({
        title: tpl.getAttribute('data-ag-title') || undefined,
        body: (tpl.innerHTML || '').trim() || undefined,
        confirmLabel: tpl.getAttribute('data-ag-confirm') || undefined
      });
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initDeclarative);
  else initDeclarative();

  window.AmountGuard = { guard: guard, reveal: reveal, entryPopup: entryPopup, closeModal: closeModal };
})();
