/* =========================================================
   무공해차 통합누리집 TO-BE Prototype - Global JS
   ========================================================= */

(function() {
  'use strict';

  // ---------- 임베드 모드 (무공해차 백과 허브의 iframe 지연 로드) ----------
  // ?embed=1 로 열린 하위 페이지는 헤더/푸터/히어로를 숨기고(스타일), 자신의 높이를
  // 부모(허브)에 postMessage 로 전달하여 iframe 이 내용 높이에 맞게 자동 리사이즈되도록 한다.
  (function () {
    var embed = false;
    try { embed = new URLSearchParams(location.search).get('embed') === '1'; } catch (e) {}
    if (!embed) return;
    document.documentElement.classList.add('embed-mode');
    // 임베드된 페이지 내부의 링크 클릭은 iframe 안이 아니라 최상위 창에서 이동시킨다.
    // (백과 허브 iframe 안에서 또 헤더-바디-푸터가 중첩 생성되는 문제 방지)
    document.addEventListener('click', function (e) {
      var a = e.target.closest('a[href]');
      if (!a) return;
      var href = a.getAttribute('href');
      if (!href || href.charAt(0) === '#' || /^(javascript:|mailto:|tel:)/i.test(href)) return; // 페이지 내 앵커·특수 스킴 제외
      e.preventDefault();
      try { window.top.location.href = a.href; } catch (err) { window.location.href = a.href; }
    }, true);
    // 페이지 내 앵커(#목차) 클릭: iframe 은 내용 높이에 맞춰 늘어나 자체 스크롤이 없으므로
    // 대상 요소의 위치를 부모(허브)에 전달하여 부모 창이 해당 섹션으로 스크롤하도록 한다.
    document.addEventListener('click', function (e) {
      var a = e.target.closest('a[href^="#"]');
      if (!a) return;
      var id = a.getAttribute('href').slice(1);
      if (!id) return;
      var target = document.getElementById(id);
      if (!target) return;
      e.preventDefault();
      var top = target.getBoundingClientRect().top + (window.pageYOffset || document.documentElement.scrollTop || 0);
      try { parent.postMessage({ encScrollTo: top }, '*'); } catch (err) {}
    }, true);
    var postH = function () {
      try {
        var h = document.body ? document.body.scrollHeight : document.documentElement.scrollHeight;
        parent.postMessage({ encHeight: h }, '*');
      } catch (e) {}
    };
    window.addEventListener('load', function () { postH(); setTimeout(postH, 300); setTimeout(postH, 1200); });
    window.addEventListener('resize', postH);
    window.addEventListener('langChange', function () { setTimeout(postH, 120); });
  })();

  // ---------- 단일 창 네비게이션 가드 ----------
  // 모든 target="_blank" 링크를 동일 창에서 열도록 강제
  // window.open 호출도 자동으로 동일 창 location으로 변환
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[target="_blank"]');
    if (a) {
      // 중간 클릭(휠버튼)·Ctrl/Cmd 클릭은 사용자 의도이므로 허용
      if (e.button === 1 || e.ctrlKey || e.metaKey) return;
      // 외부 링크라도 같은 창에서 이동 (href가 '#'이면 페이지 이동 안 함)
      a.removeAttribute('target');
      a.removeAttribute('rel');
    }
  }, true);

  // window.open 오버라이드 → 같은 창에서 이동
  if (window.open) {
    const _open = window.open.bind(window);
    window.open = function (url, name, features) {
      if (url && url !== '#' && !/^javascript:/i.test(url)) {
        try { window.location.assign(url); } catch(e) {}
        return window;
      }
      return null;
    };
    window.__nativeOpen = _open; // 필요시 원본 호출용
  }

  // ---------- Header scroll shadow ----------
  const header = document.querySelector('.site-header');
  if (header) {
    const onScroll = () => {
      if (window.scrollY > 8) header.classList.add('scrolled');
      else header.classList.remove('scrolled');
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // ---------- Mobile menu toggle ----------
  const menuToggle = document.querySelector('.menu-toggle');
  const mainNav = document.querySelector('.main-nav');
  if (menuToggle && mainNav) {
    menuToggle.addEventListener('click', () => {
      mainNav.classList.toggle('open');
      const expanded = mainNav.classList.contains('open');
      menuToggle.setAttribute('aria-expanded', expanded);
    });
  }

  // ---------- Scroll to top ----------
  const scrollTopBtn = document.createElement('button');
  scrollTopBtn.className = 'scroll-top';
  scrollTopBtn.setAttribute('aria-label', '맨 위로 이동');
  scrollTopBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>';
  document.body.appendChild(scrollTopBtn);
  window.addEventListener('scroll', () => {
    if (window.scrollY > 400) scrollTopBtn.classList.add('show');
    else scrollTopBtn.classList.remove('show');
  }, { passive: true });
  scrollTopBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  // ---------- Tabs ----------
  document.querySelectorAll('[data-tabs]').forEach(group => {
    const tabs = group.querySelectorAll('.tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const target = tab.dataset.tab;
        const parent = tab.closest('[data-tabs]');
        parent.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        // 탭 콘텐츠 검색 영역을 main / body 등 상위까지 확장하여
        // nav.tab-nav 외부의 section.tab-content도 정상 탐지하도록 보강
        const scope = parent.closest('main, body') || document;
        scope.querySelectorAll('[data-tab-content]').forEach(c => c.classList.remove('active'));
        const targetEl = scope.querySelector(`[data-tab-content="${target}"]`);
        if (targetEl) targetEl.classList.add('active');
        // URL 동기화 — 탭 전환 시 ?tab=xxx 갱신
        try {
          const url = new URL(location.href);
          url.searchParams.set('tab', target);
          history.replaceState(null, '', url.toString());
        } catch (e) { /* noop */ }
      });
    });
  });

  // ---------- 초기 진입 시 URL(?tab= 또는 #hash)로 탭 활성화 ----------
  // 헤더 메뉴 등에서 특정 탭으로 바로 진입(딥링크)할 수 있도록 보강
  (function initTabFromUrl() {
    try {
      const u = new URL(location.href);
      const target = u.searchParams.get('tab') || (location.hash ? location.hash.replace('#', '') : '');
      if (!target) return;
      const btn = document.querySelector('[data-tabs] .tab[data-tab="' + (window.CSS && CSS.escape ? CSS.escape(target) : target) + '"]');
      if (btn) btn.click();
    } catch (e) { /* noop */ }
  })();

  // ---------- FAQ Accordion ----------
  document.querySelectorAll('.faq-item').forEach(item => {
    const btn = item.querySelector('.faq-question');
    if (!btn) return;
    btn.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');
      // optional: close siblings
      if (btn.dataset.single !== 'false') {
        item.parentElement.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
      }
      if (!isOpen) item.classList.add('open');
      btn.setAttribute('aria-expanded', !isOpen);
    });
  });

  // ---------- Modals ----------
  const openModal = (id) => {
    const modal = document.getElementById(id);
    const backdrop = document.querySelector('.modal-backdrop[data-for="' + id + '"]') || document.querySelector('.modal-backdrop');
    if (!modal) return;
    modal.classList.add('show');
    modal.setAttribute('aria-hidden', 'false');
    if (backdrop) backdrop.classList.add('show');
    document.body.style.overflow = 'hidden';
  };
  const closeModal = (modal) => {
    if (!modal) return;
    modal.classList.remove('show');
    modal.setAttribute('aria-hidden', 'true');
    const backdrop = document.querySelector('.modal-backdrop.show');
    if (backdrop) backdrop.classList.remove('show');
    document.body.style.overflow = '';
  };
  // Use delegation so dynamically-added buttons also work
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-modal-open]');
    if (btn) openModal(btn.dataset.modalOpen);
  });
  document.querySelectorAll('[data-modal-close]').forEach(btn => {
    btn.addEventListener('click', () => closeModal(btn.closest('.modal')));
  });
  document.querySelectorAll('.modal-backdrop').forEach(bd => {
    bd.addEventListener('click', () => {
      document.querySelectorAll('.modal.show').forEach(m => closeModal(m));
    });
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') document.querySelectorAll('.modal.show').forEach(m => closeModal(m));
  });
  window.__openModal = openModal;
  window.__closeModal = closeModal;

  // ---------- Expandable data table rows (event delegation) ----------
  // 초기 접근성 속성 부여
  document.querySelectorAll('.data-table tr.expandable').forEach(row => {
    row.setAttribute('tabindex', '0');
    row.setAttribute('role', 'button');
    row.setAttribute('aria-expanded', 'false');
  });

  // delegation: 동적으로 추가되는 행도 즉시 동작
  document.addEventListener('click', (e) => {
    const row = e.target.closest('.data-table tr.expandable');
    if (!row) return;
    // 내부 링크(<a>)이면서 펼치기 버튼 영역이 아닌 경우는 링크 동작을 우선
    if (e.target.closest('a') && !e.target.closest('.expand-btn-wrap')) return;
    // 내부 버튼(<button>)도 우선 (펼치기 버튼은 span이므로 영향 없음)
    if (e.target.closest('button')) return;
    const targetId = row.dataset.expand;
    if (!targetId) return;
    const detail = document.getElementById(targetId);
    if (!detail) return;
    const open = detail.classList.toggle('show');
    row.classList.toggle('open', open);
    row.setAttribute('aria-expanded', open);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const row = e.target.closest?.('.data-table tr.expandable');
    if (!row || e.target !== row) return;
    e.preventDefault();
    row.click();
  });

  // ---------- Data table sort ----------
  document.querySelectorAll('.data-table').forEach(table => {
    const ths = table.querySelectorAll('th.sortable');
    ths.forEach((th, idx) => {
      th.addEventListener('click', () => {
        const tbody = table.querySelector('tbody');
        const rows = Array.from(tbody.querySelectorAll('tr'));
        const asc = !th.classList.contains('sort-asc');
        ths.forEach(t => t.classList.remove('sort-asc', 'sort-desc'));
        th.classList.add(asc ? 'sort-asc' : 'sort-desc');
        rows.sort((a, b) => {
          const av = a.children[idx].innerText.trim();
          const bv = b.children[idx].innerText.trim();
          const an = parseFloat(av.replace(/[^0-9.-]/g, ''));
          const bn = parseFloat(bv.replace(/[^0-9.-]/g, ''));
          if (!isNaN(an) && !isNaN(bn)) return asc ? an - bn : bn - an;
          return asc ? av.localeCompare(bv, 'ko') : bv.localeCompare(av, 'ko');
        });
        rows.forEach(r => tbody.appendChild(r));
      });
    });
  });

  // ---------- Table filter / search ----------
  document.querySelectorAll('[data-table-search]').forEach(input => {
    const targetId = input.dataset.tableSearch;
    const table = document.getElementById(targetId);
    if (!table) return;
    input.addEventListener('input', () => {
      const q = input.value.toLowerCase();
      table.querySelectorAll('tbody tr').forEach(tr => {
        tr.style.display = tr.innerText.toLowerCase().includes(q) ? '' : 'none';
      });
    });
  });

  // ---------- Radio card groups ----------
  document.querySelectorAll('[data-radio-group]').forEach(group => {
    const cards = group.querySelectorAll('.radio-card');
    cards.forEach(card => {
      card.addEventListener('click', () => {
        cards.forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        const input = card.querySelector('input[type=radio]');
        if (input) input.checked = true;
      });
    });
  });

  // ---------- Region chip selector ----------
  document.querySelectorAll('[data-region-group]').forEach(group => {
    const chips = group.querySelectorAll('.region-chip');
    chips.forEach(chip => {
      chip.addEventListener('click', () => {
        chips.forEach(c => c.classList.remove('selected'));
        chip.classList.add('selected');
        const event = new CustomEvent('region:change', { detail: { value: chip.dataset.value } });
        group.dispatchEvent(event);
      });
    });
  });

  // ---------- Pagination (10페이지 윈도우 · first/prev/next/last) ----------
  document.querySelectorAll('.pagination[data-total]').forEach(pag => {
    const total = Math.max(1, parseInt(pag.dataset.total, 10) || 1);
    const windowSize = Math.max(1, parseInt(pag.dataset.window || '10', 10));
    let current = Math.min(total, Math.max(1, parseInt(pag.dataset.current || '1', 10)));

    const render = () => {
      // 현재 페이지가 속한 10단위 블록 계산
      const blockIndex = Math.floor((current - 1) / windowSize);
      const blockStart = blockIndex * windowSize + 1;
      const blockEnd = Math.min(blockStart + windowSize - 1, total);

      let html = '';
      html += `<button ${current <= 1 ? 'disabled' : ''} data-p="first" aria-label="처음 페이지">«</button>`;
      html += `<button ${current <= 1 ? 'disabled' : ''} data-p="prev" aria-label="이전 페이지">‹</button>`;
      for (let i = blockStart; i <= blockEnd; i++) {
        html += `<button class="${i === current ? 'active' : ''}" data-p="${i}" aria-label="${i}페이지"${i === current ? ' aria-current="page"' : ''}>${i}</button>`;
      }
      html += `<button ${current >= total ? 'disabled' : ''} data-p="next" aria-label="다음 페이지">›</button>`;
      html += `<button ${current >= total ? 'disabled' : ''} data-p="last" aria-label="마지막 페이지">»</button>`;
      pag.innerHTML = html;

      pag.querySelectorAll('button').forEach(b => {
        b.addEventListener('click', () => {
          const p = b.dataset.p;
          if (p === 'first') current = 1;
          else if (p === 'last') current = total;
          else if (p === 'prev') current = Math.max(1, current - 1);
          else if (p === 'next') current = Math.min(total, current + 1);
          else current = parseInt(p, 10);
          render();
          try { pag.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (e) {}
          pag.dispatchEvent(new CustomEvent('page:change', { detail: { page: current, total } }));
        });
      });
    };
    render();
  });

  // ---------- Anchor nav active on scroll ----------
  const anchorNav = document.querySelector('.anchor-nav');
  if (anchorNav) {
    const links = anchorNav.querySelectorAll('a[href^="#"]');
    const targets = Array.from(links).map(a => document.getElementById(a.getAttribute('href').slice(1))).filter(Boolean);
    const setActive = () => {
      const scrollPos = window.scrollY + 160;
      let current = targets[0]?.id;
      targets.forEach(t => { if (t.offsetTop <= scrollPos) current = t.id; });
      links.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + current));
    };
    if (targets.length) {
      window.addEventListener('scroll', setActive, { passive: true });
      setActive();
    }
  }

  // ---------- Form validation (simple) ----------
  document.querySelectorAll('form[data-validate]').forEach(form => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      let valid = true;
      form.querySelectorAll('[required]').forEach(f => {
        const group = f.closest('.form-group');
        if (!f.value.trim()) {
          valid = false;
          f.classList.add('error');
          if (group && !group.querySelector('.form-error')) {
            const msg = document.createElement('div');
            msg.className = 'form-error';
            msg.textContent = '필수 입력 항목입니다.';
            group.appendChild(msg);
          }
        } else {
          f.classList.remove('error');
          const err = group?.querySelector('.form-error');
          if (err) err.remove();
        }
      });
      if (valid) {
        showToast('신청이 정상 접수되었습니다.', 'success');
        form.reset();
      }
    });
  });

  // ---------- Toast ----------
  // WCAG 2.2 — 4.1.3 Status Messages: 시각적 알림과 동시에 스크린리더에 즉시 전달
  let _liveRegion = null;
  function getLiveRegion() {
    if (_liveRegion) return _liveRegion;
    _liveRegion = document.createElement('div');
    _liveRegion.setAttribute('role', 'status');
    _liveRegion.setAttribute('aria-live', 'polite');
    _liveRegion.setAttribute('aria-atomic', 'true');
    _liveRegion.className = 'sr-only';
    document.body.appendChild(_liveRegion);
    return _liveRegion;
  }
  function announce(msg) {
    const r = getLiveRegion();
    r.textContent = '';
    setTimeout(() => { r.textContent = msg; }, 50);
  }

  function showToast(msg, type = 'info') {
    let toast = document.createElement('div');
    toast.setAttribute('role', type === 'error' ? 'alert' : 'status');
    toast.setAttribute('aria-live', type === 'error' ? 'assertive' : 'polite');
    toast.setAttribute('aria-atomic', 'true');
    toast.style.cssText = `
      position: fixed; top: 100px; right: 24px;
      background: ${type === 'success' ? '#00A85A' : type === 'error' ? '#EF4444' : '#1E293B'};
      color: #fff; padding: 14px 20px;
      border-radius: 12px; box-shadow: 0 12px 32px rgba(0,0,0,0.18);
      z-index: 1200; font-weight: 600; font-size: 14px;
      transform: translateX(400px); transition: transform 300ms ease;
      min-height: 44px; display: flex; align-items: center;
    `;
    toast.textContent = msg;
    document.body.appendChild(toast);
    requestAnimationFrame(() => { toast.style.transform = 'translateX(0)'; });
    // 별도 sr-only 라이브 리전에도 메시지 전달 (스크린리더가 토스트 DOM을 놓쳐도 보장)
    announce(msg);
    setTimeout(() => {
      toast.style.transform = 'translateX(400px)';
      setTimeout(() => toast.remove(), 300);
    }, 2800);
  }
  window.__toast = showToast;
  window.__announce = announce;

  // ---------- Counter animation ----------
  const counters = document.querySelectorAll('[data-counter]');
  if (counters.length) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const target = parseFloat(el.dataset.counter);
          const duration = 1200;
          const start = performance.now();
          const animate = (t) => {
            const p = Math.min(1, (t - start) / duration);
            const eased = 1 - Math.pow(1 - p, 3);
            const val = target * eased;
            el.textContent = target >= 100 ? Math.round(val).toLocaleString() : val.toFixed(1);
            if (p < 1) requestAnimationFrame(animate);
          };
          requestAnimationFrame(animate);
          io.unobserve(el);
        }
      });
    }, { threshold: 0.3 });
    counters.forEach(c => io.observe(c));
  }

  // ---------- Reveal on scroll ----------
  const revealEls = document.querySelectorAll('[data-reveal]');
  if (revealEls.length) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });
    revealEls.forEach(el => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(20px)';
      el.style.transition = 'opacity 600ms ease, transform 600ms ease';
      io.observe(el);
    });
  }

  // ---------- View toggle (카드형 / 표형 등) ----------
  document.querySelectorAll('[data-view-toggle]').forEach(group => {
    const buttons = group.querySelectorAll('button[data-view]');
    const containerSel = group.dataset.viewToggle;
    const container = document.querySelector(containerSel);
    if (!container) return;
    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        const view = btn.dataset.view;
        buttons.forEach(b => b.classList.toggle('active', b === btn));
        container.querySelectorAll('[data-view-panel]').forEach(p => {
          p.style.display = p.dataset.viewPanel === view ? '' : 'none';
        });
      });
    });
  });

  // ---------- Period selector (3년/5년/7년/10년) ----------
  document.querySelectorAll('[data-period-group]').forEach(group => {
    const buttons = group.querySelectorAll('button');
    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        buttons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        group.dispatchEvent(new CustomEvent('period:change', { detail: { value: btn.textContent.trim() } }));
      });
    });
  });

  // ---------- AI suggestion chips (메인 페이지 AI 상담 데스크) ----------
  document.querySelectorAll('[data-chip-suggest]').forEach(chip => {
    chip.addEventListener('click', () => {
      const target = document.querySelector(chip.dataset.chipSuggest);
      const query = chip.dataset.query || chip.textContent.trim();
      if (target) {
        target.value = query;
        target.focus();
        target.dispatchEvent(new Event('input', { bubbles: true }));
      }
      if (typeof showToast === 'function') showToast('AI가 "' + query + '"에 대해 답변을 준비하고 있어요', 'info');
    });
  });

  // ---------- Generic action buttons ----------
  document.querySelectorAll('[data-action]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const action = btn.dataset.action;
      const label = btn.dataset.actionLabel || btn.textContent.trim();
      switch (action) {
        case 'download':
          e.preventDefault();
          showToast(`"${label}" 다운로드가 시작됩니다.`, 'success');
          break;
        case 'share':
          e.preventDefault();
          if (navigator.clipboard) navigator.clipboard.writeText(window.location.href).catch(()=>{});
          showToast('공유 링크가 클립보드에 복사되었습니다.', 'success');
          break;
        case 'print':
          e.preventDefault();
          window.print();
          break;
        case 'remove-car':
          e.preventDefault();
          const card = btn.closest('.car-card');
          if (card) {
            card.style.transition = 'opacity 240ms ease, transform 240ms ease';
            card.style.opacity = '0';
            card.style.transform = 'scale(0.92)';
            setTimeout(() => {
              // replace with placeholder
              card.outerHTML = `
                <button class="car-card" data-modal-open="addCarModal" style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:320px;background:var(--color-gray-50);border-style:dashed;cursor:pointer;width:100%;">
                  <div style="width:64px;height:64px;border-radius:50%;background:var(--gradient-primary-soft);display:grid;place-items:center;color:var(--color-primary-600);margin-bottom:16px;font-size:32px;">+</div>
                  <h4>차량 추가</h4>
                  <p style="color:var(--text-secondary);font-size:14px;margin-top:4px;">최대 3대까지 비교 가능</p>
                </button>`;
              showToast('비교 목록에서 제거되었습니다.', 'info');
            }, 240);
          }
          break;
        case 'recalculate':
          e.preventDefault();
          btn.classList.add('btn-loading');
          btn.setAttribute('disabled', '');
          const original = btn.innerHTML;
          btn.innerHTML = '<span class="spinner"></span> 계산 중...';
          setTimeout(() => {
            btn.classList.remove('btn-loading');
            btn.removeAttribute('disabled');
            btn.innerHTML = original;
            showToast('TCO 계산이 완료되었습니다.', 'success');
          }, 1200);
          break;
        case 'check-grade':
          e.preventDefault();
          // 간단 검증
          const gradeForm = document.getElementById('grade-form');
          if (gradeForm) {
            let gv = true;
            gradeForm.querySelectorAll('input[required]').forEach(f => {
              if (!f.value.trim()) {
                gv = false;
                f.classList.add('error');
                f.addEventListener('input', () => f.classList.remove('error'), { once: true });
              }
            });
            if (!gv) { showToast('차량번호와 소유자명을 입력해 주세요.', 'error'); return; }
          }
          btn.classList.add('btn-loading');
          btn.setAttribute('disabled', '');
          const gOrig = btn.innerHTML;
          btn.innerHTML = '<span class="spinner"></span> 조회 중...';
          setTimeout(() => {
            btn.classList.remove('btn-loading');
            btn.removeAttribute('disabled');
            btn.innerHTML = gOrig;
            const resultSec = document.getElementById('grade-result-section');
            if (resultSec) {
              resultSec.classList.add('show');
              resultSec.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
            showToast('저공해 등급 1등급으로 조회되었습니다.', 'success');
          }, 900);
          break;
        case 'filter-apply':
          e.preventDefault();
          showToast('필터를 적용했습니다.', 'success');
          // trigger animation on target
          const filterTarget = document.querySelector(btn.dataset.filterTarget);
          if (filterTarget) {
            filterTarget.style.opacity = '0.5';
            setTimeout(() => filterTarget.style.opacity = '1', 300);
          }
          break;
        case 'reset':
          e.preventDefault();
          const form = btn.closest('form') || btn.closest('.card');
          if (form) {
            form.querySelectorAll('input').forEach(i => { if (i.type !== 'radio' && i.type !== 'checkbox') i.value = ''; });
            form.querySelectorAll('select').forEach(s => s.selectedIndex = 0);
            form.querySelectorAll('.region-chip.selected').forEach(c => c.classList.remove('selected'));
          }
          showToast('조건을 초기화했습니다.', 'info');
          break;
        case 'apply-compare':
          e.preventDefault();
          showToast('비교 목록에 추가되었습니다.', 'success');
          document.querySelectorAll('.modal.show').forEach(m => closeModal(m));
          break;
        case 'notify':
          e.preventDefault();
          showToast(label, 'info');
          break;
      }
    });
  });

  // ---------- Add car modal: radio card selection ----------
  document.querySelectorAll('[data-modal-car-select] .radio-card').forEach(card => {
    card.addEventListener('click', () => {
      card.parentElement.querySelectorAll('.radio-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
    });
  });

  // ---------- Chip filter toggle ----------
  document.querySelectorAll('[data-chip-filter]').forEach(chip => {
    chip.addEventListener('click', () => {
      chip.classList.toggle('chip-active');
      const group = chip.closest('[data-chip-filter-group]');
      if (group) group.dispatchEvent(new CustomEvent('chip-filter:change'));
    });
  });

  // ---------- Subsidy region row → open card details ----------
  document.querySelectorAll('[data-region-goto]').forEach(el => {
    el.addEventListener('click', () => {
      const href = el.dataset.regionGoto;
      if (href) window.location.href = href;
    });
  });

})();
