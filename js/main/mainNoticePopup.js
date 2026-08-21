/*
 * 메인 공지 팝업 — 배너(JSP 렌더)와 게시 중인 팝업을 슬라이더 한 창에 모아 띄운다. 노출할 항목이 없으면 열지 않는다.
 * 조회 URL·팝업 도메인은 JSP 의 MAIN_CONFIG 로 주입받는다.
 */
(function ($) {
	'use strict';

	var COOKIE_PREFIX = 'pop';
	var BANNER_ID = 'Banner';
	var AUTOPLAY_DELAY = 5000;

	var noticeSwiper = null;
	var shownIds = [];
	var popupRows = [];
	var $bannerSource = $();

	function getCookie(name) {
		var target = name + '=';
		var parts = document.cookie.split(';');
		for (var i = 0; i < parts.length; i++) {
			var item = parts[i].replace(/^\s+/, '');
			if (item.indexOf(target) === 0) { return decodeURIComponent(item.substring(target.length)); }
		}
		return null;
	}

	// 내일 0시까지 유지되는 '오늘하루 열지않기' 쿠키
	function setTodayCookie(popupId) {
		var expires = new Date();
		expires.setDate(expires.getDate() + 1);
		expires.setHours(0, 0, 0, 0);
		document.cookie = COOKIE_PREFIX + popupId + '=on; expires=' + expires.toUTCString() + '; path=/';
	}

	function isHidden(popupId) {
		return getCookie(COOKIE_PREFIX + popupId) !== null;
	}

	function imageUrl(atchId) {
		return MAIN_CONFIG.urls.viewImage + '?atch_id=' + encodeURIComponent(atchId);
	}

	function moreButton(link) {
		return $('<a>', { href: link, target: '_blank', 'class': 'button button--large button--primary' })
			.append($('<span>', { 'class': 'button__label', text: '자세히보기' }));
	}

	function headingGroup(title) {
		return $('<div>', { 'class': 'heading-group' })
			.append($('<h2>', { 'class': 'heading-title' })
				.append($('<i>', { 'class': 'svg-icon symbol-electricity', 'aria-hidden': 'true' }))
				.append(document.createTextNode(title)));
	}

	// 내용이 있으면 제목·본문형, 이미지만 있으면 이미지형으로 그린다
	function buildSlide(row) {
		var title = $.trim(row.POPUP_NM || '');
		var content = $.trim(row.POPUP_CNTNS || '');
		var img = $.trim(row.IMG_NM || '');
		var link = $.trim(row.LINK || '');

		if (!title && !content && !img) { return null; }

		var $item = $('<div>', { 'class': 'main-notice__item' });

		if (content || (!img && title)) {
			if (title) { $item.append(headingGroup(title)); }
			var $content = $('<div>', { 'class': 'main-notice__content' });
			// 관리자가 등록한 HTML 본문
			if (content) { $content.html(content); }
			if (img) { $content.append($('<img>', { src: imageUrl(img), alt: title })); }
			if (link) { $content.append($('<br>')).append(moreButton(link)); }
			$item.append($content);
		} else {
			var $image = $('<div>', { 'class': 'main-notice__image' });
			var $img = $('<img>', { src: imageUrl(img), alt: title });
			$image.append(link ? $('<a>', { href: link, target: '_blank', title: title }).append($img) : $img);
			$item.append($image);
		}

		return $('<div>', { 'class': 'swiper-slide' }).append($item);
	}

	function initSwiper() {
		var $modal = $('#modalMainNotice');
		noticeSwiper = new Swiper($modal.find('.swiper-notice')[0], {
			loop: true,
			autoHeight: true,
			observer: true,
			observeParents: true,
			pagination: {
				el: $modal.find('.swiper-pagination')[0],
				clickable: true,
				renderBullet: function (index, className) {
					return '<button type="button" class="' + className + '" aria-label="' + (index + 1) + '번째 공지 보기" title="' + (index + 1) + '번째 공지 보기"></button>';
				}
			},
			autoplay: { delay: AUTOPLAY_DELAY, disableOnInteraction: false },
			navigation: {
				nextEl: $modal.find('.swiper-button-next--popup')[0],
				prevEl: $modal.find('.swiper-button-prev--popup')[0]
			},
			on: {
				resize: function () { this.updateAutoHeight(); }
			}
		});

		// 이미지 로딩이 끝나야 실제 높이가 잡힌다
		$modal.find('.swiper-notice img').each(function () {
			if (this.complete) {
				noticeSwiper.updateAutoHeight();
			} else {
				$(this).on('load', function () { noticeSwiper.updateAutoHeight(); });
			}
		});
	}

	function bindControls() {
		$('#modalMainNotice').on('click', '.swiper-button-toggle', function () {
			if (!noticeSwiper || !noticeSwiper.autoplay) { return; }
			var $button = $(this);
			if (noticeSwiper.autoplay.running) {
				noticeSwiper.autoplay.stop();
				$button.addClass('is-paused').attr('title', '자동 재생 시작');
			} else {
				noticeSwiper.autoplay.start();
				$button.removeClass('is-paused').attr('title', '자동 재생 정지');
			}
		});

		// 닫기는 ui-common 이 처리하고, 여기서는 노출 중인 공지에만 쿠키를 남긴다
		$('#btnNoticeTodayClose').on('click', function () {
			shownIds.forEach(setTodayCookie);
		});

		// 헤더 POPUP 버튼 — 닫은 팝업을 쿠키와 무관하게 다시 연다
		$('#btnMainNoticeOpen').show().on('click', function () {
			if (!render(true)) { alert('표시할 공지가 없습니다.'); }
		});
	}

	// 이미지만 있는 배너를 앞 슬라이드로, 제목·본문 공지를 뒤 슬라이드로 (각 묶음 안에서는 POPUP_ORD 유지)
	function orderRows(list) {
		var banners = [];
		var notices = [];
		list.forEach(function (row) {
			var content = $.trim(row.POPUP_CNTNS || '');
			var img = $.trim(row.IMG_NM || '');
			if (img && !content) { banners.push(row); } else { notices.push(row); }
		});
		return banners.concat(notices);
	}

	// 배너 슬라이드는 JSP 가 미리 그려둔 것을 원본으로 쓰고, 공지 슬라이드만 뒤에 붙인다
	// force 가 true 면 '오늘하루 열지않기' 쿠키를 무시한다(헤더 POPUP 버튼)
	function render(force) {
		var $wrapper = $('#mainNoticeList');

		if (noticeSwiper) {
			noticeSwiper.destroy(true, true);
			noticeSwiper = null;
		}
		$wrapper.empty();
		shownIds = [];

		if ($bannerSource.length && (force || !isHidden(BANNER_ID))) {
			$wrapper.append($bannerSource.clone());
			shownIds.push(BANNER_ID);
		}

		orderRows(popupRows).forEach(function (row) {
			if (!force && isHidden(row.POPUP_ID)) { return; }
			var $slide = buildSlide(row);
			if (!$slide) { return; }
			shownIds.push(row.POPUP_ID);
			$wrapper.append($slide);
		});

		if (!$wrapper.children().length) { return false; }

		initSwiper();
		openModal('#modalMainNotice');
		return true;
	}

	function load() {
		$.ajax({
			type: 'post',
			url: MAIN_CONFIG.urls.popupList,
			dataType: 'json',
			data: { popupDmnId: MAIN_CONFIG.popupDmnId },
			success: function (obj) {
				popupRows = (obj && obj.list) ? obj.list : [];
				render(false);
			},
			// 조회에 실패해도 배너는 띄운다
			error: function () { render(false); }
		});
	}

	$(function () {
		if (!$('#modalMainNotice').length) { return; }

		$bannerSource = $('#mainNoticeList').find('[data-notice-banner]').detach();
		bindControls();
		load();
	});
})(jQuery);
