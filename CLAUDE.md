# NOCK Mail (nockmail.lt) — repo notes

Static HTML/CSS/JS site for a Lithuanian email marketing agency (NOCK Mail).
No build step — every page is a hand-written `.html` file, shared styling
lives in `styles.css`, shared behavior in `main.js`. Deployed via Vercel,
which auto-deploys from the `main` branch (see `vercel.json` for headers).

## Structure

- `index.html` — homepage (includes a "Naujausi straipsniai" section, id
  `#blog`, showing the 3 newest blog posts as `post-card` links).
- `blog.html` — blog index: hero "Naujausias" feature post, JSON-LD
  `Blog`/`BlogPosting` graph, category filters, full `post-index` list of
  every article, footer links to the 2 newest posts.
- `blog/*.html` — one file per article, e.g. `blog/welcome-serija.html`
  served at `/blog/welcome-serija`.
- `paslaugos/*.html`, `klaviyo-agentura.html`, `omnisend-agentura.html`,
  `skaiciuokle.html` — other site pages, not part of the blog.
- `sitemap.xml` — must list every public URL including each blog post.
- `content.json` — small set of site-wide stats/strings (client count,
  revenue %, etc.) — unrelated to blog content.

## Blog article conventions

- **Template**: copy an existing file in `blog/` (e.g.
  `blog/welcome-serija.html`) as the structural starting point rather than
  building a page from scratch. Keep the same head block (Google tag, meta,
  Open Graph, Twitter card, JSON-LD `Article`), nav, sub-hero header,
  article body structure, "Susiję straipsniai" (related articles) block,
  and footer — only replace the content.
- **Slug**: kebab-case, matches the filename and the `/blog/<slug>` URL
  used everywhere (canonical, OG, JSON-LD, links).
- **Categories** (pick one existing, don't invent new ones without also
  adding a filter button in `blog.html`): `Automatizacijos`,
  `Pristatomumas`, `Strategija`, `Platformos`.
- **Tags**: 3–4 short tags shown as `pr-tag` spans in the blog index row.
- **Date format**: Lithuanian genitive month names as already used, e.g.
  `Liepos 27, 2026` (see existing articles for the month list).
- **Reading time**: estimate honestly from word count (~200 wpm), shown as
  `"N min skaitymo"` on the article page and `"N min"` in the blog index row.
- **Related articles**: link 2–3 existing articles that are topically
  close (same category or adjacent topic).
- **og:image / twitter:image**: reuse the existing shared
  `https://nockmail.lt/uploads/og-cover.png` — don't generate new images.
- **Tone**: direct, concrete, no marketing fluff or generic AI-sounding
  filler — matches the existing articles' practical, numbers-first style.

### Files to update for every new article (in this order)

1. `blog/<slug>.html` — the new article page.
2. `blog.html`:
   - JSON-LD `blogPost` array — prepend the new entry (newest first).
   - Hero "Naujausias" section — only if this article is the newest overall.
   - `post-index` list — prepend a new `post-row`, then renumber every
     `pr-num` (`/01`, `/02`, …) so the newest is `/01`.
   - Article/section counts — update `"N straipsniai"` (sub-hero-tags) and
     `"N tekstai"` (section right label) to the new total.
   - Footer "Blogas" column — keep only the 2 newest articles linked.
3. `index.html`:
   - `#blog` section `post-card` links — keep only the 3 newest articles.
   - Footer "Blogas" column — keep only the 2 newest articles linked.
4. `sitemap.xml` — add a `<url>` entry per new article with today's date
   as `lastmod`.

Before writing new articles, read the titles of existing files in `blog/`
so topics don't repeat.

## Keyword demand comes first (learned the hard way)

In August 2026 the site had 53 articles and, over 7 days, 8 clicks from
57 impressions. Only 7 of the 53 articles had any impressions at all, and
**not one of the top Search Console queries matched any article's primary
keyword**. The articles were chosen by "what haven't we covered yet" and
by keeping the four categories balanced. Category balance is an internal
tidiness metric with no relationship to search demand — optimising for it
produced 53 pages nobody was looking for.

