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
       - 국비 상한: 승용 970만 · 화물 2,000만 · 버스 9,000만 · 수소 2,250만
   · 기본 단가(국비/지방비)·지자체 옵션은 프로토 mock. 계산식·분배·상한·배타규칙은 소스와 1:1.
   ──────────────────────────────────────────────────────────────────────── */
(function () {
  'use strict';

  var WON = 10000; // 만원 → 원
  var YEAR = '2026'; // 계산 기준연도 (소스 $('#s_year').val()) — year별 분기 보존

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
    TAXI_GAMT: 2500000,        // 전기택시 국비 250만 (소스 taxi_gamt)
    TAXI_LAMT: 0,              // 지자체 택시 추가 지방비(데모 0)
    BMS: 200000,              // BMS 업데이트 불가차 폐차 후 신차 +20만
    MULTI: { 2: 1000000, 3: 2000000, 4: 3000000 }, // 다자녀 2/3/4
    EXCHANGE3_GAMT: 1000000,   // 전환지원금 국비 100만 (exchange_3year_gamt_total)
    EXCHANGE3_LAMT: 500000,    // 전환지원금 지방비 단가 50만 (exchange_3year_lamt)
    EXCHANGE_ADD_LAMT: 500000, // 노후경유차 폐차 지방비 50만 (exchange_add_lamt)
    EXT_JEJU: 500000,          // 제주 도외반출 +50만 (ext_add_lamt_jeju)
    SOCIAL_ADD_LAMT: 600000,   // 사회계층 추가 지방비 60만 (social_add_lamt)
    SSML_EV_GAMT: 0,           // 초소형 화물 지자체 추가 국비(데모 0)
    STD_5M: 5000000,          // 전환지원금 기준 차종국비 500만
    // 어린이 통학차량용(school_bus) — 소스 init: year>=2024는 0으로 세팅(별도 모델 처리)
    SCHOOL_BUS_GAMT: 0,        // school_bus_gamt (≤2023 정액 국비; 2026=0)
    SCHOOL_BUS_LAMT: 0         // school_bus_lamt (≤2023 정액 지방비; 2026=0)
  };
  /* 국비 상한(원) */
  var CAP = { ride: 9700000, truck: 20000000, bus: 90000000, h2: 22500000 };

  /* 수소 단가(원, 데모) — 승용 넥쏘 기본국비 2,250만이 이미 상한이라 택시 국비가산은 상한 처리됨 */
  var H2 = { TAXI_GAMT: 1000000, TAXI_LAMT: 0, TRUCK_ADD_LAMT: 2000000 };

  /* ───────────────────────── 계산 엔진 ─────────────────────────
     입력: { type, reqKind('P'|'G'), biz, gamt(만원), conv(만원), cls,
             region:{lamt,rate,addRate,jeju}, cnt, c:{...옵션} }
     반환: { nat, loc, total } (만원)
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
      // 전환지원금(개인): 차종국비≥500만 → 100만 전액, 미만 → 100만×국비/500만(만원반올림)
      if (c.exchange3 && reqKind === 'P') {
        var tot = UNIT.EXCHANGE3_GAMT;
        chngGamt = (gamt >= UNIT.STD_5M) ? tot : Math.round(tot * gamt / UNIT.STD_5M / WON) * WON;
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
       2026 확정 분기(단일대 기준): 차상위(개인)·소상공인(kind6) 30% / 농업인(farmng) 30% /
       택배·화물(hdry) 30% / 초소형 지자체추가국비(ssml). ※row-iteration(다대 폐차조합)은 단일대로 단순화 — 정밀 포팅 task3 */
    if (mt === 'TRUCKLGT' || mt === 'TRUCKSML' || mt === 'TRUCKSSML') {
      if ((c.poverty && reqKind === 'P') || c.social === 'small') sp(gamt * 30 / 100); // 차상위/소상공인 30%
      if (c.farmng) sp(gamt * 30 / 100); // 농업인 30%
      if (c.parcel) sp(gamt * 30 / 100); // 택배·물류(hdry) 30%
      if (mt === 'TRUCKSSML' && UNIT.SSML_EV_GAMT) addGamt += UNIT.SSML_EV_GAMT;
      // 전환지원금(개인·화물) — 승용과 동일 산식
      if (c.exchange3 && reqKind === 'P') {
        var tot2 = UNIT.EXCHANGE3_GAMT;
        chngGamt = (gamt >= UNIT.STD_5M) ? tot2 : Math.round(tot2 * gamt / UNIT.STD_5M / WON) * WON;
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

  /* 총액 조립 (calAmt 6602~6631): 국비/지방비 합산, 상한 적용 */
  function assemble(gamt, lamt, addGamt, addLamt, addLamt1, chngGamt, chngLamt, cnt, capGamt) {
    // 국비 상한: 기본+추가 국비 1대 합이 상한 초과 시 캡 (소스는 항목별이나 데모는 합계 기준)
    if (capGamt > 0 && (gamt + addGamt) > capGamt) addGamt = Math.max(0, capGamt - gamt);

    var req_gamt = gamt * cnt;                 // 기본 국비
    var req_add_gamt = addGamt * cnt;          // 추가 국비
    var req_chng_add_gamt = chngGamt * cnt;    // 전환지원금 국비
    var req_lamt = lamt * cnt;                 // 기본 지방비
    var req_add_lamt = (addLamt1 * cnt) + (addLamt * cnt); // 추가 지방비(폐차 대당 + 일반 대당)
    var req_chng_add_lamt = chngLamt * cnt;    // 전환지원금 지방비

    var nat = req_gamt + req_add_gamt + req_chng_add_gamt;       // tot_gamt
    var loc = req_lamt + req_add_lamt + req_chng_add_lamt;       // tot_lamt
    return { nat: nat / WON, loc: loc / WON, total: (nat + loc) / WON };
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
    var nat = gamt * cnt;
    var loc = (lamt + addLamt) * cnt + (addLamt1 * cnt); // req_add_lamt = add_lamt1*exCarCnt + add_lamt*cnt
    return { nat: nat / WON, loc: loc / WON, total: (nat + loc) / WON };
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
    var nat = (gamt + addGamt) * cnt, loc = (lamt + addLamt) * cnt;
    return { nat: nat / WON, loc: loc / WON, total: (nat + loc) / WON };
  }

  /* ===== 전기건설기계 EXCVT =====
     ※소스 calAmt에 EXCVT 계산 분기 없음(setModelChangeView에만 존재) → 기본만. 정밀 포팅 task4 / 차이 보고. */
  function computeExcvt(p) {
    var c = p.c || {}, cnt = Math.max(1, p.cnt || 1);
    var gamt = (p.gamt || 0) * WON, lamt = (p.region.lamt || 0) * WON;
    var addLamt = 0;
    if (c.social === 'low' || c.social === 'small') addLamt += UNIT.SOCIAL_ADD_LAMT;
    if (c.dieselScrap) addLamt += UNIT.EXCHANGE_ADD_LAMT;
    var nat = gamt * cnt, loc = (lamt + addLamt) * cnt;
    return { nat: nat / WON, loc: loc / WON, total: (nat + loc) / WON };
  }

  /* ─────────────── 차종별 가산옵션 UI 정의 ───────────────
     각 항목: { key, label, opts:[{t:표시, set:{...c}}] }  (첫 옵션 기본)
     set 의 키가 compute()의 c.* 로 전달됨. */
  var COND = {
    ev_car: [
      { key: 'poverty', label: '차상위·취약계층 (개인)', opts: [{ t: '해당 없음' }, { t: '차상위 이하 (국비 +20%)', set: { poverty: true } }] },
      { key: 'young', label: '청년·생애최초 (개인 만19~34)', opts: [{ t: '해당 없음' }, { t: '생애최초+청년 (국비 +20%)', set: { firstBuyYoung: true } }] },
      { key: 'multi', label: '다자녀 가구 (개인·비사업자)', opts: [{ t: '해당 없음' }, { t: '2자녀 (+100만)', set: { multiChild: 2 } }, { t: '3자녀 (+200만)', set: { multiChild: 3 } }, { t: '4자녀 이상 (+300만)', set: { multiChild: 4 } }] },
      { key: 'taxi', label: '전기택시 (법인·중기)', opts: [{ t: '해당 없음' }, { t: '전기택시 (+250만)', set: { taxi: true, taxiBusi: true } }] },
      { key: 'bms', label: 'BMS 미지원차 폐차 후 신차', opts: [{ t: '해당 없음' }, { t: '해당 (+20만)', set: { bms: true } }] },
      { key: 'ex3', label: '전환지원금 (개인·내연 3년경과 교체)', opts: [{ t: '해당 없음' }, { t: '노후 내연기관 폐차/교체 (+100만 한도)', set: { exchange3: true } }] },
      { key: 'scrap', label: '노후경유차 폐차 (지방비)', opts: [{ t: '해당 없음' }, { t: '노후경유 폐차', set: { dieselScrap: true } }] }
    ],
    ev_truck: [
      { key: 'poverty', label: '차상위·소상공인', opts: [{ t: '해당 없음' }, { t: '차상위 이하 (개인, 국비 +30%)', set: { poverty: true } }, { t: '소상공인 (국비 +30%)', set: { social: 'small' } }] },
      { key: 'farm', label: '농업인', opts: [{ t: '해당 없음' }, { t: '농업인 (국비 +30%)', set: { farmng: true } }] },
      { key: 'parcel', label: '택배·물류 사용', opts: [{ t: '해당 없음' }, { t: '택배·물류 (국비 +30%)', set: { parcel: true } }] },
      { key: 'ex3', label: '전환지원금 (개인·내연 3년경과 교체)', opts: [{ t: '해당 없음' }, { t: '노후 내연기관 폐차/교체 (+100만 한도)', set: { exchange3: true } }] }
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
        condBox.innerHTML = clsRow + conds.map(function (cd) {
          var opts = cd.opts.map(function (o, i) {
            return '<option value="' + i + '">' + o.t + '</option>';
          }).join('');
          return '<div class="calc-field"><label>' + cd.label + '</label>' +
            '<select class="calc-select" data-cond="' + cd.key + '">' + opts + '</select></div>';
        }).join('');
      }
      updateClsDisplay();
    }

    var getType = chipGroup('type', 'data-type', renderType);
    var getBuyer = chipGroup('buyer', 'data-buyer');

    function setText(sel, v) { var el = root.querySelector(sel); if (el) el.textContent = v; }

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

      // buyer → reqKind / biz
      var buyer = getBuyer();
      var reqKind = (buyer === 'org') ? 'G' : 'P';
      var biz = (buyer === 'biz');

      // 조건부 옵션 → c 객체
      var conds = COND[type] || [];
      var c = {};
      if (condBox) condBox.querySelectorAll('[data-cond]').forEach(function (s) {
        var key = s.getAttribute('data-cond');
        var def = conds.find(function (x) { return x.key === key; });
        if (!def) return;
        var sel = def.opts[parseInt(s.value || '0', 10)] || def.opts[0];
        if (sel && sel.set) Object.keys(sel.set).forEach(function (k) { c[k] = sel.set[k]; });
      });
      // 제주 도외반출(데모: 노후경유 폐차 선택 시 자동 가정)
      if (reg.jeju && c.dieselScrap) c.jejuExport = true;

      // 배타규칙: 택시 + 다자녀 동시 불가 / 법인택시 → 다자녀·청년 불가
      if (c.taxi) { c.multiChild = 0; c.firstBuyYoung = false; }

      var res = compute({
        type: type, reqKind: reqKind, biz: biz, gamt: gamt, conv: conv, cls: cls,
        region: reg, cnt: 1, c: c
      });

      // 표기는 만원 정수로 반올림(시나리오 num() 호환) — 내부 계산은 천원 정밀 유지
      var dNat = Math.round(res.nat), dLoc = Math.round(res.loc), dTotal = dNat + dLoc;
      var extra = dTotal - gamt - reg.lamt;
      setText('[data-res-nat]', fmt(dNat) + '만원');
      setText('[data-res-local]', fmt(dLoc) + '만원');
      setText('[data-res-extra]', (extra >= 0 ? '+' : '') + fmt(extra) + '만원');
      setText('[data-res-total]', fmt(dTotal));
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
