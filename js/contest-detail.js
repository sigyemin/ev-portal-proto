/* contest-detail.js — 공모 신청 "상세" 공통 스켈레톤 렌더러 (8개 status 공유)
   ── 각 status 페이지: ContestDetail.mount({ applyHref, applyName, apps:[...] })
      ① 내 신청건 목록 ② 건 선택/`?appId=` 진입 시 공통 상세 뷰.
   ── 사업별로 다른 부분은 블록 #4(app.block4)뿐. 나머지 전부 공통.
      현재상태는 사업 고유 텍스트 그대로(정규화 금지). 결과배지만 공통 4종. */
window.ContestDetail = (function () {
  'use strict';
  var RESULT = { progress:['진행중','r-progress'], selected:['선정','r-selected'], rejected:['미선정','r-rejected'], done:['완료','r-done'] };
  function esc(s){ return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }
  function badge(res){ var r=RESULT[res]||RESULT.progress; return '<span class="cd-badge '+r[1]+'">'+r[0]+'</span>'; }
  function dl(pairs){ return '<div class="cd-dl'+(pairs.length<=3?' ':' ')+'">'+pairs.map(function(p){ return '<dl><dt>'+esc(p[0])+'</dt><dd>'+p[1]+'</dd></dl>'; }).join('')+'</div>'; }

  /* ★ 절대 원칙 : 상세조회의 '신청 정보'·'제출 서류'는 해당 신청(apply) 페이지의 섹션·항목·라벨·순서를
     1:1 미러한다. 항목 추가/삭제/개명/통합/재구성 금지. 각 페이지 데이터는 apply 소스에서 추출할 것.
     제출 서류 행 = apply의 '업로드 필드' 단위(ZIP 묶음이면 1행). 개별 하위 증빙 나열 금지 → note 안내 텍스트로만. */
  /* 제출서류 3종 상태 배지 · 제출 파일 링크(mock) · 조건부 파일선택 · tag/ext/note = apply 라벨 미러 */
  var DOC_BADGE = { done:['제출완료','cd-doc-ok'], supplement:['보완요청','cd-doc-supp'], missing:['미제출','cd-doc-no'] };
  function docStatus(d){ if(d.status) return d.status; return d.ok ? 'done' : 'missing'; } // legacy {ok} 호환
  function docFileName(n, ext){
    var e = (String(ext||'').match(/HWP|ZIP|PDF|XLSX?|DOCX?/i)||['PDF'])[0].toLowerCase();
    return String(n).replace(/^\[[^\]]*\]\s*/,'').replace(/\([^)]*\)/g,'').replace(/\s*(증빙|사본|서식)\s*$/,'').replace(/[\/·]/g,' ').trim().replace(/\s+/g,'_')+'.'+e;
  }
  var _docSeq;
  function docRowHTML(d){
    var stt = docStatus(d), bd = DOC_BADGE[stt]||DOC_BADGE.missing, idx = _docSeq++;
    // 제출완료·보완요청 → 제출 파일명 노출(없으면 서류명에서 목업 파일명 생성) · 미제출 → 파일 없음
    var fname = d.file || (stt==='missing' ? '' : docFileName(d.name, d.ext));
    var fileCell = fname
      ? '<a href="#" class="cd-file-link" data-file="'+esc(fname)+'" onclick="return false;" title="다운로드(mock)">'+esc(fname)+'</a>'
      : '<span class="cd-file-none">—</span>';
    var pick = (stt==='done')
      ? '<span class="cd-file-none">—</span>'
      : '<span class="cd-pick" data-doc="'+idx+'">'
        + '<input type="file" id="cddoc-'+idx+'" class="cd-pick-input" aria-label="'+esc(d.name)+' 파일 선택">'
        + '<label for="cddoc-'+idx+'" class="cd-pick-btn">파일선택</label>'
        + '<span class="cd-pick-file" aria-live="polite" hidden></span>'
        + '<button type="button" class="cd-pick-del" hidden aria-label="선택 취소">×</button>'
        + '</span>';
    // 구비서류 셀 = apply 업로드 라벨 미러 : [tag] 서류명 (ext) + note(하위 증빙 안내, 개별 행 아님)
    var nameCell = (d.tag?'<span class="cd-doc-tag">'+esc(d.tag)+'</span> ':'') + esc(d.name)
      + (d.ext?' <span class="cd-doc-ext">'+esc(d.ext)+'</span>':'')
      + (d.note?'<div class="cd-doc-note">'+esc(d.note)+'</div>':'');
    return '<tr class="cd-doc-row'+(stt==='supplement'?' cd-reject':'')+'" data-doc-row="'+idx+'" data-status="'+stt+'">'
      + '<td>'+nameCell+'</td>'
      + '<td>'+fileCell+'</td>'
      + '<td style="text-align:center;"><span class="'+bd[1]+'">'+bd[0]+'</span></td>'
      + '<td style="text-align:center;">'+pick+'</td></tr>';
  }
  function docsTable(list){
    return '<table class="cd-tbl cd-doc-tbl"><thead><tr>'
      + '<th>구비서류</th><th>제출 파일</th>'
      + '<th style="text-align:center;width:96px;">제출상태</th><th style="text-align:center;width:120px;">파일선택</th>'
      + '</tr></thead><tbody>'+list.map(docRowHTML).join('')+'</tbody></table>';
  }

  var cfg, root;

  function findApp(id){ for(var i=0;i<cfg.apps.length;i++) if(cfg.apps[i].appId===id) return cfg.apps[i]; return null; }

  /* ── 목록 뷰 ── */
  function renderList(){
    var rows = cfg.apps.map(function(a){
      return '<tr class="cd-row" data-id="'+esc(a.appId)+'" tabindex="0">'
        + '<td class="no">'+esc(a.appId)+'</td>'
        + '<td class="l">'+esc(a.project)+'</td>'
        + '<td>'+esc(a.applyDate)+'</td>'
        + '<td><span class="cd-status-txt">'+esc(a.status)+'</span></td>'
        + '</tr>';
    }).join('');
    root.innerHTML =
      '<p class="cd-list-meta">내 신청 <strong>'+cfg.apps.length+'</strong>건 · 행을 클릭하면 신청 건 상세로 이동합니다.</p>'
      + '<div class="table-wrap"><table class="cd-list-table"><thead><tr>'
      + '<th>신청번호</th><th>사업명</th><th>신청일</th><th>현재 상태</th>'
      + '</tr></thead><tbody>'+ (rows || '<tr><td colspan="4" class="cd-empty">신청 내역이 없습니다.</td></tr>') +'</tbody></table></div>'
      + (cfg.applyHref ? '<div class="alert alert-info mt-6"><div class="alert-icon"></div><div class="alert-body"><strong>안내</strong> 본 화면은 신청 진행상태 조회용입니다. 신규 신청은 <a href="'+esc(cfg.applyHref)+'" style="color:var(--color-secondary-700,#1f5fa8);font-weight:600;">'+esc(cfg.applyName||'공모 신청')+'</a> 페이지를 이용하세요.</div></div>' : '');
    Array.prototype.forEach.call(root.querySelectorAll('.cd-row'), function(tr){
      tr.addEventListener('click', function(){ go(tr.dataset.id); });
      tr.addEventListener('keydown', function(e){ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); go(tr.dataset.id); } });
    });
  }

  /* ── 상세 뷰 ── */
  function renderDetail(a){
    _docSeq = 0; _blk = 1;
    var r = RESULT[a.result]||RESULT.progress;
    var h = '';
    h += '<button type="button" class="cd-back" id="cdBack"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg> 신청 목록으로</button>';

    // 1. 식별 헤더 — 결과(진행중/완료) 배지 삭제 · 현재 상태는 하단 메타에 표기. app.badges(2축 심사·선정 명시 배지)만 있으면 유지
    var idBadges = (a.badges && a.badges.length)
      ? a.badges.map(function(b){ var t=RESULT[b.tone]||RESULT.progress; return '<span class="cd-badge '+t[1]+'">'+esc(b.text)+'</span>'; }).join(' ')
      : '';
    h += '<div class="cd-idhead"><div class="cd-idtop"><h2>'+esc(a.project)+'</h2>'+idBadges+'</div>'
      + '<div class="cd-idmeta"><span>신청번호 <span class="no">'+esc(a.appId)+'</span></span><span>신청일 '+esc(a.applyDate)+'</span><span>현재 상태 <span class="st">'+esc(a.status)+'</span></span></div></div>';

    // 2. 공고 정보
    // TODO(실연동): 공고명(name)·지원규모(scale)·선정발표(announce)는 공고 마스터의 실제 컬럼으로 매핑 필요(현재 mock 표기).
    var nt = a.notice||{};
    var b2rows = [
      ['공고명', esc(nt.name)],['공고번호','<span style="font-family:var(--font-mono,monospace);">'+esc(nt.no)+'</span>'],
      ['사업수행기관', esc(nt.org)],['접수기간', esc(nt.period)],
      ['선정발표(예정)', esc(nt.announce)],['지원규모', esc(nt.scale)]
    ];
    if (nt.contact) b2rows.push(['문의처', esc(nt.contact)]);   // 문의처는 공고에 있을 때만
    h += block(2,'공고 정보', dl(b2rows));

    // 3. 신청자(수행기관) 정보
    var ap = a.applicant||{};
    // app.applicant.rows 있으면 기관 정보 커스텀 표(없으면 기존 5행 하위호환)
    var appHtml = (ap.rows && ap.rows.length)
      ? dl(ap.rows)
      : dl([['기관·업체명', esc(ap.org)],['대표자', esc(ap.rep)],['사업자번호', esc(ap.bizNo)],['담당자', esc(ap.manager)],['연락처', esc(ap.tel)]]);
    if (ap.contactRows && ap.contactRows.length){   // 담당자 (성명·부서·직위·이메일 등)
      appHtml += '<h4 style="font-size:13px;font-weight:800;margin:14px 0 8px;color:var(--text-secondary);">담당자</h4>' + dl(ap.contactRows);
    }
    if (ap.consortium && ap.consortium.length){
      var hasShare = ap.consortium.some(function(m){ return m.share != null && m.share !== ''; });   // 출자비율 있으면 컬럼 노출
      appHtml += '<h4 style="font-size:13px;font-weight:800;margin:14px 0 8px;color:var(--text-secondary);">컨소시엄 구성</h4>'
        + '<table class="cd-tbl"><thead><tr><th>구성원</th><th>역할</th>' + (hasShare ? '<th>출자비율</th>' : '') + '</tr></thead><tbody>'
        + ap.consortium.map(function(m){ return '<tr><td>'+esc(m.name)+'</td><td>'+esc(m.role)+'</td>' + (hasShare ? '<td>'+esc(m.share||'—')+'</td>' : '') + '</tr>'; }).join('')
        + '</tbody></table>';
    }
    h += block(3, ap.title || '신청자(수행기관) 정보', appHtml);   // 제목 override 가능(없으면 기존)

    // 4. ⟨사업별⟩ 신청 내용·대상 (조건부 — block4.rows 있을 때만 · apply에 없는 페이지는 미노출)
    if (a.block4 && a.block4.rows && a.block4.rows.length){
      h += block(4, a.block4.title || '신청 내용 · 대상', dl(a.block4.rows));
    }

    // 4b. ⟨미러⟩ 추가 신청 섹션 — apply 섹션을 그대로(rows=키·값 / table=표 / memo=텍스트). 순서·라벨 apply 소스 기준
    (a.sections||[]).forEach(function(s){
      var inner;
      if (s.table){
        var size = s.table.pageSize || 5;   // 5행까지 노출 · 초과 시 페이지네이션
        var th = '<tr>'+(s.table.head||[]).map(function(x){ return '<th>'+esc(x)+'</th>'; }).join('')+'</tr>';
        var hasRows = s.table.rows && s.table.rows.length;
        var tb = hasRows
          ? s.table.rows.map(function(r,ri){ return '<tr data-r="'+ri+'"'+(ri>=size?' hidden':'')+'>'+r.map(function(c){ return '<td style="text-align:center;">'+esc(c)+'</td>'; }).join('')+'</tr>'; }).join('')
          : '<tr><td colspan="'+((s.table.head||[]).length||1)+'" style="text-align:center;color:var(--text-tertiary);padding:16px;">'+esc(s.table.empty||'해당 없음')+'</td></tr>';
        var pager = (hasRows && s.table.rows.length > size)
          ? '<div class="cd-pager"><button type="button" class="cd-pg-prev" disabled>이전</button><span class="cd-pg-info">1 / '+Math.ceil(s.table.rows.length/size)+'</span><button type="button" class="cd-pg-next">다음</button></div>'
          : '';
        inner = '<div class="cd-sec-table" data-size="'+size+'" data-total="'+(hasRows?s.table.rows.length:0)+'">'
          + '<div class="table-wrap"><table class="cd-tbl" style="font-size:12.5px;"><thead>'+th+'</thead><tbody>'+tb+'</tbody></table></div>'
          + pager + '</div>';
      } else if (s.memo!=null){
        inner = '<div style="white-space:pre-wrap;line-height:1.7;color:var(--text-secondary);">'+esc(s.memo)+'</div>';
      } else {
        inner = dl(s.rows||[]);
      }
      h += block(0, s.title, inner);
    });

    // 5. 진행 단계 — app.stages(실코드 스텝퍼) 우선 · 없으면 app.timeline(레거시) · 둘 다 없으면 생략
    if (a.stages && a.stages.length){
      var stg = a.stages.map(function(g, gi){
        var steps = (g.steps||[]).map(function(s){
          var cls = s.state==='current'?'current':(s.state==='done'?'done':'');
          return '<div class="cd-step '+cls+'"><div class="code">'+esc(s.code)+'</div><div class="lab">'+esc(s.label)+'</div></div>';
        }).join('');
        return '<div class="cd-stage-group"><div class="cd-stage-title"><span class="gnum">'+(gi+1)+'</span>'+esc(g.group)+'</div><div class="cd-stepper">'+steps+'</div></div>';
      }).join('');
      h += block(5,'진행 단계', '<div class="cd-stages">'+stg+'</div>');
    } else if (a.timeline && a.timeline.length){
      var tl = a.timeline.map(function(s){
        var cls = s.state==='current'?'current':(s.state==='done'?'done':'');
        return '<li class="'+cls+'"><span class="dot"></span><div class="tl-lab">'+esc(s.label)+'</div><div class="tl-date">'+esc(s.date||'—')+'</div></li>';
      }).join('');
      h += block(5,'진행 단계', '<ul class="cd-timeline">'+tl+'</ul>');
    }

    // 6. 제출 서류 (조건부 — app.docs 있을 때만) · 제출 파일 링크(mock) + 3종 상태 + 보완/미제출 행 파일선택
    if (a.docs && a.docs.length){
      h += block(6,'제출 서류', docsTable(a.docs)
        + '<p class="cd-doc-hint">· 제출 파일명을 누르면 다운로드됩니다(목업). 보완요청·미제출 서류만 파일을 새로 선택해 하단에서 제출할 수 있습니다.</p>');
    }

    // 6c. 항목별 심사 현황 (조건부 — 승인 Y / 반려 N, 반려=보완 대상 강조)
    if (a.review){
      var rv = a.review, rvInner = '';
      if (rv.items && rv.items.length){
        var vrows = rv.items.map(function(it){
          var st = it.ok ? '<span class="cd-doc-ok">승인</span>' : '<span class="cd-doc-no">반려</span>';
          return '<tr'+(it.ok?'':' class="cd-reject"')+'><td>'+esc(it.label)+'</td><td>'+(it.value!=null?esc(it.value):'')+'</td><td style="text-align:center;">'+st+'</td></tr>';
        }).join('');
        rvInner += '<h4 style="font-size:13px;font-weight:800;margin:2px 0 8px;color:var(--text-secondary);">신청 항목 심사</h4>'
          + '<table class="cd-tbl"><thead><tr><th>항목</th><th>내용</th><th style="text-align:center;">심사</th></tr></thead><tbody>'+vrows+'</tbody></table>';
      }
      if (rv.docs && rv.docs.length){
        // 첨부 심사결과를 제출상태로 매핑 : 반려(N) → 보완요청 · 승인(Y) → 제출완료
        var mapped = rv.docs.map(function(d){ return { name:d.name, file:d.file, status:(docStatus(d)==='done'?'done':(d.ok===false?'supplement':docStatus(d))) }; });
        rvInner += '<h4 style="font-size:13px;font-weight:800;margin:16px 0 8px;color:var(--text-secondary);">첨부 서류 심사 ('+rv.docs.length+'종)</h4>'
          + docsTable(mapped);
      }
      if (rv.memo) rvInner += '<div class="alert alert-info" style="margin:14px 0 0;"><div class="alert-icon"></div><div class="alert-body"><strong>담당자 종합 메모</strong><br>'+esc(rv.memo)+'</div></div>';
      h += block(6,'항목별 심사 현황', rvInner);
    }

    // 6b. (삭제됨) 공단 안내(kecoNote) — 전 페이지 렌더 제거

    // 7. 보완요구사항 (조건부) — 지자체/담당자 메모만 (재업로드·제출은 하단 제출서류 표로 일원화)
    if (a.supplement){
      var sp=a.supplement;
      // 보완 본문: 누적 이력(sp.history) 우선 · 없으면 단일 사유(sp.reason)
      var suppBody;
      if (sp.history && sp.history.length){
        suppBody = '<ul style="margin:0 0 4px;padding:0;list-style:none;">' + sp.history.map(function(e){
          return '<li style="padding:5px 0;border-bottom:1px dashed rgba(0,0,0,.10);"><strong style="font-variant-numeric:tabular-nums;">'+esc(e.date)+'</strong> · '+esc(e.type||'')+(e.text?' : '+esc(e.text):'')+'</li>';
        }).join('') + '</ul>';
      } else {
        suppBody = '<div>'+esc(sp.reason)+'</div>';
      }
      if (sp.requester) suppBody += '<div style="margin-top:6px;font-size:13px;color:var(--text-secondary);">보완요청자 : '+esc(sp.requester)+'</div>';
      h += '<div class="cd-callout supp"><h3>'+esc(sp.title||'⚠ 보완요구사항')+'</h3>' + suppBody + '</div>';
    }

    // 7b. 공단 메모(PBLCRP_MEMO) · 사업 메모(BSNS_MEMO) — 각각 별도 표기 (조건부)
    if (a.pbMemo){
      h += '<div class="alert alert-info" style="margin:14px 0;"><div class="alert-icon"></div><div class="alert-body"><strong>공단 메모</strong><br>'+esc(a.pbMemo)+'</div></div>';
    }
    if (a.bizMemo){
      h += '<div class="alert alert-info" style="margin:14px 0;"><div class="alert-icon"></div><div class="alert-body"><strong>사업 메모</strong><br>'+esc(a.bizMemo)+'</div></div>';
    }

    // 8. 심사·선정 결과 (조건부)
    if (a.selection){
      var se=a.selection;
      if (se.selected){
        h += '<div class="cd-callout win"><h3>✓ 선정 결과 : 선정</h3>'
          + '<div>'+dl([['배정 물량', esc(se.volume||'—')],['우선순위', esc(se.rank||'—')]])+'</div>'
          + (se.note?'<div style="margin-top:6px;">'+esc(se.note)+'</div>':'')+'</div>';
      } else {
        h += '<div class="cd-callout lose"><h3>미선정 안내</h3>'
          + '<div>'+esc(se.note||'아쉽게도 이번 공모에서 선정되지 않았습니다. 평가 결과 및 사유는 통보 문서를 확인해 주세요.')+'</div></div>';
      }
    }

    // 9. 협약·교부 (조건부)
    if (a.agreement){
      var ag=a.agreement;
      h += '<div class="cd-callout pact"><h3>협약 · 교부</h3>'
        + '<div>'+dl([['협약(예정)일', esc(ag.date||'—')]])+'</div>'
        + (ag.guide?'<div style="margin-top:6px;">'+esc(ag.guide)+'</div>':'')+'</div>';
    }

    // 10. 최하단 제출 (조건부) — 교체·첨부 가능 서류(보완요청/미제출)가 1건↑일 때만 노출
    var _canSubmit = (a.docs||[]).concat(a.review&&a.review.docs?a.review.docs:[]).some(function(d){ var s=docStatus(d); return s==='supplement'||(d.ok===false)||s==='missing'; });
    if (_canSubmit){
      h += '<div class="cd-submit-bar">'
        + '<p class="cd-submit-hint" id="cdSubmitMsg" role="status" aria-live="polite" hidden></p>'
        + '<button type="button" class="btn btn-primary" id="cdDocSubmit" disabled aria-disabled="true">제출</button>'
        + '</div>';
    }
    // (삭제됨) 문의 · 누리집콜센터 문구 — 하단 콜센터 라인 제거

    // 11. 개발 참고(DEV) 패널 — 상세 뷰에서만 · 기본 접힘 (app.devRef 우선 · 없으면 mount.devRef)
    h += renderDevRef(a.devRef || cfg.devRef);

    root.innerHTML = h;
    var back=document.getElementById('cdBack');
    if(back) back.addEventListener('click', function(){ setHash(''); renderList(); window.scrollTo({top:0,behavior:'smooth'}); });
    wireDocs();
    wireSectionTables();
    void r; // (badge already used)
  }

  /* 섹션 표 페이지네이션 — 5행 초과 시 이전/다음 (구매보조금 신청번호 등) */
  function wireSectionTables(){
    Array.prototype.forEach.call(root.querySelectorAll('.cd-sec-table'), function(box){
      var size=+box.getAttribute('data-size'), total=+box.getAttribute('data-total');
      if(!(total>size)) return;
      var pages=Math.ceil(total/size), page=1;
      var rows=box.querySelectorAll('tbody tr[data-r]');
      var info=box.querySelector('.cd-pg-info'), prev=box.querySelector('.cd-pg-prev'), next=box.querySelector('.cd-pg-next');
      function draw(){
        var start=(page-1)*size, end=start+size;
        Array.prototype.forEach.call(rows, function(tr){ var i=+tr.getAttribute('data-r'); tr.hidden=!(i>=start && i<end); });
        if(info) info.textContent=page+' / '+pages;
        if(prev) prev.disabled=(page<=1);
        if(next) next.disabled=(page>=pages);
      }
      if(prev) prev.addEventListener('click', function(){ if(page>1){ page--; draw(); } });
      if(next) next.addEventListener('click', function(){ if(page<pages){ page++; draw(); } });
      draw();
    });
  }

  /* 제출서류 파일선택(mock) — 보완요청/미제출 행 파일 교체 + 최하단 제출 */
  function wireDocs(){
    // 제출 파일명 = 다운로드 링크. 실서비스: ATCH 파일 다운로드 API 연결. 목업은 토스트로 동작 표기(정보성 부가설명 아님·동작 확인 피드백)
    root.addEventListener('click', function(e){
      var lnk = e.target.closest && e.target.closest('.cd-file-link');
      if(!lnk) return;
      e.preventDefault();
      var msg='파일이 다운로드됩니다. (목업 — 실서비스: 실제 파일 다운로드)';
      if(window.__toast) window.__toast(msg,'info');
    });
    var picks = root.querySelectorAll('.cd-pick');
    var submit = document.getElementById('cdDocSubmit');
    function chosenRows(){ return root.querySelectorAll('.cd-doc-row[data-picked="1"]'); }
    function sync(){ if(submit){ var n=chosenRows().length; submit.disabled=(n===0); submit.setAttribute('aria-disabled', n===0?'true':'false'); } }
    Array.prototype.forEach.call(picks, function(pk){
      var inp = pk.querySelector('.cd-pick-input'),
          fileEl = pk.querySelector('.cd-pick-file'),
          delBtn = pk.querySelector('.cd-pick-del'),
          row = pk.closest('.cd-doc-row');
      inp.addEventListener('change', function(){
        if(inp.files && inp.files.length){
          fileEl.textContent = inp.files[0].name+' · 선택됨'; fileEl.hidden=false;
          delBtn.hidden=false; row.setAttribute('data-picked','1');
        } else { clear(); }
        sync();
      });
      delBtn.addEventListener('click', function(){ inp.value=''; clear(); sync(); inp.focus(); });
      function clear(){ fileEl.textContent=''; fileEl.hidden=true; delBtn.hidden=true; row.removeAttribute('data-picked'); }
    });
    if(submit) submit.addEventListener('click', function(){
      var rows = chosenRows(); if(!rows.length) return;
      Array.prototype.forEach.call(rows, function(row){
        // 제출 상태 → '제출완료(검토 대기)' 갱신 + 선택 UI 정리
        var badge = row.querySelector('td:nth-child(3) span');
        if(badge){ badge.className='cd-doc-ok'; badge.textContent='제출완료(검토 대기)'; }
        var fileName = (row.querySelector('.cd-pick-file')||{}).textContent || '';
        fileName = fileName.replace(/ · 선택됨$/,'');
        var link = row.querySelector('.cd-file-link'), fileTd = row.querySelector('td:nth-child(2)');
        if(fileName && fileTd){ fileTd.innerHTML = '<a href="#" class="cd-file-link" onclick="return false;" title="다운로드(mock)">'+esc(fileName)+'</a>'; }
        else if(link){ /* keep */ }
        var pickTd = row.querySelector('td:nth-child(4)');
        if(pickTd) pickTd.innerHTML = '<span class="cd-file-none">—</span>';
        row.removeAttribute('data-picked'); row.setAttribute('data-status','done');
        row.classList.remove('cd-reject');
      });
      var msg = document.getElementById('cdSubmitMsg');
      if(msg){ msg.hidden=false; msg.textContent='✓ 제출되었습니다. 담당자 검토 후 안내드립니다.'; }
      submit.disabled=true; submit.setAttribute('aria-disabled','true'); submit.textContent='제출 완료';
    });
    sync();
  }

  // 블록 번호는 렌더 순서대로 자동 부여(가변 섹션 대응) — n 인자는 무시. 첫 block()=2 (idhead=1 암묵)
  var _blk;
  function block(n,title,inner){ _blk++; return '<div class="cd-block"><h3><span class="n">'+_blk+'</span>'+esc(title)+'</h3>'+inner+'</div>'; }

  /* 개발 참고(DEV) 접이식 패널 — 상태 코드·담당자 모델·DB 매핑. 실서비스 비노출·목록뷰 미표시. */
  function renderDevRef(dr){
    if(!dr) return '';
    var mono='font-family:var(--font-mono,ui-monospace,SFMono-Regular,Menlo,Consolas,monospace);';
    var groups = dr.stateGroups || [{ title:'', states:dr.states||[] }];
    var stateHtml = groups.map(function(g){
      var rows=(g.states||[]).map(function(s){
        var r=RESULT[s.badge]; var b = r ? '<span class="cd-badge '+r[1]+'">'+r[0]+'</span>' : '<span style="color:#94a3b8;">—</span>';
        return '<tr><td style="'+mono+'white-space:nowrap;font-weight:700;color:#0f172a;">'+esc(s.code)+'</td><td style="color:#334155;">'+esc(s.label)+'</td><td>'+b+'</td></tr>';
      }).join('');
      return (g.title?'<div style="font-weight:800;font-size:12px;margin:12px 0 5px;color:#475569;">'+esc(g.title)+'</div>':'')
        + '<table class="cd-tbl" style="font-size:12px;"><thead><tr><th style="width:150px;">코드</th><th>라벨</th><th style="width:74px;">배지</th></tr></thead><tbody>'+rows+'</tbody></table>';
    }).join('');
    var li=function(arr){ return (arr||[]).map(function(d){ return Array.isArray(d)
      ? '<li><code style="'+mono+'background:#e2e8f0;padding:1px 5px;border-radius:3px;color:#0f172a;">'+esc(d[0])+'</code> — '+esc(d[1])+'</li>'
      : '<li>'+esc(d)+'</li>'; }).join(''); };
    var mgr=li(dr.manager), db=li(dr.db);
    var head='font-weight:800;font-size:12.5px;margin:14px 0 6px;color:#334155;';
    var ul='margin:0 0 0 18px;font-size:12px;color:#475569;line-height:1.9;';
    return '<details class="cd-devref" style="margin-top:24px;border:1px dashed #94a3b8;border-radius:10px;background:#f1f5f9;padding:0 14px;">'
      + '<summary style="cursor:pointer;padding:12px 2px;font-weight:800;font-size:13px;color:#475569;">'
      +   '<span style="display:inline-block;background:#DC2626;color:#fff;font-size:10px;font-weight:900;padding:2px 6px;border-radius:4px;letter-spacing:.5px;margin-right:8px;">DEV</span>'
      +   '🛠 개발 참고 — 상태 코드 · DB 매핑 <span style="font-weight:600;color:#94a3b8;">(실서비스 비노출)</span>'
      + '</summary>'
      + '<div style="padding:2px 0 16px;border-top:1px dashed #cbd5e1;margin-top:2px;">'
      +   '<div style="'+head+'">① 전체 상태 코드</div>'+stateHtml
      +   (mgr?'<div style="'+head+'">② 담당자 입력 · 보완 모델</div><ul style="'+ul+'">'+mgr+'</ul>':'')
      +   (db?'<div style="'+head+'">③ DB 매핑 (테이블 · 컬럼 · 코드군)</div><ul style="'+ul+'">'+db+'</ul>':'')
      + '</div></details>';
  }

  function go(id){ var a=findApp(id); if(!a) return; setHash(id); renderDetail(a); window.scrollTo({top:0,behavior:'smooth'}); }
  function setHash(id){ try{ history.replaceState(null,'', location.pathname + (id?('?appId='+encodeURIComponent(id)):'')); }catch(e){} }

  function mount(c){
    cfg = c || {}; cfg.apps = cfg.apps || [];
    root = document.querySelector(cfg.root || '#contestDetailRoot');
    if(!root) return;
    var p = new URLSearchParams(location.search);
    var id = p.get('appId');
    if (id && findApp(id)) renderDetail(findApp(id));
    else renderList();
  }

  return { mount: mount };
})();
