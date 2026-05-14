(function () {
  if (window.__clipencyPerformanceGuardLoaded) return;
  window.__clipencyPerformanceGuardLoaded = true;

  function optimizeImages() {
    document.querySelectorAll("img").forEach(function (img) {
      if (!img.hasAttribute("loading")) img.setAttribute("loading", "lazy");
      if (!img.hasAttribute("decoding")) img.setAttribute("decoding", "async");

      var alt = img.getAttribute("alt");
      if (alt === null) img.setAttribute("alt", "");
    });

    var logo = document.querySelector('img[alt*="Clipency" i], img[src*="logo" i]');
    if (logo) {
      logo.setAttribute("loading", "eager");
      logo.setAttribute("fetchpriority", "high");
    }
  }

  function secureExternalLinks() {
    document.querySelectorAll('a[target="_blank"]').forEach(function (link) {
      var rel = new Set(String(link.getAttribute("rel") || "").split(/\s+/).filter(Boolean));
      rel.add("noopener");
      rel.add("noreferrer");
      link.setAttribute("rel", Array.from(rel).join(" "));
    });
  }

  function reduceLayoutJank() {
    document.documentElement.style.scrollBehavior = "smooth";

    document.querySelectorAll("[data-heavy-animation]").forEach(function (el) {
      el.style.willChange = "transform, opacity";
    });
  }

  function boot() {
    optimizeImages();
    secureExternalLinks();
    reduceLayoutJank();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }

  new MutationObserver(function () {
    optimizeImages();
    secureExternalLinks();
  }).observe(document.documentElement, {
    childList: true,
    subtree: true
  });
})();
