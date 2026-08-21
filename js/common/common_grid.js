/**
 * 1. 서브 그리드 생성시 주의사항 1) 최초로딩시만 input 값에 세팅된 값을 가져간다. 2) 로딩 끝나고 해당 input id에 값을
 * 세팅 한다. 3) 그리드 리로딩시엔 input 세팅된 rows, sord, page, sidx 값은 참고하지 않는다. 4) 컨트롤러에서는
 * rows, sord, page, sidx로 ajax로 보내지기 때문에 항상 그값으로만 받아서 처리된다. 5) 검색 유지하는 input 명을
 * 변경하여 상세 페이지에서 그리드 사용시 해당 로딩 완료후 항상 상세페이지 그리드 파라미터 rows, sord, page, sidx 다시
 * 세팅 해준다.
 */
// 그리드 생성
var _SHOWGRID = function(gridOption) {
	var _GRID = $("#" + gridOption.id);
	var _PAGER = "#" + gridOption.pager;
	var loadCompleteF = function(data) {
		// 전체 rowList에 text변경
		$("#" + gridOption.pager + " option[value=-1]").text('전체');
		// set page
		// page form에 set해줌(다른페이지 이동시 현재그리드 페이지 정보 저장)
		var _GRIDPARAM = _GRID.jqGrid('getGridParam');
		$("#" + gridOption.inputPageId).val(_GRIDPARAM.page);
		$("#" + gridOption.inputRowsId).val(_GRIDPARAM.rowNum);
		$("#" + gridOption.inputSidxId).val(_GRIDPARAM.sortname);
		$("#" + gridOption.inputSordId).val(_GRIDPARAM.sortorder);
		// $("#page").val(_GRIDPARAM.page);
		// $("#sidx").val(_GRIDPARAM.sortname);
		// $("#rows").val(_GRIDPARAM.rowNum);
		// $("#sord").val(_GRIDPARAM.sortorder);
	};
	if(gridOption.loadCompleteF != null && gridOption.loadCompleteF !== "") {
		loadCompleteF = gridOption.loadCompleteF;
	}
	var _SETMULTISELECT = typeof gridOption.multiselect === "boolean" ? gridOption.multiselect : false;
	var _SETAUTOWIDTH = typeof gridOption.autowidth === "boolean" ? gridOption.autowidth : true;
	var _SETSHRINKTOFIT = typeof gridOption.shrinkToFit === "boolean" ? gridOption.shrinkToFit : true;
	var _SETSELECTALL = typeof gridOption.onSelectAllF === "function" ? gridOption.onSelectAllF : '';
	var _SETBEFORESELECTROW = typeof gridOption.beforeSelectRowF === "function" ? gridOption.beforeSelectRowF : '';
	var _SETONCELLSELECT = typeof gridOption.onCellSelectF === "function" ? gridOption.onCellSelectF : '';
	var _SETSORTABLE = typeof gridOption.sortable === "boolean" ? gridOption.sortable : true;
	var _SETCELLEDIT = typeof gridOption.cellEdit === "boolean" ? gridOption.cellEdit : false;
	var _GRIDCAPTION = typeof gridOption.caption === "undefined" ?  '' : gridOption.caption;

	_GRID.jqGrid(
		{
			url : gridOption.url,
			datatype : 'json', // json, local
			caption : gridOption.caption,
			mtype : 'post',
			postData : _ADDFORMDATA(gridOption.formId),
			colNames : gridOption.colN,// 열의 이름을 지정한다.
			colModel : gridOption.colM,
			pager : _PAGER, // 도구 모음이 될 div 태그 지정
			page : gridOption.page,
			rowNum : gridOption.rowNum, // 한 화면에 표시할 row의 갯수
			sortname : gridOption.sortName, // 기본으로 정렬 시, 정렬 기준이 될 index 명
			sortorder : gridOption.sortOrder,
			rowList :
				[
						"10", "20", "50", "100"
				], // rowNum을 선택할 수 있는 옵션
			prmNames: {
                page: gridOption.inputPageId,
                rows: gridOption.inputRowsId,
                sidx: gridOption.inputSidxId,
                sort: gridOption.inputSordId
            },
			viewrecords : true,
			gridview : false,
			autoencode : true,
			sortable : true,
			// emptyrecords: "조회된 데이타가 없습니다.",
			loadonce : false,
			// loadui: "enable",
			// width:"auto", // grid 넓이 설정
			height : "auto", // grid 높이 설정
			regional : 'kr',
			autowidth : _SETAUTOWIDTH,
			shrinkToFit : _SETSHRINKTOFIT,
			multiselect : _SETMULTISELECT,
			multiselectWidth : 50, //일단 변수로 안 받고 size 고정시킴, %로 할수 있는 방법 못 찾음 -hskim-
			editurl : gridOption.editurl, // 추가/수정/삭제 이벤트 발생 시 호출할 url
			jsonReader :
				{
					repeatitems : false
				},
			loadComplete : loadCompleteF,
			onSelectRow : gridOption.onSelectRowF,
			onSelectAll : _SETSELECTALL,
			beforeSelectRow : _SETBEFORESELECTROW,
			onCellSelect : gridOption.onCellSelectF,
			afterEditCell : gridOption.onAfterEditCellF,
			altRows : true,
			cellEdit : _SETCELLEDIT,
			cellsubmit : gridOption.cellsubmit,
			onSortCol: function(columnName, columnIndex, sortOrder) {
				$("#" + gridOption.inputSidxId).val(columnName);
			    _GRIDRELOAD("table_list", "frm");
			},
			loadError : function(xhr, textStatus, error) {
				if(xhr.status == "500") {
					document.location.href = "/error/errorPage1.jsp";
				}
				if(xhr.status == "403") {
					alert("로그인 정보가 없습니다.로그인하여 주시기 바랍니다.");
					top.location.href = _CTX_PATH+'/keco/login/login/initLoginAction.do';
				}
				if(xhr.status == "404") {
					alert("통신중 에러가 발생하였습니다.");
				}
			}
		});

	_RESIZEJQGRIDWIDTH(gridOption.id);
};
// 그리드 생성(모달용)
var _SHOWGRIDMODAL = function(gridOption) {
	var _GRID = $("#" + gridOption.id);
	var _PAGER = "#" + gridOption.pager;
	var loadCompleteF = function(data) {
		// 전체 rowList에 text변경
		// $("#"+gridOption.pager+" option[value=-1]").text('전체');
		// set page
		// page form에 set해줌(다른페이지 이동시 현재그리드 페이지 정보 저장)
		var _GRIDPARAM = _GRID.jqGrid('getGridParam');
		$("#" + gridOption.inputPageId).val(_GRIDPARAM.page);
		$("#" + gridOption.inputRowsId).val(_GRIDPARAM.rowNum);
		$("#" + gridOption.inputSidxId).val(_GRIDPARAM.sortname);
		$("#" + gridOption.inputSordId).val(_GRIDPARAM.sortorder);
		// $("#page").val(_GRIDPARAM.page);
		// $("#sidx").val(_GRIDPARAM.sortname);
		// $("#rows").val(_GRIDPARAM.rowNum);
		// $("#sord").val(_GRIDPARAM.sortorder);
	};
	if(gridOption.loadCompleteF != null && gridOption.loadCompleteF !== "") {
		loadCompleteF = gridOption.loadCompleteF;
	}
	var _SETMULTISELECT = typeof gridOption.multiselect === "boolean" ? gridOption.multiselect : false;
	var _SETSELECTALL = typeof gridOption.onSelectAllF === "function" ? gridOption.onSelectAllF : '';
	var _SETBEFORESELECTROW = typeof gridOption.beforeSelectRowF === "function" ? gridOption.beforeSelectRowF : '';
	var _SETSORTABLE = typeof gridOption.sortable === "boolean" ? gridOption.sortable : true;
	_GRID.jqGrid(
		{
			url : gridOption.url,
			datatype : 'json', // json, local
			mtype : 'post',
			postData : _ADDFORMDATA(gridOption.formId),
			colNames : gridOption.colN,// 열의 이름을 지정한다.
			colModel : gridOption.colM,
			pager : _PAGER, // 도구 모음이 될 div 태그 지정
			page : gridOption.page,
			rowNum : gridOption.rowNum, // 한 화면에 표시할 row의 갯수
			sortname : gridOption.sortName, // 기본으로 정렬 시, 정렬 기준이 될 index 명
			sortorder : gridOption.sortOrder,
			viewrecords : true,
			gridview : false,
			autoencode : true,
			sortable : _SETSORTABLE,
			// emptyrecords: "조회된 데이타가 없습니다.",
			loadonce : false,
			// loadui: "enable",
			// width:"auto", // grid 넓이 설정
			height : "auto", // grid 높이 설정
			regional : 'kr',
			autowidth : true,
			shrinkToFit : true,
			multiselect : _SETMULTISELECT,
			altRows : true,
			editurl : gridOption.editurl, // 추가/수정/삭제 이벤트 발생 시 호출할 url
			jsonReader :
				{
					repeatitems : false
				},
			loadComplete : loadCompleteF,
			onSelectRow : gridOption.onSelectRowF,
			onSelectAll : _SETSELECTALL,
			beforeSelectRow : _SETBEFORESELECTROW
		});
};
// 그리드 생성(틀 고정)
var _SHOWGRIDFROZEN = function(gridOption) {
	var _GRID = $("#" + gridOption.id);
	var _PAGER = "#" + gridOption.pager;
	var loadCompleteF = function(data) {
		// 전체 rowList에 text변경
		$("#" + gridOption.pager + " option[value=-1]").text('전체');
		// set page
		// page form에 set해줌(다른페이지 이동시 현재그리드 페이지 정보 저장)
		var _GRIDPARAM = _GRID.jqGrid('setFrozenColumns');
		$("#" + gridOption.inputPageId).val(_GRIDPARAM.page);
		$("#" + gridOption.inputRowsId).val(_GRIDPARAM.rowNum);
		$("#" + gridOption.inputSidxId).val(_GRIDPARAM.sortname);
		$("#" + gridOption.inputSordId).val(_GRIDPARAM.sortorder);
		// $("#page").val(_GRIDPARAM.page);
		// $("#sidx").val(_GRIDPARAM.sortname);
		// $("#rows").val(_GRIDPARAM.rowNum);
		// $("#sord").val(_GRIDPARAM.sortorder);
	};
	if(gridOption.loadCompleteF != null && gridOption.loadCompleteF !== "") {
		loadCompleteF = gridOption.loadCompleteF;
	}
	var _SETMULTISELECT = typeof gridOption.multiselect === "boolean" ? gridOption.multiselect : false;
	var _SETAUTOWIDTH = typeof gridOption.autowidth === "boolean" ? gridOption.autowidth : true;
	var _SETSHRINKTOFIT = typeof gridOption.shrinkToFit === "boolean" ? gridOption.shrinkToFit : true;
	var _SETSELECTALL = typeof gridOption.onSelectAllF === "function" ? gridOption.onSelectAllF : '';
	var _SETBEFORESELECTROW = typeof gridOption.beforeSelectRowF === "function" ? gridOption.beforeSelectRowF : '';
	var _SETONCELLSELECT = typeof gridOption.onCellSelectF === "function" ? gridOption.onCellSelectF : '';
	var _SETSORTABLE = typeof gridOption.sortable === "boolean" ? gridOption.sortable : true;
	var _SETCELLEDIT = typeof gridOption.cellEdit === "boolean" ? gridOption.cellEdit : false;
	var _GRIDCAPTION = typeof gridOption.caption === "undefined" ?  '' : gridOption.caption;

	_GRID.jqGrid(
		{
			url : gridOption.url,
			datatype : 'json', // json, local
			caption : gridOption.caption,
			mtype : 'post',
			postData : _ADDFORMDATA(gridOption.formId),
			colNames : gridOption.colN,// 열의 이름을 지정한다.
			colModel : gridOption.colM,
			pager : _PAGER, // 도구 모음이 될 div 태그 지정
			page : gridOption.page,
			rowNum : gridOption.rowNum, // 한 화면에 표시할 row의 갯수
			sortname : gridOption.sortName, // 기본으로 정렬 시, 정렬 기준이 될 index 명
			sortorder : gridOption.sortOrder,
			rowList :
				[
						"10", "20", "50", "100"
				], // rowNum을 선택할 수 있는 옵션
			prmNames: {
                page: gridOption.inputPageId,
                rows: gridOption.inputRowsId,
                sidx: gridOption.inputSidxId,
                sort: gridOption.inputSordId
            },
			viewrecords : true,
			gridview : false,
			autoencode : true,
			sortable : false,
			// emptyrecords: "조회된 데이타가 없습니다.",
			loadonce : false,
			// loadui: "enable",
			// width:"auto", // grid 넓이 설정
			height : "auto", // grid 높이 설정
			regional : 'kr',
			autowidth : _SETAUTOWIDTH,
			shrinkToFit : _SETSHRINKTOFIT,
			multiselect : _SETMULTISELECT,
			multiselectWidth : 50, //일단 변수로 안 받고 size 고정시킴, %로 할수 있는 방법 못 찾음 -hskim-
			editurl : gridOption.editurl, // 추가/수정/삭제 이벤트 발생 시 호출할 url
			jsonReader :
				{
					repeatitems : false
				},
			loadComplete : loadCompleteF,
			onSelectRow : gridOption.onSelectRowF,
			onSelectAll : _SETSELECTALL,
			beforeSelectRow : _SETBEFORESELECTROW,
			onCellSelect : gridOption.onCellSelectF,
			afterEditCell : gridOption.onAfterEditCellF,
			altRows : true,
			cellEdit : _SETCELLEDIT,
			cellsubmit : gridOption.cellsubmit,
			onSortCol: function(columnName, columnIndex, sortOrder) {
				$("#" + gridOption.inputSidxId).val(columnName);
			    _GRIDRELOAD("table_list", "frm");
			},
			loadError : function(xhr, textStatus, error) {
				if(xhr.status == "500") {
					document.location.href = "/error/errorPage1.jsp";
				}
				if(xhr.status == "403") {
					alert("로그인 정보가 없습니다.로그인하여 주시기 바랍니다.");
					top.location.href = _CTX_PATH+'/keco/login/login/initLoginAction.do';
				}
				if(xhr.status == "404") {
					alert("통신중 에러가 발생하였습니다.");
				}
			}
		});

	_GRID.jqGrid('setFrozenColumns');

	_RESIZEJQGRIDWIDTH(gridOption.id);

};
// 그리드 생성(페이지 삭제)
var _SHOWGRIDNOPAGING = function(gridOption) {
	var _GRID = $("#" + gridOption.id);
	var _PAGER = "#" + gridOption.pager;
	var loadCompleteF = function(data) {
		// page form에 set해줌(다른페이지 이동시 현재그리드 페이지 정보 저장)
		var _GRIDPARAM = _GRID.jqGrid('getGridParam');
		$("#" + gridOption.inputPageId).val(_GRIDPARAM.page);
		$("#" + gridOption.inputRowsId).val(_GRIDPARAM.rowNum);
		$("#" + gridOption.inputSidxId).val(_GRIDPARAM.sortname);
		$("#" + gridOption.inputSordId).val(_GRIDPARAM.sortorder);
	};
	if(gridOption.loadCompleteF != null && gridOption.loadCompleteF !== "") {
		loadCompleteF = gridOption.loadCompleteF;
	}
	var _SETMULTISELECT = typeof gridOption.multiselect === "boolean" ? gridOption.multiselect : false;
	var _SETAUTOWIDTH = typeof gridOption.autowidth === "boolean" ? gridOption.autowidth : true;
	var _SETSHRINKTOFIT = typeof gridOption.shrinkToFit === "boolean" ? gridOption.shrinkToFit : true;
	var _SETSELECTALL = typeof gridOption.onSelectAllF === "function" ? gridOption.onSelectAllF : '';
	var _SETBEFORESELECTROW = typeof gridOption.beforeSelectRowF === "function" ? gridOption.beforeSelectRowF : '';
	var _SETONCELLSELECT = typeof gridOption.onCellSelectF === "function" ? gridOption.onCellSelectF : '';
	var _SETSORTABLE = typeof gridOption.sortable === "boolean" ? gridOption.sortable : true;
	_GRID.jqGrid(
		{
			url : gridOption.url,
			datatype : 'json', // json, local
			mtype : 'post',
			postData : _ADDFORMDATA(gridOption.formId),
			colNames : gridOption.colN,// 열의 이름을 지정한다.
			colModel : gridOption.colM,
			pager : _PAGER, // 도구 모음이 될 div 태그 지정
			page : gridOption.page,
			// rowNum:gridOption.rowNum, // 한 화면에 표시할 row의 갯수
			rowNum : -1, // 한 화면에 표시할 row의 갯수
			sortname : gridOption.sortName, // 기본으로 정렬 시, 정렬 기준이 될 index 명
			sortorder : gridOption.sortOrder,
			viewrecords : true,
			gridview : false,
			autoencode : true,
			sortable : _SETSORTABLE,
			loadonce : false,
			height : "auto", // grid 높이 설정
			regional : 'kr',
			autowidth : _SETAUTOWIDTH,
			shrinkToFit : _SETSHRINKTOFIT,
			multiselect : _SETMULTISELECT,
			editurl : gridOption.editurl, // 추가/수정/삭제 이벤트 발생 시 호출할 url
			pgtext : null, // 페이지 text삭제
			pgbuttons : false, // 페이지 버튼 삭제
			altRows : true,
			jsonReader :
				{
					repeatitems : false
				},
			loadComplete : loadCompleteF,
			onSelectRow : gridOption.onSelectRowF,
			onSelectAll : _SETSELECTALL,
			beforeSelectRow : _SETBEFORESELECTROW,
			onCellSelect : _SETONCELLSELECT,
			loadError : function(xhr, textStatus, error) {
				if(xhr.status == "500") {
					document.location.href = "/error/errorPage1.jsp";
				}
				if(xhr.status == "403") {
					alert("로그인 정보가 없습니다.로그인하여 주시기 바랍니다.");
					top.location.href = '/keco/home/indexAction.do';
				}
				if(xhr.status == "404") {
					alert("NOT");
				}
			}
		});
};

