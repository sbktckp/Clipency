(function () {
  const protectedRoutes = ["/dashboard", "/campaigns", "/stats", "/payouts"];
  if (!protectedRoutes.includes(window.location.pathname)) return;

  function removeLegacyToast() {
    document.querySelectorAll("body *").forEach((el) => {
      const text = (el.textContent || "").trim();

      if (
        text.includes("Something broke") &&
        text.includes("Please refresh once")
      ) {
        el.remove();
      }
    });
  }

  const observer = new MutationObserver(removeLegacyToast);

  if (document.body) {
    observer.observe(document.body, { childList: true, subtree: true });
    removeLegacyToast();
  } else {
    document.addEventListener("DOMContentLoaded", () => {
      observer.observe(document.body, { childList: true, subtree: true });
      removeLegacyToast();
    });
  }
})();
