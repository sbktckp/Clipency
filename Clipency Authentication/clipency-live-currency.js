(function () {
  if (window.__clipencyRealLiveCurrencyLoaded) return;
  window.__clipencyRealLiveCurrencyLoaded = true;

  const SUPPORTED = ["USD", "INR", "EUR", "GBP", "JPY", "AUD", "CAD"];
  const SYMBOLS = {
    USD: "$",
    INR: "₹",
    EUR: "€",
    GBP: "£",
    JPY: "¥",
    AUD: "A$",
    CAD: "C$"
  };

  const CURRENCY_KEYS = [
    "clipency.selectedCurrency",
    "clipency.currency",
    "selectedCurrency",
    "currency"
  ];

  const RATE_KEY = "clipency.realLiveCurrency.rates.v2";
  const CACHE_MAX_AGE = 5 * 60 * 1000;

  const originalText = new WeakMap();

  let currentCurrency = getInitialCurrency();
  let rates = { USD: 1 };
  let isConverting = false;
  let booted = false;

  function getInitialCurrency() {
    for (const key of CURRENCY_KEYS) {
      const value = localStorage.getItem(key);
      if (SUPPORTED.includes(String(value || "").toUpperCase())) {
        return String(value).toUpperCase();
      }
    }

    return "USD";
  }

  function saveCurrency(code) {
    currentCurrency = code;

    CURRENCY_KEYS.forEach((key) => {
      localStorage.setItem(key, code);
    });

    document.documentElement.setAttribute("data-clipency-currency", code);
  }

  function safeJsonParse(value) {
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  }

  function getCachedRates() {
    const cached = safeJsonParse(localStorage.getItem(RATE_KEY));

    if (!cached || !cached.rates || !cached.fetchedAt) return null;

    return cached;
  }

  function saveRates(nextRates, source) {
    const payload = {
      base: "USD",
      rates: nextRates,
      source,
      fetchedAt: Date.now()
    };

    localStorage.setItem(RATE_KEY, JSON.stringify(payload));
  }

  async function fetchPrimaryRates() {
    const response = await fetch("https://open.er-api.com/v6/latest/USD", {
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error("Primary currency API failed.");
    }

    const data = await response.json();

    if (!data || !data.rates) {
      throw new Error("Primary currency API returned invalid data.");
    }

    const nextRates = { USD: 1 };

    SUPPORTED.forEach((code) => {
      if (code === "USD") return;

      if (Number(data.rates[code])) {
        nextRates[code] = Number(data.rates[code]);
      }
    });

    return nextRates;
  }

  async function fetchFallbackRates() {
    const response = await fetch("https://latest.currency-api.pages.dev/v1/currencies/usd.json", {
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error("Fallback currency API failed.");
    }

    const data = await response.json();

    if (!data || !data.usd) {
      throw new Error("Fallback currency API returned invalid data.");
    }

    const nextRates = { USD: 1 };

    SUPPORTED.forEach((code) => {
      if (code === "USD") return;

      const value = data.usd[code.toLowerCase()];

      if (Number(value)) {
        nextRates[code] = Number(value);
      }
    });

    return nextRates;
  }

  async function loadRates(force = false) {
    const cached = getCachedRates();

    if (!force && cached && Date.now() - cached.fetchedAt < CACHE_MAX_AGE) {
      rates = {
        USD: 1,
        ...cached.rates
      };

      return rates;
    }

    try {
      rates = await fetchPrimaryRates();
      saveRates(rates, "open.er-api.com");
      return rates;
    } catch (primaryError) {
      try {
        rates = await fetchFallbackRates();
        saveRates(rates, "currency-api.pages.dev");
        return rates;
      } catch (fallbackError) {
        if (cached?.rates) {
          rates = {
            USD: 1,
            ...cached.rates
          };

          console.warn("Using cached FX rates because live fetch failed.");
          return rates;
        }

        rates = { USD: 1 };
        console.warn("No live FX rates available. USD display retained.");
        return rates;
      }
    }
  }

  function parseUsdAmount(number, suffix) {
    const clean = Number(String(number || "0").replace(/,/g, ""));

    if (String(suffix || "").toUpperCase() === "K") return clean * 1000;
    if (String(suffix || "").toUpperCase() === "M") return clean * 1000000;
    if (String(suffix || "").toUpperCase() === "B") return clean * 1000000000;

    return clean;
  }

  function formatCurrencyFromUsd(usdAmount, plusSign) {
    const code = SUPPORTED.includes(currentCurrency) ? currentCurrency : "USD";
    const rate = Number(rates[code] || 1);
    const converted = Number(usdAmount || 0) * rate;

    const formatter = new Intl.NumberFormat(code === "INR" ? "en-IN" : "en-US", {
      style: "currency",
      currency: code,
      maximumFractionDigits: code === "JPY" ? 0 : 2
    });

    const formatted = formatter.format(converted);

    return plusSign ? `+${formatted}` : formatted;
  }

  function convertUsdText(text) {
    if (!text || !text.includes("$")) return text;

    return text.replace(/([+])?\$\s*([0-9][0-9,]*(?:\.\d+)?)([KMB])?/gi, function (_, plus, number, suffix) {
      const usdAmount = parseUsdAmount(number, suffix);
      return formatCurrencyFromUsd(usdAmount, plus);
    });
  }

  function shouldIgnoreTextNode(node) {
    const parent = node.parentElement;

    if (!parent) return true;

    if (
      parent.closest("script, style, input, textarea, select, option, code, pre") ||
      parent.closest(".cx-currency-no-convert") ||
      parent.closest(".classic-form") ||
      parent.closest(".cx-core-form")
    ) {
      return true;
    }

    return false;
  }

  function resetConvertedNodesToUsd() {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const nodes = [];

    while (walker.nextNode()) {
      nodes.push(walker.currentNode);
    }

    nodes.forEach((node) => {
      if (originalText.has(node)) {
        node.nodeValue = originalText.get(node);
      }
    });
  }

  function convertPageAmounts() {
    if (!document.body || isConverting) return;

    isConverting = true;

    try {
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      const nodes = [];

      while (walker.nextNode()) {
        nodes.push(walker.currentNode);
      }

      nodes.forEach((node) => {
        if (shouldIgnoreTextNode(node)) return;

        const current = node.nodeValue || "";

        if (!originalText.has(node)) {
          if (current.includes("$")) {
            originalText.set(node, current);
          } else {
            return;
          }
        }

        const baseUsdText = originalText.get(node);

        if (!baseUsdText || !baseUsdText.includes("$")) return;

        node.nodeValue = currentCurrency === "USD" ? baseUsdText : convertUsdText(baseUsdText);
      });

      updateCurrencyUi();
    } finally {
      isConverting = false;
      revealCurrencyBoot();
    }
  }

  function revealCurrencyBoot() {
    document.documentElement.classList.remove("cx-currency-booting");
    document.documentElement.classList.add("cx-currency-ready");
  }

  function codeFromText(value) {
    const upper = String(value || "").toUpperCase();

    return SUPPORTED.find((code) => new RegExp(`\\b${code}\\b`).test(upper));
  }

  function clickedCurrencyOption(event) {
    const sidebar = event.target.closest(".sidebar, .dashboard-sidebar, aside");

    if (!sidebar) return null;

    const candidate = event.target.closest("button, a, div, li, span");

    if (!candidate) return null;

    const code = codeFromText(candidate.textContent);

    if (!code) return null;

    return {
      code,
      candidate
    };
  }

  async function setCurrency(code, forceFetch = false) {
    const nextCode = String(code || "").toUpperCase();

    if (!SUPPORTED.includes(nextCode)) return;

    saveCurrency(nextCode);

    await loadRates(forceFetch);

    resetConvertedNodesToUsd();
    convertPageAmounts();

    window.dispatchEvent(new CustomEvent("clipency:currency-change", {
      detail: {
        currency: currentCurrency,
        rates
      }
    }));
  }

  function bindCurrencySelection() {
    document.addEventListener("click", function (event) {
      const match = clickedCurrencyOption(event);

      if (!match) return;

      const { code, candidate } = match;

      // Allow the collapsed current currency row to open normally.
      if (code === currentCurrency && !candidate.textContent.includes("1.00")) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();

      setCurrency(code, true);
    }, true);
  }

  function updateCurrencyUi() {
    document.documentElement.setAttribute("data-clipency-currency", currentCurrency);

    const cached = getCachedRates();
    const source = cached?.source || "live";
    const rate = rates[currentCurrency] || 1;
    const symbol = SYMBOLS[currentCurrency] || currentCurrency;

    document.querySelectorAll(".cx-live-currency-indicator").forEach((el) => {
      el.remove();
    });

    const sidebar = document.querySelector(".sidebar, .dashboard-sidebar, aside");

    if (sidebar) {
      const label = Array.from(sidebar.querySelectorAll("*")).find((el) => {
        return (el.textContent || "").trim().toLowerCase() === "currency";
      });

      const indicator = document.createElement("div");
      indicator.className = "cx-live-currency-indicator cx-currency-no-convert";

      if (currentCurrency === "USD") {
        indicator.textContent = "LIVE FX · USD BASE";
      } else {
        indicator.textContent = `LIVE FX · 1 USD = ${symbol}${Number(rate).toLocaleString(currentCurrency === "INR" ? "en-IN" : "en-US", {
          maximumFractionDigits: currentCurrency === "JPY" ? 0 : 4
        })} ${currentCurrency}`;
      }

      if (label) {
        label.insertAdjacentElement("afterend", indicator);
      }
    }

    document.querySelectorAll(".sidebar *, .dashboard-sidebar *, aside *").forEach((el) => {
      const code = codeFromText(el.textContent);

      if (!code) return;

      el.classList.toggle("cx-live-currency-active", code === currentCurrency);
    });
  }

  function startObserver() {
    const observer = new MutationObserver(function () {
      if (!booted || isConverting) return;

      // MutationObserver runs before paint, so this prevents visible rollback.
      convertPageAmounts();
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      characterData: true
    });
  }

  async function boot() {
    saveCurrency(currentCurrency);

    await loadRates(false);

    bindCurrencySelection();
    startObserver();

    booted = true;

    convertPageAmounts();

    setInterval(async function () {
      await loadRates(true);
      resetConvertedNodesToUsd();
      convertPageAmounts();
    }, CACHE_MAX_AGE);
  }

  window.ClipencyCurrency = {
    setCurrency,
    refresh: async function () {
      await loadRates(true);
      resetConvertedNodesToUsd();
      convertPageAmounts();
    },
    getCurrency: function () {
      return currentCurrency;
    },
    getRates: function () {
      return rates;
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