var _GRIDRELOAD = function(grid, formId) {
	$("#" + grid).clearGridData();
	$("#" + grid).setGridParam(
		{
			postData : null
		});
	$("#" + grid).setGridParam(
		{
			// serializeGridData : function (postData) {
			// postData.formData =
			// JSON.stringify(form2js(document.getElementById(formId)));;
			// return JSON.stringify(postData);
			// },
			postData : _ADDFORMDATA(formId)
		// ,
		// datatype:'json',
		// loadonce:true // 데이타 로딩 후, jqgrid의 로컬데이타 검색과 헤더 정렬 기능 사용을 위해 true로
		// 설정.
		});
	// _NAVIBUTTON(grid, true);// navigator 버튼 표시.

	//console.log("postData:"+JSON.stringify(_ADDFORMDATA(formId)));
	$("#" + grid).trigger('reloadGrid');
}
// formdata setting
var _ADDFORMDATA = function(formId) {
	var obj = null;
	var arr = $('#' + formId).serializeArray();
	if(arr) {
		obj = {};
		jQuery.each(arr, function() {
			if(obj[this.name]) {
				obj[this.name] = obj[this.name] + ',' + this.value;
			} else {
				obj[this.name] = this.value;
			}
		});
	}
	return obj;
}

/**
 * 그리드 pagaing
 * @param gridId
 * @param pagerId
 */
