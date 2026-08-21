// version 7
function compare(a,b) {	if (a.snm < b.snm) return -1; if (a.snm > b.snm) return  1; return 0; };

Map = function() { this.map = new Object(); };

Map.prototype = {
	put : function(key, value) { this.map[key] = value; },
	get : function(key){ return this.map[key]; },
	containsKey : function(key){ return key in this.map; },
	containsValue : function(value) { for(var prop in this.map) { if(this.map[prop] == value) return true; } return false; },
	isEmpty : function(key) { return (this.size() == 0); },
	clear : function() { for(var prop in this.map) { delete this.map[prop]; } },
	remove : function(key) { delete this.map[key]; },
	keys : function() { var keys = new Array(); for(var prop in this.map){ keys.push(prop); } return keys; },
	values : function() { var values = new Array(); for(var prop in this.map){ values.push(this.map[prop]); } return values; },
	size : function() { var count = 0; for (var prop in this.map) { count++; } return count; }
};

var Charger = function(sid, cid, cst) {
	this.sid = sid; this.cid = cid; this.cst = cst;
	this.updateStat = function( nStat ) { this.cst = nStat; };
};

var Station = function( sid, snm, adr, x, y, utime, zscode, fee, call ) {
	this.sid = sid;
	this.snm = snm;
	this.adr = adr;
	this.x = x;
	this.y = y;
	this.stat = ""; //대표상태 : ( 0:알수없음, 1:통신이상, 2:충전대기, 3:충전중, 4:운영중지, 5:점검중 ) 
	this.utime  = utime; //이용시간정보 "24시간" 24시간이용 가능 
	this.zcode = (zscode + "").substring(0, 2);
	this.zscode = zscode;
	this.fee = fee;
	this.call = call;

	this.marker = null;
	
	this.chargers  = new Map(); //충전기 목록 
	
	this.setStat = function( ArryStatFilter ) {
		var nStat = "";
		var allStat = "";
		var tKeys = this.chargers.keys();
		var i = 0;
		
		for( i = 0 ; i < tKeys.length ; i++ ) {
			var cChgr = this.chargers.get( tKeys[i] );
			allStat = ( this.getStatOrder( allStat ) >= this.getStatOrder(cChgr.cst) ) ? allStat : cChgr.cst;
			
			if( this.isContainExcept( ArryStatFilter, cChgr.cst ) ) continue;
			
			nStat = ( this.getStatOrder( nStat ) >= this.getStatOrder(cChgr.cst) ) ? nStat : cChgr.cst;
		}
		
		
		if (this.stat == nStat) {
			return false;
		} else {
			this.stat = nStat;
			return true;
		}
	};
	
	this.isContainExcept = function(fillterArry, stat) {
		if( typeof fillterArry == "undefined" ||  fillterArry == null || !fillterArry.length  ) return false;

		var bRtn = false;
		$.each(fillterArry, function(index, item) {
			if( item == stat ) {
				bRtn = true;
				return false;
			}
		});
		return bRtn;
	};
	
	this.getStatOrder = function( stat ) {
		if( stat == "2" || stat == 2 ) return 8; //충전대기 
		if( stat == "3" || stat == 3 ) return 7; //충전중 
		if( stat == "1" || stat == 1 ) return 6; //통신미연결
		if( stat == "9" || stat == 9 ) return 5; //타기관
		if( stat == "5" || stat == 5 ) return 4; //점검중
		if( stat == "6" || stat == 6 ) return 3; //영업종료
		if( stat == "4" || stat == 4 ) return 2; //운영중지
		if( stat == "7" || stat == 7 ) return 1; //
		return 0; //알수없음
	};
	
	this.getStatName = function( stat ) {
		if( stat == "1" || stat == 1 ) return "통신미연결";
		if( stat == "4" || stat == 4 ) return "운영중지";
		if( stat == "5" || stat == 5 ) return "점검중";
		if( stat == "2" || stat == 2 ) return "사용가능";
		if( stat == "3" || stat == 3 ) return "충전중";
		if( stat == "6" || stat == 6 ) return "영업종료";
		if( stat == "7" || stat == 7 ) return "시범운영";
		if( stat == "9" || stat == 9 ) return "기타(정보미제공)";
		return "알수없음";
	};

	this.iconSizeByZoomLevel = function (zoom) {
		if( zoom < 2 ) return 1;
		if( zoom < 3 ) return 2;
		if( zoom < 4 ) return 3;
		if( zoom < 5 ) return 4;
		if( zoom < 6 ) return 5;
		return 6;
	};
};

var g_infoWindow;

