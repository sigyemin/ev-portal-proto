/* admin-partials.js — 관리자 포털 사이드바·상단바 자동 inject */
(function () {
  if (window.AdmPartialsLoaded) return;
  window.AdmPartialsLoaded = true;

  var ICON = {
    dashboard: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>',
    chart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>',
    money: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>',
    bolt: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>',
    users: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
    inbox: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>',
    cms: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>',
    bell: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>',
    cog: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>'
  };

  var NAV = [
    { group: '대시보드', items: [
      { label: '업무 메인 대시보드', href: 'index.html', icon: 'dashboard', key: 'dashboard' },
      { label: 'KPI 모니터링', href: 'kpi.html', icon: 'chart', key: 'kpi' }
    ]},
    { group: '업무 관리', items: [
      { label: '보조금 관리', href: 'subsidy.html', icon: 'money', key: 'subsidy', badge: '142' },
      { label: '충전인프라 관리', href: 'infra.html', icon: 'bolt', key: 'infra' }
    ]},
    { group: '고객·회원', items: [
      { label: '민원 처리', href: 'complaint.html', icon: 'inbox', key: 'complaint', badge: '28' },
      { label: '회원·권한 관리', href: 'members.html', icon: 'users', key: 'members' }
    ]},
    { group: '운영', items: [
      { label: '콘텐츠 관리', href: 'cms.html', icon: 'cms', key: 'cms' }
    ]}
  ];

  var current = (window.__admActive || 'dashboard');

  function renderSide() {
    var groups = NAV.map(function (g) {
      var items = g.items.map(function (it) {
        var active = it.key === current ? ' active' : '';
        var badge = it.badge ? '<span class="adm-side-badge">' + it.badge + '</span>' : '';
        return '<a class="adm-side-link' + active + '" href="' + it.href + '">' + ICON[it.icon] + '<span>' + it.label + '</span>' + badge + '</a>';
      }).join('');
      return '<div class="adm-side-group"><div class="adm-side-group-label">' + g.group + '</div>' + items + '</div>';
    }).join('');
    return '<aside class="adm-side">'
      + '<div class="adm-side-brand">'
        + '<div class="adm-side-brand-logo">EV</div>'
        + '<div class="adm-side-brand-text">관리자 포털<small>무공해차 통합누리집</small></div>'
      + '</div>'
      + '<nav class="adm-side-nav">' + groups + '</nav>'
      + '<div class="adm-side-foot">'
        + '<div class="adm-side-user">'
          + '<div class="adm-side-user-avatar">김</div>'
          + '<div class="adm-side-user-info"><strong>김환경</strong><small>한국환경공단 · 보조금팀</small></div>'
        + '</div>'
        + '<a href="../login.html" class="adm-side-logout">로그아웃</a>'
      + '</div>'
    + '</aside>';
  }

  function renderTop() {
    return '<header class="adm-topbar">'
      + '<div class="adm-topbar-search">' + ICON.search + '<input type="text" placeholder="민원·회원·신청 통합 검색"></div>'
      + '<div class="adm-topbar-actions">'
        + '<button class="adm-icon-btn" aria-label="알림">' + ICON.bell + '<span class="adm-dot"></span></button>'
        + '<button class="adm-icon-btn" aria-label="설정">' + ICON.cog + '</button>'
      + '</div>'
    + '</header>';
  }

  // body에 .adm-shell 컨테이너가 있을 때만 inject
  document.addEventListener('DOMContentLoaded', function () {
    var sideSlot = document.getElementById('adm-side-slot');
    var topSlot = document.getElementById('adm-top-slot');
    if (sideSlot) sideSlot.outerHTML = renderSide();
    if (topSlot) topSlot.outerHTML = renderTop();
  });
})();
