(function () {
  if (window.__clipencyFinalLogoutLoaded) return;
  window.__clipencyFinalLogoutLoaded = true;

  let loggingOut = false;

  function text(el) {
    return (el?.textContent || "").trim().toLowerCase();
  }

  function sidebarOf(el) {
    return el?.closest?.(".sidebar, .dashboard-sidebar, aside");
  }

  function isKnownLogout(el) {
    if (!el) return false;

    const href = el.getAttribute?.("href") || "";
    const aria = (el.getAttribute?.("aria-label") || "").toLowerCase();
    const title = (el.getAttribute?.("title") || "").toLowerCase();
    const cls = String(el.className || "").toLowerCase();
    const data = [
      el.dataset?.logout,
      el.dataset?.action,
      el.dataset?.auth,
      el.dataset?.target
    ].filter(Boolean).join(" ").toLowerCase();

    return (
      text(el) === "logout" ||
      text(el) === "log out" ||
      text(el) === "sign out" ||
      href === "/logout" ||
      href === "/signout" ||
      aria.includes("logout") ||
      aria.includes("log out") ||
      aria.includes("sign out") ||
      title.includes("logout") ||
      title.includes("log out") ||
      title.includes("sign out") ||
      cls.includes("logout") ||
      data.includes("logout") ||
      data.includes("signout")
    );
  }

  function isBottomRightSidebarIcon(el) {
    const sidebar = sidebarOf(el);
    if (!sidebar) return false;

    const clickable = el.closest("button, a, [role='button'], div");
    if (!clickable) return false;

    const sidebarBox = sidebar.getBoundingClientRect();
    const box = clickable.getBoundingClientRect();

    const isNearBottom = box.top > sidebarBox.bottom - 170;
    const isNearRight = box.right > sidebarBox.right - 92;
    const hasIcon = !!clickable.querySelector("svg, img") || clickable.children.length > 0;

    return isNearBottom && isNearRight && hasIcon;
  }

  function isLogoutTarget(event) {
    const clicked = event.target.closest("a, button, [role='button'], [data-logout], .logout, .logout-btn, div");

    if (!clicked) return false;

    if (isKnownLogout(clicked)) return true;

    return isBottomRightSidebarIcon(clicked);
  }

  function clearStoredAuth() {
    const removeFrom = (storage) => {
      const keys = [];

      for (let i = 0; i < storage.length; i++) {
        const key = storage.key(i);
        if (!key) continue;

        const lower = key.toLowerCase();

        if (
          lower.startsWith("sb-") ||
          lower.includes("supabase") ||
          lower.includes("auth-token") ||
          lower.includes("clipency.auth")
        ) {
          keys.push(key);
        }
      }

      keys.forEach((key) => storage.removeItem(key));
    };

    try { removeFrom(localStorage); } catch {}
    try { removeFrom(sessionStorage); } catch {}
  }

  async function waitForSupabase() {
    for (let i = 0; i < 40; i++) {
      if (window.supabaseClient?.auth?.signOut) return window.supabaseClient;
      await new Promise((resolve) => setTimeout(resolve, 50));
    }

    return null;
  }

  async function logoutNow() {
    if (loggingOut) return;
    loggingOut = true;

    document.documentElement.classList.add("cx-logging-out");

    try {
      const supabase = await waitForSupabase();

      if (supabase?.auth?.signOut) {
        await supabase.auth.signOut({ scope: "global" });
      }
    } catch (error) {
      console.warn("Logout signOut failed, clearing local auth anyway.", error);
    }

    clearStoredAuth();

    setTimeout(function () {
      window.location.replace("/login?logged_out=1");
    }, 80);
  }

  function handleLogoutEvent(event) {
    if (!isLogoutTarget(event)) return;

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    logoutNow();
  }

  document.addEventListener("pointerdown", handleLogoutEvent, true);
  document.addEventListener("mousedown", handleLogoutEvent, true);
  document.addEventListener("click", handleLogoutEvent, true);

  function markLogoutIcon() {
    document.querySelectorAll(".sidebar, .dashboard-sidebar, aside").forEach((sidebar) => {
      const candidates = Array.from(sidebar.querySelectorAll("button, a, [role='button'], div"));

      candidates.forEach((el) => {
        if (isKnownLogout(el) || isBottomRightSidebarIcon(el)) {
          el.setAttribute("data-logout", "true");
          el.setAttribute("title", "Logout");
          el.style.cursor = "pointer";
        }
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", markLogoutIcon);
  } else {
    markLogoutIcon();
  }

  new MutationObserver(markLogoutIcon).observe(document.documentElement, {
    childList: true,
    subtree: true
  });

  window.ClipencyLogout = logoutNow;
})();
