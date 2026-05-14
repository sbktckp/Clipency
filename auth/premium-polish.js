/* =========================================================
   CLIPENCY PREMIUM POLISH LAYER
   Non-destructive UX upgrade
   ========================================================= */

(function () {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  function trackPointerGlow() {
    let enabled = false;

    window.addEventListener("pointermove", (event) => {
      if (!enabled) {
        document.body.classList.add("has-pointer-glow");
        enabled = true;
      }

      document.body.style.setProperty("--mx", `${event.clientX}px`);
      document.body.style.setProperty("--my", `${event.clientY}px`);
    });

    window.addEventListener("pointerleave", () => {
      document.body.classList.remove("has-pointer-glow");
      enabled = false;
    });
  }

  function addMobileMenu() {
    if ($(".premium-mobile-menu")) return;

    const btn = document.createElement("button");
    btn.className = "premium-mobile-menu";
    btn.setAttribute("aria-label", "Open navigation");
    btn.innerHTML = "<span></span>";

    btn.addEventListener("click", () => {
      document.body.classList.toggle("sidebar-open");
    });

    document.body.appendChild(btn);

    document.addEventListener("click", (event) => {
      const clickedNav = event.target.closest(".nav-item, a, button");
      if (clickedNav && document.body.classList.contains("sidebar-open")) {
        setTimeout(() => document.body.classList.remove("sidebar-open"), 180);
      }
    });
  }

  function dedupeCampaignTags() {
    const cards = $$(".campaign-card");

    cards.forEach((card) => {
      const badges = $$("span, .tag, .badge, [class*='tag'], [class*='badge']", card);
      const seen = new Set();

      badges.forEach((badge) => {
        const text = (badge.textContent || "").trim().toLowerCase();
        if (!text) return;

        if (seen.has(text) && text !== "new") {
          badge.remove();
        } else {
          seen.add(text);
        }
      });
    });
  }

  function humaniseText() {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);

    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);

    nodes.forEach((node) => {
      if (!node.nodeValue) return;

      node.nodeValue = node.nodeValue
        .replace(/\s*-\s*-\s*/g, " — ")
        .replace(/\s+·\s+undefined/g, "")
        .replace(/Campaign\s*·\s*undefined/g, "Campaign")
        .replace(/\bundefined\b/g, "")
        .replace(/\s{2,}/g, " ");
    });
  }

  function upgradeEmptyStates() {
    const sections = $$(".section");

    sections.forEach((section) => {
      if (section.dataset.emptyEnhanced === "true") return;

      const text = (section.textContent || "").trim().toLowerCase();
      const hasCards = section.querySelector(".campaign-card, .recommended-card, .activity-row, table, .submission-row");

      if (!hasCards && text.includes("no")) {
        const empty = document.createElement("div");
        empty.className = "premium-empty";
        empty.innerHTML = "<strong>Nothing here yet</strong><span>Once activity starts, this area will update automatically.</span>";
        section.appendChild(empty);
        section.dataset.emptyEnhanced = "true";
      }
    });
  }

  function addToplineStatus() {
    const dashboardHero = $(".dashboard-hero");
    if (!dashboardHero || dashboardHero.querySelector(".clipency-topline")) return;

    const line = document.createElement("div");
    line.className = "clipency-topline";
    line.textContent = "Live performance dashboard";
    dashboardHero.prepend(line);
  }

  function makeExternalLinksSafe() {
    $$("a[href^='http']").forEach((a) => {
      a.setAttribute("target", "_blank");
      a.setAttribute("rel", "noopener noreferrer");
    });
  }

  function installRouteClickUpgrade() {
    const routeMap = {
      campaigns: "/campaigns",
      dashboard: "/dashboard",
      stats: "/stats",
      payouts: "/payouts",
      payout: "/payouts",
      wallet: "/wallet",
      payment: "/wallet",
      profile: "/profile"
    };

    document.addEventListener("click", (event) => {
      const nav = event.target.closest(".nav-item");
      if (!nav) return;

      const section = (nav.dataset.section || "").toLowerCase();
      const path = routeMap[section];

      if (path && window.location.pathname !== path) {
        setTimeout(() => {
          window.history.pushState({ section }, "", path);
        }, 120);
      }
    });
  }

  function polishRepeatedly() {
    dedupeCampaignTags();
    humaniseText();
    upgradeEmptyStates();
    addToplineStatus();
    makeExternalLinksSafe();
  }

  function boot() {
    trackPointerGlow();
    addMobileMenu();
    installRouteClickUpgrade();
    polishRepeatedly();

    const observer = new MutationObserver(() => {
      window.requestAnimationFrame(polishRepeatedly);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
