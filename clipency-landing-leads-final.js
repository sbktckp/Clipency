(function () {
  "use strict";

  const TABLE = "landing_leads";

  function getClient() {
    return window.clipencySupabase || window.supabaseClient || window.sbClient || null;
  }

  function value(id) {
    const el = document.getElementById(id);
    return el ? String(el.value || "").trim() : "";
  }

  function setButtonLoading(isLoading) {
    const btn = document.querySelector(".lform-submit");
    if (!btn) return;

    if (isLoading) {
      btn.dataset.oldText = btn.textContent;
      btn.textContent = "Submitting...";
      btn.disabled = true;
      btn.style.opacity = "0.75";
      btn.style.cursor = "not-allowed";
    } else {
      btn.textContent = btn.dataset.oldText || "Submit inquiry →";
      btn.disabled = false;
      btn.style.opacity = "";
      btn.style.cursor = "";
    }
  }

  function showSuccess() {
    const panel = document.getElementById("panel-brand");
    const success = document.getElementById("form-success-msg");
    const card = success ? success.closest(".lform-card") : null;

    if (panel) panel.style.display = "none";

    if (card) {
      const title = card.querySelector(".lform-card-title");
      const sub = card.querySelector(".lform-card-sub");
      if (title) title.style.display = "none";
      if (sub) sub.style.display = "none";
    }

    if (success) {
      success.style.display = "flex";
      success.style.opacity = "0";

      requestAnimationFrame(function () {
        success.style.transition = "opacity 0.5s ease";
        success.style.opacity = "1";
      });
    }
  }

  function showError(message) {
    alert(message || "Could not submit inquiry. Please try again.");
  }

  window.submitForm = async function submitForm(type) {
    const supabase = getClient();

    if (!supabase) {
      showError("Supabase client missing. Check supabaseClient.js and CDN script.");
      return;
    }

    const payload = {
      lead_type: type || "brand",
      name: value("cf-name"),
      email: value("cf-email"),
      country_code: value("cf-country"),
      phone: value("cf-phone"),
      brand: value("cf-brand"),
      campaign_type: value("cf-type") || "Brand Campaign",
      budget: value("cf-budget"),
      campaign_goal: value("cf-goal"),
      source_page: "landing",
      status: "new",
      user_agent: navigator.userAgent || null
    };

    if (!payload.name) {
      showError("Please enter your name.");
      return;
    }

    if (!payload.email || !/^\S+@\S+\.\S+$/.test(payload.email)) {
      showError("Please enter a valid email address.");
      return;
    }

    if (!payload.phone) {
      showError("Please enter your phone number.");
      return;
    }

    try {
      setButtonLoading(true);

      const { error } = await supabase
        .from(TABLE)
        .insert(payload);

      if (error) throw error;

      showSuccess();
    } catch (error) {
      console.error("[Clipency] Lead submit failed:", error);
      showError(error.message || "Could not submit inquiry. Please try again.");
    } finally {
      setButtonLoading(false);
    }
  };
})();