var addClickMarker = function(oThis, nMarker) {
	naver.maps.Event.addListener(nMarker, "click", function() {
		$("<div></div>").load("/portal/monitor/h2Info?sid=" + oThis.sid, function(){
			if( !g_infoWindow ) g_infoWindow = new naver.maps.InfoWindow( {
				disableAutoPan : false
			});
			
			g_infoWindow.setContent( $(this).html() );
			g_infoWindow.open(m_map, nMarker);
			
			//$("#info_wrap").attr("tabindex", $("#tabidx").val());
			//$("#info_close").attr("tabindex", $("#tabidx").val());
			$("#info_wrap").focus();
		});
	});
};

function closeInfoWin() {
	stationListOverlay.setPosition(undefined);
	element_stationList.innerHTML = "";
}

function detailImage( tImg ) {
	var ww = $(window).width() ;
	var wh = $(window).height() ;

	var iw;
	var ih;

	if (typeof tImg.naturalWidth == "undefined") {
		// IE 6/7/8
		var i = new Image();
		i.src = tImg.src;
		iw = i.width;
		ih = i.height;
	}
	else {
		// HTML5 browsers
		iw = tImg.naturalWidth;
		ih = tImg.naturalHeight;
	}

	if(iw > 500) iw = '500px;';

	if(iw < 200) iw = '200px';

	$("#stationInfoContent").html("<img id='img_1'  src='"+ tImg.src +"' style='cursor:pointer;' width='"+iw+"px'/>");

	//$("#stationImgWin").width(iw).height(ih);
	$("#stationImgWin").center();
	$("#stationImgWin").show();

	$("#stationImgWin > #stationImgHead > span").unbind();
	$("#stationImgWin #b3, #img_1").bind("click", function(){
		$("#stationImgWin").hide();
	});

	$("#stationImgWin #b1").unbind(); //이벤트 중복 방지
	$("#stationImgWin #b1").bind("click", function(){
		$("#img_1").width($("#img_1").width()*1.1);
	});

	$("#stationImgWin #b2").unbind(); //이벤트 중복 방지
	$("#stationImgWin #b2").bind("click", function(){
		if($("#img_1").width() <180){ alert("더이상 축소할 수 없습니다."); return;}
		$("#img_1").width($("#img_1").width()*.9);
	});
}

var check = 0;
var clusterFeatures = new Array();

function reDrawStatAndMarker(){
	reDrawStatAndMarker_("",0,0);
	setTimeout(function () { this.dispatchEvent(new CustomEvent("custom_drawMarker"), false, false) }, 50);
}

function reDrawStatAndMarker_(uid,x,y) {
	
	var filterStat = ["0"];	// 20230627 : getExceptStat() -> return 알수없음(미확인)

	var tKeys = m_mapStations.keys();

	if(uid == "" &&  x == 0 && y== 0 ){
		window.parameter = null;
		window.parameter2 = null;
		check = 1;
	}
	
	var arrStation = new Array();
	var stationSid = [];
	var chstat = false;
	
	var arrayNum = 0;
	var removeArrayNum = 0;
	
	clusterFeatures = new Array();;
	
	for( var i = 0 ; i < tKeys.length ; i++ ) {
		var theStation = m_mapStations.get( tKeys[i] );
		chstat = theStation.setStat( filterStat );
		
		if(theStation.stat != ""){
			
			stationSpot[arrayNum] = { 
					sid: theStation.sid, id: arrayNum, y: parseFloat(theStation.y), x: parseFloat(theStation.x)
					,chgeMange: theStation.chgeMange, stat: theStation.stat, mode: theStation.mode
			}
		
			clusterFeatures[arrayNum] = new ol.Feature({ geometry: new ol.geom.Point(ol.proj.transform([parseFloat(theStation.y), parseFloat(theStation.x)], 'EPSG:4326', 'EPSG:3857')), id: arrayNum});
			arrayNum ++;
		}
	}
	
	baseGround.removeLayer(clusterLayer);
	clusterDrawing(clusterFeatures);
}

var styleCache = {};
function simplifiedStyle(feature) {
	var size = feature.get('features').length;
	
	if ( size <= 1 ) {
		if (feature.get('features')[0] !== undefined)
			if (clustersAlone.indexOf(feature.get('features')[0].values_.id) < 0)	// 20230628 : 증복추가차단 - TODO: 증복함수호출 구하기 지우기/해결
			clustersAlone.push(feature.get('features')[0].values_.id);
		return;
	}
	
	// var radius = (size > 1) ? 20 + (size - 1) * 5 : 20;
	var radius = (size - 1) * 5 + 15;
    if (radius > 50) radius = 50;
    let style = styleCache[radius];
    
	if (!style) {
		style = new ol.style.Style({
			image: new ol.style.Circle({ radius: radius, fill: new ol.style.Fill({ color: 'rgba(0, 76, 161, 0.75)' }) }),
            text: new ol.style.Text({ fill: new ol.style.Fill({color: '#FFF'}), font: 'bold 15px Arial', offsetX: 0.5, offsetY: 1, scale: 1, text: size.toString()
			})
		});
		styleCache[radius] = style;
	} else {
		if (radius == 50)
			style.getText().setText(size.toString());
	}
	
	return style;
}

