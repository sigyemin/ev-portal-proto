/* =========================================================
   Shared Header / Footer — Figma EV 시안 그대로 반영
   - 상단 유틸리티 바: 로그인 | 회원가입 | KOR▼ | 큰글씨 ± | 업무지원시스템↗
   - 메인 GNB: 6개 메뉴 (무공해차 알아보기 / 구매 보조금 / 충전 인프라 /
                        데이터·통계 / 소통·지원 / 정보 자료실)
                        + 외부 시스템 링크: 업무지원시스템 (새창)
   - 풀와이드 메가메뉴: 좌측 Lv1 제목 + 우측 4컬럼 Lv2/Lv3 그리드
   ========================================================= */
(function () {
  const activeNav = window.__activeNav || 'purchase';

  // 로그인 상태 — 로컬 sessionStorage 기반 (데모용)
  let _loggedUser = null;
  try { _loggedUser = JSON.parse(sessionStorage.getItem('mp_user') || 'null'); } catch(e){}
  // 페이지에서 명시적으로 window.__loggedIn = true 선언한 경우도 로그인 상태로 간주
  if (!_loggedUser && window.__loggedIn) { _loggedUser = { name: '홍길동', kind: 'personal' }; }

  const utilAuthHTML = false ? `
      <div class="util-user-wrap" style="position:relative;display:inline-flex;align-items:center;height:100%;">
        <button type="button" class="util-user" id="utilUserBtn" aria-haspopup="true" aria-expanded="false" aria-controls="utilUserDropdown" data-i18n-aria="util.user.aria">
          <span class="util-user-avatar" aria-hidden="true"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 22a8 8 0 0 1 16 0"/></svg></span>
          <span class="util-user-name">${_loggedUser.name}</span><span data-i18n="util.user.suffix">님</span>
          <svg class="chev" width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 5 6 8 9 5"/></svg>
        </button>
        <div class="util-dropdown" id="utilUserDropdown" role="menu" aria-labelledby="utilUserBtn">
          <a href="mypage.html" role="menuitem">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            <span data-i18n="util.user.menu.home">마이페이지 홈</span>
          </a>
          <a href="mypage.html#info" role="menuitem">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            <span data-i18n="util.user.menu.info">내 정보 관리</span>
          </a>
          <a href="charging-card.html" role="menuitem">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="6" width="20" height="13" rx="2"/><line x1="2" y1="11" x2="22" y2="11"/></svg>
            <span data-i18n="util.user.menu.card">충전 카드 관리</span>
          </a>
          <a href="inquiry-status.html" role="menuitem">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
            <span data-i18n="util.user.menu.inquiry">나의 신청·민원</span>
          </a>
          <a href="mypage.html#mp-business" role="menuitem">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
            <span data-i18n="util.user.menu.business">업무지원시스템 이용신청</span>
          </a>
          <hr>
          <button type="button" class="du-logout" id="utilLogoutBtn" role="menuitem">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            <span data-i18n="util.user.menu.logout">로그아웃</span>
          </button>
        </div>
      </div>
  ` : `
      <a href="login.html" data-i18n="util.login">로그인</a>
      <span class="util-divider" aria-hidden="true"></span>
      <a href="signup.html" data-i18n="util.signup">회원가입</a>
      <span class="util-divider" aria-hidden="true"></span>
      <a href="mypage.html" class="util-mypage" id="utilMypageDemoBtn" data-i18n-aria="util.mypage.aria" aria-label="마이페이지 (프로토타입 자동 로그인)">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        <span data-i18n="util.mypage">마이페이지</span>
      </a>
  `;

  const headerHTML = `
  <div class="top-utility">
    <div class="container">
      <!-- [작업2] 유틸바 재배열: 로그인 → 언어설정 → 팝업 → 업무지원시스템 → 글자크기 -->
      ${utilAuthHTML}
      <span class="util-divider" aria-hidden="true"></span>
      <div class="util-lang-menu" id="utilLangMenu">
        <button class="util-lang" type="button" id="utilLangToggle" data-lang-trigger
                data-i18n-aria="lang.menu.aria" aria-label="언어 선택"
                aria-haspopup="true" aria-expanded="false" aria-controls="utilLangList">
          <svg class="util-lang-globe" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10"/>
            <line x1="2" y1="12" x2="22" y2="12"/>
            <path d="M12 2 a15 15 0 0 1 0 20 a15 15 0 0 1 0 -20"/>
          </svg>
          <span class="util-lang-current" id="utilLangCurrent">한국어</span>
          <svg class="util-lang-caret" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>
        <ul class="util-lang-list" id="utilLangList" role="menu" hidden>
          <li role="none"><a role="menuitem" href="#" data-lang="ko" data-i18n="lang.label.ko">한국어</a></li>
          <li role="none"><a role="menuitem" href="#" data-lang="en" data-i18n="lang.label.en">English</a></li>
        </ul>
      </div>
      <span class="util-divider" aria-hidden="true"></span>
      <button type="button" class="util-popup-btn" data-util-popup data-i18n-aria="util.popup.aria" aria-label="인덱스 팝업 다시 보기">
        <span data-i18n="util.popup" lang="en">POPUP</span>
      </button>
      <!-- [v0.16] 업무지원시스템: 상단 유틸바에서 제거 → GNB(정보 자료실 우측) 1뎁스로 이동 -->
      <span class="util-divider" aria-hidden="true"></span>
      <div class="util-font-size" role="group" data-i18n-aria="util.fontsize.label" aria-label="글자 크기 조절">
        <span class="label" aria-hidden="true" data-i18n="util.fontsize.label">글자크기</span>
        <button type="button" class="util-font-up" data-i18n-aria="util.fontsize.up.aria" aria-label="글자 키우기">+</button>
        <button type="button" class="util-font-down" data-i18n-aria="util.fontsize.down.aria" aria-label="글자 줄이기">−</button>
        <span class="sr-only" aria-live="polite" id="utilFontSizeLive"></span>
      </div>
    </div>
  </div>

  <header class="site-header" role="banner">
    <div class="container">
      <a href="index.html" class="brand" data-i18n-aria="brand.home.aria" aria-label="무공해차 통합누리집 홈">
        <span class="brand-logo" aria-hidden="true">
          <!-- v0.12 헤더 로고 교체: 공식 로고와 동일한 채움형 EV 박스 SVG 마크로 변경. 기존 CSS 마크업 보존(주석)
          <span class="brand-slashes"><span></span><span></span><span></span></span>
          <span class="brand-logo-text">EV</span>
          -->
          <svg class="brand-logo-svg" viewBox="0 0 92 30" role="img" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg"><g fill="#0C1E40"><polygon points="11,1 15,1 6,29 2,29"/><polygon points="20,1 24,1 15,29 11,29"/><polygon points="29,1 33,1 24,29 20,29"/><rect x="40" y="1" width="50" height="28" rx="4"/></g><text x="65" y="22" text-anchor="middle" font-family="Arial, 'Helvetica Neue', sans-serif" font-size="17" font-weight="700" letter-spacing="1" fill="#FFFFFF">EV</text></svg>
        </span>
        <span class="brand-title">
          <span class="brand-main" data-i18n="brand.main">무공해차 통합누리집</span>
          <span class="brand-sub" data-i18n="brand.sub" lang="en">Zero Emission Vehicle Portal</span>
        </span>
      </a>

      <nav data-i18n-aria="nav.aria" aria-label="주 메뉴">
        <ul class="main-nav" id="mainNav">
          <!-- 1. 구매·보조금 (IA Lv1) -->
          <li class="${activeNav === 'purchase' ? 'active' : ''}">
            <a href="subsidy-target.html" data-i18n="nav.purchase">구매·보조금</a>
            <div class="mega-menu" role="menu">
              <div class="mega-inner">
                <div class="mega-label" data-i18n="nav.purchase">구매·보조금</div>
                <div class="mega-columns">
                  <div class="mega-col">
                    <a href="subsidy-target.html" class="mega-col-title"><span data-i18n="mega.purchase.subsidy">무공해차 구매보조금 안내</span> <svg class="arrow" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 3 11 8 6 13"/></svg></a>
                    <ul>
                      <li><a href="subsidy-target.html" data-i18n="mega.purchase.subsidy.target">보조금 지원 대상·신청절차</a></li>
                      <li><a href="subsidy-region.html" data-i18n="mega.purchase.subsidy.region">지자체별 보조금 현황</a></li>
                      <li><a href="subsidy-local.html" data-i18n="mega.purchase.subsidy.local">지자체별 차종·모델 보조금</a></li>
                      <li><a href="subsidy-vehicles.html" data-i18n="mega.purchase.subsidy.vehicles">보조금 지급대상 차종</a></li>
                      <li><a href="subsidy-info.html" data-i18n="mega.purchase.subsidy.info">보조금 안내·계산기</a></li>
                      <li><a href="subsidy-refund.html" data-i18n="mega.purchase.subsidy.refund">보조금 환수금 안내·계산기</a></li>
                    </ul>
                  </div>
                  <div class="mega-col">
                    <a href="compare-tool.html" class="mega-col-title"><span data-i18n="mega.purchase.compare">차량 비교</span> <svg class="arrow" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 3 11 8 6 13"/></svg></a>
                    <ul>
                      <li><a href="compare-tool.html" data-i18n="mega.purchase.compare.tool">차종 비교 도구</a></li>
                      <li><a href="tax-grade.html" data-i18n="mega.purchase.tax.grade">내 차 저공해 등급 확인</a></li>
                      <!-- v0.12 IA 재편: 총소유비용(TCO) 계산 삭제(6). 원본 보존(주석)
                      <li><a href="compare-tco.html" data-i18n="mega.purchase.compare.tco">총소유비용(TCO) 계산</a></li>
                      -->
                    </ul>
                  </div>
                  <div class="mega-col">
                    <a href="public-ev.html" class="mega-col-title"><span data-i18n="mega.purchase.public">공모·신청</span> <svg class="arrow" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 3 11 8 6 13"/></svg></a>
                    <ul>
                      <li><a href="public-ev.html" data-i18n="mega.purchase.public.ev">전기자동차 수행자 선정 평가 신청</a></li>
                      <li><a href="public-bus.html" data-i18n="mega.purchase.public.bus">전기승합차 공모 신청</a></li>
                      <li><a href="public-construction.html" data-i18n="mega.purchase.public.const">전기지게차 공모 신청</a></li>
                      <li><a href="public-moto.html" data-i18n="mega.purchase.public.moto">전기이륜차 수행자 선정 평가 신청</a></li>
                      <li><a href="public-contact.html" data-i18n="mega.purchase.public.contact">지자체 문의처 안내</a></li>
                    </ul>
                  </div>
                  <div class="mega-col">
                    <a href="kev100-about.html" class="mega-col-title"><span data-i18n="mega.purchase.kev100">K-EV100 (기업전환)</span> <svg class="arrow" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 3 11 8 6 13"/></svg></a>
                    <ul>
                      <li><a href="kev100-about.html" data-i18n="mega.purchase.kev100.about">K-EV100 소개</a></li>
                      <li><a href="kev100-process.html" data-i18n="mega.purchase.kev100.process">참여 방법·절차</a></li>
                      <li><a href="kev100-companies.html" data-i18n="mega.purchase.kev100.companies">참여기업 현황</a></li>
                      <li><a href="kev100-benefits.html" data-i18n="mega.purchase.kev100.benefits">참여 혜택·지원</a></li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </li>

          <!-- 2. 충전소·요금 정보 (IA Lv1) -->
          <li class="${activeNav === 'charging' ? 'active' : ''}">
            <a href="charging-find.html?tab=map" data-i18n="nav.charging">충전소·요금 정보</a>
            <div class="mega-menu" role="menu">
              <div class="mega-inner">
                <div class="mega-label" data-i18n="nav.charging">충전소·요금 정보</div>
                <div class="mega-columns mega-columns-5">
                  <div class="mega-col">
                    <a href="charging-find.html?tab=map" class="mega-col-title"><span data-i18n="mega.charging.find">충전소 찾기</span> <svg class="arrow" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 3 11 8 6 13"/></svg></a>
                    <ul>
                      <li><a href="charging-find.html?tab=map" data-i18n="mega.charging.find.map">통합 지도 (전기+수소)</a></li>
                      <li><a href="charging-find.html?tab=near" data-i18n="mega.charging.find.near">내 주변 충전소</a></li>
                    </ul>
                  </div>
                  <div class="mega-col">
                    <a href="charging-fee.html?tab=ev" class="mega-col-title"><span data-i18n="mega.charging.fee">충전 요금 안내</span> <svg class="arrow" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 3 11 8 6 13"/></svg></a>
                    <ul>
                      <li><a href="charging-fee.html?tab=ev" data-i18n="mega.charging.fee.ev">전기차 충전요금 안내</a></li>
                      <li><a href="charging-fee-h2.html" data-i18n="mega.charging.fee.h2">수소차 충전요금 안내</a></li>
                      <li><a href="charging-fee-simulator.html" data-i18n="mega.charging.fee.sim">내 충전요금 시뮬레이터</a></li>
                    </ul>
                  </div>
                  <div class="mega-col">
                    <a href="charging-card.html" class="mega-col-title"><span data-i18n="mega.charging.card">회원카드 관리</span> <svg class="arrow" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 3 11 8 6 13"/></svg></a>
                    <ul>
                      <li><a href="charging-card.html?tab=mycard" data-i18n="mega.charging.card.list">내 회원카드</a></li>
                      <li><a href="charging-card.html?tab=history" data-i18n="mega.charging.card.history">충전요금 조회</a></li>
                    </ul>
                  </div>
                  <div class="mega-col">
                    <a href="charging-install-slow.html" class="mega-col-title"><span data-i18n="mega.charging.install">충전시설 설치</span> <svg class="arrow" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 3 11 8 6 13"/></svg></a>
                    <ul>
                      <li><a href="charging-install-slow.html" data-i18n="mega.charging.install.slow">공용 완속충전시설 직접신청</a></li>
                      <li><a href="charging-install-contest.html" data-i18n="mega.charging.install.contest">공용 완속/급속·중속 충전시설 운영사·제조사 공모 신청</a></li>
                      <li><a href="charging-install-brand.html" data-i18n="mega.charging.install.brand">지역별 무공해차 전환 브랜드 사업 공모 신청</a></li>
                      <li><a href="charging-install-moto.html" data-i18n="mega.charging.install.moto">지역별 무공해차 전환 브랜드 사업 (BSS) 공모 신청</a></li>
                      <li><a href="charging-install-products.html" data-i18n="mega.charging.install.products">완속충전기 제품 안내</a></li>
                    </ul>
                  </div>
                  <div class="mega-col">
                    <a href="charging-help.html?tab=report" class="mega-col-title"><span data-i18n="mega.charging.h2">수소충전소 Help Desk</span> <svg class="arrow" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 3 11 8 6 13"/></svg></a>
                    <ul>
                      <li><a href="charging-help.html?tab=report" data-i18n="mega.charging.h2.report">수소충전소 장애 신고</a></li>
                      <li><a href="charging-help.html?tab=status" data-i18n="mega.charging.h2.status">운영 현황 안내</a></li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </li>

          <!-- 3. 데이터·통계 (IA Lv1) -->
          <li class="${activeNav === 'data' ? 'active' : ''}">
            <a href="data.html" data-i18n="nav.data">데이터·통계</a>
            <div class="mega-menu" role="menu">
              <div class="mega-inner">
                <div class="mega-label" data-i18n="nav.data">데이터·통계</div>
                <div class="mega-columns">
                  <div class="mega-col">
                    <a href="data.html#supply" class="mega-col-title"><span data-i18n="mega.data.dashboard">통계 대시보드</span> <svg class="arrow" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 3 11 8 6 13"/></svg></a>
                    <ul>
                      <li><a href="data.html#supply" data-i18n="mega.data.supply">무공해차 보급 현황</a></li>
                      <li><a href="data.html#infra" data-i18n="mega.data.infra">충전 인프라 현황</a></li>
                      <li><a href="data.html#subsidy" data-i18n="mega.data.subsidy">보조금 집행 현황</a></li>
                    </ul>
                  </div>
                  <!-- [삭제] '시장·정책 동향' 컬럼 — 헤더/햄버거/사이트맵 제외. 원본 보존:
                  <div class="mega-col">
                    <a href="data.html#trend-market" class="mega-col-title"><span data-i18n="mega.data.trend">시장·정책 동향</span></a>
                    <ul>
                      <li><a href="data.html#trend-market" data-i18n="mega.data.trend.market">무공해차 시장 동향</a></li>
                      <li><a href="data.html#trend-policy" data-i18n="mega.data.trend.policy">정책 추진 현황</a></li>
                      <li><a href="data.html#trend-region" data-i18n="mega.data.trend.region">지역별 보급 현황</a></li>
                    </ul>
                  </div>
                  -->
                  <!-- v0.12 IA 재편: '공개 데이터' 컬럼 삭제(7). 공개 데이터 목록은 소통지원>알림공지>공개자료로 통합(8). 원본 보존(주석)
                  <div class="mega-col">
                    <a href="data.html#open-data" class="mega-col-title"><span data-i18n="mega.data.open">공개 데이터</span> <svg class="arrow" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 3 11 8 6 13"/></svg></a>
                    <ul>
                      <li><a href="data.html#open-data" data-i18n="mega.data.open.list">공개 데이터 목록</a></li>
                      <li><a href="notice-data.html" data-i18n="mega.data.open.download">데이터 다운로드</a></li>
                    </ul>
                  </div>
                  -->
                </div>
              </div>
            </div>
          </li>

          <!-- 4. 소통·지원 (IA Lv1) -->
          <li class="${activeNav === 'community' ? 'active' : ''}">
            <a href="notice-list.html" data-i18n="nav.community">소통·지원</a>
            <div class="mega-menu" role="menu">
              <div class="mega-inner">
                <div class="mega-label" data-i18n="nav.community">소통·지원</div>
                <div class="mega-columns">
                  <div class="mega-col">
                    <a href="index.html?ai=personal#aiSectionAnchor" class="mega-col-title"><span data-i18n="mega.community.ai">AI 헬프데스크</span> <svg class="arrow" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 3 11 8 6 13"/></svg></a>
                    <ul>
                      <li><a href="index.html?ai=personal#aiSectionAnchor" data-i18n="mega.community.ai.personal">AI 맞춤 상담</a></li>
                      <li><a href="index.html?ai=subsidy#aiSectionAnchor" data-i18n="mega.community.ai.subsidy">보조금 큐레이터</a></li>
                      <li><a href="index.html?ai=charge#aiSectionAnchor" data-i18n="mega.community.ai.charge">장애 대응 안내</a></li>
                    </ul>
                  </div>
                  <div class="mega-col">
                    <a href="notice-list.html" class="mega-col-title"><span data-i18n="mega.community.notice">알림·공지</span> <svg class="arrow" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 3 11 8 6 13"/></svg></a>
                    <ul>
                      <li><a href="notice-list.html" data-i18n="mega.community.notice.list">공지사항</a></li>
                      <li><a href="notice-press.html" data-i18n="mega.community.notice.press">보도자료</a></li>
                      <li><a href="notice-promo.html" data-i18n="mega.community.notice.promo">홍보자료</a></li>
                      <li><a href="notice-data.html" data-i18n="mega.community.notice.data">공개자료</a></li>
                    </ul>
                  </div>
                  <div class="mega-col">
                    <a href="inquiry-faq.html" class="mega-col-title"><span data-i18n="mega.community.inquiry">민원·문의</span> <svg class="arrow" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 3 11 8 6 13"/></svg></a>
                    <ul>
                      <li><a href="inquiry-faq.html" data-i18n="mega.community.inquiry.faq">FAQ (자주 묻는 질문)</a></li>
                      <li><a href="inquiry-qna.html" data-i18n="mega.community.inquiry.qna">질의응답(건의사항)</a></li>
                      <li><a href="inquiry-complaint.html" data-i18n="mega.community.inquiry.complaint">불편 민원 신고</a></li>
                      <li><a href="inquiry-report.html" data-i18n="mega.community.inquiry.report">보조금 부적정집행 신고</a></li>
                      <li><a href="inquiry-charge-discount.html" data-i18n="mega.community.inquiry.discount">충전요금 할인 미적용 신고</a></li>
                      <li><a href="inquiry-status.html" data-i18n="mega.community.inquiry.status">민원 처리 현황 조회</a></li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </li>

          <!-- 5. 정보 자료실 (IA Lv1) -->
          <li class="${activeNav === 'info' ? 'active' : ''}">
            <a href="info-regulation.html#law" data-i18n="nav.info">정보 자료실</a>
            <div class="mega-menu" role="menu">
              <div class="mega-inner">
                <div class="mega-label" data-i18n="nav.info">정보 자료실</div>
                <div class="mega-columns">
                  <div class="mega-col">
                    <a href="info-regulation.html#law" class="mega-col-title"><span data-i18n="mega.info.regulation">규정·가이드라인</span> <svg class="arrow" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 3 11 8 6 13"/></svg></a>
                    <ul>
                      <li><a href="info-regulation.html?tab=law" data-i18n="mega.info.regulation.law">법령·지침·규정·가이드라인</a></li>
                      <li><a href="info-regulation.html?tab=cert" data-i18n="mega.info.regulation.cert">인증 기준 안내</a></li>
                    </ul>
                  </div>
                  <div class="mega-col">
                    <a href="info-library.html" class="mega-col-title"><span data-i18n="mega.info.library">자료실</span> <svg class="arrow" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 3 11 8 6 13"/></svg></a>
                    <ul>
                      <li><a href="info-library.html?tab=general" data-i18n="mega.info.library.general">일반 자료실</a></li>
                      <li><a href="info-library.html?tab=form" data-i18n="mega.info.library.form">서식 다운로드</a></li>
                      <li><a href="info-library.html?tab=manual" data-i18n="mega.info.library.manual">사용자 매뉴얼</a></li>
                      <li><a href="info-library.html?tab=request" data-i18n="mega.info.library.request">요청자료</a></li>
                    </ul>
                  </div>
                  <div class="mega-col">
                    <a href="info-encyclopedia.html?tab=beginner" class="mega-col-title"><span data-i18n="mega.info.encyclopedia">무공해차 백과</span> <svg class="arrow" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 3 11 8 6 13"/></svg></a>
                    <ul>
                      <li><a href="info-encyclopedia.html?tab=beginner" data-i18n="mega.info.enc.beginner">초보자 가이드</a></li>
                      <li><a href="info-encyclopedia.html?tab=ev" data-i18n="mega.info.enc.ev">전기차 소개</a></li>
                      <li><a href="info-encyclopedia.html?tab=h2" data-i18n="mega.info.enc.h2">수소차 소개</a></li>
                      <li><a href="info-encyclopedia.html?tab=battery" data-i18n="mega.info.enc.battery">배터리 정보</a></li>
                      <li><a href="info-encyclopedia.html?tab=glossary" data-i18n="mega.info.enc.glossary">용어사전</a></li>
                    </ul>
                  </div>
                  <div class="mega-col">
                    <a href="sitemap.html" class="mega-col-title"><span data-i18n="mega.info.site">사이트 안내</span> <svg class="arrow" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 3 11 8 6 13"/></svg></a>
                    <ul>
                      <li><a href="sitemap.html" data-i18n="mega.info.site.sitemap">사이트맵</a></li>
                      <li><a href="info-privacy.html" data-i18n="mega.info.site.privacy">개인정보처리방침</a></li>
                      <li><a href="info-terms.html" data-i18n="mega.info.site.terms">이용약관</a></li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </li>

          <!-- 6. 업무지원시스템 (v0.16: 상단 유틸바 → GNB 1뎁스 · 정보 자료실 우측 · 새 창) -->
          <li class="nav-external">
            <a href="biz-portal.html" target="_blank" rel="noopener" data-i18n-aria="nav.external.aria" aria-label="업무지원시스템 (새 창)">
              <span data-i18n="nav.external">업무지원시스템</span>
              <span class="nav-external-ico" aria-hidden="true"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3 H3 V13 H13 V10"/><polyline points="9 3 13 3 13 7"/><line x1="13" y1="3" x2="7" y2="9"/></svg></span>
            </a>
          </li>
        </ul>
      </nav>

      <div class="header-actions">
        <button class="btn btn-icon-only" id="fullmenu-open" data-i18n-aria="header.fullmenu.open.aria" aria-label="전체 메뉴 열기" type="button">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="4" y1="7" x2="20" y2="7"></line><line x1="4" y1="12" x2="20" y2="12"></line><line x1="4" y1="17" x2="20" y2="17"></line></svg>
        </button>
      </div>
    </div>
  </header>
  `;

  // 전체 메뉴 오버레이 & 사이트맵 페이지 공통 데이터 (IA 엑셀 대민용_IA 시트 그대로)
  // V3.2: i18n 키 기반 — { tKey, items: [[label, href, itemKey]] }
  const sitemapSections = [
    { tKey: 'nav.purchase', cols: [
      { tKey: 'mega.purchase.subsidy', items: [['보조금 지원 대상·신청절차','subsidy-target.html','mega.purchase.subsidy.target'],['지자체별 보조금 현황','subsidy-region.html','mega.purchase.subsidy.region'],['지자체별 차종·모델 보조금','subsidy-local.html','mega.purchase.subsidy.local'],['보조금 지급대상 차종','subsidy-vehicles.html','mega.purchase.subsidy.vehicles'],['보조금 안내·계산기','subsidy-info.html','mega.purchase.subsidy.info'],['보조금 환수금 안내·계산기','subsidy-refund.html','mega.purchase.subsidy.refund']] },
      { tKey: 'mega.purchase.compare', items: [['차종 비교 도구','compare-tool.html','mega.purchase.compare.tool'],['내 차 저공해 등급 확인','tax-grade.html','mega.purchase.tax.grade'] /* v0.12 TCO 계산 삭제(6): ,['총소유비용(TCO) 계산','compare-tco.html','mega.purchase.compare.tco'] */] },
      { tKey: 'mega.purchase.public', items: [['전기자동차 수행자 선정 평가 신청','public-ev.html','mega.purchase.public.ev'],['전기승합차 공모 신청','public-bus.html','mega.purchase.public.bus'],['전기지게차 공모 신청','public-construction.html','mega.purchase.public.const'],['전기이륜차 수행자 선정 평가 신청','public-moto.html','mega.purchase.public.moto'],['지자체 문의처 안내','public-contact.html','mega.purchase.public.contact']] },
      { tKey: 'mega.purchase.kev100', items: [['K-EV100 소개','kev100-about.html','mega.purchase.kev100.about'],['참여 방법·절차','kev100-process.html','mega.purchase.kev100.process'],['참여기업 현황','kev100-companies.html','mega.purchase.kev100.companies'],['참여 혜택·지원','kev100-benefits.html','mega.purchase.kev100.benefits']] },
    ]},
    { tKey: 'nav.charging', cols: [
      { tKey: 'mega.charging.find', items: [['통합 지도 (전기+수소)','charging-find.html?tab=map','mega.charging.find.map'],['내 주변 충전소','charging-find.html?tab=near','mega.charging.find.near']] },
      { tKey: 'mega.charging.fee', items: [['전기차 충전요금 안내','charging-fee.html?tab=ev','mega.charging.fee.ev'],['수소차 충전요금 안내','charging-fee-h2.html','mega.charging.fee.h2'],['내 충전요금 시뮬레이터','charging-fee-simulator.html','mega.charging.fee.sim']] },
      { tKey: 'mega.charging.card', items: [['내 회원카드','charging-card.html?tab=mycard','mega.charging.card.list'],['충전요금 조회','charging-card.html?tab=history','mega.charging.card.history']] },
      { tKey: 'mega.charging.install', items: [['공용 완속충전시설 직접신청','charging-install-slow.html','mega.charging.install.slow'],['공용 완속/급속·중속 충전시설 운영사·제조사 공모 신청','charging-install-contest.html','mega.charging.install.contest'],['지역별 무공해차 전환 브랜드 사업 공모 신청','charging-install-brand.html','mega.charging.install.brand'],['지역별 무공해차 전환 브랜드 사업 (BSS) 공모 신청','charging-install-moto.html','mega.charging.install.moto'],['완속충전기 제품 안내','charging-install-products.html','mega.charging.install.products']] },
      { tKey: 'mega.charging.h2', items: [['수소충전소 장애 신고','charging-help.html?tab=report','mega.charging.h2.report'],['운영 현황 안내','charging-help.html?tab=status','mega.charging.h2.status']] },
    ]},
    { tKey: 'nav.data', cols: [
      { tKey: 'mega.data.dashboard', items: [['무공해차 보급 현황','data.html#supply','mega.data.supply'],['충전 인프라 현황','data.html#infra','mega.data.infra'],['보조금 집행 현황','data.html#subsidy','mega.data.subsidy']] },
      /* [삭제] '시장·정책 동향' 영역 — 헤더/햄버거/사이트맵 제외. 원본 보존: { tKey: 'mega.data.trend', items: [['무공해차 시장 동향','data.html#trend-market','mega.data.trend.market'],['정책 추진 현황','data.html#trend-policy','mega.data.trend.policy'],['지역별 보급 현황','data.html#trend-region','mega.data.trend.region']] }, */
      /* v0.12 IA 재편: 공개 데이터 컬럼 삭제(7) — 공개 데이터 목록은 소통지원>알림공지>공개자료로 통합(8). 원본 보존: { tKey: 'mega.data.open', items: [['공개 데이터 목록','data.html#open-data','mega.data.open.list'],['데이터 다운로드','data.html#open-data','mega.data.open.download']] }, */
    ]},
    { tKey: 'nav.community', cols: [
      { tKey: 'mega.community.ai', items: [['AI 맞춤 상담','index.html?ai=personal#aiSectionAnchor','mega.community.ai.personal'],['보조금 큐레이터','index.html?ai=subsidy#aiSectionAnchor','mega.community.ai.subsidy'],['장애 대응 안내','index.html?ai=charge#aiSectionAnchor','mega.community.ai.charge']] },
      { tKey: 'mega.community.notice', items: [['공지사항','notice-list.html','mega.community.notice.list'],['보도자료','notice-press.html','mega.community.notice.press'],['홍보자료','notice-promo.html','mega.community.notice.promo'],['공개자료','notice-data.html','mega.community.notice.data']] },
      { tKey: 'mega.community.inquiry', items: [['FAQ (자주 묻는 질문)','inquiry-faq.html','mega.community.inquiry.faq'],['질의응답(건의사항)','inquiry-qna.html','mega.community.inquiry.qna'],['불편 민원 신고','inquiry-complaint.html','mega.community.inquiry.complaint'],['보조금 부적정집행 신고','inquiry-report.html','mega.community.inquiry.report'],['충전요금 할인 미적용 신고','inquiry-charge-discount.html','mega.community.inquiry.discount'],['민원 처리 현황 조회','inquiry-status.html','mega.community.inquiry.status']] },
    ]},
    { tKey: 'nav.info', cols: [
      { tKey: 'mega.info.regulation', items: [['법령·지침·규정·가이드라인','info-regulation.html?tab=law','mega.info.regulation.law'],['인증 기준 안내','info-regulation.html?tab=cert','mega.info.regulation.cert']] },
      { tKey: 'mega.info.library', items: [['일반 자료실','info-library.html?tab=general','mega.info.library.general'],['서식 다운로드','info-library.html?tab=form','mega.info.library.form'],['사용자 매뉴얼','info-library.html?tab=manual','mega.info.library.manual'],['요청자료','info-library.html?tab=request','mega.info.library.request']] },
      { tKey: 'mega.info.encyclopedia', items: [['초보자 가이드','info-encyclopedia.html?tab=beginner','mega.info.enc.beginner'],['전기차 소개','info-encyclopedia.html?tab=ev','mega.info.enc.ev'],['수소차 소개','info-encyclopedia.html?tab=h2','mega.info.enc.h2'],['배터리 정보','info-encyclopedia.html?tab=battery','mega.info.enc.battery'],['용어사전','info-encyclopedia.html?tab=glossary','mega.info.enc.glossary']] },
      { tKey: 'mega.info.site', items: [['사이트맵','sitemap.html','mega.info.site.sitemap'],['개인정보처리방침','info-privacy.html','mega.info.site.privacy'],['이용약관','info-terms.html','mega.info.site.terms']] },
    ]},
  ];

  // Lv1 라벨은 "공백(space)"에서만 한 번 줄바꿈 (한국어 라벨용)
  const formatLabel = (t) => t.includes(' ') ? t.replace(/\s+/, '<br>') : t;

  // 각 sitemap row 라벨은 한글 fallback(즉시 표시) + data-i18n 키 부여 → i18n.applyLang이 영문 치환
  // 참고: 줄바꿈은 한글 기준이므로, 영문 전환 시 i18n이 textContent로 다시 채우면 줄바꿈은 자동 해제됨(영문은 보통 한 줄)
  const FALLBACK_LABELS = {
    'nav.purchase':  '구매·보조금',
    'nav.charging':  '충전소·요금 정보',
    'nav.data':      '데이터·통계',
    'nav.community': '소통·지원',
    'nav.info':      '정보 자료실'
  };

  const buildSitemapRows = () => sitemapSections.map(sec => {
    const fallback = FALLBACK_LABELS[sec.tKey] || sec.tKey;
    return `
    <div class="sitemap-row">
      <div class="sitemap-row-label" data-i18n-html="${sec.tKey}">${formatLabel(fallback)}</div>
      <div class="sitemap-row-cols">
        ${sec.cols.map(c => `
          <div class="sitemap-col">
            <div class="sitemap-col-title"><span data-i18n="${c.tKey}">${c.tKey}</span> <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 3 11 8 6 13"/></svg></div>
            <ul>
              ${c.items.map(([label, href, itemKey]) => `<li><a href="${href}" data-i18n="${itemKey}">${label}</a></li>`).join('')}
            </ul>
          </div>
        `).join('')}
      </div>
    </div>
  `;
  }).join('');

  const fullmenuHTML = `
  <div class="fullmenu-overlay" id="fullmenuOverlay" role="dialog" aria-modal="true" data-i18n-aria="header.fullmenu.aria" aria-label="전체 메뉴">
    <div class="fullmenu-header">
      <a href="index.html" class="brand" data-i18n-aria="brand.home.aria" aria-label="무공해차 통합누리집 홈" style="text-decoration:none;">
        <span class="brand-logo" aria-hidden="true">
          <!-- v0.12 로고 통일: 헤더와 동일 SVG 마크. 기존 마크업 보존(주석)
          <span class="brand-slashes"><span></span><span></span><span></span></span>
          <span class="brand-logo-text">EV</span>
          -->
          <svg class="brand-logo-svg" viewBox="0 0 92 30" role="img" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg"><g fill="#0C1E40"><polygon points="11,1 15,1 6,29 2,29"/><polygon points="20,1 24,1 15,29 11,29"/><polygon points="29,1 33,1 24,29 20,29"/><rect x="40" y="1" width="50" height="28" rx="4"/></g><text x="65" y="22" text-anchor="middle" font-family="Arial, 'Helvetica Neue', sans-serif" font-size="17" font-weight="700" letter-spacing="1" fill="#FFFFFF">EV</text></svg>
        </span>
        <span class="brand-title">
          <span class="brand-main" data-i18n="brand.main">무공해차 통합누리집</span>
          <span class="brand-sub" data-i18n="brand.fullmenu.sub">전체 메뉴</span>
        </span>
      </a>
      <button class="fullmenu-close" id="fullmenu-close" data-i18n-aria="header.fullmenu.close.aria" aria-label="전체 메뉴 닫기" type="button">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
    <div class="fullmenu-body">
      ${buildSitemapRows()}
    </div>
  </div>
  `;

  const footerHTML = `
  <footer class="site-footer ref-footer" role="contentinfo">
    <div class="ref-footer-inner">
      <!-- 상단 라인: 브랜드(좌) + 정책 링크(우) -->
      <div class="ref-footer-top">
        <div class="ref-footer-brand">
          <a href="index.html" class="brand" data-i18n-aria="brand.home.aria" aria-label="무공해차 통합누리집 홈">
            <span class="brand-logo" aria-hidden="true">
              <!-- v0.12 로고 통일(다크 푸터용 화이트 변형): 흰 마크 + 네이비 EV. 기존 마크업 보존(주석)
              <span class="brand-slashes"><span></span><span></span><span></span></span>
              <span class="brand-logo-text">EV</span>
              -->
              <svg class="brand-logo-svg" viewBox="0 0 92 30" role="img" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg"><g fill="#FFFFFF"><polygon points="11,1 15,1 6,29 2,29"/><polygon points="20,1 24,1 15,29 11,29"/><polygon points="29,1 33,1 24,29 20,29"/><rect x="40" y="1" width="50" height="28" rx="4"/></g><text x="65" y="22" text-anchor="middle" font-family="Arial, 'Helvetica Neue', sans-serif" font-size="17" font-weight="700" letter-spacing="1" fill="#0C1E40">EV</text></svg>
            </span>
            <span class="brand-title">
              <span class="brand-main" data-i18n="brand.main">무공해차 통합누리집</span>
            </span>
          </a>
        </div>
        <nav class="ref-footer-policy" data-i18n-aria="footer.policy.aria" aria-label="약관·정책 바로가기">
          <a class="strong" href="info-privacy.html" data-i18n="footer.policy.privacy">개인정보처리방침</a>
          <a href="info-email-policy.html" data-i18n="footer.policy.nospam">이메일 무단수집거부</a>
          <a href="info-cctv.html" data-i18n="footer.policy.cctv">영상정보처리기기 운영관리지침</a>
          <a href="inquiry-complaint.html" data-i18n="footer.policy.complaint">불편민원신고센터</a>
        </nav>
      </div>

      <!-- 하단 라인: 사업자정보(좌) + 파트너 기관(우) -->
      <div class="ref-footer-bottom">
        <div class="ref-footer-info">
          <p data-i18n="footer.address">(22689) 인천광역시 서구 환경로 42(오류동 종합환경연구단지)</p>
          <p data-i18n="footer.callcenter">대표전화 : (누리집콜센터) 1661-0970</p>
          <p data-i18n="footer.cardcenter">급속충전시설 이용관련문의 및 회원카드 발급문의 한국자동차환경협회 : 1661-9408</p>
          <p class="ref-footer-copy" data-i18n="footer.copy">Copyright 2026. KECO All rights reserved.</p>
        </div>

        <nav class="ref-footer-partners" data-i18n-aria="footer.partners.aria" aria-label="관련 기관 바로가기">
        <a href="https://www.keco.or.kr" class="partner-logo" target="_blank" rel="noopener noreferrer">
          <svg viewBox="0 0 64 64" width="44" height="44" fill="none" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
            <circle cx="32" cy="32" r="26" fill="#fff" stroke="#5B9BD5" stroke-width="2"/>
            <path d="M22 32c0-8 5-14 10-14s10 6 10 14-5 14-10 14" fill="#5B9BD5" stroke="#5B9BD5" stroke-width="1.5"/>
            <circle cx="26" cy="26" r="2.5" fill="#fff"/>
          </svg>
          <span data-i18n="footer.partner.keco">한국환경공단</span>
          <span class="sr-only" data-i18n="footer.partner.newwindow"> (새 창)</span>
        </a>
        <a href="https://www.me.go.kr" class="partner-logo" target="_blank" rel="noopener noreferrer">
          <svg viewBox="0 0 64 64" width="44" height="44" fill="none" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
            <rect x="6" y="6" width="52" height="52" rx="6" fill="#fff" stroke="#C0392B" stroke-width="1.6"/>
            <path d="M32 16 L26 32 L20 24 L14 40 H50 L44 28 L38 36 Z" fill="#C0392B"/>
            <circle cx="46" cy="20" r="4" fill="#F39C12"/>
          </svg>
          <span data-i18n="footer.partner.me">기후에너지환경부</span>
          <span class="sr-only" data-i18n="footer.partner.newwindow"> (새 창)</span>
        </a>
        <a href="https://www.kaea.or.kr" class="partner-logo" target="_blank" rel="noopener noreferrer">
          <svg viewBox="0 0 64 64" width="44" height="44" fill="none" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
            <circle cx="32" cy="32" r="26" fill="#fff" stroke="#2C3E50" stroke-width="2"/>
            <path d="M18 36c0-4 4-10 14-10s14 6 14 10" fill="#2C3E50"/>
            <circle cx="24" cy="40" r="3.5" fill="#fff" stroke="#2C3E50" stroke-width="1.5"/>
            <circle cx="40" cy="40" r="3.5" fill="#fff" stroke="#2C3E50" stroke-width="1.5"/>
            <path d="M22 28h20" stroke="#2C3E50" stroke-width="1.5"/>
          </svg>
          <span data-i18n="footer.partner.kaea">한국자동차환경협회</span>
          <span class="sr-only" data-i18n="footer.partner.newwindow"> (새 창)</span>
        </a>
        <a href="https://www.wa.or.kr" class="partner-logo" target="_blank" rel="noopener noreferrer">
          <svg viewBox="0 0 64 64" width="44" height="44" fill="none" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
            <circle cx="32" cy="32" r="28" fill="#fff" stroke="#16A085" stroke-width="2"/>
            <text x="32" y="30" text-anchor="middle" fill="#16A085" font-weight="800" font-size="18" font-family="Arial" lang="en">WA</text>
            <text x="32" y="44" text-anchor="middle" fill="#16A085" font-weight="700" font-size="7" font-family="Arial" lang="en">WEB 접근성</text>
          </svg>
          <span data-i18n="footer.partner.wa">WA 웹접근성</span>
          <span class="sr-only" data-i18n="footer.partner.newwindow"> (새 창)</span>
        </a>
        </nav>
      </div>
    </div>
  </footer>
  `;

  const headerSlot = document.getElementById('header-slot');
  const footerSlot = document.getElementById('footer-slot');
  // 임베드 모드(백과 허브 iframe): 헤더/푸터를 아예 주입하지 않는다.
  var __embedDoc = false;
  try { __embedDoc = new URLSearchParams(location.search).get('embed') === '1'; } catch (e) {}
  if (__embedDoc) {
    if (headerSlot) headerSlot.remove();
    if (footerSlot) footerSlot.remove();
  } else {
    if (headerSlot) headerSlot.outerHTML = headerHTML + fullmenuHTML;
    if (footerSlot) footerSlot.outerHTML = footerHTML;
  }

  // 전체 메뉴 오버레이 제어
  const overlay = document.getElementById('fullmenuOverlay');
  const openBtn = document.getElementById('fullmenu-open');
  const closeBtn = document.getElementById('fullmenu-close');
  // 모바일(≤640px)에서 숨겨지는 상단 글로벌 메뉴(로그인·언어·마이페이지·업무지원 등)를
  // 전체 메뉴 오버레이를 열 때 본문 최상단으로 옮겨 함께 노출한다(닫으면 원위치 복원).
  const topUtil = document.querySelector('.top-utility');
  const fullBody = overlay ? overlay.querySelector('.fullmenu-body') : null;
  let utilHome = null, utilNext = null;
  const phoneMq = () => window.matchMedia('(max-width: 640px)').matches;
  function foldGlobalMenu() {
    if (!topUtil || !fullBody || !phoneMq() || topUtil.closest('.fullmenu-overlay')) return;
    utilHome = topUtil.parentNode; utilNext = topUtil.nextSibling;
    const wrap = document.createElement('div');
    wrap.className = 'fullmenu-global';
    wrap.appendChild(topUtil);
    fullBody.insertBefore(wrap, fullBody.firstChild);
  }
  function unfoldGlobalMenu() {
    if (!topUtil || !utilHome) return;
    const wrap = topUtil.closest('.fullmenu-global');
    utilHome.insertBefore(topUtil, utilNext);
    if (wrap) wrap.remove();
    utilHome = utilNext = null;
  }
  function openOverlay() { foldGlobalMenu(); overlay.classList.add('show'); document.body.style.overflow = 'hidden'; }
  function closeOverlay() { overlay.classList.remove('show'); document.body.style.overflow = ''; unfoldGlobalMenu(); }
  if (openBtn && overlay) {
    openBtn.addEventListener('click', openOverlay);
  }
  if (closeBtn && overlay) {
    closeBtn.addEventListener('click', closeOverlay);
  }
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay && overlay.classList.contains('show')) closeOverlay();
  });

  // ===== 마이페이지 사용자 드롭다운 (WCAG 2.1 AA: aria-expanded · Esc · click-outside · focus-trap) =====
  const userBtn = document.getElementById('utilUserBtn');
  const userDropdown = document.getElementById('utilUserDropdown');
  const logoutBtn = document.getElementById('utilLogoutBtn');

  function closeUserDropdown() {
    if (!userDropdown) return;
    userDropdown.classList.remove('show');
    if (userBtn) userBtn.setAttribute('aria-expanded', 'false');
  }
  function toggleUserDropdown() {
    if (!userDropdown) return;
    const open = userDropdown.classList.toggle('show');
    if (userBtn) userBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open) {
      // 첫 메뉴 항목으로 포커스 이동
      const first = userDropdown.querySelector('a, button');
      first && first.focus();
    }
  }
  if (userBtn && userDropdown) {
    userBtn.addEventListener('click', e => { e.stopPropagation(); toggleUserDropdown(); });
    // 외부 클릭 시 닫기
    document.addEventListener('click', e => {
      if (!userDropdown.contains(e.target) && e.target !== userBtn) closeUserDropdown();
    });
    // Esc 닫기
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && userDropdown.classList.contains('show')) {
        closeUserDropdown();
        userBtn.focus();
      }
    });
    // 화살표 키로 메뉴 항목 이동 (KRDS 키보드 내비게이션)
    userDropdown.addEventListener('keydown', e => {
      const items = Array.from(userDropdown.querySelectorAll('a, button'));
      const idx = items.indexOf(document.activeElement);
      if (e.key === 'ArrowDown') { e.preventDefault(); items[(idx + 1) % items.length]?.focus(); }
      if (e.key === 'ArrowUp')   { e.preventDefault(); items[(idx - 1 + items.length) % items.length]?.focus(); }
      if (e.key === 'Home')      { e.preventDefault(); items[0]?.focus(); }
      if (e.key === 'End')       { e.preventDefault(); items[items.length - 1]?.focus(); }
    });
  }
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      try { sessionStorage.removeItem('mp_user'); } catch(e){}
      const msg = (window.__i18n && window.__i18n.t) ? window.__i18n.t('msg.logout.done') : '로그아웃되었습니다.';
      if (window.__toast) window.__toast(msg, 'success');
      setTimeout(() => { location.href = 'index.html'; }, 300);
    });
  }

  // 유틸리티 영역 POPUP 버튼 글로벌 핸들러
  // - 인덱스 페이지: window.IndexPopup.open() 호출 → 팝업이 즉시 열림
  // - 인덱스 외 페이지: 인덱스로 이동 (인덱스는 진입 시 자동으로 팝업이 열림)
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-util-popup]');
    if (!b) return;
    if (window.IndexPopup && typeof window.IndexPopup.open === 'function') {
      return;
    }
    e.preventDefault();
    location.href = 'index.html';
  });

  // ============================================================
  // [KWCAG 2.2 / KIDS 접근성 보강 — V3.2]
  // ============================================================

  // [F] GNB 현재 위치에 aria-current="page" 부여
  const _activeNavAnchor = document.querySelector('.main-nav > li.active > a');
  if (_activeNavAnchor) _activeNavAnchor.setAttribute('aria-current', 'page');

  // [A·J] 글자크기 ± (인라인 onclick 대체 + 영구 저장 + 스크린리더 알림 + i18n 적용)
  const _fontUp   = document.querySelector('.util-font-up');
  const _fontDown = document.querySelector('.util-font-down');
  const _fontLive = document.getElementById('utilFontSizeLive');
  function _i18nT(key, fallback) {
    return (window.__i18n && window.__i18n.t) ? window.__i18n.t(key) : fallback;
  }
  function _applyFontSize(px, msgKey, fallback) {
    document.documentElement.style.fontSize = px + 'px';
    try { localStorage.setItem('site-font-size', String(px)); } catch (e) {}
    if (_fontLive) _fontLive.textContent = _i18nT(msgKey, fallback);
  }
  if (_fontUp)   _fontUp.addEventListener('click',   function(){ _applyFontSize(17, 'fontsize.larger',  '글자 크기가 커졌습니다'); });
  if (_fontDown) _fontDown.addEventListener('click', function(){ _applyFontSize(16, 'fontsize.default', '글자 크기가 기본으로 돌아왔습니다'); });
  // 페이지 로드 시 저장된 글자크기 복원
  try {
    var _savedPx = parseInt(localStorage.getItem('site-font-size') || '0', 10);
    if (_savedPx === 16 || _savedPx === 17) document.documentElement.style.fontSize = _savedPx + 'px';
  } catch (e) {}

  // [A] 마이페이지 데모 자동 로그인 — 인라인 onclick 대체
  const _utilMypageDemo = document.getElementById('utilMypageDemoBtn');
  if (_utilMypageDemo) {
    _utilMypageDemo.addEventListener('click', function () {
      try { sessionStorage.setItem('mp_user', JSON.stringify({ name: '홍길동', kind: 'personal' })); } catch (e) {}
    });
  }

  // [C] 업무지원시스템 (추후 연동) — button 클릭 시 안내 (i18n)
  document.querySelectorAll('.nav-external-btn[aria-disabled="true"]').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      const msg = _i18nT('msg.workspace.coming', '업무지원시스템은 추후 연동 예정입니다.');
      if (window.__toast) window.__toast(msg, 'info');
    });
  });

  // [I18N] 언어 선택 드롭다운 (지구본 아이콘 · 한국어/English)
  const _langMenu  = document.getElementById('utilLangMenu');
  const _langBtn   = document.getElementById('utilLangToggle');
  const _langList  = document.getElementById('utilLangList');
  const _langCurr  = document.getElementById('utilLangCurrent');

  function _langOpen() {
    if (!_langMenu || !_langBtn || !_langList) return;
    _langMenu.classList.add('is-open');
    _langBtn.setAttribute('aria-expanded', 'true');
    _langList.hidden = false;
  }
  function _langClose() {
    if (!_langMenu || !_langBtn || !_langList) return;
    _langMenu.classList.remove('is-open');
    _langBtn.setAttribute('aria-expanded', 'false');
    _langList.hidden = true;
  }
  function _syncLangLabel() {
    if (!_langCurr) return;
    const cur = (window.__i18n && window.__i18n.getLang) ? window.__i18n.getLang() : 'ko';
    // 명시적 라벨로 표시 (사전 미등록 시에도 안전)
    _langCurr.textContent = cur === 'en' ? 'English' : '한국어';
    return;
    const labelKey = 'lang.label.' + cur;
    const label = window.__i18n.t ? window.__i18n.t(labelKey, cur) : (cur === 'en' ? 'English' : '한국어');
    _langCurr.textContent = label;
  }

  if (_langBtn) {
    _langBtn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      const isOpen = _langMenu && _langMenu.classList.contains('is-open');
      if (isOpen) _langClose(); else _langOpen();
    });
    _langBtn.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        _langOpen();
        const first = _langList && _langList.querySelector('a[data-lang]');
        if (first) first.focus();
      } else if (e.key === 'Escape') {
        _langClose();
      }
    });
  }
  if (_langList) {
    _langList.addEventListener('click', function () {
      // i18n.js의 전역 클릭 위임이 실제 언어 전환을 수행 → 메뉴만 닫음
      setTimeout(function () { _langClose(); _syncLangLabel(); _langBtn && _langBtn.focus(); }, 0);
    });
    _langList.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { _langClose(); _langBtn && _langBtn.focus(); }
    });
  }
  // 외부 클릭으로 닫기
  document.addEventListener('click', function (e) {
    if (!_langMenu) return;
    if (_langMenu.contains(e.target)) return;
    if (_langMenu.classList.contains('is-open')) _langClose();
  });
  // i18n.js가 partials.js보다 늦게 로드되어도, init 후 라벨 동기화
  setTimeout(_syncLangLabel, 0);
  if (window.__i18n && window.__i18n.on) {
    window.__i18n.on(function () { _syncLangLabel(); });
  }
  if (window.__i18n && window.__i18n.applyLang) {
    window.__i18n.applyLang(window.__i18n.getLang());
    _syncLangLabel();
  }

})();
