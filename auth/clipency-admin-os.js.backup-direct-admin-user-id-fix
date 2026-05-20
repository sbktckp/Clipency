(function () {
  if (window.__clipencyAdminOSLoaded) return;
  window.__clipencyAdminOSLoaded = true;

  const ADMIN_PATHS = [
    "/admin",
    "/admin/reviews",
    "/admin/campaigns",
    "/admin/leads",
    "/admin/payouts",
    "/admin/users",
    "/workspace"
  ];

  if (!ADMIN_PATHS.includes(window.location.pathname)) return;

  const FINANCE_URL = "https://v0-clipency-finance-dashboard.vercel.app/login";

  const NAV = [
    ["Command Center", "/admin", "grid"],
    ["Reviews", "/admin/reviews", "check"],
    ["Campaigns", "/admin/campaigns", "play"],
    ["Leads", "/admin/leads", "mail"],
    ["Payouts", "/admin/payouts", "wallet"],
    ["Users", "/admin/users", "users"],
    ["Finance OS", FINANCE_URL, "finance", true],
    ["Clipper View", "/campaigns", "external"],
  ];

  let supabaseClient = null;
  let currentUser = null;

  function icon(name) {
    const icons = {
      grid: '<path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z" stroke="currentColor" stroke-width="1.7" fill="none" rx="2"/>',
      check: '<path d="M20 6 9 17l-5-5" stroke="currentColor" stroke-width="1.9" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
      play: '<path d="M7 5v14l12-7-12-7Z" stroke="currentColor" stroke-width="1.7" fill="none" stroke-linejoin="round"/>',
      mail: '<path d="M4 6h16v12H4z" stroke="currentColor" stroke-width="1.7" fill="none" rx="2"/><path d="m4 8 8 6 8-6" stroke="currentColor" stroke-width="1.7" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
      wallet: '<path d="M4 7h16v11H4z" stroke="currentColor" stroke-width="1.7" fill="none" rx="2"/><path d="M16 12h4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>',
      users: '<path d="M16 21a5 5 0 0 0-10 0" stroke="currentColor" stroke-width="1.7" fill="none" stroke-linecap="round"/><circle cx="11" cy="8" r="4" stroke="currentColor" stroke-width="1.7" fill="none"/><path d="M20 21a4 4 0 0 0-3-3.87" stroke="currentColor" stroke-width="1.7" fill="none" stroke-linecap="round"/>',
      finance: '<path d="M5 19V5M5 19h14M9 16v-5M13 16V8M17 16v-7" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
      external: '<path d="M14 4h6v6M20 4l-9 9" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M20 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h4" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round"/>'
    };

    return `<svg viewBox="0 0 24 24" fill="none">${icons[name] || icons.grid}</svg>`;
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function cleanEmail(email) {
    return String(email || "").trim().toLowerCase();
  }

  function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async function waitForSupabase() {
    for (let i = 0; i < 80; i++) {
      if (window.supabaseClient) return window.supabaseClient;
      await wait(80);
    }

    throw new Error("Supabase client not loaded.");
  }

  async function initAuth() {
    supabaseClient = await waitForSupabase();

    const { data, error } = await supabaseClient.auth.getUser();

    if (error || !data?.user) {
      window.location.replace("/login");
      return false;
    }

    currentUser = data.user;

    let currentRole = "clipper";

    try {
      const { data: roleData, error: roleError } = await supabaseClient.rpc("current_clipency_role");

      if (roleError) throw roleError;

      currentRole = roleData || "clipper";
    } catch (roleError) {
      console.warn("Role RPC failed. Falling back to email admin check.", roleError);

      const { data: adminRows, error: adminError } = await supabaseClient
        .from("admin_users")
        .select("email,user_id")
        .or(`email.eq.${cleanEmail(currentUser.email)},user_id.eq.${currentUser.id}`)
        .limit(1);

      if (adminError) throw adminError;

      currentRole = adminRows && adminRows.length ? "admin" : "clipper";
    }

    if (currentRole !== "admin") {
      window.location.replace("/campaigns");
      return false;
    }

    return true;
  }

  function shell(content) {
    const email = currentUser?.email || "admin@clipency.in";
    const name = currentUser?.user_metadata?.full_name || email.split("@")[0] || "Admin";
    const initial = name.slice(0, 1).toUpperCase();

    return `
      <div id="clipency-admin-os">
        <aside class="cx-admin-sidebar">
          <div class="cx-admin-logo" onclick="window.location.href='/admin'">
            <img src="/clipency-logo.png" alt="Clipency" onerror="this.src='/assets/clipency-logo.png'" />
          </div>

          <div class="cx-admin-nav-wrap">
            <div class="cx-admin-label">Admin OS</div>
            <nav class="cx-admin-nav">
              ${NAV.map(([label, href, iconName, external]) => {
                const active = !external && (
                  window.location.pathname === href ||
                  (href !== "/admin" && window.location.pathname.startsWith(href))
                );

                return `
                  <a href="${href}" class="${active ? "active" : ""} ${external ? "cx-admin-finance-link" : ""}" ${external ? 'target="_blank" rel="noopener noreferrer"' : ""}>
                    ${icon(iconName)}
                    <span>${label}</span>
                  </a>
                `;
              }).join("")}
            </nav>
          </div>

          <div class="cx-admin-sidebar-bottom">
            <div class="cx-admin-userbox">
              <div class="cx-admin-avatar">${escapeHtml(initial)}</div>
              <div>
                <strong>${escapeHtml(name)}</strong>
                <span>${escapeHtml(email)}</span>
              </div>
              <button class="cx-admin-logout" id="cx-admin-logout" title="Logout">↗</button>
            </div>
          </div>
        </aside>

        <main class="cx-admin-main">
          <div class="cx-admin-content">
            ${content}
          </div>
        </main>
      </div>
    `;
  }

  function renderBasePage({ kicker, title, subtitle, body }) {
    return shell(`
      <div class="cx-admin-kicker">${escapeHtml(kicker)}</div>
      <h1 class="cx-admin-title">${escapeHtml(title)}</h1>
      <p class="cx-admin-subtitle">${escapeHtml(subtitle)}</p>
      ${body || ""}
    `);
  }

  async function safeCount(table) {
    try {
      const { count } = await supabaseClient
        .from(table)
        .select("*", { count: "exact", head: true });

      return count ?? 0;
    } catch {
      return 0;
    }
  }

  async function renderCommand() {
    const [admins, reviewers] = await Promise.all([
      safeCount("admin_users"),
      safeCount("reviewer_users")
    ]);

    return renderBasePage({
      kicker: "Command Center",
      title: "Platform operations.",
      subtitle: "One control room for reviews, campaigns, leads, payouts, user access and finance handoff.",
      body: `
        <section class="cx-admin-grid">
          <div class="cx-admin-card"><h3>Admins</h3><strong>${admins}</strong><p>People who can operate the platform.</p></div>
          <div class="cx-admin-card"><h3>Reviewers</h3><strong>${reviewers}</strong><p>People who can verify creator submissions.</p></div>
          <div class="cx-admin-card"><h3>Finance OS</h3><strong>↗</strong><p>External finance workspace connected through secure access.</p></div>
          <div class="cx-admin-card"><h3>Clipper view</h3><strong>Live</strong><p>Jump back to creator-facing campaign experience anytime.</p></div>
        </section>

        <section class="cx-admin-section">
          <div class="cx-admin-section-head">
            <div>
              <h2>Workspace shortcuts</h2>
              <p>Move across the operating system without broken routes or mixed sidebars.</p>
            </div>
          </div>

          <div class="cx-admin-actions">
            <a class="cx-admin-button primary" href="/admin/reviews">Open reviews</a>
            <a class="cx-admin-button" href="/admin/users">Manage users</a>
            <a class="cx-admin-button green" href="${FINANCE_URL}" target="_blank" rel="noopener noreferrer">Open Finance OS</a>
            <a class="cx-admin-button" href="/campaigns">Open clipper view</a>
          </div>
        </section>
      `
    });
  }

  async function fetchRows(table, columns = "*", limit = 20) {
    try {
      const { data, error } = await supabaseClient
        .from(table)
        .select(columns)
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch {
      return [];
    }
  }

  async function renderReviews() {
    const rows = await fetchRows("admin_submissions_view", "*", 25);

    return renderBasePage({
      kicker: "Review Queue",
      title: "Creator proof review.",
      subtitle: "Review submitted clips, approve valid proofs and keep payout status clean.",
      body: `
        <section class="cx-admin-section">
          <div class="cx-admin-section-head">
            <div>
              <h2>Submissions</h2>
              <p>${rows.length ? "Latest submitted proofs from creators." : "No submissions found yet."}</p>
            </div>
          </div>

          ${rows.length ? `
            <div class="cx-admin-table-wrap">
              <table class="cx-admin-table">
                <thead><tr><th>Creator</th><th>Campaign</th><th>Status</th><th>Submitted</th></tr></thead>
                <tbody>
                  ${rows.map((row) => `
                    <tr>
                      <td><strong>${escapeHtml(row.creator_email || row.email || row.user_email || "Creator")}</strong></td>
                      <td>${escapeHtml(row.campaign_title || row.campaign_name || row.campaign || "Campaign")}</td>
                      <td><span class="cx-admin-badge pending">${escapeHtml(row.status || "Pending")}</span></td>
                      <td>${row.created_at ? new Date(row.created_at).toLocaleString() : "—"}</td>
                    </tr>
                  `).join("")}
                </tbody>
              </table>
            </div>
          ` : `<div class="cx-admin-empty">No review items are available right now.</div>`}
        </section>
      `
    });
  }

  async function renderSimpleModule(kind) {
    const content = {
      campaigns: {
        kicker: "Campaign Control",
        title: "Campaign operations.",
        subtitle: "Manage campaign visibility, performance status and creator-side availability.",
        cta: "Campaign creation and editing will be connected here."
      },
      leads: {
        kicker: "Lead Desk",
        title: "Client leads.",
        subtitle: "Track inbound brand and client interest from the landing page.",
        cta: "Lead intake will be connected here."
      },
      payouts: {
        kicker: "Payout Control",
        title: "Payout operations.",
        subtitle: "Payout approvals should stay connected with the finance system without breaking admin flow.",
        cta: "Finance OS remains separate and secure. Open it from here."
      }
    }[kind];

    return renderBasePage({
      kicker: content.kicker,
      title: content.title,
      subtitle: content.subtitle,
      body: `
        <section class="cx-admin-section">
          <div class="cx-admin-section-head">
            <div>
              <h2>${escapeHtml(content.title)}</h2>
              <p>${escapeHtml(content.cta)}</p>
            </div>
            ${kind === "payouts" ? `<a class="cx-admin-button green" href="${FINANCE_URL}" target="_blank" rel="noopener noreferrer">Open Finance OS</a>` : ``}
          </div>

          <div class="cx-admin-grid">
            <div class="cx-admin-card"><h3>Status</h3><strong>Ready</strong><p>This route is now inside Admin OS.</p></div>
            <div class="cx-admin-card"><h3>Route</h3><strong>${escapeHtml(window.location.pathname.replace("/admin/", ""))}</strong><p>No more 404 or broken sidebar.</p></div>
          </div>
        </section>
      `
    });
  }

  async function fetchRoles() {
    const [{ data: admins, error: adminError }, { data: reviewers, error: reviewerError }] = await Promise.all([
      supabaseClient.from("admin_users").select("id,email,user_id,created_at").order("created_at", { ascending: false }),
      supabaseClient.from("reviewer_users").select("id,email,user_id,created_at").order("created_at", { ascending: false })
    ]);

    if (adminError) throw adminError;
    if (reviewerError) throw reviewerError;

    const map = new Map();

    (admins || []).forEach((row) => {
      map.set(cleanEmail(row.email), {
        email: cleanEmail(row.email),
        role: "admin",
        created_at: row.created_at
      });
    });

    (reviewers || []).forEach((row) => {
      const email = cleanEmail(row.email);

      if (!map.has(email)) {
        map.set(email, {
          email,
          role: "reviewer",
          created_at: row.created_at
        });
      }
    });

    return Array.from(map.values()).sort((a, b) => {
      if (a.role !== b.role) return a.role === "admin" ? -1 : 1;
      return a.email.localeCompare(b.email);
    });
  }

  async function setRole(email, role) {
    const value = cleanEmail(email);

    if (!value || !value.includes("@")) throw new Error("Enter a valid email.");

    if (role === "admin") {
      const { error } = await supabaseClient.from("admin_users").upsert({ email: value }, { onConflict: "email" });
      if (error) throw error;
      await supabaseClient.from("reviewer_users").delete().eq("email", value);
      return;
    }

    if (role === "reviewer") {
      const { error } = await supabaseClient.from("reviewer_users").upsert({ email: value }, { onConflict: "email" });
      if (error) throw error;
      await supabaseClient.from("admin_users").delete().eq("email", value);
      return;
    }
  }

  async function revokeRole(email) {
    const value = cleanEmail(email);
    await supabaseClient.from("reviewer_users").delete().eq("email", value);
    await supabaseClient.from("admin_users").delete().eq("email", value);
  }

  async function renderUsers() {
    const users = await fetchRoles();
    const currentEmail = cleanEmail(currentUser?.email);

    return renderBasePage({
      kicker: "Access Control",
      title: "Users & roles.",
      subtitle: "Add, upgrade, downgrade or revoke access for the people who operate Clipency.",
      body: `
        <section class="cx-admin-section">
          <div class="cx-admin-section-head">
            <div>
              <h2>Add or update access</h2>
              <p>Enter the person’s email, choose the role, and save. Changes apply the next time they sign in or refresh.</p>
            </div>
          </div>

          <form class="cx-admin-form" id="cx-admin-role-form">
            <input id="cx-admin-role-email" type="email" placeholder="name@example.com" required />
            <select id="cx-admin-role-select">
              <option value="reviewer">Reviewer</option>
              <option value="admin">Admin</option>
            </select>
            <button type="submit">Save access</button>
          </form>
        </section>

        <section class="cx-admin-section">
          <div class="cx-admin-section-head">
            <div>
              <h2>Current access</h2>
              <p>${users.length} people currently have admin or reviewer access.</p>
            </div>
          </div>

          <div class="cx-admin-table-wrap">
            <table class="cx-admin-table">
              <thead>
                <tr><th>Email</th><th>Role</th><th>Added</th><th>Actions</th></tr>
              </thead>
              <tbody>
                ${users.length ? users.map((user) => {
                  const isSelf = cleanEmail(user.email) === currentEmail;

                  return `
                    <tr>
                      <td>
                        <strong>${escapeHtml(user.email)}</strong>
                        ${isSelf ? `<div style="color:rgba(255,255,255,.42);font-size:12px;margin-top:4px;">Current signed-in admin</div>` : ``}
                      </td>
                      <td><span class="cx-admin-badge ${user.role}">${escapeHtml(user.role === "admin" ? "Admin" : "Reviewer")}</span></td>
                      <td>${user.created_at ? new Date(user.created_at).toLocaleString() : "—"}</td>
                      <td>
                        <div class="cx-admin-actions">
                          <button data-role-action="admin" data-email="${escapeHtml(user.email)}" ${user.role === "admin" ? "disabled" : ""}>Make admin</button>
                          <button data-role-action="reviewer" data-email="${escapeHtml(user.email)}" ${user.role === "reviewer" ? "disabled" : ""}>Make reviewer</button>
                          <button class="danger" data-role-action="revoke" data-email="${escapeHtml(user.email)}" ${isSelf ? "disabled title='You cannot revoke yourself here.'" : ""}>Revoke</button>
                        </div>
                      </td>
                    </tr>
                  `;
                }).join("") : `<tr><td colspan="4"><div class="cx-admin-empty">No users found.</div></td></tr>`}
              </tbody>
            </table>
          </div>
        </section>
      `
    });
  }

  async function renderRoute() {
    const path = window.location.pathname;

    if (path === "/admin" || path === "/workspace") return renderCommand();
    if (path === "/admin/reviews") return renderReviews();
    if (path === "/admin/campaigns") return renderSimpleModule("campaigns");
    if (path === "/admin/leads") return renderSimpleModule("leads");
    if (path === "/admin/payouts") return renderSimpleModule("payouts");
    if (path === "/admin/users") return renderUsers();

    return renderCommand();
  }

  function bindEvents() {
    document.getElementById("cx-admin-logout")?.addEventListener("click", async () => {
      try {
        await supabaseClient.auth.signOut({ scope: "global" });
      } catch {}
      window.location.replace("/login");
    });

    document.getElementById("cx-admin-role-form")?.addEventListener("submit", async (event) => {
      event.preventDefault();

      const email = document.getElementById("cx-admin-role-email").value;
      const role = document.getElementById("cx-admin-role-select").value;
      const button = event.target.querySelector("button");

      try {
        button.disabled = true;
        button.textContent = "Saving…";
        await setRole(email, role);
        await boot();
      } catch (error) {
        alert(error.message || "Could not save access.");
        button.disabled = false;
        button.textContent = "Save access";
      }
    });

    document.querySelectorAll("[data-role-action]").forEach((button) => {
      button.addEventListener("click", async () => {
        const action = button.dataset.roleAction;
        const email = button.dataset.email;

        try {
          button.disabled = true;

          if (action === "revoke") {
            if (!confirm(`Revoke access for ${email}?`)) {
              button.disabled = false;
              return;
            }
            await revokeRole(email);
          } else {
            await setRole(email, action);
          }

          await boot();
        } catch (error) {
          alert(error.message || "Could not update access.");
          button.disabled = false;
        }
      });
    });
  }

  async function boot() {
    document.body.classList.add("cx-admin-os-active");

    document.body.innerHTML = `
      <div class="cx-admin-loader">
        <div>
          <div class="cx-admin-spinner"></div>
        </div>
      </div>
    `;

    try {
      const ok = await initAuth();
      if (!ok) return;

      document.body.innerHTML = await renderRoute();
      bindEvents();
      document.title = "Clipency | Admin OS";
    } catch (error) {
      document.body.innerHTML = `
        <div class="cx-admin-loader">
          <div style="max-width:520px;text-align:center;">
            <h1 style="color:white;margin:0 0 10px;">Admin OS could not load.</h1>
            <p style="color:rgba(255,255,255,.58);line-height:1.6;">${escapeHtml(error.message || "Please refresh once.")}</p>
            <a class="cx-admin-button primary" href="/campaigns" style="margin-top:18px;">Go to Clipper View</a>
          </div>
        </div>
      `;
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
