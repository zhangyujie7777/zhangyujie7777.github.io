const toast = document.querySelector(".toast");
const modal = document.querySelector(".modal");
let typewriter = document.querySelector("[data-typewriter]");
let toastTimer;
let toastAnchor;

function updateLikeIcon(button) {
  if (!button) return;
  const icon = button.querySelector("img");
  if (!icon) return;

  const defaultSrc = icon.dataset.iconDefault || icon.getAttribute("src");
  const likedSrc = icon.dataset.iconLiked || defaultSrc;
  const isLiked = button.classList.contains("is-liked");
  icon.setAttribute("src", isLiked ? likedSrc : defaultSrc);
  button.setAttribute("aria-pressed", String(isLiked));
}

function showToast(message, anchor) {
  if (!toast) return;
  window.clearTimeout(toastTimer);
  toast.textContent = message;
  document.body.classList.add("is-toast-showing");

  if (toastAnchor) {
    toastAnchor.classList.remove("is-toast-suppressed");
  }

  toastAnchor = anchor || null;
  toastAnchor?.classList.add("is-toast-suppressed");

  if (anchor) {
    const rect = anchor.getBoundingClientRect();
    toast.style.left = `${rect.left + rect.width / 2}px`;
    toast.style.top = `${rect.top - 14}px`;
    toast.style.bottom = "auto";
  } else {
    toast.style.left = "50%";
    toast.style.top = "auto";
    toast.style.bottom = "34px";
  }

  toast.classList.add("is-visible");
  toastTimer = window.setTimeout(() => {
    toast.classList.remove("is-visible");
    document.body.classList.remove("is-toast-showing");
    toastAnchor?.classList.remove("is-toast-suppressed");
    toastAnchor = null;
  }, 2200);
}

async function copyCurrentUrl(anchor) {
  const shareUrl = window.location.href;

  try {
    await navigator.clipboard.writeText(shareUrl);
    showToast("网站链接已复制", anchor);
  } catch (error) {
    const input = document.createElement("input");
    input.value = shareUrl;
    document.body.appendChild(input);
    input.select();
    document.execCommand("copy");
    input.remove();
    showToast("网站链接已复制", anchor);
  }
}

function openModal() {
  if (!modal) return;
  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
}

function closeModal() {
  if (!modal) return;
  modal.classList.remove("is-open");
  modal.setAttribute("aria-hidden", "true");
}

document.addEventListener("click", (event) => {
  const actionElement = event.target.closest("[data-action]");
  const toastElement = event.target.closest("[data-toast]");

  if (toastElement) {
    showToast(toastElement.dataset.toast, toastElement);
  }

  if (!actionElement) return;

  const { action } = actionElement.dataset;

  if (action === "share") {
    copyCurrentUrl(actionElement);
  }

  if (action === "like") {
    actionElement.classList.toggle("is-liked");
    updateLikeIcon(actionElement);
    showToast("收到你的点赞啦~", actionElement);
  }

  if (action === "contact") {
    openModal();
  }

  if (action === "close-modal") {
    closeModal();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeModal();
  }
});

document.querySelectorAll('.icon-button[data-action="like"]').forEach(updateLikeIcon);

function initCaseTabs() {
  const scrollContainer = document.querySelector(".detail-scroll");
  const tabs = Array.from(document.querySelectorAll("[data-case-tab]"));
  const sections = Array.from(document.querySelectorAll("[data-case-section]"));
  const indicator = document.querySelector(".case-tab-indicator");

  if (!scrollContainer || tabs.length === 0 || sections.length === 0) return;

  function moveIndicator(activeTab) {
    if (!indicator || !activeTab) return;
    const tabRect = activeTab.getBoundingClientRect();
    const parentRect = activeTab.parentElement.getBoundingClientRect();
    const indicatorWidth = indicator.offsetWidth || 62;
    const x = tabRect.left - parentRect.left + tabRect.width / 2 - indicatorWidth / 2;

    indicator.style.transform = `translateX(${x}px)`;
  }

  function setActiveTab(sectionId) {
    tabs.forEach((tab) => {
      const isActive = tab.dataset.caseTab === sectionId;
      tab.classList.toggle("is-active", isActive);
      tab.setAttribute("aria-selected", String(isActive));

      if (isActive) {
        moveIndicator(tab);
      }
    });
  }

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const target = document.getElementById(tab.dataset.caseTab);
      if (!target) return;

      scrollContainer.scrollTo({
        top: target.offsetTop,
        behavior: "smooth",
      });
      setActiveTab(target.id);
    });
  });

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntry = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (visibleEntry) {
          setActiveTab(visibleEntry.target.id);
        }
      },
      {
        root: scrollContainer,
        threshold: [0.32, 0.48, 0.64],
      },
    );

    sections.forEach((section) => observer.observe(section));
  } else {
    scrollContainer.addEventListener("scroll", () => {
      const activeSection = sections.reduce((current, section) => {
        const distance = Math.abs(section.offsetTop - scrollContainer.scrollTop);
        const currentDistance = current
          ? Math.abs(current.offsetTop - scrollContainer.scrollTop)
          : Infinity;
        return distance < currentDistance ? section : current;
      }, null);

      if (activeSection) {
        setActiveTab(activeSection.id);
      }
    });
  }

  moveIndicator(tabs.find((tab) => tab.classList.contains("is-active")) || tabs[0]);
  window.addEventListener("resize", () => {
    moveIndicator(tabs.find((tab) => tab.classList.contains("is-active")) || tabs[0]);
  });
}

