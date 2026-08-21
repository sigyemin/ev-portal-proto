$(document).ready(function () {

  // LEFT MENU
  $('.sub-menu').hide();
  $('.leftMenu > a > .menu-title-bar').click(function () {
    // if($(this).parent().next().length > 0) {
    if ($(this).hasClass('active')) {
      $(this).parent().next().slideUp('slow');
      $(this).removeClass('active');
    } else {
      $('.main-menu').find('.active').parent().next().slideUp('slow');
      $('.main-menu').find('.active').removeClass('active');
      $(this).parent().next().slideDown('slow');
      $(this).addClass('active');
    }

  });


  // header lnb
  $('.lnb').on('click', function () {
    $('.lnb').toggleClass('open');
    $('.lnb ul').toggleClass('open');
    parent.parent.$('#topFrame').css('height', '300');
  });


  // TOP MENU
  $(".menu-box").mouseover(function(){

    $(this).addClass('active');
    $('.gnb-wrap').addClass('on');

    var setHeight = 0;
    var setHeight2 = 0;
   $('.gnb-wrap').each(function (index, item) {
       if(setHeight < $(item).height() + 94 + 51) setHeight = $(item).height() + 94 + 51;
       if(setHeight2 < $(item).height()) setHeight2 = $(item).height();
   });

   $('.gnb-wrap').height(setHeight2);

    $('.top-title').stop().animate({height: setHeight + 'px'});
  });




  // var setHeight = '530px';
  // $('.top-title').stop().animate({height: setHeight});
  //   $(this).addClass('active');
  //   $('.gnb-wrap').addClass('on');



  $(".menu-box").mouseout(function(){
    $(this).removeClass('active');
    $('.gnb-wrap').removeClass('on');
    $('.top-title').stop().animate({height:'94px'});
  });


  // datepicker
  $(".datepicker").datepicker({
    changeYear: true,
    changeMonth: true,
    showMonthAfterYear: true,
    yearRange: "c-100:c+10"
  });
  // $(".datepicker").datepicker().datepicker('setDate', new Date());

  // select
  //$( ".myselector" ).selectmenu();


  // tabs
  $('.tabs span').click(function(){
    $(this).addClass('active');
    $(this).siblings().removeClass('active');
  });


  // download layer
  $('.down-layer > button').click(function(){
    $(this).siblings().show();
  });


  
  // $('html').click(function(e) {   
  //   if(!$(e.target).hasClass("span")) {
  //     alert('영역 밖입니다.');
  //   }
  // });  


  // dialog
  $('.dialog').dialog({
    autoOpen: false,
    modal: true,
    width: '318',
    height: '237',
    resizeable : false,
    draggable: false
  });
  $(".dialog .closebtn").click(function(){
    $( ".dialog" ).dialog( "close" );
  });
  $(".popupbtn1").click(function(){
    $( ".dialog.time" ).dialog( "open" );
  });
  $(".popupbtn2").click(function(){
    $( ".dialog.logout" ).dialog( "open" );
  });



  // top&bottom go button
  $('.goTop').on('click', function(e){
    $("html, body").animate({ scrollTop : 0 }, "400") ;
    return false;
  });
  $('.goBottom').on('click', function(e){
    $("html, body").animate({scrollTop : $(document).height() }, "400");
    return false;
  })




});


/* 금액에 콤마넣기 */
function inputNumberFormat(obj) {
  obj.value = comma(uncomma(obj.value));
}
function comma(str) {
  str = String(str);
  return str.replace(/(\d)(?=(?:\d{3})+(?!\d))/g, '$1,');
}
function uncomma(str) {
  str = String(str);
  return str.replace(/[^\d]+/g, '');
}