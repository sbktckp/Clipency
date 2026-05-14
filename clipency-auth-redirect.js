/* Clipency Auth Redirect — handles post-login routing by role */
(function () {
  const sb = window.clipencySupabase || window.supabaseClient || window.sbClient;
  if (!sb) return;

  sb.auth.onAuthStateChange(async (event, session) => {
    if (event !== 'SIGNED_IN' || !session) return;

    const currentPath = window.location.pathname;
    // Only redirect if on login or signup page
    if (!currentPath.includes('/login') && !currentPath.includes('/signup')) return;

    const userId = session.user.id;

    // Fetch role from profiles table
    const { data: profile } = await sb
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();

    const role = profile?.role || session.user.user_metadata?.role || 'clipper';

    if (role === 'brand') {
      window.location.href = '/campaigns';   // swap to brand dashboard when ready
    } else {
      window.location.href = '/campaigns';   // clipper dashboard
    }
  });
})();
