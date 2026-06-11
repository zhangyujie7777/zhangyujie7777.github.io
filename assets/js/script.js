const toast = document.querySelector(".toast");
const modal = document.querySelector(".modal");
const typewriter = document.querySelector("[data-typewriter]");
let toastTimer;

function showToast(message, anchor) {
  if (!toast) return;
  window.clearTimeout(toastTimer);
  toast.textContent = message;

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
  }, 2200);
}

async function copyCurrentUrl(anchor) {
  const shareUrl = window.location.href;

  try {
    await navigator.clipboard.writeText(shareUrl);
    showToast("链接已经复制成功，可以分享给其他人", anchor);
  } catch (error) {
    const input = document.createElement("input");
    input.value = shareUrl;
    document.body.appendChild(input);
    input.select();
    document.execCommand("copy");
    input.remove();
    showToast("链接已经复制成功，可以分享给其他人", anchor);
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
    showToast("你的点赞设计师收到啦，非常感谢", actionElement);
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

initCaseTabs();
runTypewriter();
