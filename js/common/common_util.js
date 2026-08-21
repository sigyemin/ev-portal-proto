/**
 * Checks if value is empty. Deep-checks arrays and objects Note: isEmpty([]) ==
 * true, isEmpty({}) == true, isEmpty([{0:false},"",0]) == true, isEmpty({0:1}) ==
 * false
 *
 * @param value
 * @returns {boolean}
 */
function isEmpty(value) {
	var isEmptyObject = function(a) {
		if(typeof a.length === 'undefined') { // it's an Object, not an Array
			var hasNonempty = Object.keys(a).some(function nonEmpty(element) {
				return !isEmpty(a[element]);
			});
			return hasNonempty ? false : isEmptyObject(Object.keys(a));
		}
		return !a.some(function nonEmpty(element) { // check if array is really
			// not empty as JS thinks
			return !isEmpty(element); // at least one element should be
			// non-empty
		});
	};
	return(value == false || typeof value === 'undefined' || value == null || (typeof value === 'object' && isEmptyObject(value)));
}
/**
 * null 이나 빈값을 기본값으로 변경
 *
 * @param str
 *            입력값
 * @param defaultVal
 *            기본값(옵션)
 * @returns {String} 체크 결과값
 */
function nvl(str, defaultVal) {
	var defaultValue = "";
	if(typeof defaultVal != 'undefined') {
		defaultValue = defaultVal;
	}
	if(typeof str == "undefined" || str == null || str == '' || str == "undefined") {
		return defaultValue;
	}
	return str;
}
/**
 * 길이체크
 *
 * @param str
 * @returns {Number}
 */
function checkLength(str) {
	var stringLength = str.length;
	var stringByteLength = 0;
	for(var i = 0; i < stringLength; i++) {
		if(escape(str.charAt(i)).length >= 4) {
			stringByteLength += 3;
		} else if(escape(str.charAt(i)) == "%A7") {
			stringByteLength += 3;
		} else {
			if(escape(str.charAt(i)) != "%0D") {
				stringByteLength++;
			}
		}
	}
	return stringByteLength;
}
/**
 * jquery messageProperties Load /message/messageResources_{lang}.properties
 *
 * @param lang
 */
function fnLoadBundles(lang) {
	if(lang == "ko") {
		lang = "ko_KR";
	} else if(lang == "en") {
		lang = "en_US";
	} else if(lang == "ja") {
		lang = "ja_JP";
	}
	jQuery.i18n.properties(
		{
			name : 'messageResources',
			path : '/message/',
			mode : 'both',
			language : lang,
			callback : function(data) {
			}
		});
}
/**
 * jquery message get ex) fnKecoMsg("errors.required", "제목")
 *
 * @param key
 * @returns
 */
function fnKecoMsg(key) {
	return jQuery.i18n.prop(key, arguments[1], arguments[2], arguments[3], arguments[4], arguments[5]);
}
function fnCommCodeList(grpCdIds, callBack) {
	var paramData = new Array();
	for(var i = 0; i < grpCdIds.length; i++) {
		paramData.push(
			{
				grpCdId : grpCdIds[i]
			});
	}
	$.ajax(
		{
			async : false,
			type : 'POST',
			url : _CTX_PATH + "/keco/common/code/retrieveCodeList.ajax",
			data : JSON.stringify(
				{
					grpCdIds : paramData
				}),
			contentType : "application/json; charset=UTF-8",
			dataType : "json",
			success : function(data) {
				if(callBack != null && callBack != "") {
					window[callBack](data);
				}
			},
			error : function(data, textStatus, errorThrown) {
				fnAjaxError();
			}
		});
}
// 날짜를 포맷합니다.
function formatYmd(cellvalue, options, rowObject) {
	// alert(cellvalue + "" + options + "" + rowObject);
	var re = /\D/;
	var re2 = /^\({1}\d{4}\)\d{2}\d{2}/;
	var num = cellvalue;
	if(num == null) {
		num = "";
	}
	var newNum = num;
	// yyyymmdd 날짜형식을 포맷합니다.
	// alert(num+"#"+)
	if(num != "" && re2.test(num) != true && num.length >= 8) {
		if(num != "") {
			while(re.test(num)) {
				num = num.replace(re, "");
			}
		}
		if(num.length >= 8) {
			// for format yyyy.mm.dd
			newNum = num.substring(0, 4) + '.' + num.substring(4, 6) + '.' + num.substring(6, 8);
		}
	}
	return newNum;
}
// 날짜를 포맷합니다.
function formatYmdHms(cellvalue, options, rowObject) {
	// alert(cellvalue + "" + options + "" + rowObject);
	var re = /\D/;
	var re2 = /^\({1}\d{4}\)\d{2}\d{2}\d{2}\d{2}\d{2}/;
	var re3 = /^\({1}\d{4}\)\d{2}\d{2}/;
	var num = cellvalue;
	if(num == null) {
		num = "";
	}
	var newNum = num;
	// yyyymmddhhmiss 날짜형식을 포맷합니다.
	if(num != "" && re2.test(num) != true && num.length > 8) {
		if(num != "") {
			while(re.test(num)) {
				num = num.replace(re, "");
			}
		}
		if(num.length > 8) {
			// for format yyyy-mm-dd
			newNum = num.substring(0, 4) + '.' + num.substring(4, 6) + '.' + num.substring(6, 8) + ' ' + num.substring(8, 10) + ':' + num.substring(10, 12) + ':' + num.substring(12, 14);
		} else if(num.length == 8) {
			// for format yyyy-mm-dd
			newNum = num.substring(0, 4) + '.' + num.substring(4, 6) + '.' + num.substring(6, 8);
		}
	} else {// yyyymmdd 날짜형식을 포맷합니다.
		if(num != "" && re3.test(num) != true && num.length >= 8) {
			if(num != "") {
				while(re.test(num)) {
					num = num.replace(re, "");
				}
			}
			if(num.length >= 8) {
				// for format yyyy-mm-dd
				newNum = num.substring(0, 4) + '.' + num.substring(4, 6) + '.' + num.substring(6, 8);
			}
		}
	}
	return newNum;
}
/**
 * 입력 키 체크
 *
 * @param event
 * @param type
 * @returns {Boolean}
 */
