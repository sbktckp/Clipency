(function () {
  function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async function waitForAccess() {
    let attempts = 0;

    while (!window.ClipencyAccess && attempts < 80) {
      await wait(100);
      attempts++;
    }

    return window.ClipencyAccess || null;
  }

  function initials(nameOrEmail) {
    const value = String(nameOrEmail || "C").trim();
    const parts = value.split(/\s+/).filter(Boolean);

    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }

    return value.slice(0, 1).toUpperCase();
  }

  function createStaffSwitcher(context) {
    const role = context.role;
    const profile = context.profile || {};
    const name = profile.full_name || profile.username || context.user?.email?.split("@")[0] || "Clipency User";

    if (!["admin", "reviewer"].includes(role)) return;

    if (document.querySelector(".staff-global-switcher")) return;

    const switcher = document.createElement("div");
    switcher.className = "staff-global-switcher";

    if (role === "admin") {
      switcher.innerHTML = `
        <button class="staff-switcher-trigger" type="button">
          <span>${initials(name)}</span>
          <strong>${name}</strong>
          <small>Admin access</small>
        </button>

        <div class="staff-switcher-menu">
          <a href="/workspace">Workspace</a>
          <a href="/admin">Admin command</a>
          <a href="/review">Review queue</a>
          <a href="/admin/finance">Finance OS</a>
          <a href="/dashboard">Clipper view</a>
        </div>
      `;
    } else {
      switcher.innerHTML = `
        <button class="staff-switcher-trigger" type="button">
          <span>${initials(name)}</span>
          <strong>${name}</strong>
          <small>Reviewer access</small>
        </button>

        <div class="staff-switcher-menu">
          <a href="/review">Review queue</a>
          <a href="/login" data-staff-logout>Logout</a>
        </div>
      `;
    }

    document.body.appendChild(switcher);

    const trigger = switcher.querySelector(".staff-switcher-trigger");
    trigger.addEventListener("click", () => {
      switcher.classList.toggle("open");
    });

    document.addEventListener("click", (event) => {
      if (!switcher.contains(event.target)) {
        switcher.classList.remove("open");
      }
    });

    switcher.querySelector("[data-staff-logout]")?.addEventListener("click", async (event) => {
      event.preventDefault();

      try {
        await window.supabaseClient.auth.signOut();
      } finally {
        window.location.href = "/login";
      }
    });
  }

  function hydrateStaffIdentity(context) {
    const profile = context.profile || {};
    const name = profile.full_name || profile.username || context.user?.email?.split("@")[0] || "Clipency User";
    const role = context.role || "clipper";

    document.querySelectorAll("[data-staff-name]").forEach((el) => {
      el.textContent = name;
    });

    document.querySelectorAll("[data-staff-role]").forEach((el) => {
      el.textContent = role;
    });

    document.querySelectorAll("[data-staff-initials]").forEach((el) => {
      el.textContent = initials(name);
    });

    document.body.dataset.clipencyRole = role;
  }

  function injectAdminLinks(context) {
    if (context.role !== "admin") return;

    const reviewNav = document.querySelector("[data-review-admin-links]");
    if (reviewNav && !reviewNav.dataset.hydrated) {
      reviewNav.dataset.hydrated = "true";
      reviewNav.innerHTML = `
        <a href="/admin">Admin Command</a>
        <a href="/workspace">Workspace</a>
      `;
    }

    const creatorSidebar = document.querySelector(".sidebar, .dashboard-sidebar, aside");
    if (creatorSidebar && !document.querySelector(".admin-return-link") && /dashboard|campaigns|stats|payouts|wallet|profile/.test(window.location.pathname)) {
      const link = document.createElement("a");
      link.className = "admin-return-link";
      link.href = "/workspace";
      link.textContent = "Admin workspace";
      creatorSidebar.appendChild(link);
    }
  }

  async function boot() {
    const access = await waitForAccess();
    if (!access) return;

    try {
      const context = await access.getRole();
      if (!context.user) return;

      hydrateStaffIdentity(context);
      injectAdminLinks(context);
      createStaffSwitcher(context);
    } catch {}
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
