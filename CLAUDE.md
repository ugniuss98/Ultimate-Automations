# Ultimate Automations (ultimateautomations.com) — repo notes

Static HTML/CSS/JS site for a Lithuanian AI systems agency (Ultimate Automations).
No build step — every page is a hand-written `.html` file, shared styling lives in
`styles.css`, shared behavior in `main.js`. Deployed via Vercel, which auto-deploys
from the `main` branch (see `vercel.json` for headers and the www → apex redirect).

The site is written in **Lithuanian**. Tone: direct, concrete, numbers-first, no
marketing fluff and no generic AI-sounding filler.

## Structure

- `index.html` — homepage. Sections, in order, each with an `id` used by the nav:
  hero → `#projektai-preview` (darbai) → `#poziuris` → plėtra → `#paslaugos` →
  `#procesas` → `#technologijos` → įvertinimas → `#atsiliepimai` → `#duk` →
  `#kontaktai`.
- `projektai.html` — projects index, served at `/projektai`.
- `projektai/*.html` — one file per project, e.g.
  `projektai/banko-israsu-sutikrinimas.html` served at
  `/projektai/banko-israsu-sutikrinimas`.
- `admin/index.html` — small editor that commits `content.json` through the GitHub
  API. Blocked in `robots.txt`.
- `content.json` — site-wide stats/strings injected at runtime into elements
  carrying `data-content` (see `main.js`). Keys must match what the HTML asks for.
- `sitemap.xml` — must list every public URL, including each project page.
- `llms.txt` — plain-text summary of the company for LLM crawlers; keep it in sync
  with the homepage when services, projects or numbers change.

## Design system

`styles.css` is the whole design system and is shared by every page. Build new pages
by reusing its components rather than writing new CSS:

- Page shells: `.wrap`, `.pad-y`, `.sec-head` (+ `.eyebrow`, `.h-section`, `§` label
  on the right), `.sub-sec-head`, `.sub-hero` (+ `.crumbs`, `.sub-hero-tags`).
- Content blocks: `.feat-grid`/`.feat-card`, `.explore-grid`/`.explore-card`,
  `.process-grid`/`.process-card`, `.metric-row`/`.metric`, `.split-grid` +
  `.side-card`, `.prose`, `.pull` (quote: `.pnum` + `.ptext` + `.psub`),
  `.related-grid`/`.related-card`, `.compare`, `.check-grid`.
- Dark blocks: `.dark-sec` (holds `.tl`/`.tl-step` timelines), `.sub-cta` with
  `.cta-bg.flux-bg` and eight `.blob` spans.
- FAQ accordion: `.faq` → `.faq-item` → `button.faq-q` (with `<span class="ic">+</span>`)
  → `.faq-a > div > p`. `main.js` wires the toggling.
- Tables must be wrapped in `<div class="table-wrap">` so they scroll inside their own
  container instead of making the page scroll sideways.

Accent colours live in `:root` as `--accent`, `--accent-strong`, `--accent-bright`,
`--accent-2..4`. The palette is a muted deep blue (`#2A4A63` family) on the cream
`#FAFAF7` base. A few dark gradients still hardcode the same hues — grep for the hex
values before changing the brand colour.

## Contact form

The site has **no form backend**. The homepage quiz (`#contactForm`) carries
`data-mailto="justas@ultimateautomations.com"`; on submit `main.js` collects the
answers and opens the visitor's mail client with a prefilled message. If a real
endpoint is ever added, give the form an `action` and drop `data-mailto` — the
`fetch` path is still in `main.js`.

The 30-second lead pop-up in `main.js` is disabled the same way: its `ENDPOINT`
constant is empty, and the block returns early. Setting an endpoint re-enables it.

Analytics is intentionally **not** configured: every page carries a comment where the
Google tag belongs. Do not paste in a tag ID from another project.

## Adding a project page

1. Copy an existing file in `projektai/` as the structural starting point. Keep the
   head block (meta, Open Graph, Twitter card, JSON-LD `Article` + `BreadcrumbList`),
   nav, sub-hero, section order and footer — only replace the content.
2. Slug: kebab-case, matches the filename and the `/projektai/<slug>` URL used
   everywhere (canonical, OG, JSON-LD, links).
3. Update, in this order:
   - `projektai.html` — add an `.explore-card`.
   - `index.html` — footer "Projektai" column; the `#projektai-preview` section only
     if the project belongs among the headline ones.
   - the other `projektai/*.html` pages — `.related-grid` links.
   - `sitemap.xml` — a `<url>` entry with today's date as `lastmod`, and bump
     `<lastmod>` on `/` and `/projektai`.
   - `llms.txt` — the projects list.

