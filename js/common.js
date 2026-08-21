$(document).ready(function(){
    $.datepicker.setDefaults({
	    closeText: "닫기",
	    currentText: "오늘",
	    prevText: '이전 달',
	    nextText: '다음 달',
	    monthNames: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'],
	    monthNamesShort: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'],
	    dayNames: ['일', '월', '화', '수', '목', '금', '토'],
	    dayNamesShort: ['일', '월', '화', '수', '목', '금', '토'],
	    dayNamesMin: ['일', '월', '화', '수', '목', '금', '토'],
	    weekHeader: "주",
	    dateFormat: "yy-mm-dd",
	    changeYear: true,
	    changeMonth: true,
	    showMonthAfterYear: true,
	    yearRange: "c-100:c+10"
    });

    // input 요소만 대상 — 신규 퍼블리싱 마크업의 <div class="datepicker"> 래퍼에 붙으면
    // 인라인(상시 펼침) 달력으로 렌더되어 레이아웃이 깨짐. input 초기화는 ui-common.js(.datepicker-input) 담당.
    $("input.datepicker").datepicker();
 });

$(document).ready(function () {
	$('#upload-busi-filename').change(function(){
		console.log('dd');
	});


	$('.allMenu > li').on('click', function () {
		if($(this).hasClass('on') == true){
			$(this).find('.allMenuDepth01').removeClass('on');
			$(this).removeClass('on');
		} else{
			$('.allMenu > li').removeClass('on')
			$(this).addClass('on');
			$('.allMenuDepth01').removeClass('on');
			$(this).find('.allMenuDepth01').addClass('on');
		}
	})

	// 230703
	//메인 팝업 닫기
	$('.popUp-btn .close').on('click', function (e) {
		e.preventDefault();
		$(this).parents('.mainPopUp').hide();
		var count = $(".popUp:visible").length;
		if (count < 1) {
			$('.mainDim').hide();
		}
		$('.popUp .chargerList').css('height', 'calc(100vh - 41rem)');
		$('.popUp .btn_more').show();
	});

	let windowWidth = $(window).width();
	$('.topUtil .select, .mbUtilList .select ').on('click', function () {
		if ($(this).hasClass('on') == false) {
			$(this).addClass('on');
		} else {
			$(this).removeClass('on');
		}
	})

	$('.topUtilDeapth').on('mouseleave', function () {
		$(this).parents('li').removeClass('on');
	})

	// 230717 햄버거 버튼
	$('.btnAllMenu, .btnMbMenu').on('click', function () {
		if ($('.allMenuBg').hasClass('on') == false) {
			$('.allMenuBg').addClass('on');
			$('body').css('overflow', 'hidden');
		} else {
			$('.allMenuBg').removeClass('on');
		}
	})

	// 230717 햄버거 버튼
	$('.allMenuClose').on('click', function () {
		$('.allMenuBg').removeClass('on');
		$('body').css('overflow', 'visible');
	})

	$('#menu > li').on('mouseover focusin', function () {
		$('#menu > li').removeClass('on');
		$('.menuBg').show();
		$('.menuDim').show();
		$(this).addClass('on');
		var subMenuHeight= $(this).find('.menuDepth01').height() + 1 ;
		$('.menuBg').css('height',subMenuHeight )
	})
	$('#header').on('mouseleave focusout', function () {
		$('.menuBg').hide();
		$('#menu > li').removeClass('on');
		$('.menuDim').hide();
	})

	//footer 링크 클릭 시 해당 a태그 활성화
	var url = window.location.pathname;
	$('.footerLink').find('a').each(function(){
		$(this).toggleClass('active', $(this).attr('href') == url);
	});

	//자주 찾는 서비스 탭 클릭
	$('.serviceTab button').on('click focusin', function () {
		$('.serviceTab button').removeClass('on');
		$('.serviceList').removeClass('on');
		$('.serviceTab').css('height', '31.6rem');
		$('.btnToggle').removeClass('on');
		$(this).addClass('on');
		if (windowWidth >= 1223) {
			$('.serviceTab').css('height', '31.6rem');
		} else {
			$('.serviceTab').css('height', 'auto');
		}

		var num = $('.serviceTab button').index(this);
		$('.serviceList').eq(num).addClass('on');
		var boxHeight = $('.serviceList.on ul').outerHeight();
		if (boxHeight <= 310) {
			$('.btnToggle').hide();
		} else {
			$('.btnToggle').show();
		}
	})

	//자주 찾는 서비스 전체 아이콘 보기/숨기기
	$('.btnToggle').on('click focusin', function (e) {
		e.preventDefault();
		if ($(this).hasClass('on') == true) {
			$(this).removeClass('on');
			$(this).text("펼치기");
			$('.serviceTab').css('height', '31.6rem');
		} else {
			$(this).addClass('on');
			$(this).text("닫기");
			$('.serviceTab').css('height', 'auto');
		}
	})

	$('.start').on('click', function () {
		$('.start').hide();
		$('.stop').show();
		swiper.autoplay.start();
		return false;
	})
	$('.stop').on('click', function () {
		$('.stop').hide();
		$('.start').show();
		swiper.autoplay.stop();
		return false;
	})

	// MOBILE //230703 삭제
	// $('.btnMbMenuX').on('click', function () {
	// 	$('.mbMenu').css('opacity', '0');
	// 	$('.mbMenu').css('right', '100%');
	// 	$('body').css('overflow', 'visible');
	// })
	// $('.btnMbMenu').on('click', function () {
	// 	$('body').css('overflow', 'hidden');
	// })

	$('.mbMenuList > li').on('click', function (e) {
		e.preventDefault();
		$('.mbMenuDepth01').slideUp();
		if($(this).find('.mbMenuDepth01').is(':visible')){
			$(this).find('.mbMenuDepth01').slideUp();
			$(this).removeClass('on');
		}else{
			$(this).find('.mbMenuDepth01').slideDown();
			$(this).addClass('on');
		}
	})

	if (windowWidth <= 1223) {
		$('.serviceTab').css('height', 'auto');
	}

	//////////////////////// sub ///////////////////////
	//서브 현재위치 펼침, 닫힘 230712
	$('.locaBar > li > a').on('click', function (e) {
		e.preventDefault();
			$('.locaDepth').slideUp();
			if ($(this).hasClass('open')) {
				$(this).parent().find('.locaDepth').slideUp();
				$(this).removeClass('open');
			} else {
				$('.locaBar').find('li , a').removeClass('open');
				$(this).parent().find('.locaDepth').slideDown();
				$(this).addClass('open');
			}
	});
	$('html').click(function(e) {
		if(!$(e.target).parents().hasClass('locaBar')) {
			$('.locaBar > li > a').removeClass('open');
			$('.locaDepth').slideUp();
		}
	});
	//아코디언
	$('.accTab, .accTopBtn').on('click', function (e) {
		e.preventDefault();
		if($(this).hasClass('on')==true){
			$(this).removeClass('on');
			$(this).parent().next('.accTable').removeClass('on');
			if ($(this).hasClass('accTab')) {
				$(this).attr('title', $(this).text()+' 열기');
				$(this).next('.accTable').hide();
			}else{
				$(this).attr('title', $(this).parent().find('em').text()+' 열기');
			}
		} else{
			$('.accTopBtn').removeClass('on');
			$('.accTable').removeClass('on');
			$('.accTab').removeClass('on');
			
			$(this).addClass('on');
			$(this).parent().next('.accTable').addClass('on');
			if ($(this).hasClass('accTab')) {
				$('.accTab').attr('title', function(_, t){
				    return t.slice(0, -2) + '열기';
				});
				$('.accTab').next('.accTable').hide();
				
				$(this).attr('title', $(this).text()+' 닫기');
				$(this).next('.accTable').show();
			}else{
				$('.accTopBtn').attr('title', function () {
				    return $(this).parent().find('em').text().trim() + ' 열기';
				});
				
				$(this).attr('title', $(this).parent().find('em').text()+' 닫기');
			}
		}
		
	});
	
	$('.accTab').each(function () {
	    $(this).attr('title', $(this).text() + ' 열기');
	});
	$('.accTopBtn').each(function () {
	    $(this).attr('title', $(this).parent().find('em').text()+' 열기');
	});
	$('.accTab').next('.accTable').hide();

	//약관동의 모두체크, 해제
	$('.allAgreechk, .allChk').on('click', function () {
		if (($('.allAgreechk').is(":checked")) || ($('.allChk').is(":checked"))) {
			$('.agreeChk').prop("checked", true);
			$('.cardChk').prop("checked", true);
		} else {
			$('.agreeChk').prop("checked", false);
			$('.cardChk').prop("checked", false);
		}
	})
	//약관동의 해제
	$("input[name=agreeChk]").click(function () {
		var total = $("input[name=agreeChk]").length;
		var checked = $("input[name=agreeChk]:checked").length;
		if (total != checked) {
			$(".allAgreechk").prop("checked", false);
		} else $(".allAgreechk").prop("checked", true);
		if ($(this).is(":checked")) {
			$(this).parent().next('.accTopBtn').removeClass('on');
			$(this).parents('.accTop').next('.accTable').removeClass('on');
		}
	})
	$("input[name=card]").click(function () {
		var total02 = $("input[name=card]").length;
		var checked02 = $("input[name=card]:checked").length;
		if (total02 != checked02) {
			$("input[name=allChk]").prop("checked", false);
		} else {
			$("input[name=allChk]").prop("checked", true);
		}
	});
	//전기차 선택시 세부차종 보이기
	$("input[name=vehicleType]:radio").click(function () {
		if ($("input[id=vt01]:radio").is(":checked")) {
			$('.chkShow').show();
		} else {
			$('.chkShow').hide();
		}
	})
	//팝업 닫기
	$('.popUp .close').on('click', function (e) {
		e.preventDefault();
		$('.popUp .chargerList').css('height', 'calc(100vh - 41rem)');
		$('.popUp .btn_more').show();
		$('.popUp ul.chargerList').children().slice(20).hide();
		$('.popUp ul.chargerList').css('overflow', 'auto');
		$(this).parents('.popContainer').hide();
		var count = $(".popUp:visible").length;
		if (count < 1) {
			$('.dim').hide();
		}
		$('body').css('overflow', 'visible');
		if ($('body').hasClass('entire') == true) {
			$('body').css('overflow', 'hidden');
		}
	})

	//차종 이미지 자세히 보기
	$('.rawImg').on('click', function (e) {
		e.preventDefault();
		$('.dim').show();
		$('.popContainer').css('display','flex');
		var imgSrc = $(this).find('img').attr('src');
		$('.popImgBox').find('img').attr('src', imgSrc);
	})

	// 서브페이지 탭
	$('.subPageTab li').on('click', function (e) {
		var href = $(this).find('a').attr('href'); // li 내부의 a 태그 href 확인
		 
      	// href가 #이 아닌 경우는 기본 동작 유지
      	if(href === '#') {
 			e.preventDefault(); // 웹접근성 수정 - 브라우저의 기본 동작(# 이동) 막기
       	}

		let tabIndex = $('.subPageTab li').index(this);
		$('.subPageTab li').removeClass('on');
		$('.subPageTab li a').removeAttr('title');
		$(this).addClass('on')
		$(this).find('a').attr('title', '선택됨');
		$('.tabPage').hide();
		$('.mapTab').hide();
		$('.tabPage').eq(tabIndex).show();
		$('.mapTab').eq(tabIndex).show();
	})

	$('.btnBox').each(function(){
		if($('a', this).length > 1){
			$(this).css('max-width','49rem')
		}
		if($('a', this).length > 2){
			$(this).css('max-width','88rem')
		}
	}) ;

	// faq
	$(".tabBox a").on('click', function () {
		if ($(this).hasClass('on') == false) {
			$(this).addClass('on');
		} else {
			$(this).removeClass('on');
		}
	});

	 //완속충전기 모바일 탭 접었다 펼침 230703
	$('.btnItems button').on('click', function () {
		if ($(this).hasClass('on') == false) {
			$(this).addClass('on');
			$('.subPageTab.items').addClass('open');
		} else {
			$(this).removeClass('on');
			$('.subPageTab.items').removeClass('open');
		}
	})

	// 가까운 충전소 찾기
	$('.btn_more').on('click', function () {
		$('.popUp .chargerList').css('height','auto');
		$(this).hide();
		return false;
	})
	$('.radioRound > span input').on('click', function () {
		 if($(this).not(":checked")){
			$(this).prop("checked", true);
			$('.radioRound > span').removeClass('on');
			$(this).parent('span').addClass('on');
		}
	})
	$('.typeChk > div input').on('click', function () {
		if($(this).is(":checked")){
			$(this).parent('div').addClass('on');
		} else{
			$(this).parent('div').removeClass('on');
		}
   })
	$(".btn_srch_close").on('click', function () {
		var pinWidth = $('.mapPin').width();
		// 검색창 펼침
		if ($(this).hasClass('on') == false) {
		
			$('.subPageTab').show();
			$('.mapLeft').show();
			$('.mapLeftWrap').find('[data-focus-first]').focus();
			console.log($('.mapLeftWrap').find('[data-focus-first]'));
			
			$(this).addClass('on');
			$('.mapLeftWrap').animate({
				left: '0'
			})
			$('.sort').animate({
				left: '40rem'
			})

			$('.mapPin').animate({
				left: '40rem',
				width: windowWidth - 426
			})
			
			$(".btn_srch_close").text("닫기");

		} else {
			// 검색창 접음
			$(this).removeClass('on');
			$('.mapLeftWrap').animate({
			    left: '-377px'
			}, function() {
			    $(".btn_srch_close").text("열기");
				$('.subPageTab').hide();
				$('.mapLeft').hide();
			});
			$('.sort').animate({
				left: '2.5rem'
			})


			$('.mapPin').animate({
				left: '2.5rem',
				width: $(window).width() - 50
			})
			
		}
	})

	//가까운 충전소 충전소 분류
	$('.sort li').on('click', function () {
		var sortIdx = $('.sort li').index(this);
		$('.sort li').removeClass('on');
		$(this).addClass('on');
		if (windowWidth > 1223) {
			$('.mapLeftWrap').hide();
			$('.mapLeftWrap').eq(sortIdx).show();
			$('.mapLeftWrap .subPageTab li').removeClass('on');
			$('.mapLeftWrap').eq(sortIdx).find('.subPageTab li:eq(0)').addClass('on');
			$('.subPageTab').removeClass('white');
			$('.mapLeftWrap').eq(sortIdx).find('.mapTab:eq(0)').show();
			$('.pin').show();
			$('.checkWrap').show();
			if ($('.sort li.hydra').hasClass('on') == true) {
				$('.pin div:not([class])').hide();
				$('.checkWrap').hide();
				$('.icon.icon_charger').hide();
				$('.icon.icon_favorite').hide();
				$('.icon.icon_filter').hide();
				$('.mapPin').hide();
			} else if ($('.sort li.ev').hasClass('on') == true) {
				$('.pin div').show();
				$('.icon.icon_charger').show();
				$('.icon.icon_favorite').show();
				$('.icon.icon_filter').show();
				$('.pin').show();
				$('.mapPin').show();
			} else {
				$('.pin').hide();
				$('.checkWrap').hide();
				$('.icon.icon_charger').hide();
				$('.icon.icon_favorite').hide();
				$('.icon.icon_filter').hide();
				$('.mapPin').hide();
			}
		} else {
			if (($('.sort li.ev').hasClass('on')) == false) {
				$('.tabBtm .icon_charger').hide();
				$('.tabBtm .icon_favorite').hide();
				$('.tabBtm .icon_filter').hide();
				$('.mobile.typeChk').hide();
			} else {
				$('.tabBtm .icon_charger').css('display', 'table-cell');
				$('.tabBtm .icon_favorite').css('display', 'table-cell');
				$('.tabBtm .icon_filter').css('display', 'table-cell');
				$('.mobile.typeChk').show();
			}
		}
	})

	//가까운 충전소 즐겨찾기
	$('h4 .favorite').on('click', function () {
		if ($(this).hasClass('on') == true){
			$(this).removeClass('on')
		} else{
			$(this).addClass('on')
		}
	})

	// 충전기분류 탭버튼 숨김
	$('.btn_close').on('click', function () {
		if ($(this).hasClass('tab_on') == true) {
			$(this).removeClass('tab_on');
			$(this).addClass('tab_off');
			$(this).parent().find('.listBox > .list, .listBox > .hideHeader').hide(
				{direction: 'top', opacity: 0}
			);
		} else {
			$(this).removeClass('tab_off');
			$(this).addClass('tab_on');
			$(this).parent().find('.listBox > .list, .listBox > .hideHeader').show(
				{direction: 'top', opacity: 1}
			);
		}
	})

	$(window).on('load', function () {

		var windowWidth = $(window).width();
		var liLength = $('.subPageTab.items li').length;	//완속충전기
		var subLength = $('.subPageTab').find('li').length; //서브페이지 탭
		$("#file").on('change',function(){
			var fileName = $("#file").val();
			$(".upload-name").val(fileName);
		  });
		if(subLength % 6 == 0){
			$('.subPageTab.items').css({
				'border-bottom':'none'
			});
		}
		if(liLength < 6){
		} else if((liLength > 6) && (liLength < 12)){
			$('.subPageTab.open.items').css('border-bottom', '1px solid #e7e7e7');
		}

		if(windowWidth < 1223){

			if((liLength % 2 == 1) && (liLength > 3)){
				$('.subPageTab.items li:last-of-type').css('border-right', '1px solid #e7ef7e7');
			}
			$('.subPageTab.items').find('li.on').detach().prependTo('.subPageTab.items')

			//$('.btnItems button').on('click', function () {
			//	if((subLength % 2 == 0) && (subLength > 6)){
			//		$('.subPageTab.items').css({
			//			'border-bottom':'none'
			//		})
			//	}
			//	if($(this).hasClass('on')==false){
			//		$(this).addClass('on');
			//		$('.subPageTab.items').addClass('open');
			//	} else{
			//		$(this).removeClass('on');
			//		$('.subPageTab.items').removeClass('open');
			//	}
			//})

			if(subLength >= 4){
				$('.subPageTab').css({
					'display':'block',
					'overflow':'hidden'
				});
				$('.subPageTab li').css({
					'float':'left',
					'width':'50%'
				});

				if(subLength % 2 == 1){
					$('.subPageTab li:last-of-type').css({
						'border-right':'1px solid #e7e7e7',
						'border-bottom':'none'
					})
					$('.subPageTab').css({
						// 'border-bottom':'1px solid #e7e7e7'
					})
				}
			}
			$('.sort').css('left','2.5rem');
		}

		// 게시판
		if (windowWidth < 570) {
			$('.board_img').siblings(".board_info").css("width", "100%")
		} else {
			if ($(".board_thumb > ul > li").has('.board_img')) {
				$('.board_img').siblings(".board_info").css("width", "calc(100% - 16.5rem)")
			}
		}
	})

	//숫자만 입력해야 되는 항목들에 대한 제어
	$('body').on("keyup", 'input:text[datatype="number"]', function(){
		fnNumberOnly( $(this) );
	});
});

