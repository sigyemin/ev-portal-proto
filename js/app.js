/*
 * app.js
 */

var app = app || {};

//++++++++++++++++++++++++++++++++++++++++++++++
// common utilities
//++++++++++++++++++++++++++++++++++++++++++++++
app.utils = (function() {
	//----------------------------------------------------------------------------------
	// check for an empty object or string
	//----------------------------------------------------------------------------------
	// @param {string|object}
	// @return {boolean} : true or false 
	//----------------------------------------------------------------------------------
	var isEmpty = function(obj) {
		if(obj == null || obj == undefined || typeof obj === 'undefined') {
			return true;
		} else {
			if(typeof obj === 'string') {
				return obj.trim().length === 0 ? true : false;
			} else if(obj === 'object') {
				if(obj.length || Object.keys(obj).length === 0) {
					return true;
				} else {
					return false;
				}
			}else {
				return true;
			}
		}
	};
	
	//----------------------------------------------------------------------------------
	// formatting phone number
	//----------------------------------------------------------------------------------
	// @param {string}
	// @return {string} 
	//----------------------------------------------------------------------------------
	var formatPhone = function(str) {
		if(!isEmpty(str)) {
			if(str.length == 11) {
				return [str.substring(0, 3), str.substring(3, 7), str.substring(7, 11)].join('-');
			}
		}
		return str;
	};
	
	//----------------------------------------------------------------------------------
	// convert "YYYYMMDD" to "YYYY-MM-DD" or "YYYY.MM.DD"....
	//----------------------------------------------------------------------------------
	// @param {string|Date} : YYYYMMDD or Date object (null일 경우 현재날짜)
	// @param {null|string} : null일 경우 "-" 아닐경우 구분자 
	//----------------------------------------------------------------------------------
	var formatDate = function(date, delimiter) {
		delimiter = delimiter || '-';
		date = date || new Date();
		
		if(typeof date === 'object' && typeof date.getFullYear === 'function') {
			var m = date.getMonth() + 1;
			var d = date.getDate();
			
			return [date.getFullYear(), (m > 9 ? '' : '0') + m, (d > 9 ? '' : '0') + d].join(delimiter);
			
		} else if(typeof date === 'string' && date.length == 8) {
			return [date.substring(0, 4), date.substring(4,6), date.substring(6, 8)].join(delimiter);
			
		} else if(typeof date === 'string' && date.length == 10) {
			return [date.substring(0, 4), date.substring(5,7), date.substring(8, 10)].join(delimiter);
			
		} else {
			return date;
		}
	};
	
	//----------------------------------------------------------------------------------
	// convert "YYYYMMDDHHMMSS" to "YYYY-MM-DD HH:MM:SS" or "YYYY.MM.DD HH:MM:SS"....
	//----------------------------------------------------------------------------------
	// @param {string|Date} : YYYYMMDD or Date object (null일 경우 현재날짜)
	// @param {null|string} : null일 경우 "-" 아닐경우 구분자
	//----------------------------------------------------------------------------------
	var formatDateTime = function(date, delimiter) {
		delimiter = delimiter || '-';
		date = date || new Date();
		
		if(typeof date === 'object' && typeof date.getFullYear === 'function') {
			var m = date.getMonth() + 1;
			var d = date.getDate();
			var hh = date.getHours();
			var mm = date.getMinutes();
			var ss = date.getSeconds();
			
			return [date.getFullYear(), (m > 9 ? '' : '0') + m, (d > 9 ? '' : '0') + d].join(delimiter) + ' ' + [(hh > 9 ? '' : '0') + hh, (mm > 9 ? '' : '0') + mm, (ss > 9 ? '' : '0') + ss].join(':'); 
			
		} else if(typeof date === 'string' && date.length == 14) {
			return [date.substring(0, 4), date.substring(4, 6), date.substring(6, 8)].join(delimiter)  + ' ' + [date.substring(8, 10), date.substring(10, 12), date.substring(12, 14)].join(':');
			
		} else {
			return date;
		}
	};
	
	//----------------------------------------------------------------------------------
	// add Comma
	//----------------------------------------------------------------------------------
	// @param {number}
	// @return {string} 
	//----------------------------------------------------------------------------------
	var addComma = function(x) {
		return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
	};
	
	//----------------------------------------------------------------------------------
	// remove Comma
	//----------------------------------------------------------------------------------
	// @param {string}
	// @return {string} 
	//----------------------------------------------------------------------------------
	var removeComma = function(x) {
		if(!x || x.length == 0) { 
			return '';
		} else {
			return x.split(',').join('');
		}
	};
	
	//----------------------------------------------------------------------------------
	// validation check business registeration number
	//----------------------------------------------------------------------------------
	// @param {string} : class name // ex. class="bizrno"일 경우 app.utils.checkBizrno('bizrno')  
	// @return {boolean} : true|false
	//----------------------------------------------------------------------------------
	var checkBizrno = function($className) {
		var val = '', $target = $('.' + $className + '');
		
		$.each($target, function() {
			val += $(this).val() + '';
		});
	    var sumMod  =   0;
	    sumMod  +=  parseInt(val.substring(0,1));
	    sumMod  +=  parseInt(val.substring(1,2)) * 3 % 10;
	    sumMod  +=  parseInt(val.substring(2,3)) * 7 % 10;
	    sumMod  +=  parseInt(val.substring(3,4)) * 1 % 10;
	    sumMod  +=  parseInt(val.substring(4,5)) * 3 % 10;
	    sumMod  +=  parseInt(val.substring(5,6)) * 7 % 10;
	    sumMod  +=  parseInt(val.substring(6,7)) * 1 % 10;
	    sumMod  +=  parseInt(val.substring(7,8)) * 3 % 10;
	    sumMod  +=  Math.floor(parseInt(val.substring(8,9)) * 5 / 10);
	    sumMod  +=  parseInt(val.substring(8,9)) * 5 % 10;
	    sumMod  +=  parseInt(val.substring(9,10));
	 
	    if(val.length === 10 && sumMod % 10  ==  0) {
	    	return true;
	    } else {
	    	return false;
	    }
	};
	
	//----------------------------------------------------------------------------------
	// class name의 value를 합친 값 리턴
	//----------------------------------------------------------------------------------
	// @param {string} : class name // ex. class="bizrno"일 경우 app.utils.joinData('bizrno')
	// @param {boolean} : true|false 구분자 포함 여부
	// @return {boolean} : true|false
	//----------------------------------------------------------------------------------
	var joinData = function($className, isDelimiter) {
		var val = '', $target = $('.' + $className + ''), checkEmpty = false;
		
		$.each($target, function() {
			if(isEmpty($(this).val())) {
				checkEmpty = true;
			}
			if(isDelimiter) {
				var delimiter = isEmpty($(this).attr('param-delimiter')) ?  '' : $(this).attr('param-delimiter');
				val += $(this).val() + delimiter;
			} else {
				val += $(this).val() + '';
			}
		});
		
		return checkEmpty == true ? '' : val;
	};
	
	//----------------------------------------------------------------------------------
	// class name의 value를 합친 값을 class name의 'js_'를 뺀 name에 set, arr로 return
	//----------------------------------------------------------------------------------
	// @param {array} : class name array 
	//  	ex. class="js_bizrno", class="js_bid" 일 경우 app.utils.joinData(['js_bizno', 'js_bid'])
	//		name = "bizrno" 에 value 값 set
	// @return {array} : {js_bizrno: xxxxxxxxx, js_bid: AA} 
	//----------------------------------------------------------------------------------
	var joinDatas = function(arr) {
		var val = '', obj = {}, vals = [], $target = null;
		if(arr.length > 0) {
			$.each(arr, function(i, el) {
				val = joinData(el, true);
				obj[el] = val;
				vals.push(obj);

				//-- js_로 시작한다면
				if(el.indexOf('js_') === 0) {
					$('input[name="'+el.split('js_')[1]+'"]').val(val);
				}
			});
		}
		return vals;
	};
	
	
	
	//----------------------------------------------------------------------------------
	// rowspan 합치기
	//----------------------------------------------------------------------------------
	var mergeRowspan = function($container, colIdx) {
		var that, $target = $container.find('tr');

		$.each($target, function(row) {
			$('td:eq(' + colIdx + ')', this).filter(':visible').each(function(col) {
				
				if($(this).attr('data-value') == $(that).attr('data-value')) {
					var rowspan = $(that).attr('rowspan') || 1;
					rowspan = Number(rowspan) + 1;
					
					$(that).attr('rowspan', rowspan);
					$(this).hide();
				} else {
					that = this;
				}
				that = (that == null) ? this : that;
			});
		});
	};
	
	//----------------------------------------------------------------------------------
	// return public api
	//----------------------------------------------------------------------------------
	var api = {
		isEmpty: isEmpty,
		formatPhone: formatPhone,
		formatDate: formatDate,
		formatDateTime: formatDateTime, 
		addComma: addComma,
		removeComma: removeComma,
		checkBizrno: checkBizrno,
		joinData: joinData,
		joinDatas: joinDatas,
		mergeRowspan: mergeRowspan
	};
	return api;
})();

