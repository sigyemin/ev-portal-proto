/* ============================================================
   [EVAX 프로토타입 v1.01] 목업 레이어
   - 서버 조회(.ajax/.do)를 가로채 proto-api.js 더미로 응답한다.
   - 비어 있는 목록/표는 게시판 더미로 채운다.
   ※ 모든 수치는 시연용입니다. 실제 운영값이 아닙니다.
   ============================================================ */
(function () {
  'use strict';
  var SERVER_RE = /\.(do|ajax)(\?|$)/i;
  var API = window.PROTO_API || {};

  /* 서버 콘텐츠가 없는 메인 공지 팝업은 프로토에서 숨긴다 */
  (function () {
    var st = document.createElement('style');
    st.textContent = '#modalMainNotice{display:none !important;} body{overflow:auto !important;}';
    (document.head || document.documentElement).appendChild(st);
  })();

  /* 운영 공통 스크립트(common.js)의 쿠키 유틸 — 프로토에는 없으므로 최소 스텁 제공 */
  if (typeof window.getCookie !== 'function') {
    window.getCookie = function (n) {
      var m = document.cookie.match(new RegExp('(?:^|; )' + n + '=([^;]*)'));
      return m ? decodeURIComponent(m[1]) : '';
    };
  }
  if (typeof window.setCookie !== 'function') {
    window.setCookie = function (n, v, d) {
      var e = new Date(); e.setDate(e.getDate() + (d || 1));
      document.cookie = n + '=' + encodeURIComponent(v) + ';expires=' + e.toUTCString() + ';path=/';
    };
  }

  function toast(msg) {
    var el = document.createElement('div');
    el.textContent = msg;
    el.style.cssText =
      'position:fixed;left:50%;bottom:38px;transform:translateX(-50%);z-index:99999;' +
      'background:rgba(33,43,54,.94);color:#fff;padding:12px 20px;border-radius:10px;' +
      'font-size:13.5px;font-weight:600;box-shadow:0 6px 20px rgba(0,0,0,.25);max-width:86%;';
    document.body.appendChild(el);
    setTimeout(function () { el.style.transition = 'opacity .4s'; el.style.opacity = '0'; }, 1800);
    setTimeout(function () { el.remove(); }, 2300);
  }
  window.protoToast = toast;

  /* ── 요청 파라미터 정규화 (object | 'a=1&b=2') ── */
  function params(d) {
    var o = {};
    if (!d) return o;
    if (typeof d === 'object') return d;
    String(d).split('&').forEach(function (kv) {
      var i = kv.indexOf('=');
      if (i < 0) return;
      o[decodeURIComponent(kv.slice(0, i))] = decodeURIComponent(kv.slice(i + 1).replace(/\+/g, ' '));
    });
    return o;
  }

  /* proto-api.js 생성 시와 동일한 결정론적 해시 (지자체별 지방비 변주) */
  function hash() {
    var n = 7;
    for (var a = 0; a < arguments.length; a++) {
      var s = String(arguments[a]);
      for (var i = 0; i < s.length; i++) n = (n * 131 + s.charCodeAt(i)) % 100003;
    }
    return n;
  }
  function comma(n) { return Number(n).toLocaleString('ko-KR'); }
  function localAmt(car, localCd) { return car.base + (hash(localCd, car.model) % 6) * car.step; }

  /* ── 보조금 계산기 보조 함수 ────────────────────────────────
     화면 흐름 시연용 근사치입니다. 실제 산식(가산·상한·지자체 단가)은 운영 로직을 따릅니다. */
  var CALC_KINDS = {
    '11': ['1C'], '12': ['2T'], '13': ['3B'], '21': ['11E'],
    'H2': ['5C', '7B', '8T'], 'MOTOR': ['4M']
  };
  var LOCAL_BASE = { '1C': 300, '2T': 500, '3B': 3000, '4M': 60,
                     '5C': 1000, '7B': 8000, '8T': 9000, '11E': 200 };
  var LOCAL_STEP = { '1C': 5, '4M': 5, '11E': 5 };

  function makerCd(nm) { return 'M' + (hash(nm) % 900 + 100); }

  function calcLocalAmt(kind, model, localCd) {
    var base = LOCAL_BASE[kind] || 300;
    var step = LOCAL_STEP[kind] || 50;
    return (base + (hash(localCd, model) % 6) * step) * 10000;
  }

  function calcSubsidy(p) {
    var car = (API.compareTarget || []).filter(function (r) { return r.SEQ === String(p.model_cd); })[0];
    if (!car) return { CNT: 0 };
    var det = (API.compareDetail || {})[car.SEQ] || {};
    var gov = Number(det.govAmt) || 0;
    var loc = calcLocalAmt(car.CAR_KIND, car.MODEL, String(p.local_cd1 || ''));

    /* 2026 가산(근사): 차상위 +20% · 청년 생애최초 +20% · 다자녀 정액 · 택시 250만 */
    var addGov = 0, addLoc = 0;
    if (p.poverty_yn === 'Y') { addGov += Math.round(gov * 0.2); addLoc += Math.round(loc * 0.2); }
    if (p.first_buy_yn === 'Y') addGov += Math.round(gov * 0.2);
    var kids = parseInt(p.children_cnt, 10) || 0;
    if (kids >= 4) addGov += 3000000;
    else if (kids === 3) addGov += 2000000;
    else if (kids === 2) addGov += 1000000;
    if (p.taxi_yn === 'Y') addGov += 2500000;

    /* 전환지원금 — 신청 총액과 별도로 표기 */
    var cnt = Math.max(1, parseInt(p.exchange_3year_cnt, 10) || 1);
    var chgGov = (p.exchange_3year_yn === 'Y') ? 1000000 * cnt : 0;
    var chgLoc = (p.exchange_3year_yn === 'Y') ? 500000 * cnt : 0;

    if (p.car_type === 'H2') {
      return { CNT: 1, reqGamt: gov, reqLamt: loc, reqAddLamt: addLoc,
               reqTotalAmt: gov + loc + addLoc, extReqAddLamt: chgLoc };
    }
    if (p.car_type === 'MOTOR') {
      var dlvrG = (p.improve_fd_yn === 'Y') ? 300000 : 0;
      var dlvrL = (p.new_dlvr_yn === 'Y') ? 200000 : 0;
      return { CNT: 1, motorOptEmpty: false,
               reqGamt: gov, reqLamt: loc, reqAddGamt: addGov, reqAddLamt: addLoc,
               reqTotalAmt: gov + loc + addGov + addLoc,
               dlvrAddGamt: dlvrG, dlvrAddLamt: dlvrL };
    }
    return {
      CNT: 1, type_cd: car.CAR_TYPE_SUB_NM || '',
      req_gamt: gov, req_add_gamt: addGov, req_chng_add_gamt: chgGov,
      req_lamt: loc, req_add_lamt: addLoc, req_chng_add_lamt: chgLoc
    };
  }

  function page(no, size, total) {
    return { _pageNo: no, _listCount: total, _recordCountPerPage: size, _pageSize: 10 };
  }
  function wrap(list, pg) {
    return {
      resultCode: 'OK', result: 'OK', code: '0000',
      data: list, list: list, rows: list, resultList: list,
      totalCount: list.length, listCount: list.length,
      page: pg || page(1, list.length || 10, list.length)
    };
  }

  /* ── 게시판 공통 ── */
  function boardList(url) {
    var D = window.PROTO_DATA || {};
    if (/selectDictionaryList/i.test(url)) {
      return [
        { NUM: 5, TITL: '완속충전', NM: '한국환경공단', INS_DT: '2026-08-20', ARTC_ID: 'D5' },
        { NUM: 4, TITL: '급속충전', NM: '한국환경공단', INS_DT: '2026-08-19', ARTC_ID: 'D4' },
        { NUM: 3, TITL: '로밍', NM: '한국환경공단', INS_DT: '2026-08-18', ARTC_ID: 'D3' },
        { NUM: 2, TITL: '저공해차', NM: '한국환경공단', INS_DT: '2026-08-17', ARTC_ID: 'D2' },
        { NUM: 1, TITL: '무공해차', NM: '한국환경공단', INS_DT: '2026-08-16', ARTC_ID: 'D1' }
      ];
    }
    return (D.notice || []).map(function (r, i) {
      return {
        NUM: r.no, TITL: r.title, NM: r.writer, INS_DT: r.date,
        ARTC_ID: 'PROTO' + (1000 + i), NOTICE_YN: i < 2 ? 'Y' : 'N',
        FILE_ID: r.file ? 'F' + i : '', FILE_SIZE_TOTAL: r.file ? 128000 : 0,
        HIT_CNT: r.hit, BLBD_ID: 'notice'
      };
    });
  }

  /* ── URL 라우팅 ────────────────────────────────────────────── */
  function route(url, data) {
    var p = params(data);
    url = String(url || '');

    /* 보조금 지급대상 차종 */
    if (/selectTargetVehicle/i.test(url)) return wrap(API.targetVehicles || []);

    /* 시도 / 시군구 */
    if (/getLocalDoCd1/i.test(url)) return wrap(API.sidoList || []);
    if (/getLocalCd1/i.test(url)) {
      var sd = String(p.localDo_cd || '').substring(0, 2);
      return wrap(((API.sggList || {})[sd]) || []);
    }

    /* 지자체별 차종·모델 보조금 */
    if (/getLocalCarModelPrice/i.test(url)) {
      var cd = String(p.local_cd || '');
      var out = { list11: [], list12: [], list13: [] };
      (API.cars || []).forEach(function (c) {
        var loc = localAmt(c, cd);
        var row = {
          TYPE_CD: c.typeCd, TYPE_NM: c.typeNm, MAKER_NM: c.maker,
          MODEL_NM: c.model, USE_YN: 'Y',
          LAMT: comma(loc), TOTAL_AMT: comma(c.gov + loc)
        };
        if (c.kind === '3B') {
          row.GAMT = comma(c.gov);
          row.EXCHANGE_3YEAR_GAMT3 = '-'; row.EXCHANGE_3YEAR_LAMT3 = '-';
        } else {
          row.SUM_GAMT = comma(c.gov);
          row.EXCHANGE_3YEAR_GAMT3 = comma(c.kind === '2T' ? 100 : 50);
          row.EXCHANGE_3YEAR_LAMT3 = comma(c.kind === '2T' ? 50 : 20);
        }
        out[c.listKey].push(row);
      });
      return out;
    }

    /* 차종 비교 – 차량 선택 목록 */
    if (/selectCarCompareTarget/i.test(url)) {
      var all = (API.compareTarget || []).filter(function (r) {
        if (p.carKind && r.CAR_KIND !== p.carKind) return false;
        if (p.schModel && String(r.MODEL).indexOf(p.schModel) < 0) return false;
        return true;
      });
      var no = parseInt(p.spageNo, 10) || 1, size = 10;
      return { list: all.slice((no - 1) * size, no * size), page: page(no, size, all.length) };
    }

    /* 차종 비교 – 상세 */
    if (/selectCarCompare/i.test(url)) {
      var seqs = String(p.seqs || '').split(',').filter(Boolean);
      var lcd = String(p.localCd || '');
      var det = API.compareDetail || {};
      var carsByModel = {};
      (API.cars || []).forEach(function (c) { carsByModel[c.model] = c; });
      var list = seqs.map(function (s) {
        var src = det[s];
        if (!src) return null;
        var d = JSON.parse(JSON.stringify(src));
        var c = carsByModel[d.model];
        if (lcd && c) {
          d.localAmt = localAmt(c, lcd) * 10000;
          d.totalAmt = d.govAmt + d.localAmt;
        } else {
          d.localAmt = null;
          d.totalAmt = d.govAmt;
        }
        return d;
      }).filter(Boolean);
      return wrap(list);
    }

    /* 지자체 문의처 – 보조금 지급여부 확인 */
    if (/initPsLocalPopupPaymentList/i.test(url)) {
      var vh = String(p.searchVhId || '').trim();
      if (!vh) return wrap([]);
      var n = hash(vh);
      var L = (API.locals || [])[n % Math.max(1, (API.locals || []).length)] || { nm: '-' };
      return wrap([{
        VH_ID: vh, VH_NUM: (10 + n % 90) + '???' + (1000 + n % 9000),
        PRO_NM: (API.compareTarget || [])[n % Math.max(1, (API.compareTarget || []).length)].MODEL,
        PAYMENT_YN: n % 3 ? 'Y' : 'N', LOCAL_NM: L.nm
      }]);
    }

    /* 충전요금 – 충전소 요금 검색 */
    if (/selectEvStationFeeList/i.test(url)) {
      var rows = (API.stations || []).filter(function (r) {
        if (p.zcode && r.ZCODE !== p.zcode) return false;
        if (p.zscode && r.ZSCODE !== p.zscode) return false;
        if (p.snm && String(r.SNM).indexOf(p.snm) < 0) return false;
        return true;
      });
      var pno = parseInt(p.spageNo, 10) || 1, psz = 10;
      return { list: rows.slice((pno - 1) * psz, pno * psz), page: page(pno, psz, rows.length) };
    }

    /* 수소충전소 요금 검색 */
    if (/selectH2StationPrice/i.test(url)) {
      var h2 = (API.h2Stations || []).filter(function (r) {
        if (p.zcode && r.ZCODE !== p.zcode) return false;
        if (p.zscode && r.ZSCODE !== p.zscode) return false;
        if (p.snm && String(r.CHRSTN_NM).indexOf(p.snm) < 0) return false;
        return true;
      });
      var hno = parseInt(p.spageNo, 10) || 1, hsz = 10;
      return { list: h2.slice((hno - 1) * hsz, hno * hsz), page: page(hno, hsz, h2.length) };
    }

    /* ── 보조금 계산기 ─────────────────────────────────────────
       ※ 화면 흐름 시연용 근사 계산입니다. 실제 산식은 운영 subsiCalc 를 따릅니다. */
    if (/subsiCalc\/|getLocalDoCd11|getLocalCd11/i.test(url)) {
      if (/getLocalDoCd11/i.test(url)) return wrap(API.sidoList || []);
      if (/getLocalCd11/i.test(url)) {
        var sd2 = String(p.localDo_cd || '').substring(0, 2);
        return wrap(((API.sggList || {})[sd2]) || []);
      }
      var kinds = CALC_KINDS[p.car_type] || ['1C'];
      var pool = (API.compareTarget || []).filter(function (r) {
        return kinds.indexOf(r.CAR_KIND) > -1;
      });

      if (/localOption|h2MakerCombo|motorMakerCombo/i.test(url)) {
        var mks = [], seenM = {};
        pool.forEach(function (r) {
          if (seenM[r.MADE_COMPANY_NM]) return;
          seenM[r.MADE_COMPANY_NM] = 1;
          mks.push({ MAKER_CD: makerCd(r.MADE_COMPANY_NM), MAKER_NM: r.MADE_COMPANY_NM });
        });
        return { makerList: mks, CNT: 1 };
      }
      if (/modelCombo|h2ModelCombo|motorModelCombo/i.test(url)) {
        var mdl = pool.filter(function (r) {
          return !p.maker_cd || makerCd(r.MADE_COMPANY_NM) === p.maker_cd;
        }).map(function (r) { return { MODEL_CD: r.SEQ, MODEL_NM: r.MODEL }; });
        return { modelList: mdl, CNT: 1 };
      }
      if (/calc\.ajax/i.test(url)) return calcSubsidy(p);
      return { CNT: 1, makerList: [], modelList: [] };
    }

    /* 내 차 저공해 확인 */
    if (/selectNonpolluCheck/i.test(url)) {
      var q = String(p.searchWord || '').trim();
      if (!q) return { data: null };
      var car = (API.compareTarget || [])[hash(q) % Math.max(1, (API.compareTarget || []).length)];
      var det = (API.compareDetail || {})[car.SEQ] || {};
      var FUEL = { '1C': '전기', '2T': '전기', '3B': '전기', '4M': '전기',
                   '5C': '수소', '7B': '수소', '8T': '수소', '11E': '전기' };
      /* 저공해차 종류는 ECO_INFO 인증 '종' 구분(1종=전기·수소) 형식으로 내려준다 */
      return {
        data: {
          MAKR_NM: car.MADE_COMPANY_NM, CAR_NM: car.MODEL,
          CAR_TYPE_NM: '1종(' + (FUEL[car.CAR_KIND] || '전기') + ')',
          USEFUELNM: FUEL[car.CAR_KIND] || '전기'
        }
      };
    }

    /* ── 내 회원카드 ─────────────────────────────────────────── */
    if (/selectMyCardList/i.test(url)) {
      var mc = (window.PROTO_DATA || {}).memberCard || [];
      var cno = parseInt(p.spageNo, 10) || 1, csz = 10;
      return { list: mc.slice((cno - 1) * csz, cno * csz), page: page(cno, csz, mc.length) };
    }
    if (/selectMemberCardList/i.test(url)) {
      return wrap(((window.PROTO_DATA || {}).cardIssue) || []);
    }
    if (/selectCardWalletList/i.test(url)) {
      return wrap(((window.PROTO_DATA || {}).cardWallet) || []);
    }
    if (/actionCardPaymentPopupList|actionRepayCardInfoPopupList|actionFailCardInfoPopupList/i.test(url)) {
      return wrap(((window.PROTO_DATA || {}).chargeHistory) || []);
    }
    if (/dupCarCk/i.test(url)) return { resultCode: 'OK', CNT: 0, dupYn: 'N' };

    /* ── 충전요금 조회 (거래내역) ─────────────────────────────── */
    if (/selectChargeTrade/i.test(url)) {
      var H = (window.PROTO_DATA || {}).chargeTrade || [];
      var tno = parseInt(p.spageNo, 10) || 1, tsz = parseInt(p.srecordCountPerPage, 10) || 10;
      var tl = H.filter(function (r) {
        if (p.searchChargingItem01 && r.CARD_NO_RAW !== p.searchChargingItem01) return false;
        if (p.searchChargingItem02 && r.BID !== p.searchChargingItem02) return false;
        return true;
      });
      /* 시연용 파생 필드 — 목록(포인트)·상세영수증(회원명/차량/결제수단/승인번호)에서 쓴다.
         ※ POINT 산정 근거는 미정 → 충전량 1kWh당 1P 로 가정한 더미값. 나머지도 카드번호 기준 더미. */
      var TRADE_CARMAP = { '1204': '12가3456', '2277': '34나7890', '3391': '56다1234' };
      var TRADE_NAMEMAP = { '1204': '김전기', '2277': '이충전', '3391': '박그린' };
      tl.forEach(function (r) {
        var ok = r.PAYRESULT === 'Y';
        var last4 = String(r.CARD_NO_RAW || '').slice(-4);
        r.POINT = ok ? Math.round(r.POW) : 0;
        r.NAME = TRADE_NAMEMAP[last4] || '회원';
        r.CAR_ID = TRADE_CARMAP[last4] || '-';
        r.CALCULATE = ok ? 'BC그린카드(간편결제)' : '-';
        r.AUTH_CD = ok ? ('3' + last4 + ('0000' + ((r.NUM * 37) % 9000 + 1000)).slice(-4)) : '-';
      });
      var sumKwh = 0, sumFee = 0, sumPay = 0, sumMin = 0;
      tl.forEach(function (r) { sumKwh += r.POW; sumFee += r.MON; sumPay += r.PAYMON; sumMin += r.MIN; });
      return {
        list: tl.slice((tno - 1) * tsz, tno * tsz),
        page: page(tno, tsz, tl.length),
        sumdata: {
          SUM_CG_TIME: Math.floor(sumMin / 60) + '시간 ' + (sumMin % 60) + '분',
          SUM_CG_KWH: sumKwh.toLocaleString('ko-KR'),
          SUM_CG_FEE: sumFee.toLocaleString('ko-KR'),
          SUM_CG_PAY: sumPay.toLocaleString('ko-KR')
        }
      };
    }
    /* 후불 명세서 — 지정 기간(s_date_str~s_date_end)에 맞춰 집계해 내려준다(기간을 바꾸면 값도 바뀐다).
       ISS-132로 월 단위→기간 조회 전환. 구 yyyymm 파라미터도 하위호환으로 받는다. */
    if (/postStatement/i.test(url)) {
      var pstart = String(p.s_date_str || '');
      var pend = String(p.s_date_end || '');
      // 하위호환: 기간이 없고 yyyymm 만 오면 그 달 전체로 간주
      if ((!pstart || !pend) && p.yyyymm) {
        var ym0 = String(p.yyyymm);
        pstart = ym0.substring(0, 4) + '-' + ym0.substring(4, 6) + '-01';
        pend = pstart.substring(0, 8) + '28';
      }
      var seedKey = pstart + '~' + pend;                   // 기간별로 값이 달라지게
      var H2 = (window.PROTO_DATA || {}).chargeTrade || [];
      var seed = hash(seedKey);
      var base = H2.filter(function (r) { return r.PERRMSG !== '결제실패'; });
      var take = base.length ? (2 + seed % Math.max(1, base.length - 1)) : 0;
      var picked = base.slice(0, take);
      var byBusi = {}, sumPay = 0, sumKwh = 0;
      picked.forEach(function (r) {
        var f = 0.7 + (hash(seedKey, r.BID) % 60) / 100;
        var pay = Math.round(r.PAYMON * f);
        sumPay += pay; sumKwh += Math.round(r.POW * f);
        if (!byBusi[r.BUSI_NM]) byBusi[r.BUSI_NM] = { BUSI_NM: r.BUSI_NM, CNT: 0, SUM_PAY: 0 };
        byBusi[r.BUSI_NM].CNT += 1;
        byBusi[r.BUSI_NM].SUM_PAY += pay;
      });
      var busiStat = Object.keys(byBusi).map(function (k) {
        return { BUSI_NM: k, CNT: comma(byBusi[k].CNT), SUM_PAY: comma(byBusi[k].SUM_PAY) };
      }).sort(function (a, b) { return b.SUM_PAY.length - a.SUM_PAY.length; });
      return {
        resultCode: 'OK', s_date_str: pstart, s_date_end: pend,
        issueDate: pend || '-',                            // 발행일자=조회 종료일(프로토)
        sum: { PAY_CNT: comma(picked.length), SUM_PAY: comma(sumPay), SUM_KWH: sumKwh.toLocaleString('ko-KR') },
        busiStat: busiStat
      };
    }
    if (/chargeTradeReceipt/i.test(url)) {
      return { resultCode: 'OK', html: '<p>프로토타입에서는 영수증 원본을 제공하지 않습니다.</p>' };
    }

    /* 지자체 담당부서 연락처 (보조금 현황 상세 모달) */
    if (/callPopLocalPhoneInfo|localBookmark/i.test(url)) {
      if (/localBookmark/i.test(url)) return { resultCd: '200' };
      var ph = ((window.PROTO_DATA || {}).localPhone) || [];
      return wrap(ph);
    }

    /* 용어사전 */
    if (/selectDictionaryList/i.test(url)) {
      var D = (window.PROTO_DATA || {}).dictionary || [];
      var dno = parseInt(p.spageNo, 10) || 1, dsz = parseInt(p.srecordCountPerPage, 10) || 10;
      var kw = String(p.searchValue || '').trim();
      var dl = kw ? D.filter(function (r) {
        return (r.KOR_DIC + r.ENG_DIC + r.DESCRIPTION).indexOf(kw) > -1;
      }) : D;
      return { list: dl.slice((dno - 1) * dsz, dno * dsz), page: page(dno, dsz, dl.length) };
    }

    /* 요청자료 */
    if (/selectRequestedItemList/i.test(url)) {
      var R = (window.PROTO_DATA || {}).request || [];
      var rno = parseInt(p.spageNo, 10) || 1, rsz = 10;
      return { list: R.slice((rno - 1) * rsz, rno * rsz), page: page(rno, rsz, R.length) };
    }

    /* 완속충전기 제품 안내 */
    if (/retriveSlowChargerAction/i.test(url)) {
      var P = (window.PROTO_DATA || {}).chargerProduct || { blist: [], makers: {} };
      var bid = String(p.bid || '') || (P.blist[0] && P.blist[0].BID) || '';
      var mk = P.makers[bid] || { busiInfo: {}, imgList: [] };
      return { blist: P.blist, busiInfo: mk.busiInfo, imgList: mk.imgList };
    }

    /* 게시판 계열 */
    if (/selectBBSList|selectFormList|BbsList|boardList/i.test(url)) {
      return wrap(boardList(url));
    }

    return wrap([]);
  }

  if (window.jQuery) {
    var _ajax = jQuery.ajax;
    jQuery.ajax = function (a, b) {
      var opt = (typeof a === 'string') ? (b || {}) : (a || {});
      var url = (typeof a === 'string') ? a : opt.url;
      if (url && SERVER_RE.test(url)) {
        var res = route(url, opt.data), d = jQuery.Deferred();
        setTimeout(function () {
          if (typeof opt.success === 'function') opt.success(res, 'success', null);
          if (typeof opt.complete === 'function') opt.complete(null, 'success');
          d.resolve(res, 'success', null);
        }, 60);
        return d.promise();
      }
      return _ajax.apply(this, arguments);
    };
  }
  if (window.fetch) {
    var _fetch = window.fetch;
    window.fetch = function (input, init) {
      var url = (typeof input === 'string') ? input : (input && input.url) || '';
      if (SERVER_RE.test(url)) {
        return Promise.resolve(new Response(JSON.stringify(route(url, init && init.body)),
          { status: 200, headers: { 'Content-Type': 'application/json' } }));
      }
      return _fetch.apply(this, arguments);
    };
  }

  /* 빈 표(tbody)에 게시판형 더미 채우기 */
  function fillTables() {
    var D = window.PROTO_DATA;
    if (!D) return;
    document.querySelectorAll('table').forEach(function (tb) {
      var body = tb.querySelector('tbody');
      if (!body || body.dataset.proto) return;
      if ((body.textContent || '').trim().length) return;      // 이미 내용 있음
      var ths = [...tb.querySelectorAll('thead th')].map(function (t) { return t.innerText.trim(); });
      if (!ths.length) return;
      if (tb.closest('.modal, .modal-container')) return;      // 팝업 상세표는 대상 아님

      // 게시판형 컬럼이 2개 이상 잡힐 때만 채운다 (그 외는 화면 전용 스크립트 소관)
      var KNOWN = /번호|No|분류|유형|제목|질문|내용|작성자|등록자|기관|첨부|조회|날짜|일자|등록일|작성일/i;
      var matched = ths.filter(function (h) { return KNOWN.test(h); }).length;
      if (matched < 2) return;
      body.dataset.proto = '1';

      var rows = D.notice;
      if (ths.some(function (t) { return /분류|유형/.test(t); })) rows = D.faq;

      var html = rows.slice(0, 10).map(function (r, i) {
        return '<tr>' + ths.map(function (h) {
          if (/번호|No/i.test(h))      return '<td>' + (r.no || (10 - i)) + '</td>';
          if (/분류|유형/.test(h))      return '<td>' + (r.cat || '일반') + '</td>';
          if (/제목|질문|내용/.test(h)) return '<td class="text-left" style="text-align:left"><a href="#">' + r.title + '</a></td>';
          if (/작성자|등록자|기관/.test(h)) return '<td>' + (r.writer || '한국환경공단') + '</td>';
          if (/첨부/.test(h))          return '<td>' + (r.file ? '📎' : '-') + '</td>';
          if (/조회/.test(h))          return '<td>' + (r.hit || 0).toLocaleString() + '</td>';
          if (/날짜|일자|등록일|작성일/.test(h)) return '<td>' + r.date + '</td>';
          return '<td>-</td>';
        }).join('') + '</tr>';
      }).join('');
      body.innerHTML = html;

      var wrapEl = tb.closest('.board-wrapper, .contents, section') || document;
      var tot = wrapEl.querySelector('.total-number__total, .board-toolbar__total b');
      if (tot && /^0?$/.test(tot.textContent.trim())) tot.textContent = rows.length;
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('form').forEach(function (f) {
      var act = f.getAttribute('action') || '';
      if (!act || SERVER_RE.test(act)) {
        f.addEventListener('submit', function (e) {
          e.preventDefault();
          toast('프로토타입입니다 — 실제 전송/조회는 되지 않습니다.');
        });
      }
    });

    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[href]');
      if (!a) return;
      var h = a.getAttribute('href') || '';
      if (h.indexOf('http') === 0) return;
      if (SERVER_RE.test(h)) {
        e.preventDefault();
        toast(/download|excel/i.test(h)
          ? '프로토타입에서는 파일 다운로드가 제공되지 않습니다.'
          : '프로토타입입니다 — 이 기능은 운영에서만 동작합니다.');
      }
    }, true);

    /* 서버 콘텐츠가 없는 모달은 기본 닫힘 */
    ['#modalMainNotice', '.modal-container.is-active'].forEach(function (sel) {
      document.querySelectorAll(sel).forEach(function (el) {
        var inner = el.querySelector('.modal, .modal-body, .popup-body');
        var empty = !inner || (inner.textContent || '').trim().length < 5;
        if (empty) { el.classList.remove('is-active'); el.style.display = 'none'; }
      });
    });
    document.documentElement.style.overflow = '';
    document.body.style.overflow = '';

    if (!window.PAGE_INFO) window.PAGE_INFO = { loginYn: 'N' };

    setTimeout(fillTables, 350);
    setTimeout(fillTables, 1200);
  });
})();
