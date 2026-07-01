/* home-news.js — 메인 '새소식' 탭(전체/공지사항/보도자료/홍보자료)
   · 탭 클릭 시 페이지 이동 없이 해당 카테고리 카드만 표시
   · 최신순(날짜 내림차순) 정렬 → 가장 최신 정보가 왼쪽에 배치
   · 각 카드 클릭 시 해당 게시글 상세(notice-detail.html?id=)로 이동
   · 데이터는 js/news-data.js(window.NEWS_ITEMS)를 공유 → 상세/게시판과 동일 출처
*/
(function () {
  'use strict';
  var grid = document.getElementById('m02NewsGrid');
  var tabs = Array.prototype.slice.call(document.querySelectorAll('#m02NewsTabs [data-news-tab]'));
  if (!grid || !tabs.length || !window.NEWS_ITEMS) return;

  var LABEL = { notice: '공지사항', press: '보도자료', promo: '홍보자료' };
  var ALL = Object.values(window.NEWS_ITEMS);
  var CAL = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/></svg>';

  function esc(s){ return String(s).replace(/[&<>"]/g, function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }

  function render(cat) {
    var list = ALL.filter(function (n) { return cat === 'all' || n.cat === cat; })
      .sort(function (a, b) { return (b.date || '').localeCompare(a.date || ''); })  // 최신순(왼쪽이 최신)
      .slice(0, 3);
    grid.innerHTML = list.map(function (n) {
      return '<a class="m02-news-card" href="notice-detail.html?id=' + n.id + '">' +
        '<span class="m02-news-tag">' + (LABEL[n.cat] || '소식') + '</span>' +
        '<h3>' + esc(n.title) + '</h3>' +
        '<p>' + esc(n.desc) + '</p>' +
        '<span class="m02-news-date">' + CAL + (n.date || '') + '</span>' +
        '</a>';
    }).join('');
  }

  tabs.forEach(function (btn) {
    btn.addEventListener('click', function () {
      tabs.forEach(function (b) { var on = b === btn; b.classList.toggle('active', on); b.setAttribute('aria-selected', on ? 'true' : 'false'); });
      render(btn.getAttribute('data-news-tab'));
    });
  });

  render('all');
})();
