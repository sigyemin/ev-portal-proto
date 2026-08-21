/*
 * 전기차 보조금 계산기 — 계산·데이터 호출 로직. 설정값(URL/carType)은 JSP 의 SUBSI_CALC_CONFIG 로 주입받는다.
 * 지자체 옵션·단가 조회와 계산은 [계산하기](doCalc) 클릭 시에만 수행한다(콤보 채움은 change 이벤트).
 */
var LOCAL_OPTION = null;

// 공통 알럿(레이아웃 제공) 사용, 없으면 브라우저 기본 alert
function notify(msg){ (window.showAlert || window.alert)(msg); }
// 천단위 콤마
function setComma(num){ if(num==null||num===''||isNaN(num)) return '0'; return Math.round(Number(num)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
// 셀러 전용(미사용) no-op 스텁
function setPriority(gubun, old_priority_type){}
function changeHan(){}
// 외부 공통헬퍼 미존재 대비 no-op (있으면 덮어쓰지 않도록 typeof 체크)
if(typeof addDatePicker==='undefined'){ window.addDatePicker=function(){}; }
if(typeof addDatePickerBirth==='undefined'){ window.addDatePickerBirth=function(){}; }

// 결과 렌더 (국고/지방/추가지원 3분할 표시)
function renderResult(){
	var g = Number($('#req_gamt').val()||0);
	var l = Number($('#req_lamt').val()||0);
	var add = Number($('#req_add_gamt').val()||0)+Number($('#req_chng_add_gamt').val()||0)+Number($('#req_add_lamt').val()||0)+Number($('#req_chng_add_lamt').val()||0);
	$('#out_gamt').text(setComma(g)); $('#out_lamt').text(setComma(l)); $('#out_add').text(setComma(add)); $('#out_total').text(setComma(g+l+add));
	$('#out_ext_note').hide();
	$('#calcResult').show(); $('#calcGuide').hide();
}

// 시·도 콤보 (포털 엔드포인트)
function loadSido(){
	$.ajax({ url:SUBSI_CALC_CONFIG.urls.localDoCd, type:'GET', dataType:'json', success:function(d){
		var $s=$('#localDo_cd').empty().append('<option value="">시·도 선택</option>');
		$.each(d.list||[],function(i,r){ $s.append('<option value="'+r.LOCAL_CD+'">'+r.LOCAL_NM+'</option>'); });
	}});
}
// 시·군·구 콤보 (포털 엔드포인트)
function loadSigungu(){
	var doCd=$('#localDo_cd').val();
	$('#local_cd1').empty().append('<option value="">시·군·구 선택</option>');
	$('#maker_cd').empty().append('<option value="">선택</option>');
	$('#model_cd').empty().append('<option value="">선택</option>');
	if(!doCd) return;
	$.ajax({ url:SUBSI_CALC_CONFIG.urls.localCd, type:'GET', dataType:'json', data:{localDo_cd:doCd}, success:function(d){
		var $s=$('#local_cd1'); $.each(d.list||[],function(i,r){ $s.append('<option value="'+r.LOCAL_CD+'">'+r.LOCAL_NM+'</option>'); });
	}});
}
// 차종 탭
// 입력이 바뀌면 이전 계산 결과를 무효화 — 재계산 전 [시나리오 담기] 방지(값 불일치 방지)
function invalidateCalcResult(){
	$('#calcResult').hide(); $('#calcGuide').show();
	$('#out_ext_note').hide();
}

function changeCarType(ct){
	$('#car_type').val(ct);
	$('.car-tab').removeClass('active'); $('#tab_'+ct).addClass('active');
	invalidateCalcResult();
	applyCondVisibility();
	if($('#local_cd1').val()){ loadMaker(); }
}

// === 차종별 사용하지 않는 추가지원조건 항목 숨김 (data-cartype 미포함 시 숨김 + 기본값 초기화) ===
// 매트릭스(코드 분석 기반): 승용11=전체, 화물12=차상위/사회계층/내연기관폐차/전환지원금,
//                          승합13=사회계층, 건설기계21=사회계층/내연기관폐차.
//                          숨긴 항목은 계산에 미반영되는 항목이라 결과 영향 없음.
function applyCondVisibility(){
	var ct = $('#car_type').val();
	var rk = $('#req_kind').val();
	var yr = Number($('#s_year').val() || 0);
	$('.calc-cond[data-cartype]').each(function(){
		var $row = $(this);
		var types = ('' + $row.attr('data-cartype')).split(/[ ,]+/);
		var kinds = $row.attr('data-reqkind');
		var minYear = Number($row.attr('data-minyear') || 0);
		var match = types.indexOf(ct) >= 0
			&& (!kinds || ('' + kinds).split(/[ ,]+/).indexOf('' + rk) >= 0)
			&& (!minYear || yr >= minYear);
		if(match){
			$row.show();
		}else{
			$row.hide();
			// 숨긴 조건은 기본값(미해당/아니오)으로 초기화하여 계산에 영향 없도록 함
			$row.find('input[type="radio"][value="N"]').prop('checked', true);
			$row.find('input[type="radio"][value="Y"]').prop('checked', false);
			$row.find('select').prop('selectedIndex', 0);
			$row.find('input[type="date"]').val('');
			$row.find('input[type="number"]').val('0');
			$row.find('.datepicker-input').val('');
		}
	});
	syncMotorDlvrUI();
	syncSocialUI();
	syncTaxiUI();
	syncFirstBuyUI();
	syncExchange3yearUI();
	syncCondRows();
}

// 전환지원금 '예' 일 때만 대수 입력 노출 (해당없음이면 0으로 초기화)
function syncExchange3yearUI(){
	var isExch = $(':radio[name="exchange_3year_yn"]:checked').val() === 'Y';
	var $cnt = $('#exchange_3year_cnt');
	if(isExch){ $cnt.show(); }
	else{ $cnt.hide(); $cnt.val('0'); }
}

// 생애최초 '예' 일 때만 생년월일 입력 노출 (아니오면 입력값 초기화)
function syncFirstBuyUI(){
	var isFirstBuy = $(':radio[name="first_buy_yn"]:checked').val() === 'Y';
	var $picker = $('#birth1').closest('.datepicker');
	if(isFirstBuy){
		$picker.show();
	}else{
		$picker.hide();
		$('#birth1').val('');
	}
}

// 2열 배치 행(form__item)에서 노출 항목이 하나도 없으면 행 자체를 숨김 (빈 행 여백 제거)
// 자식 :visible 은 부모가 숨겨져 있으면 항상 false 이므로 행을 먼저 펼친 뒤 판정한다.
function syncCondRows(){
	$('.calculator-form .form__item').each(function(){
		var $row = $(this);
		var $conds = $row.find('.calc-cond');
		if($conds.length === 0) return;
		$row.show();
		$row.toggle($conds.filter(':visible').length > 0);
	});
}

// === 제조사 콤보 목록만 채움 (local_cd1 change 시) - 금액/옵션 반영은 하지 않음 ===
function loadMaker(){
	var year = $("#s_year").val();
	var car_type = $("#car_type").val();
	var local_cd1 = $("#local_cd1").val();
	$('#local_cd').val(local_cd1);
	$('#maker_cd').empty().append('<option value="">선택</option>');
	$('#model_cd').empty().append('<option value="">선택</option>');
	if(car_type=='' || local_cd1=='' || local_cd1==null) return;
	if(isH2()){ loadH2Maker(year, local_cd1); return; }
	if(isMotor()){ loadMotorMaker(year, local_cd1); return; }
	$.ajax({
		type: "POST",
		url: SUBSI_CALC_CONFIG.urls.localOption,
		dataType: 'json',
		data: { 'year' : year , 'car_type' : car_type, 'local_cd' : local_cd1},
		success: function(data){
			var resultMaker = data.makerList ? data.makerList : null;
			$('#maker_cd').empty().append('<option value="">선택</option>');
			if(resultMaker != null){
				for (var i = 0; i < resultMaker.length; i++) {
					var item = resultMaker[i];
					$("#maker_cd").append('<option value="' + item.MAKER_CD + '">' + item.MAKER_NM + '</option>');
				}
			}
			loadModel();
		}
	});
}

// === 수소차(H2) 전용: 차종 H2일 때만 동작 ===
function isH2(){ return $('#car_type').val() === 'H2'; }

function loadH2Maker(year, localCd){
	$.ajax({ type:'POST', url: SUBSI_CALC_CONFIG.urls.h2MakerCombo, dataType:'json',
		data:{ year:year, local_cd:localCd },
		success:function(data){
			var list = data.makerList || [];
			$('#maker_cd').empty().append('<option value="">선택</option>');
			for(var i=0;i<list.length;i++){ $('#maker_cd').append('<option value="'+list[i].MAKER_CD+'">'+list[i].MAKER_NM+'</option>'); }
			loadModel();
		}
	});
}

function loadH2Model(year, localCd, makerCd){
	$.ajax({ type:'POST', url: SUBSI_CALC_CONFIG.urls.h2ModelCombo, dataType:'json',
		data:{ year:year, local_cd:localCd, maker_cd:makerCd },
		success:function(data){
			var list = data.modelList || [];
			$('#model_cd').empty().append('<option value="">선택</option>');
			for(var i=0;i<list.length;i++){ $('#model_cd').append('<option value="'+list[i].MODEL_CD+'">'+list[i].MODEL_NM+'</option>'); }
		}
	});
}

function renderH2Result(r){
	if(!r){ alert('해당 차종/지자체의 단가 정보가 없습니다.'); return; }
	$('#out_gamt').text(setComma(r.reqGamt));
	$('#out_lamt').text(setComma(r.reqLamt));
	$('#out_add').text(setComma(r.reqAddLamt));
	$('#out_total').text(setComma(r.reqTotalAmt));
	if(Number(r.extReqAddLamt) > 0){
		$('#out_ext_note').text('※ 추가 지방비(별도지급) ' + setComma(r.extReqAddLamt) + '원은 신청 총액에 포함되지 않습니다.').show();
	}else{
		$('#out_ext_note').hide();
	}
	$('#calcResult').show(); $('#calcGuide').hide();
}

// 계산 전 필수값 검증 — 통과하지 못하면 이용 안내 알럿도 띄우지 않는다
function validateCalc(){
	if(!$('#local_cd1').val()){ alert('지자체(시·군·구)를 선택하세요.'); return false; }
	if(!$('#model_cd').val()){ alert('신청 차종(모델)을 선택하세요.'); return false; }
	return true;
}

// 검증 통과 후에만 이용 안내 알럿을 띄우고, 확인을 누르면 계산한다
function requestCalc(){
	if(!validateCalc()) return;
	if(typeof window.showCalcNotice === 'function'){ window.showCalcNotice(doCalc); return; }
	doCalc();
}

function doH2Calc(){
	if(!validateCalc()) return;
	$.ajax({ type:'POST', url:SUBSI_CALC_CONFIG.urls.calc, dataType:'json',
		data: collectCalcParams(),
		success:function(res){
			if(res.CNT != 1){ alert('해당 차종/지자체의 단가 정보가 없습니다.'); return; }
			renderH2Result(res);
		},
		error:function(){ alert('계산 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.'); }
	});
}

var MOTOR_CAPS = { MOTORLGT:1400000, MOTORSML:2300000, MOTORMID:2700000, MOTORBIG:3000000, MOTORETC:2700000, MOTORLGTS:980000, MOTORSMLS:1600000 };
// 선택 지자체·연도에 전기이륜차 옵션(PS_OPTION_MOTOR) 데이터가 없으면 true → 단가기반 추가지원 0 안내용
var MOTOR_OPT_EMPTY = false;

function isMotor(){ return $('#car_type').val() === 'MOTOR'; }

// === 전기이륜차 배달 관련 조건부 노출 (미세먼지=예 → 배달용, 배달용 → 신규 배달) ===
function syncMotorDlvrUI(){
	var fdY = $(':radio[name="improve_fd_yn"]:checked').val() === 'Y';
	if(fdY){
		$('#wrap_improve_fd_detail2').show();
	}else{
		$('#wrap_improve_fd_detail2').hide();
		$('#improve_fd_detail2').prop('checked', false);
	}
	if(fdY && $('#improve_fd_detail2').is(':checked')){
		$('#row_new_dlvr').show();
	}else{
		$('#row_new_dlvr').hide();
		$('#new_dlvr_yn2').prop('checked', true);
		$(':radio[name="new_dlvr_yn"][value="Y"]').prop('checked', false);
	}
	syncCondRows();
}

// 다자녀가구(코드 3) 선택 시에만 자녀수 노출
function syncSocialUI(){
	if($('#social_kind').val() === '3'){
		$('#children_cnt').show();
	}else{
		$('#children_cnt').hide();
		$('#children_cnt').prop('selectedIndex', 0);
	}
}

// === 택시법인 중소기업: 전기승용(11)에서 택시=예일 때만 노출, 수소 등 그 외엔 숨김+초기화 ===
// 택시법인 중소기업은 법인·단체 대상 — 개인(P)·개인사업자(B)는 택시 '예' 여도 노출하지 않는다
var TAXI_BUSI_REQ_KIND = ['G', 'L', 'S'];

function syncTaxiUI(){
	var ct = $('#car_type').val();
	var taxiY = $(':radio[name="taxi_yn"]:checked').val() === 'Y';
	if(ct === '11' && taxiY && TAXI_BUSI_REQ_KIND.indexOf($('#req_kind').val()) >= 0){
		$('#wrap_taxi_busi').show();
	}else{
		$('#wrap_taxi_busi').hide();
		$(':radio[name="taxi_busi_yn"][value="Y"]').prop('checked', false);
		$(':radio[name="taxi_busi_yn"][value="N"]').prop('checked', true);
	}
}

function loadMotorMaker(year, localCd){
	$.ajax({ type:'POST', url: SUBSI_CALC_CONFIG.urls.motorMakerCombo, dataType:'json',
		data:{ year:year, local_cd:localCd },
		success:function(data){
			var list = data.makerList || [];
			$('#maker_cd').empty().append('<option value="">선택</option>');
			for(var i=0;i<list.length;i++){ $('#maker_cd').append('<option value="'+list[i].MAKER_CD+'">'+list[i].MAKER_NM+'</option>'); }
			loadModel();
		}
	});
}

function loadMotorModel(year, localCd, makerCd){
	$.ajax({ type:'POST', url: SUBSI_CALC_CONFIG.urls.motorModelCombo, dataType:'json',
		data:{ year:year, local_cd:localCd, maker_cd:makerCd },
		success:function(data){
			var list = data.modelList || [];
			$('#model_cd').empty().append('<option value="">선택</option>');
			for(var i=0;i<list.length;i++){ $('#model_cd').append('<option value="'+list[i].MODEL_CD+'">'+list[i].MODEL_NM+'</option>'); }
		}
	});
}

function renderMotorResult(r){
	if(!r){ alert('해당 차종/지자체의 단가 정보가 없습니다.'); return; }
	$('#out_gamt').text(setComma(r.reqGamt));
	$('#out_lamt').text(setComma(r.reqLamt));
	$('#out_add').text(setComma(Number(r.reqAddGamt) + Number(r.reqAddLamt)));
	$('#out_total').text(setComma(r.reqTotalAmt));
	var notes = [];
	var dlvr = Number(r.dlvrAddGamt) + Number(r.dlvrAddLamt);
	if(dlvr > 0){
		notes.push('※ 배달 사용 목적 별도지급(국비 ' + setComma(r.dlvrAddGamt) + '원 + 지방비 ' + setComma(r.dlvrAddLamt) + '원)은 신청 총액에 포함되지 않습니다.');
	}
	if(MOTOR_OPT_EMPTY){
		notes.push('※ 해당 지자체·연도의 전기이륜차 추가지원 단가 정보가 등록되지 않아 사회계층·폐차교체 등 단가 기반 추가지원금은 반영되지 않았습니다. (기본 국비·지방비 및 취약계층·배달 가산은 정상 반영)');
	}
	if(notes.length){
		$('#out_ext_note').html(notes.join('<br>')).show();
	}else{
		$('#out_ext_note').hide();
	}
	$('#calcResult').show(); $('#calcGuide').hide();
}

function doMotorCalc(){
	if(!validateCalc()) return;
	$.ajax({ type:'POST', url:SUBSI_CALC_CONFIG.urls.calc, dataType:'json',
		data: collectCalcParams(),
		success:function(res){
			if(res.CNT != 1){ alert('해당 차종/지자체의 단가 정보가 없습니다.'); return; }
			MOTOR_OPT_EMPTY = !!res.motorOptEmpty;
			renderMotorResult(res);
		},
		error:function(){ alert('계산 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.'); }
	});
}

// === 폼 입력값 수집 → 서버 calc.ajax 파라미터 (EV/H2/MOTOR 공용) ===
function collectCalcParams(){
	return {
		car_type: $('#car_type').val(),
		localDo_cd: $('#localDo_cd').val(),
		local_cd1: $('#local_cd1').val(),
		maker_cd: $('#maker_cd').val(),
		model_cd: $('#model_cd').val(),
		req_kind: $('#req_kind').val(),
		req_cnt: $('#req_cnt').val(),
		poverty_yn: $(':radio[name="poverty_yn"]:checked').val(),
		first_buy_yn: $(':radio[name="first_buy_yn"]:checked').val(),
		birth1: $('#birth1').val(),
		social_kind: $('#social_kind').val(),
		children_cnt: $('#children_cnt').val(),
		taxi_yn: $(':radio[name="taxi_yn"]:checked').val(),
		taxi_busi_yn: $(':radio[name="taxi_busi_yn"]:checked').val(),
		exchange_yn: $(':radio[name="exchange_yn"]:checked').val(),
		exchange_3year_yn: $(':radio[name="exchange_3year_yn"]:checked').val(),
		exchange_3year_cnt: $('#exchange_3year_cnt').val(),
		bms_yn: $(':radio[name="bms_yn"]:checked').val(),
		truck_yn: $(':radio[name="truck_yn"]:checked').val(),
		improve_fd_yn: $(':radio[name="improve_fd_yn"]:checked').val(),
		improve_fd_detail2: $('#improve_fd_detail2').is(':checked') ? 'Y' : 'N',
		new_dlvr_yn: $(':radio[name="new_dlvr_yn"]:checked').val(),
		farmng_yn: $(':radio[name="farmng_yn"]:checked').val(),
		ssml_ev_yn: $(':radio[name="ssml_ev_yn"]:checked').val()
	};
}

function doCalc(){
	if(isH2()){ doH2Calc(); return; }
	if(isMotor()){ doMotorCalc(); return; }
	if(!validateCalc()) return;
	// 건설기계(21)만 폐차=예를 폐차대수 1대(조회전용 1대 기준)로 환산 — ex_car_cnt는 폐차 추가지방비(add_lamt1)의 승수.
	// 승용/화물의 폐차 라디오는 전환지원금·미세먼지 분기 판정용이라 ex_car_cnt는 0 유지.
	$('#ex_car_cnt').val(($('#car_type').val() === '21' && $(':radio[name="exchange_yn"]:checked').val() === 'Y') ? '1' : '0');
	// 건설기계(21) 계산 경로(calAmt 공통 else)는 추가국비·전환지원금을 설정하지 않으므로 이전 탭 계산값 잔류 방지 초기화
	$('#req_add_gamt').val('0'); $('#req_chng_add_gamt').val('0'); $('#req_chng_add_lamt').val('0');
	$.ajax({ type:'POST', url:SUBSI_CALC_CONFIG.urls.calc, dataType:'json',
		data: collectCalcParams(),
		success:function(res){
			if(res.CNT != 1){ alert('해당 차종/지자체의 단가 정보가 없습니다.'); return; }
			$('#req_gamt').val(res.req_gamt); $('#req_add_gamt').val(res.req_add_gamt); $('#req_chng_add_gamt').val(res.req_chng_add_gamt);
			$('#req_lamt').val(res.req_lamt); $('#req_add_lamt').val(res.req_add_lamt); $('#req_chng_add_lamt').val(res.req_chng_add_lamt);
			if(res.type_cd){ setModelChangeView(res.type_cd); }
			renderResult();
		},
		error:function(){ alert('계산 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.'); }
	});
}

// === 모델 콤보 ===
function loadModel(){
	var year = $("#s_year").val();
	var car_type = $("#car_type").val();
	var localDo_cd = $("#localDo_cd").val();
	var local_cd1 = $("#local_cd1").val();
	var maker_cd = $("#maker_cd").val();
	if(isH2()){ loadH2Model(year, local_cd1, maker_cd); return; }
	if(isMotor()){ loadMotorModel(year, local_cd1, maker_cd); return; }
		$.ajax({
            type: "POST",
            url: SUBSI_CALC_CONFIG.urls.modelCombo,
            dataType: 'json',
            data: { 'year' : year , 'car_type' : car_type, 'local_cd' : local_cd1, 'maker_cd' : maker_cd},
            success: function(data){
            	$("#model_cd").empty(); // 기존 옵션 제거
            	$("#model_cd").append('<option value="">선택</option>')
                for (var i = 0; i < data.modelList.length; i++) {
                    var item = data.modelList[i];

                    $("#model_cd").append(
                    		'<option value="' + item.MODEL_CD + '">' + item.MODEL_NM + '</option>'
                    );
                }
            }
        });
}

$(document).ready(function(){
	$('#car_type').val(SUBSI_CALC_CONFIG.carType);
	$('#tab_'+SUBSI_CALC_CONFIG.carType).prop('checked', true).addClass('active');
	applyCondVisibility();
	$(document).ajaxError(function(e,xhr,st){ console.log('[보조금계산기] AJAX 실패:', st.url, 'status='+xhr.status); });
	loadSido();
	$('#localDo_cd').on('change', function(){ loadSigungu(); });
	$('#local_cd1').on('change', function(){ loadMaker(); });
	$('#maker_cd').on('change', function(){ loadModel(); });
	// 사회계층: select(해당없음 디폴트) 단독 컨트롤 → 숨김 social_yn 동기화 + 다자녀 선택 시 자녀수 노출
	$('#social_kind').on('change', syncSocialUI); syncSocialUI();
	// 신청유형(개인 전용 조건) · 생애최초(생년월일) 노출 갱신
	$(document).on('change', '#req_kind', applyCondVisibility);
	$(document).on('change', ':radio[name="first_buy_yn"]', syncFirstBuyUI);
	$(document).on('change', ':radio[name="exchange_3year_yn"]', syncExchange3yearUI);
	// 신청유형(req_kind) 변경 시 데이터 반영은 [계산하기] 클릭 시점으로 이연(change 시 조회 안 함)
	// 입력이 바뀌면 이전 계산 결과 무효화 → 재계산 없이 [시나리오 담기]로 옛 금액이 담기는 문제 방지
	$('#frm').on('change', 'input, select', invalidateCalcResult);
	initGuideTabs();
});

// === 구매 가이드 & 안내 탭 전환 (ui-common.js는 .tab 미처리 → 페이지 자체 구현) ===
function initGuideTabs(){
	$('.tab--chip .tab__button').on('click', function(){
		var $btn = $(this);
		var $item = $btn.closest('.tab__item');
		var $list = $item.closest('.tab__list');
		var targetId = $item.attr('aria-controls');
		$list.find('.tab__item').removeClass('tab__item--selected').attr('aria-selected', 'false');
		$item.addClass('tab__item--selected').attr('aria-selected', 'true');
		$item.closest('.tab').find('.tab-content').removeClass('tab-content--current');
		$('#'+targetId).addClass('tab-content--current');
	});
}

// === 시나리오 비교 (클라이언트 상태, 서버 저장 없음, 최대 3개) ===
function addScenario(){
	if(!$('#calcResult').is(':visible')){
		notify('먼저 계산하기를 눌러 결과를 확인하세요.');
		return;
	}
	var $list = $('#scenarioList');
	if($list.find('.column-list__item').length >= 3){
		notify('시나리오는 최대 3개까지 담을 수 있습니다.');
		return;
	}
	var carTypeLabel = $(':radio[name="carType"]:checked').next('label').find('span').text();
	var modelLabel = $('#model_cd option:selected').text();
	var regionLabel = $.trim($('#localDo_cd option:selected').text() + ' ' + $('#local_cd1 option:selected').text());
	var total = $('#out_total').text();
	var gamt = $('#out_gamt').text();
	var lamt = $('#out_lamt').text();
	var add = $('#out_add').text();

	$('#scenarioEmpty').hide();
	$list.show();

	var $item = $(
		'<li class="column-list__item">' +
			'<div class="column-list__link">' +
				'<div class="column-list__heading">' +
					'<div class="column-list__category"></div>' +
					'<strong class="column-list__title"></strong>' +
					'<div class="column-list__subtitle"></div>' +
				'</div>' +
				'<div class="column-list__data">' +
					'<dl class="definition-list">' +
						'<dt class="definition-list__label">총 보조금</dt>' +
						'<dd class="definition-list__description"><b class="text-emphasis"></b></dd>' +
						'<dt class="definition-list__label">국고 보조금</dt>' +
						'<dd class="definition-list__description"></dd>' +
						'<dt class="definition-list__label">지방 보조금</dt>' +
						'<dd class="definition-list__description"></dd>' +
						'<dt class="definition-list__label">추가지원 합계 (국비+지방비)</dt>' +
						'<dd class="definition-list__description"></dd>' +
					'</dl>' +
				'</div>' +
				'<button type="button" title="삭제" class="button button--xsmall button--icon button--delete">' +
					'<i class="svg-icon delete" aria-hidden="true"></i>' +
					'<span class="button__label">해당 모델 삭제</span>' +
				'</button>' +
			'</div>' +
		'</li>'
	);
	$item.find('.column-list__category').text(carTypeLabel || '');
	$item.find('.column-list__title').text(modelLabel || '미선택');
	$item.find('.column-list__subtitle').text(regionLabel || '');
	var $desc = $item.find('.definition-list__description');
	$desc.eq(0).find('.text-emphasis').text(total + '원');
	$desc.eq(1).text(gamt + '원');
	$desc.eq(2).text(lamt + '원');
	$desc.eq(3).text(add + '원');
	$item.find('.button--delete').on('click', function(){
		$(this).closest('.column-list__item').remove();
		if($list.find('.column-list__item').length === 0){ $list.hide(); $('#scenarioEmpty').show(); }
	});
	$list.prepend($item);   // 새 항목을 맨 앞(왼쪽)에 → 이전 저장분은 오른쪽으로 밀림
	notify('시나리오 담기가 완료되었습니다.');
}

// === 계산 후 추가지원 조건 노출/라디오 초기화 (서버 type_cd 기준) ===
function setModelChangeView(model_type) {
	var year = $("#s_year").val();

	$('#div_option').show();

	if(LOCAL_OPTION && "" != LOCAL_OPTION.HOUSE_LIMIT_YN && LOCAL_OPTION.HOUSE_LIMIT_YN =="Y" ) {
		if(year >= '2026' && $('#req_kind').val() != 'B'){
			$('.tr_house_limit_yn').show();
		}else if(year <= 2025 && $("#pri_business_yn").val() != 'Y') {
			$('.tr_house_limit_yn').show();
		}
	}
	if(LOCAL_OPTION && "" != LOCAL_OPTION.SOCIAL_ADD_YN && LOCAL_OPTION.SOCIAL_ADD_YN =="Y" ) {
		$('.tr_social_add_yn').show();
	}

	// 트럭 옵션 처리 제거. 2022-02-15 by sdkim
	/*
	if("" != '${localOption.TRUCK_ADD_YN}' && '${localOption.TRUCK_ADD_YN}' =="Y" ) {
		$('.td_truck_add_yn').show();
	}
	*/
	$('.td_truck_add_yn').hide();

	if(LOCAL_OPTION && "" != LOCAL_OPTION.TAXI_YN && LOCAL_OPTION.TAXI_YN =="Y" ) {
		$('.td_taxi_yn').show();
		//2024.01.29 업무처리지침 변경에 의하여 택시 법인은 중소기업여부 추가
		if(year >= '2024' && $("#req_kind").val() == "G") {
			$('.td_taxi_busi_yn').show();
		} else {
			$('.td_taxi_busi_yn').hide();
		}
	}

	if(LOCAL_OPTION && "" != LOCAL_OPTION.EXCHANGE_ADD_YN && LOCAL_OPTION.EXCHANGE_ADD_YN =="Y" ) {
		$('.td_exchange_add_yn').show();
	}

	if($('#req_kind').val() == 'G') {
		$('.tr_kev100').show();
        $('.tr_purCorp').show();
		$('.addr_type').show();
	}

	if(LOCAL_OPTION && "" != LOCAL_OPTION.SSML_EV_YN && LOCAL_OPTION.SSML_EV_YN =="Y" ) {
        $('.td_ssml_ev_yn').show();
    }

	$('.tr_exchange_3year_yn').hide();	//폐차 전환지원금 HIDE

	//일반승용, 경형
	if(model_type == 'RIDE' || model_type == 'RIDELGT') {
		$(':radio[id="truck_yn2"]').prop("checked", true);
		$('.tr_poverty').show();
		$(':radio[id="ssml_ev_yn2"]').prop("checked", true);
		$('.td_ssml_ev_yn').hide();

		if( $('#req_kind').val() == 'S' || $('#req_kind').val() == 'G') {
			$('.tr_house_limit_yn').hide();
			$('.tr_social_add_yn').hide();
			$('.tr_poverty').hide();
			$(':radio[id="poverty_yn2"]').prop("checked", true);

			if( $('#req_kind').val() == 'S' ) {
				$(':radio[id="taxi_yn2"]').prop("checked", true);
				$('.td_taxi_yn').hide();
				$(':radio[id="taxi_busi_yn2"]').prop("checked", true);
				$('.td_taxi_busi_yn').hide();
			}else {
				$('.tr_house_limit_yn').hide();
				if(LOCAL_OPTION && "" != LOCAL_OPTION.SOCIAL_ADD_YN && LOCAL_OPTION.SOCIAL_ADD_YN =="Y" ) {
					$('.tr_social_add_yn').show();
				}
			}
		}else if($('#req_kind').val() == 'P'){	//신청유형 개인
			//2026년 업무처리지침 전환지원금 출고 후 3년 이상 경과 내연기관차 교체(판매,폐차) 전환지원금 국비 100만원
			if(year >= 2026){
				$('.tr_exchange_3year_yn').show();	//폐차 전환지원금 SHOW
			}
		}

		if( $('#req_kind').val() == 'L') {
			$(':radio[id="taxi_yn2"]').prop("checked", true);
			$('.td_taxi_yn').hide();
			$(':radio[id="taxi_busi_yn2"]').prop("checked", true);
			$('.td_taxi_busi_yn').hide();
		}
		$('.td_truck_add_yn').hide();
	}else if(model_type == 'RIDESML') {
        $(':radio[id="truck_yn2"]').prop("checked", true);
        $(':radio[id="taxi_yn2"]').prop("checked", true);
        $('.td_taxi_yn').hide();
        $('.td_taxi_busi_yn').hide();
        $('.td_truck_add_yn').hide();
        $('.tr_poverty').show();
//         $('.tr_poverty').hide();
//         $(':radio[id="poverty_yn2"]').prop("checked", true);

        if( $('#req_kind').val() == 'S') {
            $('.tr_house_limit_yn').hide();
            $('.tr_social_add_yn').hide();
        }else {
            if( $('#req_kind').val() == 'G') {
                $('.tr_house_limit_yn').hide();
            }
            if(LOCAL_OPTION && "" != LOCAL_OPTION.SOCIAL_ADD_YN && LOCAL_OPTION.SOCIAL_ADD_YN =="Y" ) {
                $('.tr_social_add_yn').show();
            }
            if(LOCAL_OPTION && "" != LOCAL_OPTION.SSML_EV_YN && LOCAL_OPTION.SSML_EV_YN =="Y" ) {
                $('.td_ssml_ev_yn').show();
            }
        }
	}else if(model_type == 'TRUCKLGT' || model_type == 'TRUCKSML') {	//화물(경형) 화물(소형)
		if( $('#req_kind').val() == 'S') {
			$('.tr_house_limit_yn').hide();
			$('.tr_social_add_yn').hide();
		}else {
			if( $('#req_kind').val() == 'G') {
				$('.tr_house_limit_yn').hide();
			}else if($('#req_kind').val() == 'P'){
				//2026 3년이상 경과 내연기관차 교체한 개인(승용,화물) 100만원 추가지원
				if(year >= 2026){
					$('.tr_exchange_3year_yn').show();	//폐차 전환지원금 SHOW
				}
			}
			if(LOCAL_OPTION && "" != LOCAL_OPTION.SOCIAL_ADD_YN && LOCAL_OPTION.SOCIAL_ADD_YN =="Y" ) {
				$('.tr_social_add_yn').show();
			}
		}

		$(':radio[id="taxi_yn2"]').prop("checked", true);
		$('.td_taxi_yn').hide();
		$(':radio[id="taxi_busi_yn2"]').prop("checked", true);
		$('.td_taxi_busi_yn').hide();

		if( $('#req_kind').val() == 'P') {
			$('.tr_poverty').show();
		} else {
			$('.tr_poverty').hide();
		}

		//$(':radio[id="poverty_yn2"]').prop("checked", true);
		$(':radio[id="ssml_ev_yn2"]').prop("checked", true);
		$('.td_ssml_ev_yn').hide();

	}else if(model_type == 'TRUCKSSML') {
        if( $('#req_kind').val() == 'S') {
            $('.tr_house_limit_yn').hide();
            $('.tr_social_add_yn').hide();
        }else {
            if( $('#req_kind').val() == 'G') {
                $('.tr_house_limit_yn').hide();
            }
            if(LOCAL_OPTION && "" != LOCAL_OPTION.SOCIAL_ADD_YN && LOCAL_OPTION.SOCIAL_ADD_YN =="Y" ) {
                $('.tr_social_add_yn').show();
            }
            if(LOCAL_OPTION && "" != LOCAL_OPTION.SSML_EV_YN && LOCAL_OPTION.SSML_EV_YN =="Y" ) {
                $('.td_ssml_ev_yn').show();
            }
        }

        $(':radio[id="taxi_yn2"]').prop("checked", true);
        $('.td_taxi_yn').hide();
		$(':radio[id="taxi_busi_yn2"]').prop("checked", true);
		$('.td_taxi_busi_yn').hide();
        if( $('#req_kind').val() == 'P') {
            $('.tr_poverty').show();
        } else {
            $('.tr_poverty').hide();
        }
        //$(':radio[id="poverty_yn2"]').prop("checked", true);

	}else if(model_type == 'EXCVT') {
		if( $('#req_kind').val() == 'S') {
			$('.tr_house_limit_yn').hide();
			$('.tr_social_add_yn').hide();
		}else {
			if( $('#req_kind').val() == 'G') {
				$('.tr_house_limit_yn').hide();
			}
			if(LOCAL_OPTION && "" != LOCAL_OPTION.SOCIAL_ADD_YN && LOCAL_OPTION.SOCIAL_ADD_YN =="Y" ) {
				$('.tr_social_add_yn').show();
			}
		}

		$(':radio[id="taxi_yn2"]').prop("checked", true);
		$('.td_taxi_yn').hide();
		$(':radio[id="taxi_busi_yn2"]').prop("checked", true);
		$('.td_taxi_busi_yn').hide();
		$('.tr_poverty').hide();
		$(':radio[id="poverty_yn2"]').prop("checked", true);
		$('.td_truck_add_yn').hide();


	}else {
		$(':radio[id="truck_yn2"]').prop("checked", true);
		$(':radio[id="taxi_yn2"]').prop("checked", true);
		$('.td_taxi_yn').hide();
		$(':radio[id="taxi_busi_yn2"]').prop("checked", true);
		$('.td_taxi_busi_yn').hide();
		$('.td_truck_add_yn').hide();
		$('.tr_poverty').hide();
		$(':radio[id="poverty_yn2"]').prop("checked", true);
		$('.td_ssml_ev_yn').hide();

		//2026년 업무처리지침 승합소형 추가
		if( model_type == 'BUSSML' || model_type == 'BUSMID' || model_type == 'BUSBIG') {
			$(':radio[id="exchange_yn2"]').prop("checked", true);
			$('.td_exchange_add_yn').hide();
			$('#ex_car_cnt').val('0');
		}

		if( $('#req_kind').val() == 'S') {
			$('.tr_house_limit_yn').hide();
			$('.tr_social_add_yn').hide();
		}else {
			if( $('#req_kind').val() == 'G') {
				$('.tr_house_limit_yn').hide();
			}
			if(LOCAL_OPTION && "" != LOCAL_OPTION.SOCIAL_ADD_YN && LOCAL_OPTION.SOCIAL_ADD_YN =="Y" ) {
				$('.tr_social_add_yn').show();
			}
		}

	}
}