function initProjectPageHeader() {
  const main = document.querySelector("main.detail-page, main.jd-case-page");
  if (!main) return;

  const headerHost = main.querySelector(".detail-scroll") || main;
  if (!headerHost || headerHost.querySelector(".project-page-header")) return;

  const headerLink = document.createElement("a");
  headerLink.className = "project-page-header myjd-page-header";
  headerLink.href = "../index.html";
  headerLink.setAttribute("aria-label", "返回首页");
  headerLink.innerHTML =
    '<img src="../assets/jd-case/project-header-myjd.png" alt="DETAILS PAGE 统一版头" />';

  headerHost.prepend(headerLink);
}

function initProjectNavigation() {
  const main = document.querySelector("main.detail-page, main.jd-case-page");
  if (!main) return;
  if (main.hasAttribute("data-disable-project-nav")) return;
  const navHost = main.querySelector(".detail-scroll") || main;

  const currentFile = window.location.pathname.split("/").pop();
  const projectNavigation = {
    "work-myjd.html": {
      next: { file: "work-transaction.html", title: "在京东-交易链路" },
    },
    "work-transaction.html": {
      previous: { file: "work-myjd.html", title: "我京详情页" },
      next: { file: "work-jd.html", title: "在京东-首页节点" },
    },
    "work-jd.html": {
      previous: { file: "work-transaction.html", title: "在京东-交易链路" },
      next: { file: "work-bytedance.html", title: "在字节-幸福里作品" },
    },
    "work-bytedance.html": {
      previous: { file: "work-jd.html", title: "在京东-首页节点" },
      next: { file: "work-selfmedia.html", title: "自媒体探索" },
    },
    "work-selfmedia.html": {
      previous: { file: "work-bytedance.html", title: "在字节-幸福里作品" },
      next: { file: "work-ai-tools.html", title: "AI能力系统提升" },
    },
    "work-ai-tools.html": {
      previous: { file: "work-selfmedia.html", title: "自媒体探索" },
      next: { file: "../index.html#more-works", title: "去看看 More Works", hidePrefix: true },
    },
    "work-vibecoding.html": {
      previous: { file: "work-ai-tools.html", title: "AI能力系统提升" },
      next: { file: "work-widgets.html", title: "轻量桌面组件" },
    },
    "work-widgets.html": {
      previous: { file: "work-vibecoding.html", title: "Vibecoding 探索" },
      next: { title: "No More Projects", disabled: true },
    },
    "work-c4d.html": {
      previous: { file: "work-widgets.html", title: "轻量桌面组件" },
      next: { file: "../index.html#more-works", title: "去看看 More Works" },
    },
    "more-2020-bill.html": {
      next: { file: "more-app-13.html", title: "京东APP13.0" },
    },
    "more-app-13.html": {
      previous: { file: "more-2020-bill.html", title: "年度账单" },
      next: { file: "more-3d-library.html", title: "3D素材库" },
    },
    "more-3d-library.html": {
      previous: { file: "more-app-13.html", title: "京东APP13.0" },
      next: { file: "more-widgets.html", title: "小组件/表盘设计" },
    },
    "more-widgets.html": {
      previous: { file: "more-3d-library.html", title: "3D素材库" },
      next: { title: "No More Projects", disabled: true },
    },
    "more-resource-upgrade.html": {
      previous: { file: "more-widgets.html", title: "小组件/表盘设计" },
      next: { file: "more-plus-card.html", title: "PLUS卡片改版研究" },
    },
    "more-plus-card.html": {
      previous: { file: "more-resource-upgrade.html", title: "15.0资源位升级" },
      next: { file: "more-transaction.html", title: "交易链路" },
    },
    "more-transaction.html": {
      previous: { file: "more-plus-card.html", title: "PLUS卡片改版研究" },
      next: { file: "../index.html#more-works", title: "回到 More Works" },
    },
    "project-01.html": {
      next: { file: "project-02.html", title: "设计系统搭建" },
    },
    "project-02.html": {
      previous: { file: "project-01.html", title: "复杂流程体验重构" },
      next: { file: "project-03.html", title: "品牌视觉与活动页" },
    },
    "project-03.html": {
      previous: { file: "project-02.html", title: "设计系统搭建" },
      next: { file: "project-04.html", title: "移动端产品设计" },
    },
    "project-04.html": {
      previous: { file: "project-03.html", title: "品牌视觉与活动页" },
      next: { file: "../index.html", title: "回到首页" },
    },
    "visual.html": {
      next: { file: "research.html", title: "调研与洞察" },
    },
    "research.html": {
      previous: { file: "visual.html", title: "视觉探索" },
      next: { file: "prototype.html", title: "原型与验证" },
    },
    "prototype.html": {
      previous: { file: "research.html", title: "调研与洞察" },
      next: { file: "about.html", title: "关于张玉杰" },
    },
    "about.html": {
      previous: { file: "prototype.html", title: "原型与验证" },
      next: { file: "../index.html", title: "回到首页" },
    },
  };
  const navigationState = projectNavigation[currentFile];

  if (!navigationState) return;

  const bottomNav = document.createElement("nav");
  bottomNav.className = "transaction-detail-nav project-bottom-nav";
  bottomNav.setAttribute("aria-label", "相邻项目导航");
  bottomNav.innerHTML = `
    <button class="transaction-detail-nav-button transaction-detail-nav-button--prev project-nav-button project-nav-prev" type="button" data-project-nav="prev">
      <span class="transaction-detail-nav-icon transaction-detail-nav-icon--prev project-nav-icon project-nav-icon--prev" aria-hidden="true">
        <img class="transaction-detail-nav-icon-default project-nav-icon-default" src="../assets/jd-case/nav-prev.png" alt="" />
        <img class="transaction-detail-nav-icon-hover project-nav-icon-hover" src="../assets/jd-case/nav-next-hover.png" alt="" />
      </span>
      <span class="transaction-detail-nav-copy project-nav-copy"><small>上一个项目</small><strong></strong></span>
    </button>
    <button class="transaction-detail-nav-button transaction-detail-nav-button--next project-nav-button project-nav-next" type="button" data-project-nav="next">
      <span class="transaction-detail-nav-copy project-nav-copy"><small>Next:</small><strong></strong></span>
      <span class="transaction-detail-nav-icon project-nav-icon" aria-hidden="true">
        <img class="transaction-detail-nav-icon-default project-nav-icon-default" src="../assets/jd-case/nav-next.png" alt="" />
        <img class="transaction-detail-nav-icon-hover project-nav-icon-hover" src="../assets/jd-case/nav-next-hover.png" alt="" />
      </span>
    </button>
  `;
  navHost.appendChild(bottomNav);

  const previousButton = bottomNav.querySelector(".project-nav-prev");
  const nextButton = bottomNav.querySelector(".project-nav-next");

  function setButtonContent(button, label, hidden = false) {
    button.hidden = hidden;
    button.disabled = hidden;
    const labelElement = button.querySelector("strong");
    labelElement.textContent = button.dataset.projectNav === "prev" ? "" : label || "";
    labelElement.hidden = button.dataset.projectNav === "prev" || !label;
  }

  function bindProjectButton(button, target, fallbackHidden = false) {
    if (!target) {
      setButtonContent(button, "", fallbackHidden);
      return;
    }

    setButtonContent(button, target.title, false);
    if (target.hidePrefix) {
      const small = button.querySelector("small");
      if (small) {
        small.textContent = "";
        small.hidden = true;
      }
    }
    button.disabled = Boolean(target.disabled);
    button.classList.toggle("is-disabled", Boolean(target.disabled));
    if (target.disabled) {
      const small = button.querySelector("small");
      const strong = button.querySelector("strong");
      const icon = button.querySelector(".project-nav-icon, .transaction-detail-nav-icon");
      if (small) small.textContent = target.title || "";
      if (strong) {
        strong.textContent = "";
        strong.hidden = true;
      }
      if (icon) icon.hidden = true;
      return;
    }
    if (!target.disabled && target.file) {
      button.addEventListener("click", () => {
        window.location.href = target.file;
      });
    }
  }

  bindProjectButton(previousButton, navigationState.previous, true);

  if (navigationState.next?.disabled) {
    bindProjectButton(nextButton, { title: "No More Projects", disabled: true }, false);
  } else {
    bindProjectButton(nextButton, navigationState.next, true);
  }
}

initProjectPageHeader();
initProjectNavigation();

function runTypewriter() {
  if (!typewriter) return;

  const text = typewriter.dataset.typewriter || "";
  const typeSpeed = 150;
  const holdTime = 3000;
  let index = 0;

  function typeNext() {
    typewriter.textContent = text.slice(0, index);
    index += 1;

    if (index <= text.length) {
      window.setTimeout(typeNext, typeSpeed);
      return;
    }

    window.setTimeout(() => {
      index = 0;
      typewriter.textContent = "";
      window.setTimeout(typeNext, 280);
    }, holdTime);
  }

  typewriter.textContent = "";
  typeNext();
}

runTypewriter();
