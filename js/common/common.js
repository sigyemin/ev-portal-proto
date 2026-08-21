///////////////////////////////////////////////////////////
// 팝업 기능관련
// @url URL
// @w 폭
// @h 너비
// @s 스크롤바 여부 1, 'Y'이면 보여줌, 0, '', 'N'이면 숨김
function popup1(url,w,h,s){
	var l, t, objPopup
	l = (screen.width-w)/2;
	t = (screen.height-h)/2;
	if(s==1 || s=="Y")
		objPopup  = window.open(url,'','width='+w+',height='+h+',left='+l+',top='+t+',resizable=0,scrollbars=1');
	else if (s=="" || s==0 || s=="N" || !s || s=="0" )
		objPopup = window.open(url,'','width='+w+',height='+h+',left='+l+',top='+t+',resizable=0,scrollbars=0,status=0');
	else
		objPopup = window.open(url,'','width='+w+',height='+h+',left='+l+',top='+t+',resizable=1,menubar=1,toolbar=1,scrollbars=1,status=1');
	if (objPopup == null) {
		alert("차단된 팝업창을 허용해 주십시오.");
	}
	return objPopup;
}
function popup(url,w,h,s,target){

	var l, t, objPopup
	if(target == 'undefined' || target=='' || target==null) {
		var target='win1';
	}
	l = (screen.width-w)/2;
	t = (screen.height-h)/2;
	if(s==1 || s=="Y")
		objPopup  = window.open(url,target,'width='+w+',height='+h+',left='+l+',top='+t+',resizable=0,scrollbars=1');
	else if (s=="" || s==0 || s=="N" || !s || s=="0" )
		objPopup = window.open(url,target,'width='+w+',height='+h+',left='+l+',top='+t+',resizable=0,scrollbars=0,status=0');
	else
		objPopup = window.open(url,target,'width='+w+',height='+h+',left='+l+',top='+t+',resizable=1,menubar=1,toolbar=1,scrollbars=1,status=1');
	if (objPopup == null) {
		alert("차단된 팝업창을 허용해 주십시오.");
	}
	return objPopup;
}


function popupEx(url,w,h,s,n){

	var objPopup;

	if (n == null)	{
		n = "";
	}
	if(s==1 || s=="Y")
		objPopup  = window.open(url,n,'width='+w+',height='+h+',resizable=0,scrollbars=1');
	else if (s=="" || s==0 || s=="N" || !s)
		objPopup = window.open(url,n,'width='+w+',height='+h+',resizable=0,scrollbars=0,status=0');
	else
		objPopup = window.open(url,n,'width='+w+',height='+h+',resizable=1,menubar=1,toolbar=1,scrollbars=1,status=1');
	if (objPopup == null) {
		alert("차단된 팝업창을 허용해 주십시오.");
	}
	return objPopup;

}

function popupEx1(url,w,h,s,l,t){
	var objPopup;

	if(s==1 || s=="Y")
		objPopup  = window.open(url,'','width='+w+',height='+h+',left='+l+',top='+t+',resizable=0,scrollbars=1');
	else if (s=="" || s==0 || s=="N" || !s)
		objPopup = window.open(url,'','width='+w+',height='+h+',left='+l+',top='+t+',resizable=0,scrollbars=0,status=0');
	else
		objPopup = window.open(url,'','width='+w+',height='+h+',left='+l+',top='+t+',resizable=1,menubar=1,toolbar=1,scrollbars=1,status=1');
	if (objPopup == null) {
		alert("차단된 팝업창을 허용해 주십시오.");
	}
	return objPopup;

}

function openWin(url,w,h){
	window.open(url,"",'width='+w+',height='+h+',resizable=0,scrollbars=0,status=0');
}
function openSite(url,target){
	window.open(url,target,"width=960,height=768,resizable=1,scrollbars=1,status=0,menubar=0,toolbar=1");
}

