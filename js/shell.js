/* ============================================================
   [EVAX 프로토타입 v1.01] 공통 셸
   - 헤더/푸터: 2026-08-20 운영(ev.or.kr) 라이브 HTML 그대로
   - GNB: menu-data.js(운영 실측 메뉴)로 생성
   ============================================================ */
(function () {
  'use strict';

  var CACHE_V = '20260922e';

  /* ------------------------------------------------------------
     로그인 상태(프로토타입 전용 · localStorage)
     - 실제 인증 없음. 헤더 유틸메뉴 분기 시연용.
     - 마크업은 운영 header.jsp(74~93행)와 동일.
     ------------------------------------------------------------ */
  var AUTH_KEY = 'evax.proto.auth';
  var DEFAULT_NAME = '홍길동';

  function readAuth() {
    try {
      var raw = window.localStorage.getItem(AUTH_KEY);
      if (!raw) return { loggedIn: false, name: DEFAULT_NAME };
      var v = JSON.parse(raw);
      if (!v || typeof v !== 'object') return { loggedIn: false, name: DEFAULT_NAME };
      return { loggedIn: v.loggedIn === true, name: (typeof v.name === 'string' && v.name) ? v.name : DEFAULT_NAME };
    } catch (e) {
      return { loggedIn: false, name: DEFAULT_NAME };
    }
  }

  function writeAuth(state) {
    try { window.localStorage.setItem(AUTH_KEY, JSON.stringify(state)); } catch (e) {}
  }

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /* 운영 header.jsp 의 로그인 전/후 유틸영역 마크업 그대로 */
  function authZoneHtml(auth) {
    if (auth.loggedIn) {
      return '<div class="user-profile" data-i18n="header.honorific">' +
        '<span class="user-profile__name">' + esc(auth.name) + '</span>님</div>' +
        '<ul class="utility-menu">' +
        '<li class="utility-menu__item"><a href="mypage.html" class="utility-menu__link" data-i18n="header.myPage">마이페이지</a></li>' +
        '<li class="utility-menu__item"><a href="#" class="utility-menu__link" data-i18n="header.logout">로그아웃</a></li>' +
        '</ul>';
    }
    return '<ul class="utility-menu">' +
      '<li class="utility-menu__item"><a href="login.html" class="utility-menu__link" data-i18n="header.login">로그인</a></li>' +
      '<li class="utility-menu__item"><a href="member-join.html" class="utility-menu__link" data-i18n="header.join">회원가입</a></li>' +
      '</ul>';
  }

  /* ENG 모드에서 재렌더 시 i18n.js(1회성 치환)가 다시 돌지 않으므로 최소 폴백 */
  var EN_FALLBACK = {
    'header.honorific': '', 'header.myPage': 'My Page', 'header.logout': 'Log Out',
    'header.login': 'Log In', 'header.join': 'Sign Up',
    /* 건너뛰기 링크 — assets/js/i18n/en.json 과 동일 문구 */
    'header.skipGnb': 'Skip to main menu', 'header.skip': 'Skip to main content'
  };

  function currentLang() {
    try { return window.localStorage.getItem('nportalLang') || 'ko'; } catch (e) { return 'ko'; }
  }

  function translateIfEn(root) {
    if (currentLang() !== 'en') return;
    var els = root.querySelectorAll('[data-i18n]');
    Array.prototype.forEach.call(els, function (el) {
      var key = el.getAttribute('data-i18n');
      if (!Object.prototype.hasOwnProperty.call(EN_FALLBACK, key)) return;
      for (var i = 0; i < el.childNodes.length; i++) {
        var n = el.childNodes[i];
        if (n.nodeType === 3 && /\S/.test(n.nodeValue)) { n.nodeValue = EN_FALLBACK[key]; return; }
      }
      el.appendChild(document.createTextNode(EN_FALLBACK[key]));
    });
  }

  /* 유틸영역만 교체 렌더(새로고침 없음). 언어 드롭다운/글씨크기 컨트롤은 보존. */
  function renderAuthZone() {
    /* 로그인 영역은 가이드 구조 ⑥(아이콘과 레이블) 자리 = .header__member */
    var zones = document.querySelectorAll('.header__member');
    if (!zones.length) return;
    Array.prototype.forEach.call(zones, function (zone) {
      zone.innerHTML = '';
      var holder = document.createElement('div');
      holder.innerHTML = authZoneHtml(readAuth());
      translateIfEn(holder);
      while (holder.firstChild) zone.appendChild(holder.removeChild(holder.firstChild));
    });
    syncAuthbar();
    renderAdminGnb();
  }

  /* 로그인 상태에서만 GNB 맨 뒤에 '업무지원시스템' 노출
     근거: 운영 ev.or.kr 로그인 DOM = li.gnb__item.gnb__item--admin > a.gnb__link (정보 자료실 다음 6번째)
     드롭다운: 중분류 제목 '시스템 바로가기' + 하위 11종(운영 실측 · targetSiteId)
     운영 링크는 /nportal/sendSSO.do?targetSiteId=D00NN 이며 전부 본인인증 화면으로
     리다이렉트되므로, 프로토타입에서는 11개 모두 member-auth.html 로 보낸다. */
  var ADMIN_MENU_TITLE = '시스템 바로가기';
  var ADMIN_MENU = [
    { t: '통합관리시스템', id: 'D0002' },
    { t: '의무구매임차제', id: 'D0003' },
    { t: '보급목표제', id: 'D0005' },
    { t: '구매보조금신청', id: 'D0006' },
    { t: '저공해차 표지발급', id: 'D0010' },
    { t: '급속 충전시설 지점관리', id: 'D0011' },
    { t: '완속 충전시설 지점관리', id: 'D0012' },
    { t: '브랜드사업 설치보조금', id: 'D0013' },
    { t: '완속충전기 설치보조금', id: 'D0014' },
    { t: '수소차 충전인프라 구축관리', id: 'D0015' },
    { t: '충전기 관리 시스템', id: 'D0017' }
  ];

  function adminGnbHtml(label) {
    var h = ['<a href="#" class="gnb__link">' + esc(label) +
      '<i class="svg-icon angle-down gnb__link-arrow" aria-hidden="true"></i></a>'];
    h.push('<div class="gnb__sub"><div class="gnb__sub-inner">');
    h.push('<h2 class="gnb__sub-title">' + esc(label) + '</h2>');
    h.push('<ul class="gnb__sub-list">');
    /* 운영은 '시스템 바로가기'가 링크 없는 중분류 제목(href="#")이고 그 아래 11종이 붙는다 */
    h.push('<li class="gnb__sub-item">');
    h.push('<a href="#" class="gnb__sub-link">' + esc(ADMIN_MENU_TITLE) + '</a>');
    h.push('<ul class="gnb__sub2-list">');
    ADMIN_MENU.forEach(function (m) {
      h.push('<li><a href="member-auth.html?targetSiteId=' + esc(m.id) + '">' + esc(m.t) + '</a></li>');
    });
    h.push('</ul></li>');
    /* [ISS-130] 업무지원시스템 통계의 개방처인 '빅데이터 플랫폼'으로 진입(로그인 시에만 노출 · 대민 공개 페이지라 본인인증 불필요) */
    h.push('<li class="gnb__sub-item">');
    h.push('<a href="bigdata-platform.html" class="gnb__sub-link">' + esc((currentLang() === 'en') ? 'Big Data Platform' : '빅데이터 플랫폼') + '</a>');
    h.push('</li>');
    h.push('</ul></div></div>');
    return h.join('');
  }

  function renderAdminGnb() {
    var gnb = document.querySelector('#gnb .gnb');
    if (!gnb) return;
    var exist = gnb.querySelector('.gnb__item--admin');
    if (!readAuth().loggedIn) {
      /* 로그아웃 시 항목째 제거 — 리스너도 노드와 함께 사라지므로 재로그인 시 중복 바인딩이 없다 */
      if (exist && exist.parentNode) exist.parentNode.removeChild(exist);
      return;
    }
    if (exist) return;
    var li = document.createElement('li');
    li.className = 'gnb__item gnb__item--admin';
    li.innerHTML = adminGnbHtml((currentLang() === 'en') ? 'Work Support System' : '업무지원시스템');
    gnb.appendChild(li);
    /* bindGnb() 는 inject() 시점의 항목만 훑는다. 뒤늦게 붙는 이 항목은 직접 바인딩한다. */
    bindGnbItem(li);
  }

  function setAuth(loggedIn, name) {
    var cur = readAuth();
    writeAuth({ loggedIn: !!loggedIn, name: (typeof name === 'string' && name) ? name : cur.name });
    renderAuthZone();
    /* storage 이벤트는 '다른 탭'에서만 발생한다. 같은 탭의 페이지 스크립트도
       상태 변화를 알 수 있도록 커스텀 이벤트를 쏜다. */
    try {
      var ev;
      if (typeof window.CustomEvent === 'function') ev = new CustomEvent('evax:auth', { detail: readAuth() });
      else { ev = document.createEvent('CustomEvent'); ev.initCustomEvent('evax:auth', false, false, readAuth()); }
      window.dispatchEvent(ev);
    } catch (e) {}
  }

  /* login.html 등 외부에서 호출 */
  window.EVAX_PROTO_AUTH = {
    get: function () { return readAuth(); },
    login: function (name) { setAuth(true, name); },
    logout: function () { setAuth(false); },
    render: renderAuthZone
  };

  function gnbHtml() {
    var M = window.EV_MENU || [];
    var h = ['<ul class="gnb">'];
    M.forEach(function (top) {
      h.push('<li class="gnb__item">');
      /* 드롭다운(메가메뉴)이 있음을 아래 방향 꺾쇠로 표시 — 가이드 p.234 구조 ⑦ */
      h.push('<a href="#" class="gnb__link">' + top.t +
        '<i class="svg-icon angle-down gnb__link-arrow" aria-hidden="true"></i></a>');
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

  /* 공식 배너(가이드 구조 ②)는 적용하지 않기로 했다 — 2026-09-22 사용자 결정.
     가이드에서도 서비스 판단에 맡기는 선택 요소다. 되살릴 때는 이 자리에
     .gov-banner 블록을 만들어 HEADER 앞에 붙이면 된다(krds-identity.css 에 스타일 유지). */

  /* 헤더 — 가이드 p.234 '구조' 그대로 3행으로 배치한다.
       행1 : ④ 유틸리티 링크 그룹  (언어 · 글자/화면 설정) — 우측 상단, 디바이더 구분
       행2 : ③ 서비스 아이덴티티(로고, 좌)  ⑥ 아이콘과 레이블(로그인·회원가입, 우)
       행3 : ⑦ 메인 메뉴 (전체 폭)
     DOM 은 모바일 슬라이드 패널(.header__nav)을 살리기 위해 최소로만 손대고,
     데스크톱 3행 배치는 krds-identity.css 의 grid 가 담당한다. */
  var HEADER =
    '<header class="header"> <div class="header__inner"> <div class="header__logo">' +
    ' <a href="index.html" class="header__logo-link">' +
    ' <img src="assets/images/common/logo-header.svg" alt="무공해차 통합누리집"> </a> </div>' +
    ' <button type="button" class="button button--icon button--borderless button--menu"' +
    ' aria-label="모바일 메뉴 열기" aria-haspopup="true" aria-expanded="false" aria-controls="mobile-menu">' +
    ' <i class="svg-icon menu" aria-hidden="true"></i> <span class="button__label">메뉴열기</span> </button>' +
    /* ⑥ 아이콘과 레이블 — 로그인 · 회원가입 (로고와 같은 행 우측) */
    ' <div class="header__member">__AUTH__</div>' +
    ' <div class="header__nav">' +
    /* ④ 유틸리티 링크 그룹 — 언어 · 글자/화면 설정 (우측 상단) */
    ' <div class="header__utility">' +
    /* 모바일 전용 사본 — 좁은 화면에서는 헤더에 자리가 없어 슬라이드 패널 쪽에 노출한다.
       CSS order 로 유틸(언어·글자크기) 아래 줄에 따로 놓는다. 데스크톱에서는 숨긴다. */
    ' <div class="header__member header__member--mobile">__AUTH__</div>' +
    ' <div class="dropdown dropdown--lang"> <div class="dropdown-selector">' +
    ' <button type="button" class="dropdown-selector__button" aria-haspopup="listbox" aria-expanded="false">' +
    ' <i class="svg-icon global" aria-hidden="true"></i>' +
    ' <span class="dropdown-selector__button-label">한국어</span>' +
    ' <i class="svg-icon angle-down" aria-hidden="true"></i> </button> </div>' +
    ' <div class="dropdown-container" role="listbox"> <ul class="dropdown-container__list">' +
    ' <li class="dropdown-container__item dropdown-container__item--selected">' +
    ' <button type="button" class="dropdown-container__button" role="option" aria-selected="true">' +
    ' <span class="dropdown-container__label">한국어</span> </button> </li>' +
    ' <li class="dropdown-container__item">' +
    ' <button type="button" class="dropdown-container__button" role="option" aria-selected="false">' +
    ' <span class="dropdown-container__label">ENGLISH</span> </button> </li> </ul> </div> </div>' +
    ' <div class="zoom-control">' +
    ' <button type="button" class="button button--xsmall button--zoom-plus" aria-label="글씨크기 크게">' +
    ' <span class="button__label">큰글씨</span> <i class="svg-icon zoom-plus" aria-hidden="true"></i> </button>' +
    ' <button type="button" class="button button--xsmall button--zoom-minus" aria-label="글씨크기 작게">' +
    ' <span class="button__label">글씨크기 작게</span> <i class="svg-icon zoom-minus" aria-hidden="true"></i> </button>' +
    ' </div>' +
    /* 메인 공지 팝업 다시 열기 — 운영 header.jsp 와 동일한 컴포넌트·위치
       (.header__utility 안 zoom-control 다음, button--xsmall button--link) */
    ' <button type="button" id="btnMainNoticeOpen" class="button button--xsmall button--link" aria-haspopup="dialog">' +
    ' <span class="button__label">POPUP</span> </button>' +
    ' </div>' +
    /* ⑦ 메인 메뉴 */
    /* ⑦ 메인 메뉴 + 사이트맵 버튼 — 운영 header.jsp 와 동일하게 nav 안에 둔다.
       좁은 화면에서는 style.css 가 숨기고 .button--menu(슬라이드 메뉴)가 그 역할을 한다. */
    ' <nav id="gnb" class="nav-gnb" aria-label="주요 메뉴">__GNB__' +
    ' <a href="sitemap.html" class="button button--xlarge button--icon button--borderless button--sitemap">' +
    ' <i class="svg-icon menu"></i>' +
    ' <span class="button__label">사이트맵</span> </a>' +
    ' </nav>' +
    ' </div> </div> </header>';

  /* 푸터 — 「디지털 정부 UI/UX 가이드라인」(25.8.) 컴포넌트/아이덴티티/푸터 배치 준수
     구조: 컨테이너 > 서비스 로고 > 연락처 > 유틸리티 링크 > 정책 링크 > 저작권 정보
     가이드 02: 로고·연락처·유틸리티 링크는 하나의 그룹으로 인지되도록 묶고,
                정책 링크와 저작권은 그 다음 순서로 분리해 제공한다. (색상·스타일은 기존 유지) */
  var FOOTER =
    '<footer class="footer">' +
    /* 관련 사이트 — 가이드 p.246 구조도 최상단 related_site 영역.
       기관 바로가기를 가로로 한 칸씩 나눠 배치한다. */
    ' <div class="footer__sites"> <div class="footer__sites-inner">' +
    ' <a href="http://www.mcee.go.kr/" target="_blank" rel="noopener" class="footer__site" title="기후에너지환경부 누리집으로 이동 (새창 열림)">' +
    ' <span class="footer__site-name">기후에너지환경부</span>' +
    ' <i class="svg-icon external-link" aria-hidden="true"></i>' +
    ' <span class="hidden">새창 열림</span> </a>' +
    ' <a href="https://www.keco.or.kr" target="_blank" rel="noopener" class="footer__site" title="한국환경공단 누리집으로 이동 (새창 열림)">' +
    ' <span class="footer__site-name">한국환경공단</span>' +
    ' <i class="svg-icon external-link" aria-hidden="true"></i>' +
    ' <span class="hidden">새창 열림</span> </a>' +
    ' <a href="http://www.aea.or.kr/" target="_blank" rel="noopener" class="footer__site" title="한국자동차환경협회 누리집으로 이동 (새창 열림)">' +
    ' <span class="footer__site-name">한국자동차환경협회</span>' +
    ' <i class="svg-icon external-link" aria-hidden="true"></i>' +
    ' <span class="hidden">새창 열림</span> </a>' +
    ' </div> </div>' +
    /* 그룹 1 — 서비스 로고 · 연락처 · 유틸리티 링크 */
    ' <div class="footer__top"> <div class="footer__inner">' +
    ' <div class="footer__info">' +
    ' <div class="footer__logo"> <img src="assets/images/common/logo-footer.svg" alt="무공해차 통합누리집 로고"> </div>' +
    ' <address class="footer__address">' +
    ' <p>[22689] 인천광역시 서해구 환경로 42(오류동 종합환경연구단지)</p>' +
    ' <p>대표전화 : (누리집콜센터) 1661-0970</p>' +
    ' <p>급속충전시설 이용관련문의 및 회원카드 발급문의 한국자동차환경협회 : 1661-9408</p>' +
    ' </address>' +
    ' </div>' +
    /* ④ 유틸리티 링크 — 가이드 p.246 구조도상 연락처 맞은편(우측). */
    ' <div class="footer__links">' +
    ' <nav class="footer__nav" aria-label="유틸리티 링크"> <ul class="footer__nav-list footer__nav-list--stack">' +
    ' <li class="footer__nav-item"><a href="sitemap.html" class="footer__nav-link">사이트맵</a></li>' +
    ' <li class="footer__nav-item"><a href="inquiry-complaint.html" class="footer__nav-link">불편민원신고센터</a></li>' +
    ' </ul> </nav>' +
    ' </div>' +
    ' </div> </div>' +
    /* 그룹 2 — 정책 링크 · 저작권 정보 */
    ' <div class="footer__bottom"> <div class="footer__inner">' +
    ' <nav class="footer__nav" aria-label="정책 링크"> <ul class="footer__nav-list">' +
    ' <li class="footer__nav-item"><a href="policy-privacy.html" class="footer__nav-link footer__nav-link--privacy">개인정보처리방침</a></li>' +
    ' <li class="footer__nav-item"><a href="#" class="footer__nav-link">이메일 무단수집거부</a></li>' +
    ' <li class="footer__nav-item"><a href="#" class="footer__nav-link">영상정보처리기기 운영관리지침</a></li>' +
    ' </ul> </nav>' +
    ' <p class="footer__copyright">Copyright 2026 KECO All Rights Reserved.</p>' +
    ' </div> </div>' +
    /* 구획 3 — 운영기관 식별자 (p.229 구조 / p.231 사용성 03 / p.232 접근성 01)
       푸터 내부의 가장 마지막 구획에 <section> 으로 둔다.
       로고는 서비스 로고가 아닌 운영 주체 기관 로고(p.230 사용성 02). */
    ' <section class="footer__identifier" aria-label="운영기관 식별자">' +
    ' <div class="footer__identifier-inner">' +
    ' <span class="footer__identifier-logo"><img src="assets/images/common/logo-keco.svg" alt=""></span>' +
    ' <div class="footer__identifier-body">' +
    ' <strong class="footer__identifier-name">한국환경공단</strong>' +
    ' <p class="footer__identifier-text">이 누리집은 한국환경공단에서 운영하는 누리집입니다.</p>' +
    ' </div>' +
    ' </div> </section>' +
    '</footer>';

  /* ------------------------------------------------------------
     메인 공지 팝업 (전 화면 공통)
     - 운영의 메인 팝업(#modalMainNotice)은 프로토에서 서버 콘텐츠가 없어 쓰지 않는다.
       대신 셸이 같은 컴포넌트로 공지 팝업을 제공해 어느 화면에서든 열 수 있게 한다.
     - 메인 화면에서는 진입 시 자동으로 뜨고, 「오늘 하루 열지 않기」를 누르면 그날은 뜨지 않는다.
       유틸의 「공지 팝업」 버튼으로는 언제든 다시 열 수 있다.
     - 스크롤 잠금은 팝업이 실제로 열려 있는 동안에만 건다(닫으면 반드시 해제).
     ------------------------------------------------------------ */
  var NOTICE_KEY = 'evax.proto.noticePopup.hideUntil';

  var NOTICE_POPUP =
    '<div class="modal-container" id="modalProtoNotice" role="dialog" aria-modal="true" aria-hidden="true" aria-labelledby="protoNoticeTitle">' +
    ' <div class="modal" tabindex="0" style="width: 620px">' +
    ' <div class="modal__header">' +
    ' <h1 class="modal__header-title" id="protoNoticeTitle">추석연휴 전기차 충전요금 할인정보 안내</h1>' +
    ' </div>' +
    ' <div class="modal__body">' +
    ' <div class="inner-cms">' +
    ' <p>추석연휴 기간 충전사업자(CPO)별 충전요금 추가할인 정보를 한곳에서 확인하실 수 있도록 ' +
    '「추석기간 전기차 충전요금 추가할인 알림」 게시판을 운영합니다.</p>' +
    ' <p>&nbsp;</p>' +
    ' <p>할인기간·시간, 할인요금(할인율), 적용 충전기 등 세부내용은 사업자마다 다르므로 ' +
    '충전 전에 게시글을 확인해 주시기 바랍니다.</p>' +
    ' </div>' +
    ' </div>' +
    ' <div class="modal__footer">' +
    ' <button type="button" class="button button--secondary" id="protoNoticeHide">' +
    ' <span class="button__label">오늘 하루 열지 않기</span> </button>' +
    ' <a href="notice-discount.html" class="button button--primary">' +
    ' <span class="button__label">게시판 바로가기</span> </a>' +
    ' </div>' +
    ' <div class="modal__close">' +
    ' <button type="button" class="button button--icon button--borderless button--close" title="팝업 닫기" id="protoNoticeClose">' +
    ' <i class="svg-icon close"></i> <span class="button__label">팝업닫기</span> </button>' +
    ' </div>' +
    ' </div> </div>';

  function noticeEl() { return document.getElementById('modalProtoNotice'); }

  function openNotice() {
    var el = noticeEl();
    if (!el) return;
    el.classList.add('is-active');
    el.setAttribute('aria-hidden', 'false');
    document.body.classList.add('no-scroll');
    var m = el.querySelector('.modal');
    if (m) { try { m.focus(); } catch (e) {} }
  }

  function closeNotice() {
    var el = noticeEl();
    if (!el) return;
    el.classList.remove('is-active');
    el.setAttribute('aria-hidden', 'true');
    /* 다른 모달이 열려 있지 않을 때만 스크롤 잠금을 푼다 */
    if (!document.querySelector('.modal-container.is-active')) {
      document.body.classList.remove('no-scroll');
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    }
  }

  function noticeHiddenToday() {
    try {
      var v = window.localStorage.getItem(NOTICE_KEY);
      return !!v && v === new Date().toISOString().slice(0, 10);
    } catch (e) { return false; }
  }

  function injectNoticePopup() {
    if (noticeEl()) return;
    var holder = document.createElement('div');
    holder.innerHTML = NOTICE_POPUP;
    var el = holder.firstChild;
    document.body.appendChild(el);   /* wrapper 밖 — 플로팅 규칙과 동일 */

    el.addEventListener('click', function (e) {
      if (e.target === el) closeNotice();                 /* 딤드 클릭 */
    });
    var btnClose = document.getElementById('protoNoticeClose');
    if (btnClose) btnClose.addEventListener('click', closeNotice);
    var btnHide = document.getElementById('protoNoticeHide');
    if (btnHide) btnHide.addEventListener('click', function () {
      try { window.localStorage.setItem(NOTICE_KEY, new Date().toISOString().slice(0, 10)); } catch (e) {}
      closeNotice();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && el.classList.contains('is-active')) closeNotice();
    });

    var opener = document.getElementById('btnMainNoticeOpen');
    if (opener) opener.addEventListener('click', openNotice);

    /* 메인 화면에서는 진입 시 자동 노출 */
    var isMain = /(^|\/)(index\.html)?(\?|#|$)/.test(location.pathname.split('/').pop() || 'index.html');
    if (isMain && !noticeHiddenToday()) setTimeout(openNotice, 600);
  }

  /* ------------------------------------------------------------
     메가메뉴 open/close
     퍼블 원본 style.css 가 기대하는 클래스는 gnb__item--active 다.
       24850: @media(min-width:1025px){ .gnb__item.gnb__item--active .gnb__sub{display:block} }
       24863: @media(max-width:64rem) { .gnb__item.gnb__item--active .gnb__sub{display:block} }
     ------------------------------------------------------------ */
  var GNB_ON = 'gnb__item--active';

  function gnbSet(li, on) {
    li.classList.toggle(GNB_ON, on);
    var a = li.querySelector('.gnb__link');
    if (a) a.setAttribute('aria-expanded', on ? 'true' : 'false');
  }

  /* 형제 닫기는 '그때그때 DOM 에서' 찾는다.
     로그인 시 뒤늦게 추가되는 .gnb__item--admin 도 대상에 포함되어야
     일반 메뉴 ↔ 업무지원시스템 사이에서 양방향으로 서로 닫힌다. */
  function gnbCloseOthers(keep) {
    var items = document.querySelectorAll('.gnb__item');
    Array.prototype.forEach.call(items, function (li) { if (li !== keep) gnbSet(li, false); });
  }

  /* 항목 1개 바인딩. 같은 노드에 두 번 걸리지 않도록 플래그로 막는다. */
  function bindGnbItem(li) {
    if (!li || li.getAttribute('data-gnb-bound') === '1') return;
    li.setAttribute('data-gnb-bound', '1');
    var a = li.querySelector('.gnb__link');
    if (a) {
      a.setAttribute('aria-haspopup', 'true');
      a.setAttribute('aria-expanded', 'false');
      a.addEventListener('click', function (e) {
        e.preventDefault();
        var wasOpen = li.classList.contains(GNB_ON);
        gnbCloseOthers(li);
        gnbSet(li, !wasOpen);
      });
    }
    li.addEventListener('mouseenter', function () { gnbCloseOthers(li); gnbSet(li, true); });
    li.addEventListener('mouseleave', function () { gnbSet(li, false); });
  }

  function bindGnb() {
    var items = document.querySelectorAll('.gnb__item');
    Array.prototype.forEach.call(items, bindGnbItem);
  }

  /* 헤더 로그아웃 링크: 이동 없이 상태만 해제 */
  function bindAuthZone() {
    var util = document.querySelector('.header__utility');
    if (!util) return;
    util.addEventListener('click', function (e) {
      var a = e.target.closest ? e.target.closest('.utility-menu__link[data-i18n="header.logout"]') : null;
      if (!a) return;
      e.preventDefault();
      setAuth(false);
    });
  }

  /* ------------------------------------------------------------
     프로토타입 전용 로그인 전환 바 (우하단 · 실서비스에 없는 요소)
     ------------------------------------------------------------ */
  function injectAuthbarCss() {
    if (document.getElementById('proto-authbar-css')) return;
    var link = document.createElement('link');
    link.id = 'proto-authbar-css';
    link.rel = 'stylesheet';
    link.href = 'assets/css/proto-authbar.css?v=' + CACHE_V;
    document.head.appendChild(link);
  }

  function buildAuthbar() {
    if (document.getElementById('protoAuthbar')) return;
    var auth = readAuth();
    var box = document.createElement('div');
    box.id = 'protoAuthbar';
    box.className = 'proto-authbar proto-authbar--collapsed';
    box.innerHTML =
      '<button type="button" class="proto-authbar__tab" aria-expanded="false" aria-controls="protoAuthbarPanel">' +
      '<span class="proto-authbar__badge">PROTO</span><span class="proto-authbar__tab-label">로그인 전환</span></button>' +
      '<div class="proto-authbar__panel" id="protoAuthbarPanel">' +
      '<div class="proto-authbar__head"><span class="proto-authbar__badge">PROTO</span>' +
      '<strong class="proto-authbar__state">로그아웃 상태</strong>' +
      '<button type="button" class="proto-authbar__close" aria-label="전환바 접기">×</button></div>' +
      '<div class="proto-authbar__row"><label class="proto-authbar__label" for="protoAuthbarName">이름</label>' +
      '<input type="text" id="protoAuthbarName" class="proto-authbar__input" value="' + esc(auth.name) + '"></div>' +
      '<button type="button" class="proto-authbar__toggle">로그인 상태로</button>' +
      '<p class="proto-authbar__note">화면 시연용 · 실 서비스에는 없는 요소입니다.</p>' +
      '</div>';
    document.body.appendChild(box);

    var tab = box.querySelector('.proto-authbar__tab');
    var closeBtn = box.querySelector('.proto-authbar__close');
    var nameInput = box.querySelector('.proto-authbar__input');
    var toggleBtn = box.querySelector('.proto-authbar__toggle');

    function setOpen(open) {
      box.classList.toggle('proto-authbar--collapsed', !open);
      tab.setAttribute('aria-expanded', open ? 'true' : 'false');
    }
    tab.addEventListener('click', function () { setOpen(box.classList.contains('proto-authbar--collapsed')); });
    closeBtn.addEventListener('click', function () { setOpen(false); });

    toggleBtn.addEventListener('click', function () {
      var cur = readAuth();
      setAuth(!cur.loggedIn, nameInput.value.trim() || DEFAULT_NAME);
    });
    nameInput.addEventListener('input', function () {
      var cur = readAuth();
      setAuth(cur.loggedIn, nameInput.value.trim() || DEFAULT_NAME);
    });

    syncAuthbar();
  }

  function syncAuthbar() {
    var box = document.getElementById('protoAuthbar');
    if (!box) return;
    var auth = readAuth();
    box.classList.toggle('proto-authbar--on', auth.loggedIn);
    var state = box.querySelector('.proto-authbar__state');
    var toggleBtn = box.querySelector('.proto-authbar__toggle');
    if (state) state.textContent = auth.loggedIn ? (auth.name + '님 로그인') : '로그아웃 상태';
    if (toggleBtn) toggleBtn.textContent = auth.loggedIn ? '로그아웃 상태로' : '로그인 상태로';
  }

  /* ------------------------------------------------------------
     운영 본문 래퍼 복원 (header.jsp 29~33·290 + footer.jsp 4~5·54)

       body
        ├ .skip-accessibility            ← 건너뛰기 링크(header.jsp 29~32)
        ├ .wrapper                       ← header.jsp 33 ~ footer.jsp 54
        │   ├ header.header
        │   ├ main#main.container        ← header.jsp 290 ~ footer.jsp 4
        │   └ footer.footer
        └ (푸터 뒤 script · 플로팅 · proto-authbar)  ← wrapper 바깥

     왜 필요한가
       1) style.css .container{overflow:hidden} 이 page-header__inner::after
          (width:50vw; left:calc(100% + 40px)) 장식을 잘라준다. 래퍼가 없으면
          그 장식이 body 를 넘쳐 전 페이지에 가로 스크롤(+680px)이 생긴다.
       2) <main> 랜드마크·건너뛰기 링크가 없으면 KWCAG 항목에서 걸린다.

     주의
       - wrapper/main 에 transform·filter·will-change 를 절대 넣지 말 것.
         넣는 순간 position:fixed 의 기준이 바뀌어 모달(.modal-container)·
         플로팅·proto-authbar 가 전부 어긋난다.
       - 플로팅/프로토 전용 UI 는 wrapper 바깥에 둔다
         (footer.jsp:56 "접근성 및 레이아웃 안정성을 위해 footer/wrapper 외부로 이동").
     ------------------------------------------------------------ */
  /* 구조 ① 건너뛰기 링크 — p.234 / p.245 접근성 01
     공식 배너보다 앞(문서 최상단)에 둔다. 평소에는 화면에서 감춰 두고
     키보드 Tab 으로 포커스가 닿는 순간 최상단 띠로 나타난다. */
  var SKIP_HTML =
    '<div class="skip-accessibility">' +
    '<a href="#main" class="skip-accessibility__link" data-i18n="header.skip">본문 바로가기</a>' +
    '<a href="#gnb" class="skip-accessibility__link" data-i18n="header.skipGnb">주요 메뉴 바로가기</a>' +
    '</div>';

  function injectSkipLinks() {
    if (document.querySelector('.skip-accessibility')) return;   /* 재실행 안전 */
    var holder = document.createElement('div');
    holder.innerHTML = SKIP_HTML;
    var skip = holder.firstChild;
    translateIfEn(skip);
    document.body.insertBefore(skip, document.body.firstChild);
  }

  function fireResize() {
    /* echarts·ag-Grid·openlayers 처럼 크기를 재서 그리는 컴포넌트 재계산 */
    var ev;
    try {
      ev = new Event('resize');
    } catch (e) {
      ev = document.createEvent('Event');
      ev.initEvent('resize', true, false);
    }
    window.dispatchEvent(ev);
  }

  function wrapMain() {
    if (document.querySelector('main#main')) return;             /* 재실행 안전 */
    var header = document.querySelector('body > header.header');
    var footer = document.querySelector('body > footer.footer');
    if (!header || !footer) return;

    /* 헤더~푸터 사이 body 직계 노드를 순서 그대로 수집한다.
       본문 div 뿐 아니라 인라인 <script>(script#pageInfo 등 데이터 홀더 포함)·
       <form>·주석·텍스트 노드까지 함께 옮겨야 페이지 스크립트 순서가 유지된다.
       (이미 실행된 script 는 재삽입해도 다시 실행되지 않는다 — already started 플래그)

       예외: <link>/<style> 은 옮기지 않고 body 직계에 그대로 둔다.
       재삽입하면 스타일시트가 다시 로드되기 때문. head 뒤라는 문서 순서가
       바뀌지 않으므로 캐스케이드는 그대로다. */
    var moving = [];
    for (var n = header.nextSibling; n && n !== footer; n = n.nextSibling) {
      if (n.nodeType === 1 && (n.tagName === 'LINK' || n.tagName === 'STYLE')) continue;
      moving.push(n);
    }

    var wrapper = document.createElement('div');
    wrapper.className = 'wrapper';
    var banner = document.querySelector('body > .gov-banner');
    document.body.insertBefore(wrapper, banner || header);
    if (banner) wrapper.appendChild(banner);   /* 공식 배너도 래퍼 안, 헤더 앞 */

    var main = document.createElement('main');
    main.id = 'main';
    main.className = 'container';
    main.setAttribute('aria-label', currentLang() === 'en' ? 'Main content' : '본문');
    main.setAttribute('data-i18n-aria-label', 'header.mainAria');

    wrapper.appendChild(header);
    wrapper.appendChild(main);
    for (var i = 0; i < moving.length; i++) main.appendChild(moving[i]);
    wrapper.appendChild(footer);

    fireResize();
  }

  /* 가이드라인 보완 스타일(공식 배너·유틸리티 디바이더·운영기관 식별자)을
     전 화면 공통으로 적용한다. 각 HTML 을 고치지 않고 셸이 주입한다. */
  function injectIdentityCss() {
    if (document.getElementById('krds-identity-css')) return;
    var l = document.createElement('link');
    l.id = 'krds-identity-css';
    l.rel = 'stylesheet';
    l.href = 'assets/css/krds-identity.css?v=' + CACHE_V;
    document.head.appendChild(l);
  }

  function inject() {
    injectIdentityCss();
    var h = document.getElementById('header-slot');
    if (h) h.outerHTML = HEADER.replace('__GNB__', gnbHtml())
      .split('__AUTH__').join(authZoneHtml(readAuth()));
    var f = document.getElementById('footer-slot');
    if (f) f.outerHTML = FOOTER;

    injectSkipLinks();
    wrapMain();

    bindGnb();
    /* 로그인 상태로 '새로고침' 했을 때도 업무지원시스템 항목이 나와야 한다.
       (기존에는 renderAuthZone() 경유 — PROTO 토글로 전환할 때만 붙었다) */
    renderAdminGnb();
    bindAuthZone();
    injectAuthbarCss();
    buildAuthbar();
    injectNoticePopup();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', inject);
  else inject();
})();
