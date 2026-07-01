/* =========================================================
   i18n.js — 다국어 전환 코어 (ko 기본 · en)
   - localStorage 'site-lang' 저장 (ko | en)
   - <html lang> 동적 변경 (KWCAG 6.1.1)
   - 자동 HTML 감지: 값에 <태그>가 있으면 innerHTML, 없으면 textContent
   - 명시적 속성: data-i18n / data-i18n-aria / data-i18n-html / data-i18n-attr
   - 한국어 폴백: 번역 누락 키는 ko 값 사용
   - <a data-lang="ko|en"> 클릭 시 자동 전환
   - 외부 노출: window.__i18n
   ========================================================= */
(function () {
  'use strict';

  var DICT = {};
  var LS_KEY = 'site-lang';
  var SUPPORTED = ['ko', 'en'];
  var DEFAULT_LANG = 'ko';
  var HTML_TAG_RE = /<[a-z][\s\S]*>/i;
  var listeners = [];

  function register(obj) {
    if (!obj || typeof obj !== 'object') return;
    Object.keys(obj).forEach(function (k) { DICT[k] = obj[k]; });
  }

  function getLang() {
    try {
      var v = localStorage.getItem(LS_KEY);
      return SUPPORTED.indexOf(v) >= 0 ? v : DEFAULT_LANG;
    } catch (e) { return DEFAULT_LANG; }
  }
  function setLangStorage(lang) {
    try { localStorage.setItem(LS_KEY, lang); } catch (e) {}
  }
  function setLang(lang) {
    if (SUPPORTED.indexOf(lang) < 0) lang = DEFAULT_LANG;
    setLangStorage(lang);
  }
  function t(key, lang) {
    lang = lang || getLang();
    var e = DICT[key];
    if (!e) return key;
    if (e[lang] != null && e[lang] !== '') return e[lang];
    if (e.ko != null) return e.ko;
    return key;
  }

  function ensureLiveRegion() {
    var live = document.getElementById('__i18nLive');
    if (live) return live;
    live = document.createElement('div');
    live.id = '__i18nLive';
    live.className = 'sr-only';
    live.setAttribute('aria-live', 'polite');
    live.setAttribute('aria-atomic', 'true');
    document.body.appendChild(live);
    return live;
  }

  function syncActiveLangUI(lang) {
    document.querySelectorAll('[data-lang]').forEach(function (el) {
      if (el.hasAttribute('data-lang-trigger')) return;
      if (el.getAttribute('data-lang') === lang) {
        el.classList.add('is-active');
        el.setAttribute('aria-current', 'true');
      } else {
        el.classList.remove('is-active');
        el.removeAttribute('aria-current');
      }
    });
  }

  function applyLang(lang) {
    if (SUPPORTED.indexOf(lang) < 0) lang = DEFAULT_LANG;
    document.documentElement.setAttribute('lang', lang);

    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var k = el.getAttribute('data-i18n');
      if (!k) return;
      var v = t(k, lang);
      if (HTML_TAG_RE.test(v)) el.innerHTML = v;
      else el.textContent = v;
    });
    document.querySelectorAll('[data-i18n-aria]').forEach(function (el) {
      var k = el.getAttribute('data-i18n-aria');
      if (k) el.setAttribute('aria-label', t(k, lang));
    });
    document.querySelectorAll('[data-i18n-html]').forEach(function (el) {
      var k = el.getAttribute('data-i18n-html');
      if (k) el.innerHTML = t(k, lang);
    });
    document.querySelectorAll('[data-i18n-attr]').forEach(function (el) {
      var spec = el.getAttribute('data-i18n-attr');
      if (!spec) return;
      spec.split(',').forEach(function (pair) {
        var idx = pair.indexOf(':');
        if (idx < 0) return;
        var attr = pair.slice(0, idx).trim();
        var key  = pair.slice(idx + 1).trim();
        if (attr && key) el.setAttribute(attr, t(key, lang));
      });
    });

    setLangStorage(lang);
    syncActiveLangUI(lang);
    listeners.forEach(function (fn) { try { fn(lang); } catch (e) {} });
    // dispatch global event so dynamic renderers (e.g., subsidy-region) can re-render
    try {
      var ev = new CustomEvent('langChange', { detail: { lang: lang } });
      window.dispatchEvent(ev);
      document.dispatchEvent(ev);
    } catch (e) {}
  }

  function applyLanguage(lang) { applyLang(lang); }

  function toggle() {
    var cur = getLang();
    var next = cur === 'ko' ? 'en' : 'ko';
    applyLang(next);
    var live = ensureLiveRegion();
    live.textContent = t('lang.switched.' + next, next);
  }

  function on(fn) { if (typeof fn === 'function') listeners.push(fn); }
  function init() {
    // 세션 첫 진입 시에만 한국어로 리셋 (탭 단위)
    // sessionStorage 마커가 없으면 localStorage 비우고 ko 디폴트
    // 한번 ENG로 전환하면 같은 세션 내에서 페이지 이동해도 유지됨
    var SESS_KEY = '__i18nSessOpened';
    try {
      if (!sessionStorage.getItem(SESS_KEY)) {
        localStorage.removeItem(LS_KEY);
        sessionStorage.setItem(SESS_KEY, '1');
      }
    } catch(e){}
    applyLang(getLang());
  }

  document.addEventListener('click', function (e) {
    var a = e.target.closest('[data-lang]');
    if (!a) return;
    if (a.hasAttribute('data-lang-trigger')) return;
    e.preventDefault();
    var lang = a.getAttribute('data-lang');
    if (SUPPORTED.indexOf(lang) >= 0) {
      applyLang(lang);
      var live = ensureLiveRegion();
      live.textContent = t('lang.switched.' + lang, lang);
    }
  });

  window.__i18n = {
    t: t, getLang: getLang, setLang: setLang,
    applyLang: applyLang, applyLanguage: applyLanguage,
    toggle: toggle, on: on, init: init, register: register,
    SUPPORTED: SUPPORTED.slice()
  };

  init();
})();