function onPress(event, type) {
	event = event || window.event;
	var keyId = (event.which) ? event.which : event.keyCode;
	if(type == "numbers") {
		// if( ( keyId >=48 && keyId <= 57 ) || ( keyId >=96 && keyId <= 105 ) )
		// {
		if((keyId >=48 && keyId <= 57 ) || ( keyId >=96 && keyId <= 105 ) || keyId == 8 || keyId == 46 || keyId == 37 || keyId == 39 ) {
			return true;
		} else {
			return false;
		}
	}
}
/**
 * 숫자만 입력하도록 함
 */
function fnNumberKey(event) {

	event = event || window.event;
	var keyId = (event.which) ? event.which : event.keyCode;

	if((keyId >=48 && keyId <= 57 ) || ( keyId >=96 && keyId <= 105 ) || keyId == 8 || keyId == 46 || keyId == 37 || keyId == 39 ) {
		return true;
	} else {
		return false;
	}
}


/**
 * 소수점 자리수 체크
 * onNumberLengthChk(_this, i_len, f_len)
 * i_len : 정수부 자리수
 * f_len : 소수부 자리수
 * onNumberLengthChk(this,3,2);
 * ex) 123.12
 * <input type="text" maxlength="6" onkeyup="onNumberLengthChk(this,3,2);" onchange="onNumberLengthChk(this,3,2);" name="" id="" value="" class="txtbox1" style="width:calc(100% - 10px);ime-mode:disabled;" />
 *
 * @param str
 * @return
 */
function onNumberLengthChk(_this, i_len, f_len) {
	var val = $(_this).val()+"";

	if(f_len > 0){
		val = val.replace(/[^0-9\.]/g,'');
	}else{
		val = val.replace(/[^0-9]/g,'');
	}

	var reg = new RegExp("^(\\d{1,"+i_len+"}([.]\\d{0,"+f_len+"})?)?$");
	//var reg = /^(\d{1,3}([.]\d{0,2})?)?$/;
	if(!reg.test(Number(val)) && val != ""){
		if(val.indexOf(".") > -1){
			var values = val.split(".");
			if(!values[0]){
				values[0] = 0;
			}
			if(values[1]){
				values[1] = values[1].substring(0,f_len);
			}
			val = values[0]+"."+values[1];
			val = Number(val);
			//val = val.toFixed(f_len);
		}else{
			val = val.substring(0,i_len);
		}
	}
	$(_this).val(Number(val));
}

/**
 * 날짜 수동 입력 시 자동으로 포맷을 맞춰줌
 */
function fnDateMask(event, formd, textid) {

	event = event || window.event;
	var keyId = (event.which) ? event.which : event.keyCode;

	if((keyId >=48 && keyId <= 57 ) || ( keyId >=96 && keyId <= 105 ) || keyId == 8 || keyId == 46 || keyId == 37 || keyId == 39 || keyId == 190 ) {
		var form = "document."+formd;
		var text = "form."+textid;

		var textlength = text.value.length;

		if (textlength == 4) {
			text.value = text.value + ".";
		} else if (textlength == 7) {
			text.value = text.value + ".";
		} else if (textlength > 9) {
			var chk_date = checkdate(text);
			if (chk_date == false) {
				return;
			}
		}

		return true;
	} else {
		return false;
	}

}

function fnCheckNumber(event) {
	event = event || window.event;
	var keyId = (event.which) ? event.which : event.keyCode;
	if((keyId >= 48 && keyId <= 57)) {
		return true;
	} else {
		return false;
	}
}
/*
 * 숫자만 입력 허용 @param obj
 *
 * @returns {String}
 */
