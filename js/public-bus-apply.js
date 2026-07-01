/* =========================================================
   public-bus-apply.js — 전기승합차 공모 신청 화면 로직
   - 탭 이동 (개요 / 상세 / 신청서 / 조회)
   - 신청서 5단계 스텝퍼 + 검증 + 요약
   - 차량 행 추가/삭제 + 예상 지원금 자동 계산
   - 업로드 리스트 UI
   - 신청 조회 (접수번호/사업자번호)
   ========================================================= */
(function () {
  'use strict';

  const $ = (s) => document.querySelector(s);
  const $$ = (s) => document.querySelectorAll(s);

  // ---------- 탭 이동 (data-goto-tab 속성 지원) ----------
  $$('[data-goto-tab]').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.gotoTab;
      const tab = document.querySelector(`#mainTabs .tab[data-tab="${target}"]`);
      if (tab) {
        tab.click();
        // 탭 영역으로 스크롤
        const tabNav = document.querySelector('.tab-nav');
        if (tabNav) window.scrollTo({ top: tabNav.offsetTop - 100, behavior: 'smooth' });
      }
    });
  });

  // ---------- 앵커 스크롤 & active 표시 (상세 내용) ----------
  const anchorLinks = $$('.anchor-list a');
  anchorLinks.forEach(a => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      const id = a.getAttribute('href').slice(1);
      const target = document.getElementById(id);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        anchorLinks.forEach(l => l.classList.remove('active'));
        a.classList.add('active');
      }
    });
  });

  // ---------- 신청서 스텝퍼 로직 ----------
  const applyForm = $('#applyForm');
  let currentStep = 1;
  const totalSteps = 5;

  const btnPrev = $('#btnPrev');
  const btnNext = $('#btnNext');
  const btnSubmit = $('#btnSubmit');
  const stepEls = $$('.apply-step');
  const panels = $$('.apply-panel');

  function showStep(n) {
    currentStep = n;
    stepEls.forEach(el => {
      const s = parseInt(el.dataset.step, 10);
      el.classList.toggle('active', s === n);
      el.classList.toggle('done', s < n);
    });
    panels.forEach(p => {
      const s = parseInt(p.dataset.stepPanel, 10);
      p.style.display = s === n ? '' : 'none';
    });

    btnPrev.disabled = (n === 1);
    btnNext.style.display = (n === totalSteps) ? 'none' : '';
    btnSubmit.style.display = (n === totalSteps) ? '' : 'none';

    if (n === totalSteps) buildSummary();
    if (n === 4) renderUploadList();

    // 스크롤 상단으로
    const wrap = $('.apply-wrap');
    if (wrap) wrap.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function validateStep(n) {
    const panel = document.querySelector(`[data-step-panel="${n}"]`);
    if (!panel) return true;
    let valid = true;
    panel.querySelectorAll('[required]').forEach(f => {
      if (!f.value || !f.value.trim()) {
        valid = false;
        f.classList.add('error');
        f.addEventListener('input', () => f.classList.remove('error'), { once: true });
      }
    });
    if (n === 5) {
      // 필수 동의 4건
      ['agree1','agree2','agree3','agree4'].forEach(name => {
        const cb = panel.querySelector(`[name="${name}"]`);
        if (cb && !cb.checked) valid = false;
      });
    }
    return valid;
  }

  btnPrev?.addEventListener('click', () => {
    if (currentStep > 1) showStep(currentStep - 1);
  });
  btnNext?.addEventListener('click', () => {
    if (!validateStep(currentStep)) {
      if (window.__toast) window.__toast('필수 입력 항목을 확인해 주세요.', 'error');
      return;
    }
    if (currentStep < totalSteps) {
      showStep(currentStep + 1);
      if (currentStep === 2) updateExpectedSupport();
    }
  });

  applyForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!validateStep(currentStep)) {
      if (window.__toast) window.__toast('모든 필수 동의에 체크해 주세요.', 'error');
      return;
    }
    // 제출
    btnSubmit.classList.add('btn-loading');
    btnSubmit.setAttribute('disabled', '');
    const orig = btnSubmit.innerHTML;
    btnSubmit.innerHTML = '<span class="spinner"></span> 제출 중...';
    setTimeout(() => {
      btnSubmit.classList.remove('btn-loading');
      btnSubmit.removeAttribute('disabled');
      btnSubmit.innerHTML = orig;
      // 접수번호 발급
      const receiptNo = '2026-EV-BUS-' + Math.floor(100000 + Math.random() * 900000);
      $('#newReceiptNo').textContent = receiptNo;
      if (window.__openModal) window.__openModal('submitSuccessModal');
    }, 1100);
  });

  // ---------- 차량 행 추가/삭제 ----------
  const vehicleRows = $('#vehicleRows');
  const btnAddVehicle = $('#addVehicleRow');
  let vehicleRowCount = 1;

  function vehicleRowHTML(n) {
    return `
      <div class="vehicle-row" data-row="${n}">
        <div class="vr-head">
          <strong>차량 #${n}</strong>
          <button type="button" class="btn btn-ghost btn-sm" data-remove-vehicle>삭제</button>
        </div>
        <div class="form-grid">
          <div class="form-group">
            <label class="form-label">규격 <span class="required">*</span></label>
            <select class="form-select" name="v_size" required>
              <option value="">선택</option>
              <option value="large">대형 (11m 이상)</option>
              <option value="medium">중형 (9~11m)</option>
              <option value="small">소형 (6~9m)</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">제조사 <span class="required">*</span></label>
            <select class="form-select" name="v_maker" required>
              <option value="">선택</option><option>현대자동차</option><option>기아</option>
              <option>에디슨모터스</option><option>자일대우</option><option>BYD</option>
              <option>우진산전</option><option>기타</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">모델명 <span class="required">*</span></label>
            <input type="text" class="form-input" name="v_model" required>
          </div>
          <div class="form-group">
            <label class="form-label">신청 대수 <span class="required">*</span></label>
            <input type="number" class="form-input" name="v_count" min="1" max="100" value="1" required>
          </div>
          <div class="form-group">
            <label class="form-label">예상 판매가 (대당)</label>
            <input type="text" class="form-input" name="v_price" placeholder="만원 단위">
          </div>
          <div class="form-group">
            <label class="form-label">출고 희망시기 <span class="required">*</span></label>
            <select class="form-select" name="v_delivery" required>
              <option value="">선택</option>
              <option>2026년 상반기</option>
              <option>2026년 하반기</option>
              <option>2027년 상반기</option>
            </select>
          </div>
        </div>
      </div>
    `;
  }

  btnAddVehicle?.addEventListener('click', () => {
    if (vehicleRowCount >= 10) {
      if (window.__toast) window.__toast('차량 행은 최대 10개까지 추가할 수 있습니다.', 'info');
      return;
    }
    vehicleRowCount++;
    vehicleRows.insertAdjacentHTML('beforeend', vehicleRowHTML(vehicleRowCount));
    updateExpectedSupport();
  });

  // 차량 행 내부의 삭제 버튼 (event delegation)
  vehicleRows?.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-remove-vehicle]');
    if (!btn) return;
    const rows = vehicleRows.querySelectorAll('.vehicle-row');
    if (rows.length <= 1) {
      if (window.__toast) window.__toast('최소 1개 차량 행은 유지해야 합니다.', 'info');
      return;
    }
    const row = btn.closest('.vehicle-row');
    if (row) row.remove();
    // 번호 재정렬
    vehicleRows.querySelectorAll('.vehicle-row').forEach((r, i) => {
      const head = r.querySelector('.vr-head strong');
      if (head) head.textContent = '차량 #' + (i + 1);
    });
    updateExpectedSupport();
  });

  // 예상 지원금 계산
  const AMOUNT_MAP = { large: 7000, medium: 5000, small: 2000 };
  function updateExpectedSupport() {
    let total = 0;
    vehicleRows?.querySelectorAll('.vehicle-row').forEach(r => {
      const size = r.querySelector('[name="v_size"]')?.value;
      const count = parseInt(r.querySelector('[name="v_count"]')?.value || 0, 10);
      if (size && AMOUNT_MAP[size] && count > 0) {
        total += AMOUNT_MAP[size] * count;
      }
    });
    const el = $('#expectedSupport');
    if (el) el.innerHTML = total.toLocaleString('ko-KR') + '<span style="font-size:14px;color:var(--text-secondary);"> 만원</span>';
  }
  vehicleRows?.addEventListener('input', updateExpectedSupport);
  vehicleRows?.addEventListener('change', updateExpectedSupport);

  // ---------- 업로드 리스트 렌더 ----------
  const REQUIRED_FILES = [
    { id: 1, name: '공모 신청서 (별지 제1호)', req: true },
    { id: 2, name: '사업계획서 (별지 제2호)', req: true },
    { id: 3, name: '사업자등록증 사본', req: true },
    { id: 4, name: '운수사업 허가증 사본', req: true },
    { id: 5, name: '차량 구매(예정)계약서 또는 견적서', req: true },
    { id: 6, name: '충전 인프라 구축 계획서', req: true },
    { id: 7, name: '최근 3년 재무제표', req: true },
    { id: 8, name: '노선 운영 실적 또는 계획서', req: false },
    { id: 9, name: 'K-EV100 참여 확인서', req: false },
    { id: 10, name: '개인정보 수집·이용 동의서', req: true },
  ];
  const uploadState = {};

  function renderUploadList() {
    const list = $('#uploadList');
    if (!list) return;
    list.innerHTML = REQUIRED_FILES.map(f => {
      const u = uploadState[f.id];
      return `
        <div class="upload-row ${u ? 'uploaded' : ''}" data-file-id="${f.id}">
          <div class="u-num">${f.id}</div>
          <div class="u-info">
            <strong>${f.name} ${f.req ? '<span style="color:var(--color-danger);">*</span>' : ''}</strong>
            <span>${f.req ? '필수 제출' : '선택 제출'}</span>
            ${u ? `<span class="u-filename">${u}</span>` : ''}
          </div>
          <div class="u-state">${u ? '✓ 업로드 완료' : (f.req ? '미제출' : '선택')}</div>
          <div class="u-file">
            <label class="btn btn-sm ${u ? 'btn-ghost' : 'btn-secondary'}" style="cursor:pointer;">
              <input type="file" hidden data-file-upload="${f.id}">
              ${u ? '재업로드' : '파일 선택'}
            </label>
            ${u ? `<button type="button" class="btn btn-ghost btn-sm" data-file-remove="${f.id}">삭제</button>` : ''}
          </div>
        </div>
      `;
    }).join('');

    // file input handlers
    list.querySelectorAll('[data-file-upload]').forEach(input => {
      input.addEventListener('change', (e) => {
        const id = parseInt(input.dataset.fileUpload, 10);
        const file = input.files?.[0];
        if (!file) return;
        // 크기 체크 (20MB)
        if (file.size > 20 * 1024 * 1024) {
          if (window.__toast) window.__toast('파일 크기는 20MB를 초과할 수 없습니다.', 'error');
          return;
        }
        uploadState[id] = file.name + ' (' + (file.size/1024/1024).toFixed(2) + 'MB)';
        renderUploadList();
        if (window.__toast) window.__toast('"' + file.name + '" 업로드되었습니다.', 'success');
      });
    });
    list.querySelectorAll('[data-file-remove]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.dataset.fileRemove, 10);
        delete uploadState[id];
        renderUploadList();
      });
    });
  }

  // ---------- 5단계 요약 빌드 ----------
  function buildSummary() {
    const fd = new FormData(applyForm);
    const get = (k) => fd.get(k) || '-';
    const vehicles = [];
    vehicleRows?.querySelectorAll('.vehicle-row').forEach(r => {
      const size = r.querySelector('[name="v_size"]')?.value || '';
      const sizeLabel = { large: '대형', medium: '중형', small: '소형' }[size] || '-';
      const maker = r.querySelector('[name="v_maker"]')?.value || '-';
      const model = r.querySelector('[name="v_model"]')?.value || '-';
      const count = r.querySelector('[name="v_count"]')?.value || '-';
      vehicles.push(`${sizeLabel} ${model} (${maker}) × ${count}대`);
    });
    const uploaded = Object.keys(uploadState).length;
    const totalRequired = REQUIRED_FILES.filter(f => f.req).length;

    const el = $('#summaryContent');
    if (el) {
      el.innerHTML = `
        <table class="info-table">
          <tbody>
            <tr><th>사업자명</th><td><strong>${get('companyName')}</strong> (${get('bizNo')})</td></tr>
            <tr><th>대표자</th><td>${get('ceo')}</td></tr>
            <tr><th>담당자</th><td>${get('managerName')} · ☎ ${get('managerPhone')} · ✉ ${get('managerEmail')}</td></tr>
            <tr><th>신청 차량</th><td>${vehicles.length ? vehicles.join('<br>') : '-'}</td></tr>
            <tr><th>운행 유형</th><td>${get('routeType')} · ${get('routeArea')}</td></tr>
            <tr><th>충전 인프라</th><td>완속 ${get('slowCount')}기 / 급속 ${get('fastCount')}기</td></tr>
            <tr><th>첨부파일</th><td>${uploaded}/${totalRequired + (REQUIRED_FILES.length - totalRequired)}개 업로드 · 필수 ${Object.keys(uploadState).filter(id => REQUIRED_FILES.find(f => f.id === parseInt(id))?.req).length}/${totalRequired}</td></tr>
          </tbody>
        </table>
      `;
    }
  }

  // ---------- 신청 조회 ----------
  const inqLabel = $('#inquiryLabel');
  const inqQuery = $('#inquiryQuery');
  const inqBizNo = $('#inquiryBizNo');
  const inqForm = $('#inquiryForm');
  const inqResult = $('#inquiryResult');
  const inqBtn = $('#btnInquiry');

  // 조회 결과 기본 숨김
  if (inqResult) inqResult.classList.remove('show');

  $('[data-inquiry-method]')?.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('[data-inquiry-method] button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const m = btn.dataset.method;
      if (m === 'receiptNo') {
        inqLabel.innerHTML = '접수번호 <span class="required">*</span>';
        inqQuery.placeholder = '예) 2026-EV-BUS-001234';
      } else {
        inqLabel.innerHTML = '사업자등록번호 <span class="required">*</span>';
        inqQuery.placeholder = '000-00-00000';
      }
    });
  });

  inqForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!inqQuery.value.trim()) {
      if (window.__toast) window.__toast('조회 조건을 입력해 주세요.', 'error');
      return;
    }
    inqBtn.classList.add('btn-loading');
    inqBtn.setAttribute('disabled', '');
    const orig = inqBtn.innerHTML;
    inqBtn.innerHTML = '<span class="spinner"></span> 조회 중...';
    setTimeout(() => {
      inqBtn.classList.remove('btn-loading');
      inqBtn.removeAttribute('disabled');
      inqBtn.innerHTML = orig;
      if (inqResult) {
        inqResult.classList.add('show');
        inqResult.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      if (window.__toast) window.__toast('조회가 완료되었습니다. 심사 진행 중입니다.', 'success');
    }, 900);
  });

  // ---------- 제출 완료 모달 → 조회 탭 이동 ----------
  $('[data-goto-inquiry]')?.addEventListener('click', () => {
    // 모달 닫기
    document.querySelectorAll('.modal.show').forEach(m => {
      m.classList.remove('show');
      m.setAttribute('aria-hidden', 'true');
    });
    document.querySelectorAll('.modal-backdrop.show').forEach(b => b.classList.remove('show'));
    document.body.style.overflow = '';
    // 조회 탭으로
    const inqTab = document.querySelector('#mainTabs .tab[data-tab="inquiry"]');
    if (inqTab) inqTab.click();
    // 접수번호 입력
    const receiptNo = $('#newReceiptNo')?.textContent || '';
    if (inqQuery) inqQuery.value = receiptNo;
    // 자동 조회 실행
    setTimeout(() => inqForm?.dispatchEvent(new Event('submit')), 300);
  });

  // ---------- URL hash로 초기 탭 결정 ----------
  function initFromHash() {
    const hash = (location.hash || '').replace('#', '');
    if (!hash) return;
    const tab = document.querySelector(`#mainTabs .tab[data-tab="${hash}"]`);
    if (tab) {
      tab.click();
      setTimeout(() => {
        const tabNav = document.querySelector('.tab-nav');
        if (tabNav) window.scrollTo({ top: tabNav.offsetTop - 100, behavior: 'smooth' });
      }, 100);
    }
  }

  // ---------- 초기 렌더 ----------
  if ($('#uploadList')) renderUploadList();
  updateExpectedSupport();
  initFromHash();
  window.addEventListener('hashchange', initFromHash);

})();
