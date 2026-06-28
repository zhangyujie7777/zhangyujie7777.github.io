const toast = document.querySelector(".toast");
const modal = document.querySelector(".modal");
let typewriter = document.querySelector("[data-typewriter]");
let toastTimer;
let toastAnchor;

function getMotionContext() {
  const prefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  const hasGsap = Boolean(window.gsap);
  return {
    prefersReducedMotion,
    hasGsap,
    canAnimate: !prefersReducedMotion && hasGsap,
  };
}

function easeOutCubic(progress) {
  return 1 - Math.pow(1 - progress, 3);
}

function initDiscParticles() {
  const canvas = document.querySelector("[data-disc-particles]");
  const source = document.querySelector(".home-disc-stage__particle-source");
  const stage = document.querySelector(".home-disc-stage");
  const rotor = document.querySelector(".home-disc-stage__rotor");
  if (!canvas || !source || !stage) return;

  const context = canvas.getContext("2d");
  if (!context) return;
  if (typeof context.getImageData !== "function") {
    stage.classList.add("is-particles-fallback");
    canvas.dataset.particleError = "canvas-image-data-unsupported";
    return;
  }

  const prefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  const pointer = { x: 0, y: 0, active: false };
  const particleFrameSize = 314;
  const overlayElements = Array.from(stage.querySelectorAll("[data-disc-overlay]"));
  const state = {
    overlays: [],
    particles: [],
    raf: 0,
    running: false,
    visible: true,
    inViewport: true,
    startTime: 0,
    width: 0,
    height: 0,
    dpr: 1,
    particleSize: 3.1,
    ready: false,
    resizeTimer: 0,
  };

  if (prefersReducedMotion) {
    stage.classList.add("is-particles-fallback");
    canvas.dataset.particleError = "reduced-motion";
    return;
  }

  function drawSourceToOffscreen(width, height) {
    const offscreen = document.createElement("canvas");
    offscreen.width = width;
    offscreen.height = height;
    const offscreenContext = offscreen.getContext("2d", { willReadFrequently: true });
    if (!offscreenContext) return null;
    offscreenContext.clearRect(0, 0, width, height);
    offscreenContext.drawImage(source, 0, 0, width, height);
    return offscreenContext.getImageData(0, 0, width, height);
  }

  function findSourceBounds(imageData, width, height) {
    const data = imageData.data;
    let minX = width;
    let minY = height;
    let maxX = 0;
    let maxY = 0;

    for (let y = 0; y < height; y += 2) {
      for (let x = 0; x < width; x += 2) {
        const index = (y * width + x) * 4;
        if (data[index + 3] <= 80) continue;

        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }

    if (minX > maxX || minY > maxY) {
      return {
        x: 0,
        y: 0,
        size: Math.min(width, height),
      };
    }

    const boundsWidth = maxX - minX + 1;
    const boundsHeight = maxY - minY + 1;
    const size = Math.max(boundsWidth, boundsHeight);

    return {
      x: Math.max(0, Math.round(minX + boundsWidth / 2 - size / 2)),
      y: Math.max(0, Math.round(minY + boundsHeight / 2 - size / 2)),
      size: Math.min(size, width, height),
    };
  }

  function useFallback(reason) {
    stop();
    state.ready = false;
    state.particles = [];
    stage.classList.add("is-particles-fallback");
    stage.classList.remove("is-particles-ready");
    canvas.dataset.particleError = reason;
  }

  function getOverlayGeometry(element, size) {
    const scale = size / particleFrameSize;
    return {
      x: Number(element.dataset.overlayX) * scale,
      y: Number(element.dataset.overlayY) * scale,
      width: Number(element.dataset.overlayW) * scale,
      height: Number(element.dataset.overlayH) * scale,
    };
  }

  function getBuildContext() {
    const buildStartedAt = performance.now();
    const configuredSize = Number(canvas.dataset.particleSize);
    const cssWidth = parseFloat(window.getComputedStyle(canvas).width);
    const size = Math.max(1, Math.round(configuredSize || cssWidth || particleFrameSize));
    if (!size || !Number.isFinite(size)) {
      return null;
    }

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const isMobile = window.matchMedia("(max-width: 700px)").matches;
    const isTablet = window.matchMedia("(min-width: 701px) and (max-width: 1024px)").matches;
    const lowPower =
      window.navigator.hardwareConcurrency && window.navigator.hardwareConcurrency <= 4;
    const isHighPerformance = !isMobile && !isTablet && !lowPower && dpr <= 2;
    let sampleStep = isMobile ? 7 : isTablet ? 6 : lowPower ? 5 : isHighPerformance ? 3 : 4;
    const particleSize = isMobile || isTablet ? 6.6 : isHighPerformance ? 5.0 : 5.6;
    const particleLimit = isMobile || isTablet ? 3200 : 9000;
    const targetParticleCount = isMobile
      ? 2200
      : isTablet
        ? 2800
        : lowPower
          ? 5200
          : isHighPerformance
            ? 8600
            : 7600;

    canvas.width = Math.round(size * dpr);
    canvas.height = Math.round(size * dpr);
    context.setTransform(dpr, 0, 0, dpr, 0, 0);

    return {
      buildStartedAt,
      dpr,
      isHighPerformance,
      isMobile,
      isTablet,
      particleLimit,
      particleSize,
      sampleStep,
      size,
      targetParticleCount,
    };
  }

  function createParticle(targetX, targetY, red, green, blue, alpha, isMobile, size = null) {
    const offset = 30 + Math.random() * 50;
    const angle = Math.random() * Math.PI * 2;
    return {
      x: targetX + Math.cos(angle) * offset,
      y: targetY + Math.sin(angle) * offset,
      targetX,
      targetY,
      vx: 0,
      vy: 0,
      color: `rgba(${red}, ${green}, ${blue}, ${alpha})`,
      alpha: 0,
      phase: Math.random() * Math.PI * 2,
      size,
      drift: isMobile ? 0.2 + Math.random() * 0.45 : 0.3 + Math.random() * 0.8,
    };
  }

  function syncOverlayState(size) {
    const previousOverlays = state.overlays;
    state.overlays = overlayElements.map((element, index) => {
      const geometry = getOverlayGeometry(element, size);
      const previous = previousOverlays[index];
      const introOffset = 16 + Math.random() * 20;
      const introAngle = Math.random() * Math.PI * 2;

      element.style.left = `${geometry.x}px`;
      element.style.top = `${geometry.y}px`;
      element.style.width = `${geometry.width}px`;
      element.style.height = `${geometry.height}px`;

      return {
        element,
        targetX: geometry.x,
        targetY: geometry.y,
        width: geometry.width,
        height: geometry.height,
        offsetX: previous?.offsetX ?? Math.cos(introAngle) * introOffset,
        offsetY: previous?.offsetY ?? Math.sin(introAngle) * introOffset,
        vx: previous?.vx ?? 0,
        vy: previous?.vy ?? 0,
        phase: previous?.phase ?? Math.random() * Math.PI * 2,
        drift: 0.38 + Math.random() * 0.65,
      };
    });
  }

  function completeBuild(particles, buildContext, meta = {}) {
    state.particles = particles;
    state.width = buildContext.size;
    state.height = buildContext.size;
    state.dpr = buildContext.dpr;
    state.particleSize = buildContext.particleSize;
    state.startTime = performance.now();
    syncOverlayState(buildContext.size);
    canvas.dataset.particleCount = String(particles.length);
    canvas.dataset.particleStep = String(buildContext.sampleStep);
    if (meta.sourceBounds) {
      canvas.dataset.particleSourceBounds = meta.sourceBounds;
    }

    if (!particles.length) {
      useFallback("empty-particles");
      return false;
    }
    if (particles.length > buildContext.particleLimit) {
      useFallback("particle-limit-exceeded");
      return false;
    }
    if (particles.length < (buildContext.isMobile || buildContext.isTablet ? 700 : 2200)) {
      useFallback("too-few-particles");
      return false;
    }
    if (performance.now() - buildContext.buildStartedAt > 320) {
      useFallback("init-budget-exceeded");
      return false;
    }

    render(performance.now());
    state.ready = true;
    stage.classList.remove("is-particles-fallback");
    stage.classList.add("is-particles-ready");
    delete canvas.dataset.particleError;
    return true;
  }

  function buildParticlesFromImage() {
    const buildContext = getBuildContext();
    if (!buildContext) {
      useFallback("invalid-size");
      return false;
    }

    let sampleStep = Math.max(2, Math.min(buildContext.sampleStep, buildContext.isHighPerformance ? 2 : 3));
    let imageData;
    try {
      imageData = drawSourceToOffscreen(source.naturalWidth, source.naturalHeight);
    } catch (error) {
      useFallback("image-data-blocked");
      return false;
    }
    if (!imageData) {
      useFallback("image-data-unavailable");
      return false;
    }

    const sourceBounds = findSourceBounds(imageData, source.naturalWidth, source.naturalHeight);
    const data = imageData.data;
    let particles = [];

    function createParticles(step) {
      const nextParticles = [];
      const sourceScale = sourceBounds.size / buildContext.size;

      for (let y = 0; y < buildContext.size; y += step) {
        for (let x = 0; x < buildContext.size; x += step) {
          const dx = x - buildContext.size / 2;
          const dy = y - buildContext.size / 2;
          if (dx * dx + dy * dy > (buildContext.size / 2) * (buildContext.size / 2)) continue;

          const sourceX = Math.min(
            source.naturalWidth - 1,
            Math.max(0, Math.round(sourceBounds.x + x * sourceScale)),
          );
          const sourceY = Math.min(
            source.naturalHeight - 1,
            Math.max(0, Math.round(sourceBounds.y + y * sourceScale)),
          );
          if (
            sourceX < sourceBounds.x ||
            sourceX >= sourceBounds.x + sourceBounds.size ||
            sourceY < sourceBounds.y ||
            sourceY >= sourceBounds.y + sourceBounds.size
          ) {
            continue;
          }

          const index = (sourceY * source.naturalWidth + sourceX) * 4;
          const alpha = data[index + 3];
          if (alpha <= 66) continue;
          if (Math.max(data[index], data[index + 1], data[index + 2]) <= 14) continue;

          nextParticles.push(
            createParticle(x, y, data[index], data[index + 1], data[index + 2], alpha / 255, buildContext.isMobile),
          );
        }
      }

      return nextParticles;
    }

    for (let attempt = 0; attempt < 4; attempt += 1) {
      particles = createParticles(sampleStep);
      if (particles.length <= buildContext.particleLimit) break;
      sampleStep = Math.max(2, sampleStep - 1);
    }
    buildContext.sampleStep = sampleStep;

    const completed = completeBuild(particles, buildContext, {
      sourceBounds: `${sourceBounds.x},${sourceBounds.y},${sourceBounds.size}`,
    });
    if (completed) canvas.dataset.particleSource = "image";
    return completed;
  }

  function buildParticlesFromData(payload, sourceType = "data") {
    const buildContext = getBuildContext();
    if (!buildContext) {
      useFallback("invalid-size");
      return false;
    }

    const dataSize = payload?.size || particleFrameSize;
    const sourceParticles = Array.isArray(payload?.particles) ? payload.particles : [];
    const scale = buildContext.size / dataSize;
    const sourceStep = payload?.sampleStep || buildContext.sampleStep;
    const targetStep = buildContext.sampleStep;
    const targetCount = Math.min(sourceParticles.length, buildContext.targetParticleCount);
    const particles = [];

    for (let index = 0; index < targetCount; index += 1) {
      const sourceIndex = Math.min(
        sourceParticles.length - 1,
        Math.floor((index * sourceParticles.length) / targetCount),
      );
      const particle = sourceParticles[sourceIndex];
      const [x, y, red, green, blue, alpha] = particle;
      particles.push(
        createParticle(x * scale, y * scale, red, green, blue, alpha, buildContext.isMobile),
      );
    }

    buildContext.sampleStep = Math.max(sourceStep, targetStep);

    const completed = completeBuild(particles, buildContext, {
      sourceBounds: Array.isArray(payload?.sourceBounds) ? payload.sourceBounds.join(",") : "",
    });
    if (completed) canvas.dataset.particleSource = sourceType;
    return completed;
  }

  async function buildParticles() {
    if (window.DISC_PARTICLE_DATA && buildParticlesFromData(window.DISC_PARTICLE_DATA, "script-data")) return;

    const dataUrl = canvas.dataset.particleData;
    if (dataUrl && window.fetch) {
      try {
        const response = await fetch(dataUrl, { cache: "force-cache" });
        if (response.ok && buildParticlesFromData(await response.json(), "fetch-data")) return;
      } catch (error) {
        canvas.dataset.particleDataError = "unavailable";
      }
    }

    buildParticlesFromImage();
  }

  function render(time) {
    context.clearRect(0, 0, state.width, state.height);
    const introProgress = Math.min(1, (time - state.startTime) / 2200);
    const introEase = easeOutCubic(introProgress);
    const isMobile = window.matchMedia("(max-width: 700px)").matches;
    const radius = isMobile ? 56 : 92;
    const radiusSquared = radius * radius;
    const force = isMobile ? 1.45 : pointer.active ? 2.25 : 1.1;
    const spring = pointer.active ? 0.075 : 0.055;
    const friction = pointer.active ? 0.86 : 0.9;
    const particleSize = state.particleSize || (isMobile ? 7.2 : 6.2);
    const driftTime = time * 0.00055;

    state.particles.forEach((particle) => {
      const driftX = Math.cos(driftTime + particle.phase) * particle.drift;
      const driftY = Math.sin(driftTime * 1.1 + particle.phase) * particle.drift;
      let targetX = particle.targetX + driftX;
      let targetY = particle.targetY + driftY;

      if (pointer.active) {
        const dx = particle.x - pointer.x;
        const dy = particle.y - pointer.y;
        const distanceSquared = dx * dx + dy * dy;
        if (distanceSquared < radiusSquared && distanceSquared > 0.01) {
          const distance = Math.sqrt(distanceSquared);
          const push = (1 - distance / radius) * force;
          targetX += (dx / distance) * push * 16;
          targetY += (dy / distance) * push * 16;
        }
      }

      particle.vx += (targetX - particle.x) * spring;
      particle.vy += (targetY - particle.y) * spring;
      particle.vx *= friction;
      particle.vy *= friction;
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.alpha += (introEase - particle.alpha) * 0.08;

      context.globalAlpha = Math.max(0, Math.min(1, particle.alpha));
      context.fillStyle = particle.color;
      const size = particle.size || particleSize;
      context.fillRect(
        Math.round(particle.x),
        Math.round(particle.y),
        size,
        size,
      );
    });
    context.globalAlpha = 1;

    state.overlays.forEach((overlay) => {
      const driftX = Math.cos(driftTime + overlay.phase) * overlay.drift;
      const driftY = Math.sin(driftTime * 1.08 + overlay.phase) * overlay.drift;
      let targetOffsetX = driftX;
      let targetOffsetY = driftY;

      if (pointer.active) {
        const centerX = overlay.targetX + overlay.width / 2 + overlay.offsetX;
        const centerY = overlay.targetY + overlay.height / 2 + overlay.offsetY;
        const dx = centerX - pointer.x;
        const dy = centerY - pointer.y;
        const distanceSquared = dx * dx + dy * dy;
        if (distanceSquared < radiusSquared && distanceSquared > 0.01) {
          const distance = Math.sqrt(distanceSquared);
          const push = (1 - distance / radius) * force;
          targetOffsetX += (dx / distance) * push * 18;
          targetOffsetY += (dy / distance) * push * 18;
        }
      }

      overlay.vx += (targetOffsetX - overlay.offsetX) * spring;
      overlay.vy += (targetOffsetY - overlay.offsetY) * spring;
      overlay.vx *= friction;
      overlay.vy *= friction;
      overlay.offsetX += overlay.vx;
      overlay.offsetY += overlay.vy;
      overlay.element.style.transform = `translate3d(${Math.round(overlay.offsetX)}px, ${Math.round(overlay.offsetY)}px, 0)`;
    });
  }

  function animate(time) {
    if (!state.running) return;
    render(time);
    state.raf = window.requestAnimationFrame(animate);
  }

  function start() {
    if (state.running || !state.ready || !state.visible || !state.inViewport) return;
    state.running = true;
    state.raf = window.requestAnimationFrame(animate);
  }

  function stop() {
    state.running = false;
    window.cancelAnimationFrame(state.raf);
  }

  function updatePointer(event) {
    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) * (state.width / rect.width);
    const y = (event.clientY - rect.top) * (state.height / rect.height);
    pointer.x = x;
    pointer.y = y;
    pointer.active = x >= 0 && x <= state.width && y >= 0 && y <= state.height;
  }

  function leavePointer() {
    pointer.active = false;
  }

  function scheduleRebuild() {
    window.clearTimeout(state.resizeTimer);
    state.resizeTimer = window.setTimeout(() => {
      buildParticles();
      if (!prefersReducedMotion) start();
    }, 120);
  }

  stage.addEventListener("pointermove", updatePointer);
  stage.addEventListener("pointerleave", leavePointer);
  window.addEventListener("resize", scheduleRebuild);
  document.addEventListener("visibilitychange", () => {
    state.visible = !document.hidden;
    if (state.visible) start();
    else stop();
  });

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      ([entry]) => {
        state.inViewport = entry.isIntersecting;
        if (state.inViewport) start();
        else stop();
      },
      { threshold: 0.08 },
    );
    observer.observe(stage);
  }

  function initFromImage() {
    buildParticles();
    if (!prefersReducedMotion) start();
  }

  if (source.complete && source.naturalWidth) {
    initFromImage();
  } else {
    source.addEventListener("load", initFromImage, { once: true });
  }
}

