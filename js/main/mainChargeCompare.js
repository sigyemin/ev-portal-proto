/*
 * 메인 충전 요금 비교 — 사업자별 단가(전기차 충전요금 안내와 동일 원천)를 카드비교·상세보기 두 탭으로 제공한다.
 * 조회 URL 은 JSP 의 MAIN_CONFIG 로 주입받는다.
 */
(function ($) {
	'use strict';

	var STAGES = [
		{ key: 's1', num: 1, label: '완속' },
		{ key: 's2', num: 2, label: '중속' },
		{ key: 's3', num: 3, label: '급속' },
		{ key: 's4', num: 4, label: '급속(100~200kW)' },
		{ key: 's5', num: 5, label: '초급속' }
	];

	// 카드·상세 요약에 노출할 대표 3구간
	var SUMMARY_STAGES = ['s3', 's5', 's1'];

	var ICON_COLORS = ['enterprise-info__icon--color1', 'enterprise-info__icon--color2', 'enterprise-info__icon--color3', 'enterprise-info__icon--color4'];

	var busiList = [];
	var selectedBids = {};
	var currentBid = null;
	var cardSwiper = null;
	var detailSwiper = null;

	function feeGb() {
		return $('#chargeFeeGb').val() || 'M';
	}

	function stageKey() {
		return $('#chargeStage').val() || 's3';
	}

	function stageNum(key) {
		for (var i = 0; i < STAGES.length; i++) {
			if (STAGES[i].key === key) { return STAGES[i].num; }
		}
		return 3;
	}

	function feeOf(row, gb, key) {
		var v = row[gb + '_S' + stageNum(key)];
		var n = Number(v);
		return (v === null || v === undefined || v === '' || isNaN(n) || n <= 0) ? null : n;
	}

	function fmtFee(v) {
		if (v === null || v === undefined) { return '-'; }
		return (Math.round(Number(v) * 10) / 10).toLocaleString('ko-KR', { maximumFractionDigits: 1 });
	}

	function fmtCount(v) {
		return Number(v || 0).toLocaleString('ko-KR');
	}

	// 사업자 아이콘 약칭 — 앞쪽 괄호·기호를 걷어낸 첫 2글자 대문자 ((주)동양 → 동양)
	function iconText(name) {
		var nm = $.trim(name || '').replace(/^(?:\([^)]*\)|\[[^\]]*\]|（[^）]*）|[^0-9A-Za-z가-힣])+/g, '');
		return $.trim(nm).substring(0, 2).toUpperCase();
	}

	function selectedRows() {
		return busiList.filter(function (row) { return selectedBids[row.BID]; });
	}

	// 선택한 요금구분·속도로 값이 있는 사업자만 저가순 정렬
	function pricedRows() {
		var gb = feeGb();
		var key = stageKey();
		return selectedRows()
			.filter(function (row) { return feeOf(row, gb, key) !== null; })
			.sort(function (a, b) { return feeOf(a, gb, key) - feeOf(b, gb, key); });
	}

	// ── 사업자 선택 드롭다운 ──────────────────────────────────────────
	function renderBusiDropdown() {
		var $list = $('#chargeBusiList').empty();

		$list.append($('<li>', { 'class': 'dropdown-container__item dropdown-container__item--all' })
			.append(buildCheckbox('chargeBusiAll', '', '전체', true)));

		busiList.forEach(function (row, i) {
			var $item = $('<li>', { 'class': 'dropdown-container__item dropdown-container__item--selected' });
			$item.append(buildCheckbox('chargeBusi' + i, row.BID, row.BNM, true));
			$list.append($item);
		});

		updateBusiLabel();
	}

	function buildCheckbox(id, value, label, checked) {
		var $wrap = $('<div>', { 'class': 'checkbox' });
		var $input = $('<input>', { type: 'checkbox', id: id, 'class': 'checkbox__input' });
		if (value) { $input.attr('data-bid', value); }
		if (checked) { $input.prop('checked', true); }
		$wrap.append($input);
		$wrap.append($('<label>', { 'for': id, 'class': 'checkbox__label' }).append($('<span>', { text: label == null ? '' : String(label) })));
		return $wrap;
	}

	function updateBusiLabel() {
		$('#chargeBusiLabel').text('충전기 사업자 선택(' + fmtCount(selectedRows().length) + ')');
	}

	function syncSelectedFromDropdown() {
		selectedBids = {};
		$('#chargeBusiList').find('input[data-bid]').each(function () {
			var $input = $(this);
			var bid = $input.attr('data-bid');
			if ($input.prop('checked')) { selectedBids[bid] = true; }
			$input.closest('.dropdown-container__item').toggleClass('dropdown-container__item--selected', $input.prop('checked'));
		});
		var total = $('#chargeBusiList').find('input[data-bid]').length;
		$('#chargeBusiAll').prop('checked', total > 0 && selectedRows().length === total);
		updateBusiLabel();
	}

	// ── 카드비교 탭 ───────────────────────────────────────────────────
	function enterpriseInfo(row, colorIndex) {
		var $info = $('<div>', { 'class': 'enterprise-info' });
		var $icon = $('<span>', { 'class': 'enterprise-info__icon', text: iconText(row.BNM) });
		if (colorIndex !== null && colorIndex !== undefined) { $icon.addClass(ICON_COLORS[colorIndex % ICON_COLORS.length]); }
		$info.append($icon);
		$info.append($('<strong>', { 'class': 'enterprise-info__title', text: row.BNM == null ? '' : String(row.BNM) }));
		if (Number(row.CHGER_CNT) > 0) {
			$info.append($('<p>', { 'class': 'enterprise-info__subtitle', text: '전국 ' + fmtCount(row.CHGER_CNT) + '기' }));
		}
		return $info;
	}

	function stageLabel() {
		var key = stageKey();
		for (var i = 0; i < STAGES.length; i++) {
			if (STAGES[i].key === key) { return STAGES[i].label; }
		}
		return '';
	}

	function renderCards() {
		var $list = $('#chargeCardList').empty();
		var rows = pricedRows();
		var gb = feeGb();
		var key = stageKey();

		if (!rows.length) {
			$list.append($('<li>', { 'class': 'swiper-slide' }).append($('<p>', { 'class': 'data-none', text: '조회된 내용이 없습니다.' })));
			destroySwiper('card');
			return;
		}

		var lowest = feeOf(rows[0], gb, key);
		var gbLabel = gb === 'M' ? '회원가' : '비회원가';

		rows.forEach(function (row, i) {
			var fee = feeOf(row, gb, key);
			var $item = $('<li>', { 'class': 'swiper-slide column-list__item' + (i === 0 ? ' column-list__item--lowest' : '') });
			var $link = $('<a>', {
				href: '#none',
				'class': 'column-list__link',
				title: (row.BNM || '') + ' 충전요금 상세비교',
				'data-bid': row.BID
			});
			$link.append(enterpriseInfo(row, i));

			var $dl = $('<dl>', { 'class': 'data-set' });
			$dl.append($('<dt>', { 'class': 'data-set__label', text: gbLabel + ' · ' + stageLabel() + ' 기준' }));
			$dl.append($('<dd>', { 'class': 'data-set__figure' }).append(document.createTextNode(fmtFee(fee) + ' ')).append($('<span>', { 'class': 'unit', text: '원' })));
			$dl.append($('<dd>', { 'class': 'data-set__description', text: i === 0 ? '최저가' : '최저대비 +' + (Math.round((fee - lowest) / lowest * 1000) / 10).toFixed(1) + '%' }));

			$link.append($('<div>', { 'class': 'column-list__content' }).append($dl));
			$item.append($link);
			$list.append($item);
		});

		initCardSwiper();
	}

	// ── 상세보기 탭 ───────────────────────────────────────────────────
	function renderDetailList() {
		var $list = $('#chargeDetailList').empty();
		var rows = pricedRows();
		var gb = feeGb();

		if (!rows.length) {
			$list.append($('<li>', { 'class': 'swiper-slide' }).append($('<p>', { 'class': 'data-none', text: '조회된 내용이 없습니다.' })));
			destroySwiper('detail');
			renderDetailTable();
			return;
		}

		if (!currentBid || !selectedBids[currentBid]) { currentBid = rows[0].BID; }

		rows.forEach(function (row, i) {
			var $item = $('<li>', { 'class': 'swiper-slide column-list__item' + (row.BID === currentBid ? ' column-list__item--current' : '') });
			var $link = $('<a>', {
				href: '#none',
				'class': 'column-list__link',
				title: (row.BNM || '') + ' 충전요금 상세보기',
				'data-bid': row.BID
			});
			$link.append(enterpriseInfo(row, i));

			var $group = $('<div>', { 'class': 'data-set-group' });
			SUMMARY_STAGES.forEach(function (key) {
				var $dl = $('<dl>', { 'class': 'data-set' });
				$dl.append($('<dt>', { 'class': 'data-set__label', text: STAGES[stageNum(key) - 1].label }));
				$dl.append($('<dd>', { 'class': 'data-set__figure', text: fmtFee(feeOf(row, gb, key)) }));
				$group.append($dl);
			});

			$link.append($('<div>', { 'class': 'column-list__content' }).append($group));
			$item.append($link);
			$list.append($item);
		});

		initDetailSwiper();
		renderDetailTable();
	}

	function renderDetailTable() {
		var $info = $('#chargeDetailInfo').empty();
		var $body = $('#chargeDetailBody').empty();
		var row = null;

		busiList.forEach(function (r) { if (r.BID === currentBid) { row = r; } });

		if (!row) {
			$body.append($('<tr>').append($('<td>', { colspan: 4, 'class': 'data-none', text: '조회된 내용이 없습니다.' })));
			return;
		}

		$info.append(enterpriseInfo(row, 0).children());

		STAGES.forEach(function (stage) {
			var m = feeOf(row, 'M', stage.key);
			var n = feeOf(row, 'N', stage.key);
			var save = (m !== null && n !== null && n > m) ? (n - m) : null;

			var $tr = $('<tr>');
			$tr.append($('<td>', { 'class': 'text-left', text: stage.label }));
			$tr.append($('<td>', { 'class': 'text-right' }).append($('<span>', { 'class': 'text-secondary', text: fmtFee(m) })));
			$tr.append($('<td>', { 'class': 'text-right', text: fmtFee(n) }));
			$tr.append($('<td>', { 'class': 'text-right' }).append($('<span>', { 'class': 'text-required', text: save === null ? '-' : fmtFee(save) })));
			$body.append($tr);
		});
	}

	// ── 슬라이더 ──────────────────────────────────────────────────────
	function destroySwiper(kind) {
		var target = kind === 'card' ? cardSwiper : detailSwiper;
		if (target && target.destroy) { target.destroy(true, true); }
		if (kind === 'card') { cardSwiper = null; } else { detailSwiper = null; }
	}

	function initCardSwiper() {
		destroySwiper('card');
		cardSwiper = new Swiper('.swiper--charge', {
			loop: true,
			observer: true,
			observeParents: true,
			spaceBetween: 20,
			slidesPerView: 1,
			centeredSlides: false,
			watchOverflow: false,
			keyboard: { enabled: true },
			breakpoints: {
				0: { slidesPerView: 'auto', spaceBetween: 12 },
				375: { slidesPerView: 'auto', spaceBetween: 12 },
				480: { slidesPerView: 2, spaceBetween: 8 },
				1024: { slidesPerView: 3, spaceBetween: 8 },
				1280: { slidesPerView: 4, spaceBetween: 8 }
			},
			navigation: {
				nextEl: '.swiper-button-next--charge',
				prevEl: '.swiper-button-prev--charge'
			}
		});
	}

	function initDetailSwiper() {
		destroySwiper('detail');
		detailSwiper = new Swiper('.swiper--charge-detail', {
			spaceBetween: 12,
			slidesPerView: 1,
			slidesPerGroup: 1,
			// 슬라이드가 한 화면에 다 들어와도 진행바·페이지 표시를 감추지 않는다
			watchOverflow: false,
			observer: true,
			observeParents: true,
			grid: { rows: 1, fill: 'row' },
			breakpoints: {
				0: { slidesPerView: 1, slidesPerGroup: 1, spaceBetween: 12, grid: { rows: 1 } },
				768: { slidesPerView: 2, slidesPerGroup: 1, spaceBetween: 12, grid: { rows: 1 } },
				1024: { slidesPerView: 3, slidesPerGroup: 1, spaceBetween: 12, grid: { rows: 1 } },
				1280: { slidesPerView: 2, slidesPerGroup: 2, spaceBetween: 12, grid: { rows: 2 } }
			},
			navigation: {
				nextEl: '.swiper-button-next--charge-detail',
				prevEl: '.swiper-button-prev--charge-detail'
			},
			pagination: { el: '.swiper-progress', type: 'progressbar' },
			on: {
				init: updateFraction,
				slideChange: updateFraction
			}
		});
	}

	function updateFraction(swiper) {
		var rows = (swiper.params.grid && swiper.params.grid.rows) ? swiper.params.grid.rows : 1;
		var perPage = Math.max(1, swiper.params.slidesPerView * rows);
		var total = Math.ceil(swiper.slides.length / perPage);
		$('.main-section--charge .page-current').text(String(swiper.snapIndex + 1).padStart(2, '0'));
		$('.main-section--charge .page-total').text(String(total).padStart(2, '0'));
	}

	// ── 조회·바인딩 ───────────────────────────────────────────────────
	function render() {
		renderCards();
		renderDetailList();
	}

	function load() {
		$.ajax({
			type: 'post',
			url: MAIN_CONFIG.urls.busiFeeCompare,
			dataType: 'json',
			success: function (obj) {
				busiList = (obj && obj.list) ? obj.list : [];
				// 최초 진입은 전체 사업자 선택 상태
				busiList.forEach(function (row) { selectedBids[row.BID] = true; });
				currentBid = null;
				renderBusiDropdown();
				render();
			},
			error: function () {
				busiList = [];
				renderBusiDropdown();
				render();
			}
		});
	}

	function goDetail(bid) {
		currentBid = bid;
		$('#tabCharge02 .tab__button').trigger('click');
		renderDetailList();
	}

	function bind() {
		// 드롭다운 항목은 조회 후 그려지므로 위임 바인딩
		$('#chargeBusiList').on('change', '#chargeBusiAll', function () {
			$('#chargeBusiList').find('input[data-bid]').prop('checked', $(this).prop('checked'));
			syncSelectedFromDropdown();
			render();
		});
		$('#chargeBusiList').on('change', 'input[data-bid]', function () {
			syncSelectedFromDropdown();
			render();
		});
		$('#chargeFeeGb, #chargeStage').on('change', render);

		$('#chargeCardList').on('click', '.column-list__link', function (e) {
			e.preventDefault();
			goDetail($(this).attr('data-bid'));
		});
		$('#chargeDetailList').on('click', '.column-list__link', function (e) {
			e.preventDefault();
			currentBid = $(this).attr('data-bid');
			$('#chargeDetailList .column-list__item').removeClass('column-list__item--current');
			$(this).closest('.column-list__item').addClass('column-list__item--current');
			renderDetailTable();
		});

		// 탭 전환 시점에는 패널이 보이므로 슬라이더 폭을 다시 계산한다
		$('#tabCharge01 .tab__button, #tabCharge02 .tab__button').on('click', function () {
			setTimeout(function () {
				if (cardSwiper) { cardSwiper.update(); }
				if (detailSwiper) { detailSwiper.update(); }
			}, 50);
		});
	}

	$(function () {
		if (!$('.main-section--charge').length) { return; }
		bind();
		load();
	});
})(jQuery);