What Search Console actually showed people search for:
`naujienlaiškiai`, `naujienlaiškių kūrimas`, `naujienlaiškių marketingas`,
`naujienlaiškių siuntimo programa` — all commercial, all sitting at
positions 18–96.

Rules that follow from this:

- **Never invent a keyword.** Before writing, the topic's phrasing must be
  evidenced: a query already appearing in Search Console, a Google
  autocomplete/"people also ask" result, or a term used by ranking
  Lithuanian competitors. "It's a good email marketing topic" is not
  evidence.
- **Search Console is the keyword research.** Queries the site already
  gets impressions for — especially at positions 15–100 — are the cheapest
  wins, because Google already considers the site partly relevant.
- **Commercial pages outrank blog volume.** `/paslaugos/*`,
  `/klaviyo-agentura`, `/omnisend-agentura` and comparison pages carry the
  queries that bring customers. A service page must never be thinner or
  less optimised than a blog post — that was the case here and it was
  backwards.
- **Do not balance categories.** Pick the topic with demand; let the
  category fall where it falls.
- **Publishing velocity is a ranking factor in practice.** ~40 articles in
  5 days on a young domain matches Google's "scaled content abuse" pattern
  and correlated with 46 of 53 articles never being shown. Cap new
  articles at roughly **2 per week** unless there is a specific reason.
- **Without backlinks, on-page work has a ceiling.** A new domain will not
  rank for head terms no matter how many articles exist. Say this plainly
  rather than writing more articles.

## SEO requirements (every article, non-negotiable)

Every article is written to rank in Lithuanian search, not just to fill the
blog. If the `searchfit-seo` skill is available in the session, invoke it
and follow it — it takes precedence over this list. If it is not available,
this checklist is the fallback and must be followed in full.

- **One primary keyword per article**, in Lithuanian, matching real search
  intent (e.g. `el. pašto automatizacijos`, `naujienlaiškio šablonas`).
  It must appear in: the `<title>`, the `<h1>`, the first 100 words, at
  least one `<h2>`, the meta description, and the slug. Never repeat it
  past the point where the sentence stops reading naturally — keyword
  stuffing is worse than omitting it.
- **2–4 secondary/long-tail keywords** woven into `<h2>`s and body copy,
  and listed in `<meta name="keywords">` and JSON-LD `keywords`.
- **`<title>`**: ≤ 60 characters including the ` | NOCK Mail` suffix, with
  the primary keyword near the front.
- **Meta description**: 140–160 characters, contains the primary keyword
  and one concrete reason to click (a number, an outcome). Not a summary.
- **Slug**: short, keyword-bearing, no stopwords — `welcome-serija`, not
  `kodel-verta-turėti-welcome-serija-2026`.
- **Heading hierarchy**: exactly one `<h1>`; sections are `<h2>` with
  `id` + `data-toc` (feeds the sidebar TOC); sub-points `<h3>`. Never skip
  a level, never use a heading purely for styling.
- **Length**: 1 200–1 800 words of real substance. Below ~1 000 the page
  competes badly; padding to reach a number is worse than a shorter piece.
- **Internal links**: 3–5 contextual links per article — at least 2 to
  other `/blog/*` posts and 1 to a service page (`/paslaugos/*`,
  `/klaviyo-agentura`, `/omnisend-agentura`, `/skaiciuokle`). Anchor text
  must be descriptive (`kodėl laiškai keliauja į SPAM`), never `čia` or
  `skaitykite daugiau`.
- **Structured data**: keep the full `@graph` — `BlogPosting` (with an
  accurate `wordCount`, `datePublished`, `dateModified`, `keywords`,
  `mainEntityOfPage`), `BreadcrumbList`, and `FAQPage`. The `FAQPage`
  questions must match the visible DUK section word for word, or Google
  treats it as mismatched markup.
- **DUK section**: 3–4 questions phrased the way people actually search
  ("Kiek kainuoja…", "Ar verta…", "Kaip dažnai…"), each answered in
  40–80 words in the visible HTML.
- **Canonical, OG, Twitter, JSON-LD URLs** must all point at the same
  `https://nockmail.lt/blog/<slug>` — a mismatch here silently kills the
  page in the index.
- **Accessibility affects ranking**: descriptive `alt` on any image, real
  `<ul>`/`<table>` markup instead of visually faked lists.
