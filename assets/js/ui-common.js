/* ---------------------------------------
	Filename: ui-common.js
	Description : 
	Author	: mobigen
	date	: 2026-06
	비고 : 동작용 샘플
  --------------------------------------- */

// 전역 객체 선언
window.openHelpdesk = {};

$(function () {
  // -------------------------
  // GNB 메뉴
  // -------------------------
  const $header = $(".header");
  const $gnbItems = $(".nav-gnb .gnb__item");
  const $btnMenu = $(".button--menu");
  const BREAKPOINT = 1024;

  const isMobile = () => window.innerWidth <= BREAKPOINT;

  // [PC] 마우스 호버로 메뉴 열기/닫기
  $gnbItems.on("mouseenter mouseleave focusin focusout", function (e) {
    if (isMobile()) return;

    const $this = $(this);
    const isEnter = e.type === "mouseenter" || e.type === "focusin";

    if (isEnter) {
      $gnbItems.removeClass("gnb__item--active");
      $this.addClass("gnb__item--active");
      $header.addClass("header--open");
    } else {
      if (e.type === "focusout" && e.relatedTarget && $.contains(this, e.relatedTarget)) {
        return;
      }
      $this.removeClass("gnb__item--active");

      if ($gnbItems.find(":focus").length === 0) {
        $header.removeClass("header--open");
      }
    }
  });

  // [Mobile] 햄버거 메뉴 토글
  $btnMenu.on("click", function () {
    const isOpen = $header.toggleClass("header--open").hasClass("header--open");
    const $label = $(this).find(".button__label");

    $("body").toggleClass("no-scroll", isOpen);
    $label.text(isOpen ? "메뉴닫기" : "메뉴열기");
    $(this).attr("aria-expanded", isOpen ? "true" : "false"); // 접근성

    if (isOpen && !$gnbItems.hasClass("gnb__item--active")) {
      $gnbItems.eq(0).addClass("gnb__item--active");
    } else if (!isOpen) {
      $gnbItems.removeClass("gnb__item--active");
    }
  });

  // [Mobile] 1depth 클릭 시 서브메뉴 교체
  $gnbItems.find(".gnb__link").on("click", function (e) {
    if (!isMobile()) return;

    const $item = $(this).closest(".gnb__item");
    if (!$item.find(".gnb__sub").length) return;

    e.preventDefault();
    $item.addClass("gnb__item--active").siblings().removeClass("gnb__item--active");
  });

  // PC 전환 시 Mobile 상태 초기화
  $(window).on("resize", function () {
    if (isMobile()) return;
    $("body").removeClass("no-scroll");
    $header.removeClass("header--open");
    $gnbItems.removeClass("gnb__item--active");
  });

  // -------------------------
  // 플로팅 메뉴
  // ---------------------- //
  const $window = $(window);
  const $floatingMenu = $(".floating-menu");
  const $btnTop = $(".floating-menu__btn--top");
  const $btnQuick = $(".floating-menu__btn--quick");
  const $footer = $(".footer");

  // 스크롤 위치에 따라 플로팅 메뉴 위치 조정
  function handleScroll() {
    const scrollTop = $window.scrollTop();
    const windowHeight = $window.height();
    const footerTop = $footer.length ? $footer.offset().top : $(document).height();

    // 화면 하단에서 푸터가 보이는 높이 계산
    const footerVisibleHeight = Math.max(0, scrollTop + windowHeight - footerTop);

    // 100px 이상 스크롤 시 TOP 버튼 활성화
    $btnTop.toggleClass("is-active", scrollTop > 100);

    // 푸터가 보이면 플로팅 메뉴를 푸터 위로 올림
    if (footerVisibleHeight > 0) {
      $floatingMenu.addClass("is-bottom").css("bottom", footerVisibleHeight + 40);
    } else {
      $floatingMenu.removeClass("is-bottom").css("bottom", "");
    }
  }

  // 스크롤, 리사이즈 이벤트
  $window.on("scroll.floatingMenu resize.floatingMenu", function () {
    handleScroll();

    if (!isMobile()) {
      // PC 전환 시 모든 모바일 UI 상태 초기화
      $("body").removeClass("no-scroll");
      $header.removeClass("header--open");
      $btnMenu.attr({ "aria-expanded": "false", "aria-label": "Mobile 메뉴 열기" }).find(".button__label").text("메뉴열기");
      $gnbItems.removeClass("gnb__item--active").find(".gnb__sub").removeAttr("style").siblings(".gnb__link").removeAttr("aria-expanded role");
    }
  });

  // TOP 버튼 클릭 페이지 최상단으로 이동
  $btnTop.on("click", function () {
    $("html, body").stop().animate({ scrollTop: 0 }, 150);
  });

  // Quick 버튼 토글
  $btnQuick.on("click", function () {
    const $btn = $(this);
    const isActive = $btn.toggleClass("is-active").hasClass("is-active");

    $btn.attr({
      "aria-expanded": isActive,
      "aria-label": isActive ? "퀵 메뉴 닫기" : "퀵 메뉴 열기"
    });
    $btn.find(".button__label").text(isActive ? "Close" : "Quick");
  });

  // -------------------------
  // 공통 변수
  // ---------------------- //
  const $dimmed = $(".dimmed");
  const $helpdesk = $(".helpdesk-panel");
  const $btnAi = $(".floating-menu__btn--ai");
  const $btnCloseHelpdesk = $(".helpdesk-panel__close .button");
  const $modalContainer = $(".modal-container");
  const $btnCloseModal = $(".modal .button--close, .modal__footer .button, .alert .button--close");
  const $btnSidepanel = $(".structured-list__button");
  const $sidepanel = $(".side-panel");
  const $btnCloseSidePanel = $(".side-panel__close .button");
  const $bookmark = $(".button--bookmark");

  const panels = [
    { $el: $helpdesk, closeFn: () => window.closeHelpdesk() },
    { $el: $modalContainer, closeFn: () => closeModal() },
    { $el: $sidepanel, closeFn: () => window.closeSidepanel() }
  ];

  // -------------------------
  // dimmed 클릭 / ESC 키 공통 처리
  // ---------------------- //

  function closeAllActivePanels() {
    panels.forEach((panel) => {
      if (panel.$el.hasClass("is-active")) panel.closeFn();
    });
  }

  // dimmed 및 외부 영역 클릭 시 닫기
  $dimmed.on("click", closeAllActivePanels);

  $(document).on("click", ".modal-container", function (e) {
    if ($(e.target).hasClass("modal-container")) closeModal();
  });

  // ESC 키로 활성화된 패널 닫기
  $(document).on("keydown", function (e) {
    if (e.key === "Escape") closeAllActivePanels();
  });

  // -------------------------
  // 공통 사이드 패널 토글 (패널 Open/Close 상태 관리)
  // ---------------------- //
  function togglePanelState(isOpen, $panel, $btn) {
    $panel.toggleClass("is-active", isOpen);
    $("body").toggleClass("no-scroll", isOpen);
    $dimmed.toggleClass("is-show", isOpen);
    $btn.attr("aria-expanded", isOpen ? "true" : "false");

    if (isOpen) {
      setTimeout(() => {
        $panel.find('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])').first().focus();
      }, 100);
    } else {
      $btn.focus();
    }
  }

  // AI 헬프데스크 패널
  window.openHelpdesk = () => togglePanelState(true, $helpdesk, $btnAi);
  window.closeHelpdesk = () => togglePanelState(false, $helpdesk, $btnAi);
  $btnAi.on("click", window.openHelpdesk);
  $btnCloseHelpdesk.on("click", window.closeHelpdesk);

  // 사이드 패널
  window.openSidepanel = () => togglePanelState(true, $sidepanel, $btnSidepanel);
  window.closeSidepanel = () => togglePanelState(false, $sidepanel, $btnSidepanel);
  $btnSidepanel.on("click", window.openSidepanel);
  $btnCloseSidePanel.on("click", window.closeSidepanel);

  // -------------------------
  // 일반 공통 모달
  // ---------------------- //
  let $btnModalOpen;

  function openModal(target, options = {}) {
    const { width = "auto", opener = null, onOpened = null } = options;
    const $target = $(target);

    if (!$target.hasClass("modal-container")) return;

    // 이미 열린창 닫기
    if ($modalContainer.hasClass("is-active")) {
      $modalContainer.filter(".is-active").removeClass("is-active").attr("aria-hidden", "true");
      if ($btnModalOpen) $btnModalOpen.attr("aria-expanded", "false");
    }

    if (opener) {
      $btnModalOpen = $(opener).attr("aria-expanded", "true");
    }

    $target.addClass("is-active").attr("aria-hidden", "false");

    const $modal = $target.find(".modal, .alert");

    if (width === "auto") {
      $modal.css("width", "");
    } else {
      const modalSize = typeof width === "number" ? `${width}px` : width;
      $modal.css("width", modalSize);
    }

    $("body").addClass("no-scroll");
    $dimmed.addClass("is-show");

    setTimeout(() => {
      $target.find('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])').first().focus();
      onOpened?.();
    }, 100);
  }

  function closeModal() {
    $modalContainer.filter(".is-active").removeClass("is-active").attr("aria-hidden", "true");
    $("body").removeClass("no-scroll");
    $dimmed.removeClass("is-show");

    if ($btnModalOpen) {
      $btnModalOpen.attr("aria-expanded", "false").focus();
    }
  }

  window.openModal = openModal;

  // data-target 버튼
  $(document).on("click", "[data-target]", function () {
    const targetSize = $(this).data("target-size");

    openModal(`#${$(this).data("target")}`, {
      ...(targetSize && { width: targetSize }),
      opener: this
    });
  });

  $btnCloseModal.on("click", closeModal);

  // -------------------------
  // 글자크기 확대/축소
  // ---------------------- //
  const $btnPlus = $('[aria-label="글씨크기 크게"]');
  const $btnMinus = $('[aria-label="글씨크기 작게"]');

  const zoomLevels = [0.8, 0.9, 1.0, 1.1, 1.2, 1.3];
  let currentStep = 2; // 기본값 1.0

  $('[aria-label="글씨크기 크게"], [aria-label="글씨크기 작게"]').on("click", function () {
    const isPlus = $(this).attr("aria-label") === "글씨크기 크게";

    if (isPlus && currentStep < zoomLevels.length - 1) currentStep++;
    if (!isPlus && currentStep > 0) currentStep--;

    $("body").css("zoom", zoomLevels[currentStep]);
  });

  // 초기 실행
  handleScroll();

  // 즐겨찾기 버튼 아이콘/타이틀 토글
  $bookmark.on("click", function (e) {
    e.preventDefault();

    const icon = $(this).find(".svg-icon");
    const currentTitle = $(this).attr("title") || "";

    if (icon.hasClass("star-fill")) {
      icon.removeClass("star-fill").addClass("star-stroke");
      if (currentTitle.includes("해제")) {
        const toggleTitle = currentTitle.replace("해제", "").trim();
        $(this).attr("title", toggleTitle);
      }
    } else {
      icon.removeClass("star-stroke").addClass("star-fill");
      if (!currentTitle.includes("해제")) {
        const toggleTitle = currentTitle ? `${currentTitle} 해제` : "해제";
        $(this).attr("title", toggleTitle);
      }
    }
  });

  // -------------------------
  //  button, a 태그 안에 있는 svg-icon에만 aria-hidden="true" 적용
  // ---------------------- //
  $("button i.svg-icon, a i.svg-icon").attr("aria-hidden", "true");

  // -------------------------
  //  dropdown
  // ---------------------- //
  $(".dropdown-selector__button").on("click", function (e) {
    e.stopPropagation();

    const $thisDropdown = $(this).closest(".dropdown");

    $(".dropdown").not($thisDropdown).removeClass("dropdown--open").find(".dropdown-selector__button").attr("aria-expanded", "false");

    // 현재 드롭다운 토글 및 접근성(aria) 상태 변경
    const isOpen = $thisDropdown.toggleClass("dropdown--open").hasClass("dropdown--open");
    $(this).attr("aria-expanded", isOpen);
  });

  $(".dropdown-container__button").on("click", function () {
    const $thisDropdown = $(this).closest(".dropdown");
    const selectedText = $(this).find(".dropdown-container__label").text();

    // 기존 선택된 스타일 및 aria 속성 초기화 후 현재 요소에 적용
    $thisDropdown.find(".dropdown-container__item").removeClass("dropdown-container__item--selected");
    $thisDropdown.find(".dropdown-container__button").attr("aria-selected", "false");

    $(this).attr("aria-selected", "true").closest(".dropdown-container__item").addClass("dropdown-container__item--selected");

    $thisDropdown.find(".dropdown-selector__button-label").text(selectedText);
    $thisDropdown.removeClass("dropdown--open").find(".dropdown-selector__button").attr("aria-expanded", "false");
  });

  // 드롭다운 바깥 영역 클릭 시 모두 닫기
  $(document).on("click", function (event) {
    // 체크박스일 경우 제외
    if ($(event.target).closest(".checkbox").length > 0) {
      return;
    }

    $(".dropdown").removeClass("dropdown--open").find(".dropdown-selector__button").attr("aria-expanded", "false");
  });

  // -------------------------
  //  accordion
  // ---------------------- //
  $(".accordion-item").each(function () {
    if (!$(this).hasClass("accordion-item--expanded")) {
      $(this).find(".accordion-collapse").hide();
    }
  });

  $(".accordion-button").on("click", function () {
    const $item = $(this).closest(".accordion-item");
    const $collapse = $item.find(".accordion-collapse");

    $collapse.slideToggle(300, function () {
      $item.toggleClass("accordion-item--expanded");

      if ($item.hasClass("accordion-item--expanded")) {
        $(document).trigger("accordion:opened", [$item]);
      }
    });

    // 1개만 열림 기능 사용
    //$item.siblings().removeClass("accordion-item--expanded").find(".accordion-collapse").slideUp(300);
  });

  // -------------------------
  // datepicker
  // ---------------------- //
  $.datepicker.setDefaults($.datepicker.regional["ko"]);
  $(".datepicker-input").datepicker({
    dateFormat: "yy-mm-dd",
    monthNames: ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"],
    monthNamesShort: ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"],
    dayNamesMin: ["일", "월", "화", "수", "목", "금", "토"]
  });
});