function initHomeMotion() {
  const homeBody = document.querySelector(".home-body");
  if (!homeBody) return;

  const { prefersReducedMotion, canAnimate } = getMotionContext();
  const preloader = document.querySelector("[data-preloader]");
  const preloaderTiles = Array.from(document.querySelectorAll(".site-preloader__tile"));
  const preloaderLoader = preloader?.querySelector("[data-preloader-loader]");
  const preloaderLabel = preloader?.querySelector(".site-preloader__label");
  const hero = document.querySelector("[data-hero-reveal]");
  const heroItems = Array.from(document.querySelectorAll("[data-hero-reveal-item]"));
  const revealGroups = Array.from(document.querySelectorAll("[data-reveal-group]"));
  const groupedRevealItems = new Set(
    revealGroups.flatMap((group) => Array.from(group.querySelectorAll("[data-reveal-item]"))),
  );
  const revealElements = Array.from(document.querySelectorAll("[data-reveal]")).filter(
    (element) => element !== hero,
  );
  const standaloneRevealElements = revealElements.filter(
    (element) => !groupedRevealItems.has(element),
  );
  const revealTargets = Array.from(new Set([...revealElements, ...groupedRevealItems]));
  const shouldSkipPreloader = Boolean(
    window.__PORTFOLIO_SKIP_PRELOADER__ ||
      document.documentElement.classList.contains("is-home-return"),
  );

  function markHomePreloaderSeen() {
    try {
      window.sessionStorage?.setItem("portfolioHomePreloaderSeen", "1");
    } catch (error) {
      // Session storage may be unavailable in strict privacy modes.
    }
  }

  function showRevealTargets() {
    [hero, ...heroItems, ...revealTargets].filter(Boolean).forEach((element) => {
      element.style.opacity = "";
      element.style.visibility = "";
      element.style.transform = "";
      element.style.filter = "";
      element.style.willChange = "auto";
    });
  }

  function showHeroImmediately() {
    [hero, ...heroItems].filter(Boolean).forEach((element) => {
      element.style.opacity = "";
      element.style.visibility = "";
      element.style.transform = "";
      element.style.filter = "";
      element.style.willChange = "auto";
    });
  }

  if (prefersReducedMotion || !canAnimate) {
    markHomePreloaderSeen();
    preloader?.remove();
    showRevealTargets();
    return;
  }

  const { gsap, ScrollTrigger } = window;
  if (ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
  }

  revealTargets.forEach((element) => {
    const isCard = element.hasAttribute("data-reveal-card");
    gsap.set(element, {
      autoAlpha: 0,
      y: window.matchMedia("(max-width: 700px)").matches ? 30 : isCard ? 56 : 48,
    });
  });

  if (shouldSkipPreloader) {
    markHomePreloaderSeen();
    preloader?.remove();
    showHeroImmediately();
    initScrollReveals();
    window.setTimeout(() => ScrollTrigger?.refresh(), 80);
    return;
  }

  gsap.set(heroItems.length ? heroItems : hero, { autoAlpha: 0, y: 36 });

  gsap.set(preloaderTiles, {
    yPercent: 0,
    autoAlpha: 1,
    transformOrigin: "top center",
  });

  function revealHero() {
    if (!hero) return;
    gsap.to(heroItems.length ? heroItems : hero, {
      autoAlpha: 1,
      y: 0,
      duration: window.matchMedia("(max-width: 700px)").matches ? 0.72 : 0.9,
      stagger: heroItems.length ? 0.08 : 0,
      ease: "power3.out",
      clearProps: "willChange,transform,opacity,visibility",
    });
  }

  function initScrollReveals() {
    if (!ScrollTrigger) {
      revealTargets.forEach((element, index) => {
        gsap.to(element, {
          autoAlpha: 1,
          y: 0,
          duration: 0.75,
          delay: index * 0.05,
          ease: "power3.out",
          clearProps: "willChange,transform,opacity,visibility",
        });
      });
      return;
    }

    const isMobile = window.matchMedia("(max-width: 700px)").matches;

    revealGroups.forEach((group) => {
      const items = Array.from(group.querySelectorAll("[data-reveal-item]"));
      if (!items.length) return;

      gsap.to(items, {
        autoAlpha: 1,
        y: 0,
        duration: isMobile ? 0.7 : 0.95,
        stagger: isMobile ? 0.06 : 0.1,
        ease: "power3.out",
        clearProps: "willChange,transform,opacity,visibility",
        scrollTrigger: {
          trigger: group,
          start: "top 84%",
          once: true,
          toggleActions: "play none none none",
        },
      });
    });

    standaloneRevealElements.forEach((element) => {
      const isCard = element.hasAttribute("data-reveal-card");
      gsap.to(element, {
        autoAlpha: 1,
        y: 0,
        duration: isMobile ? 0.7 : isCard ? 0.95 : 0.85,
        ease: "power3.out",
        clearProps: "willChange,transform,opacity,visibility",
        scrollTrigger: {
          trigger: element,
          start: isCard ? "top 84%" : "top 86%",
          once: true,
          toggleActions: "play none none none",
        },
      });
    });
  }

  const startedAt = performance.now();
  let loadComplete = document.readyState === "complete";
  let hasExited = false;

  function removePreloader() {
    preloader?.remove();
  }

  function exitPreloader() {
    if (hasExited) return;
    hasExited = true;

    if (!preloader || !preloaderTiles.length) {
      markHomePreloaderSeen();
      revealHero();
      initScrollReveals();
      return;
    }

    gsap.killTweensOf([preloaderTiles, preloaderLoader, preloaderLabel]);

    const preloaderTimeline = gsap.timeline({
      onComplete: () => {
        markHomePreloaderSeen();
        removePreloader();
        revealHero();
        initScrollReveals();
        window.setTimeout(() => ScrollTrigger?.refresh(), 80);
      },
    });

    preloaderTimeline
      .to(preloaderLoader, {
        autoAlpha: 0,
        y: -8,
        duration: 0.28,
        ease: "power2.out",
      })
      .to({}, { duration: 0.22 })
      .set(preloader, { backgroundColor: "transparent" })
      .to(preloaderTiles, {
        yPercent: 100,
        duration: 0.9,
        stagger: {
          each: 0.055,
          from: "start",
        },
        ease: "power4.inOut",
      });
  }

  function maybeExitPreloader() {
    if (!loadComplete) return;
    const elapsed = performance.now() - startedAt;
    window.setTimeout(exitPreloader, Math.max(0, 800 - elapsed));
  }

  window.addEventListener(
    "load",
    () => {
      loadComplete = true;
      maybeExitPreloader();
    },
    { once: true },
  );

  window.setTimeout(() => {
    loadComplete = true;
    maybeExitPreloader();
  }, 2500);

  maybeExitPreloader();

  window.setTimeout(() => {
    if (!hasExited) {
      markHomePreloaderSeen();
      preloader?.remove();
      showRevealTargets();
    }
  }, 3200);
}