function fnJqInitPage(gridId, pagerId) {
	var pagingPageCnt = 10; // 한 페이지 10페이지 씩
	var pageCount = $('#' + gridId).getGridParam('rowNum'); // 한 페이지에 보여줄
	// 현재 페이지
	var currentPage = $('#' + gridId).getGridParam('page');
	// 전체 리스트 수
	var totalSize = $('#' + gridId).getGridParam('records');
	// 그리드 데이터 전체의 페이지 수
	var totalPage = Math.ceil(totalSize / $('#' + gridId).getGridParam('rowNum'));
	// 전체 페이지 수를 한화면에 보여줄 페이지로 나눈다.
	var totalPageList = Math.ceil(totalPage / pagingPageCnt);
	// 페이지 리스트가 몇번째 리스트인지
	var pageList = Math.ceil(currentPage / pagingPageCnt);
	// 페이지 리스트가 1보다 작으면 1로 초기화
	if(pageList < 1)
		pageList = 1;
	// 페이지 리스트가 총 페이지 리스트보다 커지면 총 페이지 리스트로 설정
	if(pageList > totalPageList)
		pageList = totalPageList;
	// 시작 페이지
	var startPageList = Number(((pageList - 1) * pagingPageCnt) + 1);
	// 끝 페이지
	var endPageList = Number(startPageList) + Number(pagingPageCnt) - 1;
	// 시작 페이지와 끝페이지가 1보다 작으면 1로 설정
	// 끝 페이지가 마지막 페이지보다 클 경우 마지막 페이지값으로 설정
	if(startPageList < 1) {
		startPageList = 1;
	}
	if(endPageList > totalPage) {
		endPageList = totalPage;
	}
	if(endPageList < 1) {
		endPageList = 1;
	}
	// 페이징 DIV에 넣어줄 태그 생성변수
	var pageInner = "";

	//전체의 페이지 수가 10페이지보다 클경우
	if(totalPage > pagingPageCnt){
		// 페이지 리스트가 1이나 데이터가 없을 경우 (링크 빼고 흐린 이미지로 변경)
		if(pageList < 2) {
			//pageInner += "<a href=\"javascript:void(0);\"><span>&laquo;</span></a>";
			//pageInner += "<a href=\"javascript:void(0);\"><span>&lt;</span></a>";
			pageInner += "<a href=\"javascript:void(0);\"><span class=\"prev-2\">&nbsp;</span></a>";
			pageInner += "<a href=\"javascript:void(0);\"><span class=\"prev-1\">&nbsp;</span></a>";
		}
		// 이전 페이지 리스트가 있을 경우 (링크넣고 뚜렷한 이미지로 변경)
		if(pageList > 1) {
			//pageInner += "<a href=\"javascript:fnJqFirstPage('" + gridId + "');\"><span>&laquo;</span></a>";
			//pageInner += "<a href=\"javascript:fnJqPrePage('" + gridId + "');\"><span>&lt;</span></a>";
			pageInner += "<a href=\"javascript:fnJqFirstPage('" + gridId + "');\"><span class=\"prev-2\">&nbsp;</span></a>";
			pageInner += "<a href=\"javascript:fnJqPrePage('" + gridId + "');\"><span class=\"prev-1\">&nbsp;</span></a>";
		}
	}

	// 페이지 숫자를 찍으며 태그생성 (현재페이지는 강조태그)
	for(var i = startPageList; i <= endPageList; i++) {
		if(i == currentPage) {
			pageInner += "<a href=\"javascript:void(0);\" id=\"" + (i) + "\" class=\"active\">" + (i) + "</a>";
		} else {
			pageInner += "<a href=\"javascript:fnJqPage('" + gridId + "', '" + (i) + "');\" id=\"" + (i) + "\">" + (i) + "</a>";
		}
	}

	//전체의 페이지 수가 10페이지보다 클경우
	if(totalPage > pagingPageCnt){
		// 다음 페이지 리스트가 있을 경우
		if(totalPageList > pageList) {
			//pageInner += "<a href=\"javascript:fnJqNextPage('" + gridId + "');\"><span>&gt;</span></a>";
			//pageInner += "<a href=\"javascript:fnJqLastPage('" + gridId + "');\"><span>&raquo;</span></a>";
			pageInner += "<a href=\"javascript:fnJqNextPage('" + gridId + "');\"><span class=\"next-1\">&nbsp;</span></a>";
			pageInner += "<a href=\"javascript:fnJqLastPage('" + gridId + "');\"><span class=\"next-2\">&nbsp;</span></a>";
		}
		// 현재 페이지리스트가 마지막 페이지 리스트일 경우
		if(totalPageList == pageList) {
			//pageInner += "<a href=\"javascript:void(0);\"><span>&gt;</span></a>";
			//pageInner += "<a href=\"javascript:void(0);\"><span>&raquo;</span></a>";
			pageInner += "<a href=\"javascript:void(0);\"><span class=\"next-1\">&nbsp;</span></a>";
			pageInner += "<a href=\"javascript:void(0);\"><span class=\"next-2\">&nbsp;</span></a>";
		}
	}

	// 페이지 갯수
	var pageList = "";
	pageList += " <select name=\"rowNum\" id=\"rowNum\" data-page-btn=\"size\" onchange=\"fnJqChangePage('" + gridId + "', this.value);\"> ";
	pageList += " 	<option value=\"10\" "; if(pageCount == 10) { pageList+= "selected=\"selected\""; } pageList+= ">10</option>   ";
	pageList += " 	<option value=\"20\" "; if(pageCount == 20) { pageList+= "selected=\"selected\""; } pageList+=">20</option>   ";
	pageList += " 	<option value=\"50\" "; if(pageCount == 50) { pageList+= "selected=\"selected\""; } pageList+=">50</option>   ";
	pageList += " 	<option value=\"100\" "; if(pageCount == 100) { pageList+= "selected=\"selected\""; } pageList+=">100</option>   ";
	pageList += " </select>  ";

	// 페이지 정보 셋팅
	var pageInfoText = "<div class=\"m-pagination-info\">"; // 페이지 정보를 담을 변수
	if(totalSize == 0) {
		pageInfoText += "총 0 페이지 / 0 건";
	} else {
		pageInfoText += "총 " + (totalPage) + " 페이지" + " / " + (totalSize) + " 건";
	}
	pageInfoText += "</div>";

	var pagerHtml = "";
	pagerHtml += "<div class=\"pagination\">";
	pagerHtml += pageInner;
	//pagerHtml += pageList;
	pagerHtml += "</div>";
	//pagerHtml += pageInfoText;
	// 페이징할 DIV태그에 우선 내용을 비우고 페이징 태그삽입
	$("#" + pagerId).html("");
	// 페이징 html 추가
	$("#" + pagerId).append(pagerHtml);

	//조회건수 출력
	$(".srch-result").html("");
	$(".srch-result").append(pageInfoText);
	//조회건수결과 출력
	$(".table-top .custom-select").html("");
	$(".table-top .custom-select").append(pageList);
}