## SEO requirements (every page, non-negotiable)

- **One primary keyword per page**, in Lithuanian, matching real search intent. It
  must appear in the `<title>`, the `<h1>`, the first 100 words, at least one `<h2>`,
  the meta description and the slug. Never repeat it past the point where the sentence
  stops reading naturally.
- **`<title>`** ≤ 60 characters including the ` | Ultimate Automations` suffix, with
  the primary keyword near the front.
- **Meta description**: 140–160 characters, contains the primary keyword and one
  concrete reason to click (a number, an outcome). Not a summary.
- **Heading hierarchy**: exactly one `<h1>`; sections are `<h2>`; sub-points `<h3>`.
  Never skip a level, never use a heading purely for styling.
- **Internal links**: 3–5 contextual links per page — at least 2 to other
  `/projektai/*` pages and 1 to the homepage services or contact section. Anchor text
  must be descriptive, never `čia` or `skaitykite daugiau`.
- **Structured data**: keep the full `@graph`. The homepage carries
  `Organization` + `WebSite` + `WebPage` + `FAQPage`; project pages carry `Article` +
  `BreadcrumbList`. `FAQPage` questions must match the visible DUK section word for
  word, or Google treats it as mismatched markup.
- **Canonical, OG, Twitter and JSON-LD URLs** must all point at the same
  `https://ultimateautomations.com/...` address — a mismatch here silently kills the
  page in the index.
- **Accessibility affects ranking**: descriptive `alt` on any image, real `<ul>` /
  `<table>` markup instead of visually faked lists.

## Keyword demand comes first (learned the hard way on the previous site)

This repo previously held a different agency site that published 53 blog articles
chosen by "what haven't we covered yet". Over 7 days they produced 8 clicks from 57
impressions, and not one top Search Console query matched any article's primary
keyword. Rules that follow:

- **Never invent a keyword.** Before writing, the topic's phrasing must be evidenced:
  a query already appearing in Search Console, a Google autocomplete / "people also
  ask" result, or a term used by ranking Lithuanian competitors. "It's a good topic"
  is not evidence.
- **Search Console is the keyword research.** Queries the site already gets
  impressions for — especially at positions 15–100 — are the cheapest wins.
- **Service and project pages outrank content volume.** They carry the queries that
  bring customers. A service page must never be thinner or less optimised than a
  content page.
- **Publishing velocity is a ranking factor in practice.** Dozens of pages in days on
  a young domain matches Google's "scaled content abuse" pattern. Add pages when there
  is a real project or a real query behind them, not on a schedule.
- **Without backlinks, on-page work has a ceiling.** A new domain will not rank for
  head terms no matter how many pages exist. Say this plainly rather than adding pages.

## Fact-checking (mandatory before publishing)

The site's credibility is the product. Nothing goes live unverified.

- **Every client-result number** (the 55 000 € and 80 000 € annual values, 100 000+
  emails per month, 20+ banks, the 9,7/10 rating) comes from the company itself. Do
  not round, sharpen or extrapolate them, and do not derive new figures from them.
- **Never invent a client, a testimonial, a logo or a metric.** The named references
  are Civinity AB and Refactory; every other testimonial on the site is attributed by
  role only, exactly as the company provides it. If a project has no published
  number, describe the outcome qualitatively instead of estimating one.
- **Every external statistic or benchmark** must be checked with a web search against
  a named, reputable source published within roughly the last 24 months. Prefer the
  primary source over a blog quoting it. If a number cannot be verified it does not
  get published — drop it, or reframe it honestly as the company's own observation.
- **Technology claims** (what NLP, Computer Vision, ML or an LLM can actually do in a
  given process) must stay conservative and describe what the built systems do, not
  what the field can do in theory.
- **Legal/compliance claims** (GDPR, data processing, Lithuanian regulation) must be
  conservative and verified; when in doubt, describe practice rather than assert a
  legal requirement.

## Site-wide technical notes

- `vercel.json` holds a **301 redirect from `www.ultimateautomations.com` to the apex
  domain**. Without it every page exists on both hostnames and splits its own signals.
  Do not remove it.
- `uploads/og-cover.png` (1200×630) is the shared Open Graph image for every page.
  Reuse it rather than generating per-page images.
- Submitting `sitemap.xml` to Google Search Console is the site owner's task.
