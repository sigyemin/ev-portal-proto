/* =========================================================
   i18n-common.js — 공통영역(헤더/유틸/GNB/메가메뉴/풋터/마이페이지 사이드) 사전
   i18n.js 코어에 register()로 등록
   ========================================================= */
(function () {
  if (!window.__i18n || !window.__i18n.register) return;
  window.__i18n.register({
    /* [작업8] 화면경로 '홈' — 충전/데이터 등 일부 페이지에서 키 미정의로 'crumb.home'·'extra.bc.home' 노출되던 문제 공통 정의 */
    'crumb.home':              { ko: '홈',            en: 'Home' },
    'extra.bc.home':           { ko: '홈',            en: 'Home' },
    'info.bc.home':            { ko: '홈',            en: 'Home' },
    /* [작업18] 푸터 정책 링크 */
    'footer.policy.aria':      { ko: '약관·정책 바로가기', en: 'Policies' },
    'footer.policy.privacy':   { ko: '개인정보처리방침', en: 'Privacy Policy' },
    'footer.policy.nospam':    { ko: '이메일 무단수집거부', en: 'No Email Collection' },
    'footer.policy.cctv':      { ko: '영상정보처리기기 운영관리지침', en: 'CCTV Operation Guideline' },
    'footer.policy.complaint': { ko: '불편민원신고센터', en: 'Complaint Center' },
    /* 상단 유틸 */
    'util.login':              { ko: '로그인',        en: 'Login' },
    'util.signup':             { ko: '회원가입',      en: 'Sign Up' },
    'util.mypage':             { ko: '마이페이지',    en: 'My Page' },
    'util.mypage.aria':        { ko: '마이페이지 (프로토타입 자동 로그인)', en: 'My Page (Prototype auto-login)' },
    'util.lang.toggle':        { ko: 'ENG',           en: 'KOR' },
    'util.lang.toggle.aria':   { ko: '영어로 전환',   en: 'Switch to Korean' },
    'util.fontsize.label':     { ko: '글자크기',      en: 'Font Size' },
    'util.fontsize.up.aria':   { ko: '글자 키우기',   en: 'Increase font size' },
    'util.fontsize.down.aria': { ko: '글자 줄이기',   en: 'Decrease font size' },
    'util.popup':              { ko: 'POPUP',         en: 'POPUP' },
    'util.popup.aria':         { ko: '인덱스 팝업 다시 보기', en: 'Show popup again' },
    'util.user.aria':          { ko: '사용자 메뉴 열기',     en: 'Open user menu' },
    'util.user.suffix':        { ko: '님',                  en: '' },
    'util.user.menu.home':     { ko: '마이페이지 홈',       en: 'My Page Home' },
    'util.user.menu.info':     { ko: '내 정보 관리',        en: 'Account Info' },
    'util.user.menu.card':     { ko: '충전 카드 관리',      en: 'Charging Card' },
    'util.user.menu.inquiry':  { ko: '나의 신청·민원',      en: 'My Applications' },
    'util.user.menu.business': { ko: '업무지원시스템 이용신청', en: 'Workspace Access Request' },
    'util.user.menu.logout':   { ko: '로그아웃',            en: 'Log out' },

    /* 브랜드 */
    'brand.main':         { ko: '무공해차 통합누리집',         en: 'Zero-Emission Vehicle Portal' },
    'brand.sub':          { ko: 'Zero Emission Vehicle Portal', en: 'Republic of Korea' },
    'brand.home.aria':    { ko: '무공해차 통합누리집 홈',         en: 'Zero-Emission Vehicle Portal Home' },
    'brand.fullmenu.sub': { ko: '전체 메뉴',                   en: 'Full Menu' },

    /* GNB Lv1 */
    'nav.aria':            { ko: '주 메뉴',                     en: 'Main menu' },
    'nav.purchase':        { ko: '구매·보조금',                  en: 'EV Subsidies' },
    'nav.charging':        { ko: '충전소·요금 정보',              en: 'Charging & Fees' },
    'nav.data':            { ko: '데이터·통계',                  en: 'Data & Stats' },
    'nav.community':       { ko: '소통·지원',                   en: 'Support' },
    'nav.info':            { ko: '정보 자료실',                  en: 'Resources' },
    'nav.external':        { ko: '업무지원시스템',                en: 'Workspace' },
    'nav.external.aria':   { ko: '업무지원시스템 (추후 연동 예정)', en: 'Workspace (Coming soon)' },
    'nav.external.note':   { ko: '추후 연동 예정',                en: 'Coming soon' },
    'header.fullmenu.open.aria':  { ko: '전체 메뉴 열기', en: 'Open full menu' },
    'header.fullmenu.close.aria': { ko: '전체 메뉴 닫기', en: 'Close full menu' },
    'header.fullmenu.aria':       { ko: '전체 메뉴',     en: 'Full menu' },

    /* 메가메뉴 Lv2 */
    'mega.purchase.subsidy':  { ko: '무공해차 구매보조금 안내', en: 'EV Purchase Subsidy' },
    'mega.purchase.tax':      { ko: '세제·정보 안내',         en: 'Tax Benefits' },
    'mega.purchase.compare':  { ko: '차량 비교',              en: 'Vehicle Comparison' },
    'mega.purchase.public':   { ko: '공모·신청',              en: 'Public Procurement' },
    'mega.purchase.kev100':   { ko: 'K-EV100 (기업전환)',     en: 'K-EV100 (Corporate)' },
    'mega.charging.find':     { ko: '충전소 찾기',            en: 'Find Stations' },
    'mega.charging.fee':      { ko: '충전 요금 안내',         en: 'Charging Fees' },
    'mega.charging.card':     { ko: '회원카드 관리',         en: 'Member Card' },
    'mega.charging.install':  { ko: '충전시설 설치',          en: 'Install Chargers' },
    'mega.charging.h2':       { ko: '수소충전소 Help Desk',   en: 'H2 Station Help Desk' },
    'mega.data.dashboard':    { ko: '통계 대시보드',          en: 'Statistics Dashboard' },
    'mega.data.trend':        { ko: '시장·정책 동향',         en: 'Market & Policy Trends' },
    'mega.data.open':         { ko: '공개 데이터',            en: 'Open Data' },
    'mega.community.ai':      { ko: 'AI 헬프데스크',          en: 'AI Help Desk' },
    'mega.community.notice':  { ko: '알림·공지',              en: 'Notices' },
    'mega.community.inquiry': { ko: '민원·문의',              en: 'Inquiries' },
    'mega.info.regulation':   { ko: '규정·가이드라인',        en: 'Regulations & Guidelines' },
    'mega.info.library':      { ko: '자료실',                 en: 'Library' },
    'mega.info.encyclopedia': { ko: '무공해차 백과',          en: 'EV Encyclopedia' },
    'mega.info.site':         { ko: '사이트 안내',            en: 'Site Info' },

    /* 메가메뉴 Lv3 - 구매·보조금 */
    'mega.purchase.subsidy.target':   { ko: '보조금 지원 대상·신청절차', en: 'Eligibility & Application' },
    'mega.purchase.subsidy.region':   { ko: '지자체별 보조금 현황',     en: 'Subsidies by Region' },
    'mega.purchase.subsidy.local':    { ko: '지자체별 차종·모델 보조금', en: 'Subsidy by Vehicle & Model' },
    'mega.purchase.subsidy.vehicles': { ko: '보조금 지급대상 차종',     en: 'Eligible Vehicles' },
    'mega.purchase.subsidy.info':     { ko: '보조금 안내·계산기',       en: 'Subsidy Guide & Calculator' },
    'mega.purchase.subsidy.refund':   { ko: '보조금 환수금 안내·계산기', en: 'Subsidy Recovery Calculator' },
    'mega.purchase.tax.integrated':   { ko: '세제 정보 통합 안내',      en: 'Tax Information' },
    'mega.purchase.tax.region':       { ko: '지역별 추가 혜택',         en: 'Regional Benefits' },
    'mega.purchase.tax.grade':        { ko: '내 차 저공해 등급 확인',   en: 'Vehicle Emission Grade' },
    'mega.purchase.compare.tool':     { ko: '차종 비교 도구',           en: 'Vehicle Comparison Tool' },
    'mega.purchase.compare.tco':      { ko: '총소유비용(TCO) 계산',     en: 'TCO Calculator' },
    'mega.purchase.public.ev':        { ko: '전기자동차 수행자 선정 평가 신청', en: 'EV Supplier Evaluation' },
    'mega.purchase.public.bus':       { ko: '전기승합차 공모 신청',     en: 'Electric Bus Procurement' },
    'mega.purchase.public.const':     { ko: '전기지게차 공모 신청',     en: 'Electric Forklift Open Call' },
    'mega.purchase.public.moto':      { ko: '전기이륜차 수행자 선정 평가 신청', en: 'E-Motorbike Supplier Evaluation' },
    'mega.purchase.public.contact':   { ko: '지자체 문의처 안내',       en: 'Regional Contacts' },
    'mega.purchase.kev100.about':     { ko: 'K-EV100 소개',             en: 'About K-EV100' },
    'mega.purchase.kev100.process':   { ko: '참여 방법·절차',           en: 'Participation Process' },
    'mega.purchase.kev100.companies': { ko: '참여기업 현황',            en: 'Participating Companies' },
    'mega.purchase.kev100.benefits':  { ko: '참여 혜택·지원',           en: 'Benefits & Support' },

    /* 메가메뉴 Lv3 - 충전소·요금 */
    'mega.charging.find.map':       { ko: '통합 지도 (전기+수소)', en: 'Integrated Map (EV + H2)' },
    'mega.charging.find.near':      { ko: '내 주변 충전소',         en: 'Nearby Stations' },
    'mega.charging.find.route':     { ko: '경로 검색',              en: 'Route Search' },
    'mega.charging.fee.ev':         { ko: '전기차 충전요금 안내',   en: 'EV Charging Fees' },
    'mega.charging.fee.h2':         { ko: '수소차 충전요금 안내',   en: 'H2 Charging Fees' },
    'mega.charging.fee.sim':        { ko: '내 충전요금 시뮬레이터', en: 'Fee Simulator' },
    'mega.charging.card.list':      { ko: '내 회원카드',           en: 'My Cards' },
    'mega.charging.card.apply':     { ko: '회원카드 신청',         en: 'Apply for Card' },
    'mega.charging.card.check':     { ko: '회원카드 발급조회',     en: 'Card Issuance Status' },
    'mega.charging.card.edit':      { ko: '카드 정보 수정',         en: 'Edit Card Info' },
    'mega.charging.card.history':   { ko: '충전요금 조회',   en: 'Charging Fees' },
    'mega.charging.card.point':     { ko: '충전 포인트',            en: 'Charging Points' },
    'mega.charging.install.slow':   { ko: '공용 완속충전시설 직접신청', en: 'Public Slow Charger Application' },
    'mega.charging.install.contest':{ ko: '공용 완속/급속·중속 충전시설 운영사·제조사 공모 신청', en: 'Operator/Maker Charger Open Call' },
    'mega.charging.install.brand':  { ko: '지역별 무공해차 전환 브랜드 사업 공모 신청', en: 'Charging Brand Project Open Call' },
    'mega.charging.install.moto':   { ko: '지역별 무공해차 전환 브랜드 사업 (BSS) 공모 신청', en: 'E-Motorbike BSS Open Call' },
    'mega.charging.install.products':{ ko: '완속충전기 제품 안내',  en: 'Slow Charger Products' },
    'mega.charging.h2.report':      { ko: '수소충전소 장애 신고',   en: 'Report H2 Station Issue' },
    'mega.charging.h2.status':      { ko: '운영 현황 안내',         en: 'Operation Status' },

    /* 메가메뉴 Lv3 - 데이터·통계 */
    'mega.data.supply':       { ko: '무공해차 보급 현황', en: 'ZEV Adoption Status' },
    'mega.data.infra':        { ko: '충전 인프라 현황',  en: 'Charging Infrastructure' },
    'mega.data.subsidy':      { ko: '보조금 집행 현황',  en: 'Subsidy Disbursement' },
    'mega.data.k100':         { ko: 'K-EV100 전환 현황', en: 'K-EV100 Transition' },
    /* [정리] mega.data.tindex 제거 — 대민 메가메뉴 투명성지수 항목 삭제(관리자 이관) */
    'mega.data.trend.market': { ko: '무공해차 시장 동향', en: 'ZEV Market Trends' },
    'mega.data.trend.policy': { ko: '정책 추진 현황',    en: 'Policy Progress' },
    'mega.data.trend.region': { ko: '지역별 보급 현황',  en: 'Regional Adoption' },
    'mega.data.open.list':    { ko: '공개 데이터 목록',  en: 'Open Data List' },
    'mega.data.open.download':{ ko: '데이터 다운로드',   en: 'Data Download' },

    /* 메가메뉴 Lv3 - 소통·지원 */
    'mega.community.ai.personal': { ko: 'AI 맞춤 상담',    en: 'AI Personalized' },
    'mega.community.ai.subsidy':  { ko: '보조금 큐레이터', en: 'Subsidy Curator' },
    'mega.community.ai.charge':   { ko: '장애 대응 안내',  en: 'Issue Response' },
    'mega.community.notice.keeper': { ko: '전기차 충전소 지킴이 활동', en: 'Charging Station Stewards' },
    'mega.community.notice.list':   { ko: '공지사항', en: 'Notices' },
    'mega.community.notice.press':  { ko: '보도자료', en: 'Press Releases' },
    'mega.community.notice.promo':  { ko: '홍보자료', en: 'Promotional Materials' },
    'mega.community.notice.data':   { ko: '공개자료', en: 'Public Materials' },
    'mega.community.inquiry.faq':       { ko: 'FAQ (자주 묻는 질문)', en: 'FAQ' },
    'mega.community.inquiry.qna':       { ko: '질의응답(건의사항)',  en: 'Q&A / Suggestions' },
    'mega.community.inquiry.complaint': { ko: '불편 민원 신고',      en: 'Complaints' },
    'mega.community.inquiry.report':    { ko: '보조금 부적정집행 신고', en: 'Subsidy Misuse Report' },
    'mega.community.inquiry.discount':  { ko: '충전요금 할인 미적용 신고', en: 'Charging Discount Non-application Report' },
    'mega.community.inquiry.status':    { ko: '민원 처리 현황 조회',  en: 'Complaint Status' },

    /* 메가메뉴 Lv3 - 정보 자료실 */
    'mega.info.regulation.law':  { ko: '법령·지침·규정·가이드라인', en: 'Laws & Guidelines' },
    'mega.info.regulation.cert': { ko: '인증 기준 안내',           en: 'Certification Standards' },
    'mega.info.library.general': { ko: '일반 자료실',              en: 'General Library' },
    'mega.info.library.form':    { ko: '서식 다운로드',            en: 'Forms Download' },
    'mega.info.library.manual':  { ko: '사용자 매뉴얼',            en: 'User Manuals' },
    'mega.info.library.request': { ko: '요청자료', en: 'Requested Materials' },
    'mega.info.enc.glossary':    { ko: '용어사전',                 en: 'Glossary' },
    'mega.info.enc.beginner':    { ko: '초보자 가이드',            en: 'Beginner Guide' },
    'mega.info.enc.ev':          { ko: '전기차 소개',              en: 'About EVs' },
    'mega.info.enc.h2':          { ko: '수소차 소개',              en: 'About FCEVs' },
    'mega.info.enc.battery':     { ko: '배터리 정보',              en: 'Battery Info' },
    'mega.info.site.sitemap':    { ko: '사이트맵',                 en: 'Sitemap' },
    'mega.info.site.privacy':    { ko: '개인정보처리방침',         en: 'Privacy Policy' },
    'mega.info.site.nospam':     { ko: '이메일 무단수집거부',       en: 'Email Collection Refusal' },
    'mega.info.site.cctv':       { ko: '영상정보처리기기 운영관리지침', en: 'CCTV Operation Policy' },
    'mega.info.site.terms':      { ko: '이용약관',                 en: 'Terms of Service' },

    /* 푸터 */
    'footer.address':         { ko: '(22689) 인천광역시 서구 환경로 42(오류동 종합환경연구단지)',
                                en: '42 Hwangyeong-ro, Seo-gu, Incheon, 22689, Republic of Korea' },
    'footer.callcenter':      { ko: '대표전화 : (누리집콜센터) 1661-0970',
                                en: 'Call Center: 1661-0970' },
    'footer.cardcenter':      { ko: '급속충전시설 이용관련문의 및 회원카드 발급문의 한국자동차환경협회 : 1661-9408',
                                en: 'Fast Charger & Card Inquiries (KAEA): 1661-9408' },
    'footer.copy':            { ko: 'Copyright 2026. KECO All rights reserved.',
                                en: 'Copyright 2026. KECO All rights reserved.' },
    'footer.partners.aria':   { ko: '관련 기관 바로가기',         en: 'Related organizations' },
    'footer.partner.keco':    { ko: '한국환경공단',               en: 'KECO' },
    'footer.partner.me':      { ko: '기후에너지환경부',           en: 'MCEE' },
    'footer.partner.kaea':    { ko: '한국자동차환경협회',         en: 'KAEA' },
    'footer.partner.wa':      { ko: 'WA 웹접근성',                en: 'WA Web Accessibility' },
    'footer.partner.newwindow': { ko: ' (새 창)',                en: ' (new window)' },

    /* 알림 메시지 */
    'fontsize.larger':        { ko: '글자 크기가 커졌습니다',     en: 'Font size enlarged' },
    'fontsize.default':       { ko: '글자 크기가 기본으로 돌아왔습니다', en: 'Font size reset to default' },
    'msg.workspace.coming':   { ko: '업무지원시스템은 추후 연동 예정입니다.', en: 'Workspace integration coming soon.' },
    'msg.logout.done':        { ko: '로그아웃되었습니다.',         en: 'Logged out.' },
    'nav.anchor.aria':        { ko: '섹션 이동',             en: 'Section navigation' },
    'nav.breadcrumb.aria':        { ko: '경로',                  en: 'Breadcrumb' },
    'skip.tocontent':         { ko: '본문 바로가기',               en: 'Skip to main content' },

    /* === 언어 선택 UI (ko/en 2개 언어) === */
    'lang.menu.aria':         { ko: '언어 선택',                  en: 'Select language' },
    'lang.name.ko':           { ko: '한국어',                     en: 'Korean' },
    'lang.name.en':           { ko: '영어',                       en: 'English' },
    'lang.label.ko':          { ko: '한국어',                     en: '한국어' },
    'lang.label.en':          { ko: 'English',                    en: 'English' },

    /* === 언어 전환 알림 (aria-live) === */
    'lang.switched.ko':       { ko: '한국어로 전환되었습니다',     en: 'Switched to Korean' },
    'lang.switched.en':       { ko: '영어로 전환되었습니다',       en: 'Switched to English' }
  });

  // 등록 직후 한 번 더 적용 (init이 이미 끝났을 수 있음)
  if (window.__i18n && window.__i18n.applyLang) {
    window.__i18n.applyLang(window.__i18n.getLang());
  }
})();
