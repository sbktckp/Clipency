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
      window.location.replace("/campaigns");
      return;
    }

    await access.redirectByRole();
  }

  window.ClipencyRedirectAfterAuth = redirectAfterAuth;

  async function bootRouteProtection() {
    const access = await waitForAccess();
    if (!access) return;

    const path = window.location.pathname;

    if (["/login", "/signup", "/auth"].includes(path)) {
      try {
        const context = await access.getRole();

        if (context.user) {
          await access.redirectByRole();
        }
      } catch {}

      return;
    }

    await access.protectCurrentRoute();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootRouteProtection);
  } else {
    bootRouteProtection();
  }
})();
