(function () {
  async function waitForAccess() {
    let attempts = 0;

    while (!window.ClipencyAccess && attempts < 50) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      attempts++;
    }

    return window.ClipencyAccess || null;
  }

  async function redirectAfterAuth() {
    const access = await waitForAccess();

    if (!access) {
      window.location.href = "/dashboard";
      return;
    }

    await access.redirectByRole();
  }

  window.ClipencyRedirectAfterAuth = redirectAfterAuth;

  async function protectClientRoutes() {
    const access = await waitForAccess();
    if (!access) return;

    const publicPaths = ["/", "/login", "/signup", "/auth", "/system", "/clients", "/creators", "/proof", "/team", "/contact", "/use-cases", "/command-center"];

    if (publicPaths.includes(window.location.pathname)) return;

    try {
      const { user, role } = await access.getRole();

      if (!user) return;

      const creatorPaths = ["/dashboard", "/campaigns", "/stats", "/payouts", "/wallet", "/profile"];

      if (role === "reviewer" && creatorPaths.includes(window.location.pathname)) {
        window.location.href = "/review";
      }

      if (role === "clipper" && (window.location.pathname === "/workspace" || window.location.pathname === "/review" || window.location.pathname.startsWith("/admin"))) {
        window.location.href = "/dashboard";
      }
    } catch {}
  }

  document.addEventListener("DOMContentLoaded", protectClientRoutes);
})();