// 그리드 첫페이지로 이동
function fnJqFirstPage(gridId) {
	$("#" + gridId).jqGrid('setGridParam', {page : 1}).trigger("reloadGrid");
}

// 그리드 이전페이지 이동
function fnJqPrePage(gridId) {
	var currentPage = Number($("#" + gridId).getGridParam('page'));
	var pageCount = 10;//Number($('#' + gridId).getGridParam('rowNum'));
	currentPage -= pageCount;
	var pageList = Math.ceil(currentPage / pageCount);
	currentPage = (pageList - 1) * pageCount + pageCount;
	$("#" + gridId).jqGrid('setGridParam', {page : currentPage}).trigger("reloadGrid");
}

// 그리드 다음페이지 이동
function fnJqNextPage(gridId) {
	var currentPage = Number($("#" + gridId).getGridParam('page'));
	var pageCount = 10;//Number($('#' + gridId).getGridParam('rowNum'));
	currentPage += pageCount;
	pageList = Math.ceil(currentPage / pageCount);
	currentPage = (pageList - 1) * pageCount + 1;
	$("#" + gridId).jqGrid('setGridParam', {page : currentPage}).trigger("reloadGrid");
}

// 그리드 마지막페이지 이동
function fnJqLastPage(gridId) {
	var totalSize = Number(jQuery('#' + gridId).getGridParam('records'));
	var totalPage = Math.ceil(totalSize / 10); //$('#' + gridId).getGridParam('rowNum')
	$("#" + gridId).jqGrid('setGridParam', {page : totalPage}).trigger("reloadGrid");
}

