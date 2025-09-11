/* App JS: menu mobile, carrousel, i18n */
(function () {
  // Helpers
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  // i18n dictionaries will be loaded dynamically
  const I18N = {
    fr: null,
    en: null,
    ta: null,
  };
  let currentLang = localStorage.getItem("lang") || "fr";

  function applyTranslations(dict) {
    if (!dict) return;
    // text content
    $$("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      const val = key
        .split(".")
        .reduce((acc, k) => (acc ? acc[k] : undefined), dict);
      if (typeof val === "string") {
        el.textContent = val;
      }
    });
    // aria-label
    $$("[data-i18n-aria-label]").forEach((el) => {
      const key = el.getAttribute("data-i18n-aria-label");
      const val = key
        .split(".")
        .reduce((acc, k) => (acc ? acc[k] : undefined), dict);
      if (typeof val === "string") {
        el.setAttribute("aria-label", val);
      }
    });
    // html lang
    const html = document.documentElement;
    html.setAttribute("lang", dict.__lang || currentLang);

    // Update program header texts if present
    const headerTitle = $('[data-i18n="program.header.title"]');
    const headerMeta = $('[data-i18n="program.header.meta"]');
    if (
      headerTitle &&
      dict.program &&
      dict.program.header &&
      dict.program.header.title
    ) {
      headerTitle.textContent = dict.program.header.title;
    }
    if (
      headerMeta &&
      dict.program &&
      dict.program.header &&
      dict.program.header.meta
    ) {
      headerMeta.textContent = dict.program.header.meta;
    }
    // Re-render program list when language changes
    renderProgram();
  }

  async function loadLang(lang) {
    if (!I18N[lang]) {
      try {
        const res = await fetch(`assets/i18n/${lang}.json`);
        I18N[lang] = await res.json();
      } catch (e) {
        console.error("i18n load error", e);
      }
    }
    applyTranslations(I18N[lang] || {});
  }

  function syncLanguageSelectors(lang) {
    const desktop = $("#langSwitcher");
    const mobile = $("#langSwitcherMobile");
    if (desktop) desktop.value = lang;
    if (mobile) mobile.value = lang;
  }

  function setupLanguage() {
    const desktop = $("#langSwitcher");
    const mobile = $("#langSwitcherMobile");
    const onChange = (e) => {
      currentLang = e.target.value;
      localStorage.setItem("lang", currentLang);
      syncLanguageSelectors(currentLang);
      loadLang(currentLang);
    };
    desktop && desktop.addEventListener("change", onChange);
    mobile && mobile.addEventListener("change", onChange);
    syncLanguageSelectors(currentLang);
    loadLang(currentLang);
  }

  // Program rendering
  function getI18nDict() {
    return I18N[currentLang] || {};
  }

  function renderProgram() {
    const list = document.getElementById("programList");
    const toggle = document.getElementById("programToggle");
    if (!list || !toggle) return;
    const dict = getI18nDict();
    const items = dict.program && dict.program.items ? dict.program.items : [];
    const showLabel =
      (dict.program && dict.program.showAll) || "Voir tout le programme";
    const hideLabel = (dict.program && dict.program.showLess) || "Réduire";
    const maxPreview = 4;
    let expanded = false;

    function card(item, idx) {
      const time = item.time || "";
      const title = item.title || "";
      const content = item.content || "";
      const speakers = item.speakers || "";
      const showContent = content && content !== "—";
      const showSpeakers = speakers && speakers !== "—";
      const delayCls = `delay-${(idx % 3) + 1}`;
      return `
        <article class="p-4 rounded-lg border border-green-100 bg-white hover:bg-green-50 transition-colors reveal ${delayCls}">
          <div class="flex flex-col md:flex-row md:items-start md:justify-between gap-2">
            <div class="min-w-[180px] font-semibold text-green-700" aria-label="time">${time}</div>
            <div class="flex-1">
              <h5 class="text-lg font-semibold text-green-800">${title}</h5>
              ${
                showContent
                  ? `<p class=\"mt-1 text-slate-800\">${content}</p>`
                  : ""
              }
              ${
                showSpeakers
                  ? `<p class=\"mt-1 text-slate-600\"><span class=\"font-medium\">${
                      (dict.program &&
                        dict.program.labels &&
                        dict.program.labels.speakers) ||
                      "Intervenant.e.s"
                    }:</span> ${speakers}</p>`
                  : ""
              }
            </div>
          </div>
        </article>`;
    }

    function render() {
      const visible = expanded ? items : items.slice(0, maxPreview);
      list.innerHTML = visible.map(card).join("");
      toggle.textContent = expanded ? hideLabel : showLabel;
      observeReveals();
    }

    toggle.onclick = () => {
      expanded = !expanded;
      render();
    };
    render();
  }

  // Speakers rendering
  function renderSpeakers() {
    const grids = $$(".speakers-grid");
    if (!grids.length) return;
    const dict = getI18nDict();
    const list =
      dict.speakersSection && dict.speakersSection.list
        ? dict.speakersSection.list
        : [];
    const html = list
      .map((sp, idx) => {
        const delayCls = `delay-${(idx % 3) + 1}`;
        return `<div class="reveal ${delayCls} overflow-hidden rounded-lg bg-white border border-green-100 shadow-sm">
        <div class="p-4">
          <h4 class="text-base font-semibold text-green-800">${
            sp.name || ""
          }</h4>
          <p class="mt-0.5 text-xs uppercase tracking-wide text-green-600">${
            sp.role || ""
          }</p>
        </div>
      </div>`;
      })
      .join("");
    grids.forEach((g) => (g.innerHTML = html));
    observeReveals();
  }

  // Reveal on scroll animations
  function observeReveals() {
    const els = $$(".reveal");
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("reveal-in");
            obs.unobserve(e.target);
          }
        });
      },
      { threshold: 0.1 }
    );
    els.forEach((el) => obs.observe(el));
  }

  function setupMobileMenu() {
    const btn = $("#menuBtn");
    const menu = $("#mobileMenu");
    const iconOpen = $("#iconOpen");
    const iconClose = $("#iconClose");
    if (!btn || !menu) return;
    btn.addEventListener("click", () => {
      const isHidden = menu.classList.contains("hidden");
      menu.classList.toggle("hidden");
      btn.setAttribute("aria-expanded", String(isHidden));
      iconOpen && iconOpen.classList.toggle("hidden");
      iconClose && iconClose.classList.toggle("hidden");
    });
  }

  function setupCarousel() {
    $$(".carousel-wrapper").forEach((wrapper) => {
      const track = wrapper.querySelector(".carousel-track");
      if (!track) return;
      const slides = Array.from(track.children);
      const prev = wrapper.querySelector(".carousel-prev");
      const next = wrapper.querySelector(".carousel-next");
      const dots = Array.from(wrapper.querySelectorAll(".dot"));
      let index = 0;
      let startX = 0,
        currentX = 0,
        dragging = false;

      function update() {
        const offset = -(index * 100);
        track.style.transform = `translateX(${offset}%)`;
        dots.forEach((d, i) => {
          d.classList.toggle("bg-green-600", i === index);
          d.classList.toggle("bg-green-300", i !== index);
        });
        slides.forEach((s, i) => s.classList.toggle("is-active", i === index));
      }
      function goTo(i) {
        const max = slides.length - 1;
        index = i < 0 ? max : i > max ? 0 : i;
        update();
      }
      prev && prev.addEventListener("click", () => goTo(index - 1));
      next && next.addEventListener("click", () => goTo(index + 1));
      dots.forEach((d, i) => d.addEventListener("click", () => goTo(i)));

      function onPointerDown(e) {
        dragging = true;
        startX = e.touches ? e.touches[0].clientX : e.clientX;
        track.style.transition = "none";
      }
      function onPointerMove(e) {
        if (!dragging) return;
        currentX = e.touches ? e.touches[0].clientX : e.clientX;
        const dx = currentX - startX;
        const percent = (dx / track.clientWidth) * 100;
        const base = -(index * 100);
        track.style.transform = `translateX(${base + percent}%)`;
      }
      function onPointerUp() {
        if (!dragging) return;
        dragging = false;
        track.style.transition = "";
        const dx = currentX - startX;
        const threshold = track.clientWidth * 0.15;
        if (dx > threshold) {
          goTo(index - 1);
        } else if (dx < -threshold) {
          goTo(index + 1);
        } else {
          update();
        }
        startX = currentX = 0;
      }
      track.addEventListener("pointerdown", onPointerDown);
      window.addEventListener("pointermove", onPointerMove);
      window.addEventListener("pointerup", onPointerUp);
      track.addEventListener("touchstart", onPointerDown, { passive: true });
      track.addEventListener("touchmove", onPointerMove, { passive: true });
      track.addEventListener("touchend", onPointerUp);

      update();
    });
  }

  // Removed unused old brochure viewer

  function setupResourcesViewer() {
    const openBtn = document.getElementById("openResourcesViewer");
    const viewer = document.getElementById("resourcesViewer");
    const frame = document.getElementById("resPdfFrame");
    const zoomIn = document.getElementById("resZoomInBtn");
    const zoomOut = document.getElementById("resZoomOutBtn");
    const zoomLabel = document.getElementById("resZoomLabel");
    let zoom = 160;
    if (!openBtn || !viewer) return;
    openBtn.addEventListener("click", () => {
      const isOpen = viewer.classList.contains("open");
      viewer.classList.toggle("open");
      openBtn.setAttribute("aria-expanded", String(!isOpen));
      if (!isOpen)
        viewer.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    function updateZoom() {
      if (!frame) return;
      const base = "assets/docs/livret_sante.pdf";
      const fragment = `#page=1&zoom=${zoom}&view=FitH`;
      const full = base + `?_=${Date.now()}` + fragment;
      try {
        frame.setAttribute("data", full);
        const embed = frame.querySelector("embed");
        if (embed) embed.setAttribute("src", full);
      } catch {}
      if (zoomLabel) zoomLabel.textContent = `${zoom}%`;
    }
    zoomIn &&
      zoomIn.addEventListener("click", () => {
        zoom = Math.min(300, zoom + 10);
        updateZoom();
      });
    zoomOut &&
      zoomOut.addEventListener("click", () => {
        zoom = Math.max(80, zoom - 10);
        updateZoom();
      });
  }

  // Removed old per-language program toggles; rendering is dynamic per selected language

  // Init
  document.addEventListener("DOMContentLoaded", () => {
    // Global image fallback to association logo if any image fails to load
    (function setupImageFallback() {
      const FALLBACK_SRC = "assets/images/logo.png";
      // Capture resource load errors early and stop other onerror handlers
      const onErrorCapture = (e) => {
        const t = e.target;
        if (!(t && t.tagName === "IMG")) return;
        if (t.dataset.fallbackApplied === "1") return;
        t.dataset.fallbackApplied = "1";
        // Clear srcset to force using src
        try {
          t.removeAttribute("srcset");
        } catch {}
        t.src = FALLBACK_SRC;
        t.classList.add("object-contain", "bg-white");
        // Prevent inline onerror from overriding our fallback
        try {
          e.stopImmediatePropagation();
          e.stopPropagation();
        } catch {}
      };
      // Use capture phase to intercept before inline handlers
      document.addEventListener("error", onErrorCapture, true);
      // Also proactively fix already-broken images after DOM is ready
      $$("img").forEach((img) => {
        const fixIfBroken = () => {
          if (img.dataset.fallbackApplied === "1") return;
          // If image finished loading but has no intrinsic size, it's broken
          if (img.complete && img.naturalWidth === 0) {
            img.dataset.fallbackApplied = "1";
            try {
              img.removeAttribute("srcset");
            } catch {}
            img.src = FALLBACK_SRC;
            img.classList.add("object-contain", "bg-white");
          }
        };
        // If already complete, check now; else check on load end (either load or error)
        if (img.complete) {
          fixIfBroken();
        } else {
          img.addEventListener("load", fixIfBroken, { once: true });
          img.addEventListener("error", fixIfBroken, { once: true });
        }
      });
    })();
    setupMobileMenu();
    setupCarousel();
    setupLanguage();
    setupResourcesViewer();
    observeReveals();
    // Optional subtle parallax for decorative layers
    (function setupParallax() {
      const layers = $$("[data-parallax]");
      if (!layers.length) return;
      const onScroll = () => {
        const sy = window.scrollY || window.pageYOffset;
        layers.forEach((el) => {
          const strength = parseFloat(el.getAttribute("data-parallax")) || 10;
          const offset = (sy * strength) / 100;
          el.style.transform = `translateY(${offset}px)`;
        });
      };
      onScroll();
      window.addEventListener("scroll", onScroll, { passive: true });
    })();
    renderProgram();
    renderSpeakers();
  });
})();
