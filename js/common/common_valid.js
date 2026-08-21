var validMsgMap  = {};

validMsgMap["required"] = "errors.required";
validMsgMap["remote"] = "errors.remote";
validMsgMap["email"] = "errors.email";
validMsgMap["url"] = "errors.url";
validMsgMap["date"] = "errors.date";
validMsgMap["dateISO"] = "errors.dateISO";
validMsgMap["number"] = "errors.number";
validMsgMap["digits"] = "errors.digits";
validMsgMap["creditcard"] = "errors.creditcard";
validMsgMap["equalTo"] = "errors.equalTo";
validMsgMap["minDate"] = "errors.minDate";
validMsgMap["maxDate"] ="errors.maxDate";
validMsgMap["minlength"] = "errors.minlength";
validMsgMap["maxlength"] = "errors.maxlength";
validMsgMap["rangelength"] = "errors.rangelength";
validMsgMap["range"] = "errors.range";
validMsgMap["min"] = "errors.min";
validMsgMap["max"] = "errors.max";
validMsgMap["selectRequired"] = "errors.selectRequired";
validMsgMap["password"] = "errors.password";

$(function() {
	$.fn.extend({
				validInit : function(option) {
					var dafaultOption = {
						onsubmit : false,
						onfocusout : false,
						onkeyup: false

					};
					var target = this;
					$(target).validate({
						onsubmit : isEmpty(option.onsubmit) ? dafaultOption.onsubmit : option.onsubmit,
						onfocusout : isEmpty(option.onfocusout) ? dafaultOption.onfocusout : option.onfocusout,
						onkeyup : isEmpty(option.onkeyup) ? dafaultOption.onkeyup : option.onkeyup,
						submitHandler : function(target) {
							return true;
						},
						showErrors : function(errorMap, errorList) {
							if (this.numberOfInvalids()) {
								alert(errorList[0].message);
								$(errorList[0].element).focus();
							}
						}
					});
				},
				validAddRules : function(option) {

					var formTarget = this;
					var validList = option.validList;
					$.each(validList, function(i, validTarget) {

						var target = validTarget.objId;
						var rules = validTarget.rule;
						var isArr = false;

						if(!isEmpty(validTarget.isArr)) {
							isArr = validTarget.isArr;
						}

						//var objType = $('[name="'+ target +'"]').prop('tagName').toLowerCase();
						//console.log(target);
						var label = "";
						if (!isEmpty($('[name="'+ target +'"]').attr('label'))) {
							label = $('[name="'+ target +'"]').attr('label');
						} else {
							label = validTarget.label;
						}

						for(var obj in rules) {

							var ruleId = obj;
							var ruleValue = rules[ruleId];
							var ruleObj = {};

							//룰 셋팅
							ruleObj[ruleId] = ruleValue;

							//룰 메세지
							var ruleObjMsg = {};
							var ruleMsg = validMsgMap[ruleId];
							if(!isEmpty(ruleMsg)) {

								/*
								if(new RegExp("\\{[0-9]\\}").test(ruleMsg)) {
									if(typeof ruleValue === "NUMBER") {
										ruleMsg = ruleMsg.replace(new RegExp("\\{" + 1 + "\\}", "g"), ruleValue);
									} else {

										$.each(ruleValue, function(i, n) {
											ruleMsg = ruleMsg.replace(new RegExp("\\{" + (i+1) + "\\}", "g"), n);
										});
									}
								}
								ruleObjMsg[ruleId] = label + ruleMsg;
								*/
								//console.log("label > "+label);
								if(typeof ruleValue === "boolean") {
									ruleObjMsg[ruleId] = fnKecoMsg(ruleMsg, label);
								} else if(typeof ruleValue === "NUMBER" || typeof ruleValue === "number") {
									ruleObjMsg[ruleId] = fnKecoMsg(ruleMsg, label, ruleValue);
								} else {
									if(ruleValue.length == 2) {
										ruleObjMsg[ruleId] = fnKecoMsg(ruleMsg, label, ruleValue[0], ruleValue[1]);
									} else if(ruleValue.length == 3) {
										ruleObjMsg[ruleId] = fnKecoMsg(ruleMsg, label, ruleValue[0], ruleValue[1], ruleValue[2]);
									} else if(ruleValue.length == 4) {
										ruleObjMsg[ruleId] = fnKecoMsg(ruleMsg, label, ruleValue[0], ruleValue[1], ruleValue[2], ruleValue[3]);
									}
								}

								ruleObj["messages"] = ruleObjMsg;
							}
							/*if(objType == "input") {
								//룰추가
								$('input[name="'+ target +'"]').rules("add", ruleObj);
							} else if(objType == "select") {
								//룰추가
								$('select[name="'+ target +'"]').rules("add", ruleObj);
							}
							*/

							 if(isArr){
								 $('[name="'+ target +'"]').each(function(i){
							      	$('[name="'+ target +'"]:eq('+i+')').rules("add", ruleObj);
							     });
						    } else {
						    	$('[name="'+ target +'"]').rules("add", ruleObj);
						    }


						}
					});
				},
			});

});

