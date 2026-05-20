(function () {
  const form = document.getElementById("landing-contact-form");
  const message = document.getElementById("contact-form-message");
  const cursorDot = document.getElementById("cursor-dot");
  const cursorRing = document.getElementById("cursor-ring");
  const progress = document.getElementById("scroll-progress");

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

    const targets = "a, button, input, select, textarea, .system-card, .comparison-panel, .creator-card, .insight-card, .testimonial-card, .team-card";

    document.addEventListener("mouseover", (event) => {
      if (event.target.closest(targets)) document.body.classList.add("cursor-hover");
    });

    document.addEventListener("mouseout", (event) => {
      if (event.target.closest(targets)) document.body.classList.remove("cursor-hover");
    });
  }

  function installReveal() {
    const items = document.querySelectorAll(".reveal");

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12 });

    items.forEach((item) => observer.observe(item));
  }

  function installProgress() {
    function update() {
      if (!progress) return;

      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const height = document.documentElement.scrollHeight - window.innerHeight;
      const percentage = height > 0 ? (scrollTop / height) * 100 : 0;

      progress.style.width = `${percentage}%`;
    }

    window.addEventListener("scroll", update, { passive: true });
    update();
  }

  function installActiveNav() {
    const links = Array.from(document.querySelectorAll(".nav-links a"));
    const sections = links
      .map((link) => {
        const id = link.getAttribute("href");
        return id && id.startsWith("#") ? document.querySelector(id) : null;
      })
      .filter(Boolean);

    if (!sections.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        links.forEach((link) => link.classList.remove("active"));

        const active = links.find((link) => link.getAttribute("href") === `#${entry.target.id}`);
        if (active) active.classList.add("active");
      });
    }, { threshold: 0.35 });

    sections.forEach((section) => observer.observe(section));
  }

  function installMagnetics() {
    const buttons = document.querySelectorAll(".magnetic");

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

  function installCountUp() {
    const counters = document.querySelectorAll("[data-count]");

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        const el = entry.target;
        const target = Number(el.getAttribute("data-count") || 0);
        const suffix = target === 100 ? "%" : target === 24 ? "/7" : "";
        const duration = 950;
        const start = performance.now();

        function tick(now) {
          const progress = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          const value = Math.round(target * eased);

          el.textContent = `${value}${suffix}`;

          if (progress < 1) requestAnimationFrame(tick);
        }

        requestAnimationFrame(tick);
        observer.unobserve(el);
      });
    }, { threshold: 0.4 });

    counters.forEach((counter) => observer.observe(counter));
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
    installReveal();
    installProgress();
    installActiveNav();
    installMagnetics();
    installCountUp();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
