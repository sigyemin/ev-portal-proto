/* =========================================================
   subsidy-region.js — 지자체별 보조금 현황 로직
   - 기준년도(2023~2026) · 차종/세부차종 연동 · 시도/시군구 연동
   - 필터 적용 · 정렬 · 페이지네이션 · 상세 펼침
   - 엑셀 다운로드 (SheetJS) · 인쇄
   - 상세 대수 정보 4카드 (공고/접수/출고/잔여 × 전체/우선순위/법인기관/택시/일반)
   ========================================================= */
(function () {
  'use strict';

  // ---------------- i18n helper (영문화 매핑) ----------------
  const _lang = () => (window.__i18n && window.__i18n.getLang) ? window.__i18n.getLang() : 'ko';
  const I18N_MAPS = {
    sido: {
      '서울':'Seoul','부산':'Busan','대구':'Daegu','인천':'Incheon','광주':'Gwangju',
      '대전':'Daejeon','울산':'Ulsan','세종':'Sejong','경기':'Gyeonggi','강원':'Gangwon',
      '충북':'Chungbuk','충남':'Chungnam','전북':'Jeonbuk','전남':'Jeonnam',
      '경북':'Gyeongbuk','경남':'Gyeongnam','제주':'Jeju','전체':'All'
    },
    region: {
      '서울특별시':'Seoul','부산광역시 해운대구':'Haeundae-gu, Busan',
      '경기도 성남시':'Seongnam, Gyeonggi-do','제주특별자치도 제주시':'Jeju City',
      '대전광역시 유성구':'Yuseong-gu, Daejeon','인천광역시 연수구':'Yeonsu-gu, Incheon',
      '대구광역시 수성구':'Suseong-gu, Daegu','울산광역시 남구':'Nam-gu, Ulsan',
      '광주광역시 서구':'Seo-gu, Gwangju'
    },
    vt: {
      '전기승용':'EV Passenger','수소승용':'FCEV Passenger','전기승합':'EV Bus',
      '전기화물':'EV Truck','전기이륜':'E-Motorcycle','수소버스':'FCEV Bus','수소트럭':'FCEV Truck',
      '전체':'All'
    },
    sub: {
      '전체':'All','일반':'General','소형':'Small','초소형':'Micro',
      '대형':'Large','중형':'Medium','경형':'Mini'
    },
    method: {
      '출고등록순':'By Delivery Reg.','접수순':'By Receipt Order',
      '접수순(초과시 추첨)':'Receipt Order (Lottery if exceeded)',
      '접수순(초과시 출고등록순)':'Receipt Order (Delivery Reg. if exceeded)',
      '추첨':'Lottery','기타':'Other','전체':'All'
    },
    status: { '대기':'Waiting','접수중':'Open','마감임박':'Closing Soon','마감':'Closed','전체':'All' },
    label: {
      '펼치기':'Expand','접기':'Collapse','공고':'Announced','접수':'Received','출고':'Delivered',
      '잔여':'Remaining','출고 진행률':'Delivery Progress','공고':'Notices','대':' units','년':'',
      '엑셀 다운로드':'Excel Download','전체 조회':'All Records','전체 대비':'of Total',
      '우선순위':'Priority','법인·기관':'Corporate / Institution','택시':'Taxi','일반':'General',
      '카테고리별 분포':'Category Distribution','모델별 지방비 상세':'Local Subsidy by Model',
      '지원':'Available','미지원':'Not Available','만원':'KRW (10K)','지원여부':'Eligibility',
      '모델명':'Model','제조사':'Maker','배터리':'Battery','주행거리':'Range',
      '국비':'National','지방비':'Local','총 지원금':'Total Subsidy',
      '공고파일':'Notice Files','비고':'Remarks','담당 안내':'Contact','담당부서':'Department',
      '연락처':'Phone','접수방법':'Method','상세 대수 정보':'Detailed Counts',
      '안내':'Notice','이전':'Previous','다음':'Next','건':' items','社':' firms'
    },
    yearLabel: { '년':'' }   // suffix
  };
  function tr(map, val) {
    if (!val) return val;
    if (_lang() !== 'en') return val;
    return (I18N_MAPS[map] && I18N_MAPS[map][val]) || val;
  }
  // region: 매핑 없으면 sido만 영문화 후 region 그대로
  function tRegion(r) {
    if (_lang() !== 'en') return r;
    return I18N_MAPS.region[r] || r;
  }
  function tYear(y) {
    return _lang() === 'en' ? String(y) : (y + '년');
  }
  // 언어 전환 시 재렌더 트리거
  window.addEventListener('langChange', () => { try { render(); } catch(e){} });
  document.addEventListener('langChange', () => { try { render(); } catch(e){} });


  // ---------------- Vehicle type → Sub-type map ----------------
  const VEHICLE_SUB_MAP = {
    '전체': ['전체'],
    '전기승용': ['전체', '일반', '소형', '초소형'],
    '수소승용': ['전체', '일반'],
    '전기승합': ['전체', '대형', '중형', '소형'],
    '전기화물': ['전체', '대형', '중형', '소형', '초소형'],
    '전기이륜': ['전체', '경형', '소형', '중형', '대형'],
    '수소버스': ['전체', '대형', '중형'],
    '수소트럭': ['전체', '대형', '중형'],
  };

  // ---------------- 시도 → 시군구 map (일부만 샘플) ----------------
  const SIGUNGU_MAP = {
    '전체': ['전체'],
    '서울': ['전체', '강남구', '서초구', '송파구', '강동구', '마포구', '용산구', '종로구', '중구', '성동구', '광진구'],
    '부산': ['전체', '해운대구', '수영구', '남구', '동래구', '부산진구', '연제구', '금정구'],
    '대구': ['전체', '중구', '동구', '서구', '남구', '북구', '수성구', '달서구'],
    '인천': ['전체', '연수구', '남동구', '부평구', '계양구', '서구', '강화군'],
    '광주': ['전체', '동구', '서구', '남구', '북구', '광산구'],
    '대전': ['전체', '유성구', '서구', '중구', '동구', '대덕구'],
    '울산': ['전체', '남구', '동구', '북구', '중구', '울주군'],
    '세종': ['전체', '세종특별자치시'],
    '경기': ['전체', '수원시', '성남시', '용인시', '고양시', '부천시', '안산시', '화성시', '안양시', '남양주시', '평택시'],
    '강원': ['전체', '춘천시', '원주시', '강릉시', '동해시', '속초시'],
    '충북': ['전체', '청주시', '충주시', '제천시'],
    '충남': ['전체', '천안시', '아산시', '서산시', '당진시'],
    '전북': ['전체', '전주시', '군산시', '익산시', '정읍시'],
    '전남': ['전체', '목포시', '여수시', '순천시', '광양시'],
    '경북': ['전체', '포항시', '경주시', '구미시', '안동시'],
    '경남': ['전체', '창원시', '진주시', '통영시', '김해시', '양산시'],
    '제주': ['전체', '제주시', '서귀포시'],
  };

  // ---------------- 모델별 지방비 공통 프리셋 (지역별로 다름) ----------------
  // 2026년 기준 주요 전기승용/수소승용/전기화물 모델 마스터
  // 국비는 전국 공통, 지방비는 지역별
  // AS-IS: /nportal/buySupprt/psPopupLocalCarModelPrice.do 참조
  const MODEL_MASTER = {
    '전기승용': [
      { model: '아이오닉 6', maker: '현대자동차', battery: '77.4kWh', range: '524km', img: 'assets/cars/ev-sedan-ioniq6.svg', national: 650 },
      { model: 'EV6',        maker: '기아',       battery: '77.4kWh', range: '475km', img: 'assets/cars/ev-crossover-ev6.svg', national: 650 },
      { model: 'Model 3',    maker: '테슬라',      battery: '60kWh',   range: '513km', img: 'assets/cars/ev-sedan-model3.svg',  national: 350 },
      { model: '토레스 EVX',  maker: 'KG모빌리티', battery: '73.4kWh', range: '433km', img: 'assets/cars/ev-suv-torres.svg',    national: 580 },
      { model: '아이오닉 5',  maker: '현대자동차', battery: '77.4kWh', range: '481km', img: 'assets/cars/ev-crossover-ev6.svg', national: 650 },
      { model: 'EV9',        maker: '기아',       battery: '99.8kWh', range: '501km', img: 'assets/cars/ev-suv-torres.svg',    national: 580 },
    ],
    '수소승용': [
      { model: 'NEXO',       maker: '현대자동차', battery: '6.33kg',  range: '609km', img: 'assets/cars/fcev-suv-nexo.svg', national: 2250 },
    ],
    '전기화물': [
      { model: '포터 II 일렉트릭',     maker: '현대자동차', battery: '58.8kWh', range: '211km', img: 'assets/cars/ev-truck-porter.svg', national: 1100 },
      { model: '봉고 III EV',         maker: '기아',       battery: '58.8kWh', range: '211km', img: 'assets/cars/ev-truck-porter.svg', national: 1100 },
      { model: 'EV6 (1톤 경형)',       maker: 'KG모빌리티', battery: '31.5kWh', range: '153km', img: 'assets/cars/ev-truck-porter.svg', national: 600  },
    ],
    '전기승합': [
      { model: '일렉시티',            maker: '현대자동차', battery: '256kWh', range: '319km', img: 'assets/cars/ev-bus-elec-city.svg', national: 7000 },
      { model: '화이버드',            maker: '에디슨모터스','battery': '209kWh', range: '300km', img: 'assets/cars/ev-bus-elec-city.svg', national: 7000 },
      { model: 'NEW 스마트 110',      maker: '자일대우',    battery: '180kWh', range: '260km', img: 'assets/cars/ev-bus-elec-city.svg', national: 5000 },
      { model: '그린시티 EV',         maker: '현대자동차', battery: '128kWh', range: '223km', img: 'assets/cars/ev-bus-elec-city.svg', national: 2000 },
    ],
    '전기이륜': [
      { model: 'EM-1 S',      maker: '혼다',       battery: '1.3kWh',  range: '48km',  img: 'assets/cars/ev-moto.svg', national: 150 },
      { model: 'UM-1',        maker: '대림오토바이', battery: '3.2kWh', range: '95km',  img: 'assets/cars/ev-moto.svg', national: 230 },
    ],
  };

  // 지역별 지방비 가중치 (배수). 지방비 = 국비 × 가중치
  const LOCAL_WEIGHT = {
    '서울': 0.46, '부산': 0.45, '대구': 0.44, '인천': 0.44, '광주': 0.44,
    '대전': 0.46, '울산': 0.42, '세종': 0.40, '경기': 0.48, '강원': 0.50,
    '충북': 0.52, '충남': 0.54, '전북': 0.54, '전남': 0.56, '경북': 0.52,
    '경남': 0.50, '제주': 0.62
  };

  // 특정 row에 매칭되는 모델별 지방비 목록 생성
  function buildModelsForRow(row) {
    const models = MODEL_MASTER[row.vehicleType] || [];
    const w = LOCAL_WEIGHT[row.sido] || 0.45;
    // 세부차종 필터 (있으면)
    const filtered = models;
    return filtered.map(m => {
      const local = Math.round(m.national * w / 10) * 10; // 10만원 단위 반올림
      // 일부 모델은 지역에 따라 공급사 직인 및 출시 전일 수 있음 - 랜덤성으로 소수 대상 제외 (결정적)
      return {
        ...m,
        local,
        total: m.national + local,
        availability: ((m.model.charCodeAt(0) + row.sido.charCodeAt(0)) % 10 < 8) ? '지원' : '미지원'
      };
    });
  }

  // ---------------- DATA ----------------
  // 각 row: 지역·차종·세부차종·년도 별 집계 데이터 + 공고파일 + 상세 5분류 대수
  // acceptable = 공고대수 - 접수대수 (접수 가능 여유분 · 음수 방지)
  function makeRow(id, year, sido, region, vt, sub, method, status, announcement, received, delivered, breakdown, notices, remark, dept, phone) {
    return { id, year, sido, region, vehicleType: vt, vehicleSub: sub, method, status,
      announcement, received, delivered,
      acceptable: Math.max(0, announcement - received),
      remaining: announcement - delivered,
      breakdown, notices, remark, dept, phone };
  }
  // breakdown: { priority, corporate, taxi, general } * { announce, receive, deliver }
  function bd(p, c, t, g, rc_p, rc_c, rc_t, rc_g, dv_p, dv_c, dv_t, dv_g) {
    return {
      priority:  { announce:p,  receive:rc_p, deliver:dv_p },
      corporate: { announce:c,  receive:rc_c, deliver:dv_c },
      taxi:      { announce:t,  receive:rc_t, deliver:dv_t },
      general:   { announce:g,  receive:rc_g, deliver:dv_g },
    };
  }

  const DATA = [
    // ============== 2026년 ==============
    makeRow('r1', 2026, '서울', '서울특별시', '전기승용', '일반', '출고등록순', '접수중',
      12450, 12450, 10830,
      bd(3230,1850,2100,5270, 3230,1850,2100,5270, 2850,1650,1930,4400),
      [ {label:'본공고 1', file:'2026-seoul-ev-01.pdf', date:'2026.02.01'},
        {label:'본공고 2', file:'2026-seoul-ev-02.pdf', date:'2026.03.15'},
        {label:'본공고 3', file:'2026-seoul-ev-03.pdf', date:'2026.05.10'},
        {label:'추경1차 1', file:'2026-seoul-ev-supp-01.pdf', date:'2026.07.20'} ],
      '** 2026.6.15. 마감 기준, 상반기 서울시 전기승용차 보급 현황을 안내드립니다. (택시 마감)\n○ 보급목표 : 11,361대\n○ 접수대수 : 10,451대\n○ 잔여대수 : 910대\n※ 상반기 보급물량 소진 시에는 당초 일정보다 조기에 마감할 계획입니다.',
      '서울시 기후환경본부 무공해차지원팀', '02-2133-3000'),

    makeRow('r2', 2026, '서울', '서울특별시', '전기화물', '소형', '접수순', '소진임박',
      8200, 7980, 7350,
      bd(1200,3500,0,3500, 1180,3400,0,3400, 1100,3200,0,3050),
      [ {label:'본공고 1', file:'2026-seoul-truck-01.pdf', date:'2026.02.01'},
        {label:'본공고 2', file:'2026-seoul-truck-02.pdf', date:'2026.04.10'} ],
      '잔여 11% · 조기 마감 예상',
      '서울시 기후환경본부 무공해차지원팀', '02-2133-3000'),

    makeRow('r3', 2026, '서울', '서울특별시', '수소승용', '일반', '접수순(초과시 추첨)', '접수중',
      520, 318, 296,
      bd(80,120,0,320, 52,78,0,188, 48,72,0,176),
      [ {label:'본공고 1', file:'2026-seoul-h2-01.pdf', date:'2026.02.15'} ],
      '접수 진행중',
      '서울시 기후환경본부 수소차지원팀', '02-2133-3050'),

    makeRow('r4', 2026, '부산', '부산광역시 해운대구', '전기승용', '일반', '접수순(초과시 출고등록순)', '접수중',
      3200, 1088, 960,
      bd(680,420,0,2100, 230,142,0,716, 202,125,0,633),
      [ {label:'본공고 1', file:'2026-busan-hd-ev-01.pdf', date:'2026.02.10'},
        {label:'본공고 2', file:'2026-busan-hd-ev-02.pdf', date:'2026.04.25'} ],
      '[긴급공지] 26.05.29 상반기 추가 공고물량 대상자 선정이 마감되었습니다. 하반기는 7월 예정이며, 대상자 미선정 건은 모두 취소되어 하반기 오픈 시 지원신청부터 진행하셔야 합니다.\n○ 상반기 추가 보급대수 : 1,000대 (승용 600 / 화물 400)\n○ 보급기간 : 26.05.27(수) 11:00 ~ 추가 보급분 예산 소진 시까지\n※ 신청 접수가 빨라도 서류 미비·시스템 입력 오기 시 보완처리로 대상자 선정이 지연될 수 있으니 누락 없이 정확히 작성 바랍니다.\n※ 전환지원금은 26.1.1 이후 판매 또는 폐차 건부터 지급신청 전까지 인정되며, "지급신청 이후"에 판매·폐차한 건은 불인정됩니다.',
      '부산 해운대구 환경위생과', '051-749-4100'),

    makeRow('r5', 2026, '부산', '부산광역시 해운대구', '전기승합', '대형', '기타', '접수중',
      120, 42, 28,
      bd(0,120,0,0, 0,42,0,0, 0,28,0,0),
      [ {label:'공모공고 1', file:'2026-busan-bus-01.pdf', date:'2026.03.02'} ],
      '운수사업자 대상 공모',
      '부산시 대중교통과', '051-888-4350'),

    makeRow('r6', 2026, '경기', '경기도 성남시', '전기승용', '일반', '출고등록순', '접수중',
      5600, 2688, 2350,
      bd(1120,840,0,3640, 538,403,0,1747, 470,352,0,1528),
      [ {label:'본공고 1', file:'2026-seongnam-ev-01.pdf', date:'2026.02.05'},
        {label:'본공고 2', file:'2026-seongnam-ev-02.pdf', date:'2026.04.18'},
        {label:'추경1차 1', file:'2026-seongnam-ev-supp-01.pdf', date:'2026.08.01'} ],
      '접수 진행중 · 가정 충전기 설치 +100만원',
      '성남시 기후환경과', '031-729-3000'),

    makeRow('r7', 2026, '경기', '경기도 성남시', '전기이륜', '경형', '추첨', '접수중',
      800, 312, 278,
      bd(0,0,150,650, 0,0,58,254, 0,0,52,226),
      [ {label:'본공고 1', file:'2026-seongnam-moto-01.pdf', date:'2026.03.01'} ],
      '배달 플랫폼 사업자 우대',
      '성남시 기후환경과', '031-729-3010'),

    makeRow('r8', 2026, '제주', '제주특별자치도 제주시', '전기승용', '일반', '접수순', '신규확대',
      2400, 528, 472,
      bd(480,360,0,1560, 106,79,0,343, 94,71,0,307),
      [ {label:'본공고 1', file:'2026-jeju-ev-01.pdf', date:'2026.02.12'} ],
      '카본프리 아일랜드 연계 · 도내 거주자 +50만원',
      '제주시 탄소중립지원과', '064-710-3000'),

    makeRow('r9', 2026, '제주', '제주특별자치도 제주시', '수소승용', '일반', '출고등록순', '신규확대',
      80, 18, 15,
      bd(0,40,0,40, 0,9,0,9, 0,7,0,8),
      [ {label:'본공고 1', file:'2026-jeju-h2-01.pdf', date:'2026.03.05'} ],
      '관광업 등록사업자 추가 지원',
      '제주시 탄소중립지원과', '064-710-3050'),

    makeRow('r10', 2026, '대전', '대전광역시 유성구', '전기승용', '일반', '접수순(초과시 추첨)', '대기',
      1800, 1710, 1620,
      bd(360,270,0,1170, 342,257,0,1111, 324,243,0,1053),
      [ {label:'본공고 1', file:'2026-daejeon-ys-ev-01.pdf', date:'2026.02.20'} ],
      '예산 소진 95% · 대기자 등록 운영',
      '대전 유성구 환경과', '042-611-2400'),

    makeRow('r11', 2026, '인천', '인천광역시 연수구', '전기승용', '일반', '출고등록순', '접수중',
      2100, 924, 836,
      bd(420,315,0,1365, 185,139,0,600, 167,125,0,544),
      [ {label:'본공고 1', file:'2026-incheon-ys-ev-01.pdf', date:'2026.02.15'},
        {label:'본공고 2', file:'2026-incheon-ys-ev-02.pdf', date:'2026.05.01'} ],
      '접수 진행중',
      '인천 연수구 녹색환경과', '032-749-7200'),

    makeRow('r12', 2026, '인천', '인천광역시 연수구', '전기화물', '소형', '접수순', '접수중',
      600, 240, 210,
      bd(90,240,0,270, 36,96,0,108, 32,84,0,94),
      [ {label:'본공고 1', file:'2026-incheon-ys-truck-01.pdf', date:'2026.03.10'} ],
      '소상공인 우선 지원',
      '인천 연수구 녹색환경과', '032-749-7210'),

    makeRow('r13', 2026, '대구', '대구광역시 수성구', '전기승용', '일반', '출고등록순', '접수중',
      1600, 768, 680,
      bd(320,240,0,1040, 154,115,0,499, 136,102,0,442),
      [ {label:'본공고 1', file:'2026-daegu-ss-ev-01.pdf', date:'2026.02.18'} ],
      '접수 진행중',
      '대구 수성구 환경도시과', '053-666-4000'),

    makeRow('r14', 2026, '울산', '울산광역시 남구', '수소승용', '일반', '접수순(초과시 출고등록순)', '접수중',
      150, 72, 66,
      bd(30,60,0,60, 14,29,0,29, 13,26,0,27),
      [ {label:'본공고 1', file:'2026-ulsan-nam-h2-01.pdf', date:'2026.02.25'} ],
      '수소버스 연계 사업 운영',
      '울산 남구 환경과', '052-226-5000'),

    makeRow('r15', 2026, '광주', '광주광역시 서구', '전기승용', '일반', '추첨', '접수중',
      1400, 560, 504,
      bd(280,210,0,910, 112,84,0,364, 101,76,0,327),
      [ {label:'본공고 1', file:'2026-gwangju-sg-ev-01.pdf', date:'2026.02.22'} ],
      '접수 진행중',
      '광주 서구 환경녹지과', '062-350-4200'),

    // ============== 2025년 (일부) ==============
    makeRow('r16', 2025, '서울', '서울특별시', '전기승용', '일반', '출고등록순', '마감',
      11000, 11000, 10890,
      bd(2860,1650,1870,4620, 2860,1650,1870,4620, 2830,1634,1852,4574),
      [ {label:'본공고 1', file:'2025-seoul-ev-01.pdf', date:'2025.02.01'},
        {label:'추경1차 1', file:'2025-seoul-ev-supp-01.pdf', date:'2025.07.15'},
        {label:'추경2차 1', file:'2025-seoul-ev-supp-02.pdf', date:'2025.10.20'} ],
      '예산 집행 완료',
      '서울시 기후환경본부 무공해차지원팀', '02-2133-3000'),

    makeRow('r17', 2025, '경기', '경기도 성남시', '전기승용', '일반', '접수순', '마감',
      4800, 4800, 4755,
      bd(960,720,0,3120, 960,720,0,3120, 950,713,0,3092),
      [ {label:'본공고 1', file:'2025-seongnam-ev-01.pdf', date:'2025.02.05'},
        {label:'본공고 2', file:'2025-seongnam-ev-02.pdf', date:'2025.04.20'} ],
      '예산 집행 완료',
      '성남시 기후환경과', '031-729-3000'),

    makeRow('r18', 2025, '부산', '부산광역시 해운대구', '전기승용', '일반', '출고등록순', '마감',
      2800, 2800, 2768,
      bd(560,420,0,1820, 560,420,0,1820, 553,415,0,1800),
      [ {label:'본공고 1', file:'2025-busan-hd-ev-01.pdf', date:'2025.02.10'} ],
      '예산 집행 완료',
      '부산 해운대구 환경위생과', '051-749-4100'),

    // ============== 2024년 (일부) ==============
    makeRow('r19', 2024, '서울', '서울특별시', '전기승용', '일반', '출고등록순', '마감',
      10000, 10000, 9950,
      bd(2500,1500,1800,4200, 2500,1500,1800,4200, 2488,1493,1791,4178),
      [ {label:'본공고 1', file:'2024-seoul-ev-01.pdf', date:'2024.02.01'} ],
      '예산 집행 완료',
      '서울시 기후환경본부 무공해차지원팀', '02-2133-3000'),

    makeRow('r20', 2024, '경기', '경기도 성남시', '전기승용', '일반', '접수순', '마감',
      4200, 4200, 4180,
      bd(840,630,0,2730, 840,630,0,2730, 836,627,0,2717),
      [ {label:'본공고 1', file:'2024-seongnam-ev-01.pdf', date:'2024.02.05'} ],
      '예산 집행 완료',
      '성남시 기후환경과', '031-729-3000'),

    // ============== 2023년 (일부) ==============
    makeRow('r21', 2023, '서울', '서울특별시', '전기승용', '일반', '출고등록순', '마감',
      9500, 9500, 9470,
      bd(2375,1425,1710,3990, 2375,1425,1710,3990, 2367,1420,1704,3979),
      [ {label:'본공고 1', file:'2023-seoul-ev-01.pdf', date:'2023.02.01'} ],
      '예산 집행 완료',
      '서울시 기후환경본부 무공해차지원팀', '02-2133-3000'),
  ];

  // ---------------- State ----------------
  const state = {
    filtered: [],
    sort: { key: null, asc: true },
    page: 1,
    perPage: 10,
  };

  // ---------------- Elements ----------------
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => document.querySelectorAll(s);
  const els = {
    year: $('#f-year'),
    vehicle: $('#f-vehicle'),
    sub: $('#f-sub'),
    sido: $('#f-sido'),
    sigungu: $('#f-sigungu'),
    method: $('#f-method'),
    status: $('#f-status'),
    apply: $('#btn-apply'),
    reset: $('#btn-reset'),
    tbody: $('#subsidy-tbody'),
    cards: $('#subsidy-cards'),
    emptyTable: $('#empty-state'),
    emptyCard: $('#empty-state-card'),
    pagination: $('#pagination'),
    paginationCard: $('#pagination-card'),
    resultCount: $('#result-count'),
    resultSummary: $('#result-summary'),
    statAnn: $('#stat-announcement'),
    statRec: $('#stat-received'),
    statDel: $('#stat-delivered'),
    statRem: $('#stat-remaining'),
    statYear: $('#stat-year'),
    recBar: $('#stat-received-bar'),
    delBar: $('#stat-delivered-bar'),
    excel: $('#btn-excel'),
  };

  // ---------------- Cascade: 차종 → 세부차종 ----------------
  function refreshSubOptions() {
    const v = els.vehicle.value;
    const subs = VEHICLE_SUB_MAP[v] || ['전체'];
    els.sub.innerHTML = subs.map(s => `<option value="${s}">${s}</option>`).join('');
  }

  // ---------------- Cascade: 시도 → 시군구 ----------------
  function refreshSigunguOptions() {
    const v = els.sido.value;
    const list = SIGUNGU_MAP[v] || ['전체'];
    els.sigungu.innerHTML = list.map(s => `<option value="${s}">${s}</option>`).join('');
  }

  // ---------------- Filter ----------------
  function applyFilter() {
    const y = parseInt(els.year.value, 10);
    const v = els.vehicle.value;
    const s = els.sub.value;
    const sido = els.sido.value;
    const sg = els.sigungu.value;
    const method = els.method.value;
    const status = els.status.value;

    const favOnlyEl = document.getElementById('subsidyFavOnly');
    const favOnly = !!(favOnlyEl && favOnlyEl.checked);

    state.filtered = DATA.filter(r => {
      if (r.year !== y) return false;
      if (v !== '전체' && r.vehicleType !== v) return false;
      if (s !== '전체' && r.vehicleSub !== s) return false;
      if (sido !== '전체' && r.sido !== sido) return false;
      if (sg !== '전체' && !r.region.includes(sg)) return false;
      if (method !== '전체' && r.method !== method) return false;
      if (status !== '전체' && rowStatus(r) !== status) return false;
      if (favOnly && window.EVFavorites && !window.EVFavorites.isFav(String(r.id), 'region')) return false;
      return true;
    });

    // default sort: 시도 오름차순
    if (!state.sort.key) {
      state.filtered.sort((a, b) => a.sido.localeCompare(b.sido, 'ko'));
    } else {
      sortData();
    }

    state.page = 1;
    render();
  }

  // ---------------- Sort ----------------
  function sortData() {
    const k = state.sort.key;
    const asc = state.sort.asc ? 1 : -1;
    state.filtered.sort((a, b) => {
      const av = a[k], bv = b[k];
      if (typeof av === 'number') return (av - bv) * asc;
      return String(av).localeCompare(String(bv), 'ko') * asc;
    });
  }

  // ---------------- Render ----------------
  const fmt = (n) => n == null ? '-' : n.toLocaleString('ko-KR');
  const statusClass = (s) => ({
    '대기': 'info', '접수중': 'approach', '마감임박': 'warning', '마감': 'gray'
  }[s] || 'gray');

  // v0.16 — 공고별 신청 마감 / 접수기간 (각 공고 게시일 기준 산출 → 공고마다 다름)
  const _pad2 = (n) => String(n).padStart(2, '0');
  const _parseYMD = (s) => { const a = String(s).split('.').map(Number); return new Date(a[0], a[1] - 1, a[2]); };
  const _fmtYMD = (d) => d.getFullYear() + '.' + _pad2(d.getMonth() + 1) + '.' + _pad2(d.getDate());
  function noticeSchedule(n) {
    const sd = _parseYMD(n.date);
    const span = /추경|공모/.test(n.label) ? 45 : 90;   // 본공고 90일 · 추경/공모 45일
    const ed = new Date(sd); ed.setDate(ed.getDate() + span);
    return { start: n.date + ' 09시 00분', end: _fmtYMD(ed) + ' 18시 00분', deadline: _fmtYMD(ed) + ' 18시 00분' };
  }
  // 접수상태 — 접수기간 기준 파생 (대기: 첫 공고 접수 전 · 마감임박: 최종 신청마감 30일 전부터 · 마감: 최종 신청마감 경과)
  function rowStatus(r) {
    if (!r.notices || !r.notices.length) return '접수중';
    const now = new Date(); now.setHours(0, 0, 0, 0);
    const t = now.getTime();
    const spanOf = (n) => /추경|공모/.test(n.label) ? 45 : 90;
    const starts = r.notices.map(n => _parseYMD(n.date).getTime());
    const ends = r.notices.map(n => { const ed = _parseYMD(n.date); ed.setDate(ed.getDate() + spanOf(n)); return ed.getTime(); });
    const firstStart = Math.min(...starts);
    const lastEnd = Math.max(...ends);
    if (t < firstStart) return '대기';
    if (t > lastEnd) return '마감';
    const daysLeft = Math.ceil((lastEnd - t) / 86400000);
    return daysLeft <= 30 ? '마감임박' : '접수중';
  }
  // 표 셀용 짧은 접수기간 (26.02.01 ~ 05.02)
  function compactRange(n) {
    const sd = _parseYMD(n.date);
    const span = /추경|공모/.test(n.label) ? 45 : 90;
    const ed = new Date(sd); ed.setDate(ed.getDate() + span);
    const md = (d) => _pad2(d.getMonth() + 1) + '.' + _pad2(d.getDate());
    return String(sd.getFullYear()).slice(2) + '.' + md(sd) + ' ~ ' + md(ed);
  }
  // 공고종류 (본공고/추경/공모) — 라벨에서 판별
  function noticeKind(label) { return /추경/.test(label) ? '추경' : /공모/.test(label) ? '공모' : '본공고'; }
  function noticeKindClass(label) { return /추경/.test(label) ? 'supp' : /공모/.test(label) ? 'bid' : 'main'; }
  // 목록 — 전체 기준 대수 현황만, 열별 분리 (분류별 상세는 펼침에서)
  function totalCountCell(r) {
    const b = r.breakdown;
    const cats = ['priority', 'corporate', 'taxi', 'general'];
    const selTotal = cats.reduce((a, k) => a + Math.min(b[k].announce, b[k].receive), 0);
    const selRemTotal = Math.max(0, r.announcement - selTotal);
    return `<td class="cnt-c">${fmt(r.announcement)}</td>`
      + `<td class="cnt-c">${fmt(r.received)}</td>`
      + `<td class="cnt-c cnt-sel">${fmt(selTotal)}</td>`
      + `<td class="cnt-c">${fmt(r.delivered)}</td>`
      + `<td class="cnt-c cnt-sel">${fmt(selRemTotal)}</td>`
      + `<td class="cnt-c">${fmt(r.remaining)}</td>`;
  }
  // 예산 기준 선정률(소진율) — 카테고리별 상대 단가 가중(가산금 반영). 절대 예산 비공개, 비율만 산출.
  // 우선순위(취약계층·다자녀 등 가산) 1.2 · 택시(추가지원) 1.1 · 법인·기관/일반 1.0
  const CAT_COST_W = { priority: 1.2, corporate: 1.0, taxi: 1.1, general: 1.0 };
  function budgetUsedPctOf(r) {
    const b = r.breakdown;
    let selB = 0, annB = 0;
    Object.keys(CAT_COST_W).forEach(k => {
      const sel = Math.min(b[k].announce, b[k].receive);
      selB += sel * CAT_COST_W[k];
      annB += b[k].announce * CAT_COST_W[k];
    });
    return annB > 0 ? Math.round((selB / annB) * 100) : 0;
  }
  // 대수 현황 매트릭스 셀 — 5행(전체/우선/법인·기관/택시/일반) × 6열(공고/접수/선정/출고/선정잔여/출고잔여)
  // 선정 = 지급 선정(지급예정 포함) = min(공고, 접수) · 선정잔여 = 공고-선정(추가 선정 가능 여유) · 출고잔여 = 공고-출고
  function matrixCell(r) {
    const b = r.breakdown;
    const cats = ['priority', 'corporate', 'taxi', 'general'];
    const sel = (k) => Math.min(b[k].announce, b[k].receive);
    const selRem = (k) => b[k].announce - sel(k);
    const outRem = (k) => b[k].announce - b[k].deliver;
    const sum = (fn) => cats.reduce((a, k) => a + fn(k), 0);
    const rows = [
      ['전체',     r.announcement, r.received, sum(sel),        r.delivered, sum(selRem),       r.remaining,     'mx-total'],
      ['우선순위',  b.priority.announce,  b.priority.receive,  sel('priority'),  b.priority.deliver,  selRem('priority'),  outRem('priority'),  ''],
      ['법인·기관', b.corporate.announce, b.corporate.receive, sel('corporate'), b.corporate.deliver, selRem('corporate'), outRem('corporate'), ''],
      ['택시',     b.taxi.announce,      b.taxi.receive,      sel('taxi'),      b.taxi.deliver,      selRem('taxi'),      outRem('taxi'),      ''],
      ['일반',     b.general.announce,   b.general.receive,   sel('general'),   b.general.deliver,   selRem('general'),   outRem('general'),   ''],
    ];
    const body = rows.map(row =>
      `<tr class="${row[7]}"><th scope="row">${row[0]}</th><td>${fmt(row[1])}</td><td>${fmt(row[2])}</td><td class="mx-sel">${fmt(row[3])}</td><td>${fmt(row[4])}</td><td class="mx-sel">${fmt(row[5])}</td><td>${fmt(row[6])}</td></tr>`
    ).join('');
    return `<td class="cell-matrix"><table class="cnt-matrix"><thead><tr><th>구분</th><th>공고</th><th>접수</th><th class="mx-sel">선정</th><th>출고</th><th class="mx-sel">선정잔여</th><th>출고잔여</th></tr></thead><tbody>${body}</tbody></table></td>`;
  }

  function renderTable(pageRows) {
    if (!els.tbody) return;
    if (pageRows.length === 0) {
      els.tbody.innerHTML = '';
      els.emptyTable.style.display = '';
      els.pagination.style.display = 'none';
      return;
    }
    els.emptyTable.style.display = 'none';
    els.pagination.style.display = '';

    const F = window.EVFavorites;
    const favBtn = (id) => F
      ? `<button type="button" class="sr-fav-btn" data-fav-id="${id}" aria-pressed="${F.isFav(String(id),'region')?'true':'false'}" aria-label="지자체 즐겨찾기" title="지자체 즐겨찾기" style="background:transparent;border:1px solid transparent;width:28px;height:28px;display:inline-flex;align-items:center;justify-content:center;border-radius:999px;cursor:pointer;margin-right:6px;vertical-align:middle;transition:background var(--t-fast),border-color var(--t-fast);">${F.renderStar(F.isFav(String(id),'region'))}</button>`
      : '';

    els.tbody.innerHTML = pageRows.map(r => {
      const deadlinesFull = r.notices.map(n => noticeSchedule(n).deadline).sort((a, b) => a.localeCompare(b));
      const lastDeadline = deadlinesFull.length ? deadlinesFull[deadlinesFull.length - 1] : '-';
      const remarkFull = (r.remark || '-').replace(/\n/g, ' ');
      const kinds = r.notices.map(n => `<li><span class="kind-pill kind-${noticeKindClass(n.label)}">${noticeKind(n.label)}</span></li>`).join('');
      const periods = r.notices.map(n => `<li>${compactRange(n)}</li>`).join('');
      const empty = '<li class="muted">-</li>';
      return `
      <tr class="main-row expandable" data-id="${r.id}">
        <td class="cell-sido">${favBtn(r.id)}<strong>${tr('sido', r.sido)}</strong><span class="sido-sub">${tRegion(r.region)}</span></td>
        <td><span class="vehicle-chip">${tr('vt', r.vehicleType)}<span class="sub">${tr('sub', r.vehicleSub)}</span></span></td>
        <td class="cell-kinds"><ul class="nt-list">${kinds || empty}</ul></td>
        <td class="cell-period"><ul class="nt-list nt-sched">${periods || empty}</ul></td>
        <td class="cell-deadline-c">${lastDeadline}</td>
        ${totalCountCell(r)}
        <td style="text-align:center;">
          <button class="expand-toggle" type="button" aria-expanded="false">
            <span class="label">${tr('label','펼치기')}</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
          </button>
        </td>
      </tr>
      <tr class="detail-row" data-detail-for="${r.id}">
        <td colspan="12"></td>
      </tr>
    `;
    }).join('');

    // 즐겨찾기 별 버튼 핸들러 (행 펼침과 충돌 방지)
    els.tbody.querySelectorAll('.sr-fav-btn[data-fav-id]').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation(); e.preventDefault();
        if (!F) return;
        const id = btn.getAttribute('data-fav-id');
        const row = pageRows.find(x => String(x.id) === id);
        if (!row) return;
        const item = { id: String(id), kind: 'region', sido: row.sido, region: row.region, vehicleType: row.vehicleType, vehicleSub: row.vehicleSub, name: `${row.sido} ${row.region}`, phone: row.phone };
        const nowFav = F.toggle(item, 'region');
        F.toast(nowFav ? `${item.name} 즐겨찾기에 추가했습니다.` : `${item.name} 즐겨찾기에서 해제했습니다.`, nowFav ? 'add' : 'remove');
        // 즐겨찾기만 보기일 때는 전체 재필터 → 카운트도 갱신
        const favOnlyEl = document.getElementById('subsidyFavOnly');
        if (favOnlyEl && favOnlyEl.checked) applyFilter();
        else {
          btn.setAttribute('aria-pressed', nowFav ? 'true' : 'false');
          btn.innerHTML = F.renderStar(nowFav);
        }
      });
    });

    bindRowHandlers();
  }

  function renderCards(rows) {
    if (!els.cards) return;
    if (rows.length === 0) {
      els.cards.innerHTML = '';
      els.emptyCard.style.display = '';
      return;
    }
    els.emptyCard.style.display = 'none';

    const progress = (r) => r.announcement > 0 ? Math.round((r.delivered / r.announcement) * 100) : 0;
    const barColor = (p) => p >= 90 ? 'var(--color-danger)' : p >= 80 ? 'var(--color-warning)' : 'var(--color-primary-500)';

    const F = window.EVFavorites;
    const favBtnCard = (id) => F
      ? `<button type="button" class="sr-fav-btn-card" data-fav-id="${id}" aria-pressed="${F.isFav(String(id),'region')?'true':'false'}" aria-label="지자체 즐겨찾기" title="즐겨찾기" style="background:transparent;border:1px solid transparent;width:32px;height:32px;display:inline-flex;align-items:center;justify-content:center;border-radius:999px;cursor:pointer;transition:background var(--t-fast),border-color var(--t-fast),transform var(--t-fast);">${F.renderStar(F.isFav(String(id),'region'))}</button>`
      : '';

    els.cards.innerHTML = rows.map(r => {
      const _cats = ['priority', 'corporate', 'taxi', 'general'];
      const selTotal = _cats.reduce((a, k) => a + Math.min(r.breakdown[k].announce, r.breakdown[k].receive), 0);
      const selRemTotal = Math.max(0, r.announcement - selTotal);
      const selPct = r.announcement > 0 ? Math.round((selTotal / r.announcement) * 100) : 0;
      const budPct = budgetUsedPctOf(r);
      return `
      <div class="subsidy-card" data-card-id="${r.id}" style="position:relative;">
        <div style="position:absolute;top:8px;right:8px;z-index:2;">${favBtnCard(r.id)}</div>
        <div class="sc-head">
          <h4>${tRegion(r.region)}</h4>
        </div>
        <div class="sc-meta">
          <span class="vehicle-chip">${tr('vt', r.vehicleType)} · ${tr('sub', r.vehicleSub)}</span>
        </div>
        <div class="sc-stats">
          <div class="sc-stat"><span class="s-label">${tr('label','공고')}</span><span class="s-value">${fmt(r.announcement)}</span></div>
          <div class="sc-stat received"><span class="s-label">${tr('label','접수')}</span><span class="s-value">${fmt(r.received)}</span></div>
          <div class="sc-stat sc-sel"><span class="s-label">${_lang()==='en'?'Selected':'선정'}</span><span class="s-value">${fmt(selTotal)}</span></div>
          <div class="sc-stat delivered"><span class="s-label">${tr('label','출고')}</span><span class="s-value">${fmt(r.delivered)}</span></div>
          <div class="sc-stat sc-sel"><span class="s-label">${_lang()==='en'?'Sel. Rem.':'선정잔여'}</span><span class="s-value">${fmt(selRemTotal)}</span></div>
          <div class="sc-stat delivered"><span class="s-label">${_lang()==='en'?'Out-del. Rem.':'출고잔여'}</span><span class="s-value">${fmt(Math.max(0, r.announcement - r.delivered))}</span></div>
        </div>
        <div class="sc-progress">
          <div class="sc-progress-head"><span>${_lang()==='en'?'Selection Rate (units)':'선정률 (대수 기준)'}</span><strong>${selPct}% · ${tr('label','잔여')} ${100 - selPct}%</strong></div>
          <div class="progress"><div class="progress-bar" style="width:${selPct}%; background: var(--color-primary-500);"></div></div>
          <div class="sc-progress-head" style="margin-top:8px;"><span>${_lang()==='en'?'Budget Used (budget)':'예산 소진율 (예산 기준)'}</span><strong>${budPct}% · ${tr('label','잔여')} ${100 - budPct}%</strong></div>
          <div class="progress"><div class="progress-bar" style="width:${budPct}%; background: var(--color-secondary-500);"></div></div>
        </div>
      </div>
      `;
    }).join('');

    els.cards.querySelectorAll('.subsidy-card').forEach(card => {
      card.addEventListener('click', (ev) => {
        // 별 버튼 클릭은 카드 펼침과 분리
        if (ev.target.closest('.sr-fav-btn-card')) return;
        const id = card.dataset.cardId;
        const tableBtn = document.querySelector('[data-view-toggle="#region-views"] [data-view="table"]');
        if (tableBtn) tableBtn.click();
        setTimeout(() => {
          const tr = document.querySelector(`tr.main-row[data-id="${id}"]`);
          if (tr) {
            tr.scrollIntoView({ behavior: 'smooth', block: 'center' });
            expandRow(tr);
          }
        }, 200);
      });
    });

    // 카드 별 버튼 핸들러
    els.cards.querySelectorAll('.sr-fav-btn-card[data-fav-id]').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation(); e.preventDefault();
        if (!F) return;
        const id = btn.getAttribute('data-fav-id');
        const row = rows.find(x => String(x.id) === id);
        if (!row) return;
        const item = { id: String(id), kind: 'region', sido: row.sido, region: row.region, vehicleType: row.vehicleType, vehicleSub: row.vehicleSub, name: `${row.sido} ${row.region}`, phone: row.phone };
        const nowFav = F.toggle(item, 'region');
        F.toast(nowFav ? `${item.name} 즐겨찾기에 추가했습니다.` : `${item.name} 즐겨찾기에서 해제했습니다.`, nowFav ? 'add' : 'remove');
        const favOnlyEl = document.getElementById('subsidyFavOnly');
        if (favOnlyEl && favOnlyEl.checked) applyFilter();
        else {
          btn.setAttribute('aria-pressed', nowFav ? 'true' : 'false');
          btn.innerHTML = F.renderStar(nowFav);
        }
      });
    });
  }

  function render() {
    updateStats();
    updateSummary();
    const total = state.filtered.length;
    const pages = Math.max(1, Math.ceil(total / state.perPage));
    if (state.page > pages) state.page = pages;
    const start = (state.page - 1) * state.perPage;
    const pageRows = state.filtered.slice(start, start + state.perPage);

    renderTable(pageRows);
    renderCards(pageRows); // 카드형도 페이지네이션 적용
    renderPagination(total, pages);
  }

  function renderPagination(total, pages) {
    const targets = [els.pagination, els.paginationCard].filter(Boolean);
    if (!targets.length) return;
    if (total === 0) { targets.forEach(el => { el.innerHTML = ''; }); return; }
    const p = state.page;
    let html = `<button type="button" ${p <= 1 ? 'disabled' : ''} data-p="prev" aria-label="${tr('label','이전')}">‹</button>`;
    for (let i = 1; i <= pages; i++) {
      html += `<button type="button" class="${i === p ? 'active' : ''}" data-p="${i}">${i}</button>`;
    }
    html += `<button type="button" ${p >= pages ? 'disabled' : ''} data-p="next" aria-label="${tr('label','다음')}">›</button>`;
    targets.forEach(elp => {
      elp.innerHTML = html;
      elp.querySelectorAll('button').forEach(b => {
        b.addEventListener('click', () => {
          const v = b.dataset.p;
          if (v === 'prev') state.page = Math.max(1, state.page - 1);
          else if (v === 'next') state.page = Math.min(pages, state.page + 1);
          else state.page = parseInt(v, 10);
          render();
        });
      });
    });
  }

  function updateStats() {
    const rows = state.filtered;
    const sumA = rows.reduce((s, r) => s + r.announcement, 0);
    const sumR = rows.reduce((s, r) => s + r.received, 0);
    const sumD = rows.reduce((s, r) => s + r.delivered, 0);
    const sumRem = sumA - sumD;
    els.statAnn.textContent = fmt(sumA);
    els.statRec.textContent = fmt(sumR);
    els.statDel.textContent = fmt(sumD);
    els.statRem.textContent = fmt(sumRem);
    els.statYear.textContent = tYear(els.year.value);
    const recPct = sumA > 0 ? Math.round((sumR / sumA) * 100) : 0;
    const delPct = sumA > 0 ? Math.round((sumD / sumA) * 100) : 0;
    if (els.recBar) els.recBar.style.width = recPct + '%';
    if (els.delBar) els.delBar.style.width = delPct + '%';
  }

  function updateSummary() {
    const parts = [];
    if (els.year.value) parts.push(`${els.year.value}년`);
    if (els.vehicle.value !== '전체') parts.push(els.vehicle.value);
    if (els.sub.value !== '전체') parts.push(els.sub.value);
    if (els.sido.value !== '전체') parts.push(els.sido.value);
    if (els.sigungu.value !== '전체') parts.push(els.sigungu.value);
    if (els.method.value !== '전체') parts.push(els.method.value);
    if (els.status.value !== '전체') parts.push(els.status.value);
    els.resultCount.textContent = state.filtered.length;
    els.resultSummary.textContent = parts.length ? parts.join(' · ') : tr('label','전체 조회');
  }

  // ---------------- Detail content HTML (단정한 실무형 디자인) ----------------
  function buildDetailHTML(r) {
    const pct = (a, b) => b > 0 ? Math.round((a / b) * 100) : 0;
    const receivedPct = pct(r.received, r.announcement);
    const deliveredPct = pct(r.delivered, r.announcement);
    const remainingPct = pct(r.remaining, r.announcement);

    // 공고별 일정 — 게시일·접수기간·신청마감·공고문 다운로드
    const noticeRows = r.notices.map((n, idx) => {
      const s = noticeSchedule(n);
      return `
        <tr>
          <td><strong>${n.label}</strong><span class="nf-date">게시 ${n.date}</span></td>
          <td>${s.start} ~ ${s.end}</td>
          <td class="nf-deadline">${s.deadline}</td>
          <td style="text-align:center;">
            <button class="notice-file-btn" type="button" data-notice-download="${r.id}:${idx}">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="12" height="12"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              <span>${tr('label','공고')}</span>
            </button>
          </td>
        </tr>`;
    }).join('');
    const noticesScheduleHTML = `
      <table class="notice-sched-table">
        <thead><tr><th>공고</th><th>공고별 접수기간</th><th>신청 마감</th><th>공고문</th></tr></thead>
        <tbody>${noticeRows || '<tr><td colspan="4">등록된 공고가 없습니다.</td></tr>'}</tbody>
      </table>`;

    // 선정(지급예정 포함) = min(공고, 접수) · 선정잔여 = 공고 − 선정(추가 선정 가능 여유)
    const cats4 = ['priority', 'corporate', 'taxi', 'general'];
    const selCat = (cat) => Math.min(r.breakdown[cat].announce, r.breakdown[cat].receive);
    const selTotal = cats4.reduce((a, c) => a + selCat(c), 0);
    const selRemTotal = Math.max(0, r.announcement - selTotal);
    // 예산 비율 (실예산 비공개) — 카테고리 단가 가중 소진율 (대수 기준과 다를 수 있음)
    const budgetUsedPct = budgetUsedPctOf(r);
    const budgetRemainPct = Math.max(0, 100 - budgetUsedPct);
    const selUnitPct = pct(selTotal, r.announcement);  // 대수 기준 선정률 (비교용)

    // 카드 — 각 카드에 총합 + 비율 + 5분류 숫자 (공고·접수·선정·출고·선정잔여·출고잔여)
    const cards = [
      { key:'announcement', title:_lang()==='en'?`${r.year} Private Announced Units`:`${r.year}년 민간공고대수`, total:r.announcement, pct:null,                         field:'announce' },
      { key:'received',     title:_lang()==='en'?'Received':'접수대수',                  total:r.received,  pct:receivedPct,                    field:'receive'  },
      { key:'selected',     title:_lang()==='en'?'Selected':'선정대수',                  total:selTotal,    pct:pct(selTotal, r.announcement),   fn:(cat)=>selCat(cat), emph:true },
      { key:'selremain',    title:_lang()==='en'?'Selection Remaining':'선정잔여대수',     total:selRemTotal, pct:pct(selRemTotal, r.announcement), fn:(cat)=> r.breakdown[cat].announce - selCat(cat), emph:true },
      { key:'delivered',    title:_lang()==='en'?'Delivered':'출고대수',                  total:r.delivered, pct:deliveredPct,                   field:'deliver'  },
      { key:'remaining',    title:_lang()==='en'?'Out-delivery Remaining':'출고잔여대수',  total:r.remaining, pct:remainingPct,                   field:null,
        fn: (cat) => Math.max(0, r.breakdown[cat].announce - r.breakdown[cat].deliver) },
    ];

    const buildCard = (c) => {
      const val = (cat) => c.fn ? c.fn(cat) : r.breakdown[cat][c.field];
      const head = c.pct != null ? `<span class="dc-pct">${tr('label','전체 대비')} ${c.pct}%</span>` : '';
      return `
        <div class="detail-card v2${c.emph ? ' dc-emph' : ''}" data-card="${c.key}">
          <div class="dc-title-row">
            <span class="dc-title">${c.title}</span>
            ${head}
          </div>
          <div class="dc-total">
            <span class="dc-num">${fmt(c.total)}</span>
            <span class="dc-unit">${tr('label','대').trim()||'units'}</span>
          </div>
          <dl class="dc-list">
            <div><dt>${tr('label','우선순위')}</dt><dd>${fmt(val('priority'))}</dd></div>
            <div><dt>${tr('label','법인·기관')}</dt><dd>${fmt(val('corporate'))}</dd></div>
            <div><dt>${tr('label','택시')}</dt><dd>${fmt(val('taxi'))}</dd></div>
            <div><dt>${tr('label','일반')}</dt><dd>${fmt(val('general'))}</dd></div>
          </dl>
        </div>
      `;
    };

    // 카테고리별 분포 (수평 누적 바) — 공고/접수/선정/출고/선정잔여/출고잔여
    const cats = [
      { k:'priority',  label:tr('label','우선순위'),  color:'#1AAD6C' },
      { k:'corporate', label:tr('label','법인·기관'), color:'#2C7BE5' },
      { k:'taxi',      label:tr('label','택시'),      color:'#FF9A2E' },
      { k:'general',   label:tr('label','일반'),      color:'#94A3B8' },
    ];
    const metrics = [
      { key:'announce', label:tr('label','공고'), total:r.announcement },
      { key:'receive',  label:tr('label','접수'), total:r.received },
      { key:'select',   label:_lang()==='en'?'Selected':'선정', total:selTotal, fn:(k)=>selCat(k), emph:true },
      { key:'deliver',  label:tr('label','출고'), total:r.delivered },
      { key:'selremain',label:_lang()==='en'?'Selection Rem.':'선정잔여', total:selRemTotal, fn:(k)=> r.breakdown[k].announce - selCat(k), emph:true },
      { key:'remaining',label:_lang()==='en'?'Out-delivery Rem.':'출고잔여', total:r.remaining, fn:(k)=> Math.max(0, r.breakdown[k].announce - r.breakdown[k].deliver) },
    ];
    const stackChartHTML = `
      <div class="stack-chart">
        <div class="sc-header">
          <span class="sc-title">${tr('label','카테고리별 분포')}</span>
          <div class="sc-legend">
            ${cats.map(c => `<span class="sc-leg"><span class="sc-swatch" style="background:${c.color};"></span>${c.label}</span>`).join('')}
          </div>
        </div>
        ${metrics.map(m => {
          const tot = m.total || 1;
          return `
            <div class="sc-row">
              <div class="sc-row-head">
                <span class="sc-row-label"${m.emph ? ' style="font-weight:800;color:var(--color-primary-700,#0f6e56);"' : ''}>${m.label}${m.emph ? ' ★' : ''}</span>
                <span class="sc-row-total">${fmt(m.total)}${tr('label','대').trim()||'u'}</span>
              </div>
              <div class="sc-bar">
                ${cats.map(c => {
                  const v = m.fn ? m.fn(c.k) : (r.breakdown[c.k][m.key] || 0);
                  const p = tot > 0 ? (v / tot) * 100 : 0;
                  if (p <= 0) return '';
                  return `<div class="sc-seg" style="width:${p}%; background:${c.color};"
                              title="${c.label}: ${fmt(v)}대 (${p.toFixed(1)}%)">
                            ${p >= 12 ? `<span>${Math.round(p)}%</span>` : ''}
                          </div>`;
                }).join('')}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    return `
      <div class="detail-body v2">
        <!-- 공고별 일정(접수기간·신청마감·공고문) + 비고 + 담당자 -->
        <div class="detail-top-v2">
          <div class="dt-block">
            <div class="dt-head">공고별 일정 · 공고문 <span class="dt-sub">${r.notices.length}${tr('label','건')}</span></div>
            <div class="dt-body">${noticesScheduleHTML}</div>
          </div>
          <div class="dt-two">
          <div class="dt-block">
            <div class="dt-head">${tr('label','비고')}</div>
            <div class="dt-body"><div class="notice-remark">${(r.remark || '-').replace(/\n/g, '<br>')}</div></div>
          </div>
          <div class="dt-block">
            <div class="dt-head">${tr('label','담당 안내')}</div>
            <div class="dt-body">
              <dl class="dept-list">
                <div><dt>${tr('label','담당부서')}</dt><dd>${r.dept || '-'}</dd></div>
                <div><dt>${tr('label','연락처')}</dt><dd>☎ ${r.phone || '-'}</dd></div>
                <div><dt>${tr('label','접수방법')}</dt><dd>${tr('method', r.method)}</dd></div>
              </dl>
            </div>
          </div>
          </div>
        </div><!-- /detail-top-v2 -->

        <!-- 상세 대수 정보 (분류별 · 선정/선정잔여 강조) -->
        <div class="detail-sec-h">${tr('label','상세 대수 정보')}</div>
        <div class="detail-cards v2">
          ${cards.map(buildCard).join('')}
        </div>

        <!-- 예산 소진율 / 잔여 예산 비율 (실예산 비공개 · 선정 기준) -->
        <div class="budget-ratio" style="margin: 18px 0 0;">
          <div class="br-head">
            <span class="br-title">${_lang()==='en'?'Budget Status (selection basis)':'예산 현황 (선정 기준)'}</span>
          </div>
          <div class="br-bar">
            <div class="br-used" style="width:${budgetUsedPct}%;">${budgetUsedPct >= 8 ? (_lang()==='en'?'Used ':'소진 ') + budgetUsedPct + '%' : ''}</div>
            <div class="br-remain" style="width:${budgetRemainPct}%;">${budgetRemainPct >= 8 ? (_lang()==='en'?'Remain ':'잔여 ') + budgetRemainPct + '%' : ''}</div>
          </div>
          <div class="br-stats">
            <div class="br-stat"><span>${_lang()==='en'?'Budget Used':'예산 소진율'}</span><strong>${budgetUsedPct}%</strong></div>
            <div class="br-stat"><span>${_lang()==='en'?'Remaining Budget':'잔여 예산 비율'}</span><strong class="rem">${budgetRemainPct}%</strong></div>
          </div>
        </div>

        <!-- 카테고리별 분포 -->
        ${stackChartHTML}
      </div>
    `;
  }

  function expandRow(mainTr) {
    const id = mainTr.dataset.id;
    const r = DATA.find(x => x.id === id);
    if (!r) return;
    const detailTr = document.querySelector(`tr.detail-row[data-detail-for="${id}"]`);
    if (!detailTr) return;

    const isOpen = detailTr.classList.toggle('show');
    mainTr.classList.toggle('open', isOpen);
    mainTr.setAttribute('aria-expanded', isOpen);
    const toggleBtn = mainTr.querySelector('.expand-toggle');
    if (toggleBtn) {
      const label = toggleBtn.querySelector('.label');
      if (label) label.textContent = isOpen ? '접기' : '펼치기';
      toggleBtn.setAttribute('aria-expanded', isOpen);
    }

    if (isOpen) {
      const td = detailTr.querySelector('td');
      // 중첩 <tr> 문제를 피하기 위해 innerHTML로 직접 설정
      td.innerHTML = buildDetailHTML(r);
      // 애니메이션 트리거 (다음 프레임에 실행)
      requestAnimationFrame(() => animateDetailPanel(td));
    }
  }

  // ---------------- 공고문 실제 다운로드 ----------------
  // Blob으로 HTML 문서를 생성하고 브라우저 기본 다운로드 트리거
  function buildNoticeDocument(row, notice) {
    const pct = (a, b) => b > 0 ? Math.round((a/b)*100) : 0;
    const bd = row.breakdown;
    const cats = [
      { label:'우선순위', k:'priority' },
      { label:'법인·기관', k:'corporate' },
      { label:'택시', k:'taxi' },
      { label:'일반', k:'general' },
    ];
    const f = (n) => (n||0).toLocaleString('ko-KR');
    const rows = cats.map(c => `
      <tr>
        <td style="padding:8px 12px;border:1px solid #ccc;">${c.label}</td>
        <td style="padding:8px 12px;border:1px solid #ccc;text-align:right;">${f(bd[c.k].announce)}</td>
        <td style="padding:8px 12px;border:1px solid #ccc;text-align:right;">${f(bd[c.k].receive)}</td>
        <td style="padding:8px 12px;border:1px solid #ccc;text-align:right;">${f(bd[c.k].deliver)}</td>
        <td style="padding:8px 12px;border:1px solid #ccc;text-align:right;">${f(bd[c.k].announce - bd[c.k].deliver)}</td>
      </tr>
    `).join('');

    return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<title>${notice.label} - ${row.year}년 ${row.region} ${row.vehicleType} 보조금 공고</title>
<style>
  @page { size: A4; margin: 20mm; }
  body { font-family: 'Malgun Gothic','맑은 고딕','Apple SD Gothic Neo',sans-serif; color:#1a1a1a; line-height:1.7; max-width:800px; margin:0 auto; padding:40px 30px; }
  .doc-head { text-align:center; padding-bottom:20px; border-bottom:3px double #1a3c7a; margin-bottom:30px; }
  .doc-no { font-size:12px; color:#666; margin-bottom:8px; }
  .doc-title { font-size:22px; font-weight:700; letter-spacing:-0.02em; margin:0 0 6px; }
  .doc-sub { font-size:13px; color:#666; }
  h2 { font-size:15px; margin:24px 0 10px; padding:8px 14px; background:#f1f5f9; border-radius:6px; }
  table { width:100%; border-collapse:collapse; margin:10px 0 18px; font-size:13px; }
  th,td { padding:8px 12px; border:1px solid #ccc; text-align:left; }
  th { background:#f8fafc; font-weight:700; }
  .info-grid { display:grid; grid-template-columns: 120px 1fr; gap:8px; font-size:14px; margin:10px 0 20px; }
  .info-grid dt { font-weight:700; color:#333; padding:6px 0; }
  .info-grid dd { margin:0; padding:6px 0; color:#1a1a1a; }
  .notice-box { background:#fffbea; border:1px solid #f4d89a; padding:14px 18px; border-radius:4px; margin:16px 0; font-size:13px; line-height:1.8; }
  .notice-box strong { color:#b45309; }
  .footer { margin-top:40px; padding-top:20px; border-top:1px solid #ccc; font-size:11px; color:#888; text-align:center; }
  .stamp { text-align:right; margin-top:30px; padding:20px; }
  .stamp-agency { font-size:16px; font-weight:700; margin-bottom:4px; }
  .stamp-date { font-size:14px; }
  ul { padding-left:20px; }
  ul li { margin-bottom:4px; font-size:13.5px; }
  @media print { body { padding:0; } }
</style>
</head>
<body>
  <header class="doc-head">
    <div class="doc-no">환경부 공고 제 ${row.year}-${row.id.replace('r','').padStart(4,'0')}호</div>
    <h1 class="doc-title">${row.year}년 ${row.region}<br>${row.vehicleType} 구매보조금 ${notice.label}</h1>
    <div class="doc-sub">${notice.date} 게시</div>
  </header>

  <h2>1. 공고 개요</h2>
  <dl class="info-grid">
    <dt>공고기관</dt><dd>${row.dept || '한국환경공단'}</dd>
    <dt>공고일자</dt><dd>${notice.date}</dd>
    <dt>지역구분</dt><dd>${row.region}</dd>
    <dt>차종구분</dt><dd>${row.vehicleType} · ${row.vehicleSub || '일반'}</dd>
    <dt>기준년도</dt><dd>${row.year}년</dd>
    <dt>접수방법</dt><dd>${row.method}</dd>
    <dt>접수상태</dt><dd><strong>${rowStatus(row)}</strong></dd>
    <dt>문의처</dt><dd>${row.phone || '1661-0970'}</dd>
  </dl>

  <h2>2. 지원 규모</h2>
  <table>
    <thead>
      <tr>
        <th style="width:140px;">구분</th>
        <th style="text-align:right;">민간공고대수</th>
        <th style="text-align:right;">접수대수</th>
        <th style="text-align:right;">출고대수</th>
        <th style="text-align:right;">출고잔여</th>
      </tr>
    </thead>
    <tbody>
      <tr style="background:#f1f5f9;font-weight:700;">
        <td style="padding:8px 12px;border:1px solid #ccc;">전체</td>
        <td style="padding:8px 12px;border:1px solid #ccc;text-align:right;">${f(row.announcement)}</td>
        <td style="padding:8px 12px;border:1px solid #ccc;text-align:right;">${f(row.received)}</td>
        <td style="padding:8px 12px;border:1px solid #ccc;text-align:right;">${f(row.delivered)}</td>
        <td style="padding:8px 12px;border:1px solid #ccc;text-align:right;">${f(row.remaining)}</td>
      </tr>
      ${rows}
    </tbody>
  </table>

  <h2>3. 지원 대상</h2>
  <ul>
    <li>「대기환경보전법」 제58조에 따른 무공해차 구매 지원 요건을 충족하는 개인 또는 법인</li>
    <li>대한민국 국내 거주자 (만 18세 이상 개인) 또는 국내 소재 법인·단체</li>
    <li>의무운행 기간(승용 2년, 승합 5년) 준수 서약</li>
    <li>동일 차량에 대한 중복 보조금 수령 불가</li>
  </ul>

  <h2>4. 신청 방법 및 절차</h2>
  <ul>
    <li>접수처: ${row.dept || '관할 지자체 환경 담당부서'}</li>
    <li>접수방법: ${row.method} (온라인 접수 병행)</li>
    <li>제출서류: 구매계약서 사본, 주민등록등본(또는 사업자등록증), 차량 인수증 등</li>
    <li>신청 기간: ${row.year}년 회계연도 내 예산 소진 시까지</li>
  </ul>

  <h2>5. 지원 금액</h2>
  <ul>
    <li>차종·모델별 국비 + 지방비 매칭 방식으로 지급</li>
    <li>우선순위 대상자(취약계층·청년·다자녀 등) 가산 혜택 별도 적용</li>
    <li>세부 모델별 지방비는 무공해차 통합누리집에서 조회 가능</li>
  </ul>

  <h2>6. 유의사항</h2>
  <div class="notice-box">
    <strong>안내</strong>
    <ul style="margin-top:8px;">
      <li>본 공고는 예산 소진 시 사전 예고 없이 마감될 수 있습니다.</li>
      <li>허위·부적정 신청 시 보조금 지급 취소 및 3년간 참여 제한</li>
      <li>관련 문의: ${row.dept || '한국환경공단 무공해차지원처'} ${row.phone || '1661-0970'}</li>
      <li>비고: ${row.remark || '접수 진행중'}</li>
    </ul>
  </div>

  <div class="stamp">
    <div class="stamp-agency">${row.dept || '한국환경공단'}</div>
    <div class="stamp-date">${notice.date}</div>
  </div>

  <footer class="footer">
    이 문서는 무공해차 통합누리집(ev.or.kr)에서 자동 생성된 공고문입니다. · 출력일: ${new Date().toLocaleDateString('ko-KR')}<br>
    문서를 인쇄하거나 PDF로 저장하려면 브라우저의 인쇄 기능(Ctrl+P / ⌘+P)을 이용해 주세요.
  </footer>
</body>
</html>`;
  }

  function downloadNotice(rowId, noticeIdx) {
    const row = DATA.find(x => x.id === rowId);
    if (!row) return;
    const notice = row.notices[parseInt(noticeIdx, 10)];
    if (!notice) return;

    const html = buildNoticeDocument(row, notice);
    const blob = new Blob(['\ufeff' + html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    // 파일명: 환경부공고_2026_서울특별시_전기승용_본공고1.html
    const safe = (s) => String(s).replace(/[^\w가-힣]+/g, '');
    const fname = `환경부공고_${row.year}_${safe(row.region)}_${safe(row.vehicleType)}_${safe(notice.label)}.html`;

    const a = document.createElement('a');
    a.href = url;
    a.download = fname;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 100);

    if (window.__toast) window.__toast(`"${notice.label}" 공고문을 다운로드했습니다. (${fname})`, 'success');
  }

  // 공고문 다운로드 버튼 (event delegation)
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-notice-download]');
    if (!btn) return;
    e.preventDefault();
    const [rowId, idx] = btn.dataset.noticeDownload.split(':');
    downloadNotice(rowId, idx);
  });

  // 상세 영역 펼침 시 부드러운 스택바 width 전환 (250ms, 단순)
  function animateDetailPanel(root) {
    root.querySelectorAll('.sc-seg').forEach(seg => {
      const w = seg.style.width;
      seg.style.width = '0%';
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          seg.style.transition = 'width 300ms ease-out';
          seg.style.width = w;
        });
      });
    });
  }

  function bindRowHandlers() {
    // Event delegation handled globally by main.js, but we need specific expand toggle
    $$('#subsidy-tbody tr.main-row').forEach(tr => {
      // Re-bind click directly (overrides the generic handler gracefully)
      tr.addEventListener('click', (e) => {
        if (e.target.closest('a') || e.target.closest('button:not(.expand-toggle)')) return;
        expandRow(tr);
      });
    });
    // Header sort
    $$('#subsidy-table th.sortable').forEach(th => {
      th.addEventListener('click', () => {
        const key = th.dataset.sortKey;
        if (state.sort.key === key) state.sort.asc = !state.sort.asc;
        else { state.sort.key = key; state.sort.asc = true; }
        sortData();
        // update arrow classes
        $$('#subsidy-table th.sortable').forEach(t => t.classList.remove('sort-asc', 'sort-desc'));
        th.classList.add(state.sort.asc ? 'sort-asc' : 'sort-desc');
        render();
      });
    });
  }

  // ---------------- Excel export ----------------
  // 메인표 + 펼치기(상세) 전체를 관계형 5개 시트로 출력
  //   0.안내  1.요약(메인표)  2.상세_대수정보  3.공고별_일정  4.모델별_지방비
  //   - 모든 데이터 시트는 공통 '관리번호'({기준년도}-{id})로 조인 가능
  function exportExcel() {
    if (typeof XLSX === 'undefined') {
      if (window.__toast) window.__toast('엑셀 라이브러리 로딩 중입니다. 잠시 후 다시 시도해 주세요.', 'info');
      return;
    }
    const rows = state.filtered;
    if (rows.length === 0) {
      if (window.__toast) window.__toast('조회된 데이터가 없습니다.', 'info');
      return;
    }

    // ── 공통 헬퍼 ──
    const catKeys = ['priority', 'corporate', 'taxi', 'general'];
    const key = (r) => `${r.year}-${r.id}`;                                   // 조인 키
    const selCat = (r, k) => Math.min(r.breakdown[k].announce, r.breakdown[k].receive);
    const rowSel = (r) => catKeys.reduce((a, k) => a + selCat(r, k), 0);       // 선정 = Σ min(공고,접수)
    const pct = (a, b) => b > 0 ? Math.round((a / b) * 100) : 0;
    // 공고종류 요약 (예: "본공고2·추경1")
    const kindSummary = (r) => {
      const m = {};
      r.notices.forEach(n => { const k = noticeKind(n.label); m[k] = (m[k] || 0) + 1; });
      return Object.entries(m).map(([k, v]) => `${k}${v}`).join('·') || '-';
    };
    // 최종 신청마감 (공고별 마감 중 최댓값)
    const lastDeadline = (r) => {
      const ds = r.notices.map(n => noticeSchedule(n).deadline).sort((a, b) => a.localeCompare(b));
      return ds.length ? ds[ds.length - 1] : '-';
    };

    // ── 시트 0: 안내(메타) ──
    const fParts = [
      `기준년도 ${els.year.value}`, `차종 ${els.vehicle.value}`, `세부차종 ${els.sub.value}`,
      `시도 ${els.sido.value}`, `시군구 ${els.sigungu.value}`,
      `접수방법 ${els.method.value}`, `상태 ${els.status.value}`,
    ];
    const favOnlyEl = document.getElementById('subsidyFavOnly');
    if (favOnlyEl && favOnlyEl.checked) fParts.push('즐겨찾기만');
    const info = [
      ['항목', '내용'],
      ['자료명', '지자체별 보조금 현황'],
      ['출처', '환경부 보조금관리시스템(한국환경공단) 실시간 연동'],
      ['집계 안내', '매 영업일 09시·14시 집계 반영'],
      ['다운로드 시각', new Date().toLocaleString('ko-KR')],
      ['조회 조건', fParts.join(' · ')],
      ['조회 건수', `${rows.length}건`],
      ['단위', '대수=대, 비율=%, 금액=만원'],
      ['산식', '선정=min(공고,접수) · 선정잔여=공고−선정 · 출고잔여=공고−출고'],
      ['예산현황', '실예산 비공개 · 예산소진율=카테고리 단가 가중(우선순위 1.2 · 택시 1.1 · 법인·기관/일반 1.0) 선정 기준 → [예산현황] 시트 참조'],
      ['변경이력', '리스트/공고 변경 시 변경일자·변경 항목·변경 전후를 [변경이력] 시트에 기록'],
    ];

    // ── 시트 1: 요약(메인표) ──
    const summary = [
      ['관리번호', '기준년도', '시도', '지역구분', '차종', '세부차종', '접수방법', '접수상태',
       '공고종류', '공고건수', '최종 신청마감',
       '공고대수(전체)', '접수대수(전체)', '선정대수(전체)', '출고대수(전체)', '선정잔여(전체)', '출고잔여(전체)',
       '접수율(%)', '선정률(%)', '출고율(%)', '예산소진율(%)', '잔여예산비율(%)',
       '담당부서', '연락처', '비고'],
      ...rows.map(r => {
        const sel = rowSel(r);
        const selRem = Math.max(0, r.announcement - sel);
        const bud = budgetUsedPctOf(r); // 예산소진율 = 카테고리 단가 가중(화면 '예산 현황'과 동일)
        return [
          key(r), r.year, r.sido, r.region, r.vehicleType, r.vehicleSub, r.method, rowStatus(r),
          kindSummary(r), r.notices.length, lastDeadline(r),
          r.announcement, r.received, sel, r.delivered, selRem, r.remaining,
          pct(r.received, r.announcement), pct(sel, r.announcement), pct(r.delivered, r.announcement),
          bud, Math.max(0, 100 - bud),
          r.dept, r.phone, (r.remark || '-').replace(/\n/g, ' ')
        ];
      })
    ];

    // ── 시트 2: 상세_대수정보 (지자체×차종 × 6지표 × 4분류, 관리번호 매행 반복) ──
    const detail = [
      ['관리번호', '기준년도', '시도', '지역구분', '차종', '세부차종',
       '구분', '전체', '우선순위', '법인·기관', '택시', '일반']
    ];
    rows.forEach(r => {
      const head = [key(r), r.year, r.sido, r.region, r.vehicleType, r.vehicleSub];
      const sel = (k) => selCat(r, k);
      detail.push([...head, '공고대수',
        r.announcement, r.breakdown.priority.announce, r.breakdown.corporate.announce,
        r.breakdown.taxi.announce, r.breakdown.general.announce]);
      detail.push([...head, '접수대수',
        r.received, r.breakdown.priority.receive, r.breakdown.corporate.receive,
        r.breakdown.taxi.receive, r.breakdown.general.receive]);
      detail.push([...head, '선정대수',
        rowSel(r), sel('priority'), sel('corporate'), sel('taxi'), sel('general')]);
      detail.push([...head, '출고대수',
        r.delivered, r.breakdown.priority.deliver, r.breakdown.corporate.deliver,
        r.breakdown.taxi.deliver, r.breakdown.general.deliver]);
      detail.push([...head, '선정잔여',
        Math.max(0, r.announcement - rowSel(r)),
        r.breakdown.priority.announce - sel('priority'),
        r.breakdown.corporate.announce - sel('corporate'),
        r.breakdown.taxi.announce - sel('taxi'),
        r.breakdown.general.announce - sel('general')]);
      detail.push([...head, '출고잔여',
        r.remaining,
        r.breakdown.priority.announce - r.breakdown.priority.deliver,
        r.breakdown.corporate.announce - r.breakdown.corporate.deliver,
        r.breakdown.taxi.announce - r.breakdown.taxi.deliver,
        r.breakdown.general.announce - r.breakdown.general.deliver]);
    });

    // ── 시트 3: 공고별_일정·공고문 (공고 1건 = 1행) ──
    const announce = [
      ['관리번호', '기준년도', '시도', '지역구분', '차종', '세부차종',
       '공고종류', '공고명', '게시일', '접수시작', '접수마감']
    ];
    rows.forEach(r => {
      r.notices.forEach(n => {
        const s = noticeSchedule(n);
        announce.push([key(r), r.year, r.sido, r.region, r.vehicleType, r.vehicleSub,
          noticeKind(n.label), n.label, n.date, s.start, s.end]);
      });
    });

    // ── 시트 4: 모델별 지방비 (모델 1건 = 1행) ──
    const modelSheet = [
      ['관리번호', '기준년도', '시도', '지역구분', '차종', '세부차종',
       '모델명', '제조사', '배터리', '주행거리', '국비(만원)', '지방비(만원)', '총지원금(만원)', '지원여부']
    ];
    rows.forEach(r => {
      buildModelsForRow(r).forEach(m => {
        modelSheet.push([key(r), r.year, r.sido, r.region, r.vehicleType, r.vehicleSub,
          m.model, m.maker, m.battery, m.range, m.national, m.local, m.total, m.availability]);
      });
    });

    // ── 시트: 예산현황 (실예산 비공개 · 카테고리 단가 가중 선정 기준 소진율) ──
    const budgetSheet = [
      ['관리번호', '기준년도', '시도', '지역구분', '차종', '세부차종',
       '공고대수', '선정대수', '예산소진율(%)', '잔여예산비율(%)', '예산 기준', '비고']
    ];
    rows.forEach(r => {
      const bud = budgetUsedPctOf(r);
      budgetSheet.push([key(r), r.year, r.sido, r.region, r.vehicleType, r.vehicleSub,
        r.announcement, rowSel(r), bud, Math.max(0, 100 - bud),
        '실예산 비공개 · 카테고리 단가 가중 선정 기준', (r.remark || '-').replace(/\n/g, ' ')]);
    });

    // ── 시트 5: 변경이력 (관리번호별 변경 이력 — 실데이터 연동 전 더미 샘플) ──
    const changeLog = [
      ['관리번호', '변경일자', '변경 구분', '변경 항목', '변경 전', '변경 후', '안내']
    ];
    rows.forEach(r => {
      changeLog.push([key(r), '2026-04-18', '리스트항목', '공고대수(전체)', '100', '120', '2차 공고분 추가']);
      changeLog.push([key(r), '2026-05-02', '공고', '접수마감', '05.02', '05.15', '접수기간 연장 공고']);
    });

    // ── 워크북 조립 ──
    const wb = XLSX.utils.book_new();
    const ws0 = XLSX.utils.aoa_to_sheet(info);
    const ws1 = XLSX.utils.aoa_to_sheet(summary);
    const ws2 = XLSX.utils.aoa_to_sheet(detail);
    const ws3 = XLSX.utils.aoa_to_sheet(announce);
    const ws4 = XLSX.utils.aoa_to_sheet(modelSheet);
    const wsBud = XLSX.utils.aoa_to_sheet(budgetSheet);
    const ws5 = XLSX.utils.aoa_to_sheet(changeLog);

    ws0['!cols'] = [{wch:14},{wch:80}];
    ws1['!cols'] = [{wch:10},{wch:9},{wch:8},{wch:22},{wch:10},{wch:9},{wch:9},{wch:9},
                    {wch:14},{wch:9},{wch:15},{wch:14},{wch:14},{wch:14},{wch:14},{wch:14},{wch:14},
                    {wch:9},{wch:9},{wch:9},{wch:12},{wch:13},{wch:26},{wch:14},{wch:40}];
    ws2['!cols'] = [{wch:10},{wch:9},{wch:8},{wch:22},{wch:10},{wch:9},{wch:10},{wch:11},{wch:11},{wch:11},{wch:11},{wch:11}];
    ws3['!cols'] = [{wch:10},{wch:9},{wch:8},{wch:22},{wch:10},{wch:9},{wch:9},{wch:14},{wch:13},{wch:18},{wch:18}];
    ws4['!cols'] = [{wch:10},{wch:9},{wch:8},{wch:22},{wch:10},{wch:9},{wch:18},{wch:12},{wch:11},{wch:11},{wch:12},{wch:12},{wch:14},{wch:10}];
    wsBud['!cols'] = [{wch:10},{wch:9},{wch:8},{wch:22},{wch:10},{wch:9},{wch:10},{wch:10},{wch:13},{wch:15},{wch:34},{wch:40}];
    ws5['!cols'] = [{wch:10},{wch:12},{wch:12},{wch:18},{wch:14},{wch:14},{wch:30}];

    XLSX.utils.book_append_sheet(wb, ws0, '안내');
    XLSX.utils.book_append_sheet(wb, ws1, '요약');
    XLSX.utils.book_append_sheet(wb, ws2, '상세_대수정보');
    XLSX.utils.book_append_sheet(wb, wsBud, '예산현황');
    XLSX.utils.book_append_sheet(wb, ws3, '공고별_일정');
    XLSX.utils.book_append_sheet(wb, ws4, '모델별_지방비');
    XLSX.utils.book_append_sheet(wb, ws5, '변경이력');

    const year = els.year.value;
    const fname = `무공해차_보조금현황_${year}_${new Date().toISOString().slice(0,10)}.xlsx`;
    XLSX.writeFile(wb, fname);
    if (window.__toast) window.__toast(`엑셀 파일 "${fname}" 다운로드를 시작합니다. (7개 시트)`, 'success');
  }

  // ---------------- Reset ----------------
  function resetFilters() {
    els.year.value = '2026';
    els.vehicle.value = '전체';
    refreshSubOptions();
    els.sido.value = '전체';
    refreshSigunguOptions();
    els.method.value = '전체';
    els.status.value = '전체';
    $$('.region-chip[data-chip-region]').forEach(c => c.classList.remove('selected'));
    const all = document.querySelector('.region-chip[data-chip-region="전체"]');
    if (all) all.classList.add('selected');
    state.sort = { key: null, asc: true };
    $$('#subsidy-table th.sortable').forEach(t => t.classList.remove('sort-asc', 'sort-desc'));
    applyFilter();
    if (window.__toast) window.__toast('조건을 초기화했습니다.', 'info');
  }

  // ---------------- Init ----------------
  function init() {
    refreshSubOptions();
    refreshSigunguOptions();

    // Cascade listeners
    els.vehicle.addEventListener('change', () => { refreshSubOptions(); });
    els.sido.addEventListener('change', () => {
      refreshSigunguOptions();
      // 시도 변경 시 빠른 칩도 동기화
      $$('.region-chip[data-chip-region]').forEach(c => c.classList.remove('selected'));
      const chip = document.querySelector(`.region-chip[data-chip-region="${els.sido.value}"]`);
      if (chip) chip.classList.add('selected');
      else {
        const all = document.querySelector('.region-chip[data-chip-region="전체"]');
        if (all) all.classList.add('selected');
      }
    });

    // Apply button + Enter on selects
    els.apply.addEventListener('click', () => {
      applyFilter();
      if (window.__toast) window.__toast(`${state.filtered.length}건의 보조금 현황이 조회되었습니다.`, state.filtered.length ? 'success' : 'info');
    });
    els.reset.addEventListener('click', resetFilters);

    // Year change triggers auto-apply
    els.year.addEventListener('change', applyFilter);

    // Quick chips
    $$('.region-chip[data-chip-region]').forEach(chip => {
      chip.addEventListener('click', () => {
        $$('.region-chip[data-chip-region]').forEach(c => c.classList.remove('selected'));
        chip.classList.add('selected');
        els.sido.value = chip.dataset.chipRegion;
        refreshSigunguOptions();
        applyFilter();
      });
    });

    // Excel download
    els.excel.addEventListener('click', exportExcel);

    // 초기 렌더
    applyFilter();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