function openSiteBc(url,target){
	window.open(url,target,"width=960,height=768,resizable=1,scrollbars=1,status=0,menubar=0,toolbar=1,alwaysRaised");
}

///////////////////////////////////////////////////////////


//jquery 달력
function addDatePicker(obj, dateformat) {
	if(dateformat == "" || dateformat == undefined){
		dateformat = 'yy-mm-dd';
	}

    $( obj ).datepicker({
		monthNamesShort: ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월' ],
		dayNamesMin: ['일','월','화','수','목','금','토'],
		weekHeader: 'Wk',
		dateFormat: dateformat,   // 날짜형식 = 20130329
		autoSize: false,    // 자동리사이즈 (false 이면 상위 정의에 따름)
		changeMonth: true,   // 월변경 가능
		changeYear: true,   // 연변경 가능
		showMonthAfterYear: true,  // 연 뒤에 월 표시
		yearRange: 'c-100:c+10',   // 연도 선택 범위
		//showOn: 'both',    // 엘리먼트와 이미지 동시사용 (both, button)
		buttonImageOnly: true,   // 이미지 표시
		buttonText: '달력',   // 버튼 텍스트 표시
		buttonImage: '/mgr/cms/_images/calendar.png',  // 이미지 주소
		//maxDate: '+6Y',    // 오늘 부터 6년 후까지만.  +0d 오늘 이전 날짜만 선택
		//minDate: '-30d'
	});

    $(".ui-datepicker-trigger").css("vertical-align","middle");
    $(".ui-datepicker-trigger").css("padding-left","2px");
    $(".ui-datepicker").css("font-size","14px");
}

//input 객체들 구분자로 문자열 반환
function objToString(obj){
	var len = obj.length;
	var ele = obj;
	var str="";
	if(obj.length > 1){
		for(var i=0; i < len; i++){
			if (i > 0) {
				str += "|";
			}
			str += ele[i].value;
		}
	}else{
		str = obj.value;
	}
	return str;
}



/**
멀티셀렉트 박스의 값을 String으로 변환시킨다.
A00|A01...
ex) editForm.kcd5CodeArr.value = selectToString(editForm.kcd5Code);
*/
function selectToString(sbox){
	var i=0,j=0;
	var idArray="";
	for(i=0; i<sbox.options.length; i++){
		if (i > 0) {
			idArray += "|";
		}
		idArray += sbox.options[i].value;
	}
	return idArray;
}

/**
멀티셀렉트 박스의 값을 String으로 변환시킨다.
A00|A01...
ex) editForm.kcd5CodeArr.value = selectToString(editForm.kcd5Code);
*/
function selectTextToString(sbox){
	var i=0,j=0;
	var idArray = '';
	for(i=0; i<sbox.options.length; i++){
		if (i > 0) {
			idArray += "|";
		}
		idArray += sbox.options[i].text;
	}
	return idArray;
}

/*
<select></select> 폼요소를 처리함
      tbox : 폼요소 이름
	  val : option 요소의 값
	  txt : option 요소의 이름
ex) <select name=MySel>                   ---> tbox: MySel
        <option value='A'>에이</option>   ---> val: A, txt: 에이
    </select>
*/
function ps_selbox_add(tbox, val, txt) {
	var i=0,j=0;
	//if(val != "" && txt != "") {
	//중복체크
	for(i=0; i<tbox.options.length; i++){
		if(tbox.options[i].value == val){
			return;
		}
	}
	if(txt != "") {
		var no = new Option();
		no.value = val;
		no.text = txt;
		var maxidx = tbox.options.length;
		tbox.options[maxidx] = no;
	}
}


