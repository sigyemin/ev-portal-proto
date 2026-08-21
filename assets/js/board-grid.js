/** 게시판 ag-grid 공통 옵션 팩토리 — 페이지 옵션과 얕은 병합(페이지 값 우선) */
(function (global) {
  var LOADING_TIMEOUT = 5000;

  var BASE = {
    rowData: [],
    domLayout: 'autoHeight',
    defaultColDef: { resizable: false, sortable: true, unSortIcon: true, sortingOrder: ['asc', 'desc'] },
    suppressCellFocus: false,
    suppressRowClickSelection: true,
    // 첫 조회 응답 전에는 '조회된 내용이 없습니다.' 대신 로딩 표시
    loading: true,
    overlayLoadingTemplate: '<span>조회 중입니다.</span>',
    overlayNoRowsTemplate: '<span>조회된 내용이 없습니다.</span>'
  };

  function stopLoading(api) {
    if (api.boardGridLoading === false) return;
    api.boardGridLoading = false;
    api.setGridOption('loading', false);
  }

  // 생성 직후의 초기 rowData 반영은 건너뛰고, 첫 조회 응답(비동기)부터 로딩 해제
  function onGridReady(params) {
    var api = params.api;
    api.boardGridLoading = true;
    setTimeout(function () {
      api.boardGridReady = true;
      setTimeout(function () { stopLoading(api); }, LOADING_TIMEOUT);
    }, 0);
  }

  // 생성 직후 데이터를 바로 채우는 화면도 있으므로 행이 있으면 즉시 해제
  function onRowDataUpdated(params) {
    var api = params.api;
    var hasRows = typeof api.getDisplayedRowCount === 'function' && api.getDisplayedRowCount() > 0;
    if (api.boardGridReady || hasRows) stopLoading(api);
  }

  // 페이지가 같은 이벤트를 쓰더라도 덮이지 않도록 공통 핸들러를 앞에 이어 붙인다
  function chain(baseFn, pageFn) {
    return function (params) {
      baseFn(params);
      if (typeof pageFn === 'function') pageFn(params);
    };
  }

  global.boardGridOptions = function (opts) {
    opts = opts || {};
    var merged = $.extend({}, BASE, opts);
    merged.onGridReady = chain(onGridReady, opts.onGridReady);
    merged.onRowDataUpdated = chain(onRowDataUpdated, opts.onRowDataUpdated);
    return merged;
  };
})(window);
