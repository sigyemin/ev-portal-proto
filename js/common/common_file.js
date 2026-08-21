$(function(){
    // form
    $(document).on('click', '.form-file button', function(e){
        e.preventDefault();
        $(this).siblings('input[type="file"]').trigger('click');
    });

    /*
     * $(document).on('change', '.form-file input[type="file"]', function(e){
        e.preventDefault();
        if ( this.files[0] ) {
            var filename = this.files[0].name;
            // $(this).siblings('input[type="text"]').val(filename);
        }
    });
    */

});


$(function() {
	//파일업로드
	$.fn.fnFileUpload = function(option){
		var curUrl = document.location.href;

		var dafaultOption = {
				path : "SAMPLE.NOTICE",		//기본경로
				idx : "",					//fileupload index
				fileCo : 3,					//file upload count
				addSavePath : "",			//추가 저장 경로
				callbackFn : null,
				dragdrop : true
			};
		$.extend(dafaultOption, option);

		var dropZone = $(this);
		if(dafaultOption.dragdrop){
			var dropDefaultOption = {
					width : "700px",
					height : "160px"
			}

			$.extend(dropDefaultOption, dafaultOption);


			$(this).width(dropDefaultOption.width);
			$(this).height(dropDefaultOption.height);

			if(curUrl.indexOf("/user/") < 0) {
				$(this).css({
					"margin-top": "45px",
					"border": "1px dashed #ddd" ,
					"color" : "#7d7d7d"
				});
			}

			//Drag기능
			dropZone.on('dragenter', function(e) {
				e.stopPropagation();
				e.preventDefault();
				// 드롭다운 영역 css
				dropZone.css('background-color', '#E3F2FC');
			});
			dropZone.on('dragleave', function(e) {
				e.stopPropagation();
				e.preventDefault();
				// 드롭다운 영역 css
				dropZone.css('background-color', '#FFFFFF');
			});
			dropZone.on('dragover', function(e) {
				e.stopPropagation();
				e.preventDefault();
				// 드롭다운 영역 css
				dropZone.css('background-color', '#E3F2FC');
			});
			dropZone.on('drop', function(e) {
				e.preventDefault();
				// 드롭다운 영역 css
				dropZone.css('background-color', '#FFFFFF');
				var files = e.originalEvent.dataTransfer.files;
				if (files != null) {
					if (files.length < 1) {
						/* alert("폴더 업로드 불가"); */
						console.log("폴더 업로드 불가");
						return;
					}
				} else {
					alert("ERROR");
				}
			});
		}

		var uploadingUrl = "";
		if(curUrl.indexOf("/keco/") > -1) {
			uploadingUrl = _CTX_PATH + "/uploading";
		} else if(curUrl.indexOf("/app/") > -1) {
			uploadingUrl = _CTX_PATH + "/user_uploading";
		} else {
			uploadingUrl = _CTX_PATH + "/user_uploading";
		}

		var url = uploadingUrl + "?pathkey=" + dafaultOption.path + "&addSavePath=" + dafaultOption.addSavePath;
		var idx = dafaultOption.idx;
		var fileCo = dafaultOption.fileCo;
		var upCnt = 1;

		return this.each(function(i, obj) {
			if(idx === 0){
				idx = "";
			}

			var divAreaHtml = "";

	        if(curUrl.indexOf("/user/") < 0 && curUrl.indexOf("/app/") < 0) {
	        	divAreaHtml += " <input type=\"file\" class=\"form\" name=\"files"+idx+"\" id=\"fileupload"+idx+"\" data-url=\""+url+"\" multiple  width=\"100%\" /> ";
	        	if(dafaultOption.dragdrop){
	        		divAreaHtml += " <button type=\"button\" style=\"margin-top: -40px;\" class=\"btn btn-outline btn-bordered btn-style-c btn-sm\">찾아보기</button> ";
				}else{
					divAreaHtml += " <button type=\"button\" style=\"margin-top: 8px;\" class=\"btn btn-outline btn-bordered btn-style-c btn-sm\">찾아보기</button> ";
				}
	        }else{
				//사용자
	            divAreaHtml += "    <input type=\"file\" class=\"form\" name=\"files"+idx+"\" id=\"fileupload"+idx+"\" data-url=\""+url+"\" multiple  width=\"100%\" />\n";
	        }

	        $(this).addClass("form-file");
	        $(this).addClass("m-b-10");
	        $(this).append(divAreaHtml);

	        if(dafaultOption.dragdrop){
		        var divAreaDescHtml = "";
	        	divAreaDescHtml += "<div style=\"width: 100%; height: 20px; text-align: center; vertical-align : middle; \">";
		        divAreaDescHtml += "<span style=\"vertical-align : middle; \" >첨부파일을 마우스로 끌어 넣으세요.</span>";
		        divAreaDescHtml += "</div>";
		        if(curUrl.indexOf("/user/") < 0) {
		        	$(this).append(divAreaDescHtml);
		        }else{
		        	$("#uploaded-files"+idx).append(divAreaDescHtml);
		        }
	        }

	        var divAreaAttchHtml = "";
	        if(curUrl.indexOf("/user/") < 0) {
		        divAreaAttchHtml += " <div id=\"progress"+idx+"\" class=\"progress\"> ";
		        divAreaAttchHtml += " 	<div class=\"bar\" style=\"width: 0%;\"><span class=\"barTxt\">0%</span></div> ";
		        divAreaAttchHtml += " </div> ";
		        divAreaAttchHtml += " <ul id=\"uploaded-files"+idx+"\" class=\"dot-list\"> ";
		        divAreaAttchHtml += " </ul> ";
	        }

	        $(this).append(divAreaAttchHtml);

			$('#fileupload'+idx).fileupload({
		        dataType: 'json',
		        dropZone: dafaultOption.dragdrop?$(this):null,
		        done: function (e, data) {

		            $.each(data.result, function (index, file) {
		            	if(index === 0){
		            		index = "";
						}

		                if(file.errorMsg) {
		                	alert(decodeURI(decodeURIComponent(file.errorMsg)));
		                } else {
		                	//alert(idx+"/"+fileCo);
		    		    	if($('input[name="addFileList'+ idx +'"]').length+upCnt > fileCo) {
		    		    		alert(fileCo + "개 까지 업로드 할 수 있습니다.");
		    		    		return false;
		    		    	}

		    		    	if(file.realFileName.length > 255) {
		    		    		alert("실제 파일명이 너무 길어 업로드 할 수 없습니다. ");
		    		    		return false;
		    		    	}

		                    var fileHtml = "";
		                    if(curUrl.indexOf("/user/") < 0) {
			                    fileHtml += " <li name=\"fileGubun"+idx+"\"> ";
			                    fileHtml += "   <span class=\"m-r-10 font-dark-grey underline\"><a href='"+url+"&getfile="+file.fileName+"&realFileName="+encodeURI(encodeURIComponent(decodeURI(decodeURIComponent(file.realFileName))))+"' target=\"fileHiddenFrame\">"+decodeURI(decodeURIComponent(file.realFileName))+"</a><input type=\"hidden\" name=\"addFileList"+idx+"\" value=\""+ decodeURI(decodeURIComponent(file.fileInfo)) +"\" ></span>";
			                    fileHtml += "   <a href=\"#none\" class=\"btn-delete\" onclick=\"onFileDelede(this)\">&times;</a> ";
			                    fileHtml += " </li> ";
		                    }else{
//		                    	fileHtml += "<li>";
//		                    	fileHtml += "	<a href='"+url+"&getfile="+file.fileName+"&realFileName="+encodeURI(encodeURIComponent(decodeURI(decodeURIComponent(file.realFileName))))+"' target=\"fileHiddenFrame\">";
//		                    	fileHtml += "       <input type=\"hidden\" name=\"addFileList"+idx+"\" value=\""+ decodeURI(decodeURIComponent(file.fileInfo)) +"\" >";
//		                    	fileHtml += "		<span>"+decodeURI(decodeURIComponent(file.realFileName))+"</span>";
//		                    	fileHtml += "	</a>";
//		                    	fileHtml += "	<i class=\"delete sp-bg\" onclick=\"onFileDelede(this)\" >삭제</i>";
//		                    	fileHtml += "</li>";

		                    	fileHtml += "<tr>";
		                    	fileHtml += "	<td class=\"ta_left\"><a href='"+url+"&getfile="+file.fileName+"&realFileName="+encodeURI(encodeURIComponent(decodeURI(decodeURIComponent(file.realFileName))))+"' target=\"fileHiddenFrame\">";
		                    	fileHtml += "       <input type=\"hidden\" name=\"addFileList"+idx+"\" value=\""+ decodeURI(decodeURIComponent(file.fileInfo)) +"\" >";
		                    	fileHtml += "		<span>"+decodeURI(decodeURIComponent(file.realFileName))+"</span>";
		                    	fileHtml += "	</a> </td>";
		                    	fileHtml += "	<td><a href=\"#\" class=\"btn_sm btn_orange\" id=\"btn_del\" onclick=\"fn_fileDelete(this)\">삭제</a></td>";
		                    	fileHtml += "</tr>";
		                    }

		                    $("#uploaded-files"+idx).append(fileHtml);

		                    upCnt+1;
		                    if(dafaultOption.callbackFn != undefined && dafaultOption.callbackFn != ""){
		                    	dafaultOption.callbackFn(file);
			                }
		                }
		                $(".filename").text("");
		                $("#fileupload" + idx).val("");
		                $("#fileupload" + idx).attr("readonly", false);
		                $(".data-loading").hide();
		                $("#progress" + idx).hide();
		            });
		        },
		        progressall: function (e, data) {
		            var progress = parseInt(data.loaded / data.total * 100, 10);

		            $('#progress'+ idx +' .bar').css('width', progress + '%');
		            $('#progress'+ idx +' .bar .barTxt').text(progress + '%');
		            if(progress >= 100) {
		                $("#progress" + idx).hide();
		                $(".filename").text("");
		                $("#fileupload" + idx).val("");
		                $("#fileupload" + idx).attr("readonly", false);
		                $(".data-loading").hide();
		            }
		        },
		        error: function(request,status,error){
		            if($.browser.msie && $.browser.version <= 9){
		            } else {
		                alert(request.responseText);
		            }
		            return false;
		        }

		    }).bind('fileuploadsubmit', function (e, data) {
		    	//alert($('input[name="addFileList'+ idx +'"]').length);
		    	if($('input[name="addFileList'+ idx +'"]').length == fileCo) {
		    		//alert(idx+"////"+fileCo);
		    		alert(fileCo + "개 까지 업로드 할 수 있습니다.");
		    		return false;
		    	}

		        if($.browser.msie && $.browser.version <= 9){
		            $("#fileupload" + idx).attr("readonly", true);
		            $(".data-loading").show();
		        }
		        $('#progress'+ idx + ' .bar').css('width',0 + '%');
		        $('#progress' + idx + ' .bar .barTxt').text(0 + '%');
		        $("#progress" + idx).show();

		    }).error(function (jqXHR, textStatus, errorThrown) {alert(jqXHR + "   textStatus"+ textStatus +"    errorThrown" + errorThrown);})
		    ;
		});
	};

});