function ps_selbox_move(fbox,tbox) {
	var i=0,j=0;
	for(var i=0; i<fbox.options.length; i++) {
		if(fbox.options[i].selected && fbox.options[i] != "") {
			for(var j=0; j<tbox.options.length; j++) {
				if(tbox.options[j].value == fbox.options[i].value) {
					window.alert('이미 값이 존재합니다.');
					return;
				}
			}
			var no = new Option();
			no.value = fbox.options[i].value;
			no.text = fbox.options[i].text;
			tbox.options[tbox.options.length] = no;
		}
	}
}


function ps_selbox_remove(box) {
	for(var i=0; i<box.options.length; i++) {
		if(box.options[i].selected && box.options[i] != "") {
			box.options[i].value = "";
			box.options[i].text = "";
		}
	}
	ps_selbox_bumpUp(box);
}


function ps_selbox_removeAll(box) {
	for(var i=0; i<box.options.length; i++) {
		if(box.options[i] != "") {
			box.options[i].value = "";
			box.options[i].text = "";
		}
	}
	ps_selbox_bumpUp(box);
}


function ps_selbox_bumpUp(abox) {
	for(var i = 0; i < abox.options.length; i++) {
		if(abox.options[i].value == "")  {
			for(var j = i; j < abox.options.length - 1; j++)  {
				abox.options[j].value = abox.options[j + 1].value;
				abox.options[j].text = abox.options[j + 1].text;
			}
			var ln = i;
			break;
		}
	}
	if(ln < abox.options.length)  {
		abox.options.length -= 1;
		ps_selbox_bumpUp(abox);
	}
}

function ps_selbox_moveUp(dbox) {
	for(var i = 0; i < dbox.options.length; i++) {
		if (dbox.options[i].selected && dbox.options[i] != "" && dbox.options[i] != dbox.options[0]) {
			var tmpval = dbox.options[i].value;
			var tmpval2 = dbox.options[i].text;
			dbox.options[i].value = dbox.options[i - 1].value;
			dbox.options[i].text = dbox.options[i - 1].text
			dbox.options[i-1].value = tmpval;
			dbox.options[i-1].text = tmpval2;
			dbox.options[i-1].selected = true;
			break;
		}
	}
}


function ps_selbox_moveDown(ebox) {
	for(var i = 0; i < ebox.options.length; i++) {
		if (ebox.options[i].selected && ebox.options[i] != "" && ebox.options[i+1] != ebox.options[ebox.options.length]) {
			var tmpval = ebox.options[i].value;
			var tmpval2 = ebox.options[i].text;
			ebox.options[i].value = ebox.options[i+1].value;
			ebox.options[i].text = ebox.options[i+1].text
			ebox.options[i+1].value = tmpval;
			ebox.options[i+1].text = tmpval2;
			ebox.options[i+1].selected = true;
			break;
		}
	}
}

// 기본값을 셋팅하기 위해
function ps_selbox_selected(ebox,val){
	for(var i = 0; i < ebox.options.length; i++) {
		if(ebox.options[i].value == val){
			ebox.options[i].selected = true;
			break;
		}
	}
}

function gfn_number_set(val){
	val = String(val);
	if(val.length < 2){
	val = "0"+val;
	}
	return val
}


function leadingZeros(n, digits) {
	var zero = '';
	n = n.toString();

	if (n.length < digits) {
		for (var i = 0; i < digits - n.length; i++)
			zero += '0';

	}
	return zero + n;
}

function GetCurYYYY(){
	var d = new Date();

	return leadingZeros(d.getFullYear(), 4);
}

function GetCurMM(){
	var d = new Date();

	return leadingZeros(d.getMonth() + 1, 2);
}

function GetCurDD(){
	var d = new Date();

	return leadingZeros(d.getDate(), 2);
}

function GetCurDate(){
	var d = new Date();

	var date = '';

	date += leadingZeros(d.getFullYear(), 4) + '-';
	date += leadingZeros(d.getMonth() + 1, 2) + '-';
	date += leadingZeros(d.getDate(), 2) + ' ';
	date += leadingZeros(d.getHours(), 2) + ':';
	date += leadingZeros(d.getMinutes(), 2) + ':';
	date += leadingZeros(d.getSeconds(), 2);

	return date;
}

