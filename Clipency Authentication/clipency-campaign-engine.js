
(function () {
  const state = {
    campaigns: [],
    leaderboard: [],
    submissions: [],
    filter: "All",
    activeCampaignId: null,
    loaded: false,
    loading: false,
    booted: false
  };

  const mockNames = /Alex Rivera|Mia Chen|Jake Storm|Priya Singh|Leo Martinez/i;

  function q(selector, root = document) {
    return root.querySelector(selector);
  }

  function qa(selector, root = document) {
    return Array.from(root.querySelectorAll(selector));
  }

  function sb() {
    return window.supabaseClient || null;
  }

  function esc(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function num(value) {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }

  function money(value) {
    return "$" + num(value).toLocaleString(undefined, {
      maximumFractionDigits: 2
    });
  }

  function shortNumber(value) {
    const n = num(value);
    if (n >= 1000000000) return (n / 1000000000).toFixed(1).replace(".0", "") + "B";
    if (n >= 1000000) return (n / 1000000).toFixed(1).replace(".0", "") + "M";
    if (n >= 1000) return (n / 1000).toFixed(1).replace(".0", "") + "K";
    return String(Math.round(n));
  }

  function sameId(a, b) {
    return String(a ?? "").trim() === String(b ?? "").trim();
  }

  function approvedStatus(row) {
    const status = String(row?.status || "").toLowerCase();
    return status === "approved" || status === "paid";
  }

  function initials(name) {
    return String(name || "Creator")
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(part => part[0])
      .join("")
      .toUpperCase() || "CR";
  }

  function normalizeCampaign(row) {
    return {
      id: row.id,
      title: row.title || row.campaign_title || "Untitled Campaign",
      category: row.category || row.genre || "General",
      type: row.campaign_type || row.type || "Clipping",
      status: row.status || "active",

      rate: num(
        row.rate_per_million_usd ??
        row.rate_per_1m_views ??
        row.rpm ??
        row.rate ??
        0
      ),

      budget: num(
        row.budget_usd ??
        row.total_budget ??
        row.budget ??
        0
      ),

      spent: num(
        row.spent_usd ??
        row.spent ??
        0
      ),

      description: row.description || "",
      requirements: row.requirements || "",
      assetUrl: row.asset_url || row.reference_url || row.asset || "",
      createdAt: row.created_at || row.updated_at || ""
    };
  }

  function campaignSubmissionRows(campaign) {
    return state.submissions.filter(row => {
      return sameId(row.campaign_id, campaign.id) ||
             String(row.campaign_title || "").trim().toLowerCase() === campaign.title.trim().toLowerCase();
    });
  }

  function campaignApprovedRows(campaign) {
    return campaignSubmissionRows(campaign).filter(approvedStatus);
  }

  function performerRows(campaign) {
    const fromView = state.leaderboard
      .filter(row => sameId(row.campaign_id, campaign.id))
      .map(row => ({
        id: String(row.user_id || row.creator_id || row.creator_name || ""),
        name: row.creator_name || "Creator " + String(row.user_id || "").slice(0, 6),
        handle: row.handle || "",
        views: num(row.total_views),
        earnings: num(row.total_earnings),
        approvedSubmissions: num(row.approved_submissions)
      }))
      .filter(row => row.id || row.views || row.earnings);

    if (fromView.length) {
      return fromView.sort((a, b) => b.views - a.views || b.earnings - a.earnings);
    }

    const grouped = new Map();

    campaignApprovedRows(campaign).forEach(row => {
      const key = String(row.user_id || row.creator_id || row.profile_id || row.id);
      if (!grouped.has(key)) {
        grouped.set(key, {
          id: key,
          name: row.creator_name || row.full_name || row.name || row.user_name || "Creator " + key.slice(0, 6),
          handle: row.handle || row.username || "",
          views: 0,
          earnings: 0,
          approvedSubmissions: 0
        });
      }

      const item = grouped.get(key);
      const views = num(row.views ?? row.total_views ?? row.view_count ?? 0);
      const storedEarnings = num(row.earnings ?? row.amount ?? row.payout_amount ?? 0);

      item.views += views;
      item.earnings += storedEarnings > 0 ? storedEarnings : (views * campaign.rate) / 1000000;
      item.approvedSubmissions += 1;
    });

    return Array.from(grouped.values()).sort((a, b) => b.views - a.views || b.earnings - a.earnings);
  }

  function campaignStats(campaign) {
    const performers = performerRows(campaign);
    const top = performers.slice(0, 5);
    const approved = campaignApprovedRows(campaign);
    const all = campaignSubmissionRows(campaign);

    const views = performers.length
      ? performers.reduce((sum, row) => sum + num(row.views), 0)
      : approved.reduce((sum, row) => sum + num(row.views ?? row.total_views ?? 0), 0);

    const earnings = performers.length
      ? performers.reduce((sum, row) => sum + num(row.earnings), 0)
      : approved.reduce((sum, row) => {
          const views = num(row.views ?? row.total_views ?? 0);
          const stored = num(row.earnings ?? row.amount ?? row.payout_amount ?? 0);
          return sum + (stored > 0 ? stored : (views * campaign.rate) / 1000000);
        }, 0);

    const spent = campaign.spent > 0 ? campaign.spent : earnings;

    return {
      totalViews: views,
      approvedEarnings: earnings,
      spent,
      progress: campaign.budget > 0 ? Math.min(100, Math.max(0, (spent / campaign.budget) * 100)) : 0,
      creatorsCount: performers.length,
      approvedSubmissions: approved.length,
      allSubmissions: all.length,
      top
    };
  }

  async function waitForClient() {
    for (let i = 0; i < 40; i++) {
      if (sb()) return true;
      await new Promise(resolve => setTimeout(resolve, 150));
    }
    return false;
  }

  async function loadData(force = false) {
    if (state.loading) return;
    if (state.loaded && !force) return;

    state.loading = true;

    const ready = await waitForClient();
    if (!ready) {
      state.loading = false;
      throw new Error("Supabase client not ready");
    }

    const client = sb();

    const [campaignsRes, leaderboardRes, submissionsRes] = await Promise.all([
      client.from("campaigns").select("*").order("created_at", { ascending: false }),
      client.from("campaign_leaderboard_public").select("*"),
      client.from("submissions").select("*")
    ]);

    if (campaignsRes.error) {
      console.error("Campaign fetch failed:", campaignsRes.error);
      throw campaignsRes.error;
    }

    state.campaigns = (campaignsRes.data || []).map(normalizeCampaign);
    state.leaderboard = leaderboardRes.error ? [] : (leaderboardRes.data || []);
    state.submissions = submissionsRes.error ? [] : (submissionsRes.data || []);

    state.loaded = true;
    state.loading = false;
  }

  function filteredCampaigns() {
    return state.campaigns.filter(campaign => {
      if (state.filter === "All") return true;
      const filter = state.filter.toLowerCase();
      return campaign.category.toLowerCase() === filter ||
             campaign.type.toLowerCase() === filter;
    });
  }

  function campaignCard(campaign) {
    const s = campaignStats(campaign);

    return `
      <article class="campaign-card cx-live-campaign-card" data-campaign-id="${esc(campaign.id)}">
        <div class="card-icon">♫</div>

        <div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;margin-bottom:12px">
          <h3 class="campaign-title">${esc(campaign.title)}</h3>
          <span class="tag ${String(campaign.status).toLowerCase() === "active" ? "active" : ""}">${esc(campaign.status)}</span>
        </div>

        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:26px">
          <span class="tag">${esc(campaign.category)}</span>
          <span class="tag">${esc(campaign.type)}</span>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:18px">
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
          <div style="display:flex;justify-content:space-between;color:rgba(255,255,255,.55);font-weight:800;margin-bottom:8px">
            <span>Budget</span>
            <span>${money(s.spent)} / ${money(campaign.budget)}</span>
          </div>
          <div style="height:8px;background:rgba(255,255,255,.08);border-radius:99px;overflow:hidden">
            <div style="width:${s.progress}%;height:100%;background:linear-gradient(90deg,#7C3AED,#22C55E);border-radius:99px"></div>
          </div>
          <p style="color:rgba(255,255,255,.45);font-size:12px;margin-top:8px">${Math.round(s.progress)}% used</p>
        </div>
      </article>
    `;
  }

  function renderGrid() {
    const grid = q("#campaign-grid");
    const detail = q("#campaign-detail");
    const count = q("#campaign-count");

    if (!grid) return;

    if (detail) {
      detail.classList.add("hidden");
      detail.innerHTML = "";
      detail.removeAttribute("data-cx-live");
    }

    grid.style.display = "";
    grid.setAttribute("data-cx-live", "true");

    const campaigns = filteredCampaigns();

    if (count) {
      count.textContent = `${campaigns.length} campaign${campaigns.length === 1 ? "" : "s"}`;
    }

    if (!campaigns.length) {
      grid.innerHTML = `
        <div class="card" style="grid-column:1/-1;text-align:center;padding:44px">
          <h3>No campaigns found</h3>
          <p style="color:rgba(255,255,255,.55);margin-top:8px">Create or activate campaigns from Admin OS.</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = campaigns.map(campaignCard).join("");
  }

  function renderTopPerformers(campaign) {
    const s = campaignStats(campaign);

    if (!s.top.length) {
      return `<div style="text-align:center;color:rgba(255,255,255,.55);padding:24px">No approved performers yet.</div>`;
    }

    return s.top.map((item, index) => `
      <div style="display:grid;grid-template-columns:58px 54px 1fr auto;align-items:center;gap:16px;background:rgba(255,255,255,.035);border:1px solid rgba(255,255,255,.08);border-radius:16px;padding:16px 20px">
        <strong style="color:#FACC15">#${index + 1}</strong>
        <div style="width:46px;height:46px;border-radius:999px;background:#4338CA;display:grid;place-items:center;font-weight:900">${esc(initials(item.name))}</div>
        <div>
          <strong>${esc(item.name)}</strong>
          <p style="color:rgba(255,255,255,.45);margin:2px 0 0">${esc(item.handle || `${item.approvedSubmissions || 0} approved submission${item.approvedSubmissions === 1 ? "" : "s"}`)}</p>
        </div>
        <div style="text-align:right">
          <strong>${shortNumber(item.views)}</strong>
          <p style="color:#22C55E;font-weight:900;margin:2px 0 0">${money(item.earnings)}</p>
        </div>
      </div>
    `).join("");
  }

  function renderDetail(campaign) {
    const grid = q("#campaign-grid");
    const detail = q("#campaign-detail");

    if (!detail) return;

    const s = campaignStats(campaign);
    const req = String(campaign.requirements || "")
      .split(/\n|•/)
      .map(x => x.trim())
      .filter(Boolean);

    if (grid) {
      grid.style.display = "none";
      grid.removeAttribute("data-cx-live");
    }

    detail.classList.remove("hidden");
    detail.setAttribute("data-cx-live", "true");

    detail.innerHTML = `
      <button class="back-btn" id="cx-back-campaign">← Back to campaigns</button>

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
          <h1 style="font-size:42px;margin-bottom:8px">${shortNumber(s.totalViews)}</h1>
          <p style="color:#22C55E;font-weight:900;margin-bottom:28px">${s.approvedSubmissions} approved submission${s.approvedSubmissions === 1 ? "" : "s"}</p>

          <svg viewBox="0 0 700 180" style="width:100%;height:180px;margin-bottom:24px" preserveAspectRatio="none">
            <defs>
              <linearGradient id="cxLiveGrad" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stop-color="rgba(34,197,94,.38)"/>
                <stop offset="100%" stop-color="rgba(34,197,94,0)"/>
              </linearGradient>
            </defs>
            <polyline fill="none" stroke="rgba(34,197,94,.95)" stroke-width="4" points="0,145 90,132 180,118 270,96 360,80 450,62 560,40 700,22"/>
            <polygon fill="url(#cxLiveGrad)" points="0,180 0,145 90,132 180,118 270,96 360,80 450,62 560,40 700,22 700,180"/>
          </svg>

          <button class="submit-btn" id="cx-open-submit">Submit Your Clip →</button>
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
        <h4 style="text-align:center;margin-bottom:24px">Campaign Details</h4>
        <div style="max-width:860px;margin:0 auto;display:grid;gap:18px">
          <div>
            <strong>Description</strong>
            <p style="color:rgba(255,255,255,.65);margin-top:8px">${esc(campaign.description || "No description added yet.")}</p>
          </div>
          <div>
            <strong>Requirements</strong>
            <div style="display:grid;gap:12px;margin-top:12px">
              ${
                req.length
                  ? req.map(item => `<div style="font-weight:900;color:rgba(255,255,255,.82)">✅ ${esc(item)}</div>`).join("")
                  : `<div style="font-weight:900;color:rgba(255,255,255,.65)">✅ ${esc(campaign.requirements || "No requirements added yet.")}</div>`
              }
            </div>
          </div>
        </div>
      </div>

      <div class="card card-purple">
        <h4 style="margin-bottom:18px">Top 5 Performers</h4>
        <div style="display:grid;gap:14px">
          ${renderTopPerformers(campaign)}
        </div>
      </div>
    `;

    q("#cx-back-campaign")?.addEventListener("click", () => {
      state.activeCampaignId = null;
      renderGrid();
    });

    q("#cx-open-submit")?.addEventListener("click", () => openSubmitModal(campaign));
  }

  function openSubmitModal(campaign) {
    const modal = q("#submit-modal");
    const box = q("#modal-box");

    if (!modal || !box) {
      alert("Submit modal not found.");
      return;
    }

    box.innerHTML = `
      <button type="button" id="cx-close-submit" style="float:right;background:transparent;color:#fff;border:0;font-size:24px;cursor:pointer">×</button>
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

    q("#cx-close-submit")?.addEventListener("click", () => modal.classList.add("hidden"));

    q("#cx-submit-form")?.addEventListener("submit", async event => {
      event.preventDefault();

      const client = sb();

      if (!client) {
        alert("Supabase not ready.");
        return;
      }

      const form = event.currentTarget;
      const button = form.querySelector("button[type='submit']");
      button.disabled = true;
      button.textContent = "Submitting...";

      let user = null;

      try {
        const session = await client.auth.getSession();
        user = session?.data?.session?.user || null;
      } catch (_) {}

      const payload = {
        user_id: user?.id || null,
        campaign_id: campaign.id,
        campaign_title: campaign.title,
        platform: form.platform.value,
        clip_url: form.clip_url.value,
        status: "pending",
        views: 0,
        earnings: 0
      };

      const { error } = await client.from("submissions").insert(payload);

      if (error) {
        alert("Submission failed: " + error.message);
        button.disabled = false;
        button.textContent = "Submit for Review →";
        return;
      }

      modal.classList.add("hidden");
      await render(true);
      alert("Clip submitted for review.");
    });
  }

  async function render(force = false) {
    const grid = q("#campaign-grid");

    if (!grid) return;

    if (!state.loaded || force) {
      grid.innerHTML = `
        <div class="card" style="grid-column:1/-1;text-align:center;padding:44px">
          <h3>Loading live campaigns...</h3>
          <p style="color:rgba(255,255,255,.55);margin-top:8px">Reading admin campaign records.</p>
        </div>
      `;

      try {
        await loadData(force);
      } catch (error) {
        console.error(error);
        grid.innerHTML = `
          <div class="card" style="grid-column:1/-1;text-align:center;padding:44px">
            <h3>Could not load campaigns</h3>
            <p style="color:rgba(255,255,255,.55);margin-top:8px">${esc(error.message || error)}</p>
          </div>
        `;
        return;
      }
    }

    const active = state.campaigns.find(campaign => sameId(campaign.id, state.activeCampaignId));

    if (active) {
      renderDetail(active);
    } else {
      renderGrid();
    }
  }

  function bindEvents() {
    document.addEventListener("click", event => {
      const filter = event.target.closest("#genre-filters [data-genre]");
      if (filter) {
        event.preventDefault();
        event.stopImmediatePropagation();

        qa("#genre-filters [data-genre]").forEach(btn => btn.classList.remove("active"));
        filter.classList.add("active");

        state.filter = filter.dataset.genre || "All";
        state.activeCampaignId = null;
        render();
        return;
      }

      const card = event.target.closest("#campaign-grid .campaign-card, #campaign-grid [data-campaign-id]");
      if (card) {
        event.preventDefault();
        event.stopImmediatePropagation();

        const id = card.dataset.campaignId || card.dataset.id || card.getAttribute("data-campaign-id");
        const campaign = state.campaigns.find(c => sameId(c.id, id));

        if (campaign) {
          state.activeCampaignId = campaign.id;
          renderDetail(campaign);
        }
      }
    }, true);
  }

  function guardAgainstOldRenderer() {
    const section = q("#section-campaigns");
    if (!section || section.dataset.cxGuarded === "true") return;

    section.dataset.cxGuarded = "true";

    const observer = new MutationObserver(() => {
      const grid = q("#campaign-grid");
      const detail = q("#campaign-detail");

      const oldGridActive = grid && grid.style.display !== "none" && !grid.hasAttribute("data-cx-live") && grid.children.length;
      const oldDetailActive = detail && !detail.classList.contains("hidden") && !detail.hasAttribute("data-cx-live");
      const hasMock = detail && mockNames.test(detail.textContent || "");

      if (hasMock || oldDetailActive) {
        const id =
          state.activeCampaignId ||
          detail?.querySelector("[data-campaign-id]")?.dataset?.campaignId ||
          q("#campaign-grid .campaign-card")?.dataset?.campaignId;

        const campaign = state.campaigns.find(c => sameId(c.id, id));

        if (campaign) {
          renderDetail(campaign);
        }
      } else if (oldGridActive && !state.activeCampaignId) {
        renderGrid();
      }
    });

    observer.observe(section, { childList: true, subtree: true });
  }

  async function boot() {
    if (state.booted) return;
    if (!q("#campaign-grid")) return;

    state.booted = true;

    bindEvents();
    guardAgainstOldRenderer();

    window.renderCampaigns = render;

    await render(true);

    setTimeout(() => render(true), 1000);
    setTimeout(() => render(true), 2500);
  }

  window.cxCampaignEngine = {
    state,
    render,
    reload: () => render(true),
    debug: () => ({
      campaigns: state.campaigns,
      leaderboard: state.leaderboard,
      submissions: state.submissions,
      activeCampaignId: state.activeCampaignId
    })
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
