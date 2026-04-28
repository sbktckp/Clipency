(function () {
  async function waitForAccess() {
    let attempts = 0;

    while (!window.ClipencyAccess && attempts < 80) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      attempts++;
    }

    return window.ClipencyAccess || null;
  }

  async function redirectAfterAuth() {
    const access = await waitForAccess();

    if (!access) {
      window.location.replace("/dashboard");
      return;
    }

    await access.redirectByRole();
  }

  window.ClipencyRedirectAfterAuth = redirectAfterAuth;

  async function bootRouteProtection() {
    const access = await waitForAccess();
    if (!access) return;

    await access.protectCurrentRoute();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootRouteProtection);
  } else {
    bootRouteProtection();
  }
})();
