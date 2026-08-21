var _TREE_ID		= null;
var _PATH_DELETE	= "";
var _PATH_CREATE	= "";
var _PAHT_SORT		= "";
var _CHECK_BOX     = "";
var _CHECKED = "";
var _THEME = "classic";
var _CONTEXT_MENU = true;

function UtilTree(treeId, pathDelete, pathCreate, pathSort, context) {
	_TREE_ID		= treeId;
	_PATH_DELETE	= pathDelete;
	_PATH_CREATE	= pathCreate;
	_PAHT_SORT		= pathSort;
	_CONTEXT_MENU		= context == false ? "" : "contextmenu";
}

UtilTree.prototype.init = function(option) {
	$(function() {
		if(option != undefined) {
			_TREE_ID = option._TREE_ID == undefined || isEmpty(option._TREE_ID) ? _TREE_ID : option._TREE_ID;
			_THEME = option._THEME == undefined || isEmpty(option._THEME) ? _THEME : option._THEME;
			_CHECK_BOX = option._CHECK_BOX == undefined || isEmpty(option._CHECK_BOX) ? _CHECK_BOX : option._CHECK_BOX;
		}
		var objTree = document.getElementById(_TREE_ID);

		$(objTree).jstree({
			"themes" : {
				"theme": _THEME
				, "dots" : true
				, "icons": true
			}
			, "plugins": ["themes", "html_data",_CHECK_BOX]
		});
	});
};

function callbackCreateItem(result)
{

}
function callbackDragAndDrop(result)
{

}

function checkDelete()
{
	return true;
}

// 노드 생성 후 호출된다.
function createItem(data, rdata)
{
	//var result = eval('('+rdata+')');
	var result = rdata;
	// 새로 생성시에는 <a> 태그의 이벤트와 중복되게 click 이벤트가 타고 기존정보를 보여주게 되어있음.
	/*
	$(data.rslt.obj).click(function ()
	{
		callbackCreateItem(result, this);
	}).click();
	*/
	callbackCreateItem(result, $(data.rslt.obj));

	/*if(result.callBack != null && result.callBack != "") {
		window[result.callBack](result);
	}*/
	//alert("메뉴가 생성되었습니다.");
}
function createItemCnts(data, rdata)
{
	var result = ('+rdata+');
	$(data.rslt.obj).click(function ()
	{
		callbackCreateItem(result);
	}).click();
	alert("메뉴가 생성되었습니다.");
}
function dragAndDrop(pos, tid, oid)
{
	if (_PAHT_SORT == null && _PAHT_SORT == "")
		return;

	$.ajax
	({
        type: 'get',
        async: false,
        url: _PAHT_SORT,
        contentType: 'charset=utf-8',
        data: {"pos":pos, "tid":tid, "oid":oid},
        datatype: 'json',
        success: function(data)
        {
        	var rtn = ('+data+');
        	var result = rtn.completeYn;
        	if ("Y" == result)
        	{
        		alert("수정되었습니다.");
        		callbackDragAndDrop(result);
        	}
        	else
        	{
        		alert("수정에 실패하였습니다.");
        	}
		},
        error: function(data, status, err)
        {
        	alert("수정에 실패하였습니다.");
		}
	});
}

