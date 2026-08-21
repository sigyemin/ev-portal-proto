$(document).ready(function () {
	
	$('.topUtil .select').on('click', function () {
		if($(this).hasClass('on') == false){
			$(this).addClass('on');
		} else{
			$(this).removeClass('on');
		}
	}) 

	$('.topUtilDeapth').on('mouseleave', function () {
		$(this).parents('li').removeClass('on');
	}) 


	

	$('.btnAllMenu').on('click', function () {
		if($('.allMenuBg').hasClass('on') == false){
			$('.allMenuBg').addClass('on');
		} else{
			$('.allMenuBg').removeClass('on');
		}
	})

	$('.allMenuClose').on('click', function () {
		$('.allMenuBg').removeClass('on');
	})
	$('#menu > li').on('mouseover focusin', function () {
		$('#menu > li').removeClass('on');
		$('.menuBg').show();
		$(this).addClass('on');
	})
	$('.menuDepth01 > li').on('focusin', function () {

		$(this).css('background-color','#f2f7ff');
	})
	$('.menuDepth01 > li').on('focusout', function () {

		$(this).css('background-color','#fff');
	})

	$('#header').on('mouseleave focusout', function () {
		$('.menuBg').hide();
		$('#menu > li').removeClass('on');
	})
	$('.btnToggle').on('click focusin', function (e) {
		e.preventDefault();
		//서비스 영역 높이 설정
		var iHeight = $('.serviceList.on').outerHeight();
  		$('.serviceTab').css( 'height', 20 + iHeight + 'px' );
  		$('.serviceTab').css( 'min-height', '310px' );
		if($(this).hasClass('on')==true){
			$(this).removeClass('on');
			$('.serviceTab').css( 'height', '310px' );
		} else{
			$(this).addClass('on');
			$('.serviceTab').css( 'height', 20 + iHeight + 'px' );
		}		
	})
	$('.btnToggle').focusout(function(e) {
		e.preventDefault();
		$(this).removeClass('on');
		$('.serviceTab').css('height', '310px');
	})

	$('.serviceTab button').on('click focusin', function () {
		//버튼 선택
		$('.serviceTab button').removeClass('on');
		$('.serviceList').removeClass('on');
		$(this).addClass('on');
		$(this).next('.serviceList').addClass('on');
		//높이 설정
		$('.serviceTab').css('height', '310px' );
		var boxHeight = $('.serviceList.on ul').outerHeight();
		//높이에 따른 펼침 버튼 노출
		if(boxHeight <= 310 ){
			$('.btnToggle').hide();
		}else{
			$('.btnToggle').show();
		}
	})
	$('.serviceList li a').on('focusin', function () {
		//버튼 선택
		var boxHeight = $(this).parents('.serviceList').find('ul').outerHeight();
		console.log(boxHeight);
		if( boxHeight >= 310){
			$('.serviceTab').css( 'height', 70 + boxHeight + 'px' );
		}
	})

	$('.start').on('click',function(){
        $('.start').hide();
        $('.stop').show();
        swiper.autoplay.start();
        return false;
    })
    $('.stop').on('click',function(){
        $('.stop').hide();
        $('.start').show();
        swiper.autoplay.stop();
        return false;
    })

	// MOBILE
	$('.btnMbMenuX').on('click', function () {
		$('.mbMenu').css('opacity','0');
		$('.mbMenu').css('right','100%');
	})
	$('.btnMbMenu').on('click', function () {
		$('.mbMenu').css('opacity','1');
		$('.mbMenu').css('right','0');
	})

	$('.mbMenuList > li > a').on('click', function (e) {
		e.preventDefault();
		$(this).next('.mbMenuDepth01').slideToggle(300, function() {
			$(this).parent().toggleClass('on', $(this).is(':visible'));
		})
	})	
});

// $(window).resize(function(){ 
// 	if (window.innerWidth <= 1400) { 
// 		var boxHeight = $('.serviceList.on ul').outerHeight();
// 		$('.serviceTab').css( 'height', + 80 + boxHeight + 'px' );
// 	} 
	
// }).resize(); 

$(window).on("load", function(){ 
	if (window.innerWidth <= 1400) { 
		var boxHeight = $('.serviceList.on ul').outerHeight();
		$('.serviceTab').css( 'height',  + 80 + boxHeight + 'px' );
	} 
})

