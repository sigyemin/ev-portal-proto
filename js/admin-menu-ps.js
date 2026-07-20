/* ============================================================================
   구매보조금 지원시스템(D0006) 셸 메뉴 — PS_MENU 실사 (v0.30 3호)
   근거: 회의록/구매보조금시스템_메뉴IA_20260716.md (검증계 PS_MENU, USE_YN=N 제외)
   구조: LV1=구매보조금 · LV2=차종 4탭(전기자동차·전기이륜차·수소자동차·건설기계) — 셸 GNB 자리에 차종 탭
         LV3 골격 7메뉴: 정보관리→지원사업관리→사업관리→신청관리→현황조회→사후관리→이전 보급실적 관리
   차종별 차이(근거 변주 규칙): 이륜=사업관리가 지원사업관리에 통합 + 배달목적 추가보조금 /
         수소=h2/* + 스택 보조금 일습 / 건설기계=전기지게차 공모신청관리
   실링크 2개: 사업관리>지원조건 → admin-ps-option.html / 신청관리>신청관리(지자체) → admin-ps-apply.html
   ⚠ 수행자평가·전기승합 공모 관리 메뉴는 검증계 PS_MENU에 없음(소스엔 실존) — 개발팀 확인 대상.
   구조는 admin-menu-ntp.js와 동일({label, children, href, badge}) — AdminShell 재사용.
   ============================================================================ */
(function(){
  'use strict';

  // 전기자동차 기준 골격 (근거 §전기자동차 그대로)
  function evTree(){
    return [
      { label:'정보관리', children:[
        { label:'제조수입사(대리점정보)' },{ label:'제조수입사(대리점) 관리' },{ label:'담당자관리' },
        { label:'사용자권한관리' },{ label:'팝업관리' },{ label:'지자체 건의사항' },
        { label:'메뉴관리' },{ label:'권한관리' },{ label:'권한메뉴관리' }
      ]},
      { label:'지원사업관리', children:[
        { label:'제조사관리' },{ label:'대리점관리' },{ label:'차량관리' },{ label:'차량제원관리' },
        { label:'차종별 국비 관리' },{ label:'AS확약보증보험' },{ label:'이륜차 AS확약보증보험 관리' },
        { label:'K-EV100 참여업체/관리' },{ label:'친환경 구매목표제 대상기업' },
        { label:'전기승합(대형) 기준가격조회' },{ label:'차종별 기준가격 관리(전기승합)' },
        { label:'차량등록정보 관리' },{ label:'제조수입사 센터 관리' },
        { label:'보조금 지급계좌 관리' },{ label:'제조수입사 보조금 지급계좌 관리' }
      ]},
      { label:'사업관리', children:[
        { label:'차종별 국비조회' },{ label:'차종별 지방비' },{ label:'예산입력' },{ label:'목표대수' },
        { label:'지원조건', href:'admin-ps-option.html' },
        { label:'접수기간' },{ label:'신청마감' },{ label:'문자설정' }
      ]},
      { label:'신청관리', children:[
        { label:'신청관리(관리자)' },
        { label:'신청관리(지자체)', href:'admin-ps-apply.html' },
        { label:'신청관리(제조사)' },
        { label:'신청서 작성' },{ label:'지급예정' },{ label:'지급내역' },{ label:'입금내역' },{ label:'문자이력' },
        { label:'자산취득차량 신청관리' },{ label:'지자체 차종별 신청가능확인(지자체/관리자)' },
        { label:'차종별 기준가격(전기승합)' },{ label:'스택 보조금 신청관리 제조사' },
        { label:'택배차 추가보조금 신청관리(제조사/지자체/관리자)' },
        { label:'모델별 보조금 산정 신청관리(제조사/관리자)' },
        { label:'지자체 신청정보 변경/변경관리' },{ label:'보조금 모의 계산' }
      ]},
      { label:'현황조회', children:[
        { label:'보급실적 관리대장' },{ label:'시도별 현황' },{ label:'제조수입사(대리점) 현황' },
        { label:'단계별 신청현황' },{ label:'기간별/분기별/월별 실적현황' },
        { label:'지자체별 차종별 보조금현황' },{ label:'기아,테슬라,현대 보조금현황' },{ label:'총괄현황' },
        { label:'K-EV100 참여업체' },{ label:'친환경차 구매목표제 대상 기업' },
        { label:'보조금관리대장(환경부제출용)' },{ label:'보조금실적(예산 집행 기준)' },
        { label:'모델별 신청현황' },{ label:'자산취득차량 신청관리' },{ label:'지자체 문의처' },
        { label:'국토부연계 현황' },{ label:'지방비 집행 실적 현황' },{ label:'지방비 집행 대시보드' },
        { label:'제조국별 보급, 보조금 현황' }
      ]},
      { label:'사후관리', children:[
        { label:'환수금계산' },{ label:'자동차관리정보(관리자/지자체)' },{ label:'의무운행기간 내 판매승인' },
        { label:'보유경유차관리정보' },{ label:'지자체 말소 전기자동차 관리' },
        { label:'무공해차 및 충전인프라 주간보고' },{ label:'말소 전기자동차 관리' },
        { label:'의무운행기간 미준수 환수 현황' }
      ]},
      { label:'이전 보급실적 관리', children:[
        { label:'이전 보급실적 업로드' },{ label:'보급실적(배터리회수)' },{ label:'보급실적 현황' }
      ]}
    ];
  }

  // 차종 변주 (근거 규칙 — 화면 대부분 공유: 같은 URL에 car_type/_motor/h2 변주)
  function motoTree(){ // 이륜: 사업관리 → 지원사업관리에 통합 + 배달목적 추가보조금
    var t = evTree();
    var biz = t.splice(2, 1)[0];                       // 사업관리 제거
    t[1].children = t[1].children.concat(biz.children); // 지원사업관리에 통합
    t[2].children.push({ label:'배달목적 추가보조금 신청관리' }); // 신청관리(통합 후 index 2)
    return t;
  }
  function h2Tree(){ // 수소: h2/* 변주 + 스택 보조금 일습
    var t = evTree();
    t[3].children.push({ label:'스택 보조금 신청관리(지자체)' }, { label:'스택 보조금 신청관리(관리자)' });
    return t;
  }
  function forkliftTree(){ // 건설기계: 전기지게차 공모신청관리
    var t = evTree();
    t[2].children.push({ label:'전기지게차 공모신청관리' });
    return t;
  }

  window.ADMIN_MENU_PS = [
    { label:'전기자동차', children: evTree() },
    { label:'전기이륜차', children: motoTree() },
    { label:'수소자동차', children: h2Tree() },
    { label:'건설기계', children: forkliftTree() }
  ];
})();
