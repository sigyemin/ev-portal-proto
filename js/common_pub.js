$(document).ready(function(){
    let observer = new IntersectionObserver ((e)=>{
        e.forEach((scrollDiv)=>{
            if (scrollDiv.isIntersecting){
                scrollDiv.target.style.opacity = 1;
                scrollDiv.target.style.transform = 'translateY(0px)';
            }
        })
    });

    let scrollUp = document.querySelectorAll('.js-scrollmotion_up');
    if(scrollUp.length > 0){
	   for(var i=0; i<scrollUp.length; i++){
			observer.observe(scrollUp[i]);
		}
	}

});
