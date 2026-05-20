(function () {
  if (window.__clipencyCampaignClickNeutralizerLoaded) return;
  window.__clipencyCampaignClickNeutralizerLoaded = true;

  if (window.location.pathname !== "/campaigns") return;

  const campaignSelector = [
    ".campaign-card",
    ".classic-campaign-card",
    ".cx-campaign-card",
    "[data-campaign-card]",
    "[data-campaign-id]"
  ].join(",");

  function isCampaignCard(card) {
    if (!card) return false;

    const text = String(card.textContent || "").toLowerCase();

    return (
      text.includes("rate per 1m") ||
      text.includes("creators") ||
      text.includes("budget") ||
      card.hasAttribute("data-campaign-card") ||
      card.hasAttribute("data-campaign-id")
    );
  }

  document.addEventListener("click", function (event) {
    const card = event.target.closest(campaignSelector);
    if (!card || !isCampaignCard(card)) return;

    const profileLink = event.target.closest(
      'a[href="/profile"], a[href="/profile/"], a[href*="profile"], [data-profile-link]'
    );

    if (profileLink) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();

      card.click();
    }
  }, true);
})();
