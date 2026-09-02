# AGENTS.md — Kamal El Sayyed Portfolio

Instructions for any agent (or future me) working on this repo. This project was built
from an explicit, detailed spec given in chat — the rules below are extracted from that
spec plus decisions made during the build. Follow them; don't reinterpret from scratch.

## What this is

A single-page personal portfolio for Kamal El Sayyed (Software Engineer — Mobile,
Full-Stack & DevOps). Static site, no build step, no backend.

## Tech constraints (non-negotiable)

- **HTML5 + CSS3 + vanilla JavaScript only.** No React/Vue/Angular/Next.js/Tailwind/Bootstrap.
- Minimal external dependencies. Google Fonts (Inter + JetBrains Mono) is the one exception.
- Must run with no build process — open `index.html` or serve the folder as-is.

## File structure (keep this separation)

```
index.html              — structure only, no hardcoded content
css/styles.css          — all styling, theming, responsive rules
js/portfolio-data.js    — ALL content/config lives here
js/app.js               — rendering + interaction logic only, no content strings
cv/Kamal-Sayed.pdf      — actual CV file, served for download
assets/images/          — profile photo (assets/images/profile.jpg)
assets/{projects,companies,icons}/ — optional images referenced from portfolio-data.js
```

**The site must be fully data-driven.** Adding a project, hiding a skill, reordering
experience, swapping the CV file, etc. should only ever require editing
`portfolio-data.js` — never touching `index.html` or `app.js`. Every content array
supports `id`, `order`, and `visible` (projects also get `featured`) so items can be
reordered/hidden without UI code changes.

## Source-of-truth rules for content

- The CV (`cv/Kamal-Sayed.pdf`) is the primary source for experience, skills, education, dates,
  companies, achievements.
- Anything the user states explicitly in chat overrides the CV on conflict.
- **Never fabricate**: technologies, responsibilities, achievements, dates, companies,
  clients, metrics/stats, URLs, certifications, integrations, or functionality. If a
  detail isn't confirmed by the CV or explicit chat instructions, omit it — don't guess.
- Numeric stats in the "About" strip (years of experience, companies, project count,
  core disciplines) must be **computed from the data arrays**, never hardcoded — see
  `computeStats()` in `app.js`.
- Screenshots/links: `screenshots: []` and `links: {}` are valid and expected until real
  assets exist. Never invent a URL or leave a broken/placeholder image — sections and
  buttons for missing data must not render at all (see rendering rules below).
- Confidential client/employer work (e.g. RAPIDS @ TELUS Health, Matensa, Fennel) gets
  described at a professional public level only — no credentials, endpoints, infra
  topology, secrets, or proprietary workflow details, even if asked to "expand."

## Required Projects (do not remove/merge/rename)

All ten must always be present and visible unless the user explicitly says otherwise:
**Wasselli, Fennel, Matensa, RAPIDS, FinFirst, CarGet, Checkpoint, BeeFarmer, Forza,
RealSteel.**

Project schema (see `portfolio-data.js` for the authoritative shape):
`id, order, visible, featured, name, companyId (or null), context (free-text fallback
label for freelance/no-company-record projects, e.g. a named client with no company
entry), type, overview, purpose, role, contributions[], functionality[], technologies[],
integrations[], categories[], screenshots[] ({src,type,alt,caption}), links
({liveUrl, githubUrl, appStoreUrl, playStoreUrl})`.

Rules that came from direct feedback:
- Distinguish clearly between **what the product is** vs **what Kamal personally
  contributed** — don't imply end-to-end ownership unless the project explicitly says
  "A→Z."
- **Categories/filters must stay curated** — only broad, recurring engineering
  categories that make sense as a filter (currently: Mobile, Flutter, Firebase, Backend,
  FinTech, Third-Party Integrations, DevOps, End-to-End Development). Do not add
  narrow one-off tags like "QR Code," "Gym Management," "Attendance," "Backups," etc.
  even if technically accurate to one project — they clutter the filter row for no
  benefit. When adding a new project, prefer reusing an existing category over minting
  a new one.
- The filter row is a **wrapping flex row** (`flex-wrap: wrap`), not a horizontal
  scroller — this was tried and explicitly reverted. Don't reintroduce
  `overflow-x`/scrollbar/mask-image on `.project-filters`.
- Project grid is responsive: **3 columns** above 1024px, **2 columns** from 641–1024px,
  **1 column** at ≤640px (`.project-grid` base rule + the two breakpoints in
  `styles.css`).
- Project detail modal renders sections (Overview+purpose, My Role, Key Contributions,
  Key Functionality, Technologies, Integrations, Project Gallery, Links) **only when
  the underlying data is non-empty** — never render an empty section header or a
  broken image. Screenshots open in the lightbox (`#lightbox`); links only render a
  button per URL that actually exists.

## Design direction

- Palette: black/white/grey with a **subtle orange accent** (`--accent`), used only for
  CTAs, active nav state, timeline markers, selected filters, small highlights/icons.
  Orange must never dominate a layout.
- No heavy gradients, glassmorphism, excessive rounded corners, floating code snippets,
  emojis, or flashy/attention-seeking animation.
- Typography: Inter for body/headings, JetBrains Mono reserved for small technical
  details (tags, labels, dates, section numbers) — never the whole page.
- Both dark and light themes are first-class (not light-as-afterthought). Theme choice
  persists to `localStorage`; falls back to `prefers-color-scheme` if unset. Theme
  tokens must be defined at `:root` level and re-declared in both the media-query dark
  block and `[data-theme="dark"]` — see the top of `styles.css`.
- No scroll-progress bar. No "Open to Work" indicator. No Languages section under About.
- Hero specialty rotator must respect `prefers-reduced-motion`.
- Mobile nav gets its own polished full-height menu, not a shrunk desktop dropdown.
  Project modal is full-screen on mobile, centered overlay on desktop — not a squeezed
  desktop modal.

## Known gotchas

- **Don't nest `#mobile-menu` inside `header.navbar`.** It was originally a child of the
  flex navbar and got clipped to the navbar's height by the rendering engine (fixed
  position wasn't respected inside the flex stacking context). It must stay a sibling
  of `<header>`, placed right after it in the DOM.
- When testing responsively, verify with actual computed styles
  (`getComputedStyle(...).gridTemplateColumns`, etc.) — the local preview browser pane
  in this environment can render blank/black screenshots intermittently even though the
  page is fine; don't assume a rendering bug in the site itself before checking the DOM.

## Repo / git

- This folder (`profile/profile`) is its own standalone git repo (not the parent
  home-directory repo) with remote `https://github.com/kamalsayed98/profile.git`.
  Never touch the home-directory-rooted git repo.
- Only commit/push when explicitly asked.

## Local preview

`.claude/launch.json` runs `python3 -m http.server 5174` — use this (via the Browser
tool's `preview_start`) rather than opening `index.html` directly via `file://`, since
relative asset/script loading doesn't work reliably from a raw file URL in the preview
pane.