function AddOptionSelectBox($element, strValue, bSelected, strText){
	if( bSelected )
		$element.append('<option value="'+strValue+'" selected>'+strText+'</option>');
	else
		$element.append('<option value="'+strValue+'">'+strText+'</option>');
}


//////////////////////////////////////////////////////////////
//멀티 체크박스
/**
* 특정이름의 멀티체크박스를 체크 또는 체크해제한다.
* ex) <input type=checkbox name=IDS value='...'>
*     <script language='javascript'>
*		toggleMultiChk(this.checked, 'IDS')
*	   </script>
*
* @param bCheck    true|false(체크할 상태)
* @param itemName  체크대상 체크박스이름
*/
function toggleMultiChk(bCheck, itemName){
	var obj = document.getElementsByName(itemName);
	if(typeof(obj) == 'undefined'){
		return;
	}

	for(var i=0; i<obj.length; i++){
		obj[i].checked = bCheck;
	}
}
/**
* 체크된 개수
* @param itemName 체크박스명
*/
function getMultiCheckedNum(itemName){
	var obj = document.getElementsByName(itemName);
	if(typeof(obj) == 'undefined'){
		return 0;
	}
	var chkedCnt=0;

	for(var i=0; i<obj.length; i++){
		if(obj[i].checked)
			chkedCnt++;
	}
	return chkedCnt;
}
/**
* 체크된 항목들 값을 취합해서 리턴
* @param itemName 체크박스명
* @param delim    구분자
*/
function getMultiCheckedString(itemName, delim){
	var obj = document.getElementsByName(itemName);
	var div = delim;
	if(div=="")
		div="|";
	var chkCnt=0;
	if(typeof(obj) == 'undefined'){
		return "";
	}
	var s="";
	var n=0;
	for(var i=0; i<obj.length; i++){
		if(obj[i].checked){
			if(n>0)
				s += div;
			s += obj[i].value;
			n++;
		}
	}
	return s;
}

function getMultiNonCheckedString(itemName, delim){
	var obj = document.getElementsByName(itemName);
	var div = delim;
	if(div=="")
		div="|";
	var chkCnt=0;
	if(typeof(obj) == 'undefined'){
		return "";
	}
	var s="";
	var n=0;
	for(var i=0; i<obj.length; i++){
		if(obj[i].checked){

		}else{
			if(n>0)
				s += div;
			s += obj[i].value;
			n++;

		}
	}
	return s;
}

function getMultiAllCheckedString(itemName, delim){
	var obj = document.getElementsByName(itemName);
	var div = delim;
	if(div=="")
		div="|";
	var chkCnt=0;
	if(typeof(obj) == 'undefined'){
		return "";
	}
	var s="";
	var n=0;
	for(var i=0; i<obj.length; i++){
		if(n>0)
			s += div;
		s += obj[i].value;
		n++;

	}
	return s;
}



/**
* 체크된 항목들 값을 취합해서 리턴
* @param itemName 체크박스명
* @param delim    구분자
*/
function checkedToString(obj, delim){
	var div = delim;
	if(div=="")
		div="|";
	var chkCnt=0;
	if(typeof(obj) == 'undefined'){
		return "";
	}
	if(obj.length == undefined){
		return (obj.checked) ? obj.value : "";
	}
	var s="";
	var n=0;
	for(var i=0; i<obj.length; i++){
		if(obj[i].checked){
			if(n>0)
				s += div;
			s += obj[i].value;
			n++;
		}
	}
	return s;
}
/**
* 메인에 사용될 팝업찰을 리턴한다
*
**/

