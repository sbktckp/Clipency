(function () {
  let cache = {
    time: 0,
    data: null
  };

  let running = false;
  let renderTimer = null;

  function client() {
    return window.supabaseClient || window._supabase || null;
  }

  function money(value) {
    const num = Number(value || 0);
    if (num >= 1000) return `$${(num / 1000).toFixed(num >= 10000 ? 0 : 1)}K`;
    return `$${num.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  }

  function compact(value) {
    const num = Number(value || 0);
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return `${num.toLocaleString()}`;
  }

  function pct(value) {
    const num = Number(value || 0);
    return `${num.toFixed(num >= 10 ? 1 : 2)}%`;
  }

  function safeDate(value) {
    const date = value ? new Date(value) : new Date();
    return Number.isNaN(date.getTime()) ? new Date() : date;
  }

  function normalize(row) {
    return {
      id: row.id,
      title: row.campaign_title || row.title || row.campaign_name || "Campaign",
      status: String(row.status || "pending").toLowerCase(),
      platform: row.platform || "Instagram",
      submittedAt: safeDate(row.submitted_at || row.created_at),
      views: Number(row.views || 0),
      likes: Number(row.likes || 0),
      comments: Number(row.comments || 0),
      earnings: Number(row.earnings || row.amount || 0)
    };
  }

  async function fetchSubmissions() {
    if (cache.data && Date.now() - cache.time < 30000) return cache.data;

    const supabase = client();
    if (!supabase) throw new Error("Supabase client is still loading.");

    let userId = null;

    try {
      const { data } = await supabase.auth.getUser();
      userId = data && data.user ? data.user.id : null;
    } catch (_) {}

    let query = supabase
      .from("submissions")
      .select("*")
      .order("submitted_at", { ascending: true });

    if (userId) {
      query = query.eq("clipper_id", userId);
    }

    const { data, error } = await query;

    if (error) throw error;

    const normalized = (data || []).map(normalize);
    cache = { time: Date.now(), data: normalized };

    return normalized;
  }

  function isDashboardSurface() {
    return Boolean(
      document.querySelector(".sidebar, .dashboard-sidebar, aside") ||
      /dashboard|stats|payouts|wallet|profile/.test(window.location.pathname)
    );
  }

  function shouldRenderAnalytics() {
    const text = document.body.innerText.toLowerCase();
    return (
      /dashboard|stats/.test(window.location.pathname) ||
      text.includes("your stats") ||
      text.includes("good evening")
    );
  }

  function findHost() {
    return (
      document.querySelector(".main-content") ||
      document.querySelector(".dashboard-main") ||
      document.querySelector(".content") ||
      document.querySelector("main") ||
      document.body
    );
  }

  function groupByMonth(rows) {
    const map = new Map();

    rows.forEach((row) => {
      const key = row.submittedAt.toLocaleString("en", { month: "short" });
      const existing = map.get(key) || { label: key, views: 0, earnings: 0, clips: 0 };

      existing.views += row.views;
      existing.earnings += row.earnings;
      existing.clips += 1;

      map.set(key, existing);
    });

    return Array.from(map.values()).slice(-8);
  }

  function groupByCampaign(rows) {
    const map = new Map();

    rows.forEach((row) => {
      const key = row.title;
      const existing = map.get(key) || {
        title: key,
        views: 0,
        earnings: 0,
        likes: 0,
        comments: 0,
        clips: 0,
        approved: 0
      };

      existing.views += row.views;
      existing.earnings += row.earnings;
      existing.likes += row.likes;
      existing.comments += row.comments;
      existing.clips += 1;
      if (row.status === "approved") existing.approved += 1;

      map.set(key, existing);
    });

    return Array.from(map.values())
      .sort((a, b) => b.views - a.views || b.earnings - a.earnings)
      .slice(0, 6);
  }

  function statusCounts(rows) {
    const counts = {
      approved: 0,
      pending: 0,
      rejected: 0,
      review: 0
    };

    rows.forEach((row) => {
      if (row.status.includes("approved")) counts.approved += 1;
      else if (row.status.includes("reject")) counts.rejected += 1;
      else if (row.status.includes("review")) counts.review += 1;
      else counts.pending += 1;
    });

    return counts;
  }

  function getTrend(rows) {
    const sorted = [...rows].sort((a, b) => a.submittedAt - b.submittedAt);
    const midpoint = Math.floor(sorted.length / 2);

    if (sorted.length < 4 || midpoint < 1) {
      return {
        label: "Build more history",
        detail: "Submit more clips to unlock stronger trend signals."
      };
    }

    const first = sorted.slice(0, midpoint).reduce((sum, row) => sum + row.views, 0);
    const second = sorted.slice(midpoint).reduce((sum, row) => sum + row.views, 0);

    if (!first) {
      return {
        label: "New momentum",
        detail: "Recent clips are creating the first measurable baseline."
      };
    }

    const change = ((second - first) / first) * 100;

    return {
      label: change >= 0 ? `+${change.toFixed(1)}%` : `${change.toFixed(1)}%`,
      detail: change >= 0 ? "Views are improving against your earlier submissions." : "Views have dipped against your earlier submissions."
    };
  }

  function lineChart(points, metric) {
    const values = points.map((point) => Number(point[metric] || 0));
    const labels = points.map((point) => point.label);

    const width = 760;
    const height = 230;
    const pad = 34;
    const max = Math.max(...values, 1);
    const min = Math.min(...values, 0);
    const range = Math.max(max - min, 1);

    const coords = values.length
      ? values.map((value, index) => {
          const x = values.length === 1 ? width / 2 : pad + (index * (width - pad * 2)) / (values.length - 1);
          const y = height - pad - ((value - min) / range) * (height - pad * 2);
          return [x, y];
        })
      : [[pad, height - pad], [width - pad, height - pad]];

    const path = coords.map((point, index) => `${index ? "L" : "M"} ${point[0]} ${point[1]}`).join(" ");
    const area = `${path} L ${coords[coords.length - 1][0]} ${height - pad} L ${coords[0][0]} ${height - pad} Z`;

    const grid = [0.25, 0.5, 0.75].map((ratio) => {
      const y = pad + ratio * (height - pad * 2);
      return `<line class="cx-grid-line" x1="${pad}" y1="${y}" x2="${width - pad}" y2="${y}" />`;
    }).join("");

    const dots = coords.map((point) => `<circle cx="${point[0]}" cy="${point[1]}" r="4.5" fill="#c4b5fd" />`).join("");

    const xLabels = labels.map((label, index) => {
      const x = values.length === 1 ? width / 2 : pad + (index * (width - pad * 2)) / Math.max(values.length - 1, 1);
      return `<text x="${x}" y="${height - 8}" text-anchor="middle">${label}</text>`;
    }).join("");

    return `
      <svg class="cx-svg-chart" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none">
        <defs>
          <linearGradient id="cxAreaGradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stop-color="#a78bfa" stop-opacity="0.38" />
            <stop offset="100%" stop-color="#7c3aed" stop-opacity="0.02" />
          </linearGradient>
        </defs>
        ${grid}
        <path class="cx-area-path" d="${area}" />
        <path class="cx-line-path" d="${path}" />
        ${dots}
        ${xLabels}
      </svg>
    `;
  }

  function barChart(groups) {
    const width = 760;
    const height = 230;
    const pad = 34;
    const max = Math.max(...groups.map((item) => item.views), 1);
    const barGap = 14;
    const barWidth = (width - pad * 2 - barGap * Math.max(groups.length - 1, 0)) / Math.max(groups.length, 1);

    const bars = groups.map((item, index) => {
      const h = Math.max(8, (item.views / max) * (height - pad * 2));
      const x = pad + index * (barWidth + barGap);
      const y = height - pad - h;
      const label = item.title.length > 12 ? item.title.slice(0, 12) + "…" : item.title;

      return `
        <rect class="cx-bar" x="${x}" y="${y}" width="${barWidth}" height="${h}" />
        <text x="${x + barWidth / 2}" y="${height - 8}" text-anchor="middle">${label}</text>
      `;
    }).join("");

    return `
      <svg class="cx-svg-chart" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none">
        <defs>
          <linearGradient id="cxBarGradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stop-color="#a78bfa" />
            <stop offset="100%" stop-color="#7c3aed" />
          </linearGradient>
        </defs>
        <line class="cx-grid-line" x1="${pad}" y1="${height - pad}" x2="${width - pad}" y2="${height - pad}" />
        ${bars}
      </svg>
    `;
  }

  function donutStyle(counts) {
    const total = Object.values(counts).reduce((sum, value) => sum + value, 0) || 1;
    const parts = [
      ["approved", "#22c55e"],
      ["pending", "#a78bfa"],
      ["review", "#14b8a6"],
      ["rejected", "#ef4444"]
    ];

    let cursor = 0;

    const gradient = parts.map(([key, color]) => {
      const start = cursor;
      const end = cursor + (counts[key] / total) * 100;
      cursor = end;
      return `${color} ${start}% ${end}%`;
    }).join(", ");

    return `background: conic-gradient(${gradient});`;
  }

  function qualityClass(rate) {
    if (rate >= 6) return "cx-quality-high";
    if (rate >= 2) return "cx-quality-mid";
    return "cx-quality-low";
  }

  function renderLoading(host) {
    let suite = document.getElementById("cx-analytics-suite");

    if (!suite) {
      suite = document.createElement("section");
      suite.id = "cx-analytics-suite";
      host.appendChild(suite);
    }

    suite.innerHTML = `
      <div class="cx-analytics-header">
        <div>
          <small>Performance Intelligence</small>
          <h2>Building your creator analytics…</h2>
          <p>Clipency is reading submissions, views, approval status and earnings.</p>
        </div>
      </div>
      <div class="cx-stat-grid">
        <div class="cx-skeleton" style="height:128px"></div>
        <div class="cx-skeleton" style="height:128px"></div>
        <div class="cx-skeleton" style="height:128px"></div>
        <div class="cx-skeleton" style="height:128px"></div>
      </div>
    `;
  }

  function renderEmpty(host) {
    let suite = document.getElementById("cx-analytics-suite");

    if (!suite) {
      suite = document.createElement("section");
      suite.id = "cx-analytics-suite";
      host.appendChild(suite);
    }

    suite.innerHTML = `
      <div class="cx-empty-state">
        <h2>No performance intelligence yet.</h2>
        <p>Once you submit clips and they start collecting views, this area will show trend lines, campaign comparison, review funnel, earning quality and engagement rate.</p>
      </div>
    `;
  }

  function renderError(host, error) {
    let suite = document.getElementById("cx-analytics-suite");

    if (!suite) {
      suite = document.createElement("section");
      suite.id = "cx-analytics-suite";
      host.appendChild(suite);
    }

    suite.innerHTML = `
      <div class="cx-error-state">
        <h2>Analytics could not load.</h2>
        <p>${error.message || "Please refresh once. If it repeats, check Supabase policies or table columns."}</p>
      </div>
    `;
  }

  function renderAnalytics(host, rows) {
    if (!rows.length) {
      renderEmpty(host);
      return;
    }

    const totalViews = rows.reduce((sum, row) => sum + row.views, 0);
    const totalEarnings = rows.reduce((sum, row) => sum + row.earnings, 0);
    const totalLikes = rows.reduce((sum, row) => sum + row.likes, 0);
    const totalComments = rows.reduce((sum, row) => sum + row.comments, 0);
    const approved = rows.filter((row) => row.status.includes("approved")).length;
    const pending = rows.filter((row) => row.status.includes("pending") || row.status.includes("review")).length;
    const engagementRate = totalViews ? ((totalLikes + totalComments) / totalViews) * 100 : 0;
    const earningPerThousand = totalViews ? (totalEarnings / totalViews) * 1000 : 0;
    const trend = getTrend(rows);
    const months = groupByMonth(rows);
    const campaigns = groupByCampaign(rows);
    const counts = statusCounts(rows);
    const best = campaigns[0];

    let suite = document.getElementById("cx-analytics-suite");

    if (!suite) {
      suite = document.createElement("section");
      suite.id = "cx-analytics-suite";
      host.appendChild(suite);
    }

    const tableRows = campaigns.map((campaign) => {
      const rate = campaign.views ? ((campaign.likes + campaign.comments) / campaign.views) * 100 : 0;
      const epm = campaign.views ? (campaign.earnings / campaign.views) * 1000 : 0;

      return `
        <tr>
          <td><strong>${campaign.title}</strong><br><span class="cx-badge">${campaign.clips} clip${campaign.clips === 1 ? "" : "s"}</span></td>
          <td>${compact(campaign.views)}</td>
          <td>${money(campaign.earnings)}</td>
          <td class="${qualityClass(rate)}">${pct(rate)}</td>
          <td>${money(epm)}</td>
        </tr>
      `;
    }).join("");

    suite.innerHTML = `
      <div class="cx-analytics-header">
        <div>
          <small>Performance Intelligence</small>
          <h2>Your campaign performance, explained.</h2>
          <p>These insights convert your submitted clips into actual creator intelligence: views, earnings, engagement quality, campaign contribution and approval flow.</p>
        </div>
        <div class="cx-refresh-chip">Live from submissions</div>
      </div>

      <div class="cx-stat-grid">
        <article class="cx-stat-card">
          <span>Total reach</span>
          <strong>${compact(totalViews)}</strong>
          <p>Views generated across all submitted clips.</p>
        </article>

        <article class="cx-stat-card">
          <span>Approved earnings</span>
          <strong>${money(totalEarnings)}</strong>
          <p>${money(earningPerThousand)} earned per 1K views.</p>
        </article>

        <article class="cx-stat-card">
          <span>Engagement rate</span>
          <strong>${pct(engagementRate)}</strong>
          <p>Likes and comments as a share of total views.</p>
        </article>

        <article class="cx-stat-card">
          <span>Momentum</span>
          <strong>${trend.label}</strong>
          <p>${trend.detail}</p>
        </article>
      </div>

      <div class="cx-analytics-grid">
        <article class="cx-chart-card">
          <div class="cx-chart-head">
            <div>
              <h3>Views trend</h3>
              <p>Shows whether your submissions are gaining stronger distribution over time.</p>
            </div>
            <span>${best ? `Best: ${best.title}` : "No leader yet"}</span>
          </div>
          ${lineChart(months, "views")}
        </article>

        <article class="cx-chart-card">
          <div class="cx-chart-head">
            <div>
              <h3>Review funnel</h3>
              <p>Submission status split across approval, pending review and rejected clips.</p>
            </div>
          </div>

          <div class="cx-donut-wrap">
            <div class="cx-donut" style="${donutStyle(counts)}">
              <div class="cx-donut-center">
                <div>
                  <strong>${rows.length}</strong>
                  <span>Total clips</span>
                </div>
              </div>
            </div>

            <div class="cx-legend">
              <div><span><i style="background:#22c55e"></i>Approved</span><strong>${counts.approved}</strong></div>
              <div><span><i style="background:#a78bfa"></i>Pending</span><strong>${counts.pending}</strong></div>
              <div><span><i style="background:#14b8a6"></i>Review</span><strong>${counts.review}</strong></div>
              <div><span><i style="background:#ef4444"></i>Rejected</span><strong>${counts.rejected}</strong></div>
            </div>
          </div>
        </article>

        <article class="cx-chart-card">
          <div class="cx-chart-head">
            <div>
              <h3>Campaign contribution</h3>
              <p>Which campaigns are producing the highest reach from your clips.</p>
            </div>
          </div>
          ${barChart(campaigns)}
        </article>

        <article class="cx-chart-card">
          <div class="cx-chart-head">
            <div>
              <h3>Earnings trend</h3>
              <p>Approved value generated across your submission history.</p>
            </div>
            <span>${approved} approved · ${pending} pending</span>
          </div>
          ${lineChart(months, "earnings")}
        </article>

        <article class="cx-table-card">
          <div class="cx-chart-head">
            <div>
              <h3>Campaign quality table</h3>
              <p>A practical breakdown of reach, earnings, engagement rate and earning efficiency by campaign.</p>
            </div>
          </div>

          <table class="cx-performance-table">
            <thead>
              <tr>
                <th>Campaign</th>
                <th>Views</th>
                <th>Earnings</th>
                <th>Engagement</th>
                <th>Earnings / 1K</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
        </article>
      </div>
    `;
  }

  async function run() {
    if (running) return;
    if (!isDashboardSurface() || !shouldRenderAnalytics()) return;

    const host = findHost();
    if (!host) return;

    running = true;

    try {
      renderLoading(host);
      const rows = await fetchSubmissions();
      renderAnalytics(host, rows);
    } catch (error) {
      renderError(host, error);
    } finally {
      running = false;
    }
  }

  function schedule() {
    clearTimeout(renderTimer);
    renderTimer = setTimeout(run, 650);
  }

  function boot() {
    schedule();

    document.addEventListener("click", (event) => {
      if (event.target.closest("a, button, .nav-item, .sidebar a, .sidebar button")) {
        schedule();
      }
    });

    const observer = new MutationObserver(() => {
      if (document.getElementById("cx-analytics-suite")) return;
      schedule();
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
