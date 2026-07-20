# Session handoff — built 20 Jul 2026

State of the project as of the end of the build session. Read `CLAUDE.md` first for architecture; this file is the narrative.

## What exists and is verified working

1. **Site live** at https://www.jaikharbanda.xyz — DNS on Cloudflare (4 apex A records to GitHub Pages + `www` CNAME, DNS-only), HTTPS enforced, apex 301s to www. Old jaikharbanda.netlify.app 301s here too.
2. **Content pipeline**: Notion → GitHub Actions sync → build → Pages. Tested end-to-end 20 Jul (6 case studies, 11 copy strings, 3 sections pulled in CI). Daily rebuild 06:17 UTC.
3. **Analytics**: GoatCounter account live, beacon delivery verified. A single `analytics-test` event in the stats is from testing; ignore it.
4. **Case study facts** verified against Notion/Slack/Gmail/Calendar primary sources; corrections applied (12–16% acceptance, March date, Amazon title, weekly calibration).

## Decisions made (and why)

- Astro static + GitHub Pages over Netlify/Framer: free, repo-as-proof, Jai already ships GitHub Pages hubs.
- Dark-first single theme, Space Grotesk + amber: direction from Boom's brand guide without copying it (their font is Noi Grotesk, their accent violet — deliberately avoided).
- "100+ campaigns" kept on the site although the true figure is 371 (131 UK-relevant): conservative by choice, exposes less about the employer's ops.
- Get in touch: one email + cal.com/jaikharbanda/30min + socials.

## Pending / known items

- GoatCounter dashboard: log in at goatcounter.com; useful signals are Substack clicks and the track-gtm vs track-ai split, not raw pageviews.
- The temporary Cloudflare DNS token (Keychain item `cf-dns-token`) should be revoked in the Cloudflare dashboard and deleted (`security delete-generic-password -s cf-dns-token`) if not already done.
- No headshot/event photos on the site yet; the Women in Tech UK LinkedIn post was identified as a usable public photo source (rights unconfirmed).
- Employer-boundary check (naming WIT UK / Patch / Amazon role) was assumed OK but never explicitly confirmed with Turing College.
- Substack engagement is near-zero; site's job is to funnel there. Revisit featured work quarterly.

## Continuing on another Mac

- The repo lives in iCloud (`Claude Code/jaikharbanda-xyz`) and on GitHub. Claude config/memory sync via the `~/.claude → iCloud claude-config` symlink; recreate it on the other Mac if missing:
  `ln -s "$HOME/Library/Mobile Documents/com~apple~CloudDocs/Essentials/Claude Code/claude-config" ~/.claude`
- First run on a fresh machine: `mkdir -p node_modules.nosync && npm install`. Pushing needs `gh auth login` (deploys happen in CI, so only git push access is required).