function clusterDrawing(clusterFeatures){
	
	if (Object.keys(stationLayer).length > 0) {
		baseGround.removeLayer(stationLayer);
		var stationLayer = new Object();
	}
	
	if (Object.keys(clusterLayer).length > 0) {
		baseGround.removeLayer(clusterLayer);
		clusterLayer = new Object();
	}
	
	clustersAlone = new Array();
	
	var _newDistance;
	if( baseGround.getView().getZoom() >= declusterZoom){
		_newDistance = declusterDistance;
	}else{
		_newDistance = clusterDistance;
	}
	
	var clusterSource = new ol.source.Cluster({ 
		distance: _newDistance, 
		source: new ol.source.Vector({ features: clusterFeatures }) 
	});
	
	clusterLayer = new ol.layer.Vector({
		name : 'clusterLayer', id : 'cluster',
		source: clusterSource, 
		style: simplifiedStyle, // originalStyle(feature), // end style
		zIndex: 30
	});
	
	baseGround.addLayer(clusterLayer);
}
// 20230627 : styleCache 적용 --- END 

function markerDrawing() {
	
	stationLayer = new Object();
	
	var stationFeature = new Array();
	$.each(clustersAlone, function (i, idkey) {
		$.each(stationSpot, function (key, object) {
			if (idkey == object.id) {
				
				stationFeature[i] = new ol.Feature({
                    geometry: new ol.geom.Point(ol.proj.transform([object.y, object.x], 'EPSG:4326', 'EPSG:3857')), kind: 'ExistingStation'
                    ,sid: object.sid ,id: object.id, stationY: object.y, stationX: object.x, chgeMange: object.chgeMange, stat: object.stat, mode: object.mode
                });
			}
		});
	});
	
	stationLayer = new ol.layer.Vector({ name : 'station', id : 'station', source: new ol.source.Vector({features: stationFeature}), style: createStyle_NEW, zIndex: 40 });
	
	baseGround.addLayer(stationLayer);
	
}

var iconCache = {};	// 20230620 - cache icon images
function createStyle(feature,resolution){ 
	var stat = feature.get('stat');
	var icon_key = getMarkerKey(stat);
	
	let iconStyle = iconCache[icon_key];
	if(!iconStyle) {
		iconStyle = getMarkerStyle(icon_key);
		iconCache[icon_key] = iconStyle;
	}
	return iconStyle;
}

function getMarkerKey( stat ) {
	
	var markerKey = new Array;
	
	if (stat == "") stat = "0";
	
	if (stat == 6) stat = 1;
	else if (stat == 7) stat = 9;
	else if (stat == 5) stat = 1;

//	imgUrl = $("div#map").data("contextpath") + '/img/monitor/marker/m_89_' + stat_cd + '.png';
	markerKey.push("89");
	markerKey.push(stat);
	
	return markerKey;
}

function getMarkerStyle(markerKey) {
	
	var returnStyle = new Array;
	var busi_id = markerKey[0];
	var stat_cd = markerKey[1];
	
	var markerLayerStyle = new ol.style.Style({
		image : new ol.style.Icon({
			src : $("div#map").data("contextpath") + 'img/monitor/marker_layer/' + stat_cd + '.png',
		}),
	});
	returnStyle.push(markerLayerStyle);
	
	var logoStyle = new ol.style.Style({
		image : new ol.style.Icon({
			src : $("div#map").data("contextpath") + 'img/monitor/logo_layer/logo_' + busi_id + '.png',
		}),
	});
	returnStyle.push(logoStyle);
	
	return returnStyle;
}

