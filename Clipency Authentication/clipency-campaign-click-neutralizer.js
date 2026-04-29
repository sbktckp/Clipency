(function () {
  if (window.__clipencyCampaignClickNeutralizerLoaded) return;
  window.__clipencyCampaignClickNeutralizerLoaded = true;

  if (window.location.pathname !== "/campaigns") return;

  const CARD_SELECTOR = [
    ".campaign-card",
    ".classic-campaign-card",
    ".cx-campaign-card",
    "[data-campaign-card]",
    "[data-campaign-id]",
    ".campaigns-grid > *",
    ".campaign-grid > *"
  ].join(",");

  function text(el) {
    return String(el?.textContent || "").toLowerCase();
  }

  function isCampaignCard(el) {
    if (!el) return false;

    const t = text(el);

    return (
      el.hasAttribute("data-campaign-card") ||
      el.hasAttribute("data-campaign-id") ||
      t.includes("rate per 1m") ||
      t.includes("creators") ||
      t.includes("budget") ||
      t.includes("wot heat") ||
      t.includes("we do what we want") ||
      t.includes("la isla bonita") ||
      t.includes("geometry dash")
    );
  }

  function findCampaignCard(target) {
    const direct = target.closest(CARD_SELECTOR);
    if (direct && isCampaignCard(direct)) return direct;

    return Array.from(document.querySelectorAll(CARD_SELECTOR)).find((card) => {
      return isCampaignCard(card) && card.contains(target);
    });
  }

  function killProfileLinksInsideCards() {
    document.querySelectorAll(CARD_SELECTOR).forEach((card) => {
      if (!isCampaignCard(card)) return;

      // If the card itself is an anchor to profile, neutralize it.
      if (card.matches("a[href*='profile']")) {
        card.removeAttribute("href");
        card.setAttribute("role", "button");
      }

      // If the card contains profile links, neutralize only those inside campaign cards.
      card.querySelectorAll("a[href*='profile'], [data-profile-link]").forEach((link) => {
        link.removeAttribute("href");
        link.removeAttribute("data-profile-link");
        link.setAttribute("role", "button");
      });

      // Remove inline profile redirect handlers.
      if (String(card.getAttribute("onclick") || "").includes("profile")) {
        card.removeAttribute("onclick");
      }

      card.querySelectorAll("[onclick]").forEach((node) => {
        if (String(node.getAttribute("onclick") || "").includes("profile")) {
          node.removeAttribute("onclick");
        }
      });
    });
  }

  function tryNativeDetails(card) {
    const nativeTrigger =
      card.querySelector(
        "[data-open-campaign], [data-campaign-details], [data-view-campaign], .view-details, .details-button, .campaign-details-trigger"
      );

    if (nativeTrigger && nativeTrigger !== card) {
      nativeTrigger.dispatchEvent(
        new MouseEvent("click", {
          bubbles: true,
          cancelable: true,
          view: window
        })
      );
      return true;
    }

    const id = card.getAttribute("data-campaign-id") || card.dataset.campaignId;

    if (id) {
      window.dispatchEvent(
        new CustomEvent("clipency:campaign-details", {
          detail: { campaignId: id, card }
        })
      );

      document.dispatchEvent(
        new CustomEvent("clipency:campaign-details", {
          detail: { campaignId: id, card }
        })
      );

      return true;
    }

    return false;
  }

  function blockProfileNavigation(event) {
    const card = findCampaignCard(event.target);
    if (!card) return;

    const profileTarget = event.target.closest(
      "a[href*='profile'], [data-profile-link], .profile-card, .user-card, .sidebar-user"
    );

    // If anything inside a campaign card tries profile, block it hard.
    if (profileTarget || String(event.target?.href || "").includes("profile")) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      tryNativeDetails(card);
      return;
    }

    // If card click itself would go profile due to parent anchor/handler, block and use native details.
    const parentProfileAnchor = card.closest("a[href*='profile']");
    if (parentProfileAnchor) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      tryNativeDetails(card);
      return;
    }
  }

  function protectLocation() {
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function (state, title, url) {
      if (String(url || "").includes("/profile") && window.__lastCampaignCardClickAt && Date.now() - window.__lastCampaignCardClickAt < 900) {
        return;
      }
      return originalPushState.apply(this, arguments);
    };

    history.replaceState = function (state, title, url) {
      if (String(url || "").includes("/profile") && window.__lastCampaignCardClickAt && Date.now() - window.__lastCampaignCardClickAt < 900) {
        return;
      }
      return originalReplaceState.apply(this, arguments);
    };
  }

  document.addEventListener("pointerdown", function (event) {
    const card = findCampaignCard(event.target);
    if (!card) return;

    window.__lastCampaignCardClickAt = Date.now();
    killProfileLinksInsideCards();
  }, true);

  document.addEventListener("click", function (event) {
    const card = findCampaignCard(event.target);
    if (!card) return;

    window.__lastCampaignCardClickAt = Date.now();

    blockProfileNavigation(event);

    const action = event.target.closest("button, input, textarea, select");
    if (action) return;

    // Final safety: never allow campaign-card click to become profile redirect.
    const hrefTarget = event.target.closest("a[href]");
    if (hrefTarget && String(hrefTarget.getAttribute("href") || "").includes("profile")) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      tryNativeDetails(card);
    }
  }, true);

  killProfileLinksInsideCards();
  protectLocation();

  new MutationObserver(killProfileLinksInsideCards).observe(document.documentElement, {
    childList: true,
    subtree: true
  });
})();
