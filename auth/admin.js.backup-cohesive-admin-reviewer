(function () {
  let booted = false;

  function supabase() {
    return window.supabaseClient;
  }

  function setContent(html) {
    const target = document.getElementById("admin-content");
    if (target) target.innerHTML = html;
  }

  function setHeader(title, subtitle) {
    const titleEl = document.getElementById("admin-title");
    const subtitleEl = document.getElementById("admin-subtitle");

    if (titleEl) titleEl.textContent = title;
    if (subtitleEl) subtitleEl.textContent = subtitle;
  }

  function pathMode() {
    const path = window.location.pathname;

    if (path.includes("/campaigns")) return "campaigns";
    if (path.includes("/leads")) return "leads";
    if (path.includes("/payouts")) return "payouts";
    if (path.includes("/users")) return "users";

    return "home";
  }

  function safe(value, fallback = "—") {
    return value === null || value === undefined || value === "" ? fallback : value;
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  async function countTable(table) {
    try {
      const { count, error } = await supabase()
        .from(table)
        .select("*", { count: "exact", head: true });

      if (error) return 0;
      return count || 0;
    } catch {
      return 0;
    }
  }

  async function renderStats() {
    const target = document.getElementById("admin-stats");
    if (!target) return;

    target.innerHTML = `
      <div class="staff-stat"><span>Submissions</span><strong>—</strong></div>
      <div class="staff-stat"><span>Client Leads</span><strong>—</strong></div>
      <div class="staff-stat"><span>Campaigns</span><strong>—</strong></div>
      <div class="staff-stat"><span>Users</span><strong>—</strong></div>
    `;

    const [submissions, leads, campaigns, profiles] = await Promise.all([
      countTable("submissions"),
      countTable("contact_leads"),
      countTable("campaigns"),
      countTable("profiles")
    ]);

    target.innerHTML = `
      <div class="staff-stat"><span>Submissions</span><strong>${submissions}</strong></div>
      <div class="staff-stat"><span>Client Leads</span><strong>${leads}</strong></div>
      <div class="staff-stat"><span>Campaigns</span><strong>${campaigns}</strong></div>
      <div class="staff-stat"><span>Users</span><strong>${profiles}</strong></div>
    `;
  }

  function setActiveNav(mode) {
    document.querySelectorAll(".staff-nav a").forEach((link) => {
      link.classList.remove("active");

      if (mode === "home" && link.getAttribute("href") === "/admin") link.classList.add("active");
      if (mode === "campaigns" && link.href.includes("/campaigns")) link.classList.add("active");
      if (mode === "leads" && link.href.includes("/leads")) link.classList.add("active");
      if (mode === "payouts" && link.href.includes("/payouts")) link.classList.add("active");
      if (mode === "users" && link.href.includes("/users")) link.classList.add("active");
    });
  }

  async function renderHome() {
    setHeader("Platform operations.", "Manage Clipency campaigns, reviews, leads, payouts and access from one place.");

    setContent(`
      <div class="admin-two">
        <a class="admin-panel" href="/review">
          <div class="eyebrow">REVIEW QUEUE</div>
          <h2>Review submitted clips</h2>
          <p>Open proof URLs, enter performance metrics, approve or reject submissions and add review notes.</p>
        </a>

        <a class="admin-panel" href="/admin/leads">
          <div class="eyebrow">CLIENT PIPELINE</div>
          <h2>View landing page leads</h2>
          <p>Every contact form submission from the landing page appears here for admin follow-up.</p>
        </a>

        <a class="admin-panel" href="/admin/campaigns">
          <div class="eyebrow">CAMPAIGNS</div>
          <h2>Campaign management</h2>
          <p>Create, edit, pause and monitor campaigns. This module is prepared for the next phase.</p>
        </a>

        <a class="admin-panel" href="/admin/users">
          <div class="eyebrow">ACCESS</div>
          <h2>User roles</h2>
          <p>Add reviewer emails, manage access and keep Clipency roles clean.</p>
        </a>
      </div>
    `);
  }

  async function renderLeads() {
    setHeader("Client leads.", "Campaign inquiries submitted from the public landing page.");

    setContent(`<div class="staff-card loading-card">Loading leads securely…</div>`);

    const { data, error } = await supabase()
      .from("contact_leads")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    const leads = data || [];

    if (!leads.length) {
      setContent(`
        <section class="admin-panel">
          <div class="eyebrow">CLIENT PIPELINE</div>
          <h2>No leads yet.</h2>
          <p>When someone submits the contact form from the landing page, it will appear here.</p>
        </section>
      `);
      return;
    }

    setContent(`
      <section class="admin-list">
        ${leads.map((lead) => `
          <article class="admin-panel">
            <div class="review-head">
              <div>
                <h3>${escapeHtml(safe(lead.full_name, "Lead"))}</h3>
                <p>
                  ${escapeHtml(safe(lead.email, "No email"))}
                  · ${escapeHtml(safe(lead.company, "No company"))}
                  · ${escapeHtml(safe(lead.budget_range, "No budget"))}
                </p>
              </div>
              <span class="badge">${escapeHtml(safe(lead.status, "new"))}</span>
            </div>

            <p><strong>Goal:</strong> ${escapeHtml(safe(lead.campaign_goal, "Not specified"))}</p>
            <p>${escapeHtml(safe(lead.message, "No message added."))}</p>
            <p class="review-meta">Received: ${lead.created_at ? new Date(lead.created_at).toLocaleString() : "Unknown"}</p>
          </article>
        `).join("")}
      </section>
    `);
  }

  async function renderUsers() {
    setHeader("Access control.", "Invite reviewers or change existing user roles.");

    setContent(`
      <section class="admin-panel">
        <div class="eyebrow">INVITE ACCESS</div>
        <h2>Add admin or reviewer email</h2>
        <p>Invited users receive their role automatically after signup. Existing users can be updated below.</p>

        <div class="admin-two">
          <input class="admin-input" id="access-email" placeholder="person@example.com" />
          <select class="admin-select" id="access-role">
            <option value="reviewer">Reviewer</option>
            <option value="admin">Admin</option>
            <option value="clipper">Clipper</option>
          </select>
        </div>

        <div class="review-actions" style="margin-top:14px">
          <button class="action-btn primary" id="invite-btn">Save invite</button>
          <button class="action-btn" id="update-role-btn">Update existing user</button>
        </div>

        <p id="access-message"></p>
      </section>
    `);

    document.getElementById("invite-btn").addEventListener("click", async () => {
      await saveAccess(false);
    });

    document.getElementById("update-role-btn").addEventListener("click", async () => {
      await saveAccess(true);
    });
  }

  async function saveAccess(updateExisting) {
    const email = document.getElementById("access-email").value.trim();
    const role = document.getElementById("access-role").value;
    const msg = document.getElementById("access-message");

    if (!email) {
      msg.textContent = "Enter an email first.";
      return;
    }

    msg.textContent = "Saving…";

    const rpc = updateExisting ? "set_user_role_by_email" : "invite_access";
    const args = updateExisting
      ? { target_email: email, new_role: role }
      : { invite_email: email, invite_role: role };

    const { data, error } = await supabase().rpc(rpc, args);

    if (error) {
      msg.textContent = error.message;
      return;
    }

    msg.textContent = data?.message || "Saved.";
  }

  function renderPlaceholder(mode) {
    const titles = {
      campaigns: "Campaign management.",
      payouts: "Payout operations."
    };

    setHeader(titles[mode] || "Admin module.", "The access foundation is ready. We can wire the full module in the next build phase.");

    setContent(`
      <section class="admin-panel">
        <div class="eyebrow">COMING NEXT</div>
        <h2>${titles[mode] || "Admin module"}</h2>
        <p>This module is prepared. Next, we connect real campaign creation/editing and payout workflows.</p>
      </section>
    `);
  }

  async function boot() {
    if (booted) return;
    booted = true;

    const mode = pathMode();
    setActiveNav(mode);

    const access = await window.ClipencyAccess.requireRole(["admin"]);
    if (!access) return;

    await renderStats();

    try {
      if (mode === "home") await renderHome();
      else if (mode === "leads") await renderLeads();
      else if (mode === "users") await renderUsers();
      else renderPlaceholder(mode);
    } catch (error) {
      setContent(`
        <section class="admin-panel">
          <h2>Could not load this admin page.</h2>
          <p>${escapeHtml(error.message || "Unknown error.")}</p>
        </section>
      `);
    }
  }

  function bootWhenReady() {
    if (!window.ClipencyAccess || !window.supabaseClient) {
      setTimeout(bootWhenReady, 120);
      return;
    }

    boot();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootWhenReady);
  } else {
    bootWhenReady();
  }

  setTimeout(() => {
    const target = document.getElementById("admin-content");

    if (target && target.textContent.includes("Loading admin dashboard")) {
      target.innerHTML = `
        <section class="admin-panel">
          <h2>Admin page is taking longer than expected.</h2>
          <p>Refresh once. If this repeats, check browser console and Supabase RLS permissions for this role.</p>
        </section>
      `;
    }
  }, 8000);
})();