//파일다운로드
function fnFileDown(path, idx, obj, addSavePath) {
	if(idx === 0){
		idx = "";
	}

	//console.log(obj);
	if(typeof obj === "string" && obj.length > 0) {
		var fileHtml = "";
        $(this).addClass("attachments");

        var fileObj = obj.replaceAll("&#034;", '"').toString();
		var curUrl = document.location.href;
		var uploadingUrl = "";
		if(curUrl.indexOf("/keco/") > -1) {
			uploadingUrl = _CTX_PATH + "/uploading";
//			fileHtml += " <h4 class=\"bold m-b-10\">첨부파일 다운로드</h4> ";
	        fileHtml += " <ul class=\"dot-list\"> ";
		} else if(curUrl.indexOf("/app/") > -1) {
//			fileHtml += " <strong>첨부파일 다운로드</strong> ";
			uploadingUrl = _CTX_PATH + "/user_uploading";
		} else {
			uploadingUrl = _CTX_PATH + "/user_uploading";
//			fileHtml += " <strong>첨부파일 다운로드</strong> ";
			fileHtml += " <ul> ";
		}
		//console.log('fileHtml:'+fileHtml);
		var url = uploadingUrl + "?pathkey=" + path;

		if(addSavePath != undefined && addSavePath != "") {
			url += "&addSavePath=" + addSavePath;
		}
		var jsonFileArray = JSON.parse(fileObj);

		var fileYn = "N";
		$.each(jsonFileArray, function(i, jsonObj) {
			if(jsonObj.atchmnflNm != undefined && jsonObj.atchmnflStreNm != undefined && jsonObj.atchmnflMg != undefined) {
				var fileName = jsonObj.atchmnflNm;
				var realFileName= jsonObj.atchmnflStreNm;
				var fileSize= jsonObj.atchmnflMg;

				var fileInfo = fileName+"|"+realFileName+"| |"+ fileSize;

				fileHtml += "<li><a href=\""+url+"&getfile="+realFileName+"&realFileName="+encodeURI(encodeURIComponent(fileName))+"\" target=\"fileHiddenFrame\" class=\"font-dark-grey underline\">"+decodeURI(decodeURIComponent(fileName))+"</a><input type=\"hidden\" name=\"addFileList"+idx+"\" value=\""+ decodeURI(decodeURIComponent(fileInfo)) +"\" ></li>";

				fileYn = "Y";
			}
		});

        fileHtml += " </ul> ";
        //console.log('idx'+idx);
        //console.log('fileHtml:'+fileHtml);

        if(curUrl.indexOf("/keco/") > -1) {
        	//console.log('keco:' + $("#apndFile"+idx).html());
    		if(fileYn == "Y") {
    			$("#apndFile"+idx).html(fileHtml);
    		}
    		//console.log('keco:' + $("#apndFile"+idx).html());
		} else if(curUrl.indexOf("/app/") > -1) {
			if(fileYn == "Y") {
				$("#uploaded-files"+idx).addClass("file-list").html(fileHtml);
			}
		} else if(curUrl.indexOf("/user/") > -1) {
			//console.log('user:' + $("#uploaded-files"+idx).html());
			if(fileYn == "Y") {
				$("#uploaded-files"+idx).addClass("file-list").html(fileHtml);
			}
			//console.log('user:' + $("#uploaded-files"+idx).html());
		}



	}

}