function popupTrans(url,w,h,s,target,popType){


	var l, t, objPopup;
	if(target == 'undefined' || target=='' || target==null) {
		var target='win1';
	}
	l = (screen.width-w)/2;
	t = (screen.height-h)/2;
	if(s==1 || s=="Y")
		objPopup  = window.open(url+"?popType="+popType,target,'width='+w+',height='+h+',left='+l+',top='+t+',resizable=0,scrollbars=1');
	else if (s=="" || s==0 || s=="N" || !s || s=="0" )
		objPopup = window.open(url+"?popType="+popType,target,'width='+w+',height='+h+',left='+l+',top='+t+',resizable=0,scrollbars=0,status=0');
	else
		objPopup = window.open(url+"?popType="+popType,target,'width='+w+',height='+h+',left='+l+',top='+t+',resizable=1,menubar=1,toolbar=1,scrollbars=1,status=1');
	if (objPopup == null) {
		alert("차단된 팝업창을 허용해 주십시오.");
	}
	return objPopup;
}

function nullString(param){
	if(param == null)
		return "";
	else return param;
}

/*
 * 공통 validation
 * 1. type 입력형태(
 * 2. attr[] 입력 ID명
 * 3. message- validation에 걸렸을 경우 보여줄 alert메세지
*/
function validation(type, attr, message){
	var o_attr = attr;
	var o_message = message;
	if(type =='input'){
		for(var i=0; parseInt(i)<o_attr.length; i++){
			if($("#"+o_attr[i]+"").val()=='' || $("#"+o_attr[i]+"").val()==null){
				alert(o_message[i]);
				$("#"+o_attr[i]+"").focus();
				return false;
			}
		}
	}else if(type =='checkbox'){
		for(var i=0; parseInt(i)<o_attr.length; i++){
			if(!$("input:checkbox[id='"+o_attr[i]+"']").is(":checked")){
				alert(o_message[i]);
				$("#"+o_attr[i]+"").focus();
				return false;
			}
		}
	}
	if(type=='spc'){
        var special_pattern = /[`~!@+_#$%^&*|\\\'\";:\/?]/gi;
        for(var i=0; parseInt(i)<o_attr.length; i++){
	        if( special_pattern.test(attr[i]) == true){
	            alert(o_message[i]);
	            return false;
	        }
        }
    }
	return true;

}
function validation2(type, attr, message){

	var o_type = type;
	var o_attr = attr;
	var o_message = message;
	for(var k=0; parseInt(k)<o_type.length; k++){
		if(type[k] =='blank'){
			for(var i=0; parseInt(i)<o_attr.length; i++){
				if($("#"+o_attr[i]+"").val()=='' || $("#"+o_attr[i]+"").val()==null){
					alert(o_message[i]);
					$("#"+o_attr[i]+"").focus();
					return false;
				}
			}
		}else if(type[k] =='checkbox'){
			for(var i=0; parseInt(i)<o_attr.length; i++){
				if(!$("input:checkbox[id='"+o_attr[i]+"']").is(":checked")){
					alert(o_message[i]);
					$("#"+o_attr[i]+"").focus();
					return false;
				}
			}
		}
		if(type[k]=='spc' && $('input[type="text"]')){
			for(var i=0; parseInt(i)<o_attr.length; i++){
				if(o_attr[i]){
				    var special_pattern = /[`~!@+_#$%^&*|\\\'\";:\/?]/gi;
			        for(var i=0; parseInt(i)<o_attr.length; i++){
				        if( special_pattern.test(attr[i]) == true){
				            alert(o_message[i]);
				            return false;
				        }
			        }
				}
			}
		}
	}
	return true;

}

