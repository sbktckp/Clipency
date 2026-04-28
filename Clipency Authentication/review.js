(function () {
  let submissions = [];
  let campaigns = [];
  let currentFilter = "pending";
  let searchTerm = "";
  let accessContext = null;

  function supabase() {
    return window.supabaseClient;
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function safe(value, fallback = "—") {
    return value === null || value === undefined || value === "" ? fallback : value;
  }

  function safeUrl(value) {
    try {
      const url = new URL(String(value || ""));
      if (!["http:", "https:"].includes(url.protocol)) return "";
      return url.href;
    } catch {
      return "";
    }
  }

  function money(value) {
    return `$${Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  }

  function statusClass(status) {
    const value = String(status || "pending").toLowerCase();

    if (value === "approved") return "approved";
    if (value === "rejected") return "rejected";
    if (value === "on_hold") return "pending";

    return "pending";
  }

  function getUrl(row) {
    return safeUrl(row.post_url || row.video_url || row.submission_url || row.clip_url || row.url || row.link || "");
  }

  function getTitle(row) {
    return row.campaign_title || row.title || row.campaign_name || "Campaign submission";
  }

  function getCreator(row) {
    return row.user_email || row.creator_email || row.email || row.clipper_id || row.user_id || "Unknown";
  }

  function getCampaign(row) {
    return campaigns.find((campaign) => campaign.id === row.campaign_id) || null;
  }

  function estimatedEarnings(row, views) {
    const campaign = getCampaign(row);
    const rpm = Number(campaign?.rpm || row.rpm || 0);
    return (Number(views || 0) / 1000000) * rpm;
  }

  async function loadCampaigns() {
    const { data } = await supabase()
      .from("campaigns")
      .select("id,title,rpm,currency");

    campaigns = data || [];
  }

  async function loadSubmissions() {
    const { data, error } = await supabase()
      .from("submissions")
      .select("*")
      .order("submitted_at", { ascending: false });

    if (error) throw error;

    submissions = data || [];
  }

  function renderStats() {
    const total = submissions.length;
    const pending = submissions.filter((s) => statusClass(s.status) === "pending").length;
    const approved = submissions.filter((s) => statusClass(s.status) === "approved").length;
    const rejected = submissions.filter((s) => statusClass(s.status) === "rejected").length;

    document.getElementById("review-stats").innerHTML = `
      <div class="staff-stat"><span>Total</span><strong>${total}</strong></div>
      <div class="staff-stat"><span>Pending</span><strong>${pending}</strong></div>
      <div class="staff-stat"><span>Approved</span><strong>${approved}</strong></div>
      <div class="staff-stat"><span>Rejected</span><strong>${rejected}</strong></div>
    `;
  }

  function filteredRows() {
    return submissions.filter((row) => {
      const rowStatus = statusClass(row.status);
      const statusMatches = currentFilter === "all" || rowStatus === currentFilter;

      const haystack = [
        getTitle(row),
        getCreator(row),
        row.platform,
        getUrl(row),
        row.status
      ].join(" ").toLowerCase();

      const searchMatches = !searchTerm || haystack.includes(searchTerm.toLowerCase());

      return statusMatches && searchMatches;
    });
  }

  function renderList() {
    const target = document.getElementById("review-list");
    const rows = filteredRows();

    if (!rows.length) {
      target.innerHTML = `<div class="staff-card loading-card">No clips match this view yet.</div>`;
      return;
    }

    target.innerHTML = rows.map((row) => {
      const id = row.id;
      const url = getUrl(row);
      const status = statusClass(row.status);
      const campaign = getCampaign(row);
      const views = Number(row.views || 0);
      const suggested = Number(row.earnings || estimatedEarnings(row, views)).toFixed(2);
      const submittedDate = row.submitted_at || row.created_at;

      return `
        <article class="review-card" data-id="${escapeHtml(id)}">
          <div class="review-head">
            <div>
              <h3>${escapeHtml(getTitle(row))}</h3>
              <p class="review-meta">
                Creator: ${escapeHtml(getCreator(row))}
                · Platform: ${escapeHtml(safe(row.platform, "Not set"))}
                · Rate: ${money(campaign?.rpm || 0)} / 1M views
                · Submitted: ${submittedDate ? new Date(submittedDate).toLocaleString() : "Unknown"}
              </p>
              <div class="review-card-header-line">
                <span class="badge">${escapeHtml(safe(row.platform, "Platform not set"))}</span>
                <span class="badge">${Number(row.views || 0).toLocaleString()} views</span>
                <span class="badge">${Number(row.likes || 0).toLocaleString()} likes</span>
                <span class="badge">${Number(row.comments || 0).toLocaleString()} comments</span>
              </div>
            </div>
            <span class="badge ${status}">${status}</span>
          </div>

          ${url ? `<div class="review-proof-box">${escapeHtml(url)}</div>` : `<div class="review-proof-box">No proof link was attached to this submission.</div>`}

          <div class="review-actions" style="margin-top:14px">
            ${url ? `<a class="action-btn link" href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">Open proof</a>` : ""}
            <span class="badge">Current earnings: ${money(row.earnings || 0)}</span>
          </div>

          <div class="review-form">
            <label>
              Views
              <input type="number" min="0" data-field="views" value="${Number(row.views || 0)}" />
            </label>

            <label>
              Likes
              <input type="number" min="0" data-field="likes" value="${Number(row.likes || 0)}" />
            </label>

            <label>
              Comments
              <input type="number" min="0" data-field="comments" value="${Number(row.comments || 0)}" />
            </label>

            <label>
              Earnings
              <input type="number" min="0" step="0.01" data-field="earnings" value="${suggested}" />
            </label>

            <label>
              Review note
              <textarea data-field="review_note" placeholder="Leave a clear note for the team">${escapeHtml(safe(row.admin_note || row.review_note, ""))}</textarea>
            </label>
          </div>

          <div class="review-actions">
            <button class="action-btn primary" data-action="approved">Approve</button>
            <button class="action-btn danger" data-action="rejected">Reject</button>
            <button class="action-btn" data-action="pending">Keep pending</button>
          </div>
        </article>
      `;
    }).join("");

    bindAutoEarnings();
  }

  function bindAutoEarnings() {
    document.querySelectorAll(".review-card").forEach((card) => {
      const row = submissions.find((s) => String(s.id) === String(card.dataset.id));
      const viewsInput = card.querySelector('[data-field="views"]');
      const earningsInput = card.querySelector('[data-field="earnings"]');

      if (!row || !viewsInput || !earningsInput) return;

      viewsInput.addEventListener("input", () => {
        earningsInput.value = estimatedEarnings(row, viewsInput.value).toFixed(2);
      });
    });
  }

  async function updateSubmission(card, status) {
    const id = card.getAttribute("data-id");

    const payoutStatus =
      status === "approved"
        ? "payout_pending"
        : status === "rejected"
          ? "rejected"
          : "not_ready";

    const note = card.querySelector('[data-field="review_note"]').value || null;

    const payload = {
      views: Number(card.querySelector('[data-field="views"]').value || 0),
      likes: Number(card.querySelector('[data-field="likes"]').value || 0),
      comments: Number(card.querySelector('[data-field="comments"]').value || 0),
      earnings: Number(card.querySelector('[data-field="earnings"]').value || 0),
      review_note: note,
      admin_note: note,
      status,
      payout_status: payoutStatus,
      reviewed_by: accessContext.user.id,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase()
      .from("submissions")
      .update(payload)
      .eq("id", id);

    if (error) throw error;

    await loadSubmissions();
    renderStats();
    renderList();
  }

  function bindEvents() {
    document.getElementById("review-filters").addEventListener("click", (event) => {
      const button = event.target.closest("button[data-filter]");
      if (!button) return;

      currentFilter = button.dataset.filter;

      document.querySelectorAll("#review-filters button").forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");

      renderList();
    });

    document.getElementById("review-search")?.addEventListener("input", (event) => {
      searchTerm = event.target.value.trim();
      renderList();
    });

    document.getElementById("review-list").addEventListener("click", async (event) => {
      const button = event.target.closest("button[data-action]");
      if (!button) return;

      const card = button.closest(".review-card");
      const status = button.dataset.action;

      button.disabled = true;
      const oldText = button.textContent;
      button.textContent = "Saving…";

      try {
        await updateSubmission(card, status);
      } catch (error) {
        alert(error.message || "Could not update submission.");
        button.disabled = false;
        button.textContent = oldText;
      }
    });

    document.getElementById("logout-link")?.addEventListener("click", async (event) => {
      event.preventDefault();
      await supabase().auth.signOut();
      window.location.href = "/login";
    });
  }

  async function boot() {
    accessContext = await window.ClipencyAccess.requireRole(["admin", "reviewer"]);
    if (!accessContext) return;

    bindEvents();

    try {
      await loadCampaigns();
      await loadSubmissions();
      renderStats();
      renderList();
    } catch (error) {
      document.getElementById("review-list").innerHTML = `
        <div class="staff-card loading-card">The review queue could not load: ${escapeHtml(error.message || "Unknown error")}</div>
      `;
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
})();