// 그리드 페이지 rownum 선택시
function fnJqChangePage(gridId, rownum) {
	$("#" + gridId).jqGrid('setGridParam', {page : 1, rowNum : rownum}).trigger("reloadGrid");
}

// 그리드 페이지 이동
function fnJqPage(gridId, num) {
	$("#" + gridId).jqGrid('setGridParam', {page : num}).trigger("reloadGrid");
}

/*
 * @param string grid_id 사이즈를 변경할 그리드의 아이디 @param string div_id 그리드의 사이즈의 기준을
 * 제시할 div 의 아이디 @param string width 그리드의 초기화 width 사이즈
 */
function _RESIZEJQGRIDWIDTH(grid_id, div_id, width) {
	var jqGridWrapperId = "#gbox_" + $('#' + grid_id).attr('id');

	//console.log('setGridWidth : '+$(jqGridWrapperId).parent().width());

	$('#' + grid_id).setGridWidth($(jqGridWrapperId).parent().width());
	// window에 resize 이벤트를 바인딩 한다.
	$(window).resize(function () {
		// var newWidth = $('#' + div_id).offsetWidth + 26;
		// alert(newWidth);
		// alert($('#' + div_id).width());
		// 그리드의 width 초기화
		//$('#' + grid_id).setGridWidth($('#' + div_id).width(), false);
		// 그리드의 width를 div 에 맞춰서 적용
		//$('#' + grid_id).setGridWidth($('#' + div_id).width()); // Resized to
		// new width as
		// per window

	    $('#' + grid_id).setGridWidth($(jqGridWrapperId).parent().width());
	});

}