function fnNumberOnly(obj) {
	var regexp = /[^[0-9]/gi;
	var newVal = "";
	var oldVal = $(obj).val();
	/*
	 * for (var i=0; i<oldVal.length; i++) { newVal +=
	 * toNumber(oldVal.charAt(i)); }
	 */
	newVal = toNumber(oldVal)
	$(obj).val(newVal);
}

function fnDateMaskObj(event, obj) {

	event = event || window.event;
	var keyId = (event.which) ? event.which : event.keyCode;

	if((keyId >=48 && keyId <= 57 ) || ( keyId >=96 && keyId <= 105 ) || keyId == 8 || keyId == 46 || keyId == 37 || keyId == 39 || keyId == 190 ) {

		var textlength = $(obj).val().length;

		if (textlength == 4) {
			$(obj).val($(obj).val() + ".");
		} else if (textlength == 7) {
			$(obj).val($(obj).val() + ".");
		} else if (textlength > 9) {
			var yyyymmdd = replaceAll($(obj).val(),".");
			if(yyyymmdd != "") {
				var year  = yyyymmdd.substring(0,4);
				var month = yyyymmdd.substring(4,6);
				var day = yyyymmdd.substring(6,8);

				var result = true; // \uc5d0\ub7ec \ubcc0\uc218
				var lastDay = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

				if (year%1000 != 0 && year%4 == 0) {
					lastDay[1] = 29;
				}

				if (day > lastDay[month-1] || day < 1) {
					result = false;        // \ub0a0\uc9dc \uccb4\ud06c
				}

				if (month < 1 || month > 12) {
					result = false;
				}
				if (month%1 != 0 || year%1 != 0 || day%1 != 0) {
					result = false;
				}

				if (!result) {
					return false;
				}
			}
		}

		return true;
	} else {
		return false;
	}

}

/**
 * strString문자를 strChar로 변환
 *
 * @param strString
 * @param strChar
 * @returns {String}
 */
function replaceAll(strString, strChar) {
	var resultValue = "";
	for(var i = 0; i < strString.length; i++) {
		if(strString.charAt(i) != strChar) {
			resultValue = resultValue + strString.charAt(i);
		}
	}
	return resultValue;
}
/**
 * html tag 제거
 *
 * @param htmlStr
 * @returns
 */
function removeTag(htmlStr) {
	return htmlStr.replace(/(<([^>]+)>)/gi, "");
}
/**
 * 숫자만 반환.
 *
 * @param obj
 * @returns
 */
function toNumber(obj) {
	return obj.replace(/[^0-9]/g, "");
}
/**
 * 사용여부코드를 사용여부코드명으로 반환
 *
 * @param cellValue
 * @param options
 * @param rowObject
 * @returns
 */
function formatUseYnNm(cellValue, options, rowObject) {
	var chgCellValue;
	if(cellValue == "Y")
		chgCellValue = "사용";
	else
		chgCellValue = "미사용";
	return chgCellValue;
}
/**
 * Html 의 tag 를 삭제
 *
 * @param cellValue
 * @param options
 * @param rowObject
 * @returns
 */
function formatHtmlContent(cellValue, options, rowObject) {
	var chgCellValue = "";
	chgCellValue = removeTag(cellValue)
	return chgCellValue;
}
/**
 * 한글 자르기
 *
 * @param value : stringData
 * @param valueSize : maxsize
 * @returns {string}
 */
function hanCut(hanValue, valueSize) {
	var tmpStr;
	var temp = 0;
	var onechar;
	var tcount;
	var returnStr = "";
	tcount = 0;
	tmpStr = new String(hanValue);
	temp = tmpStr.length;
	for(var k = 0; k < temp; k++) {
		onechar = tmpStr.charAt(k);
		if(escape(onechar).length > 3)
			tcount += 2; // 한글/한문/특수문자
		else if(onechar != ' ')
			tcount++; // 공백
		else if(onechar != '\r')
			tcount++; // 탭
		else if(onechar != '\n')
			tcount += 2; // 엔터
		if(tcount > valueSize) {
			return returnStr;
			break;
		}
		returnStr += onechar;
	}
	return returnStr;
}
/**
 * 행 추가
 *
 * @param page
 * @returns obj 행
 */
function fnAppendRow(page) {
	var find_row = "";
	var loop_tag_id = page.LOOP_TAG_ID;
	if(nvl(loop_tag_id) != "") {
		find_row = nvl(loop_tag_id);
	} else {
		if(nvl(page.TWOROW_YN) == "Y") {
			find_row = "tbody";
		} else {
			find_row = "tbody tr";
		}
	}
	var obj = $("#" + page.TABLE_ID).find(find_row).filter(".original").clone();
	//obj.attr("style", "display:visible");
	obj.attr("style", "display:");
	obj.removeClass("original");
	obj.addClass("generated");
	$("#" + page.TABLE_ID).find(find_row).filter(":last").after(obj);
	return obj;
}
/**
 * checkbox 전체 선택/해제
 *
 * @param obj
 * @param checkboxName
 * @returns
 */
function fnAllCheck(obj, checkboxName) {
	if($(obj).prop("checked")) {
		//$("input:checkbox[name=" + checkboxName + "]").prop("checked", true);
		$("input:checkbox[name=" + checkboxName + "]").each(function(){
			//alert($(this).prop("disabled"))
			if ( !$(this).prop("disabled") ) {
				$(this).prop("checked", true);
			}
		});
	} else {
		$("input:checkbox[name=" + checkboxName + "]").prop("checked", false);
	}
}
/**
 * 시분 체크
 *
 * @param obj
 * @param checkboxName
 * @returns
 */
function chkTime(obj) {
	var input = $.trim(obj.value.replace(/:/g, ""));
	var inputHours = input.substr(0, 2);
	var inputMinutes = input.substr(2, 2);
	var inputSeconds = 0;
	if(input.length < 1)
		return "";
	if(inputHours.length < 1) {
		inputHours = "00";
	} else if(inputHours.length < 2) {
		inputHours = "0" + inputHours;
	}
	if(inputMinutes.length < 1) {
		inputMinutes = "00";
	} else if(inputMinutes.length < 2) {
		inputMinutes = "0" + inputMinutes;
	}
	var resultTime = new Date(0, 0, 0, inputHours, inputMinutes, inputSeconds);
	if(resultTime.getHours() != inputHours || resultTime.getMinutes() != inputMinutes) {
		obj.value = "";
	} else {
		obj.value = inputHours + ":" + inputMinutes;
	}
}
// 금액를 포맷합니다.
function formatAmt(cellvalue, options, rowObject) {
	if(cellvalue == null)
		return "";
	return comma(cellvalue) + " 원";
}

//금액를 포맷합니다.
function formatComma(cellvalue, options, rowObject) {
	if(cellvalue == null)
		return "";
	return comma(cellvalue);
}

function comma(num) {
	var len, point, str;
	if(num == null)
		return "";
	num = num + "";
	point = num.length % 3;
	len = num.length;
	str = num.substring(0, point);
	while(point < len) {
		if(str != "")
			str += ",";
		str += num.substring(point, point + 3);
		point += 3;
	}
	return str;
}
function numberWithCommas(x) {
	if(x == null)
		return "";
	return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
function getGridRowNumber(cellvalue, options, rowObject) {
	var currentNum;
	var _GRIDPARAM = $("#table_list").jqGrid('getGridParam');
	var records = nvl(_GRIDPARAM.records, 0);
	var page = nvl(_GRIDPARAM.page, 0);
	var rows = nvl(_GRIDPARAM.rowNum, 0);
	var currentNo = options.rowId;
	// var page = nvl($("#page").val(), 0);
	// var rows = nvl($("#rows").val(), 0);
	currentNum = (records - (page - 1) * rows) - (currentNo - 1);
	return currentNum;
}
// Server Valid Error
function fnValidError(data) {
	if(data.vaildErrorMsg != undefined && !isEmpty(data.vaildErrorMsg)) {
		if(!isEmpty(data.vaildErrorFileId)) {
            $("#"+data.vaildErrorFileId).focus();
        }

		alert(data.vaildErrorMsg);

		if(data.vaildErrorFileId == "ERR001") {
			fnBackLogin();
		}

		return false;
	}

	return true;
}
function fnValidErrorBackup(data) {
	if(!isEmpty(data.vaildErrorMsg)) {
		if(!isEmpty(data.vaildErrorFileId)) {
			$("#" + data.vaildErrorFileId).focus();
		}
		alert(data.vaildErrorMsg);
		if(data.vaildErrorFileId == "ERR001") {
			var curUrl = document.location.href;
			var loginUrl = "";
			if(curUrl.indexOf("/keco/") > -1) {
				loginUrl = _CTX_PATH + "/keco/login/login/initLoginAction.do";
			} else if(curUrl.indexOf("/app/") > -1) {
				loginUrl = _CTX_PATH + "/app/login/retrieveULOLogin.do";
			} else {
				loginUrl = _CTX_PATH + "/user/login/retrieveULOLogin.do";
			}

			if(window.opener){
				//opener가 이미 closed됐는지 확인. closed됐다면 해당 페이지를 이동
				if(window.opener.closed){
					top.location.href = loginUrl;
				} else { // opener가 존재하면 opener의 top을 해당 페이지로 이동
					window.opener.top.location.href = loginUrl;
					window.open('about:blank','_self').close();
				}
			} else { // popup이 아니라면 해당 페이지를 이동
				top.location.href = loginUrl;
			}
		}
		return false;
	}
	return true;
}

//Server Ajax error
function fnAjaxError(data) {

	console.log(data.status);

	if(data.status == "401") {
		var curUrl = document.location.href;
		var loginUrl = "";
		if(curUrl.indexOf("/keco/") > -1) {
			loginUrl = _CTX_PATH + "/keco/";
		} else if(curUrl.indexOf("/app/") > -1) {
			loginUrl = _CTX_PATH + "/app/";
		} else {
			loginUrl = _CTX_PATH + "/";
		}
		if ( data.responseJSON.exception.message != undefined ) {
			alert(data.responseJSON.exception.message);
		} else {
			alert("해당 화면에 접근권한이 없습니다.");
		}

		if(window.opener){
			//opener가 이미 closed됐는지 확인. closed됐다면 해당 페이지를 이동
			if(window.opener.closed){
				top.location.href = loginUrl;
			} else { // opener가 존재하면 opener의 top을 해당 페이지로 이동
				window.opener.top.location.href = loginUrl;
				window.open('about:blank','_self').close();
			}
		} else { // popup이 아니라면 해당 페이지를 이동
			if(curUrl.indexOf("/keco/") > -1) {
				top.location.href = loginUrl;
			}else{
				//ajax 화면 움직이지 않고 걍 대기
				return false ;
			}
		}
	} else if(data.status == "403") {
		var curUrl = document.location.href;
		var loginUrl = "";
		if(curUrl.indexOf("/keco/") > -1) {
			loginUrl = _CTX_PATH + "/keco/login/login/initLoginAction.do";
		} else {
			loginUrl = _CTX_PATH + "/keco/login/login/initLoginAction.do";
		}

		alert("로그인 정보가 없습니다. 로그인 후 사용하여주시기 바랍니다.");

		if(window.opener){
			//opener가 이미 closed됐는지 확인. closed됐다면 해당 페이지를 이동
			if(window.opener.closed){
				top.location.href = loginUrl;
			} else { // opener가 존재하면 opener의 top을 해당 페이지로 이동
				window.opener.top.location.href = loginUrl;
				window.open('about:blank','_self').close();
			}
		} else { // popup이 아니라면 해당 페이지를 이동
			top.location.href = loginUrl;
		}
	} else {
		alert("서버에 통신 중에 에러가 발생하였습니다.");
		return false;
	}
	return false;
}

function compareNumbers(a, b) {
	return a - b;
}

/**
 * 페이징관련함수
 *
 */
var PageUtil = function(pageDivId, paginationInfo, jsFunction, pageDivCd) {	 // 페이지처리함수
	console.log("paginationInfo : ", paginationInfo);
	var pageDivHtml = "";
	var firstPageNo = paginationInfo.firstPageNo;							// 첫페이지번호
	var firstPageNoOnPageList = paginationInfo.firstPageNoOnPageList;		// 이전페이지
	var totalPageCount = paginationInfo.totalPageCount;						// 총페이지갯수
	var pageSize = paginationInfo.pageSize;									// 총건수
	var lastPageNoOnPageList = paginationInfo.lastPageNoOnPageList;			// 다음페이지
	var currentPageNo = paginationInfo.currentPageNo;						// 현재페이지
	var lastPageNo = paginationInfo.lastPageNo;								// 마지막페이지번호
	var recordCountPerPage = paginationInfo.recordCountPerPage;				// 한번에출력될게시물수
	var numberSpliter = "";

	if(pageDivCd == "M") {
		if(totalPageCount > pageSize) {
			if (firstPageNoOnPageList > pageSize) {
				pageDivHtml += "<a href=\"#\" onclick=\""+ jsFunction +"("+ (Number(firstPageNoOnPageList) - 1) +");\" class=\"ui-btn ui-btn-inline ui-mini\" title=\"이전 페이지로 이동\"></a>\n";
			} else {
				pageDivHtml += "<a href=\"#\" onclick=\""+ jsFunction +"("+ firstPageNo +");\" class=\"ui-btn ui-btn-inline ui-mini\" title=\"이전 페이지로 이동\"></a>\n";
			}
		} else {
			pageDivHtml += "<a href=\"#\" class=\"ui-disabled ui-btn ui-btn-inline ui-mini\" title=\"이전 페이지로 이동\"></a>\n";
		}
		for (var i = firstPageNoOnPageList; i <= lastPageNoOnPageList; i++) {
			if (i == currentPageNo){
				pageDivHtml += "<a href=\"\" class=\"ui-btn-active ui-btn ui-btn-inline ui-mini\">"+ i +"</a>\n";
				if (lastPageNoOnPageList != i) {
					pageDivHtml += numberSpliter;
				}
			} else {
				pageDivHtml += "<a href=\"#\" onclick=\""+ jsFunction +"("+ i +"); return false;\" class=\"ui-btn ui-btn-inline ui-mini\">"+ i +"</a>\n";
				if (lastPageNoOnPageList != i) {
					pageDivHtml += numberSpliter;
				}
			}
		}

		if(totalPageCount > pageSize) {
			if(lastPageNoOnPageList < totalPageCount) {
				pageDivHtml += "<a href=\"#\" onclick=\""+ jsFunction +"("+ (Number(firstPageNoOnPageList) + Number(pageSize)) +");\" class=\"ui-btn ui-btn-inline ui-mini\" title=\"다음 페이지로 이동\"> </a>\n";
			} else {
				pageDivHtml += "<a href=\"#\" onclick=\""+ jsFunction +"("+ lastPageNo +");\" class=\"ui-btn ui-btn-inline ui-mini\" title=\"다음 페이지로 이동\"> </a>\n";
			}
		} else {
			pageDivHtml += "<a href=\"#\" class=\"ui-disabled  ui-btn ui-btn-inline ui-mini\" title=\"다음 페이지로 이동\">&gt;</a>\n";
		}

	} else {
		if(totalPageCount > pageSize) {
			if (firstPageNoOnPageList > pageSize) {
				pageDivHtml += "<a href=\"#\" onclick=\""+ jsFunction +"("+ firstPageNo +"); return false;\" title=\"첫 페이지로 이동\">&lt;&lt;</a>\n";
				pageDivHtml += "<a href=\"#\" onclick=\""+ jsFunction +"("+ (Number(firstPageNoOnPageList) - 1) +"); \" title=\"이전 페이지로 이동\">&lt;</a>\n";
			} else {
				pageDivHtml += "<a href=\"#\" onclick=\""+ jsFunction +"("+ firstPageNo +"); return false;\" title=\"첫 페이지로 이동\">&lt;&lt;</a>\n";
				pageDivHtml += "<a href=\"#\" onclick=\""+ jsFunction +"("+ firstPageNo +"); \" title=\"이전 페이지로 이동\">&lt;</a>\n";
			}
		}

		for (var i = firstPageNoOnPageList; i <= lastPageNoOnPageList; i++) {
			if (i == currentPageNo){
				pageDivHtml += "<span>"+ i +"</span>\n";
				if (lastPageNoOnPageList != i) {
					pageDivHtml += numberSpliter;
				}
			} else {
				pageDivHtml += "<a href=\"#\" onclick=\""+ jsFunction +"("+ i +"); return false; \">"+ i+"</a>\n";
				if (lastPageNoOnPageList != i) {
					pageDivHtml += numberSpliter;
				}
			}
		}

		if(totalPageCount > pageSize) {
			if(lastPageNoOnPageList < totalPageCount) {
				pageDivHtml += "<a href=\"#\" onclick=\""+ jsFunction +"("+ (Number(firstPageNoOnPageList) + Number(pageSize)) +"); \" title=\"다음 페이지로 이동\">&gt;</a>\n";
				pageDivHtml += "<a href=\"#\" onclick=\""+ jsFunction +"("+ lastPageNo +"); return false;\" title=\"마지막 페이지로 이동\">&gt;&gt;</a>";
			} else {
				pageDivHtml += "<a href=\"#\" onclick=\""+ jsFunction +"("+ lastPageNo +"); \" title=\"다음 페이지로 이동\">&gt;</a>\n";
				pageDivHtml += "<a href=\"#\" onclick=\""+ jsFunction +"("+ lastPageNo +"); return false;\" title=\"마지막 페이지로 이동\">&gt;&gt;</a>";
			}
		}
	}
	$("#"+pageDivId).html(pageDivHtml);

}

var CountPerPageUtil = function(pageDivId, recordCountPerPage, jsFunction) {	 // 페이지처리함수
	var recordCountPerPage = Number(recordCountPerPage);
	var pageDivHtml = $("#"+pageDivId).html();

	pageDivHtml += "<select name=\"recordCountPerPage\" id=\"recordCountPerPage\">\n";
	pageDivHtml += "<option value=\"10\" "+((Number(recordCountPerPage)==10)?"selected=\"selected\"":"")+">10개씩</option>\n";
	pageDivHtml += "<option value=\"20\" "+((Number(recordCountPerPage)==20)?"selected=\"selected\"":"")+">20개씩</option>\n";
	pageDivHtml += "<option value=\"50\" "+((Number(recordCountPerPage)==50)?"selected=\"selected\"":"")+">50개씩</option>\n";
	pageDivHtml += "<option value=\"100\" "+((Number(recordCountPerPage)==100)?"selected=\"selected\"":"")+">100개씩</option>\n";
	pageDivHtml += "</select>\n";
	pageDivHtml += "<button type=\"button\" class=\"btn-b gray\" onclick=\""+jsFunction+"(); return false;\">\n";
	pageDivHtml += "<span>보기</span>\n";
	pageDivHtml += "</button>";

	$("#"+pageDivId).html(pageDivHtml);
}

/**
 * 지정한 기간에서 term기간(month) 만큼 날자를 계산
 * 20060308, 2 ==> return 20060507
 * 20060308, -1 ==> return 20060209
 */
function addMonth(dt, term) {
    var date = toTimeObject(dt);

    var years  = date.getFullYear();
    var months = date.getMonth() + term;
    var days   = 0;
    if(term>0)  {
        days   = date.getDate() - 1;
    } else {
        days   = date.getDate() + 1;
    }

    var timeObj = new Date(years,months,days);
    return toTimeString(timeObj).substring(0,dt.length);
}

/**
 * 지정한 기간에서 term기간(week) 만큼 날자를 계산
 * addDay를 이용하며 term*7의 일자를 계산한다.
 */
function addWeek(dt, term) {
    return addDay(dt, term*7);
}

/**
 * 지정한 기간에서 term기간(day) 만큼 날자를 계산
 * 20060308, 2 ==> return 20060310
 * 20060308, -1 ==> return 20060307
 */
function addDay(dt, term) {
    var date = toTimeObject(dt);

    var years  = date.getFullYear();
    var months = date.getMonth();
    var days   = date.getDate() + term;

    timeObj = new Date(years,months,days);
    return toTimeString(timeObj).substring(0,dt.length);
}

/**
 * Time 스트링을 자바스크립트 Date 객체로 변환
 * parameter time: Time 형식의 String
 */
function toTimeObject(time) { //parseTime(time)
    var year  = time.substring( 0,  4);
    var month = time.substring( 4,  6) - 1; // 1월=0,12월=11
    var day   = time.substring( 6,  8);
    var hour  = time.substring( 8, 10);
    var min   = time.substring(10, 12);

    return new Date(year,month,day,hour,min);
}

/**
 * 자바스크립트 Date 객체를 Time 스트링으로 변환
 * parameter date: JavaScript Date Object
 */
function toTimeString(date) { //formatTime(date)
    var year  = date.getFullYear();
    var month = date.getMonth() + 1; // 1월=0,12월=11이므로 1 더함
    var day   = date.getDate();
    var hour  = date.getHours();
    var min   = date.getMinutes();

    if (("" + month).length == 1) { month = "0" + month; }
    if (("" + day).length   == 1) { day   = "0" + day;   }
    if (("" + hour).length  == 1) { hour  = "0" + hour;  }
    if (("" + min).length   == 1) { min   = "0" + min;   }

    return ("" + year + month + day + hour + min);
}

/**
 * 유효하는(존재하는) Date 인지 체크
 * @param strDate : 검증할 string형식의 날짜(날짜형식"20090101") yyyymmdd
 * @returns : true, false
 * @example : if(!isValidDate(strDate)) alert("올바른 날짜가 아닙니다.");
 */
function isValidDate(strDate) {
    var year  = "";
    var month = "";
    var day   = "";

    if(strDate.length == 8) {
        year  = strDate.substring(0,4);
        month = strDate.substring(4,6);
        day   = strDate.substring(6,8);
        if(Number(year,10) >= 1900  && isValidMonth(month) && isValidDay(year,month,day)) {
            return true;
        }
    } else if(strDate.length == 6) {
        year  = strDate.substring(0,4);
        month = strDate.substring(4,6);

        if(Number(year,10) >= 1900 && isValidMonth(month)) {
            return true;
        }
    }

    return false;
}

/**
 * 유효한(존재하는) 월(月)인지 체크
 * @param mm : 검증할 월(형식"01" ~ "12")
 * @returns : true, false
 * @example : isValidMonth(mm)
 */
function isValidMonth(mm) {
    var m = Number(mm,10);
    return (m >= 1 && m <= 12);
}
/**
 * 유효한(존재하는) 일(日)인지 체크
 * @param yyyy : 검증할 년(형식"2009")
 * @param mm : 검증할 월(형식"01" ~ "12")
 * @param dd : 검증할 일(형식"01" ~ "31")
 * @returns : true, false
 * @example : isValidDay(yyyy, mm, dd)
 */
function isValidDay(yyyy, mm, dd) {
    var m   = Number(mm,10) - 1;
    var d   = Number(dd,10);
    var end = new Array(31,28,31,30,31,30,31,31,30,31,30,31);

    if((yyyy % 4 == 0 && yyyy % 100 != 0) || yyyy % 400 == 0) {
        end[1] = 29;
    }

    return (d >= 1 && d <= end[m]);
}

/**
 * 날짜시간포멧 리턴 함수
 * @param format:    yyyymmdd or hh24miss or hh12miss 를 이용
 * @param datetime   임시 용도
 * @param isRealTime true/false 서버시간을 사용할지의 여부. 사용하면 true 아니면 false
 * @returns : 포멧된 날짜 시간
 * @example : getDateTime("yyyy.mm.dd",,true); or getDateTime("hh24:mi:ss","20120302111658",false)
 */
function getDateTime(format, datetime) {

	var today   = getToday();
    var yyyy    = "";
    var yy		= "";
    var mm      = "";
    var dd      = "";

    var time    = getTime();
    var hh24    = "";
    var mi      = "";
    var ss      = "";


    if(datetime == undefined || trim(datetime) == "") {
        yyyy    = today.substring(0,4);
        yy		= today.substring(2,4);
        mm      = lpad(today.substring(4,6),2,"0");
        dd      = lpad(today.substring(6,8),2,"0");

        hh24    = time.substring(0, 2);
        mi      = time.substring(2, 4);
        ss      = time.substring(4);
    } else {
        if(datetime.length==6) {
            hh24    = lpad(datetime.substring(0,2),2,"0");
            mi      = lpad(datetime.substring(2,4),2,"0");
            ss      = lpad(datetime.substring(4,6),2,"0");
        } else if(datetime.length==8) {
            yyyy    = datetime.substring(0,4);
            yy		= datetime.substring(2,4);
            mm      = lpad(datetime.substring(4,6),2,"0");
            dd      = lpad(datetime.substring(6,8),2,"0");
        } else if(datetime.length==14) {
            yyyy    = datetime.substring(0,4);
            yy		= datetime.substring(2,4);
            mm      = lpad(datetime.substring(4,6),2,"0");
            dd      = lpad(datetime.substring(6,8),2,"0");
            hh24    = lpad(datetime.substring(8,10),2,"0");
            mi      = lpad(datetime.substring(10,12),2,"0");
            ss      = lpad(datetime.substring(12,14),2,"0");
        }
    }

    if(format.indexOf("yyyy") > -1) {
        format = format.replaceAll("yyyy", yyyy);
    }
    if(format.indexOf("yy") > -1) {
        format = format.replaceAll("yy", yy);
    }
    if(format.indexOf("mm") > -1) {
        format = format.replaceAll("mm",mm);
    }
    if(format.indexOf("dd") > -1) {
        format = format.replaceAll("dd",dd);
    }
    if(format.indexOf("hh24") > -1) {
        format = format.replaceAll("hh24",hh24);
    }
    if(format.indexOf("hh12") > -1) {
        if(hh24 > 12) {
            hh24 = hh24 -12;
            hh24 = lpad(hh24,2,"0");
        }
        format = format.replaceAll("hh12",hh24);
    }
    if(format.indexOf("mi") > -1) {
        format = format.replaceAll("mi", mi);
    }
    if(format.indexOf("ss") > -1) {
        format = format.replaceAll("ss", ss);
    }

    return format;
}

/**
 * Left 빈자리 만큼 str 을 붙인다.
 * @param src : Right에 붙을 원본 데이터
 * @param len : str붙힐 데이터 길이
 * @param str : 대상 데이터
 * @returns : str과 src가 붙은 데이터
 * @example : lpad("123123", 10, " ");
 */
function lpad(src, len, str) {
    var retStr = "";
    var padCnt = Number(len) - String(src).length;

    for(var i=0;i<padCnt;i++) {
        retStr += String(str);
    }

    return retStr+src;
}
/**
 * Right 빈자리 만큼 str 을 붙인다.
 * @param src : Left에 붙을 원본 데이터
 * @param len : str붙힐 데이터 길이
 * @param str : 대상 데이터
 * @returns : str과 src가 붙은 데이터
 * @example : rpad("123123", 10, " ");
 */
function rpad(src, len, str) {
    var retStr = "";
    var padCnt = Number(len) - String(src).length;

    for(var i=0;i<padCnt;i++) {
        retStr += String(str);
    }

    return src+retStr;
}

/**
 * 오늘날짜 반환
 * @param 없음
 * @returns : yyyymmdd : 오늘날짜
 * @example : getToday(gubun);
 */
function getToday(gubun) {
	var today = new Date();
	var dd = today.getDate();
	var mm = today.getMonth()+1; //January is 0!
	var yyyy = today.getFullYear();

	if ( gubun == undefined ) gubun = "";

	if( dd < 10 ) {
		dd='0'+dd;
	}
	if( mm < 10 ) {
	    mm='0'+mm;
	}

	today = yyyy+gubun+mm+gubun+dd;
	return today;
}

/**
 * 현재시각 반환
 * @param 없음
 * @returns : hh24miss : 현재시각
 * @example : getTime();
 */
function getTime(gubun) {
	var today = new Date();

	var hours = today.getHours();
	var minutes = today.getMinutes();
	var seconds = today.getSeconds();
	var milliseconds = today.getMilliseconds();

	if ( gubun == undefined ) gubun = "";

	if( minutes < 10 ) {
		minutes='0'+minutes;
	}
	if( seconds < 10 ) {
		seconds='0'+seconds
	}

	today = hours+gubun+minutes+gubun+seconds;
	return today;
}

/**
 * 두 Time이 몇 개월 차이나는지 구함
 * time1이 time2보다 크면(미래면) minus(-)
 */
function getMonthInterval(time1,time2) {
    var date1 = toTimeObject(time1.replaceAll('.','').replaceAll('-',''));
    var date2 = toTimeObject(time2.replaceAll('.','').replaceAll('-',''));

    var years  = date2.getFullYear() - date1.getFullYear();
    var months = date2.getMonth() - date1.getMonth();
    var days   = date2.getDate() - date1.getDate();

    return (years * 12 + months + (days >= 0 ? 0 : -1) );
}
/**
 * 두 Time이 며칠 차이나는지 구함
 * time1이 time2보다 크면(미래면) minus(-)
 */
function getDayInterval(time1, time2) {
    var date1 = toTimeObject(time1.replaceAll('-','').replaceAll('.',''));
    var date2 = toTimeObject(time2.replaceAll('-','').replaceAll('.',''));
    var day   = 1000 * 3600 * 24; //24시간
    //console.log("1="+(date2 - date1));
    //console.log("1="+((date2 - date1) / day));
    return parseInt((date2 - date1) / day, 10);
}
/**
 * 두 Time이 몇 시간 차이나는지 구함
 * time1이 time2보다 크면(미래면) minus(-)
 */
function getHourInterval(time1,time2) {
    var date1 = toTimeObject(time1.replaceAll('-','').replaceAll('.',''));
    var date2 = toTimeObject(time2.replaceAll('-','').replaceAll('.',''));
    var hour  = 1000 * 3600; //1시간

    return parseInt((date2 - date1) / hour, 10);
}
/**
 * 자바스크립트 Date 객체를 Time 스트링으로 변환
 * parameter date: JavaScript Date Object
 */
function toTimeString(date) { //formatTime(date)
    var year  = date.getFullYear();
    var month = date.getMonth() + 1; // 1월=0,12월=11이므로 1 더함
    var day   = date.getDate();
    var hour  = date.getHours();
    var min   = date.getMinutes();

    if (("" + month).length == 1) { month = "0" + month; }
    if (("" + day).length   == 1) { day   = "0" + day;   }
    if (("" + hour).length  == 1) { hour  = "0" + hour;  }
    if (("" + min).length   == 1) { min   = "0" + min;   }

    return ("" + year + month + day + hour + min);
}

/**
 * 변수가 undefined 일 경우 대체
 * @param v : 원본값
 * @param r : 대체값
 * @example : null2void($("#aaa").val(), "");
 */
function null2void(v, r) {
    if(v == undefined || v == "undefined") {
        if(r == undefined || r == "undefined") {
            v = "";
        } else {
            v = r;
        }
    }

    return v;
}

/**
 * replaceAll 처리
 */
String.prototype.replaceAll = function(strValue1, strValue2) {
    return this.split(strValue1).join(strValue2);
};

/**
 * get 쿠키
 * @param cookieName
 * @returns
 * ex)
 * if(fnGetCookie("cookeName") != "done") {
 */
function fnGetCookie(cookieName) {
	var nameOfCookie = cookieName + "=";
	var x = 0;
	while (x <= document.cookie.length){
		var y = (x + nameOfCookie.length);
		if (document.cookie.substring(x, y) == nameOfCookie){
			var endOfCookie = document.cookie.indexOf(";", y);
			if (endOfCookie == -1)
			endOfCookie = document.cookie.length;
			return unescape (document.cookie.substring(y, endOfCookie));
		}
		x = document.cookie.indexOf (" ", x) + 1;
		if (x == 0) break;
	}
	return "";
}

/**
 *  set 쿠키
 * @param cookieName
 * @param value
 * @param expiredays
 * ex)
 * fnSetCookie("cookeName", "done", 1);
 */
function fnSetCookie(cookieName, value, expiredays) {
	var todayDate = new Date();
	todayDate.setDate (todayDate.getDate() + expiredays);
	document.cookie = cookieName + "=" + escape(value) + "; path=/; expires=" + todayDate.toGMTString() + ";";
}

function fnDeleteCookie(cookieName) {
	var expireDate = new Date();

	//어제 날짜를 쿠키 소멸 날짜로 설정한다.
	expireDate.setDate( expireDate.getDate() - 1 );
	document.cookie = cookieName + "= " + "; expires=" + expireDate.toGMTString() + "; path=/";
}

/**
 *  비밀번호 체크 로직(id)
 *  @param obj -- id를 입력
 */
function fnCheckPass(txtId){
	var obj = $("#" + txtId);
    var alpha = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
    var number = "1234567890";
// var sChar = "-_=+\|()*&^%$#@!~`?></;,.:'";
    var sChar = " !@$%^&*#";
    var sChar_Count = 0;
    var alphaCheck = false;
    var numberCheck = false;
    var $msg = obj.closest("tr").find("p.msg");
    var returnTxt = "";
    var pw = obj.val();
    if(9 <= pw.length && pw.length <= 15){
        for(var i=0; i<pw.length; i++){
            if(sChar.indexOf(pw.charAt(i)) != -1){
                sChar_Count++;
            }
            if(alpha.indexOf(pw.charAt(i)) != -1){
                alphaCheck = true;
            }
            if(number.indexOf(pw.charAt(i)) != -1){
                numberCheck = true;
            }
        }
        if(sChar_Count < 1 || alphaCheck != true || numberCheck != true){
        	returnTxt = "비밀번호는 9~15자 영문,숫자,특수문자 1자 이상으로 조합해주세요.";
            return returnTxt;
        }
    }else{
    	returnTxt = "비밀번호는 9~15자 영문,숫자,특수문자 1자 이상으로 조합해주세요.";
        return returnTxt;
    }
    return returnTxt;
}

var fnByteCheck = {
	getByteLength : function(s) {
		if (s == null || s.length == 0) {
			return 0;
		}
		var size = 0;
		for ( var i = 0; i < s.length; i++) {
			size += this.charByteSize(s.charAt(i));
		}
		return size;
	},

	cutByteLength : function(s, len) {
		if (s == null || s.length == 0) {
			return 0;
		}
		var size = 0;
		var rIndex = s.length;

		for ( var i = 0; i < s.length; i++) {
			size += this.charByteSize(s.charAt(i));
			if( size == len ) {
				rIndex = i + 1;
				break;
			} else if( size > len ) {
				rIndex = i;
				break;
			}
		}

		return s.substring(0, rIndex);
	},

	charByteSize : function(ch) {

		if (ch == null || ch.length == 0) {
			return 0;
		}

		var charCode = ch.charCodeAt(0);

		if (charCode <= 0x00007F) {
			return 1;
		} else if (charCode <= 0x0007FF) {
			return 2;
		} else if (charCode <= 0x00FFFF) {
			return 3;
		} else {
			return 4;
		}
	}
};

function tz(orgVal) {
	var changeVal	= "";

	if ( orgVal == null ) return "";

	changeVal = orgVal.replaceAll("&quot;", 	"#!@$#");
	changeVal = changeVal.replaceAll("&apos;", 	"~!@#$%^&*()_+");
//	changeVal = changeVal.replaceAll("\r\n", 	"<br/>");

	return changeVal;
}

/*
 * Form 생성
 */
function fnAddForm(formId) {

	$("#"+formId).remove();

	var $form = $('<form id="'+formId+'" method="" action=""></form>');
    $form.appendTo("BODY");

    return $form;
}

/*
 * input hidden 필드 생성
 */
function fnAddInput($form, inputId, inputName, inputVal) {

	var $input = $('<input>', {
	    type: 'hidden',
	    id: inputId,
	    name: inputName,
	    value: inputVal
	});

	$form.append($input);
}

/*
 * 메일 발송 팝업
 */
function fnSendMailPop($form) {
	var VIEW_MAIL = window.open('', 'VIEW_MAIL' , 'width=800, height=500, resizable=yes, scrollbars=yes, left=200, top=100');
	VIEW_MAIL.focus();

	$form.attr("action", _CTX_PATH+"/dks/keco/mail/handleCSMMail.do");
    $form.attr("method", "POST");
    $form.attr("target", "VIEW_MAIL");
    $form.submit();
}

/*
 * sms 발송 팝업
 */
function fnSendSmsPop($form) {
	var VIEW_SMS = window.open('', 'VIEW_SMS' , 'width=800, height=500, resizable=yes, scrollbars=yes, left=200, top=100');
	VIEW_SMS.focus();

	$form.attr("action", _CTX_PATH+"/dks/keco/sms/handleCSSSms.do");
    $form.attr("method", "POST");
    $form.attr("target", "VIEW_SMS");
    $form.submit();
}

/*
 * 쪽지 발송 팝업
 */
function fnSendMemoPop($form) {
	var VIEW_MEMO = window.open('', 'VIEW_MEMO' , 'width=1000, height=500, resizable=yes, scrollbars=yes, left=200, top=100');
	VIEW_MEMO.focus();

	$form.attr("action", _CTX_PATH+"/dks/keco/memo/handleCSMMemo.do");
    $form.attr("method", "POST");
    $form.attr("target", "VIEW_MEMO");
    $form.submit();
}

/*
 * 문자열 자르기
 */
function substr(str, start, end) {
	if ( str == undefined ) return str;
	var changStr = 	str.substring(start, end);
	return changStr;
}

/*
 * 강의 홈 페이지로 이동
 */
function fnSbjtViewMovePage(sbjtId, cntsId, mobileYn) {

	var sUrl	= '';
	if ( mobileYn != undefined && mobileYn == 'Y' ) {
		sUrl	= _CTX_PATH+"/ekp/app/course/initUCRCourse.sdo";
	} else {
		sUrl	= _CTX_PATH+"/ekp/user/course/initUCRCourse.sdo";
	}

	var $form	= fnAddForm('sbjtForm');
	fnAddInput($form, 'sbjtId', 'sbjtId', sbjtId);
	fnAddInput($form, 'cntsId', 'cntsId', cntsId);

	$form.attr("action", sUrl);
    $form.attr("method", "GET");
    $form.attr("target", "_self");
    $form.submit();
}

/*
 * HTML 태크 원복
 */
function fnRecoveHtml(sourceVal) {

	var changeVal	= '';
	if ( sourceVal == '' ) return changeVal;

	changeVal = sourceVal.replace(/&amp;/g, '&');
	changeVal = changeVal.replace(/&lt;/g, '<');
	changeVal = changeVal.replace(/&gt;/g, '>');
	//changeVal = changeVal.replace(/&apos;/g, '\'');
	//changeVal = changeVal.replace(/&quot;/g, '\"');

	return changeVal
}

/**
 * 절상, 절하, 반올림 처리
 * @param strMode  - 수식
 * @param nCalcVal - 처리할 값(소수점 이하 데이터 포함)
 * @param nDigit   - 연산 기준 자릿수(오라클의 ROUND함수 자릿수 기준)
 *                   -2:십단위, -1:원단위, 0:소수점 1자리
 *                   1:소수점 2자리, 2:소수점 3자리, 3:소수점 4자리, 4:소수점 5자리 처리
 * @return String nCalcVal
 */
function fnCalcMath(strMode, nCalcVal, nDigit) {
    if(strMode == "CEIL") {  //절상
        if(nDigit < 0) {
            nDigit = -(nDigit);
            nCalcVal = Math.ceil(nCalcVal / Math.pow(10, nDigit)) * Math.pow(10, nDigit);
        } else {
            nCalcVal = Math.ceil(nCalcVal * Math.pow(10, nDigit)) / Math.pow(10, nDigit);
        }
    } else if(strMode == "FLOOR") { //절하
        if(nDigit < 0) {
            nDigit = -(nDigit);
            nCalcVal = Math.floor(nCalcVal / Math.pow(10, nDigit)) * Math.pow(10, nDigit);
        } else {
            nCalcVal = Math.floor(nCalcVal * Math.pow(10, nDigit)) / Math.pow(10, nDigit);
        }
    } else {        //반올림
        if(nDigit < 0) {
            nDigit = -(nDigit);
            nCalcVal = Math.round(nCalcVal / Math.pow(10, nDigit)) * Math.pow(10, nDigit);
        } else {
            nCalcVal = Math.round(nCalcVal * Math.pow(10, nDigit)) / Math.pow(10, nDigit);
        }
    }
    return nCalcVal;
}
function fnCallLink(url) {
	if(jQuery.browser.app == "android" || jQuery.browser.app == "ios") {
		document.location.href = "prefix:OutBrw?"+encodeURIComponent(url);
	}else{
		window.open(url,'_blank');
	}
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