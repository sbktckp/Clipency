(function () {
  async function waitForSupabase() {
    let attempts = 0;

    while (!window.supabaseClient && attempts < 50) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      attempts++;
    }

    if (!window.supabaseClient) {
      throw new Error("Supabase client is not available.");
    }

    return window.supabaseClient;
  }

  async function getSession() {
    const supabase = await waitForSupabase();
    const { data, error } = await supabase.auth.getSession();

    if (error) throw error;

    return data?.session || null;
  }

  async function getRole() {
    const supabase = await waitForSupabase();
    const session = await getSession();

    if (!session?.user) {
      return {
        user: null,
        profile: null,
        role: null
      };
    }

    let profile = null;

    const { data, error } = await supabase
      .from("profiles")
      .select("id,email,full_name,username,avatar_url,role")
      .eq("id", session.user.id)
      .single();

    if (!error && data) {
      profile = data;
    }

    let role = profile?.role || null;

    if (!role) {
      const { data: roleData } = await supabase.rpc("current_user_role");
      role = roleData || "clipper";
    }

    return {
      user: session.user,
      profile,
      role: role || "clipper"
    };
  }

  function accessDenied(requiredRoles, currentRole) {
    document.body.innerHTML = `
      <main class="access-denied-shell">
        <section class="access-denied-card">
          <div class="access-denied-mark">!</div>
          <h1>Access denied</h1>
          <p>This page is reserved for <strong>${requiredRoles.join(" / ")}</strong>. Your current access is <strong>${currentRole || "not signed in"}</strong>.</p>
          <div class="access-denied-actions">
            <a href="/dashboard">Go to dashboard</a>
            <a href="/login">Login again</a>
          </div>
        </section>
      </main>
    `;
  }

  async function requireRole(allowedRoles) {
    try {
      const context = await getRole();

      if (!context.user) {
        window.location.href = "/login";
        return null;
      }

      if (!allowedRoles.includes(context.role)) {
        accessDenied(allowedRoles, context.role);
        return null;
      }

      return context;
    } catch (error) {
      document.body.innerHTML = `
        <main class="access-denied-shell">
          <section class="access-denied-card">
            <div class="access-denied-mark">!</div>
            <h1>Could not verify access</h1>
            <p>${error.message || "Please refresh once."}</p>
            <div class="access-denied-actions">
              <a href="/login">Login again</a>
            </div>
          </section>
        </main>
      `;

      return null;
    }
  }

  async function redirectByRole() {
    const { role } = await getRole();

    if (role === "admin") {
      window.location.href = "/workspace";
      return;
    }

    if (role === "reviewer") {
      window.location.href = "/review";
      return;
    }

    window.location.href = "/dashboard";
  }

  window.ClipencyAccess = {
    getRole,
    requireRole,
    redirectByRole
  };
})();
