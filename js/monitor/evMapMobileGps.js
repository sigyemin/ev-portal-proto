var isDebugging = false;

var curUtX = "";
var curUtY = "";

var curYn = "0";  // 현재위치 0. 체크 안됨, 1. 체크
var checkPoint = "0"; // 지점 0. 체크 안됨, 1. 체크

var Marker_longpress;	// 20230630 : check purpose and necessity to redo the code

// 20230710
var locationFeatures = new Object();
var locationLayer = new Object();
var Marker_user_position = new Object();
var Marker_user_position2 = new Object();

/*
$(document).ready(function() {
	
	try {
		if (navigator.geolocation) {
			navigator.geolocation.getCurrentPosition(successCallback, errorCallback);  
		}
	} catch(ex) {console.log("error: " + ex.message);}
	
	f_presentPosition();
	String.format = function() {
		var theString = arguments[0];
	
		for (var i = 1; i < arguments.length; i++) {
			var regEx = new RegExp("\\{" + (i - 1) + "\\}", "gm");
			theString = theString.replace(regEx, arguments[i]);
		}
		return theString;
	};
});
*/

$(document).ready(function() {
	initMarkerLayer();
	
	baseGround.getInteractions().forEach(function(interaction) {
    	if (interaction instanceof ol.interaction.PinchZoom) interaction.setActive(true);
	})

});

String.format = function() {
	var theString = arguments[0];

	for (var i = 1; i < arguments.length; i++) {
		var regEx = new RegExp("\\{" + (i - 1) + "\\}", "gm");
		theString = theString.replace(regEx, arguments[i]);
	}
	return theString;
};

//function initMap() {
function initMarkerLayer() {
	var mapCenterTransformed = ol.proj.transform(mapCenter, 'EPSG:4326', 'EPSG:3857');
	
	Marker_user_position = new ol.Feature({
		geometry: new ol.geom.Point(mapCenterTransformed), 
		kind: 'ignoreClick',
	});
	
	Marker_user_position2 = new ol.Feature({
		geometry: new ol.geom.Point(mapCenterTransformed), 
		kind: 'ignoreClick',
	});
	
	locationFeatures = new ol.source.Vector();
	locationFeatures.addFeature(Marker_user_position);
	locationFeatures.addFeature(Marker_user_position2);
	
	locationLayer = new ol.layer.Vector({
		name : 'locationLayer', id : 'location',
		source: locationFeatures,
		style: function(feature) {
			return new ol.style.Style({
				image : new ol.style.Icon({
					anchor: [0.5, 1], 
					opacity : 1.2, scale: 0.1, 
					src : '../img/monitor/place1.png' 
				})
			})
		}, 
		zIndex : 40
	});
	
	if (Object.keys(baseGround).length > 0) {
		baseGround.addLayer(locationLayer)
	}
	
	Marker_user_position.setStyle(new ol.style.Style({}));
	Marker_user_position2.setStyle(new ol.style.Style({}));
}

function feat_chkVis(feature) {
	if ( feature.getStyle() == null ) return true;
	else return false;
};

function feat_setVis(feature) {
	feature.setStyle(null);
};

function feat_setInvis(feature) {
	feature.setStyle(new ol.style.Style({}));
};

function feat_toggleVis(feature) {
	if (feat_chkVis(feature)) 
		feature.setStyle(new ol.style.Style({}));	//feat_setInvis(feature);
	else
		feature.setStyle(null);	//feat_setVis(feature);
};

function feat_setCoor(feature, coordinate) {
	feature.getGeometry().setCoordinates(coordinate);
};
//20230711 : feature 직접 처리 함수 - 현위치/지도 위치에 위해서 --- END
function successCallback(position) {
	try {
		var gpsInfo = "Y";
		curX = position.coords.latitude;
		curY = position.coords.longitude;
		
		mapCenter = [position.coords.longitude, position.coords.latitude];	// 20230630 : new_evmonitor.jsp
		if (isDebugging) console.log("::: successCallback FIRED :::");
	} catch(ex) { console.log("error: " + ex.message); }
}

