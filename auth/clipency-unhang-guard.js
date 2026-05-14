(function () {
  function reveal() {
    document.documentElement.classList.remove("cx-route-booting");
    document.documentElement.classList.remove("cx-smooth-booting");
    document.documentElement.classList.add("cx-route-ready");
  }

  setTimeout(reveal, 700);
  setTimeout(reveal, 1600);

  window.addEventListener("pageshow", reveal);
  window.addEventListener("load", reveal);
})();
