/**
 * ONEPASS Client Module.
 */

/**
 * TODO : 세션유지 최소시간, 기본값 변경
 * @property pageType 			- P:Popup, W:Window (default:P)
 * @property intfUrl 			- Interface request page path.
 * @property keepTime 			- ONEPASS session keep time. (unit:ms, default:10000)
 * @property keepSession 		- ONEPASS session keep. (default:false)
 * @property refreshServiceTime - ONEPASS service info refresh time. (unit:ms, default:600000)
 * @property refreshService 	- ONEPASS service info refresh. (default:false)
 * @property apiList 			- API interface list. (Do not edit!)
 * @property others 			- Do not edit!
 * @returns 
 */

try {
	var console = window.console || {log:function(){}};
	jQuery('<div/>', {id:'dhtmltooltip'}).appendTo('html');
	var OnepassClientUtil = function() {
//		this.idpUrl = "http://idp.egaf2017.com";
		this.idpUrl = location.protocol + "//saml.onepass.go.kr";
		this.commonLoginBtnImg = "/resources/images/client/onepass_searvice_login.png";
		this.commonInfoBtnImg = "/resources/images/client/onepass_searvice.png";
		this.loginBtnImg;
		this.infoBtnImg;
		this.pageType = "W";
		// 내 서비스 목록 ID
		this.myServiceBox = 'onepass_my_service_box';
		this.intfUrl = {loginout :"/onepass/loginout.jsp", apiRequest:"/onepass/apiRequest.jsp"};
		this.setParam = function (key, value) {
			return key + "=" + value;
		}
		this.apiList = {
			site:{url: "/api/site", pattern: /^\/api\/site(\/\d+|)$/}
			, bookmark:{url: "/api/site/bookmark", pattern: /^\/api\/site\/bookmark$/}
			, check:{url: "/intf/check", pattern: /^\/intf\/check$/}
		};
		
		// S : 세션유지 API 호출 : 미사용
		this.keepTime = 1000*10*1;
		this.keepSession = function (keep) {
			if (keep && this.keepFlag == undefined) {
				this.keepFlag = true;
				console.log("[start] session keep time(ms):" + this.keepTime);
				this.keepSessionSend();
			} else {
				clearTimeout(this.keepTimer);
				this.keepFlag = undefined;
				console.log("[end] clear keepTimer.");
			}
			return;
		}
		this.keepSessionSend = function () {
			var subUrl = this.apiList.check.url;
			var method = "GET";
			var jsonBody = "";
			this.onepassApiCall(subUrl, method, jsonBody);
			var minTime = 1000*10*1;
			var interval = this.keepTime || minTime;
			var parentObj = this;
			this.keepTimer = setTimeout(function() {
				parentObj.keepSessionSend();
			}, interval < minTime ? minTime:interval);
			return;
		}
		// E: 세션유지 API 호출
		
		// S: 서비스 목록 API 호출
		this.refreshServiceTime = 1000*60*10;
		this.refreshService = function (refresh) {
			if (refresh && this.refreshFlag == undefined) {
				this.refreshFlag = true;
				console.log("[start] service info refresh time(ms):" + this.refreshServiceTime);
				this.refreshServiceInfo();
			} else {
				clearTimeout(this.refreshServiceTimer);
				this.refreshFlag = undefined;
				console.log("[end] clear service info refresh Timer.");
			}
			return;
		}
		this.refreshServiceInfo = function () {
			this.findSiteList();
			var minTime = 1000*60*1;
			var interval = this.refreshServiceTime || minTime;
			var parentObj = this;
			this.refreshServiceTimer = setTimeout(function() {
				parentObj.refreshServiceInfo();
			}, interval < minTime ? minTime:interval);
			return;
		}
		// E: 서비스 목록 API 호출
		
		this.onepassApiCall =  function (subUrl, method, jsonBody) {
			var data = "subUrl=" + subUrl;
			data += "&method=" + method;
			data += "&body=" + jsonBody;
			var parentObj = this;
			jQuery.ajax({
				url : this.intfUrl.apiRequest, 
				type : "POST",
				data : data,
				dataType : "json",
				success : function(data) {
					parentObj.response(data);
				},
				error : function(data) {
					console.log("check error");
					console.log(data);
				}
			});
		}
//		this.responseParse = function (responseEntity) {
//			if (responseEntity.statusCode == "OK") {
//				var body = JSON.parse(responseEntity.body);
//				if (!body.result) {
//					console.log("response status:" + body.status);
//				}
//				return body;
//			} else {
//				console.log("response HTTP.statusCode:" + responseEntity.statusCode);
//				$('#user_info').text('로그인 정보를 확인할 수 없습니다.');
//				this.refreshService(false);
//				$('#digital_onepass_popup3').show();
//			}
//			
//		}
		// {알람, 최근접속, 가입서비스, 미가입서비스, 공지사항}
		this.viewData = new Object();
		this.response = function (data) {
//			console.log(data);
			if (!data.status) {
				console.log("api error:" + data.errorMessage);
				this.refreshService(false);
				jQuery('#digital_onepass_popup3').show();
				return;
			}
			var parentObj = this;
			var subUrl = data.subUrl;
			var body = JSON.parse(data.responseBody);
			if (body != undefined) {
				var api = this.apiList;
				if (api.check.pattern.test(subUrl)) {
					console.log("update onepass session time.");
//				} else if (api.bookmark.pattern.test(subUrl)) {
				} else if (api.site.pattern.test(subUrl) || api.bookmark.pattern.test(subUrl)) {
					if (body.result) {
						if (body.expiredSession != undefined && body.expiredSession) {
							console.log("onepass session undefined.");
							this.refreshService(false);
							jQuery('#onepass_service_box').hide();
							
							var boxArea = jQuery('.digital_onepass_service_box01'); 
							boxArea.empty();
							
							// expiredBox
							var expiredBox = jQuery('<div/>', {'class':'digital_onepass_user_box'}).appendTo(boxArea);
							jQuery('<div/>', {'class':'digital_onepass_user_info2', 'text':'디지털원패스가 로그아웃 되어 더이상 사용 할 수 없습니다.'}).appendTo(expiredBox);
							expiredBox.append('</br>');
							
							var expiredBoxFooter = jQuery('<div/>', {'class':'digital_onepass_login_box'}).appendTo(boxArea);
							var expiredBoxFooterUl = jQuery('<ul/>').appendTo(expiredBoxFooter);
							expiredBoxFooterUl.append('<li>디지털원패스 서비스를 이용하시려면 <span class="digital_onepass_user_info_txt_blue">[로그인]</span>이 필요합니다.<li/>');
							var loginBtn = jQuery('<a/>', {'href':'#'	}).appendTo(expiredBoxFooterUl);
							loginBtn.click(function () {
								parentObj.onepassLogin();
							})
							loginBtn.append('<li class="digital_onepass_login_btn_box"></li>');
							
							return;
						}
						
						// 수정요청 확인창 표시
						if (data.requestMethod == 'POST' && data.subUrl == '/api/site') {
							jQuery('#digital_onepass_popup1').toggle();
							jQuery('#digital_onepass_popup2').toggle();
						}
						var serviceBox = jQuery('#' + this.myServiceBox);
						jQuery('#user_info_name').text(body.userName);
						
						// 최근 접속정보 표시
						if (this.viewData.lastLoginInfo == undefined || this.viewData.lastLoginInfo != body.lastLoginInfo) {
							this.viewData.lastLoginInfo = body.lastLoginInfo;
							jQuery('#onepass_user_time').text('최근접속일시 : ' + body.lastLoginInfo);
						}
						
						// 즐겨찾기 여부 표시
//						$('#onepass_bookmark').prop('checked', body.bookmark);
//						onepassBookmarkImg
						if (body.bookmark) {
							jQuery('#onepass_bookmark').attr('src', this.idpUrl + '/resources/images/client/icon_star_chk.png');
						} else {
							jQuery('#onepass_bookmark').attr('src', this.idpUrl + '/resources/images/client/icon_star_nor.png');
						}
						
						// 가입서비스
						if (this.viewData.mySiteList == undefined || JSON.stringify(this.viewData.mySiteList) != JSON.stringify(body.mySiteList)) {
							this.viewData.mySiteList = body.mySiteList;
							jQuery('#my_site').empty();
							jQuery('#pop_services_box_tb').empty();
							jQuery('#other_site').empty();
							jQuery.each(body.mySiteList, function(index, item) {
								if (item.use_yn == 'Y' && item.sso_yn == 'Y') {
									//SSO 가입서비스
									jQuery('#my_site').append('<tr><td><a href="'+item.site_url+'" target="_blank">'+item.site_name+'</a></td></tr>');
									// 서비스 편집목록
									jQuery('#pop_services_box_tb').append('<tr><td><input type="checkbox" class="murti_mark" value="'+item.site_seq+'" id="box'+index+'"><label for="box'+index+'"></label></td><td><a href="'+item.site_url+'" target="_blank">'+item.site_name+'</a></td></tr>');
									// 즐겨찾기
									if (item.bookmark_yn == 'Y') {
										jQuery('#other_site').append('<tr><td><a href="'+item.site_url+'" target="_blank">'+item.site_name+'</a></td></tr>');
									}
								}
							})
						}

						// 즐겨찾기
//						if (this.viewData.otherSiteList == undefined || JSON.stringify(this.viewData.otherSiteList) != JSON.stringify(body.otherSiteList)) {
//							this.viewData.otherSiteList = body.otherSiteList;
//							$('#other_site').empty();
//							$.each(body.otherSiteList, function(index, item) {
//								$('#other_site').append('<tr><td><a href="//'+item.site_url+'" target="_blank">'+item.site_name+'</a></td></tr>');
//							})
//						}
						
						// 서비스 알림
						if (this.viewData.userNoticeList == undefined || JSON.stringify(this.viewData.userNoticeList) != JSON.stringify(body.userNoticeList)) {
							this.viewData.userNoticeList = body.userNoticeList;
							jQuery('#user_notice').empty();
							jQuery.each(body.userNoticeList, function(index, item) {
								var userNoticeTitle = item.site_name;
								var userNoticeText = item.userNoticeText;
								var userNoticeDate = item.regDttmText;
								var userNoticeItem = '<tr><td><span class="digital_onepass_services_tit">&#91;';
								userNoticeItem += (userNoticeTitle + '&#93;</span>' +  userNoticeText);
								userNoticeItem += ('<span class="digital_onepass_services_date">' + userNoticeDate + '</span></td></tr>');
								jQuery('#user_notice').append(userNoticeItem);
							})
						}
						
						jQuery('#notice_link').attr('href', body.commonNoticeLink);
						
						// 공지사항
						if (this.viewData.commonNoticeList == undefined || JSON.stringify(this.viewData.commonNoticeList) != JSON.stringify(body.commonNoticeList)) {
							this.viewData.commonNoticeList = body.commonNoticeList;
							jQuery('#common_notice').empty();
							if (body.commonNoticeList.length == 0) {
								var notice_li = jQuery('<li/>', {}).appendTo(jQuery('#common_notice'));
								var notice_a = jQuery('<a/>', {'href':'javascript:void(0);', text:'공지사항이 없습니다.'}).appendTo(notice_li);
								jQuery('<span/>', {'class':'digital_onepass_notice_date'}).appendTo(notice_a);
							} else {
								jQuery.each(body.commonNoticeList, function(index, item) {
									var notice_li = jQuery('<li/>', {}).appendTo(jQuery('#common_notice'));
									var notice_a = jQuery('<a/>', {'href':body.commonNoticeLink + '/view?seq=' + item.seq, target:'_blank', text:item.title}).appendTo(notice_li);
									jQuery('<span/>', {'class':'digital_onepass_notice_date', text:item.begDttmText}).appendTo(notice_a);
								})
								
								var height =  jQuery(".digital_onepass_notice").height(); 
								var num = jQuery(".digital_onepass_rolling li").length; ;
								var max = height * num;
								var move = 0;
								clearInterval(this.noticeRollingOff);
								this.noticeRollingOff = setInterval(function() {
									move += height;
									jQuery(".digital_onepass_rolling").animate({"top":-move},600,function(){
										if( move >= max ){
											jQuery(this).css("top",0);
											move = 0;
										};
									});
								},3500);
								jQuery(".rolling").append(jQuery(".rolling li").first().clone());
								
							}
						}
						// 서비스 해제 팝업 목록
//						$('#pop_services_box_tb').empty();
//						$.each(body.mySiteList, function(index, item) {
//							if (item.use_yn == 'Y' && item.sso_yn == 'Y') {
//								$('#pop_services_box_tb').append('<tr><td><input type="checkbox" class="murti_mark" value="'+item.site_seq+'" id="box'+index+'"><label for="box'+index+'"></label></td><td><a href="//'+item.site_url+'" target="_blank">'+item.site_name+'</a></td></tr>');
//							}
//						})
						
//						$.each(body.otherSiteList, function(index, item) {
//							$('#pop_services_box_tb').append('<tr><td><input type="checkbox" class="murti_mark" value="'+item.site_seq+'"><label for="box1"></label></td><td><a href="'+item.siteUrl+'" target="_blank">'+item.siteName+'</a></td></tr>');
//						})
						
						
					} else {
						console.log("body.result:fail.");
						this.refreshService(false);
						jQuery('#onepass_service_box').hide();
						
						var boxArea = jQuery('.digital_onepass_service_box01'); 
						boxArea.empty();
						
						// expiredBox
						var expiredBox = jQuery('<div/>', {'class':'digital_onepass_user_box'}).appendTo(boxArea);
						jQuery('<div/>', {'class':'digital_onepass_user_info2', 'text':'디지털원패스 로그인 정보를 확인할 수 없어 사용 할 수 없습니다.'}).appendTo(expiredBox);
						expiredBox.append('</br>');
						
						var expiredBoxFooter = jQuery('<div/>', {'class':'digital_onepass_login_box'}).appendTo(boxArea);
						var expiredBoxFooterUl = jQuery('<ul/>').appendTo(expiredBoxFooter);
						expiredBoxFooterUl.append('<li>디지털원패스 서비스를 이용하시려면 <span class="digital_onepass_user_info_txt_blue">[로그인]</span>이 필요합니다.<li/>');
						var loginBtn = jQuery('<a/>', {'href':'#'	}).appendTo(expiredBoxFooterUl);
						loginBtn.click(function () {
							parentObj.onepassLogin();
						})
						loginBtn.append('<li class="digital_onepass_login_btn_box"></li>');
						
						return;
					}
				} else {
					console.log("unknow request type.");
					this.refreshService(false);
					jQuery('#onepass_service_box').hide();
					
					var boxArea = jQuery('.digital_onepass_service_box01'); 
					boxArea.empty();
					
					// expiredBox
					var expiredBox = jQuery('<div/>', {'class':'digital_onepass_user_box'}).appendTo(boxArea);
					jQuery('<div/>', {'class':'digital_onepass_user_info2', 'text':'디지털원패스 로그인 정보를 확인할 수 없어 사용 할 수 없습니다.'}).appendTo(expiredBox);
					expiredBox.append('</br>');
					
					var expiredBoxFooter = jQuery('<div/>', {'class':'digital_onepass_login_box'}).appendTo(boxArea);
					var expiredBoxFooterUl = jQuery('<ul/>').appendTo(expiredBoxFooter);
					expiredBoxFooterUl.append('<li>디지털원패스 서비스를 이용하시려면 <span class="digital_onepass_user_info_txt_blue">[로그인]</span>이 필요합니다.<li/>');
					var loginBtn = jQuery('<a/>', {'href':'#'	}).appendTo(expiredBoxFooterUl);
					loginBtn.click(function () {
						parentObj.onepassLogin();
					})
					loginBtn.append('<li class="digital_onepass_login_btn_box"></li>');
					
					return;
				}
			}
    };

		// S : login & logout function
    this.onepassLogin = function (reqType, returnUrl) {
			var w = 800;
			var h = 500;
			var url = this.intfUrl.loginout;
			url += "?" + this.setParam("pageType", this.pageType);
			url += "&" + this.setParam("serviceType", "LOGIN");
      if (reqType) {
        url += "&" + onepass.setParam("reqType", reqType);
      }
      if (returnUrl) {
        url += "&" + onepass.setParam("returnUrl", returnUrl);
      }
			if (this.pageType == "P") {
				var py = window.screen.availHeight * .5 - (h / 2);
				var px = window.screen.availWidth * .5 - (w / 2);
				window.open(url, "", "width=" + w + ", height=" + h + ", toolbar=no, menubar=no, scrollbars=no, resizable=no, top=" + py + ", left=" + px);
			} else if (this.pageType == "W") {
				location.href = url;
			}
    };
    this.onepassLogout = function (siteOnly, returnUrl) {
			var w = 800;
			var h = 500;
			var url = this.intfUrl.loginout;
			url += "?" + this.setParam("pageType", this.pageType);
			url += "&" + this.setParam("serviceType", "LOGOUT");
			if (siteOnly) {
				url += "&" + this.setParam("logoutType", "site");
			}
      if (returnUrl) {
        url += "&" + onepass.setParam("returnUrl", returnUrl);
      }
			if (this.pageType == "P") {
				var py = window.screen.availHeight * .5 - (h / 2);
				var px = window.screen.availWidth * .5 - (w / 2);
				window.open(url, "", "width=" + w + ", height=" + h + ", toolbar=no, menubar=no, scrollbars=no, resizable=no, top=" + py + ", left=" + px);
			} else if (this.pageType == "W") {
				location.href = url;
			}
    };
		// E : login & logout function
		// S : API function
		this.findSiteList = function () {
			var subUrl = this.apiList.site.url;
			var method = "GET";
			this.onepassApiCall(subUrl, method, "", this);
		}
		this.saveBookmark = function (flag) {
			var subUrl = this.apiList.bookmark.url;
			var method = "POST";
			var body = new Object;
			body.bookmark = flag;
			this.onepassApiCall(subUrl, method, JSON.stringify(body), this);
		}
		this.removeSite = function (siteArray) {
			var body = new Object;
			body.siteSeqList = siteArray;
			var subUrl = this.apiList.site.url;
			var method = "POST";
			this.onepassApiCall(subUrl, method, JSON.stringify(body), this);
//			this.onepassApiCall(subUrl, method, "", this);
		}
		// E : API function
		
		// Login btn
		this.loadLoginbtn = function (viewId) {
			var parentObj = this;
			var loginBtnA = jQuery('<a/>', {}).appendTo('#' + viewId);
			loginBtnA.css('cursor', 'pointer');
			loginBtnA.click(function () {
				parentObj.onepassLogin();
			})
			var imgUrl = this.loginBtnImg || this.idpUrl + this.commonLoginBtnImg;
			console.log(imgUrl);
			jQuery('<img/>', {src:imgUrl, alt:'디지털원패스 로그인'}).appendTo(loginBtnA);
		}
		
		// Service info layer and logout
		this.loadServiceInfo = function (viewId) {
			var parentObj = this;
			var serviceBoxId = "onepass_service_box";
			var loginBtnA = jQuery('<a/>', {}).appendTo('#' + viewId);
			loginBtnA.css('cursor', 'pointer');
			loginBtnA.click(function() {jQuery("#" + serviceBoxId).toggle();});
			var imgUrl = this.infoBtnImg || this.idpUrl + this.commonInfoBtnImg;
			console.log(imgUrl);
			var btnInfo = jQuery('<img/>', {src:imgUrl, alt:'디지털원패스 서비스 바로가기'}).appendTo(loginBtnA);
			btnInfo.css("border", "none");
			
			// service_box
			var svcBox = jQuery('<div/>', {id:serviceBoxId, 'class':'digital_onepass_service_box'}).appendTo('#' + viewId);
			svcBox.css("position", "absolute");
			svcBox.css("display", "none");
			
			// header
			var service_header = '<div class="digital_onepass_service_header">';
			service_header += '<span>디지털원패스 통합인증포털</span>';
			service_header += '<ul class="digital_onepass_service_header_setup">';
			service_header += '<li><a href="#" onclick="jQuery(\'#onepass_service_box\').toggle();"><img src="' + this.idpUrl + '/resources/images/client/btn_close.png" alt="창닫기" ></a></li>';
			service_header += '</ul></div>'; 
			
			svcBox.append(service_header);
			
			// box
			var service_box01 = jQuery('<div/>', {'class':'digital_onepass_service_box01'}).appendTo(svcBox);

			// userBox
			var user_box = jQuery('<div/>', {'class':'digital_onepass_user_box'}).appendTo(service_box01);
			var user_info = jQuery('<div/>', {'id':'user_info', 'class':'digital_onepass_user_info', 'text':''}).appendTo(user_box);
			user_info.append('<span id="user_info_name"></span>');
			
			var btn_logout = jQuery('<span/>', {'class':'digital_onepass_btn_logout'}).appendTo(user_info);
			var btn_logoutA = jQuery('<a/>', {'text':'로그아웃'}).appendTo(btn_logout);
			btn_logoutA.click(function () {
				parentObj.onepassLogout();
			})
			
			var user_time = jQuery('<div/>', {'id':'onepass_user_time', 'class':'digital_onepass_user_time', 'text':''}).appendTo(user_box);
			var bookmark = jQuery('<div/>', {'class':'digital_onepass_user_bookmark', 'text':''}).appendTo(user_box);
//			bookmark.append('<input type="checkbox" class="digital_onepass_bookmark" id="onepass_bookmark"/>');
//			bookmark.append('<img id="" src="' + this.idpUrl + '/resources/images/client/icon_star_nor.png" alt="북마크 아이콘"/>');
			var bookmarkLabel = jQuery('<img/>', {id:'onepass_bookmark', 'src':this.idpUrl + '/resources/images/client/icon_star_nor.png'}).appendTo(bookmark);
			bookmarkLabel.click(function() {
				console.log(this.src.indexOf("icon_star_nor") > 0);
				parentObj.saveBookmark(this.src.indexOf("icon_star_nor") > 0);
			})
			var setup = jQuery('<div/>', {'class':'digital_onepass_user_setup02', 'text':''}).appendTo(user_box);
			setup.append('<a href="#" onclick="jQuery(\'#digital_onepass_popup1\').toggle();"><img src="' + this.idpUrl + '/resources/images/client/icon_setup02.png" alt="설정 아이콘"/></a>');

			service_box01.append('<div style="clear:both"></div>');
			
			var join_box = jQuery('<div/>', {'class':'digital_onepass_join_box'}).appendTo(service_box01);
			var tab_btn = jQuery('<div/>', {'class':'digital_onepass_tab_btn'}).appendTo(join_box);
			var menu_tab_1 = jQuery('<div/>', {'class':'digital_onepass_menu_tab_1'}).appendTo(tab_btn);
			var tab_btn = '<ul><li class="active digital_onepass_services_tab_icon01"><a onclick="onepass_tab_menu1(0);">통합로그인</a></li>';
			tab_btn += '<li class="digital_onepass_services_tab_icon03"><a onclick="onepass_tab_menu1(1);">즐겨찾기</a></li>';
			tab_btn += '<li class="digital_onepass_services_tab_icon05"><a onclick="onepass_tab_menu1(2);">서비스 알림</a></li></ul>';
			menu_tab_1.append(tab_btn);
			
			// 통합로그인
			var tab_con = jQuery('<div/>', {'class':'digital_onepass_tab_con'}).appendTo(join_box);
			var menu_tab00 = jQuery('<div/>', {'class':'digital_onepass_menu_tab00 mTs'}).appendTo(tab_con);
			var services_box1 = jQuery('<div/>', {'class':'digital_onepass_services_box'}).appendTo(menu_tab00);
			var services_box_tb1 = jQuery('<table/>', {'id':'my_site', 'class':'digital_onepass_services_box_tb'}).appendTo(services_box1);
			
			// 즐겨칮기
			var menu_tab01 = jQuery('<div/>', {'class':'digital_onepass_menu_tab01 mTs'}).appendTo(tab_con);
			menu_tab01.css('display', 'none');
			var services_box2 = jQuery('<div/>', {'class':'digital_onepass_services_box'}).appendTo(menu_tab01);
			var services_box_tb2 = jQuery('<table/>', {'id':'other_site','class':'digital_onepass_services_box_tb'}).appendTo(services_box2);

			// 서비스알림
			var menu_tab01 = jQuery('<div/>', {'class':'digital_onepass_menu_tab02 mTs'}).appendTo(tab_con);
			menu_tab01.css('display', 'none');
			var services_box2 = jQuery('<div/>', {'class':'digital_onepass_services_box'}).appendTo(menu_tab01);
			var services_box_tb2 = jQuery('<table/>', {'id':'user_notice','class':'digital_onepass_services_box_tb'}).appendTo(services_box2);
			
			// 공지사항
			var notice_box_tit = jQuery('<div/>', {'class':'digital_onepass_notice_box_tit', 'text':'공지사항'}).appendTo(service_box01);
			notice_box_tit.append('<span class="digital_onepass_notice_box_more"><a id="notice_link" href="#" target="_blank">더보기</a></span>');
			var notice_box = jQuery('<div/>', {'class':'digital_onepass_notice_box'}).appendTo(service_box01);
			var notice = jQuery('<div/>', {'class':'digital_onepass_notice'}).appendTo(notice_box);
			var rolling = jQuery('<div/>', {'id':'common_notice', 'class':'digital_onepass_rolling'}).appendTo(notice);
			
			// ad_box
			var ad_box = jQuery('<div/>', {'class':'ad_box'}).appendTo(service_box01);
			ad_box.append('<img src="' + this.idpUrl +'/resources/images/client/ad.png" class="post-user-avatar"/>');
			ad_box.css('display','none');
			
			// 수정 팝업
			var settingPopup = jQuery('<div/>', {'id':'digital_onepass_popup1'}).appendTo(svcBox);
			settingPopup.css('display', 'none');
			var popup_wrap = jQuery('<div/>', {'class':'digital_onepass_popup_wrap'}).appendTo(settingPopup);
			var modal_header = jQuery('<div/>', {'class':'digital_onepass_modal_header'}).appendTo(popup_wrap);
			modal_header.append('<a href="javascript:void(0);" class="digital_onepass_pop_close" onclick="jQuery(\'#digital_onepass_popup1\').toggle();"><img src="' + this.idpUrl + '/resources/images/client/btn_close.png" alt="창닫기" ></a>');
			modal_header.append('<p class="digital_onepass_modal_tit_icon">가입서비스 편집</p>');
			var modal_con = jQuery('<div/>', {'class':'digital_onepass_modal_con'}).appendTo(popup_wrap);
			var pop_services_txt = jQuery('<div/>', {'class':'digital_onepass_pop_services_txt', 'text':'가입하신 서비스를 삭제하실 수 있습니다.'}).appendTo(modal_con);
			var pop_services_tit = jQuery('<div/>', {'class':'digital_onepass_pop_services_tit', 'text':'가입서비스'}).appendTo(modal_con);
			var pop_services_box = jQuery('<div/>', {'class':'digital_onepass_pop_services_box'}).appendTo(modal_con);
			var pop_services_box_tb = jQuery('<table/>', {'id':'pop_services_box_tb','class':'digital_onepass_pop_services_box_tb'}).appendTo(pop_services_box);
			var modal_footer = jQuery('<div/>', {'class':'digital_onepass_modal_footer'}).appendTo(popup_wrap);
			var modal_footer_box2 = jQuery('<div/>', {'class':'digital_onepass_modal_footer_box2'}).appendTo(modal_footer);
			var pop_btn_wrap = jQuery('<div/>', {'class':'digital_onepass_pop_btn_wrap'}).appendTo(modal_footer_box2);
			pop_btn_wrap.append('<span class="digital_onepass_pop_btn_two"><a href="#" class="digital_onepass_pop_btn_grey" onclick="jQuery(\'#digital_onepass_popup1\').toggle();">취소</a></span>');
			
			var pop_btn_two = jQuery('<span/>', {'class':'digital_onepass_pop_btn_two'}).appendTo(pop_btn_wrap);
			var pop_btn_deepblue = jQuery('<a/>', {'class':'digital_onepass_pop_btn_deepblue','text':'삭제'}).appendTo(pop_btn_two);
			pop_btn_deepblue.click(function () {
				var siteArray = new Array;
				var siteArray = new Array;
				jQuery('#pop_services_box_tb').find('input:not(:checked)').each(function() {
					siteArray.push(this.value);
				})
				parentObj.removeSite(siteArray);
			})
			
			// 확인팝업
			var alertPopup = jQuery('<div/>', {'id':'digital_onepass_popup2'}).appendTo(svcBox);
			alertPopup.css('display', 'none');
			var popup_wrap = jQuery('<div/>', {'class':'digital_onepass_popup_wrap'}).appendTo(alertPopup);
			var modal_header = jQuery('<div/>', {'class':'digital_onepass_modal_header'}).appendTo(popup_wrap);
			modal_header.append('<a href="javascript:void(0);" class="digital_onepass_pop_close" onclick="jQuery(\'#digital_onepass_popup2\').toggle();"><img src="' + this.idpUrl + '/resources/images/client/btn_close.png" alt="창닫기" ></a>');
			modal_header.append('<p class="digital_onepass_modal_tit_icon">가입서비스 해제</p>');
			var modal_con = jQuery('<div/>', {'class':'digital_onepass_modal_con'}).appendTo(popup_wrap);
			var pop_services_box2 = jQuery('<div/>', {'class':'digital_onepass_pop_services_box2'}).appendTo(modal_con);
			pop_services_box2.append('<span><img src="' + this.idpUrl + '/resources/images/client/icon_success.png" alt="서비스 해제 완료 아이콘" ></span><br /><br />');
			pop_services_box2.append('선택하신 서비스를 해제 완료하였습니다.');
			var modal_footer = jQuery('<div/>', {'class':'digital_onepass_modal_footer'}).appendTo(popup_wrap);
			var modal_footer_box2 = jQuery('<div/>', {'class':'digital_onepass_modal_footer_box2'}).appendTo(modal_footer);
			var pop_btn_wrap = jQuery('<div/>', {'class':'digital_onepass_pop_btn_wrap'}).appendTo(modal_footer_box2);
			pop_btn_wrap.append('<span class="digital_onepass_pop_btn_one"><a href="#" class="digital_onepass_pop_btn_deepblue" onclick="jQuery(\'#digital_onepass_popup2\').toggle();">완료</a></span>');

			// 확인팝업
			var alertPopup = jQuery('<div/>', {'id':'digital_onepass_popup3'}).appendTo(svcBox);
			alertPopup.css('display', 'none');
			var popup_wrap = jQuery('<div/>', {'class':'digital_onepass_popup_wrap'}).appendTo(alertPopup);
			var modal_header = jQuery('<div/>', {'class':'digital_onepass_modal_header'}).appendTo(popup_wrap);
			modal_header.append('<a href="javascript:void(0);" class="digital_onepass_pop_close" onclick="jQuery(\'#onepass_service_box\').toggle();"><img src="' + this.idpUrl + '/resources/images/client/btn_close.png" alt="창닫기" ></a>');
			modal_header.append('<p class="digital_onepass_modal_tit_icon">서비스 바로가기 이용불가</p>');
			var modal_con = jQuery('<div/>', {'class':'digital_onepass_modal_con'}).appendTo(popup_wrap);
			var pop_services_box2 = jQuery('<div/>', {'class':'digital_onepass_pop_services_box2'}).appendTo(modal_con);
			pop_services_box2.append('<span><img src="' + this.idpUrl + '/resources/images/client/icon_success.png" alt="서비스 해제 완료 아이콘" ></span><br />');
			pop_services_box2.append('디지털원패스 로그인 정보가 확인되지 않습니다.<br />');
			pop_services_box2.append('디지털원패스 바로가기 서비스를 이용 할 수 없습니다.');
			var modal_footer = jQuery('<div/>', {'class':'digital_onepass_modal_footer'}).appendTo(popup_wrap);
			var modal_footer_box2 = jQuery('<div/>', {'class':'digital_onepass_modal_footer_box2'}).appendTo(modal_footer);
			var pop_btn_wrap = jQuery('<div/>', {'class':'digital_onepass_pop_btn_wrap'}).appendTo(modal_footer_box2);
			pop_btn_wrap.append('<span class="pop_btn_one"><a href="#" class="digital_onepass_pop_btn_deepblue" onclick="jQuery(\'#onepass_service_box\').toggle();">완료</a></span>');
			
//			this.refreshServiceInfo();
		}
		this.noticeRollingOff;
	}
	console.log("[SUCCESS] onepass client javascript load.");
} catch (e) {
	console.log("[FAIL] onepass client javascript load.");
}

function onepass_tab_menu1(num) {
	var f = jQuery('.digital_onepass_menu_tab_1').find('li');
	for (var i = 0; i < f.length; i++) {
		if (i == num) {
			f.eq(i).addClass('active');
			jQuery('.digital_onepass_menu_tab0' + i).show();
		} else {
			f.eq(i).removeClass('active');
			jQuery('.digital_onepass_menu_tab0' + i).hide();
		}
	}
}
