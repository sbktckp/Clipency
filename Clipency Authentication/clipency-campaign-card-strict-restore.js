(function () {
  if (window.__clipencyCampaignCardStrictRestoreLoaded) return;
  window.__clipencyCampaignCardStrictRestoreLoaded = true;

  if (window.location.pathname !== "/campaigns") return;

  const CARD_SELECTOR = [
    ".campaign-card",
    ".classic-campaign-card",
    ".cx-campaign-card",
    ".cx-campaign-admin-card",
    "[data-campaign-card]",
    "[data-campaign-id]"
  ].join(",");

  function text(el) {
    return String(el?.textContent || "").trim();
  }

  function moneyFrom(textValue) {
    const match = String(textValue || "").match(/\$[\d,]+(?:\.\d+)?/);
    return match ? match[0] : "$0";
  }

  function campaignFromCard(card) {
    const title =
      card.dataset.title ||
      card.dataset.campaignTitle ||
      text(card.querySelector("h3, h2, .campaign-title, .card-title")) ||
      "Campaign";

    const allText = text(card);

    const rate =
      card.dataset.rate ||
      card.dataset.ratePerMillion ||
      moneyFrom(allText) ||
      "$0";

    const category =
      card.dataset.category ||
      text(card.querySelector(".category, .tag, .badge")) ||
      "Music";

    const status =
      card.dataset.status ||
      (allText.toLowerCase().includes("active") ? "Active" : "Active");

    const creatorsMatch = allText.match(/creators?\s*(\d+)/i) || allText.match(/(\d+)\s*creators?/i);

    const creators =
      card.dataset.creators ||
      (creatorsMatch ? creatorsMatch[1] : "—");

    const budgetMatch =
      allText.match(/budget:\s*([^\\n]+)/i) ||
      allText.match(/remaining\s*([^\\n]+)/i);

    const budget =
      card.dataset.budget ||
      card.dataset.remainingBudget ||
      (budgetMatch ? budgetMatch[1].trim() : "Available");

    const description =
      card.dataset.description ||
      text(card.querySelector(".campaign-description, p")) ||
      `Create short-form creator content for ${title}.`;

    const requirements =
      card.dataset.requirements ||
      "Submit your content link and platform handle. Proof must be public and campaign-relevant.";

    return {
      title,
      rate,
      category,
      status,
      creators,
      budget,
      description,
      requirements
    };
  }

  function ensureModal() {
    let modal = document.getElementById("cx-first-campaign-modal");

    if (modal) return modal;

    modal = document.createElement("div");
    modal.id = "cx-first-campaign-modal";
    modal.innerHTML = `
      <div class="cx-first-campaign-backdrop" data-close-campaign-modal></div>

      <section class="cx-first-campaign-panel" role="dialog" aria-modal="true">
        <button class="cx-first-campaign-close" data-close-campaign-modal>×</button>

        <div class="cx-first-campaign-head">
          <div class="cx-first-campaign-icon">♫</div>
          <div>
            <span>CAMPAIGN DETAILS</span>
            <h2 id="cx-first-campaign-title">Campaign</h2>
            <div class="cx-first-campaign-tags">
              <b id="cx-first-campaign-category">Music</b>
              <b id="cx-first-campaign-status">Active</b>
            </div>
          </div>
        </div>

        <div class="cx-first-campaign-metrics">
          <div>
            <span>RATE PER 1M VIEWS</span>
            <strong id="cx-first-campaign-rate">$0</strong>
          </div>
          <div>
            <span>REMAINING BUDGET</span>
            <strong id="cx-first-campaign-budget">Available</strong>
          </div>
        </div>

        <div class="cx-first-campaign-section">
          <span>DESCRIPTION</span>
          <p id="cx-first-campaign-description"></p>
        </div>

        <div class="cx-first-campaign-section">
          <span>REQUIREMENTS</span>
          <p id="cx-first-campaign-requirements"></p>
        </div>

        <div class="cx-first-campaign-actions">
          <button id="cx-first-submit-proof">Submit proof</button>
          <button data-close-campaign-modal>Close</button>
        </div>
      </section>
    `;

    document.body.appendChild(modal);

    modal.addEventListener("click", function (event) {
      if (event.target.closest("[data-close-campaign-modal]")) {
        closeModal();
      }
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") closeModal();
    });

    return modal;
  }

  function openModal(campaign) {
    const modal = ensureModal();

    document.getElementById("cx-first-campaign-title").textContent = campaign.title;
    document.getElementById("cx-first-campaign-category").textContent = campaign.category;
    document.getElementById("cx-first-campaign-status").textContent = campaign.status;
    document.getElementById("cx-first-campaign-rate").textContent = campaign.rate;
    document.getElementById("cx-first-campaign-budget").textContent = campaign.budget;
    document.getElementById("cx-first-campaign-description").textContent = campaign.description;
    document.getElementById("cx-first-campaign-requirements").textContent = campaign.requirements;

    const proofButton = document.getElementById("cx-first-submit-proof");
    proofButton.onclick = function (event) {
      event.preventDefault();
      event.stopPropagation();

      const existingSubmit =
        document.querySelector(".submission-modal, #submission-modal, .proof-modal");

      if (existingSubmit) {
        existingSubmit.classList.add("open", "active");
        existingSubmit.style.display = "";
      } else {
        alert("Proof submission will open here. Please connect this to the existing submit proof form.");
      }
    };

    modal.classList.add("open");
    document.body.classList.add("cx-campaign-modal-open");
  }

  function closeModal() {
    document.getElementById("cx-first-campaign-modal")?.classList.remove("open");
    document.body.classList.remove("cx-campaign-modal-open");
  }

  function isRealCampaignCard(card) {
    if (!card) return false;

    const t = text(card).toLowerCase();

    if (!t) return false;
    if (t.includes("smit bharat patil") && !t.includes("rate per 1m")) return false;
    if (t.includes("profile") && !t.includes("rate per 1m")) return false;

    return (
      t.includes("rate per 1m") ||
      t.includes("creators") ||
      t.includes("budget") ||
      card.hasAttribute("data-campaign-card") ||
      card.hasAttribute("data-campaign-id")
    );
  }

  function bindStrictCardClick() {
    document.addEventListener("click", function (event) {
      const clickedProfileArea = event.target.closest(
        ".profile-card, .user-card, .sidebar-user, .cx-profile-button, [data-profile-link]"
      );

      const card = event.target.closest(CARD_SELECTOR);

      if (!card || clickedProfileArea) return;
      if (!isRealCampaignCard(card)) return;

      const clickedNativeAction = event.target.closest(
        "button, input, textarea, select, a[href]:not([href='/profile']):not([href='/profile/'])"
      );

      if (clickedNativeAction && !clickedNativeAction.textContent?.toLowerCase().includes("submit")) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();

      openModal(campaignFromCard(card));
    }, true);
  }

  function neutralizeWrongProfileRedirects() {
    document.addEventListener("click", function (event) {
      const card = event.target.closest(CARD_SELECTOR);
      if (!card || !isRealCampaignCard(card)) return;

      const link = event.target.closest("a[href='/profile'], a[href='/profile/'], a[href*='profile']");
      if (!link) return;

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();

      openModal(campaignFromCard(card));
    }, true);
  }

  function boot() {
    bindStrictCardClick();
    neutralizeWrongProfileRedirects();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