//++++++++++++++++++++++++++++++++++++++++++++++
//common screen lock
//++++++++++++++++++++++++++++++++++++++++++++++
app.mask = (function() {
	var counter = [];
	
	//----------------------------------------------------------------------------------
	// cacheEl.$mask: overlay loader element
	//----------------------------------------------------------------------------------
	var cacheEl = {
		$mask: null
	};
	
	//----------------------------------------------------------------------------------
	// screen lock
	//----------------------------------------------------------------------------------
	var pageLock = function() {
		if(cacheEl.$mask != null) {
			counter.push(Math.random());
			cacheEl.$mask.css({display: 'block'});
		}
	};
	
	//----------------------------------------------------------------------------------
	// screen unlock
	//----------------------------------------------------------------------------------
	var pageUnlock = function() {
		if(cacheEl.$mask != null) {
			counter.shift();
			
			if(counter.length == 0) {
				cacheEl.$mask.fadeOut();
			}
		}
	};
	
	//----------------------------------------------------------------------------------
	// initializing
	//----------------------------------------------------------------------------------
	var init = function() {
		var $mask = $(document.body).find('.app-mask-page').first();
		
		if($mask.length) {
			cacheEl.$mask = $mask;
		} else {
			$(function() {
				if(cacheEl.$mask == null) {
					var strHtml = '', $el = null;
					
					strHtml += '<div class="app-mask-page off">';
					strHtml += '	<div class="app-mask-loader center"></div>';
					strHtml += '</div>';
					
					$el = $(strHtml);
					$(document.body).append($el);
					
					cacheEl.$mask = $el;
				}
			});
		}
	};
	
	init();
	
	//----------------------------------------------------------------------------------
	// return public api
	//----------------------------------------------------------------------------------
	var api = {
		pageLock: pageLock,
		pageUnlock: pageUnlock
	};
	return api;
})();