//파일수정
function fnFileEdit(path, idx, obj, addSavePath){
	if(idx === 0){
		idx = "";
	}
	if(typeof obj === "string" && obj.length > 0) {
		var fileObj = obj.replaceAll("&#034;", '"').toString();

		var curUrl = document.location.href;
		var uploadingUrl = "";
		if(curUrl.indexOf("/keco/") > -1) {
			uploadingUrl = _CTX_PATH + "/uploading";
		} else if(curUrl.indexOf("/app/") > -1) {
			uploadingUrl = _CTX_PATH + "/user_uploading";
		} else {
			uploadingUrl = _CTX_PATH + "/user_uploading";
		}

		var url = uploadingUrl + "?pathkey=" + path;
		if(addSavePath != undefined && addSavePath != "") {
			url += "&addSavePath=" + addSavePath;
		}
		var jsonFileArray = JSON.parse(fileObj);

		$.each(jsonFileArray, function(i, jsonObj) {
			if(jsonObj.atchmnflNm != undefined && jsonObj.atchmnflStreNm != undefined && jsonObj.atchmnflMg != undefined) {
				var fileHtml = "";
				var fileName = jsonObj.atchmnflNm;
				var realFileName= jsonObj.atchmnflStreNm;
				var fileSize= jsonObj.atchmnflMg;

				var fileInfo = fileName+"|"+realFileName+"| |"+ fileSize;

				if(fileHtml != "") {
					fileHtml += "	<br />";
				}

                if(curUrl.indexOf("/user/") < 0) {
                    fileHtml += " <li name=\"fileGubun"+idx+"\"> ";
                    fileHtml += "   <span class=\"m-r-10 font-dark-grey underline\"><a href=\""+url+"&getfile="+realFileName+"&realFileName="+encodeURI(encodeURIComponent(fileName))+"\" target=\"fileHiddenFrame\">"+decodeURI(decodeURIComponent(fileName))+"</a><input type=\"hidden\" name=\"addFileList"+idx+"\" value=\""+ decodeURI(decodeURIComponent(fileInfo)) +"\" ></span>";
                    fileHtml += "   <a href=\"#none\" class=\"btn-delete\" onclick=\"onFileDelede(this)\">&times;</a> ";
                    fileHtml += " </li> ";
                }else{
//                	fileHtml += "<li>";
//                	fileHtml += "	<a href='"+url+"&getfile="+realFileName+"&realFileName="+encodeURI(encodeURIComponent(fileName))+"' target=\"fileHiddenFrame\">";
//                	fileHtml += "       <input type=\"hidden\" name=\"addFileList"+idx+"\" value=\""+ decodeURI(decodeURIComponent(fileInfo)) +"\" >";
//                	fileHtml += "		<span>"+decodeURI(decodeURIComponent(fileName))+"</span>";
//                	fileHtml += "		<i class=\"delete sp-bg\">삭제</i>";
//                	fileHtml += "	</a>";
//                	fileHtml += "</li>";

                	fileHtml += "<tr>";
                	fileHtml += "	<td class=\"ta_left\"><a href='"+url+"&getfile="+realFileName+"&realFileName="+encodeURI(encodeURIComponent(decodeURI(decodeURIComponent(fileName))))+"' target=\"fileHiddenFrame\">";
                	fileHtml += "       <input type=\"hidden\" name=\"addFileList"+idx+"\" value=\""+ decodeURI(decodeURIComponent(fileInfo)) +"\" >";
                	fileHtml += "		<span>"+decodeURI(decodeURIComponent(fileName))+"</span>";
                	fileHtml += "	</a> </td>";
                	fileHtml += "	<td><a href=\"#\" class=\"btn_sm btn_orange\" id=\"btn_del\" onclick=\"fn_fileDelete(this)\">삭제</a></td>";
                	fileHtml += "</tr>";
                }
				
				$("#uploaded-files"+idx).append(fileHtml);

				var fileYn = "Y";
			}
		});

	}
}

//삭제
function onFileDelede(obj) {
	$(obj).parent().remove();
}

//사용자_목표설정파일 삭제
function fn_fileDelete(obj) {
	$(obj).parent().parent().remove();
}

function fnFileListReset(idx){
	if(!idx){
		idx = "";
	}
	$("#uploaded-files"+idx+">li").remove();
}

