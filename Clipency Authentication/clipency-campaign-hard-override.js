
(function () {
  const CX = {
    campaigns: [],
    submissions: [],
    leaderboard: [],
    filter: "All",
    activeCampaignId: null,
    loaded: false,
    rendering: false,
    lastGridHtml: ""
  };

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  function client() {
    return window.supabaseClient || window.supabase || null;
  }

  function esc(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function n(value) {
    const number = Number(value);
    return Number.isFinite(number) ? number : 0;
  }

  function money(value) {
    return "$" + n(value).toLocaleString(undefined, { maximumFractionDigits: 2 });
  }

  function short(value) {
    const number = n(value);
    if (number >= 1_000_000_000) return (number / 1_000_000_000).toFixed(1).replace(".0", "") + "B";
    if (number >= 1_000_000) return (number / 1_000_000).toFixed(1).replace(".0", "") + "M";
    if (number >= 1_000) return (number / 1_000).toFixed(1).replace(".0", "") + "K";
    return String(Math.round(number));
  }

  function same(a, b) {
    return String(a ?? "").trim() === String(b ?? "").trim();
  }

  function okStatus(row) {
    const status = String(row?.status || "").toLowerCase();
    return status === "approved" || status === "paid" || status.includes("approved");
  }

  function initials(name) {
    return String(name || "Creator")
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(x => x[0])
      .join("")
      .toUpperCase() || "CR";
  }

  function normalCampaign(row) {
    return {
      id: row.id,
      title: row.title || row.campaign_title || "Untitled Campaign",
      category: row.category || row.genre || "General",
      type: row.campaign_type || row.type || "Clipping",
      status: row.status || "active",
      rate: n(row.rate_per_million_usd ?? row.rate_per_1m_views ?? row.rpm ?? row.rate ?? 0),
      budget: n(row.budget_usd ?? row.total_budget ?? row.budget ?? 0),
      spent: n(row.spent_usd ?? row.spent ?? 0),
      description: row.description || "No description added yet.",
      requirements: row.requirements || "No requirements added yet.",
      assetUrl: row.asset_url || row.reference_url || row.asset || "",
      platforms: row.platforms || row.platform || "Instagram, TikTok, YouTube Shorts"
    };
  }

  function campaignRows(campaign) {
    return CX.submissions.filter(row => {
      return same(row.campaign_id, campaign.id) ||
             same(row.campaign, campaign.id) ||
             String(row.campaign_title || "").trim().toLowerCase() === campaign.title.trim().toLowerCase();
    });
  }

  function approvedRows(campaign) {
    return campaignRows(campaign).filter(okStatus);
  }

  function rowViews(row) {
    return n(row.views ?? row.total_views ?? row.view_count ?? row.approved_views ?? 0);
  }

  function rowEarnings(row, campaign) {
    const stored = n(row.earnings ?? row.amount ?? row.payout_amount ?? row.approved_earnings ?? 0);
    if (stored > 0) return stored;
    return (rowViews(row) * campaign.rate) / 1_000_000;
  }

  function topPerformers(campaign) {
    const fromView = CX.leaderboard
      .filter(row => same(row.campaign_id, campaign.id))
      .map(row => ({
        name: row.creator_name || row.name || row.email || row.user_id || "Creator",
        handle: row.handle || row.creator_handle || row.email || "",
        views: n(row.total_views ?? row.views ?? 0),
        earnings: n(row.total_earnings ?? row.earnings ?? 0)
      }));

    if (fromView.length) {
      return fromView
        .sort((a, b) => b.views - a.views || b.earnings - a.earnings)
        .slice(0, 5)
        .map(x => ({ ...x, avatar: initials(x.name) }));
    }

    const grouped = new Map();

    approvedRows(campaign).forEach(row => {
      const key = String(row.user_id || row.creator_id || row.profile_id || row.email || row.user_email || row.creator_email || row.name || row.id);
      if (!grouped.has(key)) {
        const name = row.creator_name || row.full_name || row.name || row.user_name || row.email || row.user_email || "Creator " + key.slice(0, 6);
        grouped.set(key, {
          name,
          handle: row.handle || row.username || row.email || row.user_email || "",
          views: 0,
          earnings: 0,
          avatar: initials(name)
        });
      }

      const item = grouped.get(key);
      item.views += rowViews(row);
      item.earnings += rowEarnings(row, campaign);
    });

    return Array.from(grouped.values())
      .sort((a, b) => b.views - a.views || b.earnings - a.earnings)
      .slice(0, 5);
  }

  function stats(campaign) {
    const approved = approvedRows(campaign);
    const all = campaignRows(campaign);
    const top = topPerformers(campaign);

    const totalViews = top.length
      ? top.reduce((sum, row) => sum + n(row.views), 0)
      : approved.reduce((sum, row) => sum + rowViews(row), 0);

    const approvedEarnings = top.length
      ? top.reduce((sum, row) => sum + n(row.earnings), 0)
      : approved.reduce((sum, row) => sum + rowEarnings(row, campaign), 0);

    const spent = campaign.spent > 0 ? campaign.spent : approvedEarnings;
    const progress = campaign.budget > 0 ? Math.min(100, Math.max(0, (spent / campaign.budget) * 100)) : 0;

    return {
      allSubmissions: all.length,
      approvedSubmissions: approved.length,
      creatorsCount: top.length,
      totalViews,
      approvedEarnings,
      spent,
      progress,
      top
    };
  }

  async function load() {
    const sb = client();
    if (!sb) return;

    const campaignRes = await sb
      .from("campaigns")
      .select("*")
      .order("created_at", { ascending: false });

    CX.campaigns = (campaignRes.data || []).map(normalCampaign);

    const leaderboardRes = await sb
      .from("campaign_leaderboard_public")
      .select("*");

    CX.leaderboard = leaderboardRes.data || [];

    const submissionsRes = await sb
      .from("submissions")
      .select("*");

    CX.submissions = submissionsRes.data || [];
    CX.loaded = true;
  }

  function filteredCampaigns() {
    return CX.campaigns.filter(campaign => {
      if (CX.filter === "All") return true;
      const f = CX.filter.toLowerCase();
      return campaign.category.toLowerCase() === f || campaign.type.toLowerCase() === f;
    });
  }

  function renderGrid() {
    const grid = $("#campaign-grid");
    const detail = $("#campaign-detail");
    const count = $("#campaign-count");

    if (!grid || CX.rendering) return;

    CX.rendering = true;

    if (detail) {
      detail.classList.add("hidden");
      detail.innerHTML = "";
    }

    grid.style.display = "";
    grid.dataset.cxHardFixed = "true";

    const campaigns = filteredCampaigns();

    if (count) {
      count.textContent = `${campaigns.length} campaign${campaigns.length === 1 ? "" : "s"}`;
    }

    if (!campaigns.length) {
      grid.innerHTML = `
        <div class="card" style="grid-column:1/-1;text-align:center;padding:44px">
          <h3>No campaigns found</h3>
          <p style="color:rgba(255,255,255,.55);margin-top:8px">Create or activate campaigns from the admin dashboard.</p>
        </div>
      `;
      CX.rendering = false;
      return;
    }

    const html = campaigns.map(campaign => {
      const s = stats(campaign);
      const progress = Math.round(s.progress);

      return `
        <article class="campaign-card cx-hard-campaign-card" data-id="${esc(campaign.id)}">
          <div class="card-icon">♫</div>
          <div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;margin-bottom:12px">
            <h3 class="campaign-title">${esc(campaign.title)}</h3>
            <span class="tag ${String(campaign.status).toLowerCase() === "active" ? "active" : ""}">${esc(campaign.status)}</span>
          </div>

          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:22px">
            <span class="tag">${esc(campaign.category)}</span>
            <span class="tag">${esc(campaign.type)}</span>
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-top:18px">
            <div>
              <p style="color:rgba(255,255,255,.45);font-weight:800">Rate per 1M Views</p>
              <h2>${money(campaign.rate)}</h2>
            </div>
            <div style="text-align:right">
              <p style="color:rgba(255,255,255,.45);font-weight:800">Approved Creators</p>
              <h2 style="color:#A78BFA">${s.creatorsCount}</h2>
            </div>
          </div>

          <div style="margin-top:20px">
            <div style="display:flex;justify-content:space-between;color:rgba(255,255,255,.5);font-weight:800;margin-bottom:8px">
              <span>Budget</span>
              <span>${money(s.spent)} / ${money(campaign.budget)}</span>
            </div>
            <div style="height:8px;background:rgba(255,255,255,.08);border-radius:99px;overflow:hidden">
              <div style="width:${s.progress}%;height:100%;background:linear-gradient(90deg,#7C3AED,#22C55E);border-radius:99px"></div>
            </div>
            <p style="color:rgba(255,255,255,.45);font-size:12px;margin-top:8px">${progress}% used</p>
          </div>
        </article>
      `;
    }).join("");

    grid.innerHTML = html;
    CX.lastGridHtml = html;
    CX.rendering = false;
  }

  function renderDetail(campaign) {
    const grid = $("#campaign-grid");
    const detail = $("#campaign-detail");
    if (!detail) return;

    const s = stats(campaign);
    const req = String(campaign.requirements || "")
      .split(/\n|•/)
      .map(x => x.trim())
      .filter(Boolean);

    if (grid) grid.style.display = "none";

    detail.classList.remove("hidden");
    detail.dataset.cxHardFixed = "true";

    detail.innerHTML = `
      <button class="back-btn" id="cx-hard-back">← Back to campaigns</button>

      <div style="display:grid;grid-template-columns:minmax(280px,.85fr) 1.35fr;gap:30px;margin:28px 0">
        <div class="card card-purple">
          <div class="card-icon">♫</div>
          <h2 style="margin-top:18px">${esc(campaign.title)}</h2>
          <p style="color:rgba(255,255,255,.5);font-weight:800">${esc(campaign.category)} · ${esc(campaign.type)}</p>

          <div style="display:grid;gap:14px;margin-top:28px">
            <div class="detail-stat"><span class="detail-stat-label">Rate per 1M Views</span><span class="detail-stat-value" style="color:#22C55E">${money(campaign.rate)}</span></div>
            <div class="detail-stat"><span class="detail-stat-label">Total Budget</span><span class="detail-stat-value" style="color:#FACC15">${money(campaign.budget)}</span></div>
            <div class="detail-stat"><span class="detail-stat-label">Spent</span><span class="detail-stat-value">${money(s.spent)}</span></div>
            <div class="detail-stat"><span class="detail-stat-label">Approved Creators</span><span class="detail-stat-value" style="color:#A78BFA">${s.creatorsCount}</span></div>
            <div class="detail-stat"><span class="detail-stat-label">Status</span><span class="detail-stat-value">${esc(campaign.status)}</span></div>
          </div>

          ${campaign.assetUrl ? `<a href="${esc(campaign.assetUrl)}" target="_blank" rel="noopener noreferrer" style="display:inline-block;margin-top:22px">Open asset / reference</a>` : ""}
        </div>

        <div class="card card-purple">
          <p style="color:rgba(255,255,255,.45);font-size:12px;margin-bottom:4px">Total Approved Views</p>
          <h1 style="font-size:42px;margin-bottom:8px">${short(s.totalViews)}</h1>
          <p style="color:#22C55E;font-weight:900;margin-bottom:28px">Live approved campaign performance</p>

          <svg viewBox="0 0 700 180" style="width:100%;height:180px;margin-bottom:24px" preserveAspectRatio="none">
            <defs>
              <linearGradient id="cxHardGrad" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stop-color="rgba(34,197,94,.38)"/>
                <stop offset="100%" stop-color="rgba(34,197,94,0)"/>
              </linearGradient>
            </defs>
            <polyline fill="none" stroke="rgba(34,197,94,.95)" stroke-width="4" points="0,145 90,132 180,118 270,96 360,80 450,62 560,40 700,22"/>
            <polygon fill="url(#cxHardGrad)" points="0,180 0,145 90,132 180,118 270,96 360,80 450,62 560,40 700,22 700,180"/>
          </svg>

          <button class="submit-btn" id="cx-hard-submit">Submit Your Clip →</button>
        </div>
      </div>

      <div class="card card-purple" style="margin-bottom:28px">
        <div style="display:flex;justify-content:space-between;gap:12px;align-items:center;margin-bottom:12px">
          <h4>Budget Progress</h4>
          <strong>${money(s.spent)} / ${money(campaign.budget)}</strong>
        </div>
        <div style="height:10px;background:rgba(255,255,255,.08);border-radius:999px;overflow:hidden">
          <div style="width:${s.progress}%;height:100%;background:linear-gradient(90deg,#7C3AED,#22C55E);border-radius:999px"></div>
        </div>
        <div style="display:flex;justify-content:space-between;margin-top:12px;color:rgba(255,255,255,.55);font-weight:900">
          <span>${Math.round(s.progress)}% used</span>
          <span>RPM: ${money(campaign.rate)} / 1M views</span>
        </div>
      </div>

      <div class="card card-purple" style="margin-bottom:28px">
        <h4 style="text-align:center;margin-bottom:24px">Requirements</h4>
        <div style="max-width:780px;margin:0 auto;display:grid;gap:14px">
          ${
            req.length
              ? req.map(item => `<div style="font-weight:900;color:rgba(255,255,255,.82)">✅ ${esc(item)}</div>`).join("")
              : `<div style="font-weight:900;color:rgba(255,255,255,.65)">✅ ${esc(campaign.requirements)}</div>`
          }
        </div>
      </div>

      <div class="card card-purple">
        <h4 style="margin-bottom:18px">Top 5 Performers</h4>
        <div style="display:grid;gap:14px">
          ${
            s.top.length
              ? s.top.map((item, index) => `
                <div style="display:grid;grid-template-columns:58px 54px 1fr auto;align-items:center;gap:16px;background:rgba(255,255,255,.035);border:1px solid rgba(255,255,255,.08);border-radius:16px;padding:16px 20px">
                  <strong style="color:#FACC15">#${index + 1}</strong>
                  <div style="width:46px;height:46px;border-radius:999px;background:#4338CA;display:grid;place-items:center;font-weight:900">${esc(item.avatar)}</div>
                  <div>
                    <strong>${esc(item.name)}</strong>
                    <p style="color:rgba(255,255,255,.45);margin:2px 0 0">${esc(item.handle || "Approved creator")}</p>
                  </div>
                  <div style="text-align:right">
                    <strong>${short(item.views)}</strong>
                    <p style="color:#22C55E;font-weight:900;margin:2px 0 0">${money(item.earnings)}</p>
                  </div>
                </div>
              `).join("")
              : `<div style="text-align:center;color:rgba(255,255,255,.55);padding:24px">No approved performers yet.</div>`
          }
        </div>
      </div>
    `;

    $("#cx-hard-back")?.addEventListener("click", () => {
      CX.activeCampaignId = null;
      renderGrid();
      detail.classList.add("hidden");
    });

    $("#cx-hard-submit")?.addEventListener("click", () => openSubmit(campaign));
  }

  function openSubmit(campaign) {
    const modal = $("#submit-modal");
    const box = $("#modal-box");

    if (!modal || !box) {
      alert("Submit modal not found.");
      return;
    }

    box.innerHTML = `
      <button type="button" id="cx-submit-close" style="float:right;background:transparent;color:#fff;border:0;font-size:24px;cursor:pointer">×</button>
      <h2>Submit clip for ${esc(campaign.title)}</h2>
      <p style="color:rgba(255,255,255,.55);margin:8px 0 22px">Paste your public post, reel, video or clip link.</p>

      <form id="cx-submit-form" style="display:grid;gap:16px">
        <select name="platform" required>
          <option value="">Select platform</option>
          <option>Instagram</option>
          <option>TikTok</option>
          <option>YouTube Shorts</option>
          <option>Other</option>
        </select>
        <input name="clip_url" type="url" required placeholder="https://..." />
        <button class="submit-btn" type="submit">Submit for Review →</button>
      </form>
    `;

    modal.classList.remove("hidden");

    $("#cx-submit-close")?.addEventListener("click", () => modal.classList.add("hidden"));

    $("#cx-submit-form")?.addEventListener("submit", async event => {
      event.preventDefault();

      const sb = client();
      if (!sb) {
        alert("Supabase not ready.");
        return;
      }

      const form = event.currentTarget;
      const button = form.querySelector("button[type='submit']");
      button.disabled = true;
      button.textContent = "Submitting...";

      let user = null;
      try {
        const session = await sb.auth.getSession();
        user = session?.data?.session?.user || null;
      } catch (_) {}

      const payload = {
        user_id: user?.id,
        campaign_id: campaign.id,
        campaign_title: campaign.title,
        platform: form.platform.value,
        clip_url: form.clip_url.value,
        status: "pending",
        views: 0,
        earnings: 0
      };

      const { error } = await sb.from("submissions").insert(payload);

      if (error) {
        alert("Submission failed: " + error.message);
        button.disabled = false;
        button.textContent = "Submit for Review →";
        return;
      }

      modal.classList.add("hidden");
      await forceReload();
      alert("Clip submitted for review.");
    });
  }

  async function forceReload() {
    await load();

    if (CX.activeCampaignId) {
      const campaign = CX.campaigns.find(c => same(c.id, CX.activeCampaignId));
      if (campaign) renderDetail(campaign);
      else renderGrid();
    } else {
      renderGrid();
    }
  }

  function bindCapture() {
    document.addEventListener("click", event => {
      const filter = event.target.closest("#genre-filters [data-genre]");
      if (filter) {
        event.preventDefault();
        event.stopImmediatePropagation();

        $$("#genre-filters [data-genre]").forEach(btn => btn.classList.remove("active"));
        filter.classList.add("active");

        CX.filter = filter.dataset.genre || "All";
        CX.activeCampaignId = null;
        renderGrid();
        return;
      }

      const card = event.target.closest("#campaign-grid .campaign-card, #campaign-grid [data-campaign-id], #campaign-grid .classic-campaign-card");
      if (card) {
        event.preventDefault();
        event.stopImmediatePropagation();

        const id = card.dataset.id || card.dataset.campaignId || card.getAttribute("data-campaign-id");
        const campaign = CX.campaigns.find(c => same(c.id, id));

        if (campaign) {
          CX.activeCampaignId = campaign.id;
          renderDetail(campaign);
        }
      }
    }, true);
  }

  function observeOldRenderer() {
    const grid = $("#campaign-grid");
    const detail = $("#campaign-detail");
    const root = $("#section-campaigns");

    if (!root || root.dataset.cxObserverBound === "true") return;
    root.dataset.cxObserverBound = "true";

    const observer = new MutationObserver(() => {
      const hasOldMock = detail && /Alex Rivera|Mia Chen|Jake Storm|Priya Singh|Leo Martinez/.test(detail.textContent || "");
      const gridNeedsFix = grid && !grid.querySelector(".cx-hard-campaign-card") && grid.children.length;

      if (hasOldMock) {
        const campaign = CX.campaigns.find(c => same(c.id, CX.activeCampaignId));
        if (campaign) renderDetail(campaign);
      } else if (gridNeedsFix && !CX.activeCampaignId) {
        renderGrid();
      }
    });

    observer.observe(root, { childList: true, subtree: true });
  }

  async function boot() {
    if (!$("#campaign-grid")) return;

    bindCapture();
    observeOldRenderer();

    let tries = 0;
    while (!client() && tries < 30) {
      tries++;
      await new Promise(resolve => setTimeout(resolve, 150));
    }

    await forceReload();

    setTimeout(forceReload, 700);
    setTimeout(forceReload, 1800);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }

  window.cxCampaignHardReload = forceReload;
})();
