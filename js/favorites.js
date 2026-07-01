/* =========================================================
   즐겨찾기 헬퍼 — V2.0 (다중 카테고리)
   - localStorage 기반 (키: ev_favorites_v2)
   - 카테고리: 'station'(충전소) · 'region'(지자체 보조금) · 'provider'(충전사업자)
   - 충전소 카드 ★ 토글, 마이페이지 자주 쓰는 충전소, 지자체 보조금 표/카드, 충전사업자 매트릭스 등
   - 다른 탭과 동기화 (storage 이벤트)
   ========================================================= */
(function (global) {
  const STORAGE_KEY = 'ev_favorites_v2';
  const DEFAULT_KIND = 'station';

  function readAll() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch (e) {
      return [];
    }
  }

  function writeAll(list) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); } catch (e) {}
    document.dispatchEvent(new CustomEvent('favorites:changed', { detail: { list } }));
  }

  // 내부적으로 kind 기반 식별 (legacy 데이터는 kind 없으면 'station' 취급)
  function effKind(it) { return it.kind || DEFAULT_KIND; }

  /** 모든 즐겨찾기 가져오기 (kind 미지정 시 station만 반환 — backward compat) */
  function getAll(kind) {
    const all = readAll();
    if (kind === '*' || kind === 'all') return all;
    const k = kind || DEFAULT_KIND;
    return all.filter(it => effKind(it) === k);
  }

  function isFav(id, kind) {
    const k = kind || DEFAULT_KIND;
    return readAll().some(it => it.id === id && effKind(it) === k);
  }

  /**
   * 즐겨찾기 추가 (item에 kind 지정, 없으면 station)
   * @param {Object} item - { id, name, kind?, ... }
   * @param {string} kindOverride - (선택) 외부에서 kind 지정
   */
  function add(item, kindOverride) {
    if (!item || !item.id) return false;
    const kind = kindOverride || item.kind || DEFAULT_KIND;
    const list = readAll();
    if (list.some(it => it.id === item.id && effKind(it) === kind)) return false;
    const entry = Object.assign({}, item, { kind, addedAt: new Date().toISOString() });
    list.unshift(entry);
    writeAll(list);
    return true;
  }

  function remove(id, kind) {
    const k = kind || DEFAULT_KIND;
    const list = readAll().filter(it => !(it.id === id && effKind(it) === k));
    writeAll(list);
  }

  function toggle(item, kindOverride) {
    if (!item || !item.id) return false;
    const kind = kindOverride || item.kind || DEFAULT_KIND;
    if (isFav(item.id, kind)) { remove(item.id, kind); return false; }
    add(item, kind);
    return true;
  }

  function clearAll(kind) {
    if (!kind || kind === '*' || kind === 'all') { writeAll([]); return; }
    const list = readAll().filter(it => effKind(it) !== kind);
    writeAll(list);
  }

  function count(kind) { return getAll(kind || DEFAULT_KIND).length; }

  /* 토스트 안내 (style.css의 toast 컴포넌트가 없어도 자체 스타일로 동작) */
  function toast(msg, kind) {
    let host = document.getElementById('fav-toast-host');
    if (!host) {
      host = document.createElement('div');
      host.id = 'fav-toast-host';
      host.style.cssText = 'position:fixed;bottom:32px;left:50%;transform:translateX(-50%);z-index:1100;display:flex;flex-direction:column;gap:8px;align-items:center;pointer-events:none;';
      document.body.appendChild(host);
    }
    const el = document.createElement('div');
    const bg = kind === 'remove' ? '#475569' : '#0E9358';
    el.style.cssText = 'background:' + bg + ';color:#fff;padding:11px 20px;border-radius:999px;font-size:14px;font-weight:600;box-shadow:0 12px 28px rgba(15,23,42,0.18);transition:opacity 200ms ease, transform 200ms ease;opacity:0;transform:translateY(8px);';
    el.textContent = msg;
    host.appendChild(el);
    requestAnimationFrame(() => { el.style.opacity = '1'; el.style.transform = 'translateY(0)'; });
    setTimeout(() => {
      el.style.opacity = '0'; el.style.transform = 'translateY(8px)';
      setTimeout(() => el.remove(), 250);
    }, 2200);
  }

  /* 충전소 카드에 즐겨찾기 ★ 버튼 자동 부착 + 토글
     - 대상: [data-station] 가진 .station-card 요소
     - 카드의 텍스트로 메타데이터(name/type/address/status/meta) 자동 추출 */
  function attachToStationCards(scope) {
    const root = scope || document;
    const cards = root.querySelectorAll('.station-card[data-station]');
    cards.forEach(card => {
      if (card.querySelector('.fav-btn')) return; // 중복 부착 방지
      const id = card.getAttribute('data-station');

      // 메타데이터 추출
      const h4 = card.querySelector('h4');
      const typeEl = h4 ? h4.querySelector('.st-type') : null;
      const name = h4 ? h4.firstChild.textContent.trim() : id;
      const type = typeEl ? typeEl.textContent.trim() : '';
      const address = (card.querySelector('.st-address') || {}).textContent || '';
      const status  = (card.querySelector('.st-status')  || {}).textContent || '';
      const meta    = (card.querySelector('.st-meta')    || {}).textContent || '';

      const station = {
        id, name, type,
        address: address.trim(),
        status:  status.replace(/\s+/g,' ').trim(),
        meta:    meta.replace(/\s+/g,' ').trim()
      };

      // 버튼 생성
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'fav-btn';
      btn.setAttribute('aria-label', '즐겨찾기 추가/해제');
      btn.setAttribute('aria-pressed', isFav(id) ? 'true' : 'false');
      btn.innerHTML = isFav(id) ? svgStar(true) : svgStar(false);
      btn.addEventListener('click', e => {
        e.stopPropagation(); e.preventDefault();
        const nowFav = toggle(station);
        btn.setAttribute('aria-pressed', nowFav ? 'true' : 'false');
        btn.innerHTML = nowFav ? svgStar(true) : svgStar(false);
        toast(nowFav ? '즐겨찾기에 추가되었습니다.' : '즐겨찾기에서 해제되었습니다.', nowFav ? 'add' : 'remove');
      });
      card.appendChild(btn);
      // 카드의 position:relative 보장
      const cs = getComputedStyle(card);
      if (cs.position === 'static') card.style.position = 'relative';
    });
  }

  function svgStar(filled) {
    if (filled) {
      return '<svg viewBox="0 0 24 24" width="18" height="18" fill="#FF9A2E" stroke="#FF9A2E" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="12 2 15 8.5 22 9.3 17 14 18.5 21 12 17.5 5.5 21 7 14 2 9.3 9 8.5 12 2"/></svg>';
    }
    return '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#94A3B8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="12 2 15 8.5 22 9.3 17 14 18.5 21 12 17.5 5.5 21 7 14 2 9.3 9 8.5 12 2"/></svg>';
  }

  /* 다른 탭에서의 변경 동기화 */
  window.addEventListener('storage', e => {
    if (e.key === STORAGE_KEY) {
      document.dispatchEvent(new CustomEvent('favorites:changed', { detail: { list: readAll() } }));
    }
  });

  /* SVG 아이콘 외부 노출 (다른 페이지에서 동일한 별 사용) */
  function renderStar(filled) { return svgStar(filled); }

  /* 외부 노출 */
  global.EVFavorites = {
    // 핵심 (kind 미지정 시 station 기본)
    getAll, isFav, add, remove, toggle, clearAll, count,
    // station 전용 자동 부착 (charging-find.html)
    attachToStationCards,
    // 보조
    renderStar, toast,
    // 카테고리 상수
    KIND: { STATION: 'station', REGION: 'region', PROVIDER: 'provider' }
  };

  /* DOM 준비되면 자동 부착 (charging-find.html 등에서 사용) */
  function autoAttach() {
    attachToStationCards(document);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoAttach);
  } else {
    autoAttach();
  }
})(window);
