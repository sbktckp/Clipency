(function () {
  const form = document.getElementById("landing-contact-form");
  const message = document.getElementById("contact-form-message");

  function setMessage(text, type) {
    if (!message) return;
    message.textContent = text;
    message.className = `form-message ${type || ""}`;
  }

  if (form) {
    form.addEventListener("submit", async function (event) {
      event.preventDefault();

      if (!window.supabaseClient) {
        setMessage("Connection is still loading. Please try again in a moment.", "error");
        return;
      }

      const button = form.querySelector("button");
      const formData = new FormData(form);

      const payload = {
        full_name: formData.get("full_name")?.trim(),
        email: formData.get("email")?.trim(),
        company: formData.get("company")?.trim(),
        role: formData.get("role")?.trim(),
        budget_range: formData.get("budget_range")?.trim(),
        campaign_goal: formData.get("campaign_goal")?.trim(),
        message: formData.get("message")?.trim(),
        source: "landing_page"
      };

      if (!payload.full_name || !payload.email) {
        setMessage("Please add your name and email.", "error");
        return;
      }

      button.disabled = true;
      button.style.opacity = "0.65";
      setMessage("Submitting your campaign inquiry…", "");

      try {
        const { error } = await window.supabaseClient
          .from("contact_leads")
          .insert(payload);

        if (error) throw error;

        form.reset();
        setMessage("Received. The Clipency team will review your inquiry soon.", "success");
      } catch (error) {
        setMessage(error.message || "Could not submit inquiry. Please try again.", "error");
      } finally {
        button.disabled = false;
        button.style.opacity = "1";
      }
    });
  }
})();
