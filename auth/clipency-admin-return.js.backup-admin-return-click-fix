(function () {
  if (window.__clipencyAdminReturnLoaded) return;
  window.__clipencyAdminReturnLoaded = true;

  const clipperRoutes = ["/campaigns", "/stats", "/payouts", "/wallet", "/profile"];
  if (!clipperRoutes.includes(window.location.pathname)) return;

  function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async function waitForSupabase() {
    for (let i = 0; i < 60; i++) {
      if (window.supabaseClient) return window.supabaseClient;
      await wait(100);
    }
    return null;
  }

  function getSidebar() {
    return document.querySelector(".sidebar, .dashboard-sidebar, aside");
  }

  function addButton() {
    const sidebar = getSidebar();
    if (!sidebar || sidebar.querySelector(".cx-admin-return-link")) return;

    const link = document.createElement("a");
    link.href = "/admin";
    link.className = "cx-admin-return-link";
    link.innerHTML = `
      <span>⌘</span>
      <strong>Admin OS</strong>
    `;

    const bottom = sidebar.querySelector(".sidebar-bottom, .dashboard-sidebar-bottom") || sidebar.lastElementChild;
    if (bottom) {
      bottom.insertAdjacentElement("beforebegin", link);
    } else {
      sidebar.appendChild(link);
    }
  }

  async function boot() {
    try {
      const supabase = await waitForSupabase();
      if (!supabase) return;

      const { data } = await supabase.auth.getUser();
      const email = data?.user?.email;
      if (!email) return;

      const { data: adminRows } = await supabase
        .from("admin_users")
        .select("email")
        .eq("email", email.toLowerCase())
        .limit(1);

      if (adminRows && adminRows.length) addButton();
    } catch {}
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }

  setTimeout(boot, 700);
})();
