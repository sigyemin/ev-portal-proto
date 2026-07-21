/* ============================================================================
   EV 업무포털 — 관리자 공통 셸 v3 (v0.30 7호 · 공식 퍼블 리스킨)
   마크업을 업무지원시스템 표준 퍼블(_pub-src) 구조로 교체 — #5d87ff 블루 · BEM.
     · 상단 유틸바 : 로고 + 시스템 전환 드롭다운(.dropdown) + 유틸메뉴(세션타이머·권한전환·마이페이지·통합누리집 새창)
     · GNB        : pub .gnb__item + hover .submenu (header--open 메가패널) — admin-menu-*.js 데이터 그대로
     · 좌측 사이드 : 유지(.adm-side) — pub 톤 리스킨은 admin-shell.css
   ★기능·메뉴 데이터 불변, 스킨만 교체. 기존 mount 옵션 그대로:
   AdminShell.mount({
     system,                      // 유틸바 시스템 드롭다운 활성 표시 + (구)배지
     gnb, activeGnb, activeHref,  // GNB(LV1)+좌측 트리 — {label, children, href, badge}
     side,                        // GNB 없이 좌측 트리만
     roles,                       // 역할 전환 [{key,label,side:[...]}] — 권한전환 유틸과 연결
     siteTabs, activeSite,        // 사이트 탭 [{key,label,side:[...]}] — GNB 자리에 사이트 렌더
     menu                         // (구형) 그룹 메뉴 — 1호 호환
   })
   ============================================================================ */
