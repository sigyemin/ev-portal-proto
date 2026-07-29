/* ============================================================================
   biz-terms.js — 사업자 이용신청폼 공용 '약관동의' 컴포넌트 (ISS-086)
   ----------------------------------------------------------------------------
   3폼 공용(무공해차 보조금 지원시스템 / 브랜드사업 설치보조금 / 완속충전기 설치보조금).
   ★약관 워딩 문자단위 동일(스펙: 사업자신청폼_약관동의_통일스펙_20260729.md).
     원본 = zevBuySbsidySupprtSys.jsp L753-969 verbatim.
   ★[선택] 항목 없음 — 이용약관·개인정보 두 동의 모두 (필수약관).
   ★사용자 확정(2026-07-29, b): 원문 오탈자·비정합은 읽기 정상화(표기만 교정, 의미·항목·기간 유지).
       교정분: '금지리'→'금지' / '관활'→'관할' / '신청자이/은/으로부터'→'신청자가/는/로부터'
              / 개인정보 수집항목 '통신정보' 중복 → 통신정보(휴대폰번호·전자우편) 1행으로 통합.
   사용: 폼 안에 <div data-biz-terms></div> 배치 + 이 파일 로드. 진입 체크·팝업 자동 주입, 폼 submit 시 동의 필수.
   ============================================================================ */