function initDetailMotion() {
  const detailPage = document.querySelector("main.jd-case-page, main.detail-page");
  const detailScroll = detailPage?.querySelector(".detail-scroll");
  if (!detailPage || !detailScroll || document.body.classList.contains("home-body")) return;

  const { prefersReducedMotion } = getMotionContext();
  if (prefersReducedMotion) return;

  const primedElements = new Set();
  const revealActions = new Map();

  function primeElement(element, offset = 26) {
    if (!element || primedElements.has(element)) return;
    primedElements.add(element);
    element.style.opacity = "0";
    element.style.visibility = "hidden";
    element.style.transform = `translate3d(0, ${offset}px, 0)`;
    element.style.transition =
      "transform 0.62s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.62s cubic-bezier(0.22, 1, 0.36, 1), visibility 0s linear 0s";
    element.style.willChange = "transform, opacity";
  }

  function clearRevealState() {
    primedElements.forEach((element) => {
      element.style.opacity = "";
      element.style.visibility = "";
      element.style.transform = "";
      element.style.transition = "";
      element.style.willChange = "auto";
    });
  }

  function revealElement(element) {
    element.style.opacity = "1";
    element.style.visibility = "visible";
    element.style.transform = "translate3d(0, 0, 0)";
    window.setTimeout(() => {
      element.style.transition = "";
      element.style.willChange = "auto";
    }, 680);
  }

  function registerSingle(element, offset = 26) {
    if (!element) return;
    primeElement(element, offset);
    revealActions.set(element, () => revealElement(element));
  }

  function registerGroup(trigger, elements, offset = 26, stagger = 72) {
    if (!trigger || !elements.length) return;
    elements.forEach((element) => primeElement(element, offset));
    revealActions.set(trigger, () => {
      elements.forEach((element, index) => {
        window.setTimeout(() => revealElement(element), index * stagger);
      });
    });
  }

  const projects = Array.from(detailScroll.querySelectorAll(".myjd-redo-project"));

  projects.forEach((project) => {
    const projectHead = Array.from(project.children).find((element) =>
      element.classList?.contains("myjd-redo-project-head"),
    );
    registerSingle(projectHead, 24);

    const rows = Array.from(project.children).filter((element) =>
      element.classList?.contains("myjd-redo-row"),
    );

    rows.forEach((row) => {
      const rowHead = Array.from(row.children).find((element) =>
        element.classList?.contains("myjd-redo-row-head"),
      );
      registerSingle(rowHead, 20);

      const rowBlocks = Array.from(row.children).filter(
        (element) => !element.classList?.contains("myjd-redo-row-head"),
      );

      rowBlocks.forEach((block) => {
        if (block.classList.contains("myjd-redo-card-grid")) {
          const cards = Array.from(block.children).filter((element) =>
            element.classList?.contains("myjd-redo-card"),
          );
          registerGroup(block, cards, 24, 64);
          return;
        }

        if (block.classList.contains("myjd-redo-figure-stack")) {
          const figures = Array.from(block.children).filter((element) =>
            element.classList?.contains("myjd-redo-figure"),
          );
          registerGroup(block, figures, 24, 78);
          return;
        }

        if (block.classList.contains("myjd-redo-figure")) {
          registerSingle(block, 24);
        }
      });
    });
  });

  Array.from(
    detailScroll.querySelectorAll(".project-bottom-nav, .transaction-detail-nav"),
  ).forEach((element) => registerSingle(element, 18));

  if (!primedElements.size || !revealActions.size) return;

  if (!("IntersectionObserver" in window)) {
    clearRevealState();
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const reveal = revealActions.get(entry.target);
        reveal?.();
        observer.unobserve(entry.target);
      });
    },
    {
      root: null,
      threshold: 0.01,
      rootMargin: "0px 0px 12% 0px",
    },
  );

  Array.from(revealActions.keys()).forEach((trigger) => {
    const rect = trigger.getBoundingClientRect();
    if (rect.top < window.innerHeight * 1.02) {
      requestAnimationFrame(() => revealActions.get(trigger)?.());
      return;
    }
    observer.observe(trigger);
  });
}

