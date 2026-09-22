/* 정적 lang pack 다국어 치환 — KOR 기본, ENG 선택 시 en.json 로드 후 data-i18n 요소 일괄 치환 */
(function () {
	var STORAGE_KEY = 'nportalLang';
	var lang = 'ko';
	try { lang = window.localStorage.getItem(STORAGE_KEY) || 'ko'; } catch (e) {}

	function has(dict, key) { return Object.prototype.hasOwnProperty.call(dict, key); }

	/* 아이콘 등 자식 요소는 보존하고 첫 번째 텍스트 노드만 교체 */
	function replaceFirstTextNode(el, value) {
		for (var i = 0; i < el.childNodes.length; i++) {
			var node = el.childNodes[i];
			if (node.nodeType === 3 && /\S/.test(node.nodeValue)) { node.nodeValue = value; return; }
		}
		el.appendChild(document.createTextNode(value));
	}

	function applyDict(dict) {
		document.documentElement.lang = 'en';
		$('[data-i18n]').each(function () {
			var key = this.getAttribute('data-i18n');
			if (has(dict, key)) replaceFirstTextNode(this, dict[key]);
		});
		$('[data-i18n-html]').each(function () {
			var key = this.getAttribute('data-i18n-html');
			if (has(dict, key)) this.innerHTML = dict[key];
		});
		var attrs = ['aria-label', 'title', 'alt', 'placeholder'];
		for (var a = 0; a < attrs.length; a++) {
			(function (attr) {
				$('[data-i18n-' + attr + ']').each(function () {
					var key = this.getAttribute('data-i18n-' + attr);
					if (has(dict, key)) this.setAttribute(attr, dict[key]);
				});
			})(attrs[a]);
		}
	}

	/* 언어선택 드롭다운 표시 상태를 현재 언어와 동기화 */
	function syncDropdown() {
		var $dd = $('.dropdown--lang');
		if (!$dd.length) return;
		/* 표기는 해당 언어 그대로 쓴다(가이드 p.239 — 국기 대신 언어 이름) */
		var current = lang === 'en' ? 'ENGLISH' : '한국어';
		$dd.find('.dropdown-selector__button-label').text(current);
		$dd.find('.dropdown-container__button').each(function () {
			var isCur = $(this).find('.dropdown-container__label').text() === current;
			$(this).attr('aria-selected', isCur ? 'true' : 'false')
				.closest('.dropdown-container__item').toggleClass('dropdown-container__item--selected', isCur);
		});
	}

	$(function () {
		syncDropdown();
		$(document).on('click', '.dropdown--lang .dropdown-container__button', function () {
			var sel = $(this).find('.dropdown-container__label').text() === 'ENGLISH' ? 'en' : 'ko';
			if (sel !== lang) {
				try { window.localStorage.setItem(STORAGE_KEY, sel); } catch (e) {}
				window.location.reload();
			}
		});
		if (lang === 'en' && window.EV_I18N_BASE) {
			$.getJSON(window.EV_I18N_BASE + 'en.json', applyDict);
		}
	});
})();