document.addEventListener("DOMContentLoaded", () => {
  // -------------------------
  // 룸/범위 조절 슬라이더 : input range
  // ---------------------- //
  const rangeSlider = document.getElementById("rangeSlider");
  const rangeValue = document.getElementById("rangeValue");

  if (rangeSlider && rangeValue) {
    // 슬라이더 배경색을 비율에 맞춰 업데이트
    function updateSlider() {
      const min = rangeSlider.min || 0;
      const max = rangeSlider.max || 100;
      const value = rangeSlider.value;

      const percentage = ((value - min) / (max - min)) * 100;

      // CSS 변수(--slider-progress)를 동적으로 변경하여 배경 채우기
      rangeSlider.style.setProperty("--slider-progress", `${percentage}%`);

      rangeValue.textContent = `${value} kWh`;
      rangeSlider.setAttribute("aria-valuenow", value);
      rangeSlider.setAttribute("aria-valuetext", `${value} kWh`);
    }

    updateSlider();
    rangeSlider.addEventListener("input", updateSlider);
  }

  // -------------------------
  // tab contents
  // ---------------------- //
  const tabItems = document.querySelectorAll('.tab__item[role="tab"]');

  tabItems.forEach((tabItem) => {
    const button = tabItem.querySelector(".tab__button");

    button.addEventListener("click", () => {
      // 1. 현재 클릭한 탭이 속한 그룹(또는 리스트) 안의 다른 탭들만 선택 상태 해제
      // ul.tab__list를 기준으로 같은 그룹 내의 탭만 찾습니다.
      const tabList = tabItem.closest(".tab__list");
      const siblingTabs = tabList.querySelectorAll('.tab__item[role="tab"]');

      siblingTabs.forEach((item) => {
        item.classList.remove("tab__item--selected");
        item.setAttribute("aria-selected", "false");

        const irText = item.querySelector(".ir-pm");
        if (irText) irText.remove();
      });

      // 2. 현재 탭 활성화 처리
      tabItem.classList.add("tab__item--selected");
      tabItem.setAttribute("aria-selected", "true");

      const screenReaderText = document.createElement("i");
      screenReaderText.classList.add("ir-pm");
      screenReaderText.innerText = " 선택됨";
      button.appendChild(screenReaderText);

      // 3. 현재 탭과 연결된 타겟 패널 찾기
      const targetPanelId = tabItem.getAttribute("aria-controls");
      const targetPanel = document.getElementById(targetPanelId);

      if (targetPanel) {
        // 4. 중요: 모든 .tab-content를 끄는 게 아니라, 
        // 이 타겟 패널과 '형제 관계에 있는 패널들(같은 그룹의 패널들)'만 찾아 숨깁니다.
        // 이렇게 하면 다른 위치에 있는 완전 무관한 탭 패널들은 영향을 받지 않습니다.
        const parentContentsWrapper = targetPanel.parentElement;
        const relatedPanels = parentContentsWrapper.querySelectorAll(".tab-content");

        relatedPanels.forEach((panel) => {
          panel.classList.remove("tab-content--current");
        });

        // 현재 패널만 활성화
        targetPanel.classList.add("tab-content--current");

        setTimeout(() => {
          window.dispatchEvent(new Event('resize'));
        }, 50);
      }
    });
  });

  // -------------------------
  // disclosure(부가적인 정보 표시)
  // ---------------------- //
  document.addEventListener("click", (e) => {
    // 클릭된 요소 또는 그 상위 요소 중 .disclosure-button 찾기
    const btn = e.target.closest(".disclosure-button");
    if (!btn) return;

    // 해당 버튼과 연결된 부모/컨테이너 요소 탐색
    const wrapper = btn.closest(".disclosure");
    const targetId = btn.getAttribute("aria-controls");
    const container = targetId ? document.getElementById(targetId) : null;

    // 현재 열림(expanded) 상태 확인
    const isExpanded = btn.getAttribute("aria-expanded") === "true";

    if (isExpanded) {
      // 닫기
      btn.setAttribute("aria-expanded", "false");
      if (wrapper) wrapper.classList.remove("disclosure--expand");
      if (container) container.setAttribute("aria-hidden", "true");
    } else {
      // 열기
      btn.setAttribute("aria-expanded", "true");
      if (wrapper) wrapper.classList.add("disclosure--expand");
      if (container) container.setAttribute("aria-hidden", "false");
    }
  });

  // -------------------------
  // 채팅 입력창 자동 높이 조절
  // ---------------------- //
  function autoResizeTextarea(promptInput) {
    const maxHeight = 160; // 최대높이

    promptInput.style.height = "auto";

    if (promptInput.scrollHeight > maxHeight) {
      promptInput.style.height = maxHeight + "px";
      promptInput.style.overflowY = "auto";
    } else {
      promptInput.style.height = promptInput.scrollHeight + "px";
      promptInput.style.overflowY = "hidden";
    }
  }

  $(document).ready(function () {
    const $textarea = $(".chat__prompt-input");

    if ($textarea.length) {
      autoResizeTextarea($textarea[0]);
    }

    $(document).on("input", ".chat__prompt-input", function () {
      autoResizeTextarea(this);
    });
  });
});
