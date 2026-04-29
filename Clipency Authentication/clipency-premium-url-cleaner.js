(function () {
  if (window.__clipencyPremiumUrlCleanerLoaded) return;
  window.__clipencyPremiumUrlCleanerLoaded = true;

  const redirects = {
    "/index.html": "/",
    "/dashboard": "/campaigns",
    "/dashboard.html": "/campaigns",
    "/auth.html": "/login",
    "/login.html": "/login",
    "/signup.html": "/signup",
    "/profile.html": "/profile",
    "/stats.html": "/stats",
    "/payouts.html": "/payouts",
    "/campaigns.html": "/campaigns",
    "/wallet.html": "/wallet"
  };

  const target = redirects[window.location.pathname];

  if (target) {
    window.location.replace(target + window.location.search + window.location.hash);
    return;
  }

  if (window.location.pathname.endsWith(".html")) {
    const clean = window.location.pathname.replace(/\/index\.html$/, "/").replace(/\.html$/, "");
    window.location.replace(clean + window.location.search + window.location.hash);
  }
})();
