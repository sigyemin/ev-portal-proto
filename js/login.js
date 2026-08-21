function validateEmail(sEmail) {
	//var filter = /^([a-zA-Z0-9_\.\-+])+\@(([]a-zA-Z0-9\-)+\.)+([a-zA-Z0-9]{2,4})+$/;
	var filter = /^[0-9a-zA-Z]([-_\.]?[0-9a-zA-Z])*@[0-9a-zA-Z]([-_\.]?[0-9a-zA-Z])*\.[a-zA-Z]{2,3}$/i;
	if(filter.test(sEmail)) {
		return true;
	}else {
		return false;
	}
}


$(function() {
	$("#btnLogin").click(function (){
		if($("#userId").val() == '') {
			alert('아이디를 넣어주세요!!');
			return false;
		}
		if($("#passwd").val() == '') {
			alert('비밀번호를 넣어주세요!');
			return false;
		}
		if($("#userId").val().indexOf(" ")>-1){
				alert("아이디에 공백은 허용되지않습니다.");
				return false;
		}
		return true;
	});
	
	
});

function fnPwChk(pwdID){
	var pwd1 = document.getElementById(pwdID); 
	var inNum = false;
	var inEng = false;
	var inSChar = false;
	
	var pwd = pwd1.value;
	
	if(!pwd){
		alert("비밀번호를 입력해주세요.");
		pwd1.focus();
		return false;
	}
	
	//비밀번호 8자 이상인지 확인
	if(pwd.length<9){
		alert("비밀번호는 9자 이상 입력해주세요.");
		pwd1.focus();
		return false;
	}
	
	//숫자포함여부 확인
	for(var i=0; i<pwd.length; i++){
		if((pwd.charCodeAt(i)>=48) && (pwd.charCodeAt(i)<=57) ){
			inNum = true;
			break;
		}
	}
	//영문자 포함여부 확인
	for(i=0; i<pwd.length; i++){
		if( ((pwd.charCodeAt(i)>=65) && (pwd.charCodeAt(i)<=90)) || ((pwd.charCodeAt(i)>=97) && (pwd.charCodeAt(i)<=122)) ){
			inEng = true;
			break;
		}
	}
	
	//특수문자 포함여부 확인
	for(i=0; i<pwd.length; i++){
		if( ((pwd.charCodeAt(i)>=33) && (pwd.charCodeAt(i)<=47)) || ((pwd.charCodeAt(i)>=58) && (pwd.charCodeAt(i)<=64)) || ((pwd.charCodeAt(i)>=91) && (pwd.charCodeAt(i)<=96)) ){
			inSChar = true;
			break;
		}
	}

	// 제외문자 <(60) >(62) &(38) "(34) '(39)  ?(63)
	for(i=0; i<pwd.length; i++){
		if ( pwd.charCodeAt(i)==60 || pwd.charCodeAt(i)==62 || pwd.charCodeAt(i)==38 
				|| pwd.charCodeAt(i)==34 || pwd.charCodeAt(i)==39 || pwd.charCodeAt(i)==63 ) {
			alert("특수문자 중 제외문자(<,>,&,\",',?)가 포함되어 있습니다.");
			return false;
		}
	}
	
	var SamePass_0 = 0; //동일문자 카운트
	var SamePass_1 = 0; //연속성(+) 카운드
	var SamePass_2 = 0; //연속성(-) 카운드
	
	for(i=0; i < pwd.length-2; i++) {
		var chr_pass_0 = pwd.charAt(i);
		var chr_pass_1 = pwd.charAt(i+1);
		var chr_pass_2 = pwd.charAt(i+2);
		
		//동일문자 카운트
		if(chr_pass_0 == chr_pass_1 && chr_pass_1 == chr_pass_2) {
			SamePass_0 = SamePass_0 + 1;
		}
		
		//연속성(+) 카운드
		if(chr_pass_0.charCodeAt(0) - chr_pass_1.charCodeAt(0) == 1 && chr_pass_1.charCodeAt(0) - chr_pass_2.charCodeAt(0) == 1) {
			SamePass_1 = SamePass_1 + 1
		}
		
		//연속성(-) 카운드
		if(chr_pass_0.charCodeAt(0) - chr_pass_1.charCodeAt(0) == -1 && chr_pass_1.charCodeAt(0) - chr_pass_2.charCodeAt(0) == -1) {
			SamePass_2 = SamePass_2 + 1
		}
	}
	
	if(SamePass_0 > 1) {
		alert("동일문자를 3번 이상 사용할 수 없습니다.");
		return false;
	}
	
	if(SamePass_1 >= 1 || SamePass_2 >= 1 ) {
		alert("연속된 문자열(123 또는 321, abc, cba 등)을\n3자 이상 사용 할 수 없습니다.");
		return false;
	}
	
	if(!(inNum&&inEng&&inSChar)){
		alert("비밀번호는 영문자와 숫자와 특수문자도 함께 사용해 주세요.");
		return false;
	} else {
		return true;
	}
}
