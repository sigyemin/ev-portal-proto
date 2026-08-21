$(document).ready(function () {
	//탭 클릭시
	$('#tt').tabs({
		onSelect : function(title, index) {
			_setResize();
		}
	});
	//mainTab resize
	$(".con_iframe_c2").height($(".con_iframe_c2_main").height()+$(".tabs-header").height());

});

function _setResize() {
	  // $('.con_iframe_c').css('width', "auto");
	   //$('.con_iframe_c').css('height', $(window).height() );
	   $(window).resize(function() {
	      //  $('.con_iframe_c').css('width', "auto");
	        //$('.con_iframe_c').css('height', $(window).height() );
	   });
}


//탭추가
function addTab(title, url){
	var newTabYn = "Y";
	if ($('#tt').tabs('exists', title)){
		if(confirm("이미 열려져있는 탭메뉴입니다. 기존 탭을 닫고 새로 여시겠습니까?")) {
			$('#tt').tabs('close', title);
		} else {
			$('#tt').tabs('select', title);
			newTabYn = "N";
		}

	} //else {
	if(newTabYn == "Y") {
		var content = '<iframe class="con_iframe_c" name="con_iframe_c" scrolling="yes" frameborder="0" src="'+url+'" style="width:100%; height:100%; position: fixed; padding-top: 5px; padding-bottom: 83px;" ></iframe>';
		var tabCount = 0;
		var maxTabCnt = 10; // 제한 탭
		//탭 갯수 제한 10
		$('.tabs>li').each(function(){
			tabCount++;
		});

		if(tabCount > maxTabCnt){
			alert("열 수 있는 탭의 갯수는 "+maxTabCnt+"개 제한입니다.");
			return;
		}

		 $('#tt').tabs('add',{
			title:title,
			content:content,
			closable:true
		});

		$('#tt').tabs('resize');
	}
	//}
}

//탭메뉴 닫기(title명으로 닫기)
var _CLOSETABTITLE = function(title){
	$("#tt").tabs('close', title);
};

//탭메뉴 닫기
var _closeTab = function(){
	//선택 된 탭찾기
	var tab = $('#tt').tabs('getSelected');
	//선택 된 탭 번호
	var index = $('#tt').tabs('getTabIndex',tab);
	$("#tt").tabs('close', index);
};

//모든탭닫기
var _closeAllTab = function(){
	$('.tabs>li').each(function(index) {
		if($(this).hasClass("tabs-first")){
		}else{
			$("#tt").tabs('close', 1);
		}
	});
};

//모든탭닫기
var _viewTab = function(){
	$('#tt').tabs('resize');
};


