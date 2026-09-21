/* ============================================================
   [EVAX 프로토타입 v1.01] 공통 셸
   - 헤더/푸터: 2026-08-20 운영(ev.or.kr) 라이브 HTML 그대로
   - GNB: menu-data.js(운영 실측 메뉴)로 생성
   ============================================================ */
(function () {
  'use strict';

  var CACHE_V = '20260827a';

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
    var util = document.querySelector('.header__utility');
    if (!util) return;
    var old = util.querySelectorAll('.user-profile, .utility-menu');
    Array.prototype.forEach.call(old, function (n) { n.parentNode.removeChild(n); });

    var holder = document.createElement('div');
    holder.innerHTML = authZoneHtml(readAuth());
    translateIfEn(holder);

    var anchor = util.querySelector('.zoom-control');
    while (holder.firstChild) {
      var node = holder.removeChild(holder.firstChild);
      if (anchor) util.insertBefore(node, anchor); else util.appendChild(node);
    }
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
    var h = ['<a href="#" class="gnb__link">' + esc(label) + '</a>'];
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
    ' <div class="header__nav"> <div class="header__utility">' +
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
    '__AUTH__' +
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
  var SKIP_HTML =
    '<div class="skip-accessibility">' +
    '<a href="#gnb" class="skip-accessibility__link" data-i18n="header.skipGnb">주요 메뉴 바로가기</a>' +
    '<a href="#main" class="skip-accessibility__link" data-i18n="header.skip">본문 바로가기</a>' +
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
    document.body.insertBefore(wrapper, header);

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

  function inject() {
    var h = document.getElementById('header-slot');
    if (h) h.outerHTML = HEADER.replace('__GNB__', gnbHtml()).replace('__AUTH__', authZoneHtml(readAuth()));
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
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', inject);
  else inject();
})();
