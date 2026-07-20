/* ============================================================================
   질의응답(건의사항) 카테고리 — 대분류/소분류 2단 (단일 원천)
   근거: SFR-021 + 콜센터 상담 분류표(2026-07-15 확정). 이 표 그대로 · 임의 수정 금지.
   [DEV] 실서비스 = 신설 코드그룹(대분류 major + 소분류 minor 2컬럼 권장). 질의응답 게시판 ·
         민원 처리 현황 조회가 이 파일을 공유 → 변경 시 양쪽 자동 일치.
         기존 QNAGBN(단일 5슬롯)으로는 2단 수용 불가 → 코드 신설(개발 협의).
   ============================================================================ */
(function () {
  'use strict';
  var CATS = [
    { key:'ev', label:'전기차', subs:[
      { key:'subsidy', label:'보조금 신청' }, { key:'sys', label:'시스템 오류' },
      { key:'site', label:'누리집 사용 문의' }, { key:'org', label:'담당 기관 문의' }, { key:'etc', label:'기타' }
    ]},
    { key:'lev', label:'저공해차', subs:[
      { key:'lookup', label:'차량조회' }, { key:'sys', label:'시스템 오류' },
      { key:'badge', label:'표지발급권한' }, { key:'etc', label:'기타' }
    ]},
    { key:'h2', label:'수소차', subs:[
      { key:'subsidy', label:'보조금 신청' }, { key:'sys', label:'시스템 오류' },
      { key:'site', label:'누리집 사용 문의' }, { key:'org', label:'담당 기관 문의' }, { key:'etc', label:'기타' }
    ]},
    { key:'charger', label:'충전기', subs:[
      { key:'subsidy', label:'보조금 신청' }, { key:'card', label:'회원카드 및 결제' },
      { key:'complaint', label:'충전민원' }, { key:'fee', label:'충전요금' },
      { key:'op', label:'충전기운영' }, { key:'etc', label:'기타' }
    ]},
    { key:'mandate', label:'의무구매임차제', subs:[
      { key:'site', label:'누리집 사용문의' }, { key:'etc', label:'기타' }
    ]},
    { key:'account', label:'회원.계정', subs:[
      { key:'signup', label:'회원가입' }, { key:'auth', label:'본인인증' },
      { key:'login', label:'로그인' }, { key:'etc', label:'기타' }
    ]},
    { key:'etc', label:'기타', subs:[ { key:'etc', label:'기타' } ]}
  ];

  function byKey(mk){ for (var i=0;i<CATS.length;i++) if (CATS[i].key===mk) return CATS[i]; return null; }
  function byLabel(ml){ for (var i=0;i<CATS.length;i++) if (CATS[i].label===ml) return CATS[i]; return null; }

  window.QNA_CATS = CATS;
  window.QNA_CAT = {
    cats: CATS,
    majors: function(){ return CATS.map(function(c){ return { key:c.key, label:c.label }; }); },
    majorLabel: function(mk){ var c=byKey(mk); return c ? c.label : (mk||''); },
    subs: function(mk){ var c=byKey(mk); return c ? c.subs.slice() : []; },
    subLabel: function(mk, sk){ var c=byKey(mk); if(!c) return sk||''; for (var i=0;i<c.subs.length;i++) if (c.subs[i].key===sk) return c.subs[i].label; return sk||''; },
    // "대분류 › 소분류"
    badge: function(mk, sk){ return (byKey(mk)?byKey(mk).label:mk) + ' › ' + this.subLabel(mk, sk); },
    // 라벨 기반(민원 현황 조회: 세부유형=대분류 라벨로 저장) → 소분류 라벨 합집합
    subLabelsForMajorLabels: function(majorLabels){
      var out=[], seen={}, mls = (majorLabels && majorLabels.length) ? majorLabels : CATS.map(function(c){return c.label;});
      mls.forEach(function(ml){ var c=byLabel(ml); if(c) c.subs.forEach(function(s){ if(!seen[s.label]){ seen[s.label]=1; out.push(s.label); } }); });
      return out;
    },
    // <option> 문자열 빌더 (select 연동용)
    majorOptions: function(placeholder){
      return '<option value="all">'+(placeholder||'대분류 전체')+'</option>'
        + CATS.map(function(c){ return '<option value="'+c.key+'">'+c.label+'</option>'; }).join('');
    },
    minorOptions: function(mk, placeholder){
      var c=byKey(mk);
      var head='<option value="all">'+(placeholder||'소분류 전체')+'</option>';
      if(!c) return head;
      return head + c.subs.map(function(s){ return '<option value="'+s.key+'">'+s.label+'</option>'; }).join('');
    }
  };
})();
