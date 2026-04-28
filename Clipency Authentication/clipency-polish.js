(function () {
  if (window.ClipencyPolishInstalled) return;
  window.ClipencyPolishInstalled = true;

  const routes = [
    { title: "Home", description: "Public Clipency landing page", href: "/", icon: "H", roles: ["public", "clipper", "reviewer", "admin"] },
    { title: "Campaigns", description: "Explore active creator campaigns", href: "/campaigns", icon: "C", roles: ["clipper", "admin"] },
    { title: "Stats", description: "View creator performance and insights", href: "/stats", icon: "S", roles: ["clipper", "admin"] },
    { title: "Payouts", description: "Track your own payout status", href: "/payouts", icon: "P", roles: ["clipper", "admin"] },
    { title: "Profile", description: "Manage identity and creator profile", href: "/profile", icon: "U", roles: ["clipper", "admin"] },
    { title: "Workspace", description: "Choose admin, review, finance or creator view", href: "/workspace", icon: "W", roles: ["admin"] },
    { title: "Admin Command", description: "Platform operations overview", href: "/admin", icon: "A", roles: ["admin"] },
    { title: "Review Queue", description: "Review submitted clips and proof links", href: "/review", icon: "R", roles: ["reviewer", "admin"] },
    { title: "Client Leads", description: "Website inquiries and campaign interest", href: "/admin/leads", icon: "L", roles: ["admin"] },
    { title: "Finance OS", description: "Open the separate secure finance workspace", href: "/admin/finance", icon: "F", roles: ["admin"] },
    { title: "Team Access", description: "Invite admins and reviewers", href: "/admin/users", icon: "T", roles: ["admin"] }
  ];

  let contextRole = "public";
  let activeIndex = 0;
  let backdrop = null;
  let input = null;
  let list = null;

  function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async function detectRole() {
    let attempts = 0;

    while (!window.ClipencyAccess && attempts < 20) {
      await wait(100);
      attempts++;
    }

    if (!window.ClipencyAccess) {
      contextRole = "public";
      return;
    }

    try {
      const context = await window.ClipencyAccess.getRole();
      contextRole = context?.role || "public";
    } catch {
      contextRole = "public";
    }
  }

  function allowedRoutes() {
    return routes.filter((route) => route.roles.includes(contextRole) || route.roles.includes("public"));
  }

  function progressBar() {
    let bar = document.querySelector(".cx-page-progress");

    if (!bar) {
      bar = document.createElement("div");
      bar.className = "cx-page-progress";
      document.body.appendChild(bar);
    }

    function update() {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const pct = max > 0 ? (window.scrollY / max) * 100 : 0;
      bar.style.width = `${pct}%`;
    }

    window.addEventListener("scroll", update, { passive: true });
    update();
  }

  function createPalette() {
    if (document.querySelector(".cx-command-backdrop")) return;

    const trigger = document.createElement("button");
    trigger.className = "cx-command-trigger";
    trigger.type = "button";
    trigger.innerHTML = `<kbd>⌘K</kbd><span>Quick switch</span>`;
    document.body.appendChild(trigger);

    backdrop = document.createElement("div");
    backdrop.className = "cx-command-backdrop";
    backdrop.innerHTML = `
      <section class="cx-command-panel" role="dialog" aria-modal="true" aria-label="Clipency command palette">
        <div class="cx-command-head">
          <span>Navigate Clipency</span>
          <input class="cx-command-input" placeholder="Search pages, workspaces, reviews, finance…" autocomplete="off" />
        </div>
        <div class="cx-command-list"></div>
      </section>
    `;

    document.body.appendChild(backdrop);

    input = backdrop.querySelector(".cx-command-input");
    list = backdrop.querySelector(".cx-command-list");

    trigger.addEventListener("click", openPalette);

    backdrop.addEventListener("click", (event) => {
      if (event.target === backdrop) closePalette();
    });

    input.addEventListener("input", () => {
      activeIndex = 0;
      renderList();
    });

    input.addEventListener("keydown", (event) => {
      const items = Array.from(list.querySelectorAll(".cx-command-item"));

      if (event.key === "ArrowDown") {
        event.preventDefault();
        activeIndex = Math.min(activeIndex + 1, items.length - 1);
        renderList();
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        activeIndex = Math.max(activeIndex - 1, 0);
        renderList();
      }

      if (event.key === "Enter") {
        event.preventDefault();
        const item = items[activeIndex];
        if (item) {
          navigate(item.dataset.href);
        }
      }

      if (event.key === "Escape") {
        closePalette();
      }
    });
  }

  function filteredRoutes() {
    const q = (input?.value || "").trim().toLowerCase();

    return allowedRoutes().filter((route) => {
      const text = `${route.title} ${route.description} ${route.href}`.toLowerCase();
      return !q || text.includes(q);
    });
  }

  function renderList() {
    const items = filteredRoutes();

    if (!items.length) {
      list.innerHTML = `<div class="cx-command-empty">No matching page found.</div>`;
      return;
    }

    if (activeIndex >= items.length) activeIndex = items.length - 1;

    list.innerHTML = items.map((route, index) => `
      <button class="cx-command-item ${index === activeIndex ? "active" : ""}" data-href="${route.href}" type="button">
        <span class="cx-command-icon">${route.icon}</span>
        <span>
          <strong>${route.title}</strong>
          <small>${route.description}</small>
        </span>
        <span class="cx-command-shortcut">${route.href}</span>
      </button>
    `).join("");

    list.querySelectorAll(".cx-command-item").forEach((item) => {
      item.addEventListener("click", () => navigate(item.dataset.href));
    });
  }

  function openPalette() {
    if (!backdrop) return;
    backdrop.classList.add("open");
    input.value = "";
    activeIndex = 0;
    renderList();

    setTimeout(() => input.focus(), 40);
  }

  function closePalette() {
    if (!backdrop) return;
    backdrop.classList.remove("open");
  }

  function navigate(href) {
    if (!href) return;

    closePalette();
    document.body.classList.add("cx-route-leaving");

    setTimeout(() => {
      window.location.href = href;
    }, 120);
  }

  function installKeyboard() {
    document.addEventListener("keydown", (event) => {
      const isMac = navigator.platform.toLowerCase().includes("mac");
      const modPressed = isMac ? event.metaKey : event.ctrlKey;

      if (modPressed && event.key.toLowerCase() === "k") {
        event.preventDefault();
        openPalette();
      }
    });
  }

  function revealExistingElements() {
    const selectors = [
      ".staff-topbar",
      ".staff-stat",
      ".workspace-card",
      ".admin-panel",
      ".review-card",
      ".finance-launcher-hero",
      ".finance-launcher-side",
      ".system-card",
      ".insight-card",
      ".testimonial-card",
      ".contact-form",
      ".metric-tile"
    ];

    const items = document.querySelectorAll(selectors.join(","));

    items.forEach((item) => {
      if (item.classList.contains("cx-soft-reveal")) return;
      item.classList.add("cx-soft-reveal");
    });

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.08 });

    document.querySelectorAll(".cx-soft-reveal").forEach((item) => observer.observe(item));
  }

  function linkTransitions() {
    document.addEventListener("click", (event) => {
      const link = event.target.closest("a[href]");
      if (!link) return;

      const href = link.getAttribute("href") || "";
      if (href.startsWith("#")) return;
      if (link.target === "_blank") return;
      if (link.hasAttribute("download")) return;

      try {
        const url = new URL(href, window.location.origin);
        if (url.origin !== window.location.origin) return;
      } catch {
        return;
      }

      document.body.classList.add("cx-route-leaving");
    });
  }

  async function boot() {
    document.body.classList.add("cx-polished");
    progressBar();
    await detectRole();
    createPalette();
    installKeyboard();
    revealExistingElements();
    linkTransitions();

    const mutationObserver = new MutationObserver(() => {
      revealExistingElements();
    });

    mutationObserver.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
