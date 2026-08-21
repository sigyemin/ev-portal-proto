/**
 * board-download.js
 * 자료실 첨부파일 다운로드 공통 로직 (목록 다운로드 모달 + 상세 뷰 공유)
 *  - submitBoardDownload(masks, title, urls) : 1건 단일 / 2건+ zip 다운로드 제출
 *  - boardFileUtil : 용량·확장자·아이콘 표시 헬퍼
 * URL 은 컨텍스트 경로 하드코딩 금지 — 호출하는 JSP 가 c:url 로 생성해 urls 인자로 전달한다.
 */
(function (window, $) {
  'use strict';

  // 바이트 → 표시용 용량
  function formatBytes(bytes) {
    var n = Number(bytes) || 0;
    if (n <= 0) return '-';
    if (n < 1024) return n + ' B';
    if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB';
    return (n / (1024 * 1024)).toFixed(1) + ' MB';
  }

  // 파일명 → 확장자(소문자)
  function extOf(name) {
    name = name || '';
    var i = name.lastIndexOf('.');
    return i > -1 ? name.substring(i + 1).toLowerCase() : '';
  }

  // 확장자 → svg-icon 클래스
  function iconClass(ext) {
    if (ext === 'pdf') return 'file-pdf';
    if (ext === 'xls' || ext === 'xlsx') return 'file-xlsx';
    if (ext === 'hwp' || ext === 'hwpx') return 'file-hwp';
    return 'file';
  }

  window.boardFileUtil = {
    formatBytes: formatBytes,
    extOf: extOf,
    iconClass: iconClass
  };

  // 실제 다운로드 제출 (1건: 단일 GET / 2건 이상: hidden form + iframe 으로 zip POST)
  window.submitBoardDownload = function (masks, title, urls) {
    masks = masks || [];
    if (!masks.length || !urls) return;

    if (masks.length === 1) {
      window.location.href = urls.single + '?FILE_MASK=' + encodeURIComponent(masks[0]);
      return;
    }
    if (!$('#boardDlFrame').length) {
      $('<iframe>', { name: 'boardDlFrame', id: 'boardDlFrame' }).css('display', 'none').appendTo('body');
    }
    var zipNm = (title || '첨부파일').replace(/[\\\/:*?"<>|]/g, '_') + '.zip';
    var $form = $('<form>', { method: 'post', action: urls.multi, target: 'boardDlFrame' });
    for (var i = 0; i < masks.length; i++) {
      $form.append($('<input>', { type: 'hidden', name: 'file_mask', value: masks[i] }));
    }
    $form.append($('<input>', { type: 'hidden', name: 'zip_nm', value: zipNm }));
    $form.appendTo('body').submit();
    $form.remove();
  };
})(window, jQuery);