$(window).on('resize', function () {
	let windowWidth = $(window).width();
	let mapw = $('.mapPin').width();

	$('.serviceTab button').on('click focusin', function () {
		if (windowWidth >= 1223) {
			$('.serviceTab').css('height', '31.6rem');
		} else {
			$('.serviceTab').css('height', 'auto');
		}
	})

	if (windowWidth < 570) {
		$('.board_img').siblings(".board_info").css("width", "100%")
	} else {
		if ($(".board_thumb > ul > li").has('.board_img')) {
			$('.board_img').siblings(".board_info").css("width", "calc(100% - 16.5rem)")
		}
	}

	if (windowWidth < 1223) {
		$('.serviceTab').css('height', 'auto');
		$('.subPageTab.items').find('li.on').detach().prependTo('.subPageTab.items');
		//$('.subPageTab.items').removeClass('open');
		//$('.btnItems button').removeClass('on');
		$('.subPageTab.items li:last-of-type').css('border-right', '1px solid #e7e7e7');
		// 완속충전기 모바일 탭 접었다 펼침
		$('.btnItems button').on('click', function () {
			if($(this).hasClass('on')==false){
				$(this).addClass('on');
				$('.subPageTab.items').addClass('open');
			} else{
				$(this).removeClass('on');
				$('.subPageTab.items').removeClass('open');
			}
		})

		$('.mapLeftWrap').hide();
		if ($('.sort li.ev').hasClass('on') == true) {
			$('.icon_charger').css('display', 'table-cell');
		}
		$('.sort').css('left', '2.5rem');
		$('.mapPin').css('left', '2.5rem');
		$('.mapPin').hide();
		$('.optBox').hide();

		$('.sort li').on('click', function () {
			$('.mapLeftWrap').hide();
		})
		$('.btnItems.mobile button').on('click', function () {
			var subLength =$('.pageTit').next($('.subPageTab')).find('li').length;
			if((subLength % 2 == 0) && (subLength > 6)){
				$('.subPageTab.items').css({
					'border-bottom':'none'
				})
			}
			if($(this).hasClass('on')==false){
				$(this).addClass('on');
				$('.subPageTab.items').addClass('open');
			} else{
				$(this).removeClass('on');
				$('.subPageTab.items').removeClass('open');
			}
		})

	} else {
		var sortIdx = $('.sort').find('li.on').index();
		$('.serviceTab.items').css('height', '31.6rem');
		$('.serviceTab').css('height', '31.6rem');
		if ($('.serviceList.on ul').height() < 240){
			$('.btnToggle').hide();
		} else{
			$('.btnToggle').show();
		};
		$('.btnToggle ').removeClass('on');
		$('.subPageTab.items li:last-of-type').css('border-right', 'none');
		$('.mapLeftWrap').eq(sortIdx).show();
		$('.mapPin').show();
		$('.optBox').show();
		var sideLeft = $('.mapLeftWrap').offset();
		//console.log(sideLeft);
		if (sideLeft < 0) {
			$('.sort').css('left', '2.5rem');
			$('.mapPin').css({
				width: windowWidth - 50
			})
		} else {
			$('.sort').css('left', '40rem');
			$('.mapPin').css({
				width: windowWidth - 426,
				left: '40rem'
			})
		}
	}

})

