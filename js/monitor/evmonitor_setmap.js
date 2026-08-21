/**
 * zIndexes:
 *  0 : baseLayer, satelLayer
 *  1 : hybridLayer
 * 10 : circleLayer
 * 20 : clusterLayer, station(layer)
 * 
 * */
var vWorldKey = '83A75653-EA63-384B-B284-D56C49332972'
var mapCenter =  [126.97077348, 37.55236577]; 			// 시작 지도 중앙 지점
var defaultZoom = 12; //7;								// 시작 지도 줌 레벨
var baseGround = null;	                        	// Base Map Layer
var declusterZoom = 15;	// 클라스터 거리 declusterDistance으로 변경 줌 레벨	// 20230418 : 추가
var clusterDistance = 100;
var declusterDistance = 15;	// declusterZoom 줌 레벨에 넘어가면 클러스터의 거리가 이로 변경	// 20230418 : 추가

var clustersAlone 	= new Array();			// 기존 충전소 클러스터 레이어 그룹에서 빠진 각 충전소
var clusterLayer    = new Object();
var stationSpot 	= new Array();			// 기존 각 충전소 정보 	
var stationLayer	= new Object();			// zIndex: 40  mainClass A: 공공급속 충전소 현황 전체
var removeStationSpot 	= new Array();			// 기존 각 충전소 정보
var removestationLayer	= new Object();			// zIndex: 40  mainClass A: 공공급속 충전소 현황 전체

//var indicatorLayer = new ol.layer.Vector({	// 충전소 마커 추가 표시
//  source: new ol.source.Vector(),
//  zIndex : 21,
//});


//Map apply start
var baseLayer = new ol.layer.Tile({
    name : 'baseLayer', id : 'base',
    source: new ol.source.XYZ({ url: 'https://api.vworld.kr/req/wmts/1.0.0/' + vWorldKey + '/Base/{z}/{y}/{x}.png' }),
    zIndex: 0
});

var satellLayer =  new ol.layer.Tile({ 
    name : 'satelLayer', id : 'satel',
    source: new ol.source.XYZ({ url: 'https://api.vworld.kr/req/wmts/1.0.0/' + vWorldKey + '/Satellite/{z}/{y}/{x}.jpeg' }),
    zIndex: 0
});
 
var hybridLayer = new ol.layer.Tile({
    name : 'hybridLayer', id : 'hybrid',
    source: new ol.source.XYZ({ url: 'https://api.vworld.kr/req/wmts/1.0.0/' + vWorldKey + '/Hybrid/{z}/{y}/{x}.png'}),
    zIndex: 1
});


//지도 옵션 설정
var mapView = new ol.View({
  center: ol.proj.transform(mapCenter, 'EPSG:4326', 'EPSG:3857'),
  extent: ol.proj.transformExtent([118, 32, 140, 45], 'EPSG:4326', 'EPSG:3857'),
  maxZoom: 19, minZoom: 7, zoom: defaultZoom // 20230517 : maxZoom 19로 바꾸기
});

function Vapi() {};

Vapi.prototype = {
	execute : function( apiParam, sCallback, fCallback ) {
		this.call( apiParam, sCallback, fCallback );
	}, 
	call : function( apiParam, sCallback, fCallback) {
		$.ajax({
			url : $("div#map").data("contextpath") + "web/vworldapijson.do",
			data : {"apiParam": apiParam },
			type : "POST",
			dataType : "json",
			success : function(response) {
				try {
					var rst = $.parseJSON('{"LIST":""}');
//					rst.LIST = $.parseJSON( response );
					rst.LIST = response;	// 20230731 : received response already JSON object, no need parsing
					if( sCallback ) sCallback(rst.LIST);
				} catch (ex) {
				}
			},
			error: function(jqXHR, textStatus, errorThrown) {
				if( fCallback ) fCallback();
			}
		});
	}
}