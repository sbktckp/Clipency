(function () {
  if (!location.hostname.includes("clipency")) return;

  var risky = [];

  Object.keys(window).forEach(function (key) {
    if (/service[_-]?role|secret/i.test(key)) risky.push(key);
  });

  if (risky.length) {
    console.warn("Potential sensitive frontend globals detected:", risky);
  }

  if (location.protocol !== "https:" && location.hostname !== "localhost") {
    location.replace("https://" + location.host + location.pathname + location.search + location.hash);
  }
})();
