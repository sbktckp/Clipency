(function () {
  if (window.__clipencyNavigationFirewallLoaded) return;
  window.__clipencyNavigationFirewallLoaded = true;

  const PROFILE_PATH = "/profile";
  let allowProfileUntil = 0;
  let lastCampaignClickAt = 0;

  function isClipperArea() {
    return [
      "/campaigns",
      "/stats",
      "/payouts",
      "/wallet",
      "/profile",
      "/dashboard"
    ].some((p) => location.pathname === p || location.pathname.startsWith(p + "/"));
  }

  if (!isClipperArea()) return;

  function text(el) {
    return String(el?.textContent || "").trim();
  }

  function isProfileUrl(value) {
    try {
      return new URL(value, location.origin).pathname.startsWith(PROFILE_PATH);
    } catch {
      return String(value || "").includes("profile");
    }
  }

  function explicitProfileTrigger(el) {
    return el?.closest?.(
      ".cx-explicit-profile-link, [data-explicit-profile], [data-safe-profile], .cx-profile-nav"
    );
  }

  function getSidebar() {
    return document.querySelector("aside, .sidebar, .dashboard-sidebar, .clipper-sidebar");
  }

  function findCurrencyAnchor(sidebar) {
    if (!sidebar) return null;

    return Array.from(sidebar.querySelectorAll("*")).find((el) => {
      return text(el).toLowerCase() === "currency";
    });
  }

  function addSafeProfileButton() {
    const sidebar = getSidebar();
    if (!sidebar) return;

    if (sidebar.querySelector(".cx-explicit-profile-link")) return;

    const link = document.createElement("a");
    link.href = "/profile";
    link.className = "cx-explicit-profile-link";
    link.setAttribute("data-explicit-profile", "true");
    link.innerHTML = `
      <span class="cx-profile-firewall-icon">👤</span>
      <strong>Profile</strong>
    `;

    link.addEventListener("click", function (event) {
      allowProfileUntil = Date.now() + 1500;
      event.preventDefault();
      window.location.href = "/profile";
    }, true);

    const currency = findCurrencyAnchor(sidebar);

    if (currency) {
      currency.insertAdjacentElement("beforebegin", link);
    } else {
      sidebar.appendChild(link);
    }
  }

  function campaignCardFrom(target) {
    const selector = [
      ".campaign-card",
      ".classic-campaign-card",
      ".cx-campaign-card",
      "[data-campaign-card]",
      "[data-campaign-id]",
      ".campaigns-grid > *",
      ".campaign-grid > *"
    ].join(",");

    const card = target.closest(selector);
    if (!card) return null;

    const t = text(card).toLowerCase();

    const looksCampaign =
      card.hasAttribute("data-campaign-card") ||
      card.hasAttribute("data-campaign-id") ||
      t.includes("rate per 1m") ||
      t.includes("creators") ||
      t.includes("budget") ||
      t.includes("wot heat") ||
      t.includes("we do what we want") ||
      t.includes("la isla bonita") ||
      t.includes("geometry dash") ||
      t.includes("campaign");

    return looksCampaign ? card : null;
  }

  function campaignData(card) {
    const t = text(card);

    const title =
      card.dataset.title ||
      card.dataset.campaignTitle ||
      text(card.querySelector("h3, h2, .campaign-title, .card-title")) ||
      "Campaign";

    const rateMatch = t.match(/\$[\d,]+(?:\.\d+)?/);
    const creatorsMatch = t.match(/(\d+)\s*creators?/i) || t.match(/creators?\s*(\d+)/i);

    return {
      title,
      rate: card.dataset.rate || (rateMatch ? rateMatch[0] : "$0"),
      category: card.dataset.category || text(card.querySelector(".tag, .badge, .category")) || "Campaign",
      status: card.dataset.status || "Active",
      creators: card.dataset.creators || (creatorsMatch ? creatorsMatch[1] : "—"),
      description:
        card.dataset.description ||
        text(card.querySelector("p, .description, .campaign-description")) ||
        `Create campaign content for ${title}.`,
      requirements:
        card.dataset.requirements ||
        "Submit your content link and platform handle. Proof must be public and campaign-relevant."
    };
  }

  function ensureCampaignModal() {
    let modal = document.getElementById("cx-campaign-native-modal");

    if (modal) return modal;

    modal = document.createElement("div");
    modal.id = "cx-campaign-native-modal";
    modal.innerHTML = `
      <div class="cx-native-modal-backdrop" data-close-native-campaign></div>

      <section class="cx-native-modal-card">
        <button class="cx-native-modal-close" data-close-native-campaign>×</button>

        <div class="cx-native-modal-head">
          <div class="cx-native-modal-icon">♫</div>
          <div>
            <span>CAMPAIGN DETAILS</span>
            <h2 id="cx-native-campaign-title">Campaign</h2>
            <div class="cx-native-tags">
              <b id="cx-native-campaign-category">Campaign</b>
              <b id="cx-native-campaign-status">Active</b>
            </div>
          </div>
        </div>

        <div class="cx-native-metrics">
          <div>
            <span>RATE PER 1M VIEWS</span>
            <strong id="cx-native-campaign-rate">$0</strong>
          </div>
          <div>
            <span>CREATORS</span>
            <strong id="cx-native-campaign-creators">—</strong>
          </div>
        </div>

        <div class="cx-native-section">
          <span>DESCRIPTION</span>
          <p id="cx-native-campaign-description"></p>
        </div>

        <div class="cx-native-section">
          <span>REQUIREMENTS</span>
          <p id="cx-native-campaign-requirements"></p>
        </div>

        <div class="cx-native-actions">
          <button id="cx-native-submit-proof">Submit proof</button>
          <button data-close-native-campaign>Close</button>
        </div>
      </section>
    `;

    document.body.appendChild(modal);

    modal.addEventListener("click", function (event) {
      if (event.target.closest("[data-close-native-campaign]")) {
        modal.classList.remove("open");
        document.body.classList.remove("cx-native-modal-open");
      }
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        modal.classList.remove("open");
        document.body.classList.remove("cx-native-modal-open");
      }
    });

    return modal;
  }

  function openCampaign(card) {
    const data = campaignData(card);
    const modal = ensureCampaignModal();

    document.getElementById("cx-native-campaign-title").textContent = data.title;
    document.getElementById("cx-native-campaign-category").textContent = data.category;
    document.getElementById("cx-native-campaign-status").textContent = data.status;
    document.getElementById("cx-native-campaign-rate").textContent = data.rate;
    document.getElementById("cx-native-campaign-creators").textContent = data.creators;
    document.getElementById("cx-native-campaign-description").textContent = data.description;
    document.getElementById("cx-native-campaign-requirements").textContent = data.requirements;

    document.getElementById("cx-native-submit-proof").onclick = function (event) {
      event.preventDefault();
      event.stopPropagation();

      const nativeProofButton = Array.from(document.querySelectorAll("button, a")).find((el) => {
        const value = text(el).toLowerCase();
        return value.includes("submit proof") && el.id !== "cx-native-submit-proof";
      });

      if (nativeProofButton) {
        nativeProofButton.click();
      } else {
        window.dispatchEvent(new CustomEvent("clipency:submit-proof", { detail: data }));
        alert("Submit proof form is not connected on this screen yet.");
      }
    };

    modal.classList.add("open");
    document.body.classList.add("cx-native-modal-open");
  }

  function neutralizeBadProfileOverlays() {
    document.querySelectorAll(
      'a[href*="profile"], [onclick*="profile"], [data-profile-link], [data-route="profile"], [data-page="profile"]'
    ).forEach((el) => {
      if (explicitProfileTrigger(el)) return;

      const rect = el.getBoundingClientRect();
      const style = getComputedStyle(el);

      const isHuge =
        rect.width > Math.min(420, window.innerWidth * 0.35) ||
        rect.height > Math.min(220, window.innerHeight * 0.25) ||
        (style.position === "fixed" && rect.width > 160);

      const insideCampaign = !!campaignCardFrom(el);
      const insideSidebar = !!el.closest("aside, .sidebar, .dashboard-sidebar, .clipper-sidebar");

      if (isHuge || insideCampaign || !insideSidebar) {
        el.removeAttribute("href");
        el.removeAttribute("onclick");
        el.removeAttribute("data-profile-link");
        el.removeAttribute("data-route");
        el.removeAttribute("data-page");
        el.classList.add("cx-killed-profile-redirect");
      }
    });
  }

  function patchHistory() {
    if (window.__clipencyProfileHistoryPatched) return;
    window.__clipencyProfileHistoryPatched = true;

    const originalPush = history.pushState;
    const originalReplace = history.replaceState;

    history.pushState = function (state, title, url) {
      if (
        isProfileUrl(url) &&
        Date.now() > allowProfileUntil &&
        Date.now() - lastCampaignClickAt < 1500
      ) {
        console.warn("Blocked wrong /profile navigation after campaign click.");
        return;
      }

      return originalPush.apply(this, arguments);
    };

    history.replaceState = function (state, title, url) {
      if (
        isProfileUrl(url) &&
        Date.now() > allowProfileUntil &&
        Date.now() - lastCampaignClickAt < 1500
      ) {
        console.warn("Blocked wrong /profile replace after campaign click.");
        return;
      }

      return originalReplace.apply(this, arguments);
    };
  }

  document.addEventListener("click", function (event) {
    const safeProfile = explicitProfileTrigger(event.target);

    if (safeProfile) {
      allowProfileUntil = Date.now() + 1500;
      return;
    }

    const card = campaignCardFrom(event.target);

    if (card) {
      const formControl = event.target.closest("input, textarea, select");
      if (formControl) return;

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();

      lastCampaignClickAt = Date.now();
      neutralizeBadProfileOverlays();
      openCampaign(card);
      return;
    }

    const badProfileTarget = event.target.closest(
      'a[href*="profile"], [onclick*="profile"], [data-profile-link], [data-route="profile"], [data-page="profile"]'
    );

    if (badProfileTarget && !safeProfile) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      console.warn("Blocked unsafe profile redirect:", badProfileTarget);
    }
  }, true);

  function boot() {
    addSafeProfileButton();
    neutralizeBadProfileOverlays();
    patchHistory();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }

  setInterval(function () {
    addSafeProfileButton();
    neutralizeBadProfileOverlays();
  }, 700);

  new MutationObserver(function () {
    addSafeProfileButton();
    neutralizeBadProfileOverlays();
  }).observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["href", "onclick", "data-profile-link", "data-route", "data-page"]
  });
})();
