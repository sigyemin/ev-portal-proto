// 납품 file-attach 컴포넌트 동작 — 선택한 파일명 표시, is-active 전환, 삭제 버튼
(function ($) {
	'use strict';

	var EMPTY_TEXT = '선택된 파일 없음';

	function syncName($input) {
		var $wrap = $input.closest('.file-attach');
		var name = '';
		var files = $input[0] && $input[0].files;
		if (files && files.length) {
			name = files.length > 1 ? files[0].name + ' 외 ' + (files.length - 1) + '건' : files[0].name;
		} else {
			// files 미지원 브라우저 — value 의 경로를 잘라 파일명만 남긴다
			name = String($input.val() || '').replace(/^.*[\\\/]/, '');
		}
		$wrap.find('.file-input__name').first().text(name || EMPTY_TEXT);
		$wrap.toggleClass('is-active', !!name);
	}

	$(function () {
		$(document).on('change', '.file-attach .file-input', function () {
			syncName($(this));
		});

		// 삭제는 input 값을 비운 뒤 change 를 다시 흘려 화면 표기와 페이지 검증을 함께 갱신한다
		$(document).on('click', '.file-attach__input .button--delete', function (e) {
			e.preventDefault();
			var $input = $(this).closest('.file-attach').find('.file-input').first();
			if (!$input.length) return;
			$input.val('');
			$input.trigger('change');
		});

		// 브라우저 값 복원(뒤로가기 등)으로 이미 파일이 들어있는 경우 초기 표기를 맞춘다
		$('.file-attach .file-input').each(function () {
			if ($(this).val()) syncName($(this));
		});
	});
})(jQuery);
