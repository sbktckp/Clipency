(function () {
  const form = document.getElementById("landing-contact-form");
  const message = document.getElementById("contact-form-message");
  const cursorDot = document.getElementById("cursor-dot");
  const cursorRing = document.getElementById("cursor-ring");

  let mouseX = 0;
  let mouseY = 0;
  let ringX = 0;
  let ringY = 0;

  function setMessage(text, type) {
    if (!message) return;
    message.textContent = text;
    message.className = `form-message ${type || ""}`;
  }

  function installCursor() {
    if (!cursorDot || !cursorRing || window.matchMedia("(max-width: 700px)").matches) return;

    window.addEventListener("mousemove", (event) => {
      mouseX = event.clientX;
      mouseY = event.clientY;

      document.body.classList.add("cursor-ready");

      cursorDot.style.transform = `translate(${mouseX}px, ${mouseY}px) translate(-50%, -50%)`;
    });

    function animateRing() {
      ringX += (mouseX - ringX) * 0.18;
      ringY += (mouseY - ringY) * 0.18;

      cursorRing.style.transform = `translate(${ringX}px, ${ringY}px) translate(-50%, -50%)`;

      requestAnimationFrame(animateRing);
    }

    animateRing();

    const hoverTargets = "a, button, input, select, textarea, .team-card, .operating-card, .proof-card, .testimonial-card, .client-panel";

    document.addEventListener("mouseover", (event) => {
      if (event.target.closest(hoverTargets)) {
        document.body.classList.add("cursor-hover");
      }
    });

    document.addEventListener("mouseout", (event) => {
      if (event.target.closest(hoverTargets)) {
        document.body.classList.remove("cursor-hover");
      }
    });
  }

  function revealOnScroll() {
    const items = document.querySelectorAll(
      ".narrative-stack article, .operating-card, .proof-card, .testimonial-card, .team-card, .contact-form, .client-panel, .hero-product"
    );

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = "1";
          entry.target.style.transform = "translateY(0)";
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });

    items.forEach((item, index) => {
      item.style.opacity = "0";
      item.style.transform = "translateY(18px)";
      item.style.transition = `opacity 560ms ease ${Math.min(index * 30, 240)}ms, transform 560ms ease ${Math.min(index * 30, 240)}ms`;
      observer.observe(item);
    });
  }

  function magneticButtons() {
    const buttons = document.querySelectorAll(".primary-btn, .secondary-btn, .nav-signup");

    buttons.forEach((button) => {
      button.addEventListener("mousemove", (event) => {
        const rect = button.getBoundingClientRect();
        const x = event.clientX - rect.left - rect.width / 2;
        const y = event.clientY - rect.top - rect.height / 2;
        button.style.transform = `translate(${x * 0.045}px, ${y * 0.07}px)`;
      });

      button.addEventListener("mouseleave", () => {
        button.style.transform = "";
      });
    });
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

  function boot() {
    installCursor();
    revealOnScroll();
    magneticButtons();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