//++++++++++++++++++++++++++++++++++++++++++++++
//amchart 5 : amcharts.com
//++++++++++++++++++++++++++++++++++++++++++++++
app.amchart = (function() {
	//----------------------------------------------------------------------------------
	// walk through options of exporting chart view and data
	//----------------------------------------------------------------------------------
	var exporting = function(root, title) {
		am5plugins_exporting.Exporting.new(root, {
			 menu: am5plugins_exporting.ExportingMenu.new(root, {}),
			 filePrefix: title || "myChart"
		 });
	};

	//----------------------------------------------------------------------------------
	// create toggle switch
	//----------------------------------------------------------------------------------
	// params.root: root 
	// params.obj: object
	// params.text: toggle switch text
	// params.callback: callback function
	// params.x: position x
	// params.y: position y
	//----------------------------------------------------------------------------------
	var toggleSwitch = function(params) {
		params = params || {};
		params.text  = params.text  || [];
		
		var root = params.root, obj = params.obj || root.container;
		
		var cont = obj.children.push(am5.Container.new(root, {
			layout: root.horizontalLayout,
		    x: params.x || 0,
		    y: params.y || 0
		}));
		
		cont.children.push(am5.Label.new(root, {
		    centerY: am5.p50,
		    text: params.text[0]  
		}));
		
		var switchButton = cont.children.push(am5.Button.new(root, {
			themeTags: ["switch"],
			centerY: am5.p50,
			icon: am5.Circle.new(root, {themeTags: ["icon"]})
		}));

		cont.children.push(am5.Label.new(root, {
			centerY: am5.p50,
			text: params.text[1]
		}));
		
		switchButton.on("active", params.callback);
		return cont;
	};
	
	//----------------------------------------------------------------------------------
	// return public api
	//----------------------------------------------------------------------------------
	var api = {
		exporting: exporting, 
		toggleSwitch: toggleSwitch 
	};
	return api;
})();