UtilTree.prototype.initDnd = function() {

	$(function() {

		var objTree = document.getElementById(_TREE_ID);

		$(objTree).jstree({
			"core" : { "initially_open" : [ "treeMainRoot" ], 'animation' : 1
				}
			, "themes" : {
				"theme": _THEME
					, "dots" : true
					, "icons": true
			}
			, "crrm" : {
				"move" : {
					"check_move" : function (m) {
						var p = this._get_parent(m.o);
						if (!p) {
							return false;
						}
						p = p == -1 ? this.get_container() : p;
						if(p === m.np) {
							return true;
						}
						if(p[0] && m.np[0] && p[0] === m.np[0]) {
							return true;
						}
						return false;
					}
				}
			}
			, "dnd" : {
				"drop_target" : false
				, "drag_target" : false
				, "drop_finish" : function (data) {
				}
			}
			, "plugins": ["themes", "html_data", "crrm", "dnd", _CONTEXT_MENU, _CHECK_BOX]
			})
			.bind('move_node.jstree', function(e, data) {
				var pos = data.rslt.p, tid = data.rslt.r[0].id.split('_').pop(), oid = data.rslt.o[0].id.split('_').pop();
				dragAndDrop(pos, tid, oid);
			})
			.bind("create.jstree", function (e, data) {
				if(data.rslt.name.indexOf('>') > 0) {
					alert("> 는 입력 불가합니다.");
					$.jstree.rollback(data.rlbk);
					return false;
				}

				$.post(
						_PATH_CREATE,
						{
							"operation" : "create_node",
							"parentNo" : data.rslt.parent.attr("id").replace("treeItem",""),
							"nodeNm" : data.rslt.name,
							"searchSiteGbCd" : $("#searchSiteGbCd").val(),
							"exprm": _PAHT_SORT
						},

						function (rdata) {
							//var r = eval('('+rdata+')');

							if(!isEmpty(rdata.vaildErrorMsg)) {
								if(!isEmpty(rdata.vaildErrorFileId)) {
				                    $("#"+rdata.vaildErrorFileId).focus();
				                }

								alert(rdata.vaildErrorMsg);
							}

							var r = rdata;
							if(!isEmpty(r.resultMsg)) {
								alert(r.resultMsg);
							}
							if(r.completeYn == "Y") {
								$(data.rslt.obj).attr("id", "treeItem" + r.id);
								createItem(data, rdata);
							} else {
								$.jstree.rollback(data.rlbk);
							}
						}
					);
				})
			.bind("remove.jstree", function (e, data) {
				if (confirm("삭제하시겠습니까?")) {
					if (checkDelete(data))
					{

						data.rslt.obj.each(function () {
							$.ajax({
								async : false,
								type: 'POST',
								url: _PATH_DELETE,
								data : {
									"operation" : "remove_node",
									"nodeNo" : this.id.replace("treeItem",""),
									"dnldClsNo" : this.id.replace("treeItem",""),
									"searchSiteGbCd" : $("#searchSiteGbCd").val(),
									"exprm": _PAHT_SORT
								},
								success : function (r) {
									if(!r.status) {
										if(!isEmpty(r.resultMsg)) {
											alert(r.resultMsg);
										}
										if(r.completeYn == 'Y'){
											//alert("삭제되었습니다.");
											callbackDeleteItem(data);
										} else {
											//alert("사용중.");
											$.jstree.rollback(data.rlbk);

										}
										if(r.callBack != null && r.callBack != "") {
											window[r.callBack](r);
										}
									}
								},
								error: function(data, textStatus, errorThrown) {
									alert("오류가 발생하였습니다.");
								}
							});
						});
					}
					else
					{
						$.jstree.rollback(data.rlbk);
					}
				} else {
					$.jstree.rollback(data.rlbk);
				}
			}).bind("loaded.jstree", function (e, data) {
				if(_CHECKED != ""){
					var result= _CHECKED.split(",");
					if(result.length > 0){
						for(i=0; i < result.length; i++){
							data.inst.check_node("#treeItem" + result[i], true);
						}
					}
				}

			}).bind("select_node.jstree", function (e, data) {
				alert('select!');
			})
			.delegate("a", "click", function (event, data) {

				var liName	= $(this).closest("li").attr("name");
				var liId	= $(this).closest("li").attr("id");
				$("li[name="+liName+"]").each(function(){
					if ( liId == this.id ) {
						$(this).children('a').css("background-color","#91D8FA");
					} else {
						$(this).children('a').css("background-color","");
					}
				});


				event.preventDefault();
			});
		});
	};
	UtilTree.prototype.initCnts = function() {

		$(function() {

			var objTree = document.getElementById(_TREE_ID);

			$(objTree).jstree({
				"core" : { "initially_open" : [ "treeMainRoot" ], 'animation' : 1
					}
				, "themes" : {
					"theme": _THEME
						, "dots" : true
						, "icons": true
				}
				, "crrm" : {
					"move" : {
						"check_move" : function (m) {
							var p = this._get_parent(m.o);
							if (!p) {
								return false;
							}
							p = p == -1 ? this.get_container() : p;
							if(p === m.np) {
								return true;
							}
							if(p[0] && m.np[0] && p[0] === m.np[0]) {
								return true;
							}
							return false;
						}
					}
				}
				, "dnd" : {
					"drop_target" : false
					, "drag_target" : false
					, "drop_finish" : function (data) {
					}
				}
				, "plugins": ["themes", "html_data", "crrm", "dnd", "contextmenu", _CHECK_BOX]
				})
				.bind('move_node.jstree', function(e, data) {
					var pos = data.rslt.p, tid = data.rslt.r[0].id.split('_').pop(), oid = data.rslt.o[0].id.split('_').pop();
					dragAndDrop(pos, tid, oid);
				})
				.bind("create.jstree", function (e, data) {
					$.post(
							_PATH_CREATE,
							{
								"operation" : "create_node",
								"hgrkTocId" : data.rslt.parent.attr("id").replace("treeItem",""),
								"tocNm" : data.rslt.name,
								"cntsNo" : jQuery("#cntsNo").val()
							},

							function (rdata) {
								var r = ('+rdata+');
								if(r.completeYn == "Y") {
									createItemCnts(data, rdata);
								}
								else {
									$.jstree.rollback(data.rlbk);
									alert("create ERROR");
								}
							}
						);
					})
				.bind("remove.jstree", function (e, data) {
					if (confirm("삭제하시겠습니까?")) {
						if (checkDelete())
						{
							data.rslt.obj.each(function () {
								$.ajax({
									async : false,
									type: 'POST',
									url: _PATH_DELETE,
									data : {
										"operation" : "remove_node",
										"nodeNo" : this.id.replace("treeItem",""),
										"tocId" : this.id.replace("treeItem","")
									},
									success : function (r) {
										if(!r.status) {
											alert("삭제되었습니다.");
											callbackDeleteItem(data);
										}
									},
									error: function(data, textStatus, errorThrown) {
										alert("오류가 발생하였습니다.");
									}
								});
							});
						}
						else
						{
							$.jstree.rollback(data.rlbk);
						}
					} else {
						$.jstree.rollback(data.rlbk);
					}
				}).bind("loaded.jstree", function (e, data) {
					if(_CHECKED != ""){
						var result= _CHECKED.split(",");
						if(result.length > 0){
							for(i=0; i < result.length; i++){
								data.inst.check_node("#treeItem" + result[i], true);
							}
						}
					}
				})

				.delegate("a", "click", function (event, data) { event.preventDefault(); });
			});
		};