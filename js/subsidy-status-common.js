/* subsidy-status-common.js — 보조금 신청현황 공유 로직/렌더
   ── subsidy-status.html(개인) / subsidy-status-corp.html(법인) 공유.
      여기 한 곳만 고치면 양쪽에 반영됨(STAGES/mapStep/카드 렌더). */
window.SubsidyStatus = (function () {
  'use strict';

  /* ── 진행상태 5단계 (레거시 ev_ps 코드 → 대민 표시단계) ──
     레거시 내부 라벨은 노출하지 않고 아래 표시명만 사용.
       102(되돌리기)→자격심사 / 201(담당자 전달)→지급신청 으로 흡수. */
  var STAGES = [
    { key: 'received', label: '신청접수',     codes: [101] },
    { key: 'review',   label: '자격심사',     codes: [102, 103, 120, 121] },
    { key: 'selected', label: '지원대상선정', codes: [130] },
    { key: 'payreq',   label: '지급신청',     codes: [201, 202, 203, 290] },
    { key: 'paid',     label: '지급완료',     codes: [220, 221, 501] }
  ];
  var LAST = STAGES.length - 1; // 4 = 지급완료

  /* 예외 — 보완요청(단계 위 오버레이) / 종료(취소·반려) */
  var SUPP_CODES  = [110, 111, 210, 211];                 // 110·111→자격심사, 210·211→지급신청
  var SUPP_STAGE  = { 110: 1, 111: 1, 210: 3, 211: 3 };
  var CANCEL_CODES = [910, 920, 930, 940, 950];
  var CANCEL_LABEL = { 910: '지원취소', 920: '신청포기', 930: '출고지연취소', 940: '승인불가', 950: '취소' };

  function mapStep(code) {
    code = Number(code);
    if (SUPP_CODES.indexOf(code) >= 0)  return { flag: 'supplement', stage: SUPP_STAGE[code], srcCode: code };
    if (CANCEL_CODES.indexOf(code) >= 0) return { flag: 'cancel', stage: null, srcCode: code };
    for (var i = 0; i < STAGES.length; i++) if (STAGES[i].codes.indexOf(code) >= 0) return { flag: 'normal', stage: i, srcCode: code };
    return { flag: 'normal', stage: 0, srcCode: code };
  }

  function won(n) { return Number(n).toLocaleString('ko-KR') + '만원'; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  function stageBadge(it) {
    if (it.flag === 'supplement') return '<span class="stt stt-supp">⚠ 보완요청</span>';
    if (it.flag === 'cancel')     return '<span class="stt stt-cancel">✕ 종료</span>';
    var cls = it.stage === LAST ? 'stt-done' : (it.stage === 0 ? 'stt-received' : 'stt-progress');
    return '<span class="stt ' + cls + '">' + STAGES[it.stage].label + '</span>';
  }

  /* 누적식 진행바 — 현재 단계까지 채움. 종료는 회색/중단. */
  function stepperHtml(it) {
    var cancel = it.flag === 'cancel';
    var cur = cancel ? -1 : it.stage;          // 보완요청도 머무는 단계까지 채움
    var steps = STAGES.map(function (s, i) {
      var cls = (i < cur) ? 'done' : (i === cur ? 'active' : '');
      var dt = (it.dates && it.dates[i]) ? it.dates[i] : '';
      return '<div class="ms-hstep ' + cls + '"><div class="dot">' + (i + 1) + '</div><div class="lbl">' + s.label + '</div><div class="dt">' + (dt || '–') + '</div></div>';
    }).join('');
    return '<div class="ms-hsteps ' + (cancel ? 'ssp-stepper is-cancel' : 'ssp-stepper') + '">' + steps + '</div>';
  }

  function cancelReasonText(it) {
    var lbl = it.srcCode ? CANCEL_LABEL[it.srcCode] : '';
    return (lbl ? '[' + lbl + '] ' : '') + (it.cancelReason || '신청이 종료 처리되었습니다.');
  }

  /* 단계별 "내가 할 일" 안내 */
  function actionLine(it) {
    if (it.flag === 'supplement') return '보완서류를 다시 제출해 주세요. 미제출 시 심사가 지연될 수 있습니다.';
    if (it.flag === 'cancel')     return '이 신청은 종료되었습니다. 재신청을 원하시면 새로 신청해 주세요.';
    switch (it.stage) {
      case 0: return '신청이 접수되었습니다. 자격심사 결과를 기다려 주세요.';
      case 1: return '자격심사가 진행 중입니다. 추가 서류 요청이 있으면 안내드립니다.';
      case 2: return '지원대상으로 선정되었습니다. 판매사 출고 절차가 이어집니다.';
      case 3: return '판매사가 출고·지급신청을 진행 중입니다. 구매자가 하실 일은 없습니다.';
      case 4: return '지급이 완료되어 모든 절차가 종료되었습니다.';
    }
    return '';
  }

  /* ── 카드 1장 ── */
  function cardHtml(it, opts) {
    var cardCls = 'ssp-card' + (it.flag === 'supplement' ? ' is-supp' : '') + (it.flag === 'cancel' ? ' is-cancel' : '');
    var pid = 'sspd-' + esc(it.reqSeq).replace(/[^a-zA-Z0-9_-]/g, '');
    return '<article class="' + cardCls + '" data-id="' + esc(it.reqSeq) + '">'
      + '<div class="ssp-head" role="button" tabindex="0" aria-expanded="false" aria-controls="' + pid + '">'
      +   '<div class="ssp-titlerow"><span class="cartype">' + esc(it.carType) + '</span><h3>' + esc(it.model || it.carNo || '') + '</h3>'
      +     stageBadge(it)
      +     '<svg class="ssp-chev" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>'
      +   '</div>'
      +   '<div class="ssp-meta">신청번호 ' + esc(it.reqSeq) + '<span class="sep">|</span>' + esc(it.region) + '<span class="sep">|</span>적용 보조금 <span class="amt">' + won(it.amount) + '</span></div>'
      +   stepperHtml(it)
      + '</div>'
      + '<div class="ssp-detail" id="' + pid + '" role="region" hidden>' + detailHtml(it, opts) + '</div>'
      + '</article>';
  }

  function detailHtml(it, opts) {
    opts = opts || {};
    var html = '';
    // 예외 박스 (단계 위 오버레이)
    if (it.flag === 'supplement') {
      html += '<div class="cs-note"><div class="cn-h">⚠ 보완요청 안내</div>'
        + '<p style="margin:0 0 4px;font-size:13.5px;color:var(--text-secondary);line-height:1.7;">' + esc(it.suppReason) + '</p>'
        + (it.suppDocs ? '<ul>' + it.suppDocs.map(function (d) { return '<li>' + esc(d) + '</li>'; }).join('') + '</ul>' : '')
        // 업무지원시스템 이동 버튼 (TODO: 실연동 시 구매보조금 신청현황 URL)
        + '<a href="' + (opts.supplementHref || '#') + '" class="btn btn-primary btn-sm ssp-supp-btn">업무지원시스템에서 보완서류 제출 →</a>'
        + '</div>';
    }
    if (it.flag === 'cancel') {
      html += '<div class="cs-cancel-note"><strong>종료 사유</strong> · ' + esc(cancelReasonText(it)) + '</div>';
    }
    // 내가 할 일
    html += '<div class="ssp-action"><span class="ic">📌</span><span><strong>내가 할 일</strong> · ' + esc(actionLine(it)) + '</span></div>';

    // 단계별 일정 (5단계)
    html += '<h4>단계별 일정</h4><div class="ssp-summary">';
    STAGES.forEach(function (s, i) { html += '<dl><dt>' + s.label + '</dt><dd>' + esc((it.dates && it.dates[i]) || '–') + '</dd></dl>'; });
    html += '</div>';

    // 신청 정보 (지급계좌·소유자·내역할 표시 없음)
    html += '<h4>신청 · 보조금 정보</h4><div class="ssp-summary">'
      + '<dl><dt>신청번호</dt><dd class="mono">' + esc(it.reqSeq) + '</dd></dl>'
      + '<dl><dt>차종 / 모델</dt><dd>' + esc(it.carType) + (it.model ? ' · ' + esc(it.model) : '') + '</dd></dl>';
    if (it.carNo) html += '<dl><dt>차량번호</dt><dd>' + esc(it.carNo) + '</dd></dl>';
    if (it.vin)   html += '<dl><dt>차대번호</dt><dd class="mono">' + esc(it.vin) + '</dd></dl>';
    html += '<dl><dt>지자체</dt><dd>' + esc(it.region) + '</dd></dl>'
      + '<dl><dt>적용 보조금 (국비+지방비)</dt><dd>' + won(it.amount) + '</dd></dl>'
      + '</div>'
      + '<p class="ssp-prepay">※ 적용 보조금은 차량 구매가에서 <strong>선차감</strong>되며, 보조금은 <strong>판매사를 통해 지자체에 정산</strong>됩니다(구매자에게 현금 지급되지 않습니다). 단위: 만원 · 지자체 공고 기준.</p>';
    return html;
  }

  /* ── 리스트 렌더 + 아코디언 토글(접근성) ── */
  function renderCards(listEl, data, opts) {
    if (!listEl) return;
    listEl.innerHTML = data.map(function (it) { return cardHtml(it, opts); }).join('');
    listEl.querySelectorAll('.ssp-head').forEach(function (head) {
      function toggle() {
        var card = head.closest('.ssp-card'); var det = card.querySelector('.ssp-detail');
        var open = det.hidden;
        det.hidden = !open; card.classList.toggle('open', open); head.setAttribute('aria-expanded', open ? 'true' : 'false');
      }
      head.addEventListener('click', toggle);
      head.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } });
    });
  }

  /* ── 요약 pill ── */
  function renderPills(el, data) {
    if (!el) return;
    var prog = 0, done = 0, supp = 0, cancel = 0;
    data.forEach(function (it) {
      if (it.flag === 'supplement') supp++;
      else if (it.flag === 'cancel') cancel++;
      else if (it.stage === LAST) done++;
      else prog++;
    });
    var html = '<span class="s-pill s-prog">진행중<b>' + prog + '</b></span>'
             + '<span class="s-pill s-done">완료<b>' + done + '</b></span>';
    if (supp > 0)   html += '<span class="s-pill s-supp">보완필요<b>' + supp + '</b></span>';
    if (cancel > 0) html += '<span class="s-pill s-cancel">종료<b>' + cancel + '</b></span>';
    el.innerHTML = html;
  }

  /* RAW에 flag/stage 부여 */
  function decorate(raw) { return raw.map(function (r) { var m = mapStep(r.appStep); r.flag = m.flag; r.stage = m.stage; r.srcCode = m.srcCode; return r; }); }

  return {
    STAGES: STAGES, LAST: LAST, SUPP_CODES: SUPP_CODES, CANCEL_CODES: CANCEL_CODES, CANCEL_LABEL: CANCEL_LABEL,
    mapStep: mapStep, stageBadge: stageBadge, stepperHtml: stepperHtml, actionLine: actionLine,
    cancelReasonText: cancelReasonText, won: won, esc: esc,
    cardHtml: cardHtml, detailHtml: detailHtml, renderCards: renderCards, renderPills: renderPills, decorate: decorate
  };
})();