// 모달팝업창 그리드(임시)
function _RESIZEJQGRIDWIDTHPOPUP(grid_id, div_id, width) {
	$(window).bind('resize', function() {
		$('#' + grid_id).setGridWidth($('#' + div_id).width() - 2);
	}).trigger('resize');
}

//그리드ID에 해당하는 체크된 편집 데이터를 전부 가져온다.
function getCheckedJsonData(id){
	closeAllEditRow(id);
	var ids=$("#"+id).jqGrid('getGridParam','selarrrow');
	var sendData={};

	if(ids!=null&&ids!=''){
		if(ids!=null&&ids.length>0){
			if(ids.length==1){
				var dto=$("#"+id).getRowData(ids);
				$.each(dto,function(i,o){
					sendData[i]=o;
				});
				sendData['sendLength']='1';
			}else if(ids.length>1){
				var dto=$("#"+id).getRowData(ids[0]);
				$.each(dto,function(i,o){
					var key=i;var ary_data=[];
					for(var j=0;j<ids.length;j++){
						var subdto= $("#"+id).getRowData(ids[j]);
						ary_data[j]=subdto[key];
					}
					sendData[key]=ary_data;
				});
				sendData['sendLength']=ids.length;
			}
		}
	}
	return sendData;
}

//저장시 에디트 로우를 모두 닫는다..
function closeAllEditRow(id){
	var rowCount=$("#"+id).getGridParam("reccount");
	for(var i=1;i<=rowCount;i++){
		$("#"+id).jqGrid('saveRow',i,false)
	}
	var ids=$("#"+id).jqGrid('getGridParam','selarrrow');
	if(ids!=null&&ids.length>0){
		for(var i=0;i<ids.length;i++){
			$("#"+id).jqGrid('saveRow',ids[i],false)
		}
	}
}
