// 모달·알럿·패널이 모두 닫히면 남아 있는 스크롤 잠금(body.no-scroll, html/body inline overflow)을 되돌린다
(function ($) {
	'use strict';

	var OPEN_SELECTOR = [
		'.modal-container.is-active',
		'.side-panel.is-active',
		'.helpdesk-panel.is-active',
		'.header.header--open',
		'#fullmenuOverlay.show',
		'.popContainer:visible',
		'.popUp:visible'
	].join(', ');

	function release() {
		if ($(OPEN_SELECTOR).length) { return; }
		$('body').removeClass('no-scroll');
		$('html, body').css('overflow', '');
		$('.dimmed').removeClass('is-show');
	}

	// 닫기 처리(클릭·ESC)가 모두 끝난 뒤 판정해야 해서 이벤트 루프 뒤로 미룬다
	$(function () {
		$(document).on('click.scrollLockGuard keyup.scrollLockGuard', function () {
			setTimeout(release, 0);
		});
	});
})(jQuery);
