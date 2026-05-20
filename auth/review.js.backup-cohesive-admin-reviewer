(function () {
  let submissions = [];
  let currentFilter = "all";
  let accessContext = null;

  function supabase() {
    return window.supabaseClient;
  }

  function safe(value, fallback = "—") {
    return value === null || value === undefined || value === "" ? fallback : value;
  }

  function statusClass(status) {
    const value = String(status || "pending").toLowerCase();

    if (value.includes("approved")) return "approved";
    if (value.includes("reject")) return "rejected";
    return "pending";
  }

  function getUrl(row) {
    return row.submission_url || row.post_url || row.clip_url || row.url || row.link || row.content_url || "";
  }

  function getTitle(row) {
    return row.campaign_title || row.title || row.campaign_name || "Campaign submission";
  }

  function getCreator(row) {
    return row.user_email || row.creator_email || row.email || row.user_id || row.clipper_id || "Unknown";
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
    const pending = submissions.filter(s => statusClass(s.status) === "pending").length;
    const approved = submissions.filter(s => statusClass(s.status) === "approved").length;
    const rejected = submissions.filter(s => statusClass(s.status) === "rejected").length;

    document.getElementById("review-stats").innerHTML = `
      <div class="staff-stat"><span>Total</span><strong>${total}</strong></div>
      <div class="staff-stat"><span>Pending</span><strong>${pending}</strong></div>
      <div class="staff-stat"><span>Approved</span><strong>${approved}</strong></div>
      <div class="staff-stat"><span>Rejected</span><strong>${rejected}</strong></div>
    `;
  }

  function filteredRows() {
    if (currentFilter === "all") return submissions;
    return submissions.filter((row) => statusClass(row.status) === currentFilter);
  }

  function renderList() {
    const target = document.getElementById("review-list");
    const rows = filteredRows();

    if (!rows.length) {
      target.innerHTML = `<div class="staff-card loading-card">No ${currentFilter === "all" ? "" : currentFilter} submissions found.</div>`;
      return;
    }

    target.innerHTML = rows.map((row) => {
      const id = row.id;
      const url = getUrl(row);
      const status = statusClass(row.status);
      const earnings = Number(row.earnings || 0).toFixed(2);

      return `
        <article class="review-card" data-id="${id}">
          <div class="review-head">
            <div>
              <h3>${getTitle(row)}</h3>
              <p class="review-meta">
                Platform: ${safe(row.platform, "Not specified")} · 
                Creator: ${safe(getCreator(row), "Unknown")} ·
                Submitted: ${row.submitted_at ? new Date(row.submitted_at).toLocaleString() : "Unknown"}
              </p>
            </div>
            <span class="badge ${status}">${status}</span>
          </div>

          <div class="review-actions">
            ${url ? `<a class="action-btn link" href="${url}" target="_blank" rel="noopener">Open proof URL</a>` : ""}
            <span class="badge">Earnings: $${earnings}</span>
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
              <input type="number" min="0" step="0.01" data-field="earnings" value="${earnings}" />
            </label>

            <label>
              Review note
              <textarea data-field="review_note" placeholder="Add a short review note">${safe(row.review_note, "")}</textarea>
            </label>
          </div>

          <div class="review-actions">
            <button class="action-btn primary" data-action="approved">Approve</button>
            <button class="action-btn danger" data-action="rejected">Reject</button>
            <button class="action-btn" data-action="pending">Save pending</button>
          </div>
        </article>
      `;
    }).join("");
  }

  async function updateSubmission(card, status) {
    const id = card.getAttribute("data-id");

    const payload = {
      views: Number(card.querySelector('[data-field="views"]').value || 0),
      likes: Number(card.querySelector('[data-field="likes"]').value || 0),
      comments: Number(card.querySelector('[data-field="comments"]').value || 0),
      earnings: Number(card.querySelector('[data-field="earnings"]').value || 0),
      review_note: card.querySelector('[data-field="review_note"]').value || null,
      status,
      reviewed_by: accessContext.user.id,
      reviewed_at: new Date().toISOString()
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
      await loadSubmissions();
      renderStats();
      renderList();
    } catch (error) {
      document.getElementById("review-list").innerHTML = `
        <div class="staff-card loading-card">Could not load review queue: ${error.message}</div>
      `;
    }
  }

  document.addEventListener("DOMContentLoaded", boot);
})();
