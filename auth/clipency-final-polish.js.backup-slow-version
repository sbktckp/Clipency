/* =========================================================
   CLIPENCY FINAL INTEGRATION LAYER
   Route state, identity behavior, campaign cleanup, stability
   ========================================================= */

(function () {
  const routeMap = {
    "/dashboard": "dashboard",
    "/campaigns": "campaigns",
    "/stats": "stats",
    "/payouts": "payout",
    "/wallet": "payment",
    "/profile": "profile"
  };

  function currentRoute() {
    const path = window.location.pathname.toLowerCase();
    const queryPage = new URLSearchParams(window.location.search).get("page");

    if (routeMap[path]) return routeMap[path];
    if (queryPage) return queryPage;

    return "dashboard";
  }

  function setRouteClass() {
    const route = currentRoute();

    document.body.classList.remove(
      "route-dashboard",
      "route-campaigns",
      "route-stats",
      "route-payout",
      "route-payment",
      "route-profile"
    );

    document.body.classList.add(`route-${route}`);

    return route;
  }

  function isInsideSidebar(el) {
    return Boolean(el.closest(".sidebar, aside, [class*='sidebar']"));
  }

  function markTopIdentity() {
    const selectors = [
      ".top-profile",
      ".header-profile",
      ".profile-chip",
      ".user-pill",
      ".user-menu",
      "[class*='top-profile']",
      "[class*='header-profile']",
      "[class*='profile-chip']"
    ];

    selectors.forEach((selector) => {
      document.querySelectorAll(selector).forEach((el) => {
        if (!isInsideSidebar(el)) {
          el.classList.add("clipency-top-identity");
        }
      });
    });

    document.querySelectorAll("body *").forEach((el) => {
      if (isInsideSidebar(el)) return;
      if (el.classList.contains("campaign-card")) return;
      if (el.closest(".campaign-card")) return;

      const text = (el.textContent || "").trim().toLowerCase();
      const hasAvatar = el.querySelector("img, .avatar, [class*='avatar']");

      if (
        hasAvatar &&
        (
          text.includes("smit bharat patil") ||
          text.includes("patilsmit") ||
          text.includes("creator")
        )
      ) {
        el.classList.add("clipency-top-identity");
      }
    });
  }

  function routeToProfile() {
    if (window.location.pathname !== "/profile") {
      window.history.pushState({ page: "profile" }, "", "/profile");
    }

    document.querySelectorAll(".nav-item").forEach((item) => item.classList.remove("active"));
    document.querySelectorAll(".section").forEach((section) => section.classList.remove("active"));

    const profileSection = document.getElementById("section-profile");
    if (profileSection) profileSection.classList.add("active");

    if (typeof renderPremiumProfilePage === "function") {
      renderPremiumProfilePage();
    }

    setRouteClass();
    document.title = "Clipency | Profile";
  }

  function makeIdentityClickable() {
    const selectors = [
      ".sidebar-user",
      ".user-footer",
      ".top-profile",
      ".header-profile",
      ".profile-chip",
      ".user-pill",
      ".user-menu",
      ".clipency-top-identity",
      "[class*='footer-user']"
    ];

    selectors.forEach((selector) => {
      document.querySelectorAll(selector).forEach((el) => {
        if (el.dataset.profileClickReady === "true") return;

        const text = (el.textContent || "").toLowerCase();
        const hasAvatar = el.querySelector("img, .avatar, [class*='avatar']");

        if (
          hasAvatar ||
          text.includes("creator") ||
          text.includes("smit") ||
          text.includes("patil")
        ) {
          el.dataset.profileClickReady = "true";
          el.style.cursor = "pointer";
          el.setAttribute("role", "button");
          el.setAttribute("tabindex", "0");

          el.addEventListener("click", (event) => {
            const logout = event.target.closest(".logout, .signout, .sign-out, [data-logout]");
            if (logout) return;
            routeToProfile();
          });

          el.addEventListener("keydown", (event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              routeToProfile();
            }
          });
        }
      });
    });
  }

  function hideSidebarProfileNav() {
    document.querySelectorAll('.nav-item[data-section="profile"]').forEach((el) => {
      el.style.display = "none";
    });
  }

  function dedupeCampaignTags() {
    document.querySelectorAll(".campaign-card").forEach((card) => {
      const badges = Array.from(
        card.querySelectorAll(".tag, .badge, [class*='tag'], [class*='badge']")
      );

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

  function cleanHumanText() {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const nodes = [];

    while (walker.nextNode()) nodes.push(walker.currentNode);

    nodes.forEach((node) => {
      if (!node.nodeValue) return;

      node.nodeValue = node.nodeValue
        .replace(/\s*-\s*-\s*/g, " — ")
        .replace(/Campaign\s*·\s*undefined/g, "Campaign")
        .replace(/\s+·\s+undefined/g, "")
        .replace(/\bundefined\b/g, "")
        .replace(/\s{2,}/g, " ");
    });
  }

  function syncNavFromRoute() {
    const route = currentRoute();

    const navSection =
      route === "dashboard" ? "dashboard" :
      route === "campaigns" ? "campaigns" :
      route === "stats" ? "stats" :
      route === "payout" || route === "payouts" ? "payout" :
      route === "payment" || route === "wallet" ? "payment" :
      route;

    document.querySelectorAll(".nav-item").forEach((item) => {
      item.classList.toggle("active", item.dataset.section === navSection);
    });
  }

  function polish() {
    setRouteClass();
    markTopIdentity();
    makeIdentityClickable();
    hideSidebarProfileNav();
    dedupeCampaignTags();
    cleanHumanText();
    syncNavFromRoute();
  }

  function boot() {
    polish();

    const observer = new MutationObserver(() => {
      window.requestAnimationFrame(polish);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });

    window.addEventListener("popstate", polish);

    document.addEventListener("click", () => {
      setTimeout(polish, 120);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