window.AdminShell = (function () {
  'use strict';
  function esc(s){ return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }

  // ── 시스템 전환 드롭다운 항목(각 셸 첫 화면) — biz-portal 관문 타일과 병행 진입 ──
  var SYSTEMS = [
    { key:'portal', label:'무공해차 통합누리집', href:'index.html' },
    { key:'ntp',    label:'통합관리시스템',      href:'admin-board-qna.html' },
    { key:'ps',     label:'구매보조금 신청',     href:'admin-ps-option.html' },
    { key:'ssd',    label:'완속·브랜드',         href:'admin-ssd-contest.html?tab=busi' },
    { key:'infra',  label:'충전인프라',          href:'admin-infra-status.html' },
    { key:'policy', label:'정책지원(의무구매임차제·보급목표제·표지발급)', href:'admin-cp-vhcrate.html' }
  ];
  // opts.system 문자열 → 드롭다운 활성 라벨
  var SYS_MATCH = {
    '통합관리시스템':'ntp', '구매보조금 지원시스템':'ps', '완속·브랜드 시스템':'ssd',
    '충전인프라 시스템':'infra', '정책지원 시스템':'policy'
  };

  // ── 좌측 사이드 트리 렌더(2뎁스 직접 · 3뎁스 그룹 라벨+링크) ──
  function leafLink(m, activeHref){
    if (m.href){
      return '<a href="' + esc(m.href) + '"' + (m.href===activeHref ? ' class="active"' : '') + '>' + esc(m.label)
        + (m.badge ? ' <span class="new-badge">' + esc(m.badge) + '</span>' : '') + '</a>';
    }
    return '<a href="#" class="stub" onclick="return false;">' + esc(m.label) + '<span class="soon">준비 중</span></a>';
  }
  function childrenOf(g){ return g.children || g.side || []; }
  function sideHTML(children, activeHref){
    if (!children) return '';
    return children.map(function(c){
      if (c.children && c.children.length){
        return '<div class="grp">' + esc(c.label) + '</div>' + c.children.map(function(m){ return leafLink(m, activeHref); }).join('');
      }
      return leafLink(c, activeHref);
    }).join('');
  }

  // ── GNB submenu(메가패널 컬럼) 렌더 — 2뎁스 직접 · 3뎁스 그룹 라벨+하위 링크 ──
  function submenuLink(m, activeHref){
    if (m.href){
      return '<li class="submenu__item' + (m.href===activeHref ? ' submenu__item--current' : '') + '">'
        + '<a href="' + esc(m.href) + '" class="submenu__link">' + esc(m.label)
        + (m.badge ? ' <span class="new-badge">' + esc(m.badge) + '</span>' : '') + '</a></li>';
    }
    return '<li class="submenu__item"><a href="#" class="submenu__link submenu__link--stub" onclick="return false;">' + esc(m.label) + '</a></li>';
  }
  function submenuHTML(children, activeHref){
    if (!children) return '';
    // [ISS-011] 메가패널은 LV2(상위 그룹·주요 메뉴)만 요약 노출 — LV3 상세는 패널에서 생략하고
    // 좌측 사이드 트리에서 노출(현행 통합관리 방식). 트리 데이터(admin-menu-*.js)는 변경하지 않음.
    return children.map(function(c){ return submenuLink(c, activeHref); }).join('');
  }

  function mount(opts){
    opts = opts || {};

    // 모드·GNB 그룹 결정 --------------------------------------------------------
    var mode, groups;
    if (opts.gnb && opts.gnb.length){ mode='gnb'; groups=opts.gnb; }
    else if (opts.siteTabs && opts.siteTabs.length){ mode='site'; groups=opts.siteTabs; }
    else if (opts.roles && opts.roles.length){ mode='role'; groups=null; }   // GNB=역할 메뉴(가변) → 아래서 세팅
    else if (opts.side && opts.side.length){ mode='side'; groups=opts.side; }
    else { mode='none'; groups=[]; }

    // 활성 시스템(드롭다운) ----------------------------------------------------
    var curSysKey = SYS_MATCH[opts.system] || '';
    var sysLabel = '';
    for (var i=0;i<SYSTEMS.length;i++) if (SYSTEMS[i].key===curSysKey) sysLabel = SYSTEMS[i].label;
    if (!sysLabel) sysLabel = opts.system || '시스템 선택';

    var sysItems = SYSTEMS.map(function(s){
      return '<li class="dropdown-container__item">'
        + '<a href="' + esc(s.href) + '" class="dropdown-container__button' + (s.key===curSysKey ? ' is-current' : '') + '">'
        + '<span class="dropdown-container__text">' + esc(s.label) + '</span></a></li>';
    }).join('');

    // GNB 아이템 --------------------------------------------------------------
    var activeIdx = -1;
    var gnbGroups = groups;
    if (mode==='role'){ gnbGroups = (opts.roles[0].side || []); }
    function gnbItemsHTML(gs){
      return gs.map(function(g, idx){
        var isActive = false;
        if (mode==='gnb') isActive = (g.label===opts.activeGnb);
        else if (mode==='site') isActive = (g.key===opts.activeSite);
        if (isActive) activeIdx = idx;
        var kids = childrenOf(g);
        return '<li class="gnb__item' + (isActive ? ' gnb__item--current' : '') + '" data-nav="' + idx + '">'
          + '<a href="#" class="gnb__link">' + esc(g.label) + '</a>'
          + (kids.length ? '<ul class="submenu">' + submenuHTML(kids, opts.activeHref) + '</ul>' : '')
          + '</li>';
      }).join('');
    }

    var header =
      '<div id="admShellHeader"><header class="header"><div class="header-wrapper">'
        + '<div class="header__utility"><div class="header__inner">'
          + '<div class="utility-dropdown">'
            + '<h1 class="header__logo"><span class="blind">EV 업무포털</span></h1>'
            + '<div class="dropdown" id="admSysDropdown"><div class="dropdown-selector">'
              + '<button type="button" class="dropdown-selector__button"><span class="dropdown-selector__button-text">' + esc(sysLabel) + '</span><i class="dropdown-selector__button-icon"></i></button>'
            + '</div><div class="dropdown-container"><ul class="dropdown-container__list">' + sysItems + '</ul></div></div>'
          + '</div>'
          + '<div class="utility-menu">'
            + '<span class="utility-menu__text"><span id="admTimer">59:59</span><button type="button" class="utility-menu__button" id="admExtend">연장</button></span>'
            + '<span class="utility-menu__text">관리자님</span>'
            + '<a href="#" class="utility-menu__link" id="admRoleSwitch">권한전환</a>'
            + '<a href="#" class="utility-menu__link" id="admMypage">마이페이지</a>'
            + '<a href="index.html" target="_blank" title="새창열림" class="utility-menu__shortcut">무공해차 통합누리집</a>'
          + '</div>'
        + '</div></div>'
        + '<div class="header__nav"><nav class="nav-gnb"><ul class="gnb" id="admGnb">' + gnbItemsHTML(gnbGroups) + '</ul></nav></div>'
      + '</div></header></div>';

    document.body.insertAdjacentHTML('afterbegin', header);

    var side = document.getElementById('admSide');
    var gnbEl = document.getElementById('admGnb');

    // ── 좌측 사이드 초기 렌더 + GNB 클릭 동작(모드별) ──
    if (side){
      if (mode==='gnb'){
        var current = opts.activeGnb || opts.gnb[0].label;
        var renderSide = function(){
          var sec=null; for (var i=0;i<opts.gnb.length;i++) if (opts.gnb[i].label===current){ sec=opts.gnb[i]; break; }
          side.innerHTML = sideHTML(sec ? sec.children : [], opts.activeHref);
        };
        renderSide();
        gnbEl.addEventListener('click', function(e){
          var lk=e.target.closest('.gnb__link'); if(!lk) return; e.preventDefault();
          var li=lk.closest('.gnb__item'); var idx=+li.dataset.nav; current=opts.gnb[idx].label;
          gnbEl.querySelectorAll('.gnb__item').forEach(function(x){ x.classList.toggle('gnb__item--current', x===li); });
          renderSide();
        });
      }
      else if (mode==='site'){
        var curSite=null;
        for (var s2=0;s2<opts.siteTabs.length;s2++) if (opts.siteTabs[s2].key===opts.activeSite) curSite=opts.siteTabs[s2];
        if (!curSite) curSite=opts.siteTabs[0];
        var drawSite=function(){ side.innerHTML = sideHTML(curSite.side, opts.activeHref); };
        drawSite();
        gnbEl.addEventListener('click', function(e){
          var lk=e.target.closest('.gnb__link'); if(!lk) return; e.preventDefault();
          var li=lk.closest('.gnb__item'); var idx=+li.dataset.nav; curSite=opts.siteTabs[idx];
          gnbEl.querySelectorAll('.gnb__item').forEach(function(x){ x.classList.toggle('gnb__item--current', x===li); });
          drawSite();
        });
      }
      else if (mode==='role'){
        var cur=opts.roles[0];
        var bar=document.createElement('div'); bar.className='adm-role';
        bar.innerHTML='<span class="lb">역할</span>' + opts.roles.map(function(r,i){
          return '<button type="button" data-role="'+esc(r.key)+'"'+(i===0?' class="active"':'')+'>'+esc(r.label)+'</button>';
        }).join('');
        var tree=document.createElement('div');
        side.appendChild(bar); side.appendChild(tree);
        var drawRole=function(){
          tree.innerHTML = sideHTML(cur.side, opts.activeHref);
          if (gnbEl) gnbEl.innerHTML = gnbItemsHTML(cur.side || []);  // GNB도 현재 역할 메뉴로 동기화
          wireGnbHover();
        };
        var setRole=function(key){
          for (var i=0;i<opts.roles.length;i++) if (opts.roles[i].key===key) cur=opts.roles[i];
          bar.querySelectorAll('button').forEach(function(x){ x.classList.toggle('active', x.dataset.role===cur.key); });
          drawRole();
          if (window.__admToast) __admToast(cur.label + ' 메뉴로 전환했습니다. (프로토타입 — 권한은 더미)');
        };
        bar.addEventListener('click', function(e){ var b=e.target.closest('button[data-role]'); if(!b) return; setRole(b.dataset.role); });
        drawRole();
        // 유틸바 '권한전환' → 다음 역할로 순환
        AdminShell.__nextRole = function(){
          var idx=0; for (var i=0;i<opts.roles.length;i++) if (opts.roles[i].key===cur.key) idx=i;
          setRole(opts.roles[(idx+1)%opts.roles.length].key);
        };
      }
      else if (mode==='side'){ side.innerHTML = sideHTML(opts.side, opts.activeHref); }
      else if (opts.menu){
        side.innerHTML = opts.menu.map(function(g){
          return '<div class="grp">'+esc(g.group)+'</div>'
            + g.items.map(function(m){
                if (m.stub) return '<a href="#" class="stub" onclick="return false;">'+esc(m.label)+'<span class="soon">준비 중</span></a>';
                return '<a href="'+esc(m.href||'#')+'"'+(m.active?' class="active"':'')+'>'+esc(m.label)+'</a>';
              }).join('');
        }).join('');
      }
    }

    // ── 인터랙션: 드롭다운 · GNB 호버 · 세션타이머 · 유틸 링크 ──
    wireDropdown();
    wireGnbHover();
    wireTimer();
    var roleLink=document.getElementById('admRoleSwitch');
    if (roleLink) roleLink.addEventListener('click', function(e){
      e.preventDefault();
      if (mode==='role' && AdminShell.__nextRole) AdminShell.__nextRole();
      else if (window.__admToast) __admToast('권한전환은 프로토타입에서 동작하지 않습니다.');
    });
    var mypage=document.getElementById('admMypage');
    if (mypage) mypage.addEventListener('click', function(e){ e.preventDefault(); if(window.__admToast) __admToast('마이페이지는 프로토타입에서 동작하지 않습니다.'); });
  }

  // 시스템 전환 드롭다운 토글(pub 동작)
  function wireDropdown(){
    var dd=document.getElementById('admSysDropdown'); if(!dd) return;
    var btn=dd.querySelector('.dropdown-selector__button');
    btn.addEventListener('click', function(e){ dd.classList.toggle('dropdown--open'); e.stopPropagation(); });
    document.addEventListener('click', function(e){ if(!dd.contains(e.target)) dd.classList.remove('dropdown--open'); });
  }

  // GNB 호버 메가패널(pub 동작) — header--open + gnb__item--active
  function wireGnbHover(){
    var header=document.querySelector('#admShellHeader .header');
    var gnb=document.getElementById('admGnb');
    if(!header || !gnb) return;
    if(!header.__wired){
      gnb.addEventListener('mouseenter', function(){ header.classList.add('header--open'); });
      header.addEventListener('mouseleave', function(){
        header.classList.remove('header--open');
        gnb.querySelectorAll('.gnb__item').forEach(function(it){ it.classList.remove('gnb__item--active'); });
      });
      header.__wired = true;
    }
    gnb.querySelectorAll('.gnb__item').forEach(function(it){
      if(it.__wired) return; it.__wired=true;
      it.addEventListener('mouseenter', function(){ this.classList.add('gnb__item--active'); });
      it.addEventListener('mouseleave', function(){ this.classList.remove('gnb__item--active'); });
    });
  }

  // 세션 타이머(더미 카운트다운 59:59 → 연장 시 리셋)
  function wireTimer(){
    var el=document.getElementById('admTimer'), ext=document.getElementById('admExtend');
    if(!el) return;
    var sec=59*60+59;
    function tick(){ if(sec>0) sec--; var m=(sec/60)|0, s=sec%60; el.textContent=(m<10?'0':'')+m+':'+(s<10?'0':'')+s; }
    el.__t = setInterval(tick, 1000);
    if(ext) ext.addEventListener('click', function(){ sec=59*60+59; tick(); if(window.__admToast) __admToast('세션 시간을 연장했습니다. (프로토타입 · 59:59로 초기화)'); });
  }

  // 간이 토스트(관리자 셸 자체)
  window.__admToast = function(msg){
    var el=document.createElement('div');
    el.setAttribute('role','status'); el.setAttribute('aria-live','polite');
    el.style.cssText='position:fixed;left:50%;bottom:28px;transform:translateX(-50%);background:#081419;color:#fff;padding:10px 18px;border-radius:10px;font-size:13px;font-weight:600;z-index:9999;box-shadow:0 8px 24px rgba(0,0,0,.25);';
    el.textContent=msg; document.body.appendChild(el);
    setTimeout(function(){ el.remove(); }, 2200);
  };

  return { mount: mount };
})();