//++++++++++++++++++++++++++++++++++++++++++++++
//pageInitializer
//++++++++++++++++++++++++++++++++++++++++++++++
app.pageInitializer = (function() {
	var init = function($container, mode) {
		$container = $container || $('#js-form'), mode = mode || 'insert';
		var $target = null;
		
		if($container.length) {
			//-- update 시 edit 수정 불가능
			$target = $container.find('[modifiable="N"]');
			if(mode == 'modify' && $target.length) {
				$target.prop('readOnly', true);
			}
			
			//-- set radio default value : 입력 시에만
			$target = $container.find('[set-default-value="true"]');
			if(mode == 'write') {
				$.each($target, function(i, el) {
					$(el).find('input').each(function() {
						var $el = $(this), val = $el.val(), defaultVal = $el.attr('data-default-value');
						if(!$el.is(':checked')) {
							var checked = val == defaultVal ? true : false;
							$el.prop('checked', checked);
						}
					});
				});
			}
			
			//-- set split data
			$target = $container.find('input[data-delimiter]');
			$.each($target, function() {
				var nm = $(this).attr('name'), val = $(this).val();
				if(!app.utils.isEmpty(val)) {
					var delimiter = $(this).attr('data-delimiter');
					var arr = val.split(delimiter);
					
					if(arr.length > 0) {
						$.each(arr, function(i, el) {
							$('input[name="'+ nm + (i+1) + '"]').val(el);
						});
					}
				}
			});
			
			//----------------------------------------------------------------------------------
			// add event 
			//----------------------------------------------------------------------------------
			//-- 클릭 시 url 이동
			$container.find('.js_goto_url').on('click', function() {
				if($(this).attr('type') == 'button') {
					var $el = $(this);
				} else {
					$el = $(this).closest('tr');
				}
				
				if($el.length) {
					var url = $el.attr('data-param-url') || null;
					var params = $el.attr('data-param') || null;
					
					if(url !== null) {
						if(params !== null) {
							params = params.replace('?', '');
							var arr = params.split('&');
							
							var form = document.createElement('form');
							form.setAttribute("style", "display:none;");
							form.setAttribute("method", "post");
							form.setAttribute("action", url);
							
							$.each(arr, function(i, el) {
								var name = el.split('=')[0] || '';
								var value = el.split('=')[1] || '';
								
								if(name !== '' && value !== '') {
									var input = document.createElement('input');
									input.type = 'hidden';
									input.name = name;
									input.value = value;
									
									form.appendChild(input);
								}
							});
							document.body.appendChild(form);
							form.submit();
						
						} else {
							window.location.href = url;
						}
					}
				}
			});
			
			//-- 전체 체크박스 선택
			$container.find('.js_all_check').on('change', function() {
				var checked = $(this).is(':checked'), $name = $(this).attr('name') || $(this).attr('data-name');
				$('input[name="'+$name+'"]').prop('checked', checked);
				
			});
			
			//-- sub 체크박스 선택
			$container.find('.js_sub_check').on('change', function() {
				$(this).siblings('.js_all_check').prop('checked', false);
			});
				
			//-- 자동 focus 이동
			$container.find('input[autoFocus]').on('keyup', function() {
				var length = $(this).val().length, maxlength = $(this).attr('maxlength');
				if(length == maxlength) {
					$(this).next('input').focus();
				}
			});
			
			//--숫자만 입력
			$container.find('input[numberOnly]').on('keyup', function() {
				$(this).val($(this).val().replace(/[^0-9]/g, ""));
			});
			
			//--영어 대문자만 입력
			$container.find('input[uppercaseOnly]').on('keyup', function() {
				$(this).val($(this).val().replace(/[^A-Z]/g, ""));
			});
			
		}
	};
	//----------------------------------------------------------------------------------
	// return public api
	//----------------------------------------------------------------------------------
	var api = {
		init: init	
	};
	return api;
})();

