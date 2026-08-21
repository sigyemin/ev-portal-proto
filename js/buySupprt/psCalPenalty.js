/* 보조금 환수금 계산기 글루 — 계산은 서버(PsCalcServiceImpl.calcPenalty)에서 수행 */
(function () {
	"use strict";

	var CFG = window.PENALTY_CALC_CONFIG || {};

	// 금액 입력 → 한글 금액 표기(표시용, 계산 아님)
	function viewKorean(num) {
		var arrNumberWord = ["", "일", "이", "삼", "사", "오", "육", "칠", "팔", "구"];
		var arrDigitWord = ["", "십", "백", "천"];
		var arrManWord = ["", "만", "억", "조"];
		num = String(num).replace(/[^0-9]/g, "");
		if (num === "") {
			return "";
		}
		var result = "";
		var manCount = 0;
		for (var i = 0; i < num.length; i++) {
			var word = arrNumberWord[Number(num.charAt(i))];
			if (word !== "") {
				manCount++;
				word += arrDigitWord[(num.length - (i + 1)) % 4];
			}
			if (manCount !== 0 && (num.length - (i + 1)) % 4 === 0) {
				manCount = 0;
				word += arrManWord[(num.length - (i + 1)) / 4];
			}
			result += word;
		}
		if (result !== "") {
			result += " 원";
		}
		return result;
	}

	// 숫자만 남기고 천 단위 콤마 삽입
	function comma(num) {
		var digits = String(num).replace(/[^0-9]/g, "").replace(/^0+(?=\d)/, "");
		return digits === "" ? "" : digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
	}

	// 콤마 재삽입 후 커서를 원래 자릿수 위치로 복원
	function applyComma(el) {
		var before = el.value;
		var caret = el.selectionStart;
		var digitsBefore = before.slice(0, caret).replace(/[^0-9]/g, "").length;
		var formatted = comma(before);
		if (formatted === before) {
			return formatted;
		}
		el.value = formatted;
		var pos = 0;
		var seen = 0;
		while (pos < formatted.length && seen < digitsBefore) {
			if (/[0-9]/.test(formatted.charAt(pos))) {
				seen++;
			}
			pos++;
		}
		if (el.setSelectionRange) {
			el.setSelectionRange(pos, pos);
		}
		return formatted;
	}

	function bindWon(inputId, wonId, defaultText) {
		$("#" + inputId).on("input", function () {
			var v = applyComma(this);
			$("#" + wonId).text(v === "" ? (defaultText || "") : "(" + viewKorean(v) + ")");
		});
	}

	function doCalc() {
		var params = {
			search_type : $("#search_type").val(),
			base_day    : $("#base_day").val(),
			scrap_day   : $("#scrap_day").val(),
			chkinev     : $("#chkinev").is(":checked") ? "Y" : "N",
			psamt       : $("#psamt").val(),
			chamt       : $("#chamt").val(),
			inamt       : $("#inamt").val()
		};

		$.ajax({
			url : CFG.calcUrl,
			type : "post",
			dataType : "json",
			data : params,
			success : function (res) {
				if (!res || res.result !== "OK") {
					$("#out_detail").hide();
					alert(res && res.message ? res.message : "계산 중 오류가 발생했습니다.");
					return;
				}
				$("#out_reamt").text(res.reText.replace(/원$/, ""));
				$("#out_year").text(res.yearTr);
				$("#out_day").text(res.dayTr);
				$("#out_rate").text(res.rateTr);
				$("#out_adamt").text(res.adText);
				$("#out_detail").show();
				$("#out_guide").text("환수금 " + res.reText + " · 차액환수금 " + res.adText + " (참고용 추정치)");
			},
			error : function () {
				alert("계산 중 오류가 발생했습니다.");
			}
		});
	}

	$(function () {
		bindWon("psamt", "pswon", "");
		bindWon("chamt", "chwon", "보상금 있는 경우 입력");
		bindWon("inamt", "inwon", "보상금 있는 경우 입력");
		$("#btnCalc").on("click", doCalc);
	});
})();
