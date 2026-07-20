/* ============================================================================
   충전인프라 시스템(ev_infra) 셸 메뉴 — 실사 (v0.30 5호)
   근거: 회의록/완속브랜드_충전인프라_메뉴IA_20260720.md §B (트리 그대로)
     §B-1 급속·분석(evplus, TNVP_MENU_MNG SITE_GB_CD=EVPLUS) — GNB 10
     §B-2 수소충전인프라(hev, TNHS_INFRA_MENU — 그룹헤더 X000 + 하위 X00N) — 그룹 7
   제외: 수소 '잔재 구화면'(구축공정관리카드 1002 · 부지적합성 검토접수 4006) — 메뉴 제외
   메모: TNHS_MENU_MNG는 검증계 미존재(소스 잔재) — 수소 메뉴 원천은 TNHS_INFRA_MENU로 확정.
   실링크 1개: EVPLUS > 통계 > 충전기 현황 → admin-infra-status.html · 나머지 전부 스텁.
   구조는 admin-menu-ntp/ps/ssd.js와 동일({label, children, href, badge}).
   ============================================================================ */
(function(){
  'use strict';

  // §B-1 급속·분석(EVPLUS) — GNB 10
  var EVPLUS = [
    { label:'이용 관리', children:[
      { label:'이용신청 관리' },{ label:'충전시설 사업 관리' },{ label:'충전기 관리' }
    ]},
    { label:'데이터 관리', children:[
      { label:'지표 데이터' },{ label:'최적위치 적정지수' },{ label:'가중치' },{ label:'영향분석' },
      { label:'공동주택 충전기 현황' },{ label:'공동주택 충전기 활용 사각지대' },{ label:'가중치 관리' },
      { label:'지표 데이터 관리' },{ label:'지표 구성 관리' },{ label:'지도 데이터 관리' },
      { label:'이용현황 데이터 관리' },{ label:'이용현황 조회' }
    ]},
    { label:'통계', children:[
      { label:'충전기 현황', href:'admin-infra-status.html' },
      { label:'충전기 이용량' }
    ]},
    { label:'대시보드', children:[
      { label:'최적위치 적정지수' },{ label:'시공 관리' },{ label:'통계' },{ label:'시뮬레이터' },
      { label:'통합 지도' },{ label:'시뮬레이터(관리자)' },{ label:'사용자 가중치 이력' },{ label:'최적위치 적정지수(신)' }
    ]},
    { label:'수요조사', children:[
      { label:'(과거)신청현황' },{ label:'신규 수요 신청' },{ label:'수요 신청(일괄)' },{ label:'(과거)반려현황' },
      { label:'진행 현황' },{ label:'사업 관리' },{ label:'충전기 교체 신청' },{ label:'신규 수요 신청(신)' }
    ]},
    { label:'현장조사', children:[
      { label:'현장 조사 현황' }
    ]},
    { label:'충전시설 지점선정 지수' },
    { label:'지점선정 의사결정지원', children:[
      { label:'지역별 수요정보' },{ label:'상세 지점정보' }
    ]},
    { label:'충전시설 이전개선 분석' },
    { label:'이용 관리(완속 지원)', children:[
      { label:'이용신청 관리' }
    ]}
  ];

  // §B-2 수소충전인프라(hev) — 그룹 7 (잔재 구화면 제외)
  var HEV = [
    { label:'사업등록관리', children:[
      { label:'진행사업' },{ label:'보완요청' },{ label:'신규사업등록' },
      { label:'기획설계 입력' },{ label:'인허가 입력' },{ label:'구축공정 입력' },{ label:'구축정보 입력' },
      { label:'보완 입력(2종)' }
    ]},
    { label:'사용자관리', children:[
      { label:'이용신청관리' },{ label:'이용자관리' },{ label:'사업자관리' },{ label:'사업자 등록/수정' }
    ]},
    { label:'현황관리', children:[
      { label:'수소충전소 현황' },{ label:'현황 지도' },{ label:'수소차 등록대수' },{ label:'관리대장' },
      { label:'상업운영' },{ label:'월간보고 현황' },{ label:'관리대장 통계' },{ label:'관리대장 설정' }
    ]},
    { label:'관리카드', children:[
      { label:'관리카드 현황' },{ label:'보고 현황' },{ label:'관리카드 목록' },{ label:'관리카드 상세' },{ label:'관리카드 설정' }
    ]},
    { label:'기술검토', children:[
      { label:'기술검토 통계' },{ label:'기술검토' },{ label:'기술검토 제출' }
    ]},
    { label:'헬프데스크', children:[
      { label:'문의 현황' },{ label:'문의 내역' },{ label:'문의 신청' },{ label:'문의 상세' },{ label:'관련법령 관리' }
    ]},
    { label:'유지보수 비용', children:[
      { label:'신청 현황' },{ label:'비용 신청' },{ label:'비용 검토' },{ label:'기준리스트 관리' },
      { label:'통계' },{ label:'접수 설정' },
      { label:'신청/청구서/증빙/통보서/이의신청 폼' }
    ]}
  ];

  // 사이트 탭 2개 (급속·분석 / 수소충전인프라)
  window.ADMIN_MENU_INFRA = [
    { key:'evplus', label:'급속·분석 (EVPLUS)', side: EVPLUS },
    { key:'hev',    label:'수소충전인프라 (hev)', side: HEV }
  ];
})();
