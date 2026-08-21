
	/**
	 * 영문 대문자 입력가능
	 *
	 */
	$(".intCheckA").css('imeMode','disabled').keypress(function(event) {
		}).keyup(function(){
			if( $(this).val() != null && $(this).val() != '' ) {
			$(this).val( $(this).val().replace(/[^A-Z]/g, '') );
			}
	});

	/**
	 * 영문 소문자,숫자 입력가능
	 *
	 */
	$(".intCheckB").css('imeMode','disabled').keypress(function(event) {
		}).keyup(function(){
			if( $(this).val() != null && $(this).val() != '' ) {
			$(this).val( $(this).val().replace(/[^a-z0-9]/g, '') );
			}
	});

	/**
	 * 영문 소문자,숫자,언더바(_) 입력가능
	 *
	 */
	$(".intCheckC").css('imeMode','disabled').keypress(function(event) {
	}).keyup(function(){
		if( $(this).val() != null && $(this).val() != '' ) {
		$(this).val( $(this).val().replace(/[^a-z0-9_]/g, '') );
		}
	});