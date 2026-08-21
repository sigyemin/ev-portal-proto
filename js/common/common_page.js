function fnPagination(id, pageIndex, pageSize, total, url, sPage){

	var frm = document.frm;	
   	
       $("#"+id).pagination({
           pageIndex: parseInt(pageIndex)-1,
           pageSize: pageSize,
           total: total,
           debug: true,
           showInfo: true,
           showJump: false,
           showPageSizes: sPage
       });

     $("#"+id).on("pageClicked", function (event, data) {
		
		$("#pageIndex").val(parseInt(data.pageIndex)+1);

		frm.target = "_self";
		frm.action = url;
		frm.submit();
		
     }).on('pageSizeChanged', function (event, data) {
		
		$("#pageIndex").val("1");
		$("#recordCountPerPage").val(data.pageSize);
		
		frm.target = "_self";
		frm.action = url;
		frm.submit();
     });
}
