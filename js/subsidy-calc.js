/* subsidy-calc.js — 2026 보조금 계산 엔진 (ev_ps psSubsiSimulCalc.jsp 2026 로직 포팅)
   ────────────────────────────────────────────────────────────────────────
   · Ground truth: EVAX\98.소스\ev_ps\...\ps\config\psSubsiSimulCalc.jsp
       calAmt()(4042~) / calAddAmt()(3979~) / getLocalAmt()(3705~) /
       setModelChangeView()(3752~) / roundByUnit()(8879~)
   · 단위: 내부 계산은 모두 '원'. 화면 표기는 만원(원/10000).
   · 2026 핵심 규칙
       - 보조금 = (기본국비 + 추가국비) + (기본지방비 + 추가지방비) + 전환지원금(국비+지방비), × 신청대수
       - 모든 '추가 국비'는 지자체 지방비율(lamt_rate)로 국비:지방비 분배
           지방비 = roundByUnit(추가액, rate, rate+100, 1000),  국비 = 추가액 − 지방비
           제주는 add_lamt_rate(별도) 적용
       - 국비 상한: [F4] 전기차 상한(승용970·화물2,000·승합9,000만) 미적용(AS-IS 실코드 주석처리 계승) · 수소 승용 2,250만만 유지
   · 기본 단가(국비/지방비)·지자체 옵션은 프로토 mock. 계산식·분배·상한·배타규칙은 소스와 1:1.
   ──────────────────────────────────────────────────────────────────────── */
