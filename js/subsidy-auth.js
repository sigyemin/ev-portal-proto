/* subsidy-auth.js — 보조금 신청현황 인증 게이트 (개인/법인·단체/공공·지자체 공유)
   ── 플로우: 진입 안내 → [신청 내역 보기] → 인증 유형 3버튼(상시) → 모의 인증 → 성공 시 리스트
      · 로그인 필수(마이페이지 하위). 인증 통과 전에는 리스트 렌더 금지.
      · 유형 자동분기 금지 — 3버튼 항상 노출. 개인 회원도 법인/공공 인증으로 기관 현황 조회 가능.
      · 개인 = 휴대폰 본인인증(PASS), 법인·단체 = 공동인증서, 공공·지자체 = GPKI(행정전자서명).
      · 프로토타입 mock: 실제 PASS/공동인증서/GPKI 연동 없음(UI만).
   ── 매칭: 개인=인증신원(CI 이름+생년월일+휴대폰)==로그인계정일 때만 개인 리스트.
             법인/공공=인증서 보유 자체를 권한으로 인정(로그인 신원과 달라도 허용).
   ── 세션: 인증 성공 후 같은 세션 재인증 불필요(sessionStorage). 새 세션/재진입 시 게이트부터. */
window.SubsidyAuth = (function () {
  'use strict';
  var KEY = 'subsidyAuth';
  var PERSONAL_PAGE = 'subsidy-status.html', CORP_PAGE = 'subsidy-status-corp.html';

  function get() { try { return JSON.parse(sessionStorage.getItem(KEY) || 'null'); } catch (e) { return null; } }
  function set(a) { try { sessionStorage.setItem(KEY, JSON.stringify(a)); } catch (e) { } }
  function clear() { try { sessionStorage.removeItem(KEY); } catch (e) { } }

  var METHOD = { personal: '휴대폰 본인인증(PASS)', biz: '공동인증서', gov: 'GPKI(행정전자서명)' };

  function mount(opts) {
    var gate = document.getElementById(opts.gateId || 'subsidyGate');
    var view = document.getElementById(opts.viewId || 'subsidyView');
    if (!gate) return;
    var pageType = opts.pageType; // 'personal' | 'corp'
    var login = opts.login || { name: '홍길동', birth: '1990-01-01', phone: '010-1234-5678' };

    function pageMatches(a) { return pageType === 'personal' ? a.type === 'personal' : (a.type === 'biz' || a.type === 'gov'); }
    function reveal(a) {
      gate.hidden = true; gate.innerHTML = '';
      if (view) view.hidden = false;
      if (typeof opts.onAuthed === 'function') opts.onAuthed(a);
    }
    function routeTo(a) {
      if (pageMatches(a)) reveal(a);
      else location.href = (a.type === 'personal') ? PERSONAL_PAGE : CORP_PAGE;
    }

    // 이미 인증된 세션 → 바로 라우팅(재인증 없음)
    var existing = get();
    if (existing && (existing.type === 'personal' || existing.type === 'biz' || existing.type === 'gov')) { routeTo(existing); return; }

    if (view) view.hidden = true;
    gate.hidden = false;
    showIntro();

    function showIntro() {
      gate.innerHTML =
        '<div class="sa-gate">' +
        '<div class="sa-ico" aria-hidden="true">🔒</div>' +
        '<h2 class="sa-title">신청 내역 확인을 위해 본인·기관 인증이 필요합니다</h2>' +
        '<p class="sa-desc">개인정보 보호를 위해 인증을 완료한 뒤에만 신청 내역이 표시됩니다. 로그인한 회원만 이용할 수 있습니다.</p>' +
        '<button type="button" class="btn btn-primary btn-lg" id="saStart">신청 내역 보기</button>' +
        '</div>';
      gate.querySelector('#saStart').addEventListener('click', showChoose);
    }

    function typeBtn(type, title, sub, ico) {
      return '<button type="button" class="sa-type" data-type="' + type + '" aria-label="' + title + ' 인증">' +
        '<span class="sa-type-ico" aria-hidden="true">' + ico + '</span>' +
        '<span class="sa-type-title">' + title + '</span>' +
        '<span class="sa-type-sub">' + sub + '</span></button>';
    }
    function showChoose() {
      gate.innerHTML =
        '<div class="sa-gate">' +
        '<h2 class="sa-title">인증 유형 선택</h2>' +
        '<p class="sa-desc">확인하실 신청 내역의 유형을 선택하세요. 개인 회원도 법인·공공 인증서로 해당 기관 현황을 조회할 수 있습니다. <span class="sa-hint">(GPKI = 행정전자서명)</span></p>' +
        '<div class="sa-types" role="group" aria-label="인증 유형 선택">' +
        typeBtn('personal', '개인', '휴대폰 본인인증 (PASS)', '📱') +
        typeBtn('biz', '법인·단체', '공동인증서', '🏢') +
        typeBtn('gov', '공공기관·지자체', 'GPKI · 행정전자서명', '🏛️') +
        '</div>' +
        '<button type="button" class="btn btn-ghost btn-sm sa-back" id="saBack">← 이전</button>' +
        '</div>';
      Array.prototype.forEach.call(gate.querySelectorAll('.sa-type'), function (b) { b.addEventListener('click', function () { showAuth(b.dataset.type); }); });
      gate.querySelector('#saBack').addEventListener('click', showIntro);
    }

    function showAuth(type) {
      gate.innerHTML =
        '<div class="sa-gate">' +
        '<div class="sa-auth" role="status" aria-live="polite">' +
        '<div class="sa-spinner" aria-hidden="true"></div>' +
        '<h2 class="sa-title">' + METHOD[type] + ' 진행</h2>' +
        '<p class="sa-desc">(프로토타입 모의 인증) 아래 버튼으로 인증 결과를 시뮬레이션합니다.</p>' +
        '</div>' +
        '<div class="sa-actions">' +
        '<button type="button" class="btn btn-primary btn-lg" id="saOk">인증 완료</button>' +
        (type === 'personal' ? '<button type="button" class="btn btn-ghost" id="saMismatch">(데모) 타인 명의로 인증</button>' : '') +
        '<button type="button" class="btn btn-ghost" id="saCancel">취소</button>' +
        '</div>' +
        '</div>';
      gate.querySelector('#saOk').addEventListener('click', function () { succeed(type, true); });
      var mm = gate.querySelector('#saMismatch'); if (mm) mm.addEventListener('click', function () { succeed(type, false); });
      gate.querySelector('#saCancel').addEventListener('click', function () { showFail('취소'); });
    }

    function succeed(type, selfMatch) {
      var a;
      if (type === 'personal') {
        // 인증 신원(CI = 이름+생년월일+휴대폰). selfMatch=false 는 타인 명의 데모.
        var ident = selfMatch ? { name: login.name, birth: login.birth, phone: login.phone }
                              : { name: '김철수', birth: '1985-07-07', phone: '010-2222-3333' };
        var ok = ident.name === login.name && ident.birth === login.birth && ident.phone === login.phone;
        if (!ok) { showMismatch(); return; }
        a = { type: 'personal', name: ident.name, ts: Date.now() };
      } else if (type === 'biz') {
        a = { type: 'biz', bizNo: '123-45-67890', org: '무공해모빌리티㈜', ts: Date.now() };
      } else {
        a = { type: 'gov', instId: '6110000', org: '서울특별시청', ts: Date.now() };
      }
      set(a); routeTo(a);
    }

    function errorScreen(icon, title, desc, retryLabel) {
      gate.innerHTML =
        '<div class="sa-gate sa-error">' +
        '<div class="sa-ico" aria-hidden="true">' + icon + '</div>' +
        '<h2 class="sa-title">' + title + '</h2>' +
        '<p class="sa-desc">' + desc + '</p>' +
        '<div class="sa-actions"><button type="button" class="btn btn-primary" id="saRetry">' + (retryLabel || '다시 시도') + '</button></div>' +
        '</div>';
      gate.querySelector('#saRetry').addEventListener('click', showChoose);
    }
    function showMismatch() {
      errorScreen('⚠️', '본인 계정과 인증 정보가 다릅니다',
        '로그인한 계정과 인증하신 신원(이름·생년월일·휴대폰)이 일치하지 않습니다. 본인 명의로 다시 인증해 주세요.', '다시 시도');
    }
    function showFail(reason) {
      errorScreen('✕', '인증이 ' + (reason || '실패') + '되었습니다',
        '인증이 완료되지 않아 신청 내역을 표시할 수 없습니다. 다시 시도해 주세요.', '다시 시도');
    }
  }

  return { mount: mount, get: get, clear: clear };
})();