function createStyle_NEW(feature,resolution){ 
	
	var chageMange = feature.get('chgeMange');
	var stat = feature.get('stat');
	var mode = feature.get('mode');
	// TODO : getMarkerIcon -> cache selector / new style create
	
	var linchpin =  feature.get('TODO_define_me');
	let iconStyle = iconCache[ linchpin ];
	if(!iconStyle) {
		var color = "";
		var radius = 15;
		var radius_padding = 5;
		
		if ( linchpin == undefined || linchpin == null || linchpin == "" ) color = '#000000';
		else if ( linchpin.equals('blue') ) color = '#528ce2';
		else if ( linchpin.equals('green') ) color = '#417721';
		else if ( linchpin.equals('black') ) color = '#333333';
		else if ( linchpin.equals('orange') ) color = '#d57d00';
		else color = '#000000';
		
		iconStyle = [
			// color CIRCLE
			new ol.style.Style({
				image: new ol.style.Circle({ 
					radius: radius + radius_padding, 
					fill: new ol.style.Fill({ color: color }), 
					displacement: [0, radius * 11 / 6] }),
			}),
			// downward TRIANGLE
//			new ol.style.Style({
//				image: new ol.style.RegularShape({ 
//					radius1: radius * 5 / 6, 
//					radius2: radius * 3 / 4, 
//					fill: new ol.style.Fill({ color: color }), 
//					points: 3, 
//					rotation: Math.PI, 
//					displacement: [0, - radius * 5 / 6] }),
//			}),
			// downward SQUARE
			new ol.style.Style({
				image: new ol.style.RegularShape({ 
					radius1: radius / Math.SQRT2, 
					radius2: radius, 
					fill: new ol.style.Fill({ color: color }), 
					points: 4, 
					rotation: Math.PI / 4, 
					displacement: [-radius / Math.SQRT2, radius / Math.SQRT2]
					}),
			}),
			// white CIRCLE
			new ol.style.Style({
				image: new ol.style.Circle({ 
					radius: radius, 
					fill: new ol.style.Fill({ color: '#FFF' }), 
					displacement: [0, radius * 11 / 6] }),
				text: new ol.style.Text({ fill: new ol.style.Fill({color: '#000'}), font: 'bold 15px Arial', offsetX: 0.5, offsetY: 1 - radius * 11 / 6, scale: 1, text: ''   })
			}),
		]
		
		iconCache[ linchpin ] = iconStyle; 
	}
	
//	iconStyle[2].getText().setText( feature.get('TODO_define_me') );
	iconStyle[2].getText().setText( linchpin );
	return iconStyle;
}

function getChgeMangeImg() {
//	return '../img/monitor/micon/89.png';
	return '../img/monitor/logo/logo_89.png';
}

function getLogoImg() {
	return '../img/monitor/logo/logo_h2.png';
}

function getStatSpan(stat) {
	var span = "";
	
	if(stat == 2 || stat == '2' ){//충전기대기
		return '<span class="state">사용가능</span>';
	}else if(stat == 3 || stat == '3' ){//충전중 
		return '<span class="state state_gr">사용중</span>';
	}else if(stat == 4 || stat == '4' ){//운영중지
//		span = "<span class='condition04'>운영중지</span>";
		return '<span class="state state_org">운영중지</span>';
	}else if(stat == 5 || stat == '5' ){//점검중
//		span = "<span class='condition05'>사용불가</span>";
		return '<span class="state state_black">사용불가</span>';
	}else if(stat == 1 || stat == '1' ){//통신미연결
//		span = "<span class='condition01'>사용중</span>";
		return '<span class="state state_gr">사용중</span>';
	}else if(stat == 6 || stat == '6' ){//영업종료
//		span = "<span class='condition05'>영업종료</span>";
		return '<span class="state state_black">영업종료</span>';
	}else if(stat == 7 || stat == '7' ){//시범운영
//		span = "<span class='condition05'>시범운영</span>";
		return '<span class="state state_black">시범운영</span>';
	}else if(stat == 9 || stat == '9' ){//타기관
//		span = "<span class='condition01'>사용중</span>";
		return '<span class="state state_gr">사용중</span>';
	}
	
	return span;
}

function getStatMSpan(stat) {
	var span = "";
	
	if(stat == 2 || stat == '2' ){//충전기대기
		span = "<span class='ev_char_s c01'>사용가능</span>";
	}else if(stat == 3 || stat == '3' ){//충전중 
		span = "<span class='ev_char_s c02'>사용중</span>";
	}else if(stat == 4 || stat == '4' ){//운영중지
		span = "<span class='ev_char_s c04'>운영중지</span>";
	}else if(stat == 5 || stat == '5' ){//점검중
		span = "<span class='ev_char_s c05'>사용불가</span>";
	}else if(stat == 1 || stat == '1' ){//통신미연결
		span = "<span class='ev_char_s c02'>사용중</span>";
	}else if(stat == 6 || stat == '6' ){//영업종료
		span = "<span class='ev_char_s c05'>영업종료</span>";
	}else if(stat == 7 || stat == '7' ){//시범운영
		span = "<span class='ev_char_s c07'>시범운영</span>";
	}else if(stat == 9 || stat == '9' ){//타기관
		span = "<span class='ev_char_s c02'>사용중</span>";	
	}
	
	return span;
}

/* 지도 클라스터 리스트 지우기 */
// 20230607 : new_monitor.jsp에서 여기로 이동 
function stationListClose() {
	stationListOverlay.setPosition(undefined);
	element_stationList.innerHTML = "";
	return false;
}

