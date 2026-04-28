(function () {
  function supabase() {
    return window.supabaseClient;
  }

  function pathMode() {
    const path = window.location.pathname;

    if (path.includes("/campaigns")) return "campaigns";
    if (path.includes("/leads")) return "leads";
    if (path.includes("/payouts")) return "payouts";
    if (path.includes("/users")) return "users";

    return "home";
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
    const [submissions, leads, campaigns, profiles] = await Promise.all([
      countTable("submissions"),
      countTable("contact_leads"),
      countTable("campaigns"),
      countTable("profiles")
    ]);

    document.getElementById("admin-stats").innerHTML = `
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
    document.getElementById("admin-content").innerHTML = `
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
    `;
  }

  async function renderLeads() {
    document.getElementById("admin-title").textContent = "Client leads.";
    document.getElementById("admin-subtitle").textContent = "Campaign inquiries submitted from the public landing page.";

    const { data, error } = await supabase()
      .from("contact_leads")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    document.getElementById("admin-content").innerHTML = `
      <section class="admin-list">
        ${(data || []).map((lead) => `
          <article class="admin-panel">
            <div class="review-head">
              <div>
                <h3>${lead.full_name || "Lead"}</h3>
                <p>${lead.email || "No email"} · ${lead.company || "No company"} · ${lead.budget_range || "No budget"}</p>
              </div>
              <span class="badge">${lead.status || "new"}</span>
            </div>
            <p><strong>Goal:</strong> ${lead.campaign_goal || "Not specified"}</p>
            <p>${lead.message || "No message added."}</p>
          </article>
        `).join("") || `<div class="admin-panel">No leads yet.</div>`}
      </section>
    `;
  }

  async function renderUsers() {
    document.getElementById("admin-title").textContent = "Access control.";
    document.getElementById("admin-subtitle").textContent = "Invite reviewers or change existing user roles.";

    document.getElementById("admin-content").innerHTML = `
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
    `;

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

    document.getElementById("admin-title").textContent = titles[mode] || "Admin module.";
    document.getElementById("admin-subtitle").textContent = "The access foundation is ready. We can wire the full module in the next build phase.";

    document.getElementById("admin-content").innerHTML = `
      <section class="admin-panel">
        <div class="eyebrow">COMING NEXT</div>
        <h2>${titles[mode] || "Admin module"}</h2>
        <p>This module is prepared. Next, we connect real campaign creation/editing and payout workflows.</p>
      </section>
    `;
  }

  async function boot() {
    const access = await window.ClipencyAccess.requireRole(["admin"]);
    if (!access) return;

    const mode = pathMode();

    setActiveNav(mode);
    await renderStats();

    try {
      if (mode === "home") await renderHome();
      else if (mode === "leads") await renderLeads();
      else if (mode === "users") await renderUsers();
      else renderPlaceholder(mode);
    } catch (error) {
      document.getElementById("admin-content").innerHTML = `
        <section class="admin-panel">
          <h2>Could not load this admin page.</h2>
          <p>${error.message}</p>
        </section>
      `;
    }
  }

  document.addEventListener("DOMContentLoaded", boot);
})();
