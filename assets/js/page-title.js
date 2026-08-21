/** 화면 제목 보정 — 서버가 정적으로 읽지 못한 제목(EL 로 채워지는 h1)을 본문에서 가져온다 */
(function () {
  var SITE_NAME = '무공해차 통합누리집';

  function apply() {
    var heading = document.querySelector('.page-header__subject .heading-subject');
    if (!heading) return;

    var name = (heading.textContent || '').replace(/\s+/g, ' ').trim();
    if (!name || document.title.indexOf(name) === 0) return;

    document.title = name + ' - ' + SITE_NAME;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', apply);
  } else {
    apply();
  }
})();