function errorCallback(error) {
	gpsInfo = "";
	curX ="37.55236577";
	curY ="126.97077348"; 
	mapCenter =  [126.97077348, 37.55236577];
	
	$('#mobile_pop_nearby .noResult').show();
	$('#mobile_pop_nearby .noResult p').text("현재 위지 정보 조화 불가합니다.");
	$('#mobile_pop_nearby .yesResult').hide();
	if (isDebugging) console.log("::: errorCallback FIRED :::")
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////
//  외부 지원용 함수
/////////////////////////////////////////////////////////////////////////////////////////////////////////
var Webapp = {}
Webapp.geoCallback_gps = function(loc) {
	//if( param.app == "joyn" ){
		//아이폰
		if( navigator.userAgent.match("iPhone") != null)
			f_iphoneGeoCallback( "toApp://"+"lat:"+loc.coords.latitude + ",lng:" + loc.coords.longitude + ",name:@1@,addr:@2@" , loc.coords.longitude, loc.coords.latitude, 10,"LLW",true,true);
		//안드로이드
		try{
			f_androidGeoCallback( 'window.callback.af_current_position', "lat:"+loc.coords.latitude + ",lon:" + loc.coords.longitude+",name:@1@,addr:@2@", loc.coords.longitude, loc.coords.latitude, 10,"LLW",false );
		} catch(e){console.log("error: " + e.message);}
	//}
}

// 현위치 기준
$("#menu_open").click(function() {
	navigator.geolocation.getCurrentPosition(successCallback, errorCallback); 
	
	var w1 = 360;
	var h1 = 640;
	
	var curX2 = curX;
	var curY2 = curY;
	
	var poNm = "1";  // 현위치인지 1, 선택 위치인지 구분 2
	if(curYn == '1') {
		poNm = "1";
	} else if(checkPoint == "1") {
		// var pos = new naver.maps.LatLng( m_map.getCenter() );
		
		// 20230712 : get data in current display
		var pos = ol.proj.transform(mapView.getCenter(), 'EPSG:3857', 'EPSG:4326');	// 20230712 : openLayers 방식
		try {
			curX2 = pos[1];
			curY2 = pos[0];
			
			// feat_setCoor(Marker_user_position2, mapView.getCenter());	// 20230713 : 현위치로 자기 마커 이동 - 추가?
			
		} catch (ex) { console.log("error: " + ex.message); }

		poNm = "2";
	}
	
	var feature = "width="+w1+",height="+h1+",resizable=yes, scrollbars=yes, status=yes, titlebars=no";
	window.open("/mobile/mevloc?gubun=1&curX="+curX2+"&curY="+curY2+"&poNm="+poNm,"", feature);
});

//$("#point_cur").click(function() {
$("div.mobile.utils a.mapType").click(function() {
	f_presentPosition2();
});

//현재 위치 - 자리 저절
function sync() {
	if ($('.mobile.tabBtm').is(':visible')) {
		let h = getVisibleHeight($('.mobile.tabBtm'));
		document.documentElement.style.setProperty('--tabBtm-h', 'calc(' + (h) + 'px + 2rem)');		
	} else {
	    document.documentElement.style.setProperty('--tabBtm-h', '2rem');
	}
}

function getVisibleHeight($el) {
    const rect = $el[0].getBoundingClientRect();
    const winH = window.innerHeight || document.documentElement.clientHeight;

    const topI = Math.max(0, rect.top);
    const botI = Math.min(winH, rect.bottom);

    return Math.max(0, botI - topI);
};

//현재 위치
//$('#my_locaion').click(function(){
$('a.icon_location.mobile').click(function(){
	f_presentPosition();
});

//$('#reload').click(function(){
$('div.mobile.utils a.refresh').click(function(){
	updateData();
});

function f_presentPosition(){
// for a.icon_location.mobile : GPS location
	if(isDebugging) console.log("::: f_presentPosition FIRED :::");
	if ( !feat_chkVis(Marker_user_position) ) {
		navigator.geolocation.getCurrentPosition(
			function(position) {
				var pos = ol.proj.transform([position.coords.longitude, position.coords.latitude], 'EPSG:4326', 'EPSG:3857');
				
				curX = position.coords.latitude;
				curY = position.coords.longitude;
				
				feat_setInvis(Marker_user_position2);
				feat_setCoor(Marker_user_position, pos);
				feat_setVis(Marker_user_position);
				mapView.setCenter(pos);
 
				$('a.icon_location.mobile').addClass('on'); 
				$('div.mobile.utils a.mapType').removeClass('on'); 

				curYn = "1";
				checkPoint = "0";

//				Webapp.geoCallback_gps(position);	// TODO : identify usage / purpose; disabled for now
			},
			function(error) {
				if (error.code == 1) {
					alert("현재 사용자는 위치 정보 제공 권한 거부 상태 입니다.\n위치 정보를 사용하고자 할 경우 환경 설정에서 변경 가능합니다.");
				} else if (error.code == 2) {
					alert("위치를 사용할 수 없습니다.");
				} else if (error.code == 3) {
					alert("GPS 현재위치 가져오기 응답시간이 초과 되었습니다.");
				}

				$('a.icon_location.mobile').removeClass('on'); 
				
				try{
					window.callback.af_current_position("error");
				}
				catch(e){
					console.log("error: " + e.message);
				}
			},
			{timeout : 5000}
		);
	} else {
		feat_setInvis(Marker_user_position);
		$('a.icon_location.mobile').removeClass('on'); 
		curYn = "0";
	}
};

function f_presentPosition2(){
// for div.mobile.utils a.mapType : MAP center
	if(isDebugging) console.log("::: f_presentPosition2 FIRED :::");
	if ( !feat_chkVis(Marker_user_position2) ) {
		feat_setInvis(Marker_user_position);
		feat_setCoor(Marker_user_position2, mapView.getCenter());
		feat_setVis(Marker_user_position2);
		
		
		[curUtY, curUtX] = ol.proj.transform(mapView.getCenter(), 'EPSG:3857', 'EPSG:4326');
		$('div.mobile.utils a.mapType').addClass('on'); 
		$('a.icon_location.mobile').removeClass('on'); 
		//	initPathByParam();	// 20230711 : TODO - check useage
		
		curYn = "0";  // 현재위치
		checkPoint = "1";
	} else {
		feat_setInvis(Marker_user_position2);
		$('div.mobile.utils a.mapType').removeClass('on'); 
		checkPoint = "0";
	}
};

// 아이폰 : url 값을 replace하여 window.location 호출 .
// @1@ 에 name, @2@에 addr 를 넣어줌.
var f_iphoneGeoCallback = function(str_url,x, y, level, coordtype,toUrlEncoded,isGps)
{
	var name = "";
	var addr_poi = "";
	var addr_point = "";

	var utmk;

	if( coordtype == "LLW")
	{
		var big = x > y ? x : y;
		var small =x > y ? y : x;

		// TODO: 
		utmk = naver.maps.UTMK.fromCoordToUTMK( naver.maps.Point(small, big) );
		// 20230712 : TODO - openlayers hack - this is incomplete
		// var _temp = ol.proj.transform([big, small], 'EPSG:4326', 'EPSG:5179');
		// utmk.x = _temp[1];
		// utmk.y = _temp[0];

		x = utmk.x;
		y = utmk.y;
	}
	else {
		utmk = new naver.maps.UTMK( x, y );
		// 20230712 : TODO - openlayers hack - this is incomplete
		// var _temp = ol.proj.transform([big, small], 'EPSG:4326', 'EPSG:5179');
		// utmk.x = _temp[1];
		// utmk.y = _temp[0];
	}
	function callIphone() {
		if( !name || !addr_point )
			return;
		if( name ==  "It's..Empty!")
		{
			name = addr_point;
		}
		
		if(toUrlEncoded)
		{
			window.location = str_url.replace('@1@', UTF8.URLEncode(name) ).replace('@2@', UTF8.URLEncode(addr_point) );
			console.log(  str_url.replace('@1@', UTF8.URLEncode(name) ).replace('@2@', UTF8.URLEncode(addr_point) )  );
		}
		else
		{
			window.location = str_url.replace('@1@',name).replace('@2@',addr_point);	
			console.log( str_url.replace('@1@',name).replace('@2@',addr_point)  );
		}

		if( !isGps ) {
			if(Marker_longpress) {
				Marker_longpress.cleanup();
				Marker_longpress = new naver.maps.Marker({
					position: utmk,
					map: map,
					title: UTF8.URLDecode(param.name)
				});
			}
		}
	}
}

function searchStation(){
	var frm = document.srchForm;
	var srchStat = frm.srchStat.value;
	if( srchStat == '' ) {
		alert("검색어를 입력하세요.");
		return;
	} else {
		var w1 = 360;
		var h1 = 640;
	
		var feature = "width="+w1+",height="+h1+",resizable=yes, scrollbars=yes, status=yes, titlebars=no";
		window.open("/mobile/mevname?srchStat="+srchStat+"&curX="+curX+"&curY="+curY,"", feature);
	}
}

function routeRedirect(type, destname, latlong, address) {
	var latitude = latlong.split(",")[0];
	var longitude = latlong.split(",")[1];
	var userAgent = navigator.userAgent || navigator.vendor || window.opera;
	
	var iosURL = "";
	var androidURL = "";
	var desktopURL = "";

	// Navigation Redirect Routing
	// 0. MAPPY
	// 1. T Map
	// 10. Naver Map
	// 11. DAUM Map
	if (type == 0) {
		iosURL = String.format("http://hmns.kr/?M-latitude={0}&longitude={1}&from=iOS.connectev.kr&auth=CONI-R913-P511-2737", latitude, longitude);
		androidURL = String.format("http://hmns.kr/?M-latitude={0}&longitude={1}&from=android.connectev.kr&auth=CONA-R913-P511-2737", latitude, longitude);
	}
	else if (type == 1) {
		iosURL = String.format("tmap://?rGoName={0}&rGoX={1}&rGoY={2}", destname, longitude, latitude);
		androidURL = String.format("tmap://route?goalx={1}&goaly={2}&goalname={0}", destname, longitude, latitude);
	}
	else if (type == 10) {
		//iosURL = String.format("navermaps://?menu=route&elat={1}&elng={2}&etitle={0}", destname, latitude, longitude);
		//androidURL = String.format("intent://?version=11&menu=navigation&elat={1}&elng={2}&etitle={0}", destname, latitude, longitude);
		iosURL = String.format("http://map.naver.com/?dlevel=11&query={0}", address);
		androidURL = String.format("http://map.naver.com/?dlevel=11&query={0}", address);
		desktopURL = String.format("http://map.naver.com/?dlevel=11&query={0}", address);
	}
	else if (type == 11) {
		//iosURL = String.format("daummaps://route?q={0}&ep={1},{2}&by=CAR", destname, latitude, longitude);
		//androidURL = String.format("daummaps://route?q={0}&ep={1},{2}&by=CAR", destname, latitude, longitude);
		iosURL = String.format("http://m.map.daum.net/actions/searchView?q={0}", destname);
		androidURL = String.format("http://m.map.daum.net/actions/searchView?q={0}",destname);
		desktopURL = String.format("http://map.daum.net/?eName={0}", destname);
	}
	
	if( userAgent.match( /iPad/i ) || userAgent.match( /iPhone/i ) || userAgent.match( /iPod/i ) )
	{
		if (iosURL.indexOf("hmns.kr") >= 0) {
			window.open(iosURL);
		}
		else {
			location.href = iosURL;
		}
	}
	else if( userAgent.match( /Android/i ) )
	{
		if (androidURL.indexOf("hmns.kr") >= 0) {
			window.open(androidURL);
		}
		else {
			location.href = androidURL;
		}
	}
	else
	{
		if (type == 1) {
			alert("휴대폰 앱만 사용 가능합니다.");
			return false;
		}

		if (desktopURL != "" && desktopURL != null) {
			window.open(desktopURL, '_blank');
		}
		else {
			alert("모바일에서만 사용가능한 기능입니다.");
		}
	}
}

$(document).ready(function() {
	$('.mobile.utils .scale a').on('click', function() {
		var zoom_ = mapView.getZoom();
		var zoomCoef_ = 1.3;
		
		if ( $(this).hasClass('zoomIn') )
			mapView.animate( { zoom: zoom_ + zoomCoef_, duration: 100 } )
		else if ( $(this).hasClass('zoomOut') )
			mapView.animate( { zoom: zoom_ - zoomCoef_, duration: 100 } )

		setTimeout(function() {
			if ( mapView.getZoom() > mapView.getMaxZoom() )
				 mapView.setZoom( mapView.getMaxZoom() );
			else if ( mapView.getZoom() < mapView.getMinZoom() )
				mapView.setZoom( mapView.getMinZoom() );		
		}, 101);
	});
	sync();
	$(window).on('resize', sync);

});