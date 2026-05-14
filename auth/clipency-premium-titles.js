(function () {
  const titles = {
    "/": "Clipency | Modern Distribution Platform",
    "/campaigns": "Clipency | Campaigns",
    "/stats": "Clipency | Creator Stats",
    "/payouts": "Clipency | Payouts",
    "/wallet": "Clipency | Wallet",
    "/profile": "Clipency | Profile",
    "/admin": "Clipency | Admin Command Center",
    "/admin/reviews": "Clipency | Review Queue",
    "/admin/campaigns": "Clipency | Campaign Control",
    "/admin/leads": "Clipency | Client Leads",
    "/review": "Clipency | Review Workspace",
    "/workspace": "Clipency | Workspace",
    "/login": "Clipency | Login",
    "/signup": "Clipency | Sign Up"
  };

  function applyTitle() {
    if (window.location.pathname === "/dashboard") {
      window.location.replace("/campaigns");
      return;
    }

    document.title = titles[window.location.pathname] || "Clipency";
  }

  applyTitle();

  window.addEventListener("popstate", applyTitle);
  window.addEventListener("clipency:route-change", applyTitle);

  setTimeout(applyTitle, 300);
  setTimeout(applyTitle, 1000);
})();
