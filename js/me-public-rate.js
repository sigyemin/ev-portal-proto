/* ============================================================================
   me-public-rate.js — 기후에너지환경부(공공) 공표 충전요금 5밴드 · ★단일 소스
   ----------------------------------------------------------------------------
   [ISS-045] 같은 사이트에서 숫자 두 벌 금지 → charging-fee.html(요금 비교·시뮬레이터)와
   charging-find.html(충전소 상세패널 '기후에너지환경부 회원카드 결제 요금')이 이 파일 하나를 참조.

   ★성격: 기후에너지환경부 회원카드로 결제하면 어느 사업자(CPO)의 충전기를 이용해도
          기후부가 공표한 이 단가가 동일하게 적용된다(현행 ev.or.kr '로밍 충전요금'과 동일 개념).
          → 참고값이 아니라 '정확한 값'. 안내가(실결제와 다를 수 있음) 고지 대상이 아니다.

   [DEV] 원천 = 환경부 공공 충전요금 고시(출력 5단계 고정단가 · 시각·요일·회원 구분 무관).
         실서비스는 요금 고시 테이블에서 조회. 밴드 경계는 전 페이지 공용 5밴드 체계와 동일
         (완속<30 · 중속30~50 · 급속50~100 · 급속+100~200 · 초급속≥200 kW).
   ============================================================================ */
(function (w) {
  'use strict';
  w.ME_PUBLIC_RATE = {
    label: '기후에너지환경부 회원카드 결제 요금',
    unit: '원/kWh',
    // 밴드키 = 전 페이지 공용(slow·mid·fast·fastp·ultra) · fast50/fast100은 charging-fee 레거시 키 별칭
    rate: { slow: 294.3, mid: 306.0, fast: 324.4, fastp: 347.2, ultra: 391.9 },
    bands: [
      { key: 'slow',  label: '완속',   range: '30kW 미만' },
      { key: 'mid',   label: '중속',   range: '30~50kW' },
      { key: 'fast',  label: '급속',   range: '50~100kW' },
      { key: 'fastp', label: '급속+',  range: '100~200kW' },
      { key: 'ultra', label: '초급속', range: '200kW 이상' }
    ]
  };
  // charging-fee.html 레거시 키(fast50/fast100) 호환 — 동일 값을 다른 이름으로만 노출(값 중복 정의 아님)
  w.ME_PUBLIC_RATE.legacy = {
    slow:  w.ME_PUBLIC_RATE.rate.slow,
    mid:   w.ME_PUBLIC_RATE.rate.mid,
    fast50:  w.ME_PUBLIC_RATE.rate.fast,
    fast100: w.ME_PUBLIC_RATE.rate.fastp,
    ultra:   w.ME_PUBLIC_RATE.rate.ultra
  };
})(window);
