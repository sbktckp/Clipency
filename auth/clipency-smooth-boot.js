(function () {
  if (window.__clipencySmoothBootLoaded) return;
  window.__clipencySmoothBootLoaded = true;

  const protectedRoutes = [
    "/dashboard",
    "/campaigns",
    "/stats",
    "/payouts",
    "/wallet",
    "/profile"
  ];

  if (!protectedRoutes.includes(window.location.pathname)) return;

  let revealed = false;

  function reveal() {
    if (revealed) return;
    revealed = true;

    document.documentElement.classList.remove("cx-smooth-booting");
    document.documentElement.classList.add("cx-smooth-ready");
  }

  window.ClipencyRevealPage = reveal;

  // Safety fallback: never keep the page hidden forever.
  setTimeout(reveal, 2200);

  window.addEventListener("load", function () {
    // If no custom renderer reveals it, reveal shortly after full load.
    setTimeout(reveal, 600);
  });
})();