// esc키 눌렀을 시 팝업 닫힘
$(document).keydown(function (event) {
	$('.popUp .chargerList').css('height', 'calc(100vh - 41rem)');
	$('.popUp .btn_more').show();
	var count = $(".popContainer:visible").length;
	if (event.keyCode == 27 || event.which == 27) {
		if (count > 1) {
			$('.popContainer:last-of-type').hide();
		} else{
			$('.dim').hide();
		 	$('.popContainer').hide();
		}
	}
})


// Focus Trap 공용 함수
function setupFocusTrap($popup) {
    var focusableEls = $popup.find('a, button, input, textarea, select, [tabindex]:not([tabindex="-1"])')
    					.filter(':visible');
    if (focusableEls.length === 0) return;
    console.log(focusableEls.length, focusableEls);

    var firstEl = focusableEls[0];
    var lastEl = focusableEls[focusableEls.length - 1];

    // 기존 이벤트 제거 후 새로 등록 (중복 방지)
    $popup.off('keydown.focusTrap').on('keydown.focusTrap', function(e) {
        if (e.key === 'Tab') {
            if (focusableEls.length === 1) {
                // 포커스 가능한 요소가 하나뿐일 경우
                e.preventDefault();
                firstEl.focus();
            } else if (e.shiftKey && document.activeElement === firstEl) {
                e.preventDefault();
                lastEl.focus();
            } else if (!e.shiftKey && document.activeElement === lastEl) {
                e.preventDefault();
                firstEl.focus();
            }
        }
    });

    // 팝업 열릴 때 첫 번째 포커스 요소로 이동
    setTimeout(function() {
        firstEl.focus();
    }, 10);
}

// Focus Trap 해제
function releaseFocusTrap($popup) {
    $popup.off('keydown.focusTrap');
}
