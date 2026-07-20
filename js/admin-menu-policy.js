/* ============================================================================
   정책지원 시스템(ev_policy 3종) 셸 메뉴 — PS_MENU 실사 (v0.30 6호 · 최종)
   근거: 회의록/구매보조금시스템_메뉴IA_20260716.md §부록 — ev_policy 3종 (트리 그대로)
     D0003 의무구매임차제 / D0005 보급목표제 / D0010 표지발급시스템
   제외: USE_YN='N' — 의무구매임차제 '이륜자동차 실적관리(N)'
   실링크 1개: 의무구매임차제 > 자동차 구매·임차 실적 > 구매임차 전체비율 → admin-cp-vhcrate.html
   구조는 admin-menu-ntp/ps/ssd/infra.js와 동일({label, children, href, badge}) — AdminShell siteTabs 재사용.
   ============================================================================ */
(function(){
  'use strict';

  // D0003 의무구매임차제
  var D0003 = [
    { label:'정보관리', children:[
      { label:'권한' },{ label:'메뉴' },{ label:'권한메뉴' },{ label:'공단/기관관리자 할일' }
    ]},
    { label:'사업관리', children:[
      { label:'신청기간' },{ label:'기관별 신청기간' },{ label:'산정비율' }
    ]},
    { label:'기관관리', children:[
      { label:'기관' },{ label:'기관정보수정' },{ label:'소속기관' },{ label:'소속기관정보수정' },
      { label:'기관담당자' },{ label:'사용자 권한' }
    ]},
    { label:'자동차 구매·임차 실적', children:[
      { label:'실적관리' },{ label:'실적조회' },
      { label:'제출관리(관리자)' },{ label:'제출관리(일반)' },
      { label:'사전등록차량 승인관리' },{ label:'사전등록차량 승인요청' },
      { label:'제외자동차 승인요청' },{ label:'제외자동차 승인관리' },{ label:'제외자동차 요청검토' },
      { label:'구매임차 비율' },
      { label:'구매임차 전체비율', href:'admin-cp-vhcrate.html' },
      { label:'차량보유 현황' },{ label:'차량보유 전체현황' },
      { label:'저공해차 구매임차 실적' },
      { label:'차종별 구매임차 현황' },{ label:'차종별 구매임차 전체현황' },
      { label:'차량정보관리' }
    ]},
    { label:'자동차 구매·임차 계획', children:[
      { label:'차량구매계획' },{ label:'구매계획 현황' },{ label:'구매계획 전체현황' },
      { label:'의무구매 임차비율 사전점검' }
    ]},
    { label:'정보조회', children:[
      { label:'자동차 관리정보' },{ label:'국토부연계조회' }
    ]}
  ];

  // D0005 보급목표제
  var D0005 = [
    { label:'판매자관리', children:[
      { label:'판매자' },{ label:'사용자권한' }
    ]},
    { label:'제도관리', children:[
      { label:'신청기간' },{ label:'산정비율' },{ label:'비율관리' }
    ]},
    { label:'실적관리', children:[
      { label:'인증정보' },{ label:'제원정보' },{ label:'업체별 판매계획' },{ label:'판매계획' },
      { label:'업체별 보급실적' },{ label:'보급실적' }
    ]},
    { label:'현황', children:[
      { label:'판매계획' },{ label:'보급실적' },{ label:'최종 보급실적' }
    ]},
    { label:'유연성', children:[
      { label:'실적사용관리' },{ label:'실적사용' },{ label:'실적거래관리' },{ label:'실적거래' },
      { label:'실적전환관리' },{ label:'실적전환' },{ label:'실적이월관리' },{ label:'실적이월' }
    ]},
    { label:'정보관리', children:[
      { label:'권한' },{ label:'메뉴' },{ label:'권한메뉴' }
    ]}
  ];

  // D0010 표지발급시스템
  var D0010 = [
    { label:'표지발급관리', children:[
      { label:'표지발급' },{ label:'발급조회' },{ label:'저공해차 인증현황' }
    ]},
    { label:'정보관리', children:[
      { label:'권한' },{ label:'메뉴' },{ label:'권한메뉴' }
    ]},
    { label:'업무지원', children:[
      { label:'차량등록번호수정' },{ label:'저공해차 신규제원등록' },{ label:'운행차정보연계확인' },
      { label:'배출가스인증번호관리' },{ label:'차량정보현황' },{ label:'저공해차량조회API' },{ label:'사용자권한' }
    ]}
  ];

  window.ADMIN_MENU_POLICY = [
    { key:'cp',    label:'의무구매임차제 (D0003)', side: D0003 },
    { key:'goal',  label:'보급목표제 (D0005)',     side: D0005 },
    { key:'badge', label:'표지발급시스템 (D0010)', side: D0010 }
  ];
})();
