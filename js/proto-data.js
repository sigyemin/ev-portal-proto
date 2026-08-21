/* ============================================================
   [EVAX 프로토타입 v1.01] 공통 더미 데이터
   - 2026-08-20 운영(ev.or.kr) 화면에서 확인한 구조·수치를 기준으로 구성
   - 실제 값이 아닌 시연용 데이터입니다.
   ============================================================ */
(function () {
  'use strict';

  /* ── 1) 지자체별 보조금 현황 (지역 × 공고차수) ── */
  var LOCALS = [
    ["서울특별시", 15430, 15342, 15195, 14320, 235, 1110],
    ["부산광역시",  7467,  7463,  7447,  7121,  20,  346],
    ["대구광역시",  5120,  5006,  4980,  4610,  140,  510],
    ["인천광역시",  6340,  6180,  6120,  5730,  220,  610],
    ["광주광역시",  3180,  3044,  3010,  2820,  170,  360],
    ["대전광역시",  3420,  3290,  3255,  3030,  165,  390],
    ["울산광역시",  2260,  2140,  2118,  1960,  142,  300],
    ["세종특별자치시", 980,  918,   905,   840,   75,  140],
    ["경기도",     24380, 24010, 23860, 22140, 520, 2240],
    ["강원특별자치도", 4120, 3960, 3920, 3610, 200,  510],
    ["충청북도",    3860,  3702,  3670,  3410,  190,  450],
    ["충청남도",    4520,  4368,  4330,  4010,  190,  510],
    ["전북특별자치도", 3740, 3588, 3555, 3290, 185,  450],
    ["전남광주통합특별시", 4180, 4020, 3985, 3690, 195, 490],
    ["경상북도",    5240,  5062,  5020,  4650,  220,  590],
    ["경상남도",    6120,  5934,  5890,  5450,  230,  670],
    ["제주특별자치도", 2980, 2856, 2825, 2610, 155,  370]
  ];
  var NOTICES = [
    ["본공고",   "2026.01.26 10:00 ~ 2026.06.22 18:00"],
    ["추경1차", "2026.07.27 10:00 ~ 2026.08.07 13:00"],
    ["추경2차", "2026.08.07 14:00 ~ 2026.08.07 15:00"]
  ];
  var CARS = ["전기승용", "전기화물", "전기승합"];

  function fmt(n) { return Number(n).toLocaleString(); }

  var subsidyRegion = [];
  LOCALS.forEach(function (L) {
    var sido = L[0];
    NOTICES.forEach(function (N, ni) {
      var ratio = ni === 0 ? 1 : (ni === 1 ? 0.22 : 0.06);
      subsidyRegion.push({
        sido:  ni === 0 ? sido : "",           // 지역: 첫 행에만(병합 표현)
        carNm: CARS[0],
        noticeKind: N[0],
        period: N[1],
        deadline: "2026.08.07 13:00",
        stepCnt: fmt(Math.round(L[1] * ratio)),
        recei:   fmt(Math.round(L[2] * ratio)),
        choice:  fmt(Math.round(L[3] * ratio)),
        relea:   fmt(Math.round(L[4] * ratio)),
        choiceRemain: fmt(Math.round(L[5] * ratio)),
        resi:    fmt(Math.round(L[6] * ratio)),
        _sido: sido
      });
    });
  });

  /* ── 2) 게시판 공통(공지/보도/홍보/공개/자료실 등) ── */
  function board(prefix, titles) {
    return titles.map(function (t, i) {
      var d = new Date(2026, 7, 20 - i * 2);
      return {
        no: titles.length - i,
        title: t,
        writer: "한국환경공단",
        date: d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2),
        hit: 1200 - i * 37,
        file: i % 3 === 0
      };
    });
  }

  var notice = board("공지", [
    "2026년 하반기 전기자동차 구매보조금 지원사업 안내",
    "무공해차 통합누리집 개편 오픈 안내",
    "회원카드 결제정보 재등록 안내",
    "2026년 전기이륜차 보급사업 공고",
    "충전요금 할인 미적용 신고 접수 안내",
    "추석 연휴 콜센터 운영 안내",
    "수소충전소 Help Desk 운영 안내",
    "전기차 충전 인프라 확충 계획 공고",
    "개인정보처리방침 개정 안내",
    "시스템 정기점검에 따른 서비스 일시중단 안내"
  ]);

  var faq = [
    { cat: "보조금", q: "전기차 보조금은 어떻게 신청하나요?" },
    { cat: "보조금", q: "지자체 보조금은 어디서 확인하나요?" },
    { cat: "보조금", q: "보조금 신청 후 얼마나 기다려야 하나요?" },
    { cat: "보조금", q: "2년 내 차량을 팔면 보조금을 반납하나요?" },
    { cat: "충전", q: "회원카드는 어떻게 신청하나요?" },
    { cat: "충전", q: "충전기 고장은 어디에 신고하나요?" },
    { cat: "충전", q: "충전 내역은 어디서 조회하나요?" },
    { cat: "충전", q: "결제 후 오류가 났을 때 어떻게 하나요?" },
    { cat: "충전", q: "전기차 충전요금은 얼마인가요?" },
    { cat: "회원", q: "이미 가입되어 있다고 나옵니다." }
  ].map(function (o, i) {
    return { no: 10 - i, cat: o.cat, title: o.q, date: "2026-08-" + ("0" + (20 - i)).slice(-2), hit: 900 - i * 24 };
  });

  /* ── 3) 용어사전 ── */
  var dictionary = [
    ["완속충전", "Slow charging", "교류(AC) 전원으로 3~7kW 수준의 낮은 출력으로 충전하는 방식. 충전에 4~6시간이 걸리지만 배터리 부담이 적습니다."],
    ["급속충전", "Fast charging", "직류(DC) 전원으로 50kW 이상 출력으로 충전하는 방식. 30분 내외로 80%까지 충전할 수 있습니다."],
    ["초급속충전", "Ultra-fast charging", "200kW 이상 출력으로 충전하는 방식. 20분 이내에 80%까지 충전이 가능합니다."],
    ["로밍", "Roaming", "내 회원카드(발급 사업자)로 다른 사업자가 운영하는 충전기를 이용하는 것. 협약된 사업자 간에만 가능합니다."],
    ["CPO", "Charge Point Operator", "충전기를 설치·운영하는 충전사업자."],
    ["무공해차", "Zero Emission Vehicle", "주행 중 배출가스를 전혀 배출하지 않는 자동차. 전기차·수소차가 해당합니다."],
    ["저공해차", "Low Emission Vehicle", "배출가스가 기준 이하인 자동차. 1종(전기·수소), 2종(하이브리드), 3종(내연기관 저배출)으로 구분합니다."],
    ["국고보조금", "National subsidy", "무공해차 구매 시 국가가 지원하는 보조금. 차종·성능·차량 가격에 따라 산정됩니다."],
    ["지방비", "Local subsidy", "지자체가 국고보조금과 별도로 지원하는 보조금. 지자체 예산에 따라 금액과 물량이 다릅니다."],
    ["전환지원금", "Conversion incentive", "노후 경유차 등을 폐차하고 무공해차로 전환할 때 추가 지급하는 지원금. 소계에는 포함되지 않습니다."],
    ["DC콤보", "CCS Combo", "국내 표준 급속충전 커넥터 규격(Combined Charging System)."],
    ["V2L", "Vehicle to Load", "전기차 배터리 전력을 외부 기기에 공급하는 기능."],
    ["SOC", "State of Charge", "배터리 충전 상태를 백분율로 나타낸 값."],
    ["BSS", "Battery Swapping Station", "전기이륜차 등의 배터리를 충전된 것으로 교체해 주는 시설."],
    ["환수금", "Subsidy recovery", "의무운행기간 내 차량을 처분하는 등 지원 조건을 위반한 경우 반납해야 하는 보조금."]
  ].map(function (r, i) {
    return { NUM: 15 - i, KOR_DIC: r[0], ENG_DIC: r[1], DESCRIPTION: r[2] };
  });

  /* ── 4) 요청자료 ── */
  var REQ_STATUS = ["접수", "처리중", "회신완료", "회신완료", "반려"];
  var REQ_CATE = ["충전기", "보조금", "기타"];
  var request = [
    "전국 급속충전기 설치 현황 자료 요청",
    "2026년 전기차 보조금 지자체별 집행 현황",
    "충전사업자별 충전기 보유 대수 자료",
    "수소충전소 위치 및 운영시간 목록",
    "전기이륜차 보급 대수 연도별 추이",
    "무공해차 등록 현황(차종별) 자료 요청",
    "충전요금 단가 변동 이력 자료",
    "지자체별 보조금 잔여 예산 현황",
    "전기버스 보급 실적 자료 요청",
    "충전기 고장 신고 접수 건수 통계"
  ].map(function (t, i) {
    return {
      NUM: 10 - i, TITLE: t,
      REQ_STATUS_NM: REQ_STATUS[i % REQ_STATUS.length],
      REQ_CATE_NM: REQ_CATE[i % REQ_CATE.length],
      REG_DT: "2026-08-" + ("0" + (20 - i * 2)).slice(-2),
      RES_FILE_MASK: i % 3 === 0 ? "Y" : "",
      ARTC_ID: "REQ" + (100 + i)
    };
  });

  /* ── 5) 완속충전기 제품 안내 ── */
  var MAKERS = [
    ["B01", "대영채비", "02-2000-1000", "www.chaevi.com"],
    ["B02", "파워큐브", "02-3000-2000", "www.powercube.co.kr"],
    ["B03", "에버온", "02-4000-3000", "www.everon.co.kr"],
    ["B04", "휴맥스EV", "031-5000-4000", "www.humaxev.com"]
  ];
  var CTYPES = ["벽부형", "스탠드형", "이동형"];
  var VOLUMES = ["3kW", "7kW", "11kW"];
  var chargerProduct = { blist: [], makers: {} };
  MAKERS.forEach(function (m, mi) {
    chargerProduct.blist.push({ BID: m[0], BNM: m[1] });
    var imgList = [];
    for (var i = 0; i < 6; i++) {
      imgList.push({
        MODEL_NM: m[1].slice(0, 2).toUpperCase() + "-" + (100 + mi * 10 + i),
        CTYPE: CTYPES[(mi + i) % 3],
        VOLUME: VOLUMES[i % 3],
        CSIZE: (300 + i * 20) + " x " + (500 + i * 15) + " x 180 mm",
        MATERIAL: i % 2 ? "알루미늄" : "강판(분체도장)",
        CABLE: (3 + i % 3) + "m 일체형",
        PAYMENT: "회원카드",
        CFEE1: "Y", CFEE2: i % 2 ? "Y" : "", CFEE3: i % 3 === 0 ? "Y" : "",
        CFEE4: "", CFEE5: "",
        PRICE: (150 + i * 12) + "만원",
        ADDPRODUCT: i % 2 ? "과금형 콘센트" : "",
        NOTE: "환경부 보급형 인증 제품",
        ATTCH_ID: ""
      });
    }
    chargerProduct.makers[m[0]] = {
      busiInfo: { BID: m[0], BNM: m[1], PHONE: m[2], URL: m[3] },
      imgList: imgList
    };
  });

  /* ── 6) 내 회원카드 / 충전 이력 ── */
  var CARD_TYPES = ["개인", "개인", "법인", "개인"];
  var CARD_STATE = [
    { cd: "1", nm: "사용가능" }, { cd: "1", nm: "사용가능" },
    { cd: "3", nm: "분실정지" }, { cd: "2", nm: "발급대기" }
  ];
  /* 필드명은 회원카드 화면 렌더 함수(fnBillCell/fnStatusCell)가 읽는 키를 그대로 따른다 */
  var memberCard = [
    ["9451 0021 3388 1204", "12가3456", "아이오닉 6", "신한 1234"],
    ["9451 0021 3388 2277", "34나7890", "EV6", "국민 5678"],
    ["9451 0021 3388 3391", "56다1234", "포터 II 일렉트릭", "-"],
    ["미발급", "78라5678", "니로 EV", ""]
  ].map(function (r, i) {
    var st = CARD_STATE[i];
    var isApply = (r[0] === "미발급");
    var hasBill = r[3] !== "-" && r[3] !== "";
    return {
      RNUM: i + 1, SECTION: isApply ? "APPLY" : "CARD",
      CARD_NO: r[0], CARDNO: r[0],
      CARD_TYPE_NM: CARD_TYPES[i],
      CAR_ID: r[1], CAR_INFO_NM: r[2],
      BILL_KEY: hasBill ? "BK" + (1000 + i) : "",
      BILL_CARD_CD_NM: hasBill ? r[3].split(" ")[0] + "카드" : "",
      BILL_CARD_MEMO: hasBill ? "****-" + r[3].split(" ")[1] : "",
      KP_YN: "N",
      USE_YN: st.cd === "1" ? "Y" : "N",
      LOSS_YN: st.cd === "3" ? "Y" : "N",
      STOP_YN: "N",
      CNT: 0, RE_SEQ: "",
      CARD_REQ_SEQ: isApply ? "R2026000" + (i + 1) : "",
      ISSUE_STAT_CD: isApply ? "0002" : "0005",
      ISSUE_STAT_NM: isApply ? "접수" : "발급완료",
      REG_DT: "2026-0" + (3 + i) + "-1" + (i + 2)
    };
  });

  var cardIssue = memberCard.map(function (c, i) {
    return {
      RNUM: i + 1, REQ_DT: c.REG_DT,
      ISSUE_WAY_NM: i % 2 ? "우편발송" : "직접수령",
      ISSUE_RSN_NM: i === 2 ? "분실 재발급" : "신규 발급",
      ISSUE_STAT_NM: c.ISSUE_STAT_NM,
      ADDR: "서울특별시 종로구 세종대로 1"
    };
  });

  var cardWallet = [
    { RNUM: 1, CARD_TYPE_NM: "법인", BUSI_NM: "환경부(한국환경공단)", CARD_NO: "9451 0021 3388 3391", HP_NO: "010-****-1234", STAT_NM: "사용중" },
    { RNUM: 2, CARD_TYPE_NM: "법인", BUSI_NM: "한국전력", CARD_NO: "9451 0021 3388 4402", HP_NO: "010-****-5678", STAT_NM: "사용중" }
  ];

  var CPO_NM = ["환경부(한국환경공단)", "한국전력", "GS차지비", "SK일렉링크", "에버온"];
  var chargeHistory = [];
  for (var ci = 0; ci < 10; ci++) {
    var kwh = 12 + (ci * 7) % 40;
    chargeHistory.push({
      RNUM: ci + 1,
      BNM: CPO_NM[ci % CPO_NM.length],
      SNM: ["서울시청 공영주차장", "여의도환승센터", "서울역 북부주차장", "용산역 환승주차장", "잠실종합운동장"][ci % 5],
      START_DT: "2026-08-" + ("0" + (20 - ci)).slice(-2) + " 0" + (7 + ci % 3) + ":1" + (ci % 5),
      END_DT:   "2026-08-" + ("0" + (20 - ci)).slice(-2) + " 0" + (8 + ci % 3) + ":2" + (ci % 5),
      CHARGE_KWH: kwh,
      CHARGE_AMT: Math.round(kwh * 347.2),
      PAY_DT: "2026-08-" + ("0" + (20 - ci)).slice(-2) + " 1" + (ci % 9) + ":00"
    });
  }

  /* ── 7) 충전요금 조회 거래내역 ── */
  var TRADE_CARDS = [
    ["9451002133881204", "9451-****-****-1204"],
    ["9451002133882277", "9451-****-****-2277"],
    ["9451002133883391", "9451-****-****-3391"]
  ];
  var TRADE_BUSI = [["B01", "환경부(한국환경공단)"], ["B02", "한국전력"], ["B03", "GS차지비"],
                    ["B04", "SK일렉링크"], ["B07", "에버온"]];
  var TRADE_STAT = ["정상", "정상", "정상", "정상", "결제실패"];
  var chargeTrade = [];
  for (var ti = 0; ti < 24; ti++) {
    var card = TRADE_CARDS[ti % TRADE_CARDS.length];
    var busi = TRADE_BUSI[ti % TRADE_BUSI.length];
    var kwh = 11 + (ti * 5) % 42;
    var min = 18 + (ti * 7) % 70;
    var fee = Math.round(kwh * (292.9 + (ti % 5) * 25));
    var stat = TRADE_STAT[ti % TRADE_STAT.length];
    var day = ("0" + (21 - ti % 21)).slice(-2);
    var hh = ("0" + (7 + ti % 12)).slice(-2);
    chargeTrade.push({
      NUM: ti + 1, BID: busi[0], BUSI_NM: busi[1],
      STAT_NM: ["서울시청 공영주차장", "여의도환승센터", "서울역 북부주차장",
                "용산역 환승주차장", "잠실종합운동장", "코엑스 지하주차장"][ti % 6],
      CARD_NO: card[1], CARD_NO_RAW: card[0],
      TSDT: "2026-08-" + day + " " + hh + ":10",
      TEDT: "2026-08-" + day + " " + ("0" + (Number(hh) + 1)).slice(-2) + ":" + ("0" + (min % 60)).slice(-2),
      POW: kwh, MIN: min,
      MON: fee, PAYMON: stat === "결제실패" ? 0 : fee,
      PERRMSG: stat,
      PAYDT: stat === "결제실패" ? "-" : "2026-08-" + day + " " + ("0" + (Number(hh) + 1)).slice(-2) + ":30",
      PAYRESULT: stat === "결제실패" ? "N" : "Y",   /* 영수증 버튼 노출 조건 */
      RECEIPT: stat === "결제실패" ? "" : "Y"
    });
  }

  /* ── 8) 지자체 보조금 담당부서 (보조금 현황 상세 모달) ── */
  var localPhone = [];
  (function () {
    var api = window.PROTO_API || {};
    (api.locals || []).forEach(function (L, i) {
      var n = 0, s = L.cd + 'phone';
      for (var k = 0; k < s.length; k++) n = (n * 131 + s.charCodeAt(k)) % 100003;
      localPhone.push({
        SHORT_AREA_NM: L.sido, LOCAL_NM: L.nm,
        PART_NM: ["기후환경과", "환경교통과", "환경정책과", "자원순환과"][n % 4],
        PART_PHONE: "0" + (2 + n % 6) + "-" + (200 + n % 700) + "-" + (1000 + n % 8000)
      });
    });
  })();

  window.PROTO_DATA = {
    subsidyRegion: subsidyRegion,
    notice: notice,
    faq: faq,
    dictionary: dictionary,
    request: request,
    chargerProduct: chargerProduct,
    memberCard: memberCard,
    cardIssue: cardIssue,
    cardWallet: cardWallet,
    chargeHistory: chargeHistory,
    chargeTrade: chargeTrade,
    localPhone: localPhone,
    board: board
  };
})();
