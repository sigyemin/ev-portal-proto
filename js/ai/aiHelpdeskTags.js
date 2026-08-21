/**
 * AI 헬프데스크 추천 해시태그 — 칩 표시(tag/tagEn)와 클릭 시 전송할 질문(q)
 * 상담 유형(chatType) 별 목록을 메인 임베드와 우측 플로팅 패널이 공유한다.
 */
var AI_HELPDESK_TAGS = {
	subsidy: [
		{
			tag: '#서울 전기차 보조금',
			tagEn: '#Seoul EV subsidy',
			q: '2026년 서울시 전기승용차 구매보조금은 중·대형, 소형, 초소형 차량별로 최대 얼마인가요?'
		},
		{
			tag: '#서울 개인·법인 보조금 자격',
			tagEn: '#Seoul eligibility: individual & corporate',
			q: '2026년 서울시 전기승용차 구매보조금은 개인, 개인사업자, 법인이 모두 신청할 수 있나요?'
		},
		{
			tag: '#서울 보조금 신청 절차',
			tagEn: '#Seoul subsidy application process',
			q: '2026년 서울시 전기승용차 구매보조금은 구매계약 후 제작·수입사를 통해 어떻게 신청하나요?'
		},
		{
			tag: '#보조금 선정순서',
			tagEn: '#Subsidy selection order',
			q: '2026년 서울시 전기승용차 보조금 대상자는 신청 순서로 선정하나요, 차량 출고·등록 순서로 선정하나요?'
		}
	],
	helpConsult: [
		{
			tag: '#회원카드 신청',
			tagEn: '#Membership card application',
			q: '기후에너지환경부 회원카드는 어떻게 신청하나요?'
		},
		{
			tag: '#충전기 고장 신고',
			tagEn: '#Reporting a charger fault',
			q: '기후에너지환경부 충전기가 작동하지 않을 때 현장에서 어떻게 고장 신고를 하나요?'
		},
		{
			tag: '#충전내역 조회',
			tagEn: '#Charging history lookup',
			q: '기후에너지환경부 회원카드로 충전한 내역은 어디에서 확인하나요?'
		},
		{
			tag: '#결제 후 충전 오류',
			tagEn: '#Paid but charging did not start',
			q: '결제는 되었지만 충전이 시작되지 않을 때 어떻게 처리하나요?'
		},
		{
			tag: '#전기차 충전요금',
			tagEn: '#EV charging rates',
			q: '기후에너지환경부 충전기에서 전기차를 충전할 때 요금은 완속·급속 등 충전 속도별로 얼마인가요?'
		}
	]
};

/** 상담 유형별 검색 입력 예시 문구 */
var AI_HELPDESK_PLACEHOLDER = {
	subsidy: {
		ko: '예: 현대 아이오닉6 보조금 얼마인가요?',
		en: 'e.g. How much is the subsidy for a Hyundai IONIQ 6?'
	},
	helpConsult: {
		ko: '예: 충전기가 작동하지 않는데 어떻게 신고하나요?',
		en: 'e.g. The charger is not working — how do I report it?'
	}
};

/** 현재 표시 언어 — i18n.js 와 같은 localStorage 키를 본다 */
function aiHelpdeskLang() {
	try {
		return window.localStorage.getItem('nportalLang') === 'en' ? 'en' : 'ko';
	} catch (e) {
		return 'ko';
	}
}

/**
 * 상담 유형에 맞는 검색 입력 예시 문구를 돌려준다.
 *
 * @param {string} chatType 상담 유형 코드 (subsidy / helpConsult)
 * @return {string} 현재 표시 언어의 예시 문구
 */
function aiHelpdeskPlaceholder(chatType) {
	var item = AI_HELPDESK_PLACEHOLDER[chatType] || AI_HELPDESK_PLACEHOLDER.helpConsult;
	return item[aiHelpdeskLang()] || item.ko;
}

/**
 * 상담 유형에 맞는 태그 칩을 컨테이너에 그린다. 전송할 질문은 data-q 로 보관한다.
 *
 * @param {jQuery} $container .tags 컨테이너
 * @param {string} chatType 상담 유형 코드 (subsidy / helpConsult)
 */
function renderAiHelpdeskTags($container, chatType) {
	if (!$container || !$container.length) { return; }

	var list = AI_HELPDESK_TAGS[chatType] || AI_HELPDESK_TAGS.helpConsult;
	var isEn = aiHelpdeskLang() === 'en';
	$container.empty();

	list.forEach(function (item) {
		var label = (isEn && item.tagEn) ? item.tagEn : item.tag;
		var $link = jQuery('<a>', { href: '#none', 'class': 'tag tag--link tag--small', title: item.q });
		$link.attr('data-q', item.q);
		$link.append(jQuery('<span>', { 'class': 'tag__label', text: label }));
		$container.append($link);
	});
}