function initHomeReturnLinks() {
  const detailPage = document.querySelector("main.jd-case-page, main.detail-page");
  if (!detailPage || document.body.classList.contains("home-body")) return;

  function markSkipHomeIntroOnce() {
    try {
      window.sessionStorage?.setItem("portfolioSkipHomeIntroOnce", "1");
    } catch (error) {
      // Storage may be unavailable; homepage still has referrer/history fallbacks.
    }
  }

  document.addEventListener("click", (event) => {
    const anchor = event.target.closest('a[href^="../index.html"]');
    if (anchor) {
      markSkipHomeIntroOnce();
    }
  });

  window.__PORTFOLIO_MARK_SKIP_HOME_INTRO__ = markSkipHomeIntroOnce;
}

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

async function downloadLinkedFile(anchor) {
  if (!(anchor instanceof HTMLAnchorElement)) return;

  const href = anchor.getAttribute("href");
  if (!href) return;

  const filename = anchor.getAttribute("download") || "download";
  const fileUrl = new URL(href, window.location.href).toString();

  try {
    const response = await fetch(fileUrl, { credentials: "same-origin" });
    if (!response.ok) throw new Error(`Download failed: ${response.status}`);

    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    const tempLink = document.createElement("a");
    tempLink.href = blobUrl;
    tempLink.download = filename;
    tempLink.style.display = "none";
    document.body.appendChild(tempLink);
    tempLink.click();
    tempLink.remove();

    window.setTimeout(() => {
      URL.revokeObjectURL(blobUrl);
    }, 1000);
  } catch (error) {
    const tempLink = document.createElement("a");
    tempLink.href = fileUrl;
    tempLink.download = filename;
    tempLink.style.display = "none";
    document.body.appendChild(tempLink);
    tempLink.click();
    tempLink.remove();
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

  if (action === "download-resume") {
    event.preventDefault();
    downloadLinkedFile(actionElement);
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
    '<img src="../assets/jd-case/project-header.png" alt="DETAILS PAGE 统一版头" />';

  headerHost.prepend(headerLink);
}

function initProjectNavigation() {
  const main = document.querySelector("main.detail-page, main.jd-case-page");
  if (!main) return;
  if (main.hasAttribute("data-disable-project-nav")) return;
  const isVibecodingHomeNav = main.hasAttribute("data-vibecoding-home-nav");
  const navHost = main.querySelector(".detail-scroll") || main;

  const currentFile = window.location.pathname.split("/").pop();
  const projectNavigation = {
    "work-myjd.html": {
      next: { file: "work-jd.html", title: "在京东-首页作品" },
    },
    "work-jd.html": {
      previous: { file: "work-myjd.html", title: "在京东-我京作品" },
      next: { file: "work-bytedance.html", title: "在字节-幸福里作品" },
    },
    "work-bytedance.html": {
      previous: { file: "work-jd.html", title: "在京东-首页作品" },
      next: { file: "work-selfmedia.html", title: "自媒体探索" },
    },
    "work-selfmedia.html": {
      previous: { file: "work-bytedance.html", title: "在字节-幸福里作品" },
      next: { file: "../index.html#more-works", title: "去看看 More Works", hidePrefix: true },
    },
    "work-vibecoding.html": {
      previous: { file: "work-selfmedia.html", title: "自媒体探索" },
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
      previous: { title: "", disabled: true },
      next: { file: "more-3d-library.html", title: "3D素材库" },
    },
    "more-3d-library.html": {
      previous: { file: "more-2020-bill.html", title: "年度账单" },
      next: { file: "more-app-13.html", title: "京东APP13.0" },
    },
    "more-app-13.html": {
      previous: { file: "more-3d-library.html", title: "3D素材库" },
      next: { file: "more-widgets.html", title: "小组件/表盘设计" },
    },
    "more-widgets.html": {
      previous: { file: "more-app-13.html", title: "京东APP13.0" },
      next: { file: "../index.html#more-works", title: "回到 More Works", hidePrefix: true },
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
      <span class="transaction-detail-nav-copy project-nav-copy"><small hidden></small><strong></strong></span>
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
    const small = button.querySelector("small");
    if (small && button.dataset.projectNav === "next") {
      small.textContent = "";
      small.hidden = true;
    }
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
        if (target.file.startsWith("../index.html")) {
          window.__PORTFOLIO_MARK_SKIP_HOME_INTRO__?.();
        }
        window.location.href = target.file;
      });
    }
  }

  if (isVibecodingHomeNav) {
    const previousSmall = previousButton.querySelector("small");
    const previousStrong = previousButton.querySelector("strong");
    if (previousSmall) {
      previousSmall.textContent = "";
      previousSmall.hidden = true;
    }
    if (previousStrong) {
      previousStrong.textContent = "返回首页";
      previousStrong.hidden = false;
    }
    previousButton.disabled = false;
    previousButton.hidden = false;
    previousButton.classList.remove("is-disabled");
    previousButton.addEventListener("click", () => {
      window.__PORTFOLIO_MARK_SKIP_HOME_INTRO__?.();
      window.location.href = "../index.html";
    });
    nextButton.hidden = true;
    nextButton.disabled = true;
    return;
  }

  bindProjectButton(previousButton, navigationState.previous, true);

  if (navigationState.next?.disabled) {
    bindProjectButton(nextButton, { title: "No More Projects", disabled: true }, false);
  } else {
    bindProjectButton(nextButton, navigationState.next, true);
  }
}

