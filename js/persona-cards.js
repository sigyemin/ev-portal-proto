/* persona-cards.js — 메인 페르소나(후보2) 서비스 카드 스위처 (KO/EN 다국어)
   · 상단 페르소나 버튼(구매 예정자 / 운전자 / 사업자·제조사 / 지자체·공공기관)
     클릭 시 하단 "OO를 위한 서비스" 카드 영역(#m02EvsvcTrack)을 해당 페르소나용으로 교체
   · 카드 구성·연결 페이지는 무공해차 통합누리집 TO-BE IA(메인 페르소나 카드 후보2) 기준
     (카드 제목은 1줄 노출을 위해 일부 축약 — 정식 명칭은 메뉴/사이트맵/IA 문서 기준)
   · 언어(window.__i18n.getLang)에 따라 KO/EN 동시 지원, langChange 시 재렌더링
   ※ 캐러셀(화살표) 동작은 home-main02.js 가 #m02EvsvcTrack 의 카드를 대상으로 처리한다.
*/
(function () {
  'use strict';

  var BTN_LABEL = {
    buyer:  { ko: '무공해차 구매 예정자', en: 'Prospective Buyer' },
    driver: { ko: '무공해차 운전자',     en: 'ZEV Driver' },
    cpo:    { ko: '사업자·제조사',       en: 'Operators & Makers' },
    gov:    { ko: '지자체·공공기관',     en: 'Govt. & Public' }
  };

  var PERSONAS = {
    buyer: {
      title: '무공해차 구매 예정자를 위한 서비스', title_en: 'Services for Prospective Buyers',
      cards: [
        { t: '지원대상·신청절차', t_en: 'Eligibility & Apply', d: '보조금 지원 대상·자격과 신청 절차를 한눈에 확인하세요.', d_en: 'Check subsidy eligibility and the application process at a glance.', href: 'subsidy-target.html', emoji: '📋' },
        { t: '지자체별 보조금 현황', t_en: 'Subsidies by Region', d: '우리 지역 차종별 보조금 지원 현황과 잔여 예산을 확인하세요.', d_en: 'See subsidy status and remaining budget by region and vehicle.', href: 'subsidy-region.html', emoji: '📍' },
        { t: '보조금 지급대상 차종', t_en: 'Eligible Vehicles', d: '보조금 지원이 가능한 차종 목록을 조회하세요.', d_en: 'Browse the list of subsidy-eligible vehicles.', href: 'subsidy-vehicles.html', emoji: '🚙' },
        { t: '보조금 안내·계산기', t_en: 'Subsidy Calculator', d: '차종·지역을 선택해 예상 보조금을 계산해 보세요.', d_en: 'Estimate your subsidy by vehicle and region.', href: 'subsidy-info.html', emoji: '🧮' },
        { t: '차종 비교 도구', t_en: 'Vehicle Compare', d: '가격·주행거리·충전시간 등 조건별로 차종을 비교하세요.', d_en: 'Compare vehicles by price, range and charging time.', href: 'compare-tool.html', emoji: '⚖️' }
        /* [ISS-091] 제거: 초보자 가이드(info-beginner)·보조금 큐레이터(AI) */
      ]
    },
    driver: {
      title: '무공해차 운전자를 위한 서비스', title_en: 'Services for ZEV Drivers',
      cards: [
        /* [ISS-091] driver 9→5 (제거: 운영 현황 charging-help·데이터·통계 data·환수금 subsidy-refund·AI). 순서 재정렬 */
        { t: '통합 지도 (전기+수소)', t_en: 'Integrated Map', d: '전기·수소 충전소를 하나의 지도에서 찾으세요.', d_en: 'Find EV and H2 stations on a single map.', href: 'charging-find.html?tab=map', emoji: '🗺️' },
        { t: '전기차 충전요금 안내', t_en: 'EV Charging Fees', d: '사업자별 충전 단가와 요금체계를 확인하세요.', d_en: 'Check charging rates and fee plans by operator.', href: 'charging-fee.html?tab=ev', emoji: '⚡' },
        { t: '수소차 충전요금 안내', t_en: 'H2 Charging Fees', d: '수소차 충전 단가와 지역별 요금 정보를 확인하세요.', d_en: 'Check hydrogen charging rates and regional fees.', href: 'charging-fee-h2.html', emoji: '💧' },
        { t: '회원카드 신청·발급조회', t_en: 'Card Apply & Status', d: '충전 회원카드를 신청하고 발급 현황을 조회하세요.', d_en: 'Apply for a charging card and check issuance status.', href: 'charging-card.html?tab=apply', emoji: '💳' },
        { t: '내 충전요금 시뮬레이터', t_en: 'Fee Simulator', d: '충전 패턴을 입력해 월 예상 충전요금을 계산하세요.', d_en: 'Estimate monthly charging costs from your usage pattern.', href: 'charging-fee-simulator.html', emoji: '🧮' },
        /* [ISS-091 정정] driver 5→6: 민원 처리현황 추가 */
        { t: '민원 처리현황', t_en: 'My Complaints', d: '내가 접수한 민원·신청의 처리 상태를 한 곳에서 조회하세요.', d_en: 'Check the processing status of your complaints and requests.', href: 'inquiry-status.html', emoji: '📨' }
      ]
    },
    cpo: {
      title: '사업자·제조사를 위한 서비스', title_en: 'Services for Operators & Makers',
      cards: [
        /* [ISS-091] cpo 11→5 (제거: 공모/평가 8종 전부. 유지 3 + 신규 2) */
        { t: '지자체별 보조금 현황', t_en: 'Subsidies by Region', d: '지자체별 차종별 보조금 지원·집행 현황을 확인하세요.', d_en: 'Check subsidy support and disbursement by region.', href: 'subsidy-region.html', emoji: '📍' },
        { t: '공지사항', t_en: 'Notices', d: '공모·보급사업 관련 공지와 공고를 확인하세요.', d_en: 'See notices and announcements on programs and open calls.', href: 'notice-list.html', emoji: '📢' },
        { t: '데이터·통계', t_en: 'Data & Stats', d: '무공해차 보급·충전 인프라·보조금 집행 현황을 확인하세요.', d_en: 'See ZEV adoption, charging infrastructure, and subsidy status.', href: 'data.html', emoji: '📊' },
        { t: '공모 신청현황', t_en: 'My Applications', d: '여러 공모 사업의 신청 건과 진행 상태를 한 리스트에서 확인하세요.', d_en: 'Track your open-call applications and their status in one list.', href: 'mypage-contests.html', emoji: '📄' },
        { t: '민원 처리현황', t_en: 'My Complaints', d: '내가 접수한 민원·신청의 처리 상태를 한 곳에서 조회하세요.', d_en: 'Check the processing status of your complaints and requests.', href: 'inquiry-status.html', emoji: '📨' }
      ]
    },
    gov: {
      title: '지자체·공공기관을 위한 서비스', title_en: 'Services for Government & Public',
      cards: [
        /* [ISS-091] gov 12→6 (제거: subsidy-vehicles·subsidy-refund·public-bus·public-construction·charging-install-slow·notice-list·AI. 유지 5 + 신규 1) */
        { t: '지자체별 보조금 현황', t_en: 'Subsidies by Region', d: '지자체별 차종별 보조금 지원·집행 현황을 확인하세요.', d_en: 'Check subsidy support and disbursement by region.', href: 'subsidy-region.html', emoji: '📍' },
        { t: '보조금 안내·계산기', t_en: 'Subsidy Calculator', d: '차종·지역별 예상 보조금을 안내·계산하세요.', d_en: 'Estimate subsidies by vehicle and region.', href: 'subsidy-info.html', emoji: '🧮' },
        { t: '참여기업 현황', t_en: 'Participants', d: 'K-EV100 기업 무공해차 전환 참여 현황을 확인하세요.', d_en: 'See companies participating in the K-EV100 transition.', href: 'kev100-companies.html', emoji: '🏢' },
        { t: '요청자료', t_en: 'Requested Materials', d: '지자체·공공기관 대상 요청·공유 자료를 확인하세요.', d_en: 'Find materials shared with governments and public bodies.', href: 'info-library.html?tab=request', emoji: '📂' },
        { t: '데이터·통계', t_en: 'Data & Stats', d: '무공해차 보급·충전 인프라·보조금 집행 현황을 확인하세요.', d_en: 'See ZEV adoption, charging infrastructure, and subsidy status.', href: 'data.html', emoji: '📊' },
        { t: '공모 신청현황', t_en: 'My Applications', d: '여러 공모 사업의 신청 건과 진행 상태를 한 리스트에서 확인하세요.', d_en: 'Track your open-call applications and their status in one list.', href: 'mypage-contests.html', emoji: '📄' }
      ]
    }
  };

  var ARROW = '<svg class="arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg>';

  var track = document.getElementById('m02EvsvcTrack');
  var titleEl = document.getElementById('m02EvsvcTitle');
  var btns = Array.prototype.slice.call(document.querySelectorAll('.m02-persona-btn'));
  if (!track || !btns.length) return;

  function lang() { return (window.__i18n && window.__i18n.getLang) ? window.__i18n.getLang() : 'ko'; }
  function en() { return lang() === 'en'; }

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  function cardHTML(c) {
    var t = en() ? (c.t_en || c.t) : c.t;
    var d = en() ? (c.d_en || c.d) : c.d;
    return '<a class="m02-evsvc-card" href="' + esc(c.href) + '">' +
      '<strong>' + esc(t) + '</strong>' +
      '<p>' + esc(d) + '</p>' +
      ARROW +
      '<span class="emoji">' + c.emoji + '</span>' +
      '</a>';
  }

  function currentKey() {
    var on = btns.filter(function (b) { return b.classList.contains('is-active'); })[0] || btns[0];
    return on.getAttribute('data-persona');
  }

  function syncButtonLabels() {
    btns.forEach(function (b) {
      var k = b.getAttribute('data-persona');
      var lbl = BTN_LABEL[k];
      if (!lbl) return;
      var span = b.querySelector('span:last-child');
      if (span) span.textContent = en() ? lbl.en : lbl.ko;
    });
  }

  function render(key) {
    var data = PERSONAS[key];
    if (!data) return;
    track.style.transition = 'none';
    track.style.transform = 'translateX(0)';
    track.innerHTML = data.cards.map(cardHTML).join('');
    if (titleEl) titleEl.textContent = en() ? data.title_en : data.title;
  }

  function select(btn) {
    btns.forEach(function (b) {
      var on = b === btn;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    render(btn.getAttribute('data-persona'));
  }

  btns.forEach(function (btn) {
    btn.addEventListener('click', function () { select(btn); });
  });

  // 언어 전환 시 버튼 라벨·카드·섹션 제목 재렌더링
  window.addEventListener('langChange', function () { syncButtonLabels(); render(currentKey()); });

  syncButtonLabels();
  var initial = btns.filter(function (b) { return b.classList.contains('is-active'); })[0] || btns[0];
  select(initial);
})();
