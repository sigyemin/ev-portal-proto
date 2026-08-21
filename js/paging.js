function initPage(pageId, elementId, totalSize, currentPage, recordCountPerPage){

    // 한 페이지에 보여줄 페이지 수 (ex:1 2 3 4 5)
    var pageSize = 10;
    // 그리드 데이터 전체의 페이지 수
    var totalPage = Math.ceil(totalSize/recordCountPerPage);
    // 전체 페이지 수를 한화면에 보여줄 페이지로 나눈다.
    var totalPageList = Math.ceil(totalPage/pageSize);
    // 페이지 리스트가 몇번째 리스트인지

    var pageList=Math.ceil(currentPage/pageSize);

    // 페이지 리스트가 1보다 작으면 1로 초기화
    if(pageList<1) pageList=1;
    // 페이지 리스트가 총 페이지 리스트보다 커지면 총 페이지 리스트로 설정
    if(pageList>totalPageList) pageList = totalPageList;
    // 시작 페이지
    var startPageList=((pageList-1)*pageSize)+1;
    // 끝 페이지
    var endPageList=startPageList+pageSize-1;


    // 시작 페이지와 끝페이지가 1보다 작으면 1로 설정
    // 끝 페이지가 마지막 페이지보다 클 경우 마지막 페이지값으로 설정
    if(startPageList<1) startPageList=1;
    if(endPageList>totalPage) endPageList=totalPage;
    if(endPageList<1) endPageList=1;

    // 페이징 DIV에 넣어줄 태그 생성변수
    var pageInner='';
    //pageInner+='<ul>';

    // 페이지 리스트가 1이나 데이터가 없을 경우 (링크 빼고 흐린 이미지로 변경)
    if(currentPage<2){
		pageInner += '<a href="javascript:" class="first arrow">첫 페이지로</a>';
		pageInner += '<a href="javascript:" class="prev arrow">이전 페이지</a>';

    }
    // 이전 페이지 리스트가 있을 경우 (링크넣고 뚜렷한 이미지로 변경)
    if(currentPage>1){
		pageInner += '<a class="first arrow" href="javascript:prePage(&#39;'+pageId+'&#39;, &#39;'+elementId+'&#39;, '+(totalSize)+', '+(recordCountPerPage)+', '+(currentPage)+')">첫 페이지로</a>';
		pageInner += '<a class="prev arrow" href="javascript:goPage(&#39;'+pageId+'&#39;,  '+(recordCountPerPage)+', '+(currentPage-1)+')">이전 페이지</a>';
    }

    // 페이지 숫자를 찍으며 태그생성 (현재페이지는 강조태그)
    for(var i=startPageList; i<=endPageList; i++){
        if(i==currentPage){
            pageInner = pageInner + '<a href="#" class="current">' + (i) + '</a>';
        }else{
            pageInner = pageInner + '<a href="javascript:goPage(&#39;'+pageId+'&#39;, '+(recordCountPerPage)+', '+(i)+')" id="'+(i)+'">' + (i) + '</a>';
        }

    }
	if(totalPage>currentPage){
        pageInner += '<a href="javascript:goPage(&#39;'+pageId+'&#39;, '+(recordCountPerPage)+', '+(Number(currentPage)+1)+')" class="next arrow">다음 페이지</a>';
		pageInner += '<a href="javascript:nextPage(&#39;'+pageId+'&#39;, &#39;'+elementId+'&#39;, '+(totalSize)+', '+(Number(recordCountPerPage))+', '+(Number(currentPage) + 1)+')"; class="last arrow">마지막 페이지</a>';
	}else{
		pageInner += '<a href="#" class="next arrow">다음 페이지</a>';
		pageInner += '<a href="#" class="last arrow">마지막 페이지</a>';
	}
	//pageInner+="</ul>";

	$("#" + elementId).html("");
	$("#" + elementId).append(pageInner);
}


//그리드 앞페이지 이동
//currentPageNo : 현재 페이지 번호.
//recordCountPerPage : 한 페이지당 게시되는 게시물 건 수.
//pageSize : 페이지 리스트에 게시되는 페이지 건수.
//totalRecordCount : 전체 게시물 건 수.
function prePage(pageId, elementId, totalSize, recordCountPerPage, currentPage){
	var current_page = currentPage;
	var pageSize = 10;

	current_page-=pageSize;
	var pageList=Math.ceil(current_page/pageSize);
	current_page=(pageList-1)*pageSize+pageSize;

//	if(current_page == 0)
		current_page = 1;

	initPage(pageId,  elementId, totalSize, current_page, recordCountPerPage);

	$("#spageId").val(pageId);
	$("#srecordCountPerPage").val(recordCountPerPage);
	$("#spageNo").val(current_page);
	$("#spageSize").val(pageSize);
	_getListSearch();

}
//그리드 다음페이지 이동
//currentPageNo : 현재 페이지 번호.
//recordCountPerPage : 한 페이지당 게시되는 게시물 건 수.
//pageSize : 페이지 리스트에 게시되는 페이지 건수.
//totalRecordCount : 전체 게시물 건 수.
function nextPage(pageId, elementId, totalSize, recordCountPerPage, currentPage){

	var current_page = currentPage;
	var pageSize = 10;

	current_page+=pageSize;
	pageList=Math.ceil(current_page/pageSize);
	current_page=(pageList-1)*pageSize+1;
	var tPage = Math.ceil(totalSize/recordCountPerPage)
	//if (current_page > tPage)
		current_page = tPage;

	initPage(pageId,  elementId, totalSize, current_page, recordCountPerPage);
	$("#spageId").val(pageId);
	$("#srecordCountPerPage").val(recordCountPerPage);
	$("#spageNo").val(current_page);
	$("#spageSize").val(pageSize);
	_getListSearch();
}

// 그리드 페이지 이동
//               currentPageNo : 현재 페이지 번호.
//               recordCountPerPage : 한 페이지당 게시되는 게시물 건 수.
//               pageSize : 페이지 리스트에 게시되는 페이지 건수.
//               totalRecordCount : 전체 게시물 건 수.
function goPage(pageId, recordCountPerPage, currentPage ){
	var pageSize = 10;
	$("#spageId").val(pageId);
	$("#srecordCountPerPage").val(recordCountPerPage);
	$("#spageNo").val(currentPage);
	$("#sageSize").val(pageSize);
	_getListSearch();
}

$('#recordCountPerPage').on('change', function() {
	$("#spageNo").val("1");
	$("#srecordCountPerPage").val( this.value);
	_getListSearch();
});
