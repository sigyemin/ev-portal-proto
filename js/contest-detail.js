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

    // 1. 식별 헤더 — app.badges 있으면 2축(심사·선정) 다중 배지, 없으면 단일 결과 배지
    var idBadges = (a.badges && a.badges.length)
      ? a.badges.map(function(b){ var t=RESULT[b.tone]||RESULT.progress; return '<span class="cd-badge '+t[1]+'">'+esc(b.text)+'</span>'; }).join(' ')
      : badge(a.result);
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

    // 4. ⟨사업별⟩ 신청 내용·대상
    var b4 = a.block4||{title:'신청 내용 · 대상', rows:[]};
    h += block(4, b4.title || '신청 내용 · 대상', dl(b4.rows||[]));

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

    // 6. 제출 서류 (조건부 — app.docs 있을 때만)
    if (a.docs && a.docs.length){
      var docs = a.docs.map(function(d){
        var st = d.ok ? '<span class="cd-doc-ok">제출완료</span>' : '<span class="cd-doc-no">미제출</span>';
        var dlBtn = d.ok ? '<button type="button" class="cd-dl-btn" onclick="return false;">다운로드</button>' : '—';
        return '<tr><td>'+esc(d.name)+'</td><td style="text-align:center;">'+st+'</td><td style="text-align:center;">'+dlBtn+'</td></tr>';
      }).join('');
      h += block(6,'제출 서류', '<table class="cd-tbl"><thead><tr><th>구비서류</th><th style="text-align:center;">제출 상태</th><th style="text-align:center;">첨부</th></tr></thead><tbody>'+docs+'</tbody></table>');
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
        var arows = rv.docs.map(function(d){
          var st = d.ok ? '<span class="cd-doc-ok">승인</span>' : '<span class="cd-doc-no">반려</span>';
          return '<tr'+(d.ok?'':' class="cd-reject"')+'><td>'+esc(d.name)+'</td><td style="text-align:center;">'+st+'</td><td style="text-align:center;"><button type="button" class="cd-dl-btn" onclick="return false;">다운로드</button></td></tr>';
        }).join('');
        rvInner += '<h4 style="font-size:13px;font-weight:800;margin:16px 0 8px;color:var(--text-secondary);">첨부 서류 심사 ('+rv.docs.length+'종)</h4>'
          + '<table class="cd-tbl"><thead><tr><th>첨부 서류</th><th style="text-align:center;">심사</th><th style="text-align:center;">첨부</th></tr></thead><tbody>'+arows+'</tbody></table>';
      }
      if (rv.memo) rvInner += '<div class="alert alert-info" style="margin:14px 0 0;"><div class="alert-icon"></div><div class="alert-body"><strong>담당자 종합 메모</strong><br>'+esc(rv.memo)+'</div></div>';
      h += block(6,'항목별 심사 현황', rvInner);
    }

    // 6b. 공단 안내 (조건부 · 정보형 콜아웃) — KECO_CONT
    if (a.kecoNote){
      h += '<div class="alert alert-info" style="margin:16px 0;"><div class="alert-icon"></div><div class="alert-body"><strong>공단 안내</strong><br>'+esc(a.kecoNote)+'</div></div>';
    }

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
      h += '<div class="cd-callout supp"><h3>⚠ 보완요청</h3>'
        + suppBody
        + (sp.due?'<div style="margin-top:6px;"><strong>재제출 기한 : '+esc(sp.due)+'</strong></div>':'')
        + (slots?'<div class="cd-uploads" role="group" aria-label="보완 요구서류 재업로드"><div class="cd-up-head">보완 요구서류 재업로드</div>'+slots+'</div>':'')
        + '<div class="cd-supp-actions">'
        +   '<button type="button" class="btn btn-primary btn-sm" id="cdSuppSubmit">보완서류 제출</button>'
        +   '<a href="'+(cfg.supplementHref||'#')+'" class="btn btn-ghost btn-sm cd-supp-btn">또는 업무지원시스템에서 제출 →</a>'
        + '</div>'
        + '<p class="cd-supp-hint" id="cdSuppMsg" role="status" aria-live="polite" hidden></p>'
        + '</div>';
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

    // 10. 다음 액션 (문의처 블록 제거 — 공모/지자체마다 근거 상이 · 콜센터만 유지)
    h += '<div class="cd-foot">'
      + '<div class="cd-action"><strong>📌 내가 할 일</strong>'+esc(a.action||'현재 단계에서 별도 조치사항은 없습니다.')+'</div>'
      + '</div>'
      + '<p class="cd-callcenter" style="text-align:center;color:var(--text-tertiary,#94a3b8);font-size:13px;margin-top:14px;">문의 · 누리집콜센터 <strong>1661-0970</strong></p>';

    // 11. 개발 참고(DEV) 패널 — 상세 뷰에서만 · 기본 접힘 (app.devRef 우선 · 없으면 mount.devRef)
    h += renderDevRef(a.devRef || cfg.devRef);

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
