$(document).ready(function() {
	
	$("#loading_img").hide();
	$(".intCheck").css('imeMode','disabled').keypress(function(event) {
	       if(event.which && (event.which < 48 || event.which > 57) ) {
	           event.preventDefault();
	       }
	    }).keyup(function(){
	        if( $(this).val() != null && $(this).val() != '' ) {
	            $(this).val( $(this).val().replace(/[^0-9]/g, '') );
	        }
	    });
	
	$(".timeCheck").keyup(function(){
		var time = this.value;
		if(time.length == 4){
			var t1 = time.substr(0,2);
			var t2 = time.substr(2,2);
			if(t1 > 23){
				alert("잘못된 시간입니다 \n다시입력하세요");
				this.value = "";
				this.focus();
				return;
			}
			if(t2 > 59){
				alert("잘못된 시간입니다 \n다시입력하세요");
				this.value = "";
				this.focus();
				return;
			}
			time = 	time.substr(0,2)+":"+time.substr(2,2);
			this.value = time;
		}
	    
	});
	
	var clText={
			Zoom:function(param1){
				var obj=window.document.body;
				var obj_zoom=obj.style.zoom;
				var zoom=(obj_zoom==0||clBl.Blank(obj_zoom))?1.1:obj_zoom;
				switch(param1){
					case 'up':
						zoom*=1.1;
						break;
					case 'down':
						zoom/=1.1;
						break;
					default:
						zoom=1;
						break;
				};
				if(zoom>1.7){
					alert('더이상 확대 할 수 없습니다.');
				} else if(zoom<0.8){
					alert('더이상 축소 할 수 없습니다.');
				} else{
					obj.style.zoom=zoom;
				};
				return false;
			}
		};
	
	var clBl={
			Blank:function(p1){var str=p1+'';str=str.replace(/^\s+/,'');str=str.replace(/\s+$/g,'');str=str.replace(/\n/g,'');str=str.replace(/\r/g,'');return (str=='null'||str==null||str=='undefined')?true:false;}
		};
	
});



//<input type="text" vcheck="int" />