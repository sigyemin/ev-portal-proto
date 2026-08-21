/* ============================================================
   [EVAX 프로토타입 v1.01] 공통 셸
   - 헤더/푸터: 2026-08-20 운영(ev.or.kr) 라이브 HTML 그대로
   - GNB: menu-data.js(운영 실측 메뉴)로 생성
   ============================================================ */
(function () {
  'use strict';

  function gnbHtml() {
    var M = window.EV_MENU || [];
    var h = ['<ul class="gnb">'];
    M.forEach(function (top) {
      h.push('<li class="gnb__item">');
      h.push('<a href="#" class="gnb__link">' + top.t + '</a>');
      h.push('<div class="gnb__sub"><div class="gnb__sub-inner">');
      h.push('<h2 class="gnb__sub-title">' + top.t + '</h2>');
      h.push('<ul class="gnb__sub-list">');
      top.mids.forEach(function (m) {
        h.push('<li class="gnb__sub-item">');
        h.push('<a href="' + (m.h || '#') + '" class="gnb__sub-link">' + m.t + '</a>');
        if (m.kids && m.kids.length) {
          h.push('<ul class="gnb__sub2-list">');
          m.kids.forEach(function (k) {
            h.push('<li><a href="' + (k.h || '#') + '">' + k.t + '</a></li>');
          });
          h.push('</ul>');
        }
        h.push('</li>');
      });
      h.push('</ul></div></div></li>');
    });
    h.push('</ul>');
    return h.join('');
  }

  var HEADER =
    '<header class="header"> <div class="header__inner"> <div class="header__logo">' +
    ' <a href="index.html" class="header__logo-link">' +
    ' <img src="assets/images/common/logo-header.svg" alt="무공해차 통합누리집 로고"> </a> </div>' +
    ' <button type="button" class="button button--icon button--borderless button--menu"' +
    ' aria-label="모바일 메뉴 열기" aria-haspopup="true" aria-expanded="false" aria-controls="mobile-menu">' +
    ' <i class="svg-icon menu" aria-hidden="true"></i> <span class="button__label">메뉴열기</span> </button>' +
    ' <div class="header__nav"> <div class="header__utility header__utility--guest">' +
    ' <div class="dropdown dropdown--lang"> <div class="dropdown-selector">' +
    ' <button type="button" class="dropdown-selector__button" aria-haspopup="listbox" aria-expanded="false">' +
    ' <i class="svg-icon global" aria-hidden="true"></i>' +
    ' <span class="dropdown-selector__button-label">KOR</span>' +
    ' <i class="svg-icon angle-down" aria-hidden="true"></i> </button> </div>' +
    ' <div class="dropdown-container" role="listbox"> <ul class="dropdown-container__list">' +
    ' <li class="dropdown-container__item dropdown-container__item--selected">' +
    ' <button type="button" class="dropdown-container__button" role="option" aria-selected="true">' +
    ' <span class="dropdown-container__label">KOR</span> </button> </li>' +
    ' <li class="dropdown-container__item">' +
    ' <button type="button" class="dropdown-container__button" role="option" aria-selected="false">' +
    ' <span class="dropdown-container__label">ENG</span> </button> </li> </ul> </div> </div>' +
    ' <ul class="utility-menu">' +
    ' <li class="utility-menu__item"><a href="login.html" class="utility-menu__link">로그인</a></li>' +
    ' <li class="utility-menu__item"><a href="member-join.html" class="utility-menu__link">회원가입</a></li>' +
    ' </ul>' +
    ' <div class="zoom-control">' +
    ' <button type="button" class="button button--xsmall button--zoom-plus" aria-label="글씨크기 크게">' +
    ' <span class="button__label">큰글씨</span> <i class="svg-icon zoom-plus" aria-hidden="true"></i> </button>' +
    ' <button type="button" class="button button--xsmall button--zoom-minus" aria-label="글씨크기 작게">' +
    ' <span class="button__label">글씨크기 작게</span> <i class="svg-icon zoom-minus" aria-hidden="true"></i> </button>' +
    ' </div> </div>' +
    ' <nav id="gnb" class="nav-gnb" aria-label="주요 메뉴">__GNB__</nav>' +
    ' </div> </div> </header>';

  var FOOTER =
    '<footer class="footer"> <div class="footer__top"> <div class="footer__inner">' +
    ' <div class="footer__logo"> <img src="assets/images/common/logo-footer.svg" alt="무공해차 통합누리집 로고"> </div>' +
    ' <nav class="footer__nav" aria-label="푸터 메뉴"> <ul class="footer__nav-list">' +
    ' <li class="footer__nav-item"><a href="policy-privacy.html" class="footer__nav-link footer__nav-link--privacy">개인정보처리방침</a></li>' +
    ' <li class="footer__nav-item"><a href="#" class="footer__nav-link">이메일 무단수집거부</a></li>' +
    ' <li class="footer__nav-item"><a href="#" class="footer__nav-link">영상정보처리기기 운영관리지침</a></li>' +
    ' <li class="footer__nav-item"><a href="inquiry-complaint.html" class="footer__nav-link">불편민원신고센터</a></li>' +
    ' </ul> </nav> </div> </div>' +
    ' <div class="footer__bottom"> <div class="footer__inner"> <div class="footer__info">' +
    ' <address class="footer__address">' +
    ' <p>[22689] 인천광역시 서해구 환경로 42(오류동 종합환경연구단지)</p>' +
    ' <p>대표전화 : (누리집콜센터) 1661-0970</p>' +
    ' <p>급속충전시설 이용관련문의 및 회원카드 발급문의 한국자동차환경협회 : 1661-9408</p>' +
    ' </address>' +
    ' <p class="footer__copyright">Copyright 2026 KECO All Rights Reserved.</p> </div>' +
    ' <div class="footer__related">' +
    ' <a href="http://www.mcee.go.kr/" target="_blank" class="footer__related-link" title="기후에너지환경부 홈페이지로 이동 (새창 열림)">' +
    ' <img src="assets/images/common/logo-mcee.svg" alt="기후에너지환경부"> </a>' +
    ' <a href="https://www.keco.or.kr" target="_blank" class="footer__related-link" title="한국환경공단 홈페이지로 이동 (새창 열림)">' +
    ' <img src="assets/images/common/logo-keco.svg" alt="한국환경공단"> </a>' +
    ' <a href="http://www.aea.or.kr/" target="_blank" class="footer__related-link" title="한국자동차환경협회 홈페이지로 이동 (새창 열림)">' +
    ' <img src="assets/images/common/logo-aea.svg" alt="한국자동차환경협회"> </a>' +
    ' </div> </div> </div> </footer>';

  function inject() {
    var h = document.getElementById('header-slot');
    if (h) h.outerHTML = HEADER.replace('__GNB__', gnbHtml());
    var f = document.getElementById('footer-slot');
    if (f) f.outerHTML = FOOTER;

    // 메가메뉴 open/close (운영 ui-common 이 잡지 못하는 경우 대비)
    document.querySelectorAll('.gnb__item').forEach(function (li) {
      li.addEventListener('mouseenter', function () { li.classList.add('is-active'); });
      li.addEventListener('mouseleave', function () { li.classList.remove('is-active'); });
      var a = li.querySelector('.gnb__link');
      if (a) a.addEventListener('click', function (e) {
        e.preventDefault();
        li.classList.toggle('is-active');
      });
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', inject);
  else inject();
})();
