(function () {
  if (window.__clipencyAuthPageControllerLoaded) return;
  window.__clipencyAuthPageControllerLoaded = true;

  const AUTH_PATHS = ["/login", "/signup", "/auth", "/index.html", "/"];
  if (!AUTH_PATHS.includes(window.location.pathname)) return;

  let mode = window.location.pathname === "/login" ? "login" : "signup";

  function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async function waitForSupabase() {
    for (let i = 0; i < 120; i++) {
      if (window.supabaseClient) return window.supabaseClient;
      if (window.sb) return window.sb;
      if (window.client?.auth) return window.client;
      await wait(80);
    }

    throw new Error("Auth client not ready. Please refresh once.");
  }

  function textOf(el) {
    return String(el?.textContent || "").trim().toLowerCase();
  }

  function showLoader(title, text) {
    let loader = document.getElementById("clipency-auth-loader");

    if (!loader) {
      loader = document.createElement("div");
      loader.id = "clipency-auth-loader";
      loader.innerHTML = `
        <div class="cx-auth-loader-card">
          <div class="cx-auth-loader-mark"></div>
          <span>WELCOME TO CLIPENCY</span>
          <h1 id="cx-auth-loader-title">Signing you in.</h1>
          <p id="cx-auth-loader-text">Preparing your workspace. Please hold on for a moment.</p>
        </div>
      `;
      document.body.appendChild(loader);
    }

    document.getElementById("cx-auth-loader-title").textContent = title;
    document.getElementById("cx-auth-loader-text").textContent = text;
    loader.classList.add("active");
  }

  function hideLoader() {
    document.getElementById("clipency-auth-loader")?.classList.remove("active");
    localStorage.removeItem("clipency_auth_in_progress");
  }

  function toast(title, message) {
    hideLoader();

    let box = document.getElementById("clipency-auth-toast");

    if (!box) {
      box = document.createElement("div");
      box.id = "clipency-auth-toast";
      box.innerHTML = `
        <strong id="cx-auth-toast-title"></strong>
        <p id="cx-auth-toast-text"></p>
        <button id="cx-auth-toast-login">Go to login</button>
      `;
      document.body.appendChild(box);

      document.getElementById("cx-auth-toast-login")?.addEventListener("click", function () {
        box.classList.remove("active");
        setMode("login", true);
      });
    }

    document.getElementById("cx-auth-toast-title").textContent = title;
    document.getElementById("cx-auth-toast-text").textContent = message;

    box.classList.add("active");

    setTimeout(function () {
      box.classList.remove("active");
    }, 8500);
  }

  function findEmailInput() {
    return document.querySelector('input[type="email"], input[name*="email" i], input[placeholder*="email" i]');
  }

  function findPasswordInput() {
    return document.querySelector('input[type="password"], input[name*="password" i], input[placeholder*="password" i]');
  }

  function findFirstNameInput() {
    return (
      document.querySelector('input[name*="first" i], input[placeholder*="jordan" i]') ||
      Array.from(document.querySelectorAll("input")).find((input) => {
        const label = input.closest("label, div")?.textContent || "";
        return /first name/i.test(label);
      })
    );
  }

  function findLastNameInput() {
    return (
      document.querySelector('input[name*="last" i], input[placeholder*="rivera" i]') ||
      Array.from(document.querySelectorAll("input")).find((input) => {
        const label = input.closest("label, div")?.textContent || "";
        return /last name/i.test(label);
      })
    );
  }

  function findTermsCheckbox() {
    return document.querySelector('input[type="checkbox"]');
  }

  function fieldShell(input) {
    if (!input) return null;

    return (
      input.closest("label") ||
      input.closest(".form-group") ||
      input.closest(".field") ||
      input.parentElement
    );
  }

  function setShellVisible(shell, visible) {
    if (!shell) return;

    shell.style.display = visible ? "" : "none";
  }

  function findSubmitButton() {
    const buttons = Array.from(document.querySelectorAll("button, [role='button']"));

    return buttons.find((button) => {
      const t = textOf(button);
      return (
        t.includes("become a clipper") ||
        t.includes("create account") ||
        t.includes("sign up") ||
        t.includes("login") ||
        t.includes("log in") ||
        t.includes("sign in")
      );
    });
  }

  function findGoogleButton() {
    return Array.from(document.querySelectorAll("button, a, [role='button']")).find((el) => {
      const t = textOf(el);
      return t.includes("google");
    });
  }

  function updateTabs() {
    const clickable = Array.from(document.querySelectorAll("button, a, [role='button'], span, div"));

    clickable.forEach((el) => {
      const t = textOf(el);

      if (t === "create account") {
        el.classList.toggle("cx-auth-tab-active", mode === "signup");
        el.setAttribute("data-auth-tab", "signup");
      }

      if (t === "sign in" || t === "login" || t === "log in") {
        el.classList.toggle("cx-auth-tab-active", mode === "login");
        el.setAttribute("data-auth-tab", "login");
      }
    });
  }

  function setMode(nextMode, updateUrl) {
    mode = nextMode === "login" ? "login" : "signup";

    hideLoader();

    document.body.setAttribute("data-auth-mode", mode);

    const first = findFirstNameInput();
    const last = findLastNameInput();
    const terms = findTermsCheckbox();

    setShellVisible(fieldShell(first), mode === "signup");
    setShellVisible(fieldShell(last), mode === "signup");

    if (terms) {
      const termsShell =
        terms.closest("label") ||
        terms.closest(".terms") ||
        terms.parentElement;
      setShellVisible(termsShell, mode === "signup");
    }

    const submit = findSubmitButton();

    if (submit) {
      submit.innerHTML = mode === "login"
        ? "Login <span aria-hidden='true'>→</span>"
        : "Become a Clipper <span aria-hidden='true'>→</span>";
    }

    const google = findGoogleButton();

    if (google) {
      google.innerHTML = `
        <span style="font-weight:900;color:#4285F4;">G</span>
        Continue with Google
      `;

      google.setAttribute("data-google-login-only", "true");
      google.setAttribute("title", "Google is used for logging into an existing Clipency account.");
    }

    updateTabs();

    if (updateUrl) {
      window.history.replaceState({}, "", mode === "login" ? "/login" : "/signup");
    }
  }

  function isExistingSignup(result) {
    const message = String(result?.error?.message || "").toLowerCase();

    if (
      message.includes("already registered") ||
      message.includes("already exists") ||
      message.includes("user already") ||
      message.includes("duplicate") ||
      message.includes("user_exists")
    ) {
      return true;
    }

    const identities = result?.data?.user?.identities;
    return Array.isArray(identities) && identities.length === 0;
  }

  async function handleEmailAuth(event) {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    const email = findEmailInput()?.value?.trim();
    const password = findPasswordInput()?.value || "";

    if (!email || !password) {
      toast("Missing details", "Please enter your email and password.");
      return;
    }

    const supabase = await waitForSupabase();

    if (mode === "login") {
      showLoader("Logging you in.", "Welcome to Clipency. Verifying your session.");

      const result = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (result?.error) {
        toast("Login failed", result.error.message || "Please check your email and password.");
        return;
      }

      showLoader("Welcome to Clipency.", "Opening your campaign workspace.");
      window.location.href = "/campaigns";
      return;
    }

    const terms = findTermsCheckbox();
    if (terms && !terms.checked) {
      toast("Terms required", "Please accept the Terms and Privacy Policy to continue.");
      return;
    }

    const firstName = findFirstNameInput()?.value?.trim() || "";
    const lastName = findLastNameInput()?.value?.trim() || "";
    const fullName = `${firstName} ${lastName}`.trim();

    showLoader("Creating your account.", "Welcome to Clipency. Setting up your creator workspace.");

    const result = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          full_name: fullName
        }
      }
    });

    if (isExistingSignup(result)) {
      toast("Already signed up", "Kindly login with the same email to continue.");
      setMode("login", true);
      return;
    }

    if (result?.error) {
      toast("Signup failed", result.error.message || "Please try again.");
      return;
    }

    showLoader("Welcome to Clipency.", "Your account is ready. Opening your campaign workspace.");
    window.location.href = "/campaigns";
  }

  async function handleGoogleLogin(event) {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    setMode("login", true);

    const supabase = await waitForSupabase();

    showLoader("Logging you in with Google.", "Welcome to Clipency. Redirecting securely.");

    const result = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin + "/campaigns",
        queryParams: {
          prompt: "select_account"
        }
      }
    });

    if (result?.error) {
      toast("Google login failed", result.error.message || "Please try again.");
    }
  }

  function bind() {
    document.addEventListener("click", function (event) {
      const target = event.target.closest("button, a, [role='button'], span, div");
      if (!target) return;

      const t = textOf(target);

      if (t === "sign in" || t === "login" || t === "log in") {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        setMode("login", true);
        return;
      }

      if (t === "create account") {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        setMode("signup", true);
        return;
      }

      if (t.includes("google")) {
        handleGoogleLogin(event);
        return;
      }

      if (
        t.includes("become a clipper") ||
        t.includes("sign up") ||
        t.includes("login") ||
        t.includes("log in")
      ) {
        handleEmailAuth(event);
      }
    }, true);

    document.addEventListener("submit", handleEmailAuth, true);
  }

  function boot() {
    bind();

    setTimeout(() => setMode(mode, false), 80);
    setTimeout(() => setMode(mode, false), 500);
    setTimeout(() => setMode(mode, false), 1200);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
