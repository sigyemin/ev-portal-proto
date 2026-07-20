/* ============================================================================
   EV 업무포털 — 관리자 공통 셸 (v0.30 · 2호에서 GNB+트리 확장)
   AdminShell.mount({
     system,                      // 상단바 시스템명 배지
     gnb, activeGnb, activeHref,  // GNB(LV1 8개)+좌측 2~3뎁스 트리 — js/admin-menu-ntp.js 구조({label, children, href, badge})
     side,                        // GNB 없이 좌측 트리만 쓸 때(4호 완속·브랜드) — gnb와 동일 구조 배열
     roles,                       // 역할 전환 토글 [{key, label, side:[...]}] — 선택 시 좌측 트리 교체(더미)
     siteTabs, activeSite,        // 사이트 탭(5호 충전인프라) [{key, label, side:[...]}] — 상단 탭 전환 시 좌측 트리 전면 교체
     menu                         // (구형) [{group, items:[{label, href, active, stub}]}] — 1호 호환
   })
   - 상단바: "EV 업무포털" + 시스템명 + 우측 "관리자님 | 로그아웃"(더미)
   - GNB 클릭 → 좌측 트리 전환(스텁 항목='준비 중' 클릭 무동작 · href 있는 항목만 실링크)
   - 대민 partials 미사용 — 별도 시스템. 메뉴 데이터 구조는 타 시스템 셸(구매보조금 등) 재사용 예정.
   ============================================================================ */