function initMyjdProgressNav() {
  const main = document.querySelector("main.jd-case-page.myjd-redo-page");
  const progressNav = main?.querySelector(".myjd-progress-nav");
  const items = Array.from(main?.querySelectorAll("[data-myjd-progress]") || []);
  const sections = Array.from(main?.querySelectorAll("#jd-myjd > .myjd-redo-project") || []);
  let lockedIndex = -1;
  let releaseLockTimer = 0;

  if (!main || !progressNav || items.length === 0 || sections.length === 0) return;

  function getSectionTop(section) {
    const rect = section.getBoundingClientRect();
    return window.scrollY + rect.top;
  }

  function scrollToSection(index) {
    const section = sections[index];
    if (!section) return;
    lockedIndex = index;
    window.clearTimeout(releaseLockTimer);
    setActive(index);
    window.scrollTo({
      top: getSectionTop(section),
      behavior: "smooth",
    });
    releaseLockTimer = window.setTimeout(() => {
      lockedIndex = -1;
      updateActiveFromScroll();
    }, 520);
  }

  function setActive(index) {
    items.forEach((item) => {
      const isActive = Number(item.dataset.myjdProgress) === index;
      item.classList.toggle("is-active", isActive);
      item.setAttribute("aria-pressed", String(isActive));
    });
  }

  function updateActiveFromScroll() {
    if (lockedIndex >= 0) {
      setActive(lockedIndex);
      return;
    }

    const viewportAnchor = window.scrollY + window.innerHeight * 0.5;
    const activeIndex = sections.reduce((bestIndex, section, index) => {
      const sectionTop = getSectionTop(section);
      const bestTop = bestIndex === -1 ? -Infinity : getSectionTop(sections[bestIndex]);

      if (viewportAnchor >= sectionTop) {
        return sectionTop >= bestTop ? index : bestIndex;
      }

      if (bestIndex !== -1) {
        return bestIndex;
      }

      return index === 0 ? 0 : bestIndex;
    }, -1);

    if (activeIndex >= 0) {
      setActive(activeIndex);
    }
  }

  items.forEach((item) => {
    item.addEventListener("click", () => {
      scrollToSection(Number(item.dataset.myjdProgress));
    });
  });

  let ticking = false;
  function handleScroll() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(() => {
      updateActiveFromScroll();
      ticking = false;
    });
  }

  window.addEventListener("scroll", handleScroll, { passive: true });
  window.addEventListener("resize", updateActiveFromScroll);
  updateActiveFromScroll();
}

initHomeReturnLinks();
initProjectPageHeader();
initProjectNavigation();
initMyjdProgressNav();
initHomeMotion();
initDetailMotion();
initDiscParticles();

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