/**
 * selectbox 필수값 체크 확장
 */
$.validator.addMethod("selectRequired", function(value, element, params) {
	//console.log(this.errorList[0]);
	if(isEmpty(value)) {
	   return false;
	} else {
		return true;
	}
});

/**
 * value 값이 param값보다 작으면 false 크면 true
 * ex) {"objId" : "banrEndD", "label" : "종료일자", "rule" : { "required" : true, "date" : true, "maxlength":8, "minDate": [$("#banrSrtD").val(), "시작일자"]}},
 */

$.validator.addMethod("minDate", function(value, element, params) {
	if(toNumber(value) < toNumber(params[0])) {
		return false;
	} else {
		return true;
	}
});

/**
 * value 값이 param값보다 크면 false 작으면 true
 * ex) {"objId" : "banrSrtD", "label" : "시작일자", "rule" : { "required" : true, "date" : true, "maxlength":8, "maxDate": [$("#banrEndD").val(), "종료일자"]}},
 */
$.validator.addMethod("maxDate", function(value, element, params) {
	if(toNumber(value) > toNumber(params[0])) {
		return false;
	} else {
		return true;
	}
});

$.validator.addMethod("password", function(value, element, params) {
	return /^[A-Za-z0-9\d=!\-@._*]*$/.test(value) // consists of only these
		    && /[a-z]/.test(value) // has a lowercase letter
		    && /\d/.test(value) // has a digit
});


/**
 * server validator를 위한 공통 함수
 * url : 보내야 되는 url
 * formName : form name
 * callback 콜백 함수 없어도 된다. String임
 */
function fnValAjax(url, formName, callBack) {

	$.ajax({
		async : false,
		type: 'POST',
		url: url,
		data : $("#"+formName).serialize(),
		dataType:"json",
		success : function (data) {
			if(data.vaildErrorMsg != undefined && !isEmpty(data.vaildErrorMsg)) {
				if(!isEmpty(data.vaildErrorFileId)) {
                    $("#"+data.vaildErrorFileId).focus();
                }

				alert(data.vaildErrorMsg);

				if(data.vaildErrorFileId == "ERR001") {
					fnBackLogin();
				}

				return false ;
			}

			if(callBack != null && callBack != "") {
				window[callBack](data) ;
				//var fn = new Function(callBack+"();");
				//fn();
			}

		},
		error: function(data, textStatus, errorThrown) {
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

				alert("해당 화면에 접근권한이 없습니다.");

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
			} else if(data.status == "403") {
				var curUrl = document.location.href;
				var loginUrl = "";
				if(curUrl.indexOf("/keco/") > -1) {
					loginUrl = _CTX_PATH + "/keco/login/login/initLoginAction.do";
				} else if(curUrl.indexOf("/app/") > -1) {
					loginUrl = _CTX_PATH + "/app/login/retrieveULOLogin.do";
				} else {
					loginUrl = _CTX_PATH + "/user/login/retrieveULOLogin.do";
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
		}
	});
}

function fnBackLogin() {
	document.location.href = "/keco/main/auth/noRefererURIProgrmAction.do";
}