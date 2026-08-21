/*
 * 메인 화면 스크립트 — 탭·슬라이더, AI 헬프데스크(SSE), 보조금 계산기 보강, 새소식·FAQ·차량정보 조회.
 * URL 은 JSP 의 MAIN_CONFIG / SUBSI_CALC_CONFIG 로 주입받는다.
 */
(function ($) {
	'use strict';

	var CHAT_THREAD_PREFIX = 'GRAPHIO_CHAT_THREAD_ID_';
	var NEWS_PER_TAB = 3;
	var FAQ_COUNT = 5;
	var FAQ_CATEGORY = { '1': '충전소 이용', '2': '완속충전기 설치지원 사업', '3': '수소충전소 인프라 사업', '4': '지킴이' };

	// ============================================================
	// 탭 (그룹별 독립 동작)
	// ui-common.js 는 페이지 내 모든 tab__item/tab-content 를 한 묶음으로 처리해
	// 그룹이 둘 이상이면 다른 그룹의 선택이 풀린다. 클릭 후 그룹별 상태를 다시 적용한다.
	// ============================================================
	var tabState = [];

	// 탭 그룹 컨테이너: 서비스 유형 선택(main-service) + 새소식 탭(tab__list)
	function tabGroups() {
		return $('.main-wrapper .main-service, .main-wrapper .tab__list');
	}

	function applyTabState() {
		tabGroups().each(function (gi) {
			var $list = $(this);
			var currentId = tabState[gi];
			if (!currentId) { return; }
			$list.find('.tab__item[role="tab"]').each(function () {
				var $item = $(this);
				var selected = $item.attr('id') === currentId;
				$item.toggleClass('tab__item--selected', selected).attr('aria-selected', selected ? 'true' : 'false');
				var $button = $item.find('.tab__button');
				$button.find('.ir-pm').remove();
				if (selected) { $button.append($('<i>', { 'class': 'ir-pm', text: ' 선택됨' })); }
				var panelId = $item.attr('aria-controls');
				if (panelId) { $('#' + panelId).toggleClass('tab-content--current', selected); }
			});
		});
	}

	function initTabs() {
		tabGroups().each(function (gi) {
			var $selected = $(this).find('.tab__item--selected').first();
			tabState[gi] = $selected.length ? $selected.attr('id') : $(this).find('.tab__item[role="tab"]').first().attr('id');
		});

		$(document).on('click', '.main-wrapper .tab__item[role="tab"] .tab__button', function () {
			var $item = $(this).closest('.tab__item');
			var gi = tabGroups().index($item.closest('.main-service, .tab__list'));
			if (gi < 0) { return; }
			tabState[gi] = $item.attr('id');
			applyTabState();
			refreshVisibleSwipers();
		});
	}

	// ============================================================
	// 유형별 서비스 슬라이더
	// ============================================================
	function initSwiper(element) {
		if (!element || !(element instanceof Element)) { return null; }
		if (element.swiperInstance) {
			element.swiperInstance.update();
			return element.swiperInstance;
		}
		var parentTabPanel = element.closest('.tab-content');
		if (parentTabPanel && window.getComputedStyle(parentTabPanel).display === 'none') { return null; }

		var container = element.closest('.swiper-container') || element.parentElement;

		// 슬라이드가 적으면 loop 가 끊겨 보여 복제로 채운다 (퍼블리싱 동작)
		var wrapper = element.querySelector('.swiper-wrapper');
		var slides = wrapper ? wrapper.querySelectorAll('.swiper-slide') : [];
		if (slides.length > 0 && slides.length < 10) {
			var repeatCount = Math.ceil(10 / slides.length);
			for (var i = 0; i < repeatCount; i++) {
				Array.prototype.forEach.call(slides, function (slide) {
					wrapper.appendChild(slide.cloneNode(true));
				});
			}
		}

		element.swiperInstance = new Swiper(element, {
			loop: true,
			observer: true,
			observeParents: true,
			spaceBetween: 12,
			slidesPerView: 'auto',
			centeredSlides: false,
			loopAdditionalSlides: 5,
			loopedSlides: 5,
			watchOverflow: false,
			keyboard: { enabled: true },
			breakpoints: {
				0: { slidesPerView: 'auto' },
				375: { slidesPerView: 'auto' },
				480: { slidesPerView: 2 },
				768: { slidesPerView: 3 },
				1024: { slidesPerView: 4 },
				1280: { slidesPerView: 5 }
			},
			navigation: {
				nextEl: container.querySelector('.swiper-button-next--service'),
				prevEl: container.querySelector('.swiper-button-prev--service')
			}
		});
		return element.swiperInstance;
	}

	function refreshVisibleSwipers() {
		setTimeout(function () {
			document.querySelectorAll('.swiper--service').forEach(function (containerEl) {
				var parentTabPanel = containerEl.closest('.tab-content');
				if (parentTabPanel && window.getComputedStyle(parentTabPanel).display === 'none') { return; }
				var swiper = initSwiper(containerEl);
				if (swiper) {
					swiper.update();
					if (swiper.navigation) { swiper.navigation.update(); }
				}
			});
		}, 50);
	}

	function initServiceSwipers() {
		document.querySelectorAll('.swiper--service').forEach(initSwiper);
	}

	// 지정 영역으로 스크롤 이동 (고정 헤더 높이만큼 보정)
	function scrollToSection(target) {
		if (!target) { return; }
		window.scrollTo({
			top: target.getBoundingClientRect().top + window.pageYOffset - 112,
			behavior: 'smooth'
		});
	}

	// AI 헬프데스크 영역으로 스크롤 이동
	function initScrollButtons() {
		$('.main-service__button--move').on('click', function () {
			scrollToSection(document.querySelector($(this).attr('data-target-scroll')));
		});
	}

	// 보조금 도우미 탭 진입 시 이용 안내 알럿
	function initConsultNotice() {
		$(':radio[name="consultMode1"]').on('change', function () {
			if (!this.checked || this.value !== 'subsidy') { return; }
			if (typeof window.showInfoNotice === 'function') { window.showInfoNotice(); }
		});
	}

	function queryParam(name) {
		var matched = new RegExp('[?&]' + name + '=([^&#]*)').exec(window.location.search);
		return matched ? decodeURIComponent(matched[1].replace(/\+/g, ' ')) : '';
	}

	// 외부 링크(main.do?chatType=...&q=질문#AIhelpdesk) 진입 시 상담 유형 선택 → 해당 영역 이동 → q 가 있으면 바로 질문 전송
	function initHelpdeskDeepLink() {
		var type = queryParam('chatType');
		var question = queryParam('q');
		if (!type && !question) { return; }

		if (type) {
			var $radio = $(':radio[name="consultMode1"]').filter(function () { return this.value === type; });
			if (!$radio.length) { return; }
			$radio.prop('checked', true).trigger('change');
		}

		var target = document.querySelector('#AIhelpdesk');
		whenScrollUnlocked(function () {
			scrollToSection(target);
			if (question) { sendChat(question); }
		});
	}

	// 이용 안내 알럿·공지 팝업이 열려 있으면 스크롤이 잠겨 이동이 무시된다 — 모두 닫힌 뒤 실행한다
	// 공지 팝업은 조회 후 열려 진입 직후 판정할 수 없어 주기적으로 확인한다
	function whenScrollUnlocked(callback) {
		var waited = 0;
		var timer = setInterval(function () {
			waited += 200;
			if ($('.modal-container.is-active').length || $('body').hasClass('no-scroll')) { return; }
			// 팝업 조회 응답 전이면 잠시 더 기다린다
			if (waited < 1000) { return; }
			clearInterval(timer);
			callback();
		}, 200);
	}

	// ============================================================
	// AI 헬프데스크 (chatStream.do SSE 중계)
	// ============================================================
	var chatStreaming = {};

	function chatType() {
		return $(':radio[name="consultMode1"]:checked').val() || 'helpConsult';
	}

	function getThreadId(type) {
		return sessionStorage.getItem(CHAT_THREAD_PREFIX + type) || '';
	}

	function setThreadId(type, threadId) {
		sessionStorage.setItem(CHAT_THREAD_PREFIX + type, threadId);
	}

	function appendChatBubble(type, kind, text) {
		var $inner = $('<div>', { 'class': 'chat__inner', text: text || '' });
		var $badge = $('<div>', { 'class': 'chat__badge' });
		if (kind === 'user') {
			$badge.append($('<span>', { 'class': 'chat__label hidden', text: '나의 질문' }));
		} else {
			$badge.append($('<i>', { 'class': 'svg-icon ai-sparkle', 'aria-hidden': 'true' }));
			$badge.append($('<span>', { 'class': 'chat__label', text: kind === 'error' ? '오류' : 'AI 답변' }));
		}
		var $message = $('<div>', { 'class': 'chat__message chat__message--' + (kind === 'user' ? 'user' : 'bot') })
			.append($('<div>', { 'class': 'chat__bubble' }).append($badge).append($inner));

		var $content = $('#mainChatContent');
		AiChatRender.getThread($content[0], type).appendChild($message[0]);
		$content.scrollTop($content[0].scrollHeight);
		return $inner;
	}

	function sendChat(message) {
		var text = $.trim(message || '');
		var type = chatType();
		if (!text || chatStreaming[type]) { return; }
		chatStreaming[type] = true;
		$('#mainChatWrapper').show();
		AiChatRender.showThread($('#mainChatContent')[0], type);
		appendChatBubble(type, 'user', text);
		var $botInner = null;

		fetch(MAIN_CONFIG.urls.chatStream, {
			method: 'POST',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			body: 'chatType=' + encodeURIComponent(type)
				+ '&message=' + encodeURIComponent(text)
				+ '&threadId=' + encodeURIComponent(getThreadId(type)),
			cache: 'no-store'
		}).then(function (res) {
			var reader = res.body.getReader();
			var decoder = new TextDecoder('utf-8');
			var buffer = '';

			function handleEvent(event) {
				if (event.type === 'token') {
					if (!$botInner) { $botInner = appendChatBubble(type, 'bot', ''); }
					AiChatRender.appendToken($botInner[0], event.content);
					var $content = $('#mainChatContent');
					$content.scrollTop($content[0].scrollHeight);
				} else if (event.type === 'message' || event.type === 'chart') {
					if (!$botInner) { $botInner = appendChatBubble(type, 'bot', ''); }
					AiChatRender.appendMessage($botInner[0], event);
				} else if (event.type === 'error') {
					appendChatBubble(type, 'error', event.content);
				} else if (event.type === 'done') {
					if (event.thread_id) { setThreadId(type, event.thread_id); }
					if ($botInner) {
						AiChatRender.finalize($botInner[0]);
						var $done = $('#mainChatContent');
						$done.scrollTop($done[0].scrollHeight);
					}
				}
			}

			function flush(chunk) {
				chunk.split('\n').forEach(function (line) {
					if (line.indexOf('data:') !== 0) { return; }
					var event;
					try { event = JSON.parse(line.slice(5).trim()); } catch (e) { return; }
					handleEvent(event);
				});
			}

			function pump() {
				return reader.read().then(function (result) {
					if (result.done) {
						flush(buffer);
						chatStreaming[type] = false;
						return;
					}
					buffer += decoder.decode(result.value, { stream: true });
					var idx;
					while ((idx = buffer.indexOf('\n\n')) >= 0) {
						flush(buffer.slice(0, idx));
						buffer = buffer.slice(idx + 2);
					}
					return pump();
				});
			}
			return pump();
		}).catch(function () {
			appendChatBubble(type, 'error', '답변을 가져오지 못했습니다. 잠시 후 다시 시도해 주세요.');
			chatStreaming[type] = false;
		});
	}

	// 상담 유형별 추천 태그 — 정의는 aiHelpdeskTags.js
	function renderHelpdeskTags() {
		if (typeof renderAiHelpdeskTags !== 'function') { return; }
		renderAiHelpdeskTags($('#mainHelpdeskTags'), chatType());
	}

	function initHelpdesk() {
		$('.main-section--helpdesk .helpdesk-search .button--search').on('click', function () {
			var $input = $('#search-total');
			sendChat($input.val());
			$input.val('');
		});
		$('#search-total').on('keydown', function (e) {
			if (e.key === 'Enter') {
				e.preventDefault();
				sendChat($(this).val());
				$(this).val('');
			}
		});
		$('.main-section--helpdesk .helpdesk-search .button--delete').on('click', function () {
			$('#search-total').val('').focus();
		});
		// 상담 유형 전환 시 추천 태그·예시 문구 갱신 + 해당 유형의 대화 스레드만 표시
		function syncConsultMode() {
			renderHelpdeskTags();
			if (typeof aiHelpdeskPlaceholder === 'function') {
				$('#search-total').attr('placeholder', aiHelpdeskPlaceholder(chatType()));
			}
			var $content = $('#mainChatContent');
			if ($content.length) {
				AiChatRender.showThread($content[0], chatType());
				$content.scrollTop($content[0].scrollHeight);
			}
		}
		syncConsultMode();
		$(':radio[name="consultMode1"]').on('change', syncConsultMode);

		$('.main-section--helpdesk .helpdesk-search__related').on('click', '.tag', function (e) {
			e.preventDefault();
			sendChat($(this).attr('data-q') || $(this).find('.tag__label').text().replace(/^#/, ''));
		});
		$('#mainChatSend').on('click', function () {
			var $input = $('#mainChatInput');
			sendChat($input.val());
			$input.val('');
		});
		$('#mainChatInput').on('keydown', function (e) {
			if (e.key === 'Enter' && !e.shiftKey) {
				e.preventDefault();
				sendChat($(this).val());
				$(this).val('');
			}
		});
		$('#mainChatWrapper .chat__close .button--close').on('click', function () {
			$('#mainChatWrapper').hide();
		});
	}

	// ============================================================
	// 보조금 계산기 — 계산 로직은 subsiSimulCalc.js, 메인 전용 입력만 보강
	// ============================================================
	function initCalculator() {
		// 구매자 유형 라디오 → 신청유형(req_kind)
		$(':radio[name="req_kind_sel"]').on('change', function () {
			$('#req_kind').val($(this).val()).trigger('change');
		});

		// 기준연도·사회계층 코드
		$.ajax({
			type: 'POST',
			url: MAIN_CONFIG.urls.calcInitData,
			dataType: 'json',
			data: { car_type: '11' },
			success: function (data) {
				if (data.sYear) { $('#s_year').val(data.sYear); }
				var $social = $('#social_kind');
				$.each(data.socialKindList || [], function (i, r) {
					$social.append($('<option>', { value: r.CODE, text: r.CODE_NM }));
				});
			}
		});
	}

	// ============================================================
	// 새소식 (공지사항·보도자료·홍보자료 최신 3건 / 전체 탭은 3개 게시판 통합 최신 3건)
	// ============================================================
	var NEWS_BOARDS = [
		{ blbdId: 'notice', boardType: 'notice', label: '공지사항', target: '#newsListNotice', listUrlKey: 'noticeList' },
		{ blbdId: 'bbs', boardType: 'report', label: '보도자료', target: '#newsListReport', listUrlKey: 'reportList' },
		{ blbdId: 'promo', boardType: 'promo', label: '홍보자료', target: '#newsListPromo', listUrlKey: 'promoList' }
	];

	function stripTags(html) {
		return $.trim(String(html == null ? '' : html).replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' '));
	}

	function newsItem(row, board) {
		var $link = $('<a>', {
			href: MAIN_CONFIG.urls.boardView + '?ARTC_ID=' + encodeURIComponent(row.ARTC_ID) + '&boardType=' + board.boardType,
			'class': 'column-list__link',
			title: (row.TITL || '') + ' 상세보기'
		});
		$link.append($('<div>', { 'class': 'column-list__heading' })
			.append($('<div>', { 'class': 'column-list__category' })
				.append($('<span>', { 'class': 'badge badge--outline badge--primary', text: board.label })))
			.append($('<strong>', { 'class': 'column-list__title', text: row.TITL || '' })));
		$link.append($('<div>', { 'class': 'column-list__content', text: stripTags(row.ARTC_CNTNS) }));
		$link.append($('<div>', { 'class': 'data-info' })
			.append($('<dl>', { 'class': 'data-info__list' })
				.append($('<dt>', { 'class': 'data-info__title' })
					.append($('<i>', { 'class': 'svg-icon calendar' }))
					.append(document.createTextNode('등록일')))
				.append($('<dd>', { 'class': 'data-info__text', text: row.INS_DT || '' }))));
		return $('<li>', { 'class': 'column-list__item' }).append($link);
	}

	function renderNews($list, rows) {
		$list.empty();
		if (!rows.length) {
			$list.append($('<li>', { 'class': 'column-list__item', text: '조회된 내용이 없습니다.' }));
			return;
		}
		rows.forEach(function (r) { $list.append(newsItem(r, r._board)); });
	}

	function loadNews() {
		var merged = [];
		var pending = NEWS_BOARDS.length;

		NEWS_BOARDS.forEach(function (board) {
			$.ajax({
				type: 'POST',
				url: MAIN_CONFIG.urls.bbsList,
				dataType: 'json',
				global: false,
				data: { BLBD_ID: board.blbdId, spageNo: 1, srecordCountPerPage: NEWS_PER_TAB, spageSize: 1 },
				success: function (obj) {
					var rows = (obj && obj.list) ? obj.list : [];
					rows.forEach(function (r) { r._board = board; });
					renderNews($(board.target), rows);
					merged = merged.concat(rows);
				},
				error: function () {
					renderNews($(board.target), []);
				},
				complete: function () {
					if (--pending > 0) { return; }
					// 전체 탭: 3개 게시판 중 등록일(동일 시 게시글 ID) 최신 3건
					merged.sort(function (a, b) {
						if (a.INS_DT === b.INS_DT) { return Number(b.ARTC_ID) - Number(a.ARTC_ID); }
						return String(b.INS_DT).localeCompare(String(a.INS_DT));
					});
					renderNews($('#newsListAll'), merged.slice(0, NEWS_PER_TAB));
				}
			});
		});

		// 탭 전환 시 [바로가기] 대상 게시판도 함께 변경
		$(document).on('click', '#tabNews01 .tab__button, #tabNews02 .tab__button, #tabNews03 .tab__button, #tabNews04 .tab__button', function () {
			var id = $(this).closest('.tab__item').attr('id');
			var key = { tabNews02: 'noticeList', tabNews03: 'reportList', tabNews04: 'promoList' }[id] || 'noticeList';
			$('#newsMoreLink').attr('href', MAIN_CONFIG.urls[key]);
		});
	}

	// FAQ 항목은 조회 후 그려져 ui-common.js 의 로드 시점 바인딩에서 빠진다 — document 위임으로 토글
	// 화살표는 .accordion-header 의 ::after 라 버튼 밖이다 — 헤더 전체를 클릭 대상으로 잡는다
	// (ui-common 바인딩이 함께 걸린 경우 이중 토글로 상쇄되지 않도록 애니메이션 중이면 무시)
	$(document).on('click', '#faqAccordion .accordion-header', function () {
		var $item = $(this).closest('.accordion-item');
		var $collapse = $item.find('.accordion-collapse');
		if ($collapse.is(':animated')) { return; }
		$collapse.slideToggle(300, function () {
			$item.toggleClass('accordion-item--expanded');
		});
	});

	// ============================================================
	// 자주 묻는 질문 (조회수 상위 5건)
	// ============================================================
	function loadFaq() {
		$.ajax({
			type: 'POST',
			url: MAIN_CONFIG.urls.bbsList,
			dataType: 'json',
			global: false,
			data: { BLBD_ID: 'faq', spageNo: 1, srecordCountPerPage: FAQ_COUNT, spageSize: 1, ORDER_BY: 'hit' },
			success: function (obj) {
				var list = (obj && obj.list) ? obj.list : [];
				var $acc = $('#faqAccordion').empty();
				if (!list.length) {
					$acc.append($('<p>', { 'class': 'data-none__title', text: '조회된 내용이 없습니다.' }));
					return;
				}
				list.forEach(function (row) {
					var headerId = 'mainFaqHeader' + row.ARTC_ID;
					var panelId = 'mainFaqPanel' + row.ARTC_ID;
					var category = FAQ_CATEGORY[row.SMLCLS10] || FAQ_CATEGORY['1'];
					var $item = $('<div>', { 'class': 'accordion-item' });
					$item.append($('<h3>', { 'class': 'accordion-header', style: 'cursor:pointer;' })
						.append($('<button>', {
							type: 'button', id: headerId, 'class': 'accordion-button',
							'aria-controls': panelId, text: '[' + category + '] ' + (row.TITL || '')
						})));
					// 답변은 관리자 작성 HTML 원문 렌더 (FAQ 목록 화면과 동일)
					$item.append($('<div>', { id: panelId, 'class': 'accordion-collapse', 'aria-labelledby': headerId, style: 'display:none;' })
						.append($('<div>', { 'class': 'accordion-content' }).html(row.ARTC_CNTNS == null ? '' : row.ARTC_CNTNS)));
					$acc.append($item);
				});
			}
		});
	}

	// ============================================================
	// 보조금 · 차량 정보 (지급대상 차종)
	// ============================================================
	function priceNum(row) {
		var n = String(row.SALE_PRICE || '').replace(/[^\d]/g, '');
		return n ? parseInt(n, 10) : 0;
	}

	function priceText(row) {
		var text = $.trim(String(row.SALE_PRICE || ''));
		return text || '-';
	}

	// 주행거리는 "(상온) 435km (저온) 368km" 한 줄로 들어와 저온 앞에서 줄을 나눈다
	function rangeHtml(value) {
		var text = $.trim(String(value == null ? '' : value));
		if (!text) { return '-'; }
		return $('<div>').text(text).html().replace(/\s*(\(저온\))/, '<br />$1');
	}

	function vehicleCard(row) {
		var $link = $('<a>', {
			href: MAIN_CONFIG.urls.vehicleListPage,
			'class': 'column-list__link',
			title: (row.MADE_COMPANY_NM || '') + ' ' + (row.MODEL || '') + ' 보조금 및 차량정보 보기'
		});
		$link.append($('<div>', { 'class': 'column-list__heading' })
			.append($('<div>', { 'class': 'column-list__category', text: row.MADE_COMPANY_NM || '' }))
			.append($('<strong>', { 'class': 'column-list__title', text: row.MODEL || '' })));

		var $dl = $('<dl>', { 'class': 'definition-list' });
		$dl.append($('<dt>', { 'class': 'definition-list__label', text: '국비지원금' }));
		$dl.append($('<dd>', { 'class': 'definition-list__description' })
			.append($('<b>', { 'class': 'text-emphasis', text: priceText(row) })));
		$dl.append($('<dt>', { 'class': 'definition-list__label', text: '주행거리(1회 충전시)' }));
		$dl.append($('<dd>', { 'class': 'definition-list__description', html: rangeHtml(row.CHARGER_DISTANCE) }));
		$dl.append($('<dt>', { 'class': 'definition-list__label', text: '배터리' }));
		$dl.append($('<dd>', { 'class': 'definition-list__description', text: row.BATTERY || '-' }));

		$link.append($('<div>', { 'class': 'column-list__content' }).append($dl));
		return $('<li>', { 'class': 'column-list__item' }).append($link);
	}

	function loadVehicles() {
		// 전기승용(1C) 보조금 상위 4건
		$.ajax({
			type: 'POST',
			url: MAIN_CONFIG.urls.targetVehicle,
			dataType: 'json',
			global: false,
			data: { spageId: 'main', spageNo: '1', srecordCountPerPage: '99999', spageSize: '10', carType: '1C', schCompany: 'ALL', schModel: 'ALL' },
			success: function (data) {
				var rows = (data && data.list) || [];
				var sorted = rows.slice().sort(function (a, b) { return priceNum(b) - priceNum(a); });
				var $list = $('#vehicleList').empty();
				if (!sorted.length) {
					$list.append($('<li>', { 'class': 'column-list__item', text: '조회된 내용이 없습니다.' }));
					return;
				}
				sorted.slice(0, 4).forEach(function (r) { $list.append(vehicleCard(r)); });
			},
			error: function () {
				$('#vehicleList').empty().append($('<li>', { 'class': 'column-list__item', text: '조회된 내용이 없습니다.' }));
			}
		});
	}

	$(function () {
		initTabs();
		initServiceSwipers();
		initScrollButtons();
		initHelpdesk();
		initConsultNotice();
		initHelpdeskDeepLink();
		initCalculator();
		loadNews();
		loadFaq();
		loadVehicles();
	});
})(jQuery);
