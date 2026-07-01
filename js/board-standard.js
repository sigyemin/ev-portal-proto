/* board-standard.js — 표준 게시판 공통 동작
   · table.std-board 의 열 머리글 클릭 정렬: 기본(정렬없음) → 내림차순 → 올림차순 → 기본 … 순환
   · 첨부/받기 등 .attach 열 또는 [data-nosort] 머리글은 정렬 제외
   · 숫자(.num)·용량(.size)·날짜(.date) 열은 숫자/날짜로, 그 외는 문자열(가나다)로 비교
*/
(function () {
  'use strict';

  function numVal(s) {
    var m = (s || '').replace(/[^0-9.]/g, '');
    var n = parseFloat(m);
    return isNaN(n) ? 0 : n;
  }
  function cellText(row, idx) {
    var c = row.cells[idx];
    return c ? (c.textContent || '').trim() : '';
  }

  function initTable(table) {
    var tbody = table.tBodies[0];
    if (!tbody || !table.tHead) return;
    var ths = table.tHead.rows[0].cells;
    var original = Array.prototype.slice.call(tbody.rows); // 기본 순서 보존

    function restore() { original.forEach(function (r) { tbody.appendChild(r); }); }

    function clearIndicators(except) {
      Array.prototype.forEach.call(ths, function (t) {
        if (t !== except) { t.classList.remove('sort-asc', 'sort-desc'); t._sortState = 0; }
      });
    }

    Array.prototype.forEach.call(ths, function (th, idx) {
      // 정렬 제외 열: 첨부/받기(.attach) 또는 data-nosort
      if (th.classList.contains('attach') || th.hasAttribute('data-nosort')) return;
      th.classList.add('sortable');
      th.tabIndex = 0;
      th.setAttribute('role', 'button');
      th._sortState = 0; // 0 기본 · 1 내림차순 · 2 올림차순

      var isNumeric = th.classList.contains('num') || th.classList.contains('size') || th.classList.contains('date');

      function apply() {
        clearIndicators(th);
        if (th._sortState === 0) { restore(); th.classList.remove('sort-asc', 'sort-desc'); return; }
        var rows = Array.prototype.slice.call(tbody.rows);
        rows.sort(function (ra, rb) {
          var a = cellText(ra, idx), b = cellText(rb, idx);
          var c = isNumeric ? (numVal(a) - numVal(b)) : a.localeCompare(b, 'ko');
          return th._sortState === 1 ? -c : c;     // 1=내림차순, 2=올림차순
        });
        rows.forEach(function (r) { tbody.appendChild(r); });
        th.classList.toggle('sort-desc', th._sortState === 1);
        th.classList.toggle('sort-asc', th._sortState === 2);
      }
      function cycle() { th._sortState = (th._sortState + 1) % 3; apply(); }

      th.addEventListener('click', cycle);
      th.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); cycle(); }
      });
    });
  }

  function init() {
    document.querySelectorAll('table.std-board').forEach(initTable);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