(function (w, d) {
  'use strict';

  // ── 이용약관 전문 (제1장~부칙, verbatim + 교정) ──
  var TERMS_HTML =
      '<b>제 1장 총칙</b>'
    + '<dl><dt>제1조(목적)</dt><dd>본 약관은 전기자동차 구매보조금 지급시스템(이하 "당 사이트")이 제공하는 모든 서비스(이하. "서비스")의 정보수집조건 및 이용에 관한 제반사항과 기타 필요한 사항을 규정함을 목적으로 합니다.</dd></dl>'
    + '<dl><dt>제2조(용어의 정의)</dt><dd>본 약관에서 사용하는 용어의 정의는 다음 각 호와 같습니다.</dd>'
      + '<dd>① "신청자"이라 함은 서비스를 이용하기 위하여 당 사이트에 개인정보를 제공하여 아이디(ID)와 비밀번호를 부여 받은 자를 말합니다.</dd>'
      + '<dd>② "신청자 아이디(ID)"라 함은 신청자의 식별 및 서비스 이용을 위하여 자신이 선정한 문자 및 숫자의 조합을 말합니다.</dd>'
      + '<dd>③ "비밀번호(패스워드)"라 함은 신청자가 자신의 비밀보호를 위하여 선정한 문자 및 숫자의 조합을 말합니다.</dd></dl>'
    + '<dl><dt>제3조(약관의 효력과 변경)</dt>'
      + '<dd>① 이 약관은 당 사이트에 게시하거나 기타의 방법으로 신청자에게 공지함으로써 효력이 발생합니다.</dd>'
      + '<dd>② 당 사이트는 이 약관을 개정 할 경우에 적용일자 및 개정사유를 명시하여 현행 약관과 함께 당 사이트의 초기화면에 그 적용일자 7일 이전부터 적용일자 전일까지 공지합니다. 다만, 신청자에게 불리하게 약관내용을 변경하는 경우에는 최소한 30일 이상의 사전 유예기간을 두고 공지합니다. 이 경우 당 사이트는 개정 전 내용과 개정 후 내용을 명확하게 비교하여 이용자가 알기 쉽도록 표시합니다.</dd></dl>'
    + '<dl><dt>제4조(약관 외 준칙)</dt>'
      + '<dd>① 이 약관은 당 사이트가 제공하는 서비스에 관한 이용안내와 함께 적용합니다.</dd>'
      + '<dd>② 이 약관에 명시되지 아니한 사항은 관계법령 및 서비스별 안내의 취지에 따라 적용할 수 있습니다.</dd></dl>'
    + '<b>제 2장 이용계약의 체결 및 해지</b>'
    + '<dl><dt>제5조(이용계약의 성립)</dt>'
      + '<dd>① 이용계약은 이용고객이 당 사이트가 정한 약관에 「동의합니다」를 선택하고, 당 사이트가 정한 온라인 신청양식을 작성하여 서비스 이용을 신청한 후, 당 사이트가 이를 승낙함으로써 성립합니다.</dd>'
      + '<dd>② 제1항의 승낙은 전기자동차 구매보조금 지급시스템 연계 사이트와 당 사이트가 제공하는 다른 서비스의 이용승낙을 포함합니다. 다만, 하이브리드 보조금 지원시스템 연계 사이트에서 개별적으로 적용되는 약관에 대한 동의는 신청자가 하이브리드 보조금 지원시스템 연계 사이트를 최초로 이용할 때 별도의 동의절차를 거칠 수 있습니다.</dd></dl>'
    + '<dl><dt>제6조(신청자정보수집)</dt><dd>서비스를 이용하고자 하는 고객은 당 사이트에서 정한 신청자 정보수집 양식에 개인정보를 기재하여 정보수집을 하여야 합니다.</dd></dl>'
    + '<dl><dt>제7조(개인정보의 보호 및 사용)</dt><dd>당 사이트는 관계법령이 정하는 바에 따라 신청자 등록정보를 포함한 신청자의 개인정보를 보호하기 위해 노력합니다. 신청자 개인정보의 보호 및 사용에 대해서는 관련법령 및 당 사이트의 개인정보 보호정책이 적용됩니다.</dd></dl>'
    + '<dl><dt>제8조(이용 신청의 승낙과 제한)</dt>'
      + '<dd>① 당 사이트는 제6조의 규정에 의한 이용신청고객에 대하여 서비스 이용을 승낙합니다.</dd>'
      + '<dd>② 당 사이트는 아래사항에 해당하는 경우에 대해서 승낙하지 아니 합니다.<br>- 이용계약 신청서의 내용을 허위로 기재한 경우<br>- 기타 규정한 제반사항을 위반하며 신청하는 경우</dd></dl>'
    + '<dl><dt>제9조(신청자 ID 부여 및 변경 등)</dt>'
      + '<dd>① 당 사이트는 이용고객에 대하여 약관에 정하는 바에 따라 자신이 선정한 신청자 ID를 부여합니다.</dd>'
      + '<dd>② 신청자 ID는 원칙적으로 변경이 불가하며 부득이한 사유로 인하여 변경 하고자 하는 경우에는 해당 ID를 해지하고 재정보 수집해야 합니다.</dd>'
      + '<dd>③ 기타 신청자 개인정보 관리 및 변경 등에 관한 사항은 서비스별 안내에 정하는 바에 의합니다.</dd></dl>'
    + '<b>제3장 의무 및 책임</b>'
    + '<dl><dt>제10조(전기자동차 구매보조금 지급시스템 의무)</dt>'
      + '<dd>① 당 사이트는 이용고객이 희망한 서비스 제공 개시일에 특별한 사정이 없는 한 서비스를 이용할 수 있도록 하여야 합니다.</dd>'
      + '<dd>② 당 사이트는 개인정보 보호를 위해 보안시스템을 구축하며 개인정보 보호정책을 공시하고 준수합니다.</dd>'
      + '<dd>③ 당 사이트는 신청자로부터 제기되는 의견이나 불만이 정당하다고 객관적으로 인정될 경우에는 적절한 절차를 거쳐 즉시 처리하여야 합니다. 다만, 즉시 처리가 곤란한 경우는 신청자에게 그 사유와 처리일정을 통보하여야 합니다.</dd></dl>'
    + '<dl><dt>제11조(신청자의 의무)</dt>'
      + '<dd>① 이용자는 신청 또는 신청자정보 변경 시 실명으로 모든 사항을 사실에 근거하여 작성하여야 하며, 허위 또는 타인의 정보를 등록할 경우 일체의 권리를 주장할 수 없습니다.</dd>'
      + '<dd>② 당 사이트가 관계법령 및 개인정보 보호정책에 의거하여 그 책임을 지는 경우를 제외하고 신청자에게 부여된 ID의 비밀번호 관리소홀, 부정사용에 의하여 발생하는 모든 결과에 대한 책임은 신청자에게 있습니다.</dd>'
      + '<dd>③ 신청자는 당 사이트 및 제 3자의 지적 재산권을 침해해서는 안 됩니다.</dd></dl>'
    + '<b>제4장 서비스의 이용</b>'
    + '<dl><dt>제12조(서비스 이용 시간)</dt>'
      + '<dd>① 서비스 이용시간은 다음과 같습니다.<br>- IT 서비스 제공시간 : 법정 근무일 근무시간(09:00~18:00, 법정공휴일 및 주말 제외)<br>- 서비스 요청 접수시간 : 법정 근무일 근무시간(09:00~18:00, 법정공휴일 및 주말 제외) 단, 당 사이트는 시스템 정기점검, 증설 및 교체를 위해 당 사이트가 정한 날이나 시간에 서비스를 일시 중단할 수 있으며, 예정되어 있는 작업으로 인한 서비스 일시중단은 당 사이트 홈페이지를 통해 사전에 공지합니다.</dd>'
      + '<dd>② 당 사이트는 서비스를 특정범위로 분할하여 각 범위별로 이용가능시간을 별도로 지정할 수 있습니다. 다만 이 경우 그 내용을 공지합니다.</dd></dl>'
    + '<dl><dt>제13조(홈페이지 저작권)</dt>'
      + '<dd>① 당 사이트가 게시한 본 홈페이지의 모든 콘텐트에 대한 저작권은 당 사이트에 있습니다. 다만, 게시물의 원저작자가 별도로 있는 경우 그 출처를 명시하며 해당 게시물의 저작권은 원저작자에게 있습니다.</dd>'
      + '<dd>② 신청자가 직접 게시한 저작물의 저작권은 신청자에게 있습니다. 다만, 신청자는 당 사이트에 무료로 이용할 수 있는 권리를 허락한 것으로 봅니다.</dd>'
      + '<dd>③ 당 사이트 소유의 콘텐트에 대하여 제3자가 허락 없이 다른 홈페이지에 사용 또는 인용하는 것을 금지합니다.</dd></dl>'
    + '<b>제5장 계약 해지 및 이용 제한</b>'
    + '<dl><dt>제14조(계약 해지)</dt><dd>신청자는 이용계약을 해지하고자 하는 때에는 전기자동차 구매보조금 지급시스템의 [회원정보관리]→[신청자탈퇴] 메뉴를 이용해 직접 해지해야 합니다.</dd></dl>'
    + '<dl><dt>제15조(서비스 이용제한)</dt>'
      + '<dd>① 당 사이트는 회원이 서비스 이용내용에 있어서 본 약관 제 11조 내용을 위반하거나, 다음 각 호에 해당하는 경우 서비스 이용을 제한할 수 있습니다.<br>- 2년 이상 서비스를 이용한 적이 없는 경우<br>- 기타 정상적인 서비스 운영에 방해가 될 경우</dd>'
      + '<dd>② 상기 이용제한 규정에 따라 서비스를 이용하는 신청자에게 서비스 이용에 대하여 별도 공지 없이 서비스 이용의 일시정지, 이용계약 해지할 수 있습니다.</dd></dl>'
    + '<dl><dt>제16조(전자우편주소 수집 금지)</dt><dd>신청자는 전자우편주소 추출기 등을 이용하여 전자우편주소를 수집 또는 제3자에게 제공할 수 없습니다.</dd></dl>'
    + '<b>제6장 손해배상 및 기타사항</b>'
    + '<dl><dt>제17조(손해배상)</dt><dd>당 사이트는 무료로 제공되는 서비스와 관련하여 신청자에게 어떠한 손해가 발생하더라도 당 사이트가 고의로 인한 손해발생을 제외하고는 이에 대하여 책임을 부담하지 아니합니다.</dd></dl>'
    + '<dl><dt>제18조(관할 법원)</dt><dd>서비스 이용으로 발생한 분쟁에 대해 소송이 제기되는 경우 민사 소송법상의 관할 법원에 제기합니다.</dd></dl>'
    + '<dl><dt>부칙</dt><dd>1. (시행일) 이 약관은 2019년 1월 1일부터 적용되며, 추후 약관 개정시 개정된 약관의 적용일 이전 정보수집자도 개정된 약관의 적용을 받습니다.</dd></dl>';

  // ── 개인정보 수집·이용 안내 (5항목, verbatim + 교정: 통신정보 중복 통합) ──
  var PRIVACY_HTML =
      '<dl><dt>1. 정보의 수집·이용 목적</dt><dd>전기자동차 구매보조금 지급시스템의 보조금을 신청하려는 신청인 및 신청기업에 대한 정보를 「대기환경보전법 시행령 제66조」에 따라 수집 및 이용하고자 합니다.</dd></dl>'
    + '<dl><dt>2. 수집하려는 개인정보의 항목</dt><dt>· 필수항목</dt>'
      + '<dd>▶ 일반정보 : 이름</dd>'
      + '<dd>▶ 통신정보 : 휴대폰번호, 전자우편</dd>'
      + '<dd>▶ 은행정보 : 은행명, 계좌번호, 예금주</dd>'
      + '<dd>▶ 기업정보 : 법인명, 법인번호, 사업자번호</dd></dl>'
    + '<dl><dt>3. 정보의 보유 및 이용기간</dt>'
      + '<dd>전기자동차 구매보조금 지급 관련 정보는 등록일로부터 5년간 보유·이용 후 폐기합니다.</dd>'
      + '<dd>※ 개인정보 제공자는 개인정보 제공 및 동의를 거부할 권리가 있으나, 위 항목 동의 거부시 전기자동차 구매보조금 시스템 이용을 위한 추가 증빙서류를 제출하여야 할 수 있습니다.</dd>'
      + '<dd>서비스 이용과정에서 아래와 같은 정보들이 자동으로 생성되어 수집될 수 있습니다.</dd>'
      + '<dd>- IP Address, 쿠키, 방문 일시, 서비스 이용 기록, 불량 이용 기록</dd></dl>'
    + '<dl><dt>4. 개인정보의 수집 및 이용 목적</dt><dd>전기자동차 구매 보조금 지원 관련 전산기록의 효율적인 처리, 보존 및 제공</dd></dl>'
    + '<dl><dt>5. 개인정보의 보유 기한</dt>'
      + '<dd>가. 전기자동차 구매 보조금 지원 관련 인계·인수 등의 전산기록</dd>'
      + '<dd>- 보존 근거 : (전기자동차 구매보조금 인계·인수 내용 등의 전산 처리)</dd>'
      + '<dd>- 보존 기간 : 5년</dd>'
      + '<dd>나. 서비스 이용기록, 접속 로그, 접속 IP 정보</dd>'
      + '<dd>- 보존 근거 : 통신비밀보호법</dd>'
      + '<dd>- 보존 기간 : 3개월</dd>'
      + '<dd>다. 본인확인에 관한 기록</dd>'
      + '<dd>- 보존 근거 : 정보통신망 이용촉진 및 정보보호 등에 관한 법률</dd>'
      + '<dd>- 보존 기간 : 6개월</dd></dl>';

  function build(mount) {
    var form = mount.closest('form');
    // 진입 체크
    var entry = d.createElement('div');
    entry.className = 'bzt-entry';
    entry.innerHTML =
      '<label class="bzt-entry-label"><input type="checkbox" id="bztMainChk" disabled>'
      + '<span>무공해차 구매보조금 지원시스템 약관 확인 <span class="bzt-nece">[필수]</span></span></label>'
      + '<button type="button" class="bzt-open btn btn-secondary btn-sm">약관 보기</button>';
    mount.appendChild(entry);

    // 팝업
    var pop = d.createElement('div');
    pop.className = 'bzt-pop';
    pop.setAttribute('hidden', '');
    pop.innerHTML =
      '<div class="bzt-dim" data-bzt-close></div>'
      + '<div class="bzt-panel" role="dialog" aria-modal="true" aria-labelledby="bztTitle">'
        + '<div class="bzt-head"><h4 id="bztTitle">회원가입 약관</h4>'
          + '<button type="button" class="bzt-x" data-bzt-close aria-label="닫기">✕</button></div>'
        + '<div class="bzt-body">'
          + '<div class="bzt-sec"><h5>이용약관</h5><div class="bzt-doc" tabindex="0">' + TERMS_HTML + '</div>'
            + '<label class="bzt-agree"><input type="checkbox" id="bztTerms"> 이용약관에 동의합니다. <span class="bzt-req">(필수약관)</span></label></div>'
          + '<div class="bzt-sec"><h5>개인정보 수집 및 이용에 관한 안내</h5><div class="bzt-doc" tabindex="0">' + PRIVACY_HTML + '</div>'
            + '<label class="bzt-agree"><input type="checkbox" id="bztPrivacy"> 개인정보수집 및 이용에 관한 안내에 동의합니다. <span class="bzt-req">(필수약관)</span></label></div>'
          + '<label class="bzt-all"><input type="checkbox" id="bztAll"> 모든 개인정보 수집 및 이용에 동의합니다.</label>'
          + '<p class="bzt-info">전기자동차 구매보조금 지원시스템의 이용약관 및 개인정보 보호정책의 내용에 대하여 동의를 하시면 개인정보 수집에 동의한 것으로 간주하오니 원치 않으실 경우 동의하지 않음을 선택해 주시기 바랍니다.</p>'
          + '<div class="bzt-age"><span>만14세 확인</span>'
            + '<label><input type="radio" name="bztAge" value="over" checked> 만14세 이상 가입</label>'
            + '<label><input type="radio" name="bztAge" value="under"> 만14세 미만 가입</label></div>'
        + '</div>'
        + '<div class="bzt-foot"><button type="button" class="btn btn-secondary" data-bzt-close>취소</button>'
          + '<button type="button" class="btn btn-primary" id="bztConfirm" disabled>동의하고 확인</button></div>'
      + '</div>';
    d.body.appendChild(pop);

    var mainChk = entry.querySelector('#bztMainChk');
    var cTerms = pop.querySelector('#bztTerms');
    var cPriv = pop.querySelector('#bztPrivacy');
    var cAll = pop.querySelector('#bztAll');
    var confirmBtn = pop.querySelector('#bztConfirm');
    var agreed = false;

    function bothReq() { return cTerms.checked && cPriv.checked; }
    function syncConfirm() { confirmBtn.disabled = !bothReq(); if (cAll) cAll.checked = bothReq(); }
    function open() { pop.hidden = false; d.body.style.overflow = 'hidden'; setTimeout(function () { pop.querySelector('.bzt-doc').focus(); }, 30); }
    function close() { pop.hidden = true; d.body.style.overflow = ''; }

    entry.querySelector('.bzt-open').addEventListener('click', open);
    entry.querySelector('.bzt-entry-label').addEventListener('click', function (e) { e.preventDefault(); open(); });
    pop.querySelectorAll('[data-bzt-close]').forEach(function (b) { b.addEventListener('click', close); });
    pop.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
    cTerms.addEventListener('change', syncConfirm);
    cPriv.addEventListener('change', syncConfirm);
    if (cAll) cAll.addEventListener('change', function () { cTerms.checked = cPriv.checked = cAll.checked; syncConfirm(); });
    confirmBtn.addEventListener('click', function () {
      if (!bothReq()) return;
      agreed = true; mainChk.checked = true; close();
      if (w.__toast) w.__toast('약관에 동의하셨습니다.', 'success');
    });

    // 폼 submit 시 동의 필수 — 캡처 단계에서 선검증(폼 자체 핸들러보다 먼저)
    if (form) {
      form.addEventListener('submit', function (e) {
        if (!agreed) {
          e.preventDefault();
          if (e.stopImmediatePropagation) e.stopImmediatePropagation();
          if (w.__toast) w.__toast('무공해차 구매보조금 지원시스템 약관에 동의해 주세요.', 'warning');
          open();
        }
      }, true);
    }
  }

  function init() {
    var mounts = d.querySelectorAll('[data-biz-terms]');
    for (var i = 0; i < mounts.length; i++) build(mounts[i]);
  }
  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', init);
  else init();
})(window, document);