window.AdminShell = (function () {
  'use strict';
  function esc(s){ return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }

  function leafLink(m, activeHref){
    if (m.href){
      return '<a href="' + esc(m.href) + '"' + (m.href===activeHref ? ' class="active"' : '') + '>' + esc(m.label)
        + (m.badge ? ' <span class="new-badge">' + esc(m.badge) + '</span>' : '') + '</a>';
    }
    return '<a href="#" class="stub" onclick="return false;">' + esc(m.label) + '<span class="soon">준비 중</span></a>';
  }

  function sideHTML(section, activeHref){
    if (!section || !section.children) return '';
    return section.children.map(function(c){
      if (c.children && c.children.length){
        return '<div class="grp">' + esc(c.label) + '</div>' + c.children.map(function(m){ return leafLink(m, activeHref); }).join('');
      }
      return leafLink(c, activeHref);
    }).join('');
  }

  function mount(opts){
    opts = opts || {};
    // 상단바
    var top = '<header class="adm-top">'
      + '<div class="brand"><a href="biz-portal.html" style="display:flex;align-items:center;gap:10px;"><span class="logo">EV</span> EV 업무포털</a>'
      + (opts.system ? '<span class="sysname">' + esc(opts.system) + '</span>' : '')
      + '</div>'
      + '<div class="user">관리자님 <a href="#" class="logout" onclick="if(window.__admToast)__admToast(\'로그아웃은 프로토타입에서 동작하지 않습니다.\');return false;">로그아웃</a></div>'
      + '</header>';

    // 사이트 탭 (5호 충전인프라 — 급속·분석 / 수소) : GNB 자리에 사이트 탭 렌더
    var gnbBar = '';
    if (opts.siteTabs && opts.siteTabs.length){
      gnbBar = '<nav class="adm-gnb" aria-label="사이트 선택">'
        + opts.siteTabs.map(function(s){
          return '<button type="button" data-site="' + esc(s.key) + '"' + (s.key===opts.activeSite ? ' class="active"' : '') + '>' + esc(s.label) + '</button>';
        }).join('')
        + '</nav>';
    }
    // GNB (LV1) — 클릭 시 좌측 트리 전환
    else if (opts.gnb && opts.gnb.length){
      gnbBar = '<nav class="adm-gnb" aria-label="시스템 GNB">'
        + opts.gnb.map(function(g){
          return '<button type="button" data-gnb="' + esc(g.label) + '"' + (g.label===opts.activeGnb ? ' class="active"' : '') + '>' + esc(g.label) + '</button>';
        }).join('')
        + '</nav>';
    }
    document.body.insertAdjacentHTML('afterbegin', top + gnbBar);

    var side = document.getElementById('admSide');

    // 사이트 탭 전환 — 좌측 트리 전면 교체 (5호 충전인프라: EVPLUS ↔ hev)
    if (side && opts.siteTabs && opts.siteTabs.length){
      var curSite = null;
      for (var si=0; si<opts.siteTabs.length; si++) if (opts.siteTabs[si].key===opts.activeSite) curSite = opts.siteTabs[si];
      if (!curSite) curSite = opts.siteTabs[0];
      function drawSite(){ side.innerHTML = sideHTML({ children: curSite.side }, opts.activeHref); }
      var sbar = document.querySelector('.adm-gnb');
      if (sbar) sbar.addEventListener('click', function(e){
        var b = e.target.closest('button[data-site]'); if (!b) return;
        for (var i=0;i<opts.siteTabs.length;i++) if (opts.siteTabs[i].key===b.dataset.site) curSite = opts.siteTabs[i];
        sbar.querySelectorAll('button').forEach(function(x){ x.classList.toggle('active', x===b); });
        drawSite();
      });
      drawSite();
      return;
    }

    // 역할 전환(관리자↔사업자) — 좌측 트리 교체(더미). 4호 완속·브랜드 BUSI_MENU Y/N 구분.
    if (side && opts.roles && opts.roles.length){
      var cur = opts.roles[0];
      var bar = document.createElement('div');
      bar.className = 'adm-role';
      bar.innerHTML = '<span class="lb">역할</span>' + opts.roles.map(function(r, i){
        return '<button type="button" data-role="' + esc(r.key) + '"' + (i===0 ? ' class="active"' : '') + '>' + esc(r.label) + '</button>';
      }).join('');
      var tree = document.createElement('div');
      side.appendChild(bar); side.appendChild(tree);      // 역할 바 + 트리 = 사이드 내부
      function drawRole(){ tree.innerHTML = sideHTML({ children: cur.side }, opts.activeHref); }
      bar.addEventListener('click', function(e){
        var b = e.target.closest('button[data-role]'); if (!b) return;
        for (var i=0;i<opts.roles.length;i++) if (opts.roles[i].key===b.dataset.role) cur = opts.roles[i];
        bar.querySelectorAll('button').forEach(function(x){ x.classList.toggle('active', x===b); });
        drawRole();
        if (window.__admToast) __admToast(cur.label + ' 메뉴로 전환했습니다. (프로토타입 — 권한은 더미)');
      });
      drawRole();
      return;
    }

    // 좌측 트리만 (GNB 없음)
    if (side && opts.side && opts.side.length){
      side.innerHTML = sideHTML({ children: opts.side }, opts.activeHref);
      return;
    }

    // 신형: GNB + 트리
    if (side && opts.gnb && opts.gnb.length){
      var current = opts.activeGnb || opts.gnb[0].label;
      function renderSide(){
        var sec = null;
        for (var i=0;i<opts.gnb.length;i++) if (opts.gnb[i].label===current){ sec = opts.gnb[i]; break; }
        side.innerHTML = sideHTML(sec, opts.activeHref);
      }
      renderSide();
      var bar = document.querySelector('.adm-gnb');
      if (bar) bar.addEventListener('click', function(e){
        var b = e.target.closest('button[data-gnb]'); if (!b) return;
        current = b.dataset.gnb;
        bar.querySelectorAll('button').forEach(function(x){ x.classList.toggle('active', x===b); });
        renderSide();
      });
    }
    // 구형: 그룹 메뉴 (1호 호환)
    else if (side && opts.menu){
      side.innerHTML = opts.menu.map(function(g){
        return '<div class="grp">' + esc(g.group) + '</div>'
          + g.items.map(function(m){
            if (m.stub) return '<a href="#" class="stub" onclick="return false;">' + esc(m.label) + '<span class="soon">준비 중</span></a>';
            return '<a href="' + esc(m.href || '#') + '"' + (m.active ? ' class="active"' : '') + '>' + esc(m.label) + '</a>';
          }).join('');
      }).join('');
    }
  }

  // 간이 토스트(관리자 셸 자체 — 대민 __toast 미사용)
  window.__admToast = function(msg){
    var el = document.createElement('div');
    el.setAttribute('role','status'); el.setAttribute('aria-live','polite');
    el.style.cssText = 'position:fixed;left:50%;bottom:28px;transform:translateX(-50%);background:#1f2b3a;color:#fff;padding:10px 18px;border-radius:10px;font-size:13px;font-weight:600;z-index:9999;box-shadow:0 8px 24px rgba(0,0,0,.25);';
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(function(){ el.remove(); }, 2200);
  };

  return { mount: mount };
})();
