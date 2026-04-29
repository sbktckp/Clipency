(function () {
  const routes = ["/campaigns", "/stats", "/payouts", "/wallet", "/profile"];

  if (!routes.includes(window.location.pathname)) return;

  document.documentElement.classList.add("cx-route-booting");

  window.addEventListener("DOMContentLoaded", function () {
    requestAnimationFrame(function () {
      document.documentElement.classList.remove("cx-route-booting");
      document.documentElement.classList.add("cx-route-ready");
    });
  });

  setTimeout(function () {
    document.documentElement.classList.remove("cx-route-booting");
    document.documentElement.classList.add("cx-route-ready");
  }, 900);
})();
