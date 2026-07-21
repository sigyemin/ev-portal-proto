/* ============================================================================
   통합관리시스템(D0002) 셸 메뉴 — TNCM_MENU 실사 그대로 (v0.30 2호)
   근거: 회의록/통합관리시스템_메뉴IA_20260716.md (검증계 TNCM_MENU, DMN_ID='D0002', DEL_YN='N')
   규칙: 이 트리 그대로 — 항목 추가/개명/재배열 금지 · USE_YN=(N) 항목 제외됨
         (제외: 회원별 충전이력(LV2)·이용신청 승인·이용신청 승인 변경이력·민간운영자 승인·
          민간운영자 승인 변경이력·SMS·로밍 검증·시스템설정(하위 포함)·게시판관리(팝업·배너)·APP Q&A)
   예외: '서식다운로드' = 신설 항목(badge:'신설') — 시스템관리 > 게시판 관리 > 질의응답(건의사항) 다음 순번
         '충전사업자 투명성지수' = 신설 항목(badge:'신설') — 통계 그룹 말미(ISS-007 · 공단관리자 전용,
         대민 제거 후 관리자 이관 · TNCM_MENU 신규 등록 필요 · 최종 위치는 개발 협의)
   실링크 3개(질의응답·서식다운로드·충전사업자 투명성지수) 외 전부 스텁('준비 중').
   [DEV] 이후 타 시스템 셸(구매보조금 등)도 동일 구조({label, children/href}) 재사용 예정.
   ============================================================================ */
