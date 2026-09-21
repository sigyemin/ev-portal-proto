/* [ISS-130] 무공해차 빅데이터 플랫폼 자체 셸 — 헤더 + GNB + 푸터 주입.
   ★상용 현행판(ev.or.kr/evbd_web/ui/main, 로그인 세션 실측) 기준:
   GNB 4메뉴 = 무공해차 통합 현황 · 이상탐지 · 정기 보고서 · 데이터셋. 파란 그라데이션 GNB 바.
   각 페이지: <body class="bd-body" data-bd-active="{key}"> + #bd-header/#bd-footer 슬롯. */
(function () {
  var BD_MENU = [
    { t: '무공해차 통합 현황', h: 'bigdata-platform.html', key: 'main' },
    { t: '이상탐지', h: 'bigdata-anomaly.html', key: 'anomaly' },
    { t: '정기 보고서', h: 'bigdata-report.html', key: 'report' },
    { t: '데이터 스토어', h: 'bigdata-dataset.html', key: 'dataset' }
  ];

  function active() { return (document.body.getAttribute('data-bd-active') || ''); }

  function headerHtml() {
    var cur = active();
    var gnb = BD_MENU.map(function (m) {
      return '<li class="bdgnb__item' + (m.key === cur ? ' is-active' : '') + '">'
        + '<a href="' + m.h + '" class="bdgnb__link">' + m.t + '</a></li>';
    }).join('');
    return ''
      + '<div class="bd-header__top"><div class="bd-header__inner">'
      +   '<a href="bigdata-platform.html" class="bd-logo">'
      +     '<span class="bd-logo__mark">///  EV</span>'
      +     '<span class="bd-logo__txt">빅데이터 플랫폼</span>'
      +   '</a>'
      +   '<div class="bd-util">'
      +     '<span class="bd-util__timer">30:00 <button type="button" class="bd-util__ext">시간연장</button></span>'
      +     '<span class="bd-util__name">모비젠 님</span>'
      +     '<a href="index.html" class="bd-util__link">마이페이지</a>'
      +     '<a href="index.html" class="bd-util__link bd-util__link--strong">통합누리집 ↗</a>'
      +   '</div>'
      + '</div></div>'
      + '<nav class="bd-gnb" aria-label="빅데이터 플랫폼 메뉴"><div class="bd-gnb__inner">'
      +   '<ul class="bdgnb__list">' + gnb + '</ul>'
      + '</div></nav>';
  }

  function footerHtml() {
    return '<div class="bd-footer__inner">'
      + '<div class="bd-footer__logo"><b>EV</b> 빅데이터 플랫폼</div>'
      + '<div class="bd-footer__txt">한국환경공단 · (우)22689 인천광역시 서구 환경로 42(경서동 종합환경연구단지) · 대표전화 (누리집콜센터) 1661-0970'
      + '<br />Copyright © 2025 K-eco. All rights reserved. — 프로토타입</div>'
      + '</div>';
  }

  function inject() {
    var h = document.getElementById('bd-header'); if (h) h.innerHTML = headerHtml();
    var f = document.getElementById('bd-footer'); if (f) f.innerHTML = footerHtml();
    // 세션 연장 버튼(프로토): 안내만
    var ext = document.querySelector('.bd-util__ext');
    if (ext) ext.addEventListener('click', function () { alert('세션 시간이 연장되었습니다. (프로토타입)'); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', inject);
  else inject();

  window.BD_SHELL = { menu: BD_MENU };
})();
