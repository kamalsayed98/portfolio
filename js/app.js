/**
 * Application logic: renders the DOM from portfolioData and wires up interactions.
 */
(function () {
  "use strict";

  const data = portfolioData;

  /* ---------------- helpers ---------------- */

  const $ = (sel, ctx) => (ctx || document).querySelector(sel);
  const $$ = (sel, ctx) => Array.from((ctx || document).querySelectorAll(sel));

  const byOrder = (a, b) => (a.order ?? 0) - (b.order ?? 0);
  const visible = (item) => item.visible !== false;

  function getCompany(id) {
    return data.companies.find((c) => c.id === id) || null;
  }

  function companyDisplayName(id) {
    const c = getCompany(id);
    if (!c) return "";
    if (c.type === "client" && c.parentCompanyId) {
      const parent = getCompany(c.parentCompanyId);
      return parent ? `${c.name} · via ${parent.name}` : c.name;
    }
    return c.name;
  }

  /** Resolves what to show as a project's "context" line: its linked company,
   *  else a free-text context label (e.g. a client with no company record),
   *  else null (caller falls back to the project's type). */
  function projectContextLabel(p) {
    if (p.companyId) return companyDisplayName(p.companyId);
    if (p.context) return p.context;
    return null;
  }

  function initials(name) {
    return name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase();
  }

  function formatMonthYear(isoMonth) {
    if (!isoMonth) return "";
    const [y, m] = isoMonth.split("-").map(Number);
    const date = new Date(y, m - 1);
    return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
  }

  function monthsBetween(startIso, endIso) {
    const [sy, sm] = startIso.split("-").map(Number);
    const end = endIso ? endIso.split("-").map(Number) : (() => {
      const now = new Date();
      return [now.getFullYear(), now.getMonth() + 1];
    })();
    return (end[0] - sy) * 12 + (end[1] - sm);
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str ?? "";
    return div.innerHTML;
  }

  /* ---------------- icons (inline SVG, minimal set) ---------------- */

  const ICONS = {
    smartphone:
      '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="2" width="12" height="20" rx="2"></rect><line x1="11" y1="18" x2="13" y2="18"></line></svg>',
    layers:
      '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>',
    cloud:
      '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z"></path></svg>',
    linkedin:
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4V8h4v1.5A5 5 0 0116 8z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>',
    mail:
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"></rect><path d="M22 6l-10 7L2 6"></path></svg>',
    phone:
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"></path></svg>',
    location:
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>',
    external:
      '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>',
    arrow:
      '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>',
  };

  function icon(name) {
    return ICONS[name] || "";
  }

  /* ---------------- render: hero ---------------- */

  function renderHero() {
    $("#hero-name").textContent = data.personal.name;
    $("#hero-title").textContent = `${data.personal.title} | ${data.personal.tagline}`;
    document.title = data.seo.title;
    $('meta[name="description"]').setAttribute("content", data.seo.description);

    const current = data.experience
      .filter(visible)
      .find((e) => e.current);
    const eyebrow = $("#hero-current");
    if (current) {
      const company = companyDisplayName(current.companyId).split(" · ")[0];
      eyebrow.innerHTML = `Currently @ <strong>${escapeHtml(company)}</strong>`;
    } else {
      eyebrow.textContent = data.personal.title;
    }

    $("#hero-intro").textContent = data.hero.intro;

    const cvLink = $("#hero-cv-download");
    cvLink.href = data.personal.cvPath;
    cvLink.setAttribute("download", "");

    const photo = $("#hero-photo");
    const frame = $("#hero-portrait-frame");
    const fallback = $("#hero-portrait-fallback");
    fallback.textContent = initials(data.personal.name);
    photo.addEventListener("error", () => frame.classList.add("is-fallback"), { once: true });
    photo.src = data.personal.photo;

    setupSpecialtyRotator();
  }

  function setupSpecialtyRotator() {
    const el = $("#hero-specialty");
    const items = data.hero.specialties;
    if (!items || !items.length) return;

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReduced) {
      el.textContent = items.join("  →  ");
      return;
    }

    let index = 0;
    el.textContent = items[0];
    setInterval(() => {
      index = (index + 1) % items.length;
      el.style.opacity = "0";
      setTimeout(() => {
        el.textContent = items[index];
        el.style.opacity = "1";
      }, 350);
    }, 2800);
    el.style.transition = "opacity 0.35s ease";
  }

  /* ---------------- render: about ---------------- */

  function renderAbout() {
    $("#about-text").innerHTML = data.about.paragraphs.map((p) => `<p>${escapeHtml(p)}</p>`).join("");

    const stats = computeStats();
    $("#about-stats").innerHTML = stats
      .map(
        (s) => `
      <div class="stat-card">
        <div class="stat-card__value">${escapeHtml(s.value)}</div>
        <div class="stat-card__label">${escapeHtml(s.label)}</div>
      </div>`
      )
      .join("");
  }

  function computeStats() {
    const exp = data.experience.filter(visible);
    const earliest = exp.reduce((min, e) => (e.startDate < min ? e.startDate : min), exp[0].startDate);
    const years = Math.floor(monthsBetween(earliest, null) / 12);

    const employers = new Set(
      exp.map((e) => e.companyId).filter((id) => getCompany(id)?.type !== "client")
    );

    const projectCount = data.projects.filter(visible).length;
    const disciplineCount = data.whatIDo.filter(visible).length;

    return [
      { value: `${years}+`, label: "Years of Experience" },
      { value: String(employers.size), label: "Companies" },
      { value: String(projectCount), label: "Projects Delivered" },
      { value: String(disciplineCount), label: "Core Disciplines" },
    ];
  }

  function renderWhatIDo() {
    const items = data.whatIDo.filter(visible).sort(byOrder);
    $("#what-i-do").innerHTML = items
      .map(
        (item) => `
      <div class="do-card">
        <div class="do-card__icon">${icon(item.icon)}</div>
        <h3 class="do-card__title">${escapeHtml(item.title)}</h3>
        <p class="do-card__desc">${escapeHtml(item.description)}</p>
      </div>`
      )
      .join("");
  }

  /* ---------------- render: experience timeline ---------------- */

  function renderTimeline() {
    const items = data.experience.filter(visible).sort(byOrder);
    $("#timeline").innerHTML = items
      .map((exp) => {
        const company = getCompany(exp.companyId);
        const dateRange = `${formatMonthYear(exp.startDate)} — ${exp.current ? "Present" : formatMonthYear(exp.endDate)}`;
        const logoContent = company?.logo
          ? `<img src="${escapeHtml(company.logo)}" alt="${escapeHtml(company.name)} logo" onerror="this.parentElement.textContent='${escapeHtml(initials(company.name))}'">`
          : escapeHtml(initials(company?.name || "?"));

        return `
        <li class="timeline-item ${exp.current ? "timeline-item--current" : ""}">
          <span class="timeline-item__marker"></span>
          <div class="timeline-card">
            <div class="timeline-card__head">
              <div class="timeline-card__role-group">
                <div class="company-logo">${logoContent}</div>
                <div>
                  <div class="timeline-card__role">${escapeHtml(exp.role)}</div>
                  <div class="timeline-card__company">${escapeHtml(company?.name || "")}</div>
                </div>
              </div>
              <div class="timeline-card__meta">
                <div>${dateRange}</div>
                <div>${escapeHtml(exp.location || "")}</div>
              </div>
            </div>
            ${exp.summary ? `<p class="timeline-card__summary">${escapeHtml(exp.summary)}</p>` : ""}
            <ul class="timeline-card__achievements">
              ${exp.achievements.map((a) => `<li>${escapeHtml(a)}</li>`).join("")}
            </ul>
            <div class="tag-row">
              ${exp.technologies.map((t) => `<span class="tag">${escapeHtml(t)}</span>`).join("")}
            </div>
          </div>
        </li>`;
      })
      .join("");
  }

  /* ---------------- render: projects ---------------- */

  let activeFilter = "all";

  function renderProjectFilters() {
    const projects = data.projects.filter(visible);
    const categories = new Set();
    projects.forEach((p) => (p.categories || []).forEach((c) => categories.add(c)));

    const filters = ["All", ...Array.from(categories).sort()];

    $("#project-filters").innerHTML = filters
      .map((f) => {
        const value = f.toLowerCase();
        return `<button class="filter-btn ${value === "all" ? "is-active" : ""}" type="button" data-filter="${escapeHtml(value)}" role="tab" aria-selected="${value === "all"}">${escapeHtml(f)}</button>`;
      })
      .join("");

    $$(".filter-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        activeFilter = btn.dataset.filter;
        $$(".filter-btn").forEach((b) => {
          b.classList.toggle("is-active", b === btn);
          b.setAttribute("aria-selected", String(b === btn));
        });
        applyProjectFilter();
      });
    });
  }

  function applyProjectFilter() {
    $$(".project-card").forEach((card) => {
      const cats = card.dataset.categories.split("|");
      const match = activeFilter === "all" || cats.includes(activeFilter);
      card.classList.toggle("project-card--hidden", !match);
    });
  }

  function renderProjects() {
    const projects = data.projects.filter(visible).sort(byOrder);

    $("#project-grid").innerHTML = projects
      .map((p) => {
        const context = projectContextLabel(p) || p.type || "";
        const technologies = p.technologies || [];
        return `
        <article class="project-card"
                  data-categories="${(p.categories || []).map((c) => c.toLowerCase()).join("|")}"
                  data-project-id="${escapeHtml(p.id)}"
                  tabindex="0" role="button" aria-haspopup="dialog">
          <div class="project-card__context">${escapeHtml(context)}</div>
          <h3 class="project-card__name">${escapeHtml(p.name)}</h3>
          <p class="project-card__overview">${escapeHtml(p.overview)}</p>
          ${
            technologies.length
              ? `<div class="project-card__tags tag-row">
                  ${technologies.slice(0, 5).map((t) => `<span class="tag">${escapeHtml(t)}</span>`).join("")}
                </div>`
              : ""
          }
          <div class="project-card__footer">
            <span class="project-card__role">${escapeHtml(p.role || "")}</span>
            <span class="project-card__view">View Project ${icon("arrow")}</span>
          </div>
        </article>`;
      })
      .join("");

    $$(".project-card").forEach((card) => {
      const open = () => openProjectModal(card.dataset.projectId);
      card.addEventListener("click", open);
      card.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          open();
        }
      });
    });
  }

  /* ---------------- project modal ---------------- */

  const LINK_LABELS = {
    liveUrl: "Live Site",
    githubUrl: "GitHub",
    appStoreUrl: "App Store",
    playStoreUrl: "Google Play",
  };

  let currentModalScreenshots = [];

  function openProjectModal(projectId) {
    const p = data.projects.find((proj) => proj.id === projectId);
    if (!p) return;

    const contextParts = [projectContextLabel(p), p.type].filter(Boolean);
    const technologies = p.technologies || [];
    const contributions = p.contributions || [];
    const functionality = p.functionality || [];
    const integrations = p.integrations || [];
    const screenshots = p.screenshots || [];
    const links = Object.entries(p.links || {}).filter(([, url]) => !!url);

    currentModalScreenshots = screenshots;

    $("#project-modal-content").innerHTML = `
      <h2 class="modal-title" id="modal-title">${escapeHtml(p.name)}</h2>
      ${contextParts.length ? `<p class="modal-context">${escapeHtml(contextParts.join(" · "))}</p>` : ""}

      <div class="modal-section">
        <div class="modal-section__title">Overview</div>
        <p>${escapeHtml(p.overview)}</p>
        ${p.purpose ? `<p>${escapeHtml(p.purpose)}</p>` : ""}
      </div>

      ${
        p.role
          ? `<div class="modal-section">
              <div class="modal-section__title">My Role</div>
              <p>${escapeHtml(p.role)}</p>
            </div>`
          : ""
      }

      ${
        contributions.length
          ? `<div class="modal-section">
              <div class="modal-section__title">Key Contributions</div>
              <ul>${contributions.map((c) => `<li>${escapeHtml(c)}</li>`).join("")}</ul>
            </div>`
          : ""
      }

      ${
        functionality.length
          ? `<div class="modal-section">
              <div class="modal-section__title">Key Functionality</div>
              <ul>${functionality.map((f) => `<li>${escapeHtml(f)}</li>`).join("")}</ul>
            </div>`
          : ""
      }

      ${
        technologies.length
          ? `<div class="modal-section">
              <div class="modal-section__title">Technologies</div>
              <div class="tag-row">${technologies.map((t) => `<span class="tag">${escapeHtml(t)}</span>`).join("")}</div>
            </div>`
          : ""
      }

      ${
        integrations.length
          ? `<div class="modal-section">
              <div class="modal-section__title">Integrations</div>
              <div class="tag-row">${integrations.map((i) => `<span class="tag">${escapeHtml(i)}</span>`).join("")}</div>
            </div>`
          : ""
      }

      ${
        screenshots.length
          ? `<div class="modal-section">
              <div class="modal-section__title">Project Gallery</div>
              <div class="modal-shots">
                ${screenshots
                  .map(
                    (s, i) => `
                  <figure class="modal-shot" data-shot-index="${i}" tabindex="0" role="button" aria-label="View screenshot ${i + 1} full-screen">
                    <img src="${escapeHtml(s.src)}" alt="${escapeHtml(s.alt || p.name + " screenshot")}" loading="lazy">
                    ${s.caption ? `<figcaption>${escapeHtml(s.caption)}</figcaption>` : ""}
                  </figure>`
                  )
                  .join("")}
              </div>
            </div>`
          : ""
      }

      ${
        links.length
          ? `<div class="modal-section">
              <div class="modal-section__title">Links</div>
              <div class="modal-links">
                ${links
                  .map(
                    ([key, url]) =>
                      `<a class="btn btn--secondary" href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${LINK_LABELS[key] || key} ${icon("external")}</a>`
                  )
                  .join("")}
              </div>
            </div>`
          : ""
      }
    `;

    $$(".modal-shot", $("#project-modal-content")).forEach((fig) => {
      const openShot = () => openLightbox(currentModalScreenshots[Number(fig.dataset.shotIndex)]);
      fig.addEventListener("click", openShot);
      fig.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openShot();
        }
      });
    });

    const modal = $("#project-modal");
    modal.hidden = false;
    document.body.classList.add("no-scroll");
    $("#project-modal-close").focus();
  }

  function closeProjectModal() {
    const modal = $("#project-modal");
    modal.hidden = true;
    document.body.classList.remove("no-scroll");
  }

  function setupModal() {
    $("#project-modal-close").addEventListener("click", closeProjectModal);
    $("#project-modal-backdrop").addEventListener("click", closeProjectModal);
    document.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") return;
      if (!$("#lightbox").hidden) {
        closeLightbox();
      } else if (!$("#project-modal").hidden) {
        closeProjectModal();
      }
    });
  }

  /* ---------------- screenshot lightbox ---------------- */

  function openLightbox(shot) {
    if (!shot) return;
    const img = $("#lightbox-image");
    const caption = $("#lightbox-caption");
    img.src = shot.src;
    img.alt = shot.alt || "";
    caption.textContent = shot.caption || "";
    caption.hidden = !shot.caption;

    $("#lightbox").hidden = false;
    $("#lightbox-close").focus();
  }

  function closeLightbox() {
    const lightbox = $("#lightbox");
    lightbox.hidden = true;
    $("#lightbox-image").src = "";
  }

  function setupLightbox() {
    $("#lightbox-close").addEventListener("click", closeLightbox);
    $("#lightbox-backdrop").addEventListener("click", closeLightbox);
  }

  /* ---------------- render: skills ---------------- */

  function renderSkills() {
    const groups = data.skills.filter(visible).sort(byOrder);
    $("#skills-grid").innerHTML = groups
      .map(
        (g) => `
      <div class="skill-card">
        <div class="skill-card__title">${escapeHtml(g.category)}</div>
        <div class="skill-card__items">
          ${g.items.map((item) => `<span class="tag">${escapeHtml(item)}</span>`).join("")}
        </div>
      </div>`
      )
      .join("");
  }

  /* ---------------- render: education ---------------- */

  function renderEducation() {
    const items = data.education.filter(visible).sort(byOrder);
    $("#education-list").innerHTML = items
      .map(
        (e) => `
      <div class="education-item">
        <div>
          <div class="education-item__degree">${escapeHtml(e.degree)}</div>
          <div class="education-item__institution">${escapeHtml(e.institution)}</div>
        </div>
        <div class="education-item__dates">${formatMonthYear(e.startDate)} — ${formatMonthYear(e.endDate)}</div>
      </div>`
      )
      .join("");

    if (!data.certifications || !data.certifications.filter(visible).length) return;
  }

  /* ---------------- render: contact ---------------- */

  function renderContact() {
    $("#contact-heading").textContent = data.contact.heading;
    $("#contact-message").textContent = data.contact.message;

    const cards = [];

    if (data.personal.email) {
      cards.push({ icon: "mail", label: "Email", value: data.personal.email, href: `mailto:${data.personal.email}` });
    }
    if (data.personal.phone) {
      cards.push({ icon: "phone", label: "Phone", value: data.personal.phone, href: `tel:${data.personal.phone.replace(/\s+/g, "")}` });
    }
    if (data.personal.location) {
      cards.push({ icon: "location", label: "Location", value: data.personal.location, href: null });
    }

    const social = data.social.filter(visible).sort(byOrder);
    social.forEach((s) => {
      if (s.id === "email") return;
      cards.push({ icon: s.icon, label: s.label, value: s.label, href: s.url });
    });

    $("#contact-grid").innerHTML = cards
      .map((c) => {
        const inner = `
          <div class="contact-card__icon">${icon(c.icon)}</div>
          <div>
            <div class="contact-card__label">${escapeHtml(c.label)}</div>
            <div class="contact-card__value">${escapeHtml(c.value)}</div>
          </div>`;
        return c.href
          ? `<a class="contact-card" href="${escapeHtml(c.href)}" ${c.href.startsWith("http") ? 'target="_blank" rel="noopener noreferrer"' : ""}>${inner}</a>`
          : `<div class="contact-card">${inner}</div>`;
      })
      .join("");

    $("#footer-name").textContent = `© ${new Date().getFullYear()} ${data.personal.name}`;
  }

  /* ---------------- theme ---------------- */

  function setupTheme() {
    const root = document.documentElement;
    const toggle = $("#theme-toggle");
    const stored = localStorage.getItem("theme");

    if (stored === "light" || stored === "dark") {
      root.setAttribute("data-theme", stored);
    } else {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      root.setAttribute("data-theme", prefersDark ? "dark" : "light");
    }

    updateToggleState();

    toggle.addEventListener("click", () => {
      const current = root.getAttribute("data-theme");
      const next = current === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      localStorage.setItem("theme", next);
      updateToggleState();
    });

    function updateToggleState() {
      toggle.setAttribute("aria-pressed", String(root.getAttribute("data-theme") === "dark"));
    }
  }

  /* ---------------- navigation ---------------- */

  function setupNav() {
    const navToggle = $("#nav-toggle");
    const mobileMenu = $("#mobile-menu");

    navToggle.addEventListener("click", () => {
      const isOpen = mobileMenu.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", String(isOpen));
      navToggle.setAttribute("aria-label", isOpen ? "Close menu" : "Open menu");
      document.body.classList.toggle("no-scroll", isOpen);
    });

    $$("[data-nav-link]").forEach((link) => {
      link.addEventListener("click", () => {
        mobileMenu.classList.remove("is-open");
        navToggle.setAttribute("aria-expanded", "false");
        document.body.classList.remove("no-scroll");
      });
    });

    const sections = $$("main .section, .hero");
    const navLinks = $$("[data-section]");

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.id;
            navLinks.forEach((link) => {
              link.classList.toggle("is-active", link.dataset.section === id);
            });
          }
        });
      },
      { rootMargin: "-40% 0px -55% 0px", threshold: 0 }
    );

    sections.forEach((s) => observer.observe(s));
  }

  /* ---------------- init ---------------- */

  function init() {
    setupTheme();
    renderHero();
    renderAbout();
    renderWhatIDo();
    renderTimeline();
    renderProjectFilters();
    renderProjects();
    renderSkills();
    renderEducation();
    renderContact();
    setupModal();
    setupLightbox();
    setupNav();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
