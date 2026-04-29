(function () {
  if (window.__clipencyAuthUxGuardLoaded) return;
  window.__clipencyAuthUxGuardLoaded = true;

  const AUTH_FLAG = "clipency_auth_in_progress";

  function isAuthRelatedPath() {
    return ["/login", "/signup", "/auth", "/index.html"].includes(window.location.pathname);
  }

  function isDashboardLikePath() {
    return [
      "/dashboard",
      "/campaigns",
      "/stats",
      "/payouts",
      "/wallet",
      "/profile",
      "/admin",
      "/workspace"
    ].some((path) => window.location.pathname === path || window.location.pathname.startsWith(path + "/"));
  }

  function ensureLoader() {
    let loader = document.getElementById("clipency-auth-loader");

    if (!loader) {
      loader = document.createElement("div");
      loader.id = "clipency-auth-loader";
      loader.innerHTML = `
        <div class="cx-auth-loader-card">
          <div class="cx-auth-loader-mark"></div>
          <span id="cx-auth-loader-kicker">WELCOME TO CLIPENCY</span>
          <h1 id="cx-auth-loader-title">Signing you in.</h1>
          <p id="cx-auth-loader-text">Preparing your workspace. Please hold on for a moment.</p>
        </div>
      `;
      document.body.appendChild(loader);
    }

    return loader;
  }

  function ensureToast() {
    let toast = document.getElementById("clipency-auth-toast");

    if (!toast) {
      toast = document.createElement("div");
      toast.id = "clipency-auth-toast";
      toast.innerHTML = `
        <strong id="cx-auth-toast-title">Already signed up</strong>
        <p id="cx-auth-toast-text">Kindly login with the same email to continue.</p>
        <button id="cx-auth-toast-login">Go to login</button>
      `;
      document.body.appendChild(toast);

      document.getElementById("cx-auth-toast-login")?.addEventListener("click", function () {
        toast.classList.remove("active");
        switchToLogin();
      });
    }

    return toast;
  }

  function showLoader(title, text) {
    const loader = ensureLoader();

    document.getElementById("cx-auth-loader-title").textContent = title || "Signing you in.";
    document.getElementById("cx-auth-loader-text").textContent = text || "Preparing your workspace. Please hold on for a moment.";

    loader.classList.add("active");

    localStorage.setItem(AUTH_FLAG, JSON.stringify({
      title: title || "Signing you in.",
      text: text || "Preparing your workspace. Please hold on for a moment.",
      at: Date.now()
    }));
  }

  function hideLoader() {
    const loader = document.getElementById("clipency-auth-loader");
    if (loader) loader.classList.remove("active");
    localStorage.removeItem(AUTH_FLAG);
  }

  function showAlreadySignedUp() {
    hideLoader();

    const toast = ensureToast();

    document.getElementById("cx-auth-toast-title").textContent = "Already signed up";
    document.getElementById("cx-auth-toast-text").textContent = "Kindly login with the same email to continue.";

    toast.classList.add("active");

    setTimeout(function () {
      toast.classList.remove("active");
    }, 8000);

    switchToLogin();
  }

  function switchToLogin() {
    const candidates = Array.from(document.querySelectorAll("button, a, [role='button']"));
    const loginTab = candidates.find((el) => {
      const text = (el.textContent || "").trim().toLowerCase();
      return text === "sign in" || text === "login" || text === "log in";
    });

    if (loginTab) {
      setTimeout(() => loginTab.click(), 80);
      return;
    }

    if (window.location.pathname !== "/login") {
      window.history.replaceState({}, "", "/login");
    }
  }

  function isExistingSignupResponse(result) {
    const errorMessage = String(result?.error?.message || "").toLowerCase();

    if (
      errorMessage.includes("already registered") ||
      errorMessage.includes("already exists") ||
      errorMessage.includes("user already") ||
      errorMessage.includes("user_exists")
    ) {
      return true;
    }

    const identities = result?.data?.user?.identities;

    if (Array.isArray(identities) && identities.length === 0) {
      return true;
    }

    return false;
  }

  function patchSupabaseClient(client) {
    if (!client || !client.auth || client.__clipencyAuthUxPatched) return;

    client.__clipencyAuthUxPatched = true;

    const originalSignUp = client.auth.signUp?.bind(client.auth);
    const originalSignInWithPassword = client.auth.signInWithPassword?.bind(client.auth);
    const originalSignInWithOAuth = client.auth.signInWithOAuth?.bind(client.auth);

    if (originalSignUp) {
      client.auth.signUp = async function () {
        showLoader("Creating your account.", "Welcome to Clipency. Setting up your creator workspace.");

        const result = await originalSignUp.apply(null, arguments);

        if (isExistingSignupResponse(result)) {
          showAlreadySignedUp();

          return {
            data: result.data || null,
            error: {
              message: "Already signed up. Kindly login."
            }
          };
        }

        if (result?.error) {
          hideLoader();
          return result;
        }

        showLoader("Welcome to Clipency.", "Your account is ready. Taking you to the right workspace.");
        return result;
      };
    }

    if (originalSignInWithPassword) {
      client.auth.signInWithPassword = async function () {
        showLoader("Logging you in.", "Welcome to Clipency. Verifying your session.");

        const result = await originalSignInWithPassword.apply(null, arguments);

        if (result?.error) {
          hideLoader();
          return result;
        }

        showLoader("Welcome to Clipency.", "Opening your workspace.");
        return result;
      };
    }

    if (originalSignInWithOAuth) {
      client.auth.signInWithOAuth = async function () {
        showLoader("Redirecting securely.", "Welcome to Clipency. Taking you to Google login.");

        const result = await originalSignInWithOAuth.apply(null, arguments);

        if (result?.error) {
          hideLoader();
          return result;
        }

        return result;
      };
    }
  }

  function waitAndPatchSupabase() {
    let tries = 0;

    const timer = setInterval(function () {
      tries++;

      if (window.supabaseClient) {
        patchSupabaseClient(window.supabaseClient);
      }

      if (window.supabase?.createClient && window.supabaseClient) {
        patchSupabaseClient(window.supabaseClient);
      }

      if (tries > 160) clearInterval(timer);
    }, 80);
  }

  function inferAuthActionFromText(text) {
    const value = String(text || "").toLowerCase();

    if (
      value.includes("become a clipper") ||
      value.includes("create account") ||
      value.includes("sign up") ||
      value.includes("signup")
    ) {
      return "signup";
    }

    if (
      value.includes("login") ||
      value.includes("log in") ||
      value.includes("sign in") ||
      value.includes("continue with google")
    ) {
      return "login";
    }

    return null;
  }

  function bindVisualSubmitLoader() {
    document.addEventListener("submit", function (event) {
      const formText = event.target?.textContent || "";
      const action = inferAuthActionFromText(formText);

      if (action === "signup") {
        showLoader("Creating your account.", "Welcome to Clipency. Setting up your creator workspace.");
      }

      if (action === "login") {
        showLoader("Logging you in.", "Welcome to Clipency. Verifying your session.");
      }
    }, true);

    document.addEventListener("click", function (event) {
      const target = event.target.closest("button, a, [role='button']");
      if (!target) return;

      const action = inferAuthActionFromText(target.textContent || "");

      if (action === "signup" && isAuthRelatedPath()) {
        showLoader("Creating your account.", "Welcome to Clipency. Setting up your creator workspace.");
      }

      if (action === "login" && isAuthRelatedPath()) {
        showLoader("Logging you in.", "Welcome to Clipency. Verifying your session.");
      }
    }, true);
  }

  function coverDashboardFlash() {
    try {
      const raw = localStorage.getItem(AUTH_FLAG);
      if (!raw) return;

      const parsed = JSON.parse(raw);
      const age = Date.now() - Number(parsed.at || 0);

      if (age > 15000) {
        localStorage.removeItem(AUTH_FLAG);
        return;
      }

      if (isDashboardLikePath()) {
        showLoader("Welcome to Clipency.", "Opening your workspace.");

        setTimeout(function () {
          hideLoader();
        }, 1500);
      }
    } catch {
      localStorage.removeItem(AUTH_FLAG);
    }
  }

  function boot() {
    ensureLoader();
    ensureToast();
    waitAndPatchSupabase();
    bindVisualSubmitLoader();
    coverDashboardFlash();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }

  window.addEventListener("clipency:supabase-ready", waitAndPatchSupabase);
})();
