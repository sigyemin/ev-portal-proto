// 사이드 패널 — 충전소 상세 조회, 열기/닫기, 즐겨찾기 처리
var EvMapPanel = (function () {
	var adapter = null, pageInfo = {}, $panel = null, currentSid = null, currentCm = null, $opener = null;
	// 즐겨찾기 등록 시 충전소명·주소까지 함께 보내야 해서 상세 응답을 보관한다
	var currentStatInfo = null;

	function setHeader(statInfo) {
		var s = statInfo || {};
		$panel.find('.side-panel__header-title').text(s.KO_STAT_NM || '');
		var addr = [s.ADDR_DORO, s.ADDR_DORO_DETAIL].filter(function (v) { return !!v; }).join(' ');
		$panel.find('.side-panel__header-address').text(addr);
	}

	// 여닫기를 직접 처리한다 — ui-common 의 openSidepanel 은 지도 전체를 dimmed(어둡게+blur)로 덮고,
	// closeSidepanel 은 목록의 모든 .structured-list__button 에 focus() 를 걸어 스크롤이 튄다.
	function togglePanel(isOpen) {
		$panel.toggleClass('is-active', isOpen);
		// 모바일은 패널이 전체 화면이라 배경 스크롤만 잠근다
		$('body').toggleClass('no-scroll', isOpen && window.innerWidth <= 1024);
		if (isOpen) {
			if ($opener && $opener.length) $opener.attr('aria-expanded', 'true');
			$panel.find('.side-panel__close .button').trigger('focus');
		} else {
			$('.structured-list__button').attr('aria-expanded', 'false');
			if ($opener && $opener.length) $opener.trigger('focus');
			$opener = null;
		}
		$panel.attr('aria-hidden', isOpen ? 'false' : 'true');
	}

	// bookmarkCnt>0(이미 즐겨찾기됨)이면 해제 버튼만, 아니면 등록 버튼만 노출
	function showBookmarkState(isBookmarked) {
		$panel.find('[data-bookmark="write"]').toggle(!isBookmarked);
		$panel.find('[data-bookmark="delete"]').toggle(isBookmarked);
	}

	// 패널 푸터의 등록/해제 버튼(고정 마크업) — data-bookmark 값으로 mode 결정, 응답 확인 후에만 상태 전환
	function bindBookmark($scope) {
		$scope.find('[data-bookmark]').off('click').on('click', function () {
			if (pageInfo.loginYn !== 'Y') {
				alert('로그인 후 이용할 수 있습니다.');
				return;
			}
			var mode = $(this).data('bookmark');
			var sid = currentSid;
			var s = currentStatInfo || {};
			$.ajax({
				type: 'post', url: adapter.bookmarkUrl,
				data: { mode: mode, sid: sid, stat_id: s.STAT_ID || sid, stat_nm: s.KO_STAT_NM || '', stat_addr: s.ADDR_DORO || '' },
				success: function (res) {
					if (res && res.resultCd === '200') {
						showBookmarkState(mode === 'write');
					} else {
						alert('즐겨찾기 처리에 실패했습니다.');
					}
				},
				error: function () {
					alert('즐겨찾기 처리에 실패했습니다.');
				}
			});
		});
	}

	// 안내 알럿이 있는 화면은 확인을 눌러야 상세가 열린다
	function open(sid, cm) {
		if (!sid) return;
		// 알럿이 열리면 포커스가 옮겨가므로 되돌릴 대상을 먼저 잡아둔다
		var $active = $(document.activeElement).closest('.structured-list__button');
		var $from = $active.length ? $active : null;
		if (typeof window.showInfoNotice === 'function') {
			window.showInfoNotice(function () { openStation(sid, cm, $from); });
			return;
		}
		openStation(sid, cm, $from);
	}

	function openStation(sid, cm, $from) {
		currentSid = sid;
		currentCm = cm;
		currentStatInfo = null;
		// 닫을 때 되돌릴 포커스 대상 — 목록에서 열었으면 그 항목, 마커에서 열었으면 없음
		$opener = $from || null;
		$.ajax({
			type: 'post', url: adapter.infoUrl, dataType: 'json', data: { sid: sid },
			success: function (res) {
				if (sid !== currentSid) return; // 응답 도착 전 다른 지점이 요청됨 — 낡은 응답 무시
				if (!res || res.resultCode !== 'OK') {
					alert('충전소 정보를 불러오지 못했습니다.');
					return;
				}
				currentStatInfo = res.statInfo || null;
				setHeader(res.statInfo);
				adapter.renderPanel($panel.find('.side-panel__body')[0], res, currentCm);
				bindBookmark($panel);
				showBookmarkState(res.bookmarkCnt > 0);
				togglePanel(true);
			},
			error: function () {
				if (sid !== currentSid) return;
				alert('충전소 정보를 불러오지 못했습니다.');
			}
		});
	}

	function close() {
		togglePanel(false);
	}

	// 닫기는 여기서 직접 바인딩한다 — ui-common.js 의 바인딩에만 의존하면 그 파일이 없는 레이아웃에서 닫히지 않는다
	function init(a, p) {
		adapter = a;
		pageInfo = p || {};
		$panel = $('#energyStationDetail');
		// dimmed 클릭·ESC·닫기 버튼은 ui-common 이 window.closeSidepanel 을 부른다 —
		// 그 구현이 목록 전체 버튼에 focus() 를 걸어 스크롤이 튀므로 전역을 이 화면 동작으로 대체한다
		window.closeSidepanel = close;
		$panel.on('click', '.side-panel__close .button', function (e) {
			e.preventDefault();
			close();
		});
	}

	return {
		init: init,
		open: open,
		close: close
	};
})();