//++++++++++++++++++++++++++++++++++++++++++++++
//ajax utilities
//++++++++++++++++++++++++++++++++++++++++++++++
app.ajax = (function() {
	//----------------------------------------------------------------------------------
	// ajax call
	//----------------------------------------------------------------------------------
	// params.url: url
	// params.data: parameter
	// params.callback: callback function
	// params.async: true or false
	// params.enctype : multipart or null
	//----------------------------------------------------------------------------------
	var call = function(params) {
		try { 
			app.mask.pageLock();
			
			params = params || {};
			params.data = params.data || {}; 
			params.async = params.async == 'false' ? false : true;
			params.enctype = params.enctype || null;
			
			if(typeof params.url !== 'undefined') {
				//-- ajax callback handlers
				var ajaxHandler = {
					success: function(response, status, jqueryXhr) {
						var rs = null, errorCode = '0';
						
						if(response.length) {
							rs = JSON.parse(response);
							errorCode = rs.errorCode || '0';
						}
						
						if(errorCode == '-1') {
							alert('로그인 정보가 없습니다.\n로그인 후 다시 시도하세요.');
							
							if(window.location.href.indexOf('/mgr/') > -1) {
								window.location.href = '/mgr/tp/login';
							} else {
								window.location.href = '/portal/login';
							}
							
						} else {
							if(typeof params.callback === 'function') {
								params.callback(rs, params.data);
							}
						}
						
						console.log('------------[app.js > app.ajax.call]-----------------------');
						console.log(rs);
						console.log('-----------------------------------');
						app.mask.pageUnlock();
					},
					error: function(jqueryXhr, status, errorText) {
						app.mask.pageUnlock();
					}
				};
				
				if(params.enctype === 'multipart') {
					var ajax = $.ajax({type: 'post', url: params.url, data: params.data, enctype: 'multipart/form-data', processData: false, contentType: false, cache: false})
				} else {
					var ajax = $.ajax({type: 'post', async: params.async, url: params.url, data: params.data, dataType: 'json'})
				}
				
				ajax.done(ajaxHandler.success);
				ajax.fail(ajaxHandler.error);
				
			} else {
				app.mask.pageUnlock();
				console.log('-----------------------------------');
				console.log('url 또는 callback 함수를 확인하세요.');
				console.log('-----------------------------------');
			}
		} catch(e) {
			//app.mask.pageUnlock();
			console.log('-----------------------------------');
			console.log(e);
			console.log('-----------------------------------');
		}
	};
	
	//----------------------------------------------------------------------------------
	// return public api
	//----------------------------------------------------------------------------------
	var api = {
		call: call	
	};
	return api;
})();