(function () {
  'use strict';

  var WON = 10000; // 만원 → 원
  var YEAR = '2026'; // 계산 기준연도 (소스 $('#s_year').val()) — year별 분기 보존

  /* ═══ [DEV] ISS-015·016 정합 반영 상태 (근거: 회의록/보조금계산기_실로직_대조검증_20260721.md) ═══
     ✅ F1 구매자 유형 분기 — 개인 P / 개인사업자 B / 법인·기관 G (§4-1 매트릭스 compute·UI 이중)
     ✅ F2 결과 4분할(국비/지방비/전환국비/전환지방비/합계) — pack() 반환
        ※ AS-IS 모의계산 결과 = 6분할(기본국비/추가국비/전환국비/기본지방비/추가지방비/전환지방비). 대민 4분할은 국비=기본+추가·지방비=기본+추가로 합산 표기(전환은 별도 2행)
     ✅ F4 국비 상한(승용970·화물2,000·승합9,000만) 제거 — AS-IS 실코드 주석처리(미작동) 계승. 수소 승용 2,250만만 유지
     ✅ F8 화물 농업인·택배 요율 = 10%(2026 실코드 ×10/100). 차상위·소상공인 30% 유지
     ✅ F9 전환지원금 기준단가 차종별 — 승용 500만 / 화물 경형 650만 / 화물 소형 850만(stdUnit). 화물 경형/소형은 cls 판정, 경형 명시 없으면 소형 대표값 → 모델 규격 정합 확인 필요
     ✅ F3 사회계층 유형 select(운영 실화면 확정 8종: 국가유공자/장애인/다자녀가구/다문화가족/기초생활수급자/소상공인/1차산업 종사자/기타 등) — 승용만 활성, 다자녀가구→자녀수 하위(정액 통합), 화물·승합은 유형 select 미노출
        · 2026 사회계층 지방비 = 전국 0원(PS_OPTION 플래그만 Y) → 다자녀가구·소상공인 특칙만 금액 반영. SOCIAL_ADD_EX(kind6 소상공인 제외) 규칙은 여전히 데모 미적용(확인 필요)
     ✅ F5 단가 실값 — 전환지방비 30만(예외 4159=33만 1곳)·사회계층 지방비 0·노후경유 폐차 지방비 기본 0(운영 3곳뿐: 130만/30만/30만)·전환국비100만·택시250만 전국 균일
        · 초소형 화물 추가 국비 SSML_EV_GAMT = 지자체별(서울 50만) 대표값 미적용, 확인 필요
     🔶 F6 이륜·건설기계 가산 = AS-IS 계산 분기 부재 → 데모(UI '미정—개발 협의' 배너)
     ⏸ F7 리스렌탈 180만(환경공단)·보급목표이행보조금·다대수 폐차 조합 — 대민 계산기 범위 제외
     ═══════════════════════════════════════════════════════════════════════════════════════════ */

  /* ── roundByUnit (소스 8879): Math.round(totAmt*rate/denum/unit)*unit ── */
  function roundByUnit(totAmt, rate, denum, unit) {
    return Math.round(totAmt * rate / denum / unit) * unit;
  }
  /* 2026 추가국비 분배: 지방비 = roundByUnit(tot, r, r+100, 1000), 국비 = tot − 지방비
     addRate(제주 add_lamt_rate) > 0 이면 우선 적용 (소스 4127~4129) */
  function splitAdd(totAmt, rate, addRate) {
    var r = (addRate > 0) ? addRate : rate;
    var lamt = roundByUnit(totAmt, r, r + 100, 1000);
    return { g: totAmt - lamt, l: lamt };
  }

  /* ── 지역(데모): 소분류 → { lamt: 기본지방비(만원), rate: 지방비율 lamt_rate, addRate: 제주 add_lamt_rate } ──
     rate = 국비 100 대비 지방비 분배 비율(소스 LAMT_RATE). 제주는 도외반출 +50만/별도 지방비율. */
  var REGIONS = {
    '서울특별시': { '강남구': { lamt: 180, rate: 50 }, '서초구': { lamt: 180, rate: 50 }, '송파구': { lamt: 180, rate: 50 }, '마포구': { lamt: 180, rate: 50 } },
    '경기도': { '수원시': { lamt: 400, rate: 70 }, '성남시': { lamt: 400, rate: 70 }, '고양시': { lamt: 450, rate: 70 }, '용인시': { lamt: 400, rate: 70 } },
    '부산광역시': { '해운대구': { lamt: 300, rate: 60 }, '부산진구': { lamt: 300, rate: 60 }, '사하구': { lamt: 300, rate: 60 } },
    '제주특별자치도': { '제주시': { lamt: 400, rate: 70, addRate: 80, jeju: true }, '서귀포시': { lamt: 400, rate: 70, addRate: 80, jeju: true } },
    '전라남도': { '여수시': { lamt: 520, rate: 90 }, '순천시': { lamt: 520, rate: 90 }, '목포시': { lamt: 520, rate: 90 } },
    '강원특별자치도': { '춘천시': { lamt: 480, rate: 80 }, '원주시': { lamt: 480, rate: 80 }, '강릉시': { lamt: 480, rate: 80 } }
  };

  /* ── 차종 → 제조사 → [모델, 국비(만원), 전환지원금단가(만원), 규격구분] ── */
  var MAKERS = {
    ev_car: {
      '현대': [['아이오닉 6 (일반)', 580, 100, '일반'], ['코나 일렉트릭 (일반)', 560, 100, '일반'], ['캐스퍼 일렉트릭 (경형)', 530, 100, '경형']],
      '기아': [['EV6 (일반)', 580, 100, '일반'], ['니로 EV (일반)', 560, 100, '일반'], ['레이 EV (경형)', 530, 100, '경형']],
      '테슬라': [['Model 3 (일반)', 340, 100, '일반'], ['Model Y (일반)', 340, 100, '일반']],
      'KG모빌리티': [['토레스 EVX (일반)', 520, 100, '일반']],
      '쎄보모빌리티': [['CEVO-C SE (초소형)', 350, 0, '초소형']]
    },
    ev_truck: {
      '현대자동차': [['포터Ⅱ 일렉트릭 (소형)', 968, 100, '소형'], ['ST1 카고 (소형)', 1200, 100, '소형']],
      '기아': [['봉고 전기차 (소형)', 1000, 100, '소형'], ['봉고 전기 냉동탑차 (소형)', 1172, 100, '소형']],
      '케이지모빌리티': [['MUSSO EV 2WD (소형)', 639, 75, '소형']],
      '디피코': [['포트로-탑S (초소형)', 380, 0, '초소형'], ['포트로-픽업S (초소형)', 380, 0, '초소형']],
      '대형상용(데모)': [['전기 5톤 윙바디 (중형)', 1600, 0, '중형'], ['전기 청소차 (대형)', 1900, 0, '대형']]
    },
    ev_bus: {
      '현대자동차': [['스타리아 일렉트릭 11인승 (소형)', 1500, 0, '소형'], ['카운티 일렉트릭 (중형)', 5000, 0, '중형'], ['카운티 어린이버스 (중형)', 8313, 0, '중형'], ['일렉시티 (대형·저상)', 6994, 0, '대형']],
      'MTR': [['ST1 승합 CV1 (소형)', 1471, 0, '소형'], ['ST1 어린이 CV1KIDS (소형)', 2936, 0, '소형']],
      '우진산전': [['아폴로700 (중형)', 5000, 0, '중형']]
    },
    ev_moto: {
      '디앤에이모터스': [['EM-1 (소형)', 75, 20, '소형'], ['ED-1A (소형)', 115, 20, '소형'], ['EM-1D 공유 (공유형 소형)', 80, 15, '공유형 소형']],
      '이오모터스': [['BONO (소형)', 100, 20, '소형']],
      '그린모빌리티': [['GMT-V6 (소형)', 96, 20, '소형'], ['JANGBORI-Ⅱ (기타형)', 111, 30, '기타형']],
      '케이알모터스': [['E-LUTION (소형)', 113, 20, '소형'], ['E-SKO TRI (기타형)', 123, 30, '기타형']]
    },
    fcev: {
      '현대자동차': [['넥쏘 (승용)', 2250, 0, '승용'], ['디 올 뉴 넥쏘 (승용)', 2250, 0, '승용'], ['엑시언트 수소트럭 (화물·대형)', 25000, 0, '화물 대형'], ['일렉시티 FCEV (승합·대형)', 21000, 0, '승합 대형']],
      '우진산전': [['아폴로 900 H2 (승합·대형)', 20457, 0, '승합 대형']]
    },
    const_eq: {
      'HD건설기계': [['ROBEX300LC-E 굴착기', 2365, 0, '건설기계'], ['DX20ZE 굴착기', 795, 0, '건설기계']],
      '두산밥캣코리아': [['E10e 굴착기', 525, 0, '건설기계']],
      '볼보그룹코리아': [['EC300F 굴착기', 2500, 0, '건설기계']]
    }
  };

  /* 차종 chip → 내부 car_type */
  var CAR_TYPE = { ev_car: '11', ev_truck: '12', ev_bus: '13', ev_moto: '21', fcev: 'H2', const_eq: 'EXCVT' };

  /* 규격구분 → model_type (소스 model_type) */
  function modelType(type, cls) {
    cls = cls || '';
    if (type === 'ev_car') return /초소형/.test(cls) ? 'RIDESML' : (/경형|소형/.test(cls) ? 'RIDELGT' : 'RIDE');
    if (type === 'ev_truck') {
      if (/초소형/.test(cls)) return 'TRUCKSSML';
      if (/중형/.test(cls)) return 'TRUCKMID';
      if (/대형/.test(cls)) return 'TRUCKBIG';
      return 'TRUCKLGT'; // 경형·소형
    }
    if (type === 'ev_bus') return /대형/.test(cls) ? 'BUSBIG' : (/중형/.test(cls) ? 'BUSMID' : 'BUSSML');
    if (type === 'ev_moto') return 'MOTOR';
    if (type === 'fcev') return 'H2';
    if (type === 'const_eq') return 'EXCVT';
    return 'RIDE';
  }

  /* ── 2026 단가 상수(데모, 2026 지침 값) ──
     실제로는 PS_OPTION/PS_MODEL_LOCAL DB. 여기선 지침 공개값 사용. (단위: 원) */
  var UNIT = {
    TAXI_GAMT: 2500000,        // 전기택시 국비 250만 (전국 균일 · 소스 taxi_gamt)
    TAXI_LAMT: 0,              // 지자체 택시 추가 지방비(데모 0)
    BMS: 200000,              // BMS 업데이트 불가차 폐차 후 신차 +20만
    MULTI: { 2: 1000000, 3: 2000000, 4: 3000000 }, // 다자녀 2자녀100/3자녀200/4자녀이상300만
    EXCHANGE3_GAMT: 1000000,   // 전환지원금 국비 100만 (전국 균일 · exchange_3year_gamt_total)
    EXCHANGE3_LAMT: 300000,    // [F5] 전환지원금 지방비 단가 30만 — 2026 PS_OPTION 실사 161/162 지자체 균일 30만(예외 4159=33만 1곳)
    EXCHANGE_ADD_LAMT: 0,      // [F5] 노후경유차 폐차 지방비 기본 0 — 2026 운영 3곳뿐(4479=130만·4688·4729 각 30만). 선택지 유지·기본 효과 0
    EXT_JEJU: 500000,          // 제주 도외반출 +50만 (ext_add_lamt_jeju)
    SOCIAL_ADD_LAMT: 0,        // [F5] 사회계층 지방비 = 전국 0 — 2026 PS_OPTION 플래그(SOCIAL_ADD_YN)만 'Y', 예산·별도지급 금액 전부 0원(데모 60만 제거)
    SSML_EV_GAMT: 0,           // 초소형 화물 지자체 추가 국비(데모 0) — [F5] 지자체별(서울 50만) · 대표값 미적용, 확인 필요
    // [F9] 전환지원금 기준단가 = 차종별: 전기승용 500만(:4319) / 전기화물 경형 650만(:5791) / 전기화물 소형 850만(:5793)
    STD_RIDE: 5000000,         // 승용 500만
    STD_TRUCK_LGT: 6500000,    // 화물 경형 650만
    STD_TRUCK_SML: 8500000,    // 화물 소형 850만
    // 어린이 통학차량용(school_bus) — 소스 init: year>=2024는 0으로 세팅(별도 모델 처리)
    SCHOOL_BUS_GAMT: 0,        // school_bus_gamt (≤2023 정액 국비; 2026=0)
    SCHOOL_BUS_LAMT: 0         // school_bus_lamt (≤2023 정액 지방비; 2026=0)
  };
  /* [F9] 전환지원금 기준단가 판정 — 승용 500만 / 화물 경형 650만 / 화물 소형 850만.
     화물 모델 데이터에 경형/소형 구분이 규격(cls)뿐이라 cls로 판정. '경형' 명시 없으면 소형(850만) 대표값 적용 → [DEV] 확인 필요 */
  function stdUnit(mt, cls) {
    if (mt === 'TRUCKLGT' || mt === 'TRUCKSML' || mt === 'TRUCKSSML') {
      if (/경형/.test(cls || '')) return UNIT.STD_TRUCK_LGT;      // 화물 경형 650만
      return UNIT.STD_TRUCK_SML;                                  // 화물 소형(초소형 포함) 850만 · 미판정=소형 대표값(확인 필요)
    }
    return UNIT.STD_RIDE;                                         // 승용 등 500만
  }
  /* 국비 상한(원) */
  var CAP = { ride: 9700000, truck: 20000000, bus: 90000000, h2: 22500000 };

  /* 수소 단가(원, 데모) — 승용 넥쏘 기본국비 2,250만이 이미 상한이라 택시 국비가산은 상한 처리됨 */
  var H2 = { TAXI_GAMT: 1000000, TAXI_LAMT: 0, TRUCK_ADD_LAMT: 2000000 };

  /* ───────────────────────── 계산 엔진 ─────────────────────────
     입력: { type, reqKind('P'개인|'B'개인사업자|'G'법인·기관), biz, gamt(만원), conv(만원), cls,
             region:{lamt,rate,addRate,jeju}, cnt, c:{...옵션} }
     반환(만원): { natBase,natAdd,chngG, locBase,locAdd,chngL, nat,loc,total } — 4분할(F2) + 기존 nat/loc/total 유지
     ★구매자 유형 매트릭스(§4-1): 차상위·청년·다자녀·전환 = P만 / 택시 = (G&&중기Y)‖B /
       BMS·노후경유·사회계층·농업인·택배·소상공인 = 유형 무관 / 화물 차상위 30% = P만
     ──────────────────────────────────────────────────────────── */
  function compute(p) {
    var type = p.type, mt = modelType(type, p.cls);
    var reqKind = p.reqKind, biz = p.biz, cnt = Math.max(1, p.cnt || 1);
    var c = p.c || {};
    var rate = p.region.rate || 0, addRate = p.region.addRate || 0;

    var gamt = (p.gamt || 0) * WON;      // 기본 국비(원)
    var lamt = (p.region.lamt || 0) * WON; // 기본 지방비(원)

    // 수소·건설기계·이륜은 전용 분기
    if (mt === 'H2') return computeH2(p);
    if (mt === 'MOTOR') return computeMotor(p);
    if (mt === 'EXCVT') return computeExcvt(p);

    var addGamt = 0, addLamt = 0;     // 추가 국비/지방비(분배 포함)
    var addLamt1 = 0;                 // 폐차 관련 지방비(대당)
    var chngGamt = 0, chngLamt = 0;   // 전환지원금
    function sp(tot) { var s = splitAdd(tot, rate, addRate); addGamt += s.g; addLamt += s.l; }

    /* ===== calAddAmt(): 지자체 옵션 지방비 ===== */
    // 노후경유차 폐차(exchange_yn) → 지방비(대당). 제주 도외반출이면 +50만 별도(여기선 add_lamt1에 합산)
    if (c.dieselScrap) {
      addLamt1 += UNIT.EXCHANGE_ADD_LAMT;
      if (p.region.jeju && c.jejuExport) addLamt1 += UNIT.EXT_JEJU;
    }
    // 사회계층(social_yn) 지방비 — kind6(소상공인)+SOCIAL_ADD_EX 제외 규칙은 데모상 미적용
    if (c.social === 'low' || c.social === 'small') addLamt += UNIT.SOCIAL_ADD_LAMT;

    /* ===== 전기승용 RIDE/RIDELGT (calAmt 4085~) ===== */
    if (mt === 'RIDE' || mt === 'RIDELGT') {
      // 차상위계층 20% (개인)
      if (c.poverty && reqKind === 'P') sp(gamt * 20 / 100);
      // 청년·생애최초 20% (개인, 만19~34)
      if (c.firstBuyYoung && reqKind === 'P') sp(gamt * 20 / 100);
      // BMS 폐차 후 신차 +20만
      if (c.bms) sp(UNIT.BMS);
      // 전기택시 250만: (법인G & 택시 & 중기Y) | (법인B & 택시)  ※개인 택시는 제외(소스 4247~)
      if (c.taxi && ((reqKind === 'G' && c.taxiBusi) || reqKind === 'B')) sp(UNIT.TAXI_GAMT);
      // 다자녀(개인·비사업자) 정액 100/200/300만 — 택시와 배타
      if (c.multiChild && reqKind === 'P' && !biz && !c.taxi) sp(UNIT.MULTI[c.multiChild] || 0);
      // 전환지원금(개인): 차종국비≥기준단가 → 100만 전액, 미만 → 100만×국비/기준단가(만원반올림). [F9] 승용 기준단가 500만
      if (c.exchange3 && reqKind === 'P') {
        var tot = UNIT.EXCHANGE3_GAMT, std = stdUnit(mt, p.cls);
        chngGamt = (gamt >= std) ? tot : Math.round(tot * gamt / std / WON) * WON;
        chngLamt = Math.round(chngGamt * UNIT.EXCHANGE3_LAMT / tot / WON) * WON;
      }
      return assemble(gamt, lamt, addGamt, addLamt, addLamt1, chngGamt, chngLamt, cnt, CAP.ride);
    }

    /* ===== 초소형 승용 RIDESML (calAmt 4493~) — 차상위/청년 20%, 택시·다자녀·전환 없음 ===== */
    if (mt === 'RIDESML') {
      if (c.poverty && reqKind === 'P') sp(gamt * 20 / 100);
      if (c.firstBuyYoung && reqKind === 'P') sp(gamt * 20 / 100);
      return assemble(gamt, lamt, addGamt, addLamt, addLamt1, 0, 0, cnt, CAP.ride);
    }

    /* ===== 전기화물 중·대형 TRUCKMID/BIG (calAmt 6442~) — 기본 + 사회계층 지방비만 ===== */
    if (mt === 'TRUCKMID' || mt === 'TRUCKBIG') {
      return assemble(gamt, lamt, addGamt, addLamt, addLamt1, 0, 0, cnt, CAP.truck);
    }

    /* ===== 전기화물 경/소/초소형 TRUCKLGT/SML/SSML (calAmt 4707~/5547~) =====
       2026 확정 분기(단일대 기준): 차상위(개인)·소상공인(kind6) 30% / [F8]농업인(farmng) 10% /
       [F8]택배·화물(hdry) 10% / 초소형 지자체추가국비(ssml). ※row-iteration(다대 폐차조합)은 단일대로 단순화 — 정밀 포팅 task3 */
    if (mt === 'TRUCKLGT' || mt === 'TRUCKSML' || mt === 'TRUCKSSML') {
      if ((c.poverty && reqKind === 'P') || c.social === 'small') sp(gamt * 30 / 100); // 차상위/소상공인 30%(실코드 확정)
      if (c.farmng) sp(gamt * 10 / 100); // [F8] 농업인 10% (2026 실코드 ×10/100 · :4819~)
      if (c.parcel) sp(gamt * 10 / 100); // [F8] 택배·물류(hdry) 10% (2026 실코드 ×10/100 · :4838~)
      if (mt === 'TRUCKSSML' && UNIT.SSML_EV_GAMT) addGamt += UNIT.SSML_EV_GAMT;
      // 전환지원금(개인·화물) — [F9] 화물 기준단가 = 경형 650만/소형 850만(cls 판정)
      if (c.exchange3 && reqKind === 'P') {
        var tot2 = UNIT.EXCHANGE3_GAMT, std2 = stdUnit(mt, p.cls);
        chngGamt = (gamt >= std2) ? tot2 : Math.round(tot2 * gamt / std2 / WON) * WON;
        chngLamt = Math.round(chngGamt * UNIT.EXCHANGE3_LAMT / tot2 / WON) * WON;
      }
      return assemble(gamt, lamt, addGamt, addLamt, addLamt1, chngGamt, chngLamt, cnt, CAP.truck);
    }

    /* ===== 전기승합 BUS* (calAmt 6507~) =====
       어린이 통학차량용(school_bus_yn): year-branch(2024 +20%/≤2023 정액/2026 0) → busSchoolGasan.
       2026 어린이버스는 별도 모델(높은 기본국비)로 반영, 런타임 가산 0. 사회계층 지방비(calAddAmt). 국비 상한 9,000만. */
    if (mt === 'BUSSML' || mt === 'BUSMID' || mt === 'BUSBIG') {
      if (c.schoolBus) {
        var sb = busSchoolGasan(gamt);
        gamt = sb.g;       // 가산 반영 기본국비 (2026=변화없음)
        lamt += sb.l;      // 추가 기본지방비 (2026=0)
      }
      return assemble(gamt, lamt, addGamt, addLamt, addLamt1, 0, 0, cnt, CAP.bus);
    }

    // 기타(else): 기본만 (소스 6595 default)
    return assemble(gamt, lamt, addGamt, addLamt, addLamt1, 0, 0, cnt, 0);
  }

  /* [F2] 결과 4분할 패킹 — 입력은 '원', 반환은 '만원'.
     반환 필드: natBase/natAdd(기본/추가 국비) · chngG(전환국비) · locBase/locAdd(기본/추가 지방비) · chngL(전환지방비)
              · nat/loc/total(기존 계약 유지 = 회귀 방지: nat=natBase+natAdd+chngG, loc=locBase+locAdd+chngL) */
  function pack(natBase, natAdd, chngG, locBase, locAdd, chngL) {
    var nat = natBase + natAdd + chngG, loc = locBase + locAdd + chngL;
    return {
      natBase: natBase / WON, natAdd: natAdd / WON, chngG: chngG / WON,
      locBase: locBase / WON, locAdd: locAdd / WON, chngL: chngL / WON,
      nat: nat / WON, loc: loc / WON, total: (nat + loc) / WON
    };
  }

  /* 총액 조립 (calAmt 6602~6631): 국비/지방비 합산.
     [F4] 국비 상한(승용 970·화물 2,000·승합 9,000만) 제거 — 사용자 확정(2026-07-21): 지침상 상한은 존재하나
          AS-IS 실코드는 적용부 전부 주석처리(미작동, :4090)이므로 실코드 계승으로 미적용. 수소 승용 2,250만 상한은
          실코드에 살아있어 computeH2에서 유지. capGamt 인자는 하위호환 위해 남기되 미사용. */
  function assemble(gamt, lamt, addGamt, addLamt, addLamt1, chngGamt, chngLamt, cnt, capGamt) {
    var req_gamt = gamt * cnt;                 // 기본 국비
    var req_add_gamt = addGamt * cnt;          // 추가 국비(분배 후, 전환 제외)
    var req_chng_add_gamt = chngGamt * cnt;    // 전환지원금 국비
    var req_lamt = lamt * cnt;                 // 기본 지방비
    var req_add_lamt = (addLamt1 * cnt) + (addLamt * cnt); // 추가 지방비(폐차 대당 + 일반 대당)
    var req_chng_add_lamt = chngLamt * cnt;    // 전환지원금 지방비
    return pack(req_gamt, req_add_gamt, req_chng_add_gamt, req_lamt, req_add_lamt, req_chng_add_lamt);
  }

  /* ===== 어린이 통학차량용 버스 school_bus_yn 분기 (소스 calAmt 6511~6526) =====
     반환: { g: 가산반영 기본국비(원), l: 추가 기본지방비(원) }  ※상한 9,000만 적용지점도 소스 그대로
     - year == 2024 : 기본국비 +20%, 9,000만 상한
     - year <= 2023 : +school_bus_gamt(국비)/+school_bus_lamt(지방비), 9,000만 상한
     - year >= 2025 : 런타임 가산 없음(어린이버스 = 별도 모델로 반영) → 변화 없음 */
  function busSchoolGasan(gamt) {
    if (YEAR === '2024') {
      var g24 = gamt + (gamt * 20 / 100);
      if (g24 > CAP.bus) g24 = CAP.bus;
      return { g: g24, l: 0 };
    }
    if (YEAR <= '2023') {
      var g23 = gamt + UNIT.SCHOOL_BUS_GAMT;
      if (g23 > CAP.bus) g23 = CAP.bus;
      return { g: g23, l: UNIT.SCHOOL_BUS_LAMT };
    }
    return { g: gamt, l: 0 }; // 2025·2026
  }

  /* ===== 수소 H2 (h2SellerApplyForm.jsp calAmt 2539 / calAddAmt 2504 — 1:1 포팅) =====
     - 국비: H2_RIDE(승용)=정액 + 택시 국비가산(taxi_gamt) → 상한 2,250만(max_taxi_gamt) 적용.
             버스/트럭=정액(가산·상한 없음, 소스 else 분기).  ※추가국비(%·분배) 없음.
     - 지방비(calAddAmt): truck_yn(화물추가) + exchange(폐차·대당) + social(kind6&EX 제외) + taxi_lamt.
     - 총액 = req_gamt + req_lamt + req_add_lamt. */
  function computeH2(p) {
    var c = p.c || {}, cnt = Math.max(1, p.cnt || 1);
    var gamt = (p.gamt || 0) * WON, lamt = (p.region.lamt || 0) * WON;
    var addLamt = 0, addLamt1 = 0;
    var isRide = /승용/.test(p.cls || '');
    if (isRide) {
      if (c.taxi) gamt += H2.TAXI_GAMT;          // 수소택시 국비 가산
      if (gamt > CAP.h2) gamt = CAP.h2;          // 승용 상한 2,250만 (버스/트럭은 미적용)
    }
    if (/화물/.test(p.cls || '')) addLamt += H2.TRUCK_ADD_LAMT; // truck_yn 화물 추가 지방비
    if (c.dieselScrap) addLamt1 += UNIT.EXCHANGE_ADD_LAMT;       // exchange 폐차 지방비(대당)
    if (c.social === 'low' || c.social === 'small') addLamt += UNIT.SOCIAL_ADD_LAMT; // 사회계층(소상공인 kind6 제외 규칙 데모 미적용)
    if (c.taxi) addLamt += H2.TAXI_LAMT;          // 택시 지방비
    // 수소는 %추가국비·분배·전환지원금 없음(소스 else 분기) → natAdd/chngG/chngL = 0
    return pack(gamt * cnt, 0, 0, lamt * cnt, (addLamt * cnt) + (addLamt1 * cnt), 0);
  }

  /* ===== 전기이륜 MOTOR (car_type 21) =====
     ※소스 calAmt에 MOTOR(이륜) 분기 없음 — getLocalAmt에서 일부 지자체(4122) 총액 70/30 분배만 존재.
       정밀 포팅 task4 / 소스 차이 보고 대상. 데모: 기본국비+사회계층/배달/폐차 지방비. */
  function computeMotor(p) {
    var c = p.c || {}, cnt = Math.max(1, p.cnt || 1);
    var gamt = (p.gamt || 0) * WON, lamt = (p.region.lamt || 0) * WON;
    var addGamt = 0, addLamt = 0;
    if (c.social) addLamt += 300000;          // 취약/소상공인/장애인/농업인 지방비(데모 30만)
    if (c.delivery) addLamt += 200000;        // 배달용(데모 20만)
    if (c.scrapMoto) addGamt += (p.conv || 0) * WON; // 폐차 후 구매 등급별 추가국비(모델 conv)
    // 특정 지자체(4122) 70/30 분배: getLocalAmt 3717~ — 데모 미적용(지자체코드 없음)
    // [F6] ★AS-IS calAmt에 이륜 계산 분기 부재 — 위 가산(사회계층 30만·배달 20만·폐차 conv)은 전부 데모(근거 없음, 개발 협의)
    return pack(gamt * cnt, addGamt * cnt, 0, lamt * cnt, addLamt * cnt, 0);
  }

  /* ===== 전기건설기계 EXCVT =====
     ※소스 calAmt에 EXCVT 계산 분기 없음(setModelChangeView에만 존재) → 기본만. 정밀 포팅 task4 / 차이 보고. */
  function computeExcvt(p) {
    var c = p.c || {}, cnt = Math.max(1, p.cnt || 1);
    var gamt = (p.gamt || 0) * WON, lamt = (p.region.lamt || 0) * WON;
    var addLamt = 0;
    if (c.social === 'low' || c.social === 'small') addLamt += UNIT.SOCIAL_ADD_LAMT;
    if (c.dieselScrap) addLamt += UNIT.EXCHANGE_ADD_LAMT;
    // [F6] ★AS-IS calAmt에 건설기계 계산 분기 부재 — 위 가산(사회계층 60만·폐차 50만 지방비)은 전부 데모(근거 없음, 개발 협의)
    return pack(gamt * cnt, 0, 0, lamt * cnt, addLamt * cnt, 0);
  }

  /* ─────────────── 차종별 가산옵션 UI 정의 ───────────────
     각 항목: { key, label, opts:[{t:표시, set:{...c}}] }  (첫 옵션 기본)
     set 의 키가 compute()의 c.* 로 전달됨. */
  var COND = {
    ev_car: [
      { key: 'poverty', label: '차상위·취약계층 (개인)', opts: [{ t: '해당 없음' }, { t: '차상위 이하 (국비 +20%)', set: { poverty: true }, req: ['P'] }] },
      { key: 'young', label: '청년·생애최초 (개인 만19~34)', opts: [{ t: '해당 없음' }, { t: '생애최초+청년 (국비 +20%)', set: { firstBuyYoung: true }, req: ['P'] }] },
      // [F3] 사회계층 여부+유형 select(8종) — 다자녀가구 선택 시 자녀수 하위 노출(기존 '다자녀' 항목 통합). 운영 실화면 확정
      { key: 'social', label: '사회계층 여부', custom: 'social' },
      { key: 'taxi', label: '전기택시', opts: [{ t: '해당 없음' }, { t: '전기택시 (+250만)', set: { taxi: true }, req: ['B', 'G'] }] },
      { key: 'bms', label: 'BMS 미지원차 폐차 후 신차', opts: [{ t: '해당 없음' }, { t: '해당 (+20만)', set: { bms: true } }] },
      { key: 'ex3', label: '전환지원금 (개인·내연 3년경과 교체)', opts: [{ t: '해당 없음' }, { t: '노후 내연기관 폐차/교체 (+100만 한도)', set: { exchange3: true }, req: ['P'] }] },
      { key: 'scrap', label: '노후경유차 폐차 (지방비)', opts: [{ t: '해당 없음' }, { t: '노후경유 폐차', set: { dieselScrap: true } }] }
    ],
    ev_truck: [
      { key: 'poverty', label: '차상위·소상공인', opts: [{ t: '해당 없음' }, { t: '차상위 이하 (개인, 국비 +30%)', set: { poverty: true }, req: ['P'] }, { t: '소상공인 (국비 +30%)', set: { social: 'small' } }] },
      { key: 'farm', label: '농업인', opts: [{ t: '해당 없음' }, { t: '농업인 (국비 +10%)', set: { farmng: true } }] },
      { key: 'parcel', label: '택배·물류 사용', opts: [{ t: '해당 없음' }, { t: '택배·물류 (국비 +10%)', set: { parcel: true } }] },
      { key: 'ex3', label: '전환지원금 (개인·내연 3년경과 교체)', opts: [{ t: '해당 없음' }, { t: '노후 내연기관 폐차/교체 (+100만 한도)', set: { exchange3: true }, req: ['P'] }] }
    ],
    ev_bus: [
      { key: 'schoolbus', label: '어린이 통학차량용 (전기 어린이 승합)', opts: [{ t: '일반 승합' }, { t: '어린이 통학차량용 (2026: 어린이 전용 모델 선택)', set: { schoolBus: true } }] },
      { key: 'social', label: '사회계층 (지방비)', opts: [{ t: '일반' }, { t: '차상위·취약계층', set: { social: 'low' } }, { t: '소상공인', set: { social: 'small' } }] }
    ],
    ev_moto: [
      { key: 'social', label: '취약계층 (차상위/소상공인/장애인/농업인)', opts: [{ t: '일반' }, { t: '해당 (지방비 +30만)', set: { social: 'low' } }] },
      { key: 'delivery', label: '배달 사용', opts: [{ t: '일반' }, { t: '배달용 (지방비 +20만)', set: { delivery: true } }] },
      { key: 'scrap', label: '내연 이륜 폐차 후 구매', opts: [{ t: '해당 없음' }, { t: '폐차 후 구매 (등급별 추가국비)', set: { scrapMoto: true } }] }
    ],
    fcev: [
      { key: 'taxi', label: '수소택시 (승용)', opts: [{ t: '해당 없음' }, { t: '수소택시', set: { taxi: true } }] },
      { key: 'social', label: '사회계층 (지방비)', opts: [{ t: '일반' }, { t: '차상위·취약계층', set: { social: 'low' } }, { t: '소상공인', set: { social: 'small' } }] },
      { key: 'scrap', label: '노후경유차 폐차 (지방비)', opts: [{ t: '해당 없음' }, { t: '노후경유 폐차', set: { dieselScrap: true } }] }
    ],
    const_eq: [
      { key: 'social', label: '사회계층 (지방비)', opts: [{ t: '일반' }, { t: '차상위·취약계층', set: { social: 'low' } }, { t: '소상공인', set: { social: 'small' } }] },
      { key: 'scrap', label: '내연기관 폐차 (지방비)', opts: [{ t: '해당 없음' }, { t: '내연기관 폐차', set: { dieselScrap: true } }] }
    ]
  };

  function fmt(n) {
    var v = Number(n);
    return v.toLocaleString('ko-KR', { maximumFractionDigits: 1 });
  }
  function fillSel(sel, opts, ph) {
    if (!sel) return;
    sel.innerHTML = '<option value="">' + ph + '</option>' +
      opts.map(function (o) {
        return '<option value="' + o[0] + '" data-v="' + (o[1] || '') + '" data-conv="' + (o[2] || 0) + '" data-cls="' + (o[3] || '') + '">' + o[0] + '</option>';
      }).join('');
  }

  function initCalc(root) {
    var r1 = root.querySelector('[data-calc-region1]'),
        r2 = root.querySelector('[data-calc-region2]'),
        mk = root.querySelector('[data-calc-maker]'),
        md = root.querySelector('[data-calc-model]'),
        condBox = root.querySelector('[data-calc-conditions]'),
        run = root.querySelector('[data-calc-run]'),
        result = root.querySelector('[data-calc-result]');

    fillSel(r1, Object.keys(REGIONS).map(function (k) { return [k]; }), '지자체 대분류 선택');
    if (r1) r1.addEventListener('change', function () {
      var sub = REGIONS[r1.value] || {};
      fillSel(r2, Object.keys(sub).map(function (k) { return [k]; }), '지자체 소분류');
    });
    if (mk) mk.addEventListener('change', function () { fillSel(md, (MAKERS[getType()] || {})[mk.value] || [], '모델 선택'); updateClsDisplay(); });

    function updateClsDisplay() {
      var row = condBox && condBox.querySelector('[data-cls-row]'); if (!row) return;
      var o = md && md.options[md.selectedIndex];
      var cls = o ? (o.getAttribute('data-cls') || '') : '';
      var inp = row.querySelector('[data-cls-display]'); if (inp) inp.value = cls || '';
      row.style.display = cls ? '' : 'none';
    }
    if (md) md.addEventListener('change', updateClsDisplay);

    function chipGroup(name, attr, onChange) {
      var g = root.querySelector('[data-calc-' + name + ']');
      if (g) g.addEventListener('click', function (e) {
        var b = e.target.closest('.chip-opt'); if (!b) return;
        g.querySelectorAll('.chip-opt').forEach(function (x) { x.classList.remove('active'); });
        b.classList.add('active');
        if (onChange) onChange();
      });
      return function () { var a = g && g.querySelector('.chip-opt.active'); return a ? a.getAttribute(attr) : ''; };
    }

    function renderType() {
      var t = getType();
      fillSel(mk, Object.keys(MAKERS[t] || {}).map(function (k) { return [k]; }), '제조사 선택');
      fillSel(md, [], '제조사 먼저 선택');
      if (condBox) {
        var conds = COND[t] || [];
        var clsRow = '<div class="calc-field" data-cls-row style="display:none;"><label>규격 (모델 선택 시 자동)</label>' +
          '<input class="calc-select" data-cls-display readonly placeholder="모델을 선택하세요"></div>';
        // [F1] 법인·기관 택시 중소기업 여부 하위선택(승용만, 기본 숨김)
        var smeField = (t === 'ev_car')
          ? '<div class="calc-field" data-taxi-sme style="display:none;"><label>중소기업 여부 (법인·기관 택시)</label>' +
            '<select class="calc-select" data-taxi-sme-sel><option value="1">중소기업 (250만 지원 대상)</option><option value="0">중소기업 아님 (미지원)</option></select></div>'
          : '';
        condBox.innerHTML = clsRow + conds.map(function (cd) {
          if (cd.custom === 'social') return socialBlockHTML();   // [F3] 사회계층 여부+유형 8종+자녀수 하위
          var opts = cd.opts.map(function (o, i) {
            return '<option value="' + i + '">' + o.t + '</option>';
          }).join('');
          return '<div class="calc-field"><label>' + cd.label + '</label>' +
            '<select class="calc-select" data-cond="' + cd.key + '">' + opts + '</select>' +
            '<div class="calc-cond-note" data-cond-note="' + cd.key + '" style="display:none;font-size:11.5px;color:#c0392b;margin-top:3px;"></div></div>';
        }).join('') + smeField;
        // COND select 변경 시 재게이팅(택시↔다자녀·청년 배타 즉시 반영)
        condBox.querySelectorAll('[data-cond]').forEach(function (s) { s.addEventListener('change', applyGating); });
        wireSocial();
      }
      updateClsDisplay();
      applyGating();
    }

    var getType = chipGroup('type', 'data-type', renderType);
    var getBuyer = chipGroup('buyer', 'data-buyer', function () { applyGating(); });

    function setText(sel, v) { var el = root.querySelector(sel); if (el) el.textContent = v; }

    /* ── [F1] 구매자 유형 게이팅 (§4-1 매트릭스 UI 적용 — 계산과 이중) ── */
    function buyerReq(buyer) { return buyer === 'biz' ? 'B' : (buyer === 'org' ? 'G' : 'P'); }
    function buyerAllows(opt, kind) { return !opt.req || opt.req.indexOf(kind) >= 0; }
    function reasonFor(opt) {
      if (opt.set && opt.set.taxi) return '개인 구매 택시는 지원 제외';
      return '개인(P) 전용 가산 — 개인사업자·법인·기관 제외';
    }
    function applyGating() {
      if (!condBox) return;
      var kind = buyerReq(getBuyer());
      var conds = COND[getType()] || [];
      var byKey = {}; conds.forEach(function (cd) { byKey[cd.key] = cd; });
      // 현재 '택시' 선택 여부(활성 상태에서만)
      var taxiOn = false;
      condBox.querySelectorAll('[data-cond]').forEach(function (s) {
        var def = byKey[s.getAttribute('data-cond')]; if (!def || s.disabled) return;
        var opt = def.opts[parseInt(s.value || '0', 10)];
        if (opt && opt.set && opt.set.taxi) taxiOn = true;
      });
      condBox.querySelectorAll('[data-cond]').forEach(function (s) {
        var key = s.getAttribute('data-cond'), def = byKey[key]; if (!def) return;
        var enabledCount = 0, reason = '';
        for (var i = 1; i < def.opts.length; i++) {
          var opt = def.opts[i];
          var okReq = buyerAllows(opt, kind);
          var excl = taxiOn && opt.set && (opt.set.firstBuyYoung || opt.set.multiChild);
          var enabled = okReq && !excl;
          if (s.options[i]) s.options[i].disabled = !enabled;
          if (enabled) enabledCount++;
          else if (!reason) reason = excl ? '전기택시와 중복 지원 불가' : reasonFor(opt);
        }
        // 현재 선택이 비활성화되면 '해당 없음'으로 되돌림(잔존값 계산 방지)
        if (s.options[s.selectedIndex] && s.options[s.selectedIndex].disabled) s.value = '0';
        var noteEl = condBox.querySelector('[data-cond-note="' + key + '"]');
        if (enabledCount === 0) { s.disabled = true; if (noteEl) { noteEl.textContent = reason || '이 구매자 유형은 해당 없음'; noteEl.style.display = ''; } }
        else { s.disabled = false; if (noteEl) noteEl.style.display = 'none'; }
      });
      // 법인·기관 택시 → 중소기업 하위선택 노출
      var sme = root.querySelector('[data-taxi-sme]');
      if (sme) sme.style.display = (kind === 'G' && taxiOn) ? '' : 'none';
      // [F3] 사회계층 블록 게이팅 — 다자녀가구(정액 국비)는 P만·택시와 배타. 나머지 유형은 유형 무관(단, 금액 0)
      var typeSel = root.querySelector('[data-social-type]');
      if (typeSel) {
        var mcOpt = typeSel.querySelector('option[value="multichild"]');
        var mcEnabled = (kind === 'P') && !taxiOn;
        if (mcOpt) mcOpt.disabled = !mcEnabled;
        var snote = root.querySelector('[data-social-note]');
        if (typeSel.value === 'multichild' && !mcEnabled) {   // 비활성인데 선택돼 있으면 유형 해제
          typeSel.value = '';
          var cw = root.querySelector('[data-social-child-wrap]'); if (cw) cw.style.display = 'none';
        }
        if (snote) {
          if (!mcEnabled) { snote.textContent = taxiOn ? '다자녀가구는 전기택시와 중복 지원 불가' : '다자녀가구 국비 정액은 개인(P)만 지원'; snote.style.display = ''; }
          else snote.style.display = 'none';
        }
      }
    }

    /* [F3] 사회계층 여부+유형(8종)+자녀수 하위 (전기승용 전용) */
    function socialBlockHTML() {
      var types = [['gov', '국가유공자'], ['disabled', '장애인'], ['multichild', '다자녀가구'], ['multicultural', '다문화가족'], ['basic', '기초생활수급자'], ['small', '소상공인'], ['primary', '1차산업 종사자'], ['etc', '기타 등']];
      var opts = '<option value="">유형 선택</option>' + types.map(function (t) { return '<option value="' + t[0] + '">' + t[1] + '</option>'; }).join('');
      return '<div class="calc-field" data-social-block><label>사회계층 여부</label>' +
        '<select class="calc-select" data-social-yn><option value="0">해당 없음</option><option value="1">해당 (유형 선택)</option></select>' +
        '<div data-social-type-wrap style="display:none;margin-top:8px;">' +
        '<select class="calc-select" data-social-type>' + opts + '</select>' +
        '<div class="calc-cond-note" data-social-note style="display:none;font-size:11.5px;color:#c0392b;margin-top:3px;"></div>' +
        '<div data-social-child-wrap style="display:none;margin-top:8px;"><label style="font-size:12px;">자녀 수</label>' +
        '<select class="calc-select" data-social-child><option value="2">2자녀 (+100만)</option><option value="3">3자녀 (+200만)</option><option value="4">4자녀 이상 (+300만)</option></select></div>' +
        '<p style="font-size:11.5px;color:#8a93a0;margin-top:4px;">※ 2026 사회계층 지방비 추가지원은 전국 0원(항목 표시용) — <b>다자녀가구·소상공인 특칙만</b> 금액에 반영됩니다.</p>' +
        '</div></div>';
    }
    function wireSocial() {
      var yn = root.querySelector('[data-social-yn]'); if (!yn) return;
      var wrap = root.querySelector('[data-social-type-wrap]');
      var typeSel = root.querySelector('[data-social-type]');
      var childWrap = root.querySelector('[data-social-child-wrap]');
      yn.addEventListener('change', function () { if (wrap) wrap.style.display = (yn.value === '1') ? '' : 'none'; applyGating(); });
      if (typeSel) typeSel.addEventListener('change', function () { if (childWrap) childWrap.style.display = (typeSel.value === 'multichild') ? '' : 'none'; applyGating(); });
    }

    if (run) run.addEventListener('click', function () {
      var type = getType();
      var opt = md && md.options[md.selectedIndex];
      var gamt = parseFloat(opt ? (opt.getAttribute('data-v') || '0') : '0');
      if (!gamt) {
        if (window.__toast) window.__toast('제조사와 모델을 선택해 주세요.', 'info'); else alert('제조사와 모델을 선택해 주세요.');
        return;
      }
      var conv = parseFloat(opt ? (opt.getAttribute('data-conv') || '0') : '0');
      var cls = opt ? (opt.getAttribute('data-cls') || '') : '';
      var reg = (REGIONS[r1 && r1.value] || {})[r2 && r2.value];
      if (!reg) {
        if (window.__toast) window.__toast('지자체(대분류·소분류)를 선택해 주세요.', 'info'); else alert('지자체를 선택해 주세요.');
        return;
      }

      // [F1] buyer → reqKind : 개인(personal)=P · 개인사업자(biz)=B · 단체(org)=G
      var buyer = getBuyer();
      var reqKind = (buyer === 'biz') ? 'B' : (buyer === 'org' ? 'G' : 'P');
      var biz = (buyer === 'biz');

      // 조건부 옵션 → c 객체 (비활성(disabled) 옵션은 계산에도 미반영 — UI 게이팅과 이중)
      var conds = COND[type] || [];
      var c = {};
      if (condBox) condBox.querySelectorAll('[data-cond]').forEach(function (s) {
        if (s.disabled) return;                               // 비활성 select 무시
        var key = s.getAttribute('data-cond');
        var def = conds.find(function (x) { return x.key === key; });
        if (!def) return;
        var idx = parseInt(s.value || '0', 10);
        var sel = def.opts[idx] || def.opts[0];
        if (idx > 0 && sel && !buyerAllows(sel, reqKind)) return; // 선택값이 유형에 미허용이면 무시(잔존값 방지)
        if (sel && sel.set) Object.keys(sel.set).forEach(function (k) { c[k] = sel.set[k]; });
      });
      // [F1] 법인·기관 택시 → 중소기업 하위선택으로 taxiBusi 결정 (개인사업자 B는 중기 무관)
      var smeSel = root.querySelector('[data-taxi-sme-sel]');
      if (reqKind === 'G' && c.taxi && smeSel) c.taxiBusi = (smeSel.value === '1');
      // [F3] 사회계층 블록 → c 반영: 다자녀가구+자녀수 → multiChild(정액, P만은 compute·게이팅이 보장) / 소상공인 → social(승용은 지방비 0=무효과, 트리거만) / 그 외 유형 → 0
      var socYn = root.querySelector('[data-social-yn]');
      if (socYn && socYn.value === '1') {
        var socType = root.querySelector('[data-social-type]');
        var st = socType ? socType.value : '';
        if (st === 'multichild') {
          var childSel = root.querySelector('[data-social-child]');
          c.multiChild = childSel ? parseInt(childSel.value || '0', 10) : 0;
        } else if (st === 'small') { c.social = 'small'; }
      }
      // 제주 도외반출(데모: 노후경유 폐차 선택 시 자동 가정)
      if (reg.jeju && c.dieselScrap) c.jejuExport = true;

      // 배타규칙: 택시 + 다자녀·청년 동시 불가 (계산 배타 — UI 배타와 이중, 소스 :469)
      if (c.taxi) { c.multiChild = 0; c.firstBuyYoung = false; }

      var res = compute({
        type: type, reqKind: reqKind, biz: biz, gamt: gamt, conv: conv, cls: cls,
        region: reg, cnt: 1, c: c
      });

      // [F2] 결과 4분할(만원 정수 반올림) — 합계 = 4항목 합(총액 일치 보장)
      var rNat = Math.round(res.natBase + res.natAdd);   // 국비(전환 제외)
      var rLoc = Math.round(res.locBase + res.locAdd);   // 지방비(전환 제외)
      var rChngG = Math.round(res.chngG);                // 전환지원금 국비
      var rChngL = Math.round(res.chngL);                // 전환지원금 지방비
      var rTotal = rNat + rLoc + rChngG + rChngL;        // 합계
      var hasChng = (rChngG + rChngL) > 0;
      setText('[data-res-nat]', fmt(rNat) + '만원');
      setText('[data-res-local]', fmt(rLoc) + '만원');
      setText('[data-res-chng-nat]', hasChng ? (fmt(rChngG) + '만원') : '—');
      setText('[data-res-chng-local]', hasChng ? (fmt(rChngL) + '만원') : '—');
      var chCap = root.querySelector('[data-res-chng-caption]'); if (chCap) chCap.style.display = hasChng ? 'none' : '';
      setText('[data-res-total]', fmt(rTotal));
      // 백호환: subsidy-info 시나리오가 읽는 data-res-extra = 전환지원금 합계(국비+지방비)
      setText('[data-res-extra]', (hasChng ? '+' : '') + fmt(rChngG + rChngL) + '만원');
      if (result) result.classList.add('show');
      // 예상액 스트립 최초 등장 1회만 펄스(세션 내 재계산 시 재펄스 없음)
      if (window.FeeDisclaimer) window.FeeDisclaimer.pulse(document.getElementById('feeStripCalc'), 'subsidy-calc');
    });

    renderType();
  }

  // 외부 노출(읽기 전용): 시나리오 비교 등에서 데이터 공유
  window.__subsidyData = { REGIONS: REGIONS, MAKERS: MAKERS, COND: COND, compute: compute, modelType: modelType };

  document.querySelectorAll('[data-subsidy-calc]').forEach(initCalc);
})();
