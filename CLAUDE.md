# jaikharbanda.xyz

Jai's personal site. Live at https://www.jaikharbanda.xyz (GitHub Pages, repo `jaikharbanda/jaikharbanda-xyz`). Dual-track positioning: GTM systems + Applied AI & teaching, bridged by the mission "average person can become AI capable". Primary goal: audience growth into the Substack.

## Architecture

- Astro 5 static site. Pages in `src/pages/`, layout in `src/layouts/Base.astro`, styles in `src/styles/global.css` (dark-first: charcoal `#17151c`, amber accent `#f0a34e`, Space Grotesk headings via @fontsource).
- **Notion is the CMS.** `scripts/sync-notion.mjs` runs before each CI build and pulls:
  - Case studies DB → `src/content/work/*.md` (only Published rows; Featured rows go on the homepage)
  - Site copy DB → `src/data/copy.json`
  - Section pages (about / gtm-intro / ai-intro) → `src/content/sections/*.md`
  - IDs live in `site.notion.json`. Notion parent page: "Website — jaikharbanda.xyz" under Jai's Projects.
  - Fail-soft: no token or API error → committed content is used, build never breaks.
- Writing page pulls the Substack RSS (`src/lib/substack.js`) at build time.
- Deploy: `.github/workflows/deploy.yml` — on push, daily at 06:17 UTC (refreshes Notion + Substack content), or manual via Actions → Run workflow. Notion token is the Actions secret `NOTION_TOKEN_JAIKHARBANDA_PERSONAL_WEBSITE`.
- Analytics: GoatCounter (`jaikharbanda.goatcounter.com`), script in Base.astro. Events: substack, book-call, email, linkedin, github, track-gtm, track-ai.

## Working on it

- iCloud quirk: `node_modules` is a symlink to `node_modules.nosync` (keeps npm out of iCloud sync). On a fresh machine: `mkdir -p node_modules.nosync && npm install`.
- Local dev: `npm run dev` (or the `jaikharbanda-xyz` config in `.claude/launch.json`, port 4321).
- Build check: `npm run build` (13 pages; Substack fetch happens at build).
- Content edits should normally be made **in Notion**, not in `src/content/` — CI overwrites synced files on the next run. Direct file edits are only for structure/style/code.

## Rules

- Copy follows Jai's Style Guide (Notion page `c2cc7f0e-b998-4edc-b54e-f6accc4aced2`): British English, no em dashes, no emoji in site copy, short sentences, banned-word list. Voice check: would Jai say it out loud.
- Never name clients or prospects (KPMG, HSBC, VCCP, L&G, Monzo, Next Gate Tech, Smart Pension...). Anonymised metrics only, with a `note` footnote saying so.
- Public event partners OK to name: Women in Tech UK, Patch, Turing College, the Amazon fireside guest's role (not name).
- Facts in case studies were verified against primary sources on 20 Jul 2026 — don't inflate numbers when editing.
- Contact: jai.kharbanda@gmail.com and https://cal.com/jaikharbanda/30min.
