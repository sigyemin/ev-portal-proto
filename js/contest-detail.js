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

  var cfg, root;

  function findApp(id){ for(var i=0;i<cfg.apps.length;i++) if(cfg.apps[i].appId===id) return cfg.apps[i]; return null; }

  /* ── 목록 뷰 ── */
  function renderList(){
    var rows = cfg.apps.map(function(a){
      var r = RESULT[a.result]||RESULT.progress;
      return '<tr class="cd-row" data-id="'+esc(a.appId)+'" tabindex="0">'
        + '<td class="no">'+esc(a.appId)+'</td>'
        + '<td class="l">'+esc(a.project)+'</td>'
        + '<td>'+esc(a.applyDate)+'</td>'
        + '<td><span class="cd-status-txt">'+esc(a.status)+'</span></td>'
        + '<td><span class="cd-badge '+r[1]+'">'+r[0]+'</span></td>'
        + '</tr>';
    }).join('');
    root.innerHTML =
      '<p class="cd-list-meta">내 신청 <strong>'+cfg.apps.length+'</strong>건 · 행을 클릭하면 신청 건 상세로 이동합니다.</p>'
      + '<div class="table-wrap"><table class="cd-list-table"><thead><tr>'
      + '<th>신청번호</th><th>사업명</th><th>신청일</th><th>현재 상태</th><th>결과</th>'
      + '</tr></thead><tbody>'+ (rows || '<tr><td colspan="5" class="cd-empty">신청 내역이 없습니다.</td></tr>') +'</tbody></table></div>'
      + (cfg.applyHref ? '<div class="alert alert-info mt-6"><div class="alert-icon"></div><div class="alert-body"><strong>안내</strong> 본 화면은 신청 진행상태 조회용입니다. 신규 신청은 <a href="'+esc(cfg.applyHref)+'" style="color:var(--color-secondary-700,#1f5fa8);font-weight:600;">'+esc(cfg.applyName||'공모 신청')+'</a> 페이지를 이용하세요.</div></div>' : '');
    Array.prototype.forEach.call(root.querySelectorAll('.cd-row'), function(tr){
      tr.addEventListener('click', function(){ go(tr.dataset.id); });
      tr.addEventListener('keydown', function(e){ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); go(tr.dataset.id); } });
    });
  }

  /* ── 상세 뷰 ── */
  function renderDetail(a){
    var r = RESULT[a.result]||RESULT.progress;
    var h = '';
    h += '<button type="button" class="cd-back" id="cdBack"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg> 신청 목록으로</button>';

    // 1. 식별 헤더
    h += '<div class="cd-idhead"><div class="cd-idtop"><h2>'+esc(a.project)+'</h2>'+badge(a.result)+'</div>'
      + '<div class="cd-idmeta"><span>신청번호 <span class="no">'+esc(a.appId)+'</span></span><span>신청일 '+esc(a.applyDate)+'</span><span>현재 상태 <span class="st">'+esc(a.status)+'</span></span></div></div>';

    // 2. 공고 정보
    // TODO(실연동): 공고명(name)·지원규모(scale)·선정발표(announce)는 공고 마스터의 실제 컬럼으로 매핑 필요(현재 mock 표기).
    var nt = a.notice||{};
    h += block(2,'공고 정보', dl([
      ['공고명', esc(nt.name)],['공고번호','<span style="font-family:var(--font-mono,monospace);">'+esc(nt.no)+'</span>'],
      ['사업수행기관', esc(nt.org)],['접수기간', esc(nt.period)],
      ['선정발표(예정)', esc(nt.announce)],['지원규모', esc(nt.scale)],
      ['문의처', esc(nt.contact)]
    ]));

    // 3. 신청자(수행기관) 정보
    var ap = a.applicant||{};
    var appRows = [['기관·업체명', esc(ap.org)],['대표자', esc(ap.rep)],['사업자번호', esc(ap.bizNo)],['담당자', esc(ap.manager)],['연락처', esc(ap.tel)]];
    var appHtml = dl(appRows);
    if (ap.consortium && ap.consortium.length){
      appHtml += '<h4 style="font-size:13px;font-weight:800;margin:14px 0 8px;color:var(--text-secondary);">컨소시엄 구성</h4>'
        + '<table class="cd-tbl"><thead><tr><th>구성원</th><th>역할</th></tr></thead><tbody>'
        + ap.consortium.map(function(m){ return '<tr><td>'+esc(m.name)+'</td><td>'+esc(m.role)+'</td></tr>'; }).join('')
        + '</tbody></table>';
    }
    h += block(3,'신청자(수행기관) 정보', appHtml);

    // 4. ⟨사업별⟩ 신청 내용·대상
    var b4 = a.block4||{title:'신청 내용 · 대상', rows:[]};
    h += block(4, b4.title || '신청 내용 · 대상', dl(b4.rows||[]));

    // 5. 진행 타임라인
    var tl = (a.timeline||[]).map(function(s){
      var cls = s.state==='current'?'current':(s.state==='done'?'done':'');
      return '<li class="'+cls+'"><span class="dot"></span><div class="tl-lab">'+esc(s.label)+'</div><div class="tl-date">'+esc(s.date||'—')+'</div></li>';
    }).join('');
    h += block(5,'진행 단계', '<ul class="cd-timeline">'+tl+'</ul>');

    // 6. 제출 서류
    var docs = (a.docs||[]).map(function(d){
      var st = d.ok ? '<span class="cd-doc-ok">제출완료</span>' : '<span class="cd-doc-no">미제출</span>';
      var dlBtn = d.ok ? '<button type="button" class="cd-dl-btn" onclick="return false;">다운로드</button>' : '—';
      return '<tr><td>'+esc(d.name)+'</td><td style="text-align:center;">'+st+'</td><td style="text-align:center;">'+dlBtn+'</td></tr>';
    }).join('');
    h += block(6,'제출 서류', '<table class="cd-tbl"><thead><tr><th>구비서류</th><th style="text-align:center;">제출 상태</th><th style="text-align:center;">첨부</th></tr></thead><tbody>'+docs+'</tbody></table>');

    // 7. 보완요청 (조건부) — 요구서류별 재업로드 슬롯 + 제출(mock)
    if (a.supplement){
      var sp=a.supplement;
      var slots = (sp.docs&&sp.docs.length) ? sp.docs.map(function(d,di){
        return '<div class="cd-up-slot" data-idx="'+di+'">'
          + '<span class="cd-up-name">'+esc(d)+'</span>'
          + '<span class="cd-up-ctrl">'
          +   '<input type="file" id="cdup-'+di+'" class="cd-up-input" aria-label="'+esc(d)+' 파일 선택">'
          +   '<label for="cdup-'+di+'" class="cd-up-btn">파일 선택</label>'
          +   '<span class="cd-up-file" aria-live="polite">선택된 파일 없음</span>'
          +   '<button type="button" class="cd-up-del" data-idx="'+di+'" hidden aria-label="'+esc(d)+' 선택 파일 삭제">삭제</button>'
          + '</span></div>';
      }).join('') : '';
      h += '<div class="cd-callout supp"><h3>⚠ 보완요청</h3>'
        + '<div>'+esc(sp.reason)+'</div>'
        + (sp.due?'<div style="margin-top:6px;"><strong>재제출 기한 : '+esc(sp.due)+'</strong></div>':'')
        + (slots?'<div class="cd-uploads" role="group" aria-label="보완 요구서류 재업로드"><div class="cd-up-head">보완 요구서류 재업로드</div>'+slots+'</div>':'')
        + '<div class="cd-supp-actions">'
        +   '<button type="button" class="btn btn-primary btn-sm" id="cdSuppSubmit">보완서류 제출</button>'
        +   '<a href="'+(cfg.supplementHref||'#')+'" class="btn btn-ghost btn-sm cd-supp-btn">또는 업무지원시스템에서 제출 →</a>'
        + '</div>'
        + '<p class="cd-supp-hint" id="cdSuppMsg" role="status" aria-live="polite" hidden></p>'
        + '</div>';
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

    // 10. 문의 · 다음 액션
    h += '<div class="cd-foot">'
      + '<div class="cd-action"><strong>📌 내가 할 일</strong>'+esc(a.action||'현재 단계에서 별도 조치사항은 없습니다.')+'</div>'
      + '<div class="cd-contact"><strong>문의</strong><br>'+esc((a.notice&&a.notice.contact)||'담당 부서')+'<br>누리집콜센터 1661-0970</div>'
      + '</div>';

    root.innerHTML = h;
    var back=document.getElementById('cdBack');
    if(back) back.addEventListener('click', function(){ setHash(''); renderList(); window.scrollTo({top:0,behavior:'smooth'}); });
    wireSupplement();
    void r; // (badge already used)
  }

  /* 보완요청 재업로드(mock) — 파일 선택 표시·삭제·제출 */
  function wireSupplement(){
    var inputs = root.querySelectorAll('.cd-up-input');
    if(!inputs.length) return;
    Array.prototype.forEach.call(inputs, function(inp){
      var slot = inp.closest('.cd-up-slot');
      var fileEl = slot.querySelector('.cd-up-file');
      var delBtn = slot.querySelector('.cd-up-del');
      inp.addEventListener('change', function(){
        if(inp.files && inp.files.length){ fileEl.textContent = inp.files[0].name; fileEl.classList.add('has'); delBtn.hidden=false; }
        else { fileEl.textContent='선택된 파일 없음'; fileEl.classList.remove('has'); delBtn.hidden=true; }
      });
      delBtn.addEventListener('click', function(){ inp.value=''; fileEl.textContent='선택된 파일 없음'; fileEl.classList.remove('has'); delBtn.hidden=true; inp.focus(); });
    });
    var submit = document.getElementById('cdSuppSubmit');
    if(submit) submit.addEventListener('click', function(){
      var chosen = root.querySelectorAll('.cd-up-file.has').length, total = inputs.length;
      if(chosen===0){ var m0='제출할 보완서류를 먼저 선택해 주세요.'; if(window.__toast) window.__toast(m0,'info'); else alert(m0); return; }
      if(window.__toast) window.__toast('보완서류가 제출되었습니다. 검토 후 안내드립니다.','success');
      var msg = document.getElementById('cdSuppMsg');
      if(msg){ msg.hidden=false; msg.textContent='✓ 보완서류가 제출되었습니다. 검토 후 안내드립니다. ('+chosen+'/'+total+'건 첨부)'; }
      submit.disabled=true; submit.textContent='제출 완료';
    });
  }

  function block(n,title,inner){ return '<div class="cd-block"><h3><span class="n">'+n+'</span>'+esc(title)+'</h3>'+inner+'</div>'; }

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