function setCookie(cookieName, value, exdays){
    var exdate = new Date();
    exdate.setDate(exdate.getDate() + exdays);
    var cookieValue = escape(value) + ((exdays==null) ? "" : "; expires=" + exdate.toGMTString());
    document.cookie = cookieName + "=" + cookieValue;
}
function deleteCookie(cookieName){
    var expireDate = new Date();
    expireDate.setDate(expireDate.getDate() - 1);
    document.cookie = cookieName + "= " + "; expires=" + expireDate.toGMTString();
}
function getCookie(cookieName) {
    cookieName = cookieName + '=';
    var cookieData = document.cookie;
    var start = cookieData.indexOf(cookieName);
    var cookieValue = '';
    if(start != -1){
        start += cookieName.length;
        var end = cookieData.indexOf(';', start);
        if(end == -1)end = cookieData.length;
        cookieValue = cookieData.substring(start, end);
    }
    return unescape(cookieValue);
}

//엑셀 스타일의 반올림 함수 정의
function roundXL(n, digits) {
	if (digits >= 0)
		return parseFloat(n.toFixed(digits)); // 소수부 반올림

	digits = Math.pow(10, digits); // 정수부 반올림
	var t = Math.round(n * digits) / digits;

	return parseFloat(t.toFixed(0));
}

function checkNull(data){
    var chr = '-';
    if(data == null || data == ""){
        return chr;
    }else{
        return data;
    }
}

function commas(x) {
	return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

window.chartColors = {
	red: 'rgba(255, 99, 132, 0.6)',
	orange: 'rgba(255, 159, 64, 0.6)',
	yellow: 'rgba(255, 205, 86, 0.6)',
	green: 'rgba(75, 192, 192, 0.6)',
	blue: 'rgba(54, 162, 235, 0.6)',
	purple: 'rgba(153, 102, 255, 0.6)',
	grey: 'rgba(201, 203, 207, 0.6)'
};

var bgColor = new Array(
	window.chartColors.red,
	window.chartColors.orange,
	window.chartColors.yellow,
	window.chartColors.green,
	window.chartColors.blue,
	window.chartColors.purple,
	window.chartColors.red,
	window.chartColors.orange,
	window.chartColors.yellow,
	window.chartColors.green,
	window.chartColors.blue,
	window.chartColors.purple,
	window.chartColors.red,
	window.chartColors.orange,
	window.chartColors.yellow,
	window.chartColors.green,
	window.chartColors.blue,
	window.chartColors.purple
);

//숫자 자릿수 채우기
function pad(n, width) {
	n = n + '';
	return n.length >= width ? n : new Array(width - n.length + 1).join('0') + n;
}

// /////////////////////////////////////////////////////////
$(document).ready(function () {

	/*메뉴*/

	$(function(){
	$('#gnb').mouseenter(function () {  /*gnb영역에 마우스 올렸을때*/
	//$(this).find('.lnb').removeClass('hidden');
	if(!$($('#menu_wrap').find('#topLow')).is(':animated')) $('#menu_wrap').find('#topLow, .lnb').slideDown(300); /*#menu_wrap 안에 있는 #topLow가 animated(움직이는) 상태가 아닐 경우
	                                                                                                                     #menu_wrap 안에 있는 #topLow하고 .lnb를 slideDown 시키는게 이벤트*/
	});

	$('#gnb').mouseleave(function () {  /*#gnb 영역에서 마우스가 빠져 나갔을 때는*/
	//$(this).find('.lnb').addClass('hidden');
	$('#menu_wrap').find('#topLow, .lnb').slideUp('slow'); /*#menu_wrap 안에 있는 #topLow와 .lnb를 slideUp 시켜주는 이벤트*/
	  //추가된 부분
	  $('#gnb > li').removeClass('on'); /* li에 있는 on class를 removeClass로 모두 없애주는것*/
	});
	});
	//추가된 부분
	$('#gnb > li').mouseenter(function(){    /*#gnb 1depth에 해당하는 li에 마우스가 올라 갔을 때*/
	  $(this).addClass('on').siblings().removeClass('on'); /*현재 올라간 li 에는 class on 을 넣어주고, siblings() 같은 레벨에 있는 모든 li에는 class on을 빼주는 형태 */
	});
});