- **`sitemap.xml`**: new `<url>` per article, plus bump `<lastmod>` on
  `/blog` and `/` since their content changed.

## Fact-checking (mandatory before publishing)

The site's credibility is the product. Nothing goes live unverified.

- **Every external statistic, benchmark, or percentage** must be checked
  with a web search against a named, reputable source (platform docs,
  Litmus, Klaviyo/Omnisend/Shopify benchmark reports, Baymard, DMA/Litmus
  studies) published within roughly the last 24 months. Prefer the primary
  source over a blog quoting it.
- **If a number cannot be verified, it does not get published.** Either
  drop it, or reframe it honestly as the agency's own observation
  ("mūsų valdomose paskyrose matome…") — which is how the existing
  articles already phrase their in-house figures. Never present an
  in-house estimate as an industry statistic, and never invent a source.
- **Platform-specific claims** (Klaviyo/Omnisend features, pricing tiers,
  limits, flow capabilities) must be verified against current official
  documentation at the time of writing — these change often, and a stale
  claim is the most damaging kind on an agency site.
- **Legal/compliance claims** (GDPR, opt-in rules, Lithuanian regulation)
  must be conservative and verified; when in doubt, describe practice
  rather than assert a legal requirement.
- **Deliverability rules** (Gmail/Yahoo bulk-sender requirements, SPF /
  DKIM / DMARC, complaint-rate thresholds) must be re-verified every time
  they are mentioned — these changed materially in 2024 and keep moving.
- Round numbers honestly. A verified "roughly 70 %" stays "apie 70 %";
  don't sharpen it to "69,8 %" for the appearance of precision.

## Daily article automation — STOPPED (2026-08-04)

The routine that published 3 articles every morning at 07:00 Europe/Vilnius
(`trig_01Ro128KLhj8vuPfHCXQRs8F`) is **disabled**. It was stopped after the
Search Console review described in "Keyword demand comes first": it was
working exactly as specified and still produced 53 pages with almost no
search demand behind them.

Do not re-enable it as it was. If daily publishing is wanted again, the
prompt must first be changed to:

1. Read Search Console data (or be given it) and pick topics only from
   queries with evidenced demand — never from a self-generated topic list.
2. Publish at most 2 articles per week, not 3 per day.
3. Check whether the target query is already covered by an existing
   article and improve that article instead of adding a new one.

Everything else in this file still applies: the SEO requirements and the
fact-checking rules are unchanged and are not what went wrong.

## Site-wide technical notes

- `vercel.json` holds a **301 redirect from `www.nockmail.lt` to the apex
  domain**. Before it was added, every page existed on both hostnames and
  split its own signals. Do not remove it.
- `.vercelignore` excludes `Nock Agency.html` and `Nock Agency v1.html` —
  old homepage drafts that were being served at `/Nock Agency` and
  `/Nock Agency v1`, returning 200 with no canonical and duplicating the
  homepage. They stay in the repo for design history but must never be
  deployed.
- `styles.css` has `.prose .table-wrap` + `.prose table` styles for
  comparison tables in articles. Tables must always be wrapped in
  `<div class="table-wrap">` so they scroll inside their own container
  instead of making the page scroll sideways.
- Google Search Console: submitting `sitemap.xml` is the site owner's task
  and, as of 2026-08-04, has not been done. Discovery is the bottleneck,
  not the sitemap file itself — it is valid and reachable.

## Old automation prompt (kept for reference)

A scheduled Routine fires a fresh Claude Code session once a day
(07:00 Europe/Vilnius) with instructions to write and publish 3 new blog
articles about email marketing for e-commerce, following the conventions
above, then commit and push **directly to `main`** (no PR/review step —
this was an explicit choice by the site owner for full autonomous
publishing of this routine only). Every other kind of change to this repo
should NOT assume that same auto-push license — ask first unless told
otherwise.

The routine runs on Opus and is required to (a) use the `searchfit-seo`
skill when it is available in the session, (b) follow the SEO requirements
section above regardless, and (c) fact-check every external claim before
publishing, per the fact-checking section above. Publishing an unverified
statistic is treated as a failed run, not a minor issue.