window.ADMIN_MENU_NTP = [
  { label:'인프라관리', children:[
    { label:'충전 현황' },
    { label:'충전인프라', children:[
      { label:'충전기 현황' },{ label:'사업관리' },{ label:'충전소 정보' },{ label:'충전기 정보' },
      { label:'충전기 통신이상 현황' },{ label:'충전기 알람 정보' },{ label:'완속충전기 정기 점검(구)' },
      { label:'충전기 요금' },{ label:'충전기 그룹관리' },{ label:'통신에러조회' },
      { label:'수소충전소 정보' },{ label:'수소충전소 정보(API)' },{ label:'전기이륜차충전소 정보' },
      { label:'전기이륜차 사업자관리' },{ label:'충전 요금 정보' },{ label:'충전기 고유번호 관리' }
    ]},
    { label:'원격제어' },
    { label:'배포', children:[ { label:'배포' },{ label:'배포 대상 그룹' } ]},
    { label:'산업부보조금', children:[ { label:'충전기정보' },{ label:'충전이력정보' } ]},
    { label:'운영사별 충전요금' },
    { label:'업체공유게시판', children:[ { label:'비상연락망' },{ label:'의견공유게시판' } ]},
    { label:'전기차배터리 상태정보' },
    { label:'이동형 배터리 충전장치', children:[ { label:'차량정보 관리' },{ label:'운행담당자 관리' },{ label:'서비스 신청 관리' } ]}
  ]},
  { label:'이용자/이용량', children:[
    { label:'이용자', children:[
      { label:'회원 현황' },{ label:'회원 정보' },{ label:'회원 카드 신청서' },{ label:'회원 카드' },
      { label:'회원별 충전이력' },{ label:'접속자 이력' },{ label:'개인정보 접속기록' },{ label:'회원카드 예외차량 정보' }
    ]},
    { label:'이용량', children:[
      { label:'충전이력 현황' },{ label:'충전이력' },{ label:'충전기별 이력' },{ label:'전체충전 이력' }
    ]}
  ]},
  { label:'로밍', children:[
    { label:'로밍 충전기 현황' },
    { label:'로밍 사업자 관리', children:[
      { label:'사업자정보' },{ label:'담당자정보' },{ label:'키' },{ label:'요금' },{ label:'신청' },{ label:'운영자' },
      { label:'충전기 인증서 발급 신청' },{ label:'VPN 접속 사전 신청' },{ label:'내 VPN 신청 내역' },
      { label:'VPN 접속 신청 관리' },{ label:'VPN IP 관리' }
    ]},
    { label:'로밍 협약관리', children:[ { label:'신청관리' },{ label:'협약요금' },{ label:'협약관리' } ]},
    { label:'로밍 요금 관리' },
    { label:'로밍 자료 관리', children:[
      { label:'충전기 등록' },{ label:'등록(완전비공개)' },{ label:'충전기 인증서 발급' },
      { label:'배터리 상태정보 검증' },{ label:'충전기 승인' },{ label:'양도/양수관리' }
    ]},
    { label:'로밍 자료 조회', children:[
      { label:'충전기' },{ label:'회원' },{ label:'충전이력' },{ label:'최근요청' },{ label:'실시간' },
      { label:'타기관 회원 충전이력' },{ label:'상태미전송' }
    ]},
    { label:'불편민원신고센터', children:[
      { label:'불편민원신고센터(관리자)' },{ label:'불편민원신고센터' },{ label:'충전기담당자관리' }
    ]},
    { label:'로밍 정산', children:[ { label:'월간 자료' },{ label:'검증' },{ label:'정산' },{ label:'정산-종합표' } ]}
  ]},
  { label:'플랫폼사업자', children:[
    { label:'플랫폼 이용 현황' },
    { label:'사업자 관리' },
    { label:'최근요청이력' },
    { label:'트랜젝션 조회' },
    { label:'충전이력' },
    { label:'충전완료 이력' },
    { label:'QRCODE 등록관리' },
    { label:'플랫폼정산관리', children:[
      { label:'협약' },{ label:'수수료' },{ label:'운영자 신청' },{ label:'담당자정보' },
      { label:'정산 검증' },{ label:'정산' },{ label:'종합표' }
    ]},
    { label:'포인트정산관리', children:[
      { label:'사업자' },{ label:'수수료' },{ label:'담당자정보' },{ label:'정산 검증' },{ label:'정산' },{ label:'종합표' }
    ]}
  ]},
  { label:'연계', children:[
    { label:'연계기관' },{ label:'연계메시지' },{ label:'연계현황' },{ label:'무공해차 차량이력' },
    { label:'배치실행 현황' },{ label:'충전기 연계오류 현황' },{ label:'로밍배치실행 현황' },{ label:'원격리셋 배치실행 현황' }
  ]},
  { label:'통계', children:[
    { label:'사이트 통계', children:[ { label:'사용자' },{ label:'회원' },{ label:'접속' },{ label:'만족도 조사' } ]},
    { label:'불편민원' },
    { label:'지역별_월별 충전 고장' },
    { label:'총리실연계정보' },
    { label:'전기차 충전소 현황' },
    { label:'차종별 신규등록 현황' },
    { label:'구매보조금 현황' },
    { label:'공개자료 다운로드 현황' },
    { label:'충전사업자 투명성지수', href:'admin-tindex.html', badge:'신설' }
  ]},
  { label:'통합결제', children:[
    { label:'결제 처리' },
    { label:'결제내역', children:[
      { label:'회원(이니시스)' },{ label:'문자발송 이력' },{ label:'재결제 조회' },{ label:'빌키 재등록 현황' }
    ]},
    { label:'비회원 결제', children:[
      { label:'PG 일별 거래' },{ label:'나이스' },{ label:'KICC 비회원' },{ label:'비회원 결제 목록' },
      { label:'NICE 거래 비교' },{ label:'KICC 거래 비교' },{ label:'KICC(Noti) 거래 비교' },{ label:'결제요청 정보관리' }
    ]},
    { label:'알람' },
    { label:'한전 고지서 대사' },
    { label:'통계', children:[
      { label:'충전이력' },{ label:'PG사별' },{ label:'Fault' },{ label:'충전소/충전기 설치' },
      { label:'충전기 상태별' },{ label:'충전기 요금별' },{ label:'환경부 회원' },{ label:'회원카드 발급' },
      { label:'로밍 회원별' },{ label:'로밍 충전기별' },{ label:'전기 요금' }
    ]}
  ]},
  { label:'시스템관리', children:[
    { label:'시스템 관리', children:[
      { label:'시스템 정책' },{ label:'메뉴 관리' },{ label:'권한그룹' },{ label:'권한' },
      { label:'관리자 말소이력' },{ label:'로그인 정책' },{ label:'운영코드그룹' },{ label:'운영코드' },
      { label:'운영코드(구형)' },{ label:'차량모델 관리' },{ label:'공휴일 관리' },
      { label:'권한전환관리' },{ label:'구형운영코드정합성관리' }
    ]},
    { label:'프로그램 관리', children:[ { label:'관리' },{ label:'변경요청' } ]},
    { label:'게시판 관리', children:[
      { label:'법령/지침/가이드라인' },{ label:'보도자료' },{ label:'용어사전' },{ label:'자료실' },
      { label:'홍보자료' },{ label:'공지사항' },
      { label:'질의응답(건의사항)', href:'admin-board-qna.html' },
      { label:'서식다운로드', href:'admin-board-forms.html', badge:'신설' },
      { label:'FAQ' },{ label:'수소충전소 Help Desk' },{ label:'상담관리' },{ label:'공개자료' },{ label:'요청자료(지자체)' }
    ]},
    { label:'메인 관리', children:[ { label:'팝업' },{ label:'배너' },{ label:'자주 찾는 서비스' } ]},
    { label:'계정 보안 관리', children:[
      { label:'환경 설정' },{ label:'접근 이력' },{ label:'차단 이력' },{ label:'인증 실패' },{ label:'메뉴 접근 이력' }
    ]},
    { label:'APP 게시판 관리', children:[ { label:'공지사항' },{ label:'FAQ' },{ label:'이벤트' } ]},
    { label:'차량현황 관리' },
    { label:'업무처리지침 이력관리' }
  ]}
];
