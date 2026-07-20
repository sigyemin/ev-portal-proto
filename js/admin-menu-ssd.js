/* ============================================================================
   완속·브랜드 시스템(ev_ssd) 셸 메뉴 — TNSM_BRND_MENU 실사 (v0.30 4호)
   근거: 회의록/완속브랜드_충전인프라_메뉴IA_20260720.md §A (트리 그대로 · (구)·DEL_YN=Y 제외)
   특성: TNSM_BRND_MENU = 메뉴+화면등록부 겸용 — UPPER 없는 LV1 다수는 상세/팝업/엑셀 화면(메뉴 아님, IA 제외).
         BUSI_MENU=Y → 사업자(외부)용 / N → 관리자(공단)용. 셸 상단 역할 토글로 전환(더미).
   실링크: 공모신청 관리 3종 → admin-ssd-contest.html (탭 파라미터로 구분)
   ⚠ 완속 직접신청(sc/directApply·sc/mgr — SC_DIRECT_APPLY/SC_APPLY, 매트릭스 A5) 메뉴가
     TNSM_BRND_MENU에 없음 — 메뉴 원천 미확인(하드코딩/별도 사이트 추정). 개발팀 확인 대상.
   구조는 admin-menu-ntp.js·admin-menu-ps.js와 동일({label, children, href, badge}).
   ============================================================================ */
(function(){
  'use strict';

  // 관리자(공단)용 — BUSI_MENU=N · 근거 §A '관리자(공단)용 메뉴' 4그룹
  window.ADMIN_MENU_SSD = [
    { label:'기본정보 관리', children:[
      { label:'이용신청 관리' },
      { label:'사업자 관리' },
      { label:'공지사항' },
      { label:'자료실' },
      { label:'사업수행기관 선정 현황' },
      { label:'공모신청 안내 관리' }
    ]},
    { label:'사업관리', children:[
      { label:'예산관리' },
      { label:'사업 등록 관리' },
      { label:'사업별 충전기 등록' },
      { label:'설치 지점 관리' },
      { label:'설치 지점별 통계' },
      { label:'설치 지점별 로밍 충전기 관리' }
    ]},
    { label:'설치보조금 관리', children:[
      { label:'선급금 관리' },
      { label:'준공금 관리' },
      { label:'지급관리' },
      { label:'브랜드사업 준공서류 제출' }
    ]},
    { label:'공모신청 관리', children:[
      { label:'사업수행기관 공모신청 관리', href:'admin-ssd-contest.html?tab=busi' },
      { label:'브랜드사업 공모신청 관리', href:'admin-ssd-contest.html?tab=brand' },
      { label:'BSS 공모신청 관리', href:'admin-ssd-contest.html?tab=bss' }
    ]}
  ];

  // 사업자(외부)용 — BUSI_MENU=Y · 근거 §A '사업자용 메뉴' 2그룹 (역할 전환 참고용)
  window.ADMIN_MENU_SSD_BIZ = [
    { label:'사업관리', children:[
      { label:'사업자 관리' },
      { label:'사업 정보 관리' },
      { label:'충전기 등록' }
    ]},
    { label:'보조금 관리', children:[
      { label:'선급금 신청' },
      { label:'준공금 신청' },
      { label:'브랜드사업 준공서류 제출' }
    ]}
  ];
})();
