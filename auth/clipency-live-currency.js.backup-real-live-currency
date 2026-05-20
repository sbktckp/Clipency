(function () {
  if (window.__clipencyLiveCurrencyLoaded) return;
  window.__clipencyLiveCurrencyLoaded = true;

  const SUPPORTED = ["USD", "INR", "EUR", "GBP", "JPY", "AUD", "CAD"];
  const RATE_KEY = "clipency.liveCurrency.rates";
  const CURRENCY_KEY = "clipency.selectedCurrency";
  const CACHE_MAX_AGE = 15 * 60 * 1000;

  const originalText = new WeakMap();

  let currentCurrency = localStorage.getItem(CURRENCY_KEY) || "USD";
  let rates = { USD: 1 };
  let converting = false;
  let debounceTimer = null;

  function isSupported(code) {
    return SUPPORTED.includes(String(code || "").toUpperCase());
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

  async function fetchFrankfurterRates() {
    const targets = SUPPORTED.filter((code) => code !== "USD").join(",");
    const res = await fetch(`https://api.frankfurter.app/latest?from=USD&to=${targets}`, {
      cache: "no-store"
    });

    if (!res.ok) throw new Error("Frankfurter rate fetch failed.");

    const data = await res.json();

    return {
      USD: 1,
      ...data.rates
    };
  }

  async function fetchOpenExchangeFallback() {
    const res = await fetch("https://open.er-api.com/v6/latest/USD", {
      cache: "no-store"
    });

    if (!res.ok) throw new Error("Open exchange rate fetch failed.");

    const data = await res.json();

    const nextRates = { USD: 1 };

    SUPPORTED.forEach((code) => {
      if (code === "USD") return;
      if (data.rates && data.rates[code]) {
        nextRates[code] = data.rates[code];
      }
    });

    return nextRates;
  }

  async function loadRates(force = false) {
    const cached = getCachedRates();

    if (!force && cached && Date.now() - cached.fetchedAt < CACHE_MAX_AGE) {
      rates = cached.rates;
      return rates;
    }

    try {
      rates = await fetchFrankfurterRates();
      saveRates(rates, "frankfurter");
      return rates;
    } catch (primaryError) {
      try {
        rates = await fetchOpenExchangeFallback();
        saveRates(rates, "open-er-api");
        return rates;
      } catch (fallbackError) {
        if (cached?.rates) {
          rates = cached.rates;
          console.warn("Using last fetched currency rates because live fetch failed.");
          return rates;
        }

        rates = { USD: 1 };
        console.warn("Currency rates unavailable. Keeping USD amounts.");
        return rates;
      }
    }
  }

  function amountFromMatch(rawNumber, suffix) {
    const base = Number(String(rawNumber || "0").replace(/,/g, ""));

    if (String(suffix || "").toUpperCase() === "K") return base * 1000;
    if (String(suffix || "").toUpperCase() === "M") return base * 1000000;
    if (String(suffix || "").toUpperCase() === "B") return base * 1000000000;

    return base;
  }

  function formatMoney(usdAmount, sign = "") {
    const currency = isSupported(currentCurrency) ? currentCurrency : "USD";
    const rate = rates[currency] || 1;
    const converted = Number(usdAmount || 0) * rate;

    const formatter = new Intl.NumberFormat(currency === "INR" ? "en-IN" : "en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: currency === "JPY" ? 0 : 2
    });

    const value = formatter.format(converted);

    return sign === "+" ? `+${value}` : value;
  }

  function convertTextValue(text) {
    if (!text || !text.includes("$")) return text;

    return text.replace(/([+])?\$\s*([0-9][0-9,]*(?:\.\d+)?)([KMB])?/gi, function (_, plus, number, suffix) {
      const usdAmount = amountFromMatch(number, suffix);
      return formatMoney(usdAmount, plus || "");
    });
  }

  function shouldIgnoreNode(node) {
    const parent = node.parentElement;

    if (!parent) return true;

    if (
      parent.closest("script, style, textarea, input, select, option, code, pre") ||
      parent.closest(".cx-currency-no-convert") ||
      parent.closest(".classic-form") ||
      parent.closest(".cx-core-form")
    ) {
      return true;
    }

    return false;
  }

  function convertPage() {
    if (converting) return;

    converting = true;

    try {
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      const nodes = [];

      while (walker.nextNode()) {
        nodes.push(walker.currentNode);
      }

      nodes.forEach((node) => {
        if (shouldIgnoreNode(node)) return;

        if (!originalText.has(node)) {
          originalText.set(node, node.nodeValue);
        }

        const baseText = originalText.get(node);

        if (!baseText || !baseText.includes("$")) return;

        node.nodeValue = currentCurrency === "USD" ? baseText : convertTextValue(baseText);
      });

      updateCurrencyUI();
    } finally {
      converting = false;
    }
  }

  function scheduleConvert() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(convertPage, 90);
  }

  function getCurrencyFromElement(el) {
    const text = (el.textContent || "").toUpperCase();

    return SUPPORTED.find((code) => {
      return new RegExp(`\\b${code}\\b`).test(text);
    });
  }

  async function setCurrency(code) {
    if (!isSupported(code)) return;

    currentCurrency = code.toUpperCase();
    localStorage.setItem(CURRENCY_KEY, currentCurrency);

    await loadRates(true);
    convertPage();

    window.dispatchEvent(new CustomEvent("clipency:currency-change", {
      detail: {
        currency: currentCurrency,
        rates
      }
    }));
  }

  function bindCurrencyClicks() {
    document.addEventListener("click", async function (event) {
      const sidebar = event.target.closest(".sidebar, .dashboard-sidebar, aside");

      if (!sidebar) return;

      const candidate = event.target.closest("button, a, div, li");

      if (!candidate) return;

      const code = getCurrencyFromElement(candidate);

      if (!code) return;

      // Let the existing dropdown open/close naturally, then apply live conversion.
      setTimeout(() => {
        setCurrency(code);
      }, 80);
    });
  }

  function updateCurrencyUI() {
    document.documentElement.setAttribute("data-clipency-currency", currentCurrency);

    document.querySelectorAll(".sidebar *, .dashboard-sidebar *, aside *").forEach((el) => {
      const code = getCurrencyFromElement(el);

      if (!code) return;

      el.classList.toggle("cx-live-currency-active", code === currentCurrency);
    });

    let indicator = document.querySelector(".cx-live-currency-indicator");

    if (!indicator) {
      const sidebar = document.querySelector(".sidebar, .dashboard-sidebar, aside");

      if (sidebar) {
        indicator = document.createElement("div");
        indicator.className = "cx-live-currency-indicator cx-currency-no-convert";

        const currencyLabel = Array.from(sidebar.querySelectorAll("*")).find((el) => {
          return (el.textContent || "").trim().toLowerCase() === "currency";
        });

        if (currencyLabel) {
          currencyLabel.insertAdjacentElement("afterend", indicator);
        }
      }
    }

    const cached = getCachedRates();
    const sourceText = cached?.source ? `Live rate: ${currentCurrency}` : `Currency: ${currentCurrency}`;

    if (indicator) {
      indicator.textContent = sourceText;
    }
  }

  async function boot() {
    await loadRates(false);
    bindCurrencyClicks();
    convertPage();

    setInterval(async () => {
      await loadRates(true);
      convertPage();
    }, CACHE_MAX_AGE);

    new MutationObserver(scheduleConvert).observe(document.documentElement, {
      childList: true,
      subtree: true,
      characterData: true
    });
  }

  window.ClipencyCurrency = {
    setCurrency,
    getCurrency: () => currentCurrency,
    getRates: () => rates,
    refresh: async () => {
      await loadRates(true);
      convertPage();
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
