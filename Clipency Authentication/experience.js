(function () {
  function ensureToastStack() {
    let stack = document.querySelector(".cx-toast-stack");

    if (!stack) {
      stack = document.createElement("div");
      stack.className = "cx-toast-stack";
      document.body.appendChild(stack);
    }

    return stack;
  }

  window.CXToast = function CXToast(title, message, type) {
    const stack = ensureToastStack();

    const toast = document.createElement("div");
    toast.className = `cx-toast ${type || ""}`;
    toast.innerHTML = `<strong>${title || "Clipency"}</strong><span>${message || ""}</span>`;

    stack.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateY(8px)";
      setTimeout(() => toast.remove(), 220);
    }, 3600);
  };

  function installLinkFlow() {
    document.addEventListener("click", (event) => {
      const link = event.target.closest("a");
      if (!link) return;

      const href = link.getAttribute("href") || "";
      const isExternal = link.hostname && link.hostname !== window.location.hostname;
      const isHash = href.startsWith("#");
      const isBlank = link.target === "_blank";
      const isDownload = link.hasAttribute("download");

      if (isExternal || isHash || isBlank || isDownload) return;

      document.body.classList.add("cx-navigating");
    });
  }

  function installGlobalErrors() {
    window.addEventListener("error", () => {
      if (window.CXToast) {
        window.CXToast("Something broke", "Please refresh once. If it repeats, the team should check the console.", "error");
      }
    });

    window.addEventListener("unhandledrejection", () => {
      if (window.CXToast) {
        window.CXToast("Action could not complete", "Please try again after a moment.", "error");
      }
    });
  }

  function boot() {
    installLinkFlow();
    installGlobalErrors();
    document.body.classList.add("cx-ready");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
