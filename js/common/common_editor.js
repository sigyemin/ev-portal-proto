function fnCreateEditor(targetId, options){
	var $this = $('#'+targetId);
	fnCreateEditorByObject($this, options);
}


function fnCreateEditorByObject($this, options){
	var option = {
	    	disableDragAndDrop: true,
			height: 300,                 // set editor height
			minHeight: null,             // set minimum height of editor
			maxHeight: null,             // set maximum height of editor
			focus: false,                // set focus to editable area after initializing summernote
			toolbar: [
			    ['style', ['bold', 'italic', 'underline', 'clear']],
			    ['font', ['strikethrough', 'superscript', 'subscript']],
			    ['fontsize', ['fontsize']],
			    ['color', ['color']],
			    ['para', ['ul', 'ol', 'paragraph']],
			    ['height', ['height']],
			    ['table', ['table']],
			    ['insert',['picture','math']]
			],
			callbacks: {
				onImageUpload: function(files) {
					//upload image to server and create imgNode...
					$this.summernote("focus");
					var curUrl = document.location.href;
					var uploadingUrl = "";
					if(curUrl.indexOf("/keco/") > -1) {
						uploadingUrl = _CTX_PATH + "/uploading";
					} else if(curUrl.indexOf("/app/") > -1) { 
						uploadingUrl = _CTX_PATH + "/user_uploading";
					} else {
						uploadingUrl = _CTX_PATH + "/user_uploading";
					}
					
					var url = uploadingUrl + "?pathkey=MASTER.BOARD";
					
					var formData = new FormData();
					if(files){
						for(var i=0; i<files.length; i++){
							formData.append("files", files[i]);
						}
					}
					$.ajax({
	                    url: url,
                        processData: false,
                        contentType: false,
                        data: formData,
                        type: 'POST',
                        success: function(result){
                        	if(result){
                        		var data = JSON.parse(result);
                        		for(var i=0; i<data.length; i++){
                        			var fileName = data[i].fileName;
                        			var realFileName = encodeURI(encodeURIComponent(decodeURI(decodeURIComponent(data[i].realFileName))));
                        			$this.summernote('insertImage', "/repository/uploadfiles/master/board/"+fileName, realFileName);
                        		} 
                        	}
                        	$(".note-image-input").val(""); 
                        }
					});
				}
			}
		};
	if(options){
		$.extend(option, options);
	}
	
//	$this.summernote(option);
};