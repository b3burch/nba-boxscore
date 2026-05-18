# The Daily Box — Ideas & Roadmap

Living doc. Anything we want to add but haven't built yet goes here, slotted into a phase. Move items up to **Now** when we're actively working on them, and down to **Shipped** once they're live in production.

## How to add an idea

1. Drop it under the right phase below as a one-liner.
2. If it's bigger than a sentence, add a short note (one or two lines on what + why).
3. No commitment to building — this is a holding tank.

---

## Now (Phase 1 — MVP, in flight)

- [x] Daily box scores in NBA Game Book layout
- [x] Yesterday's results with anchor links to each box
- [x] Yesterday's PTS / REB / AST leaders (top 5 each)
- [x] Today's slate
- [x] Conference standings derived from `scheduleLeagueV2.json`
- [x] Vercel Cron daily refresh + Blob snapshot storage
- [x] Mobile-responsive gamebook tables (sticky player col, horizontal scroll)
- [ ] Custom domain (optional — defaults to `*.vercel.app`)

## Phase 2 — Reach + Polish

- [ ] **Email digest.** Daily morning email. Resend or Buttondown free tier. Same content as the web page.
- [ ] **Subscribe form** on the site. Minimal — just an email field, double opt-in.
- [ ] **Dated archive pages.** `/2026-05-15` etc. Snapshots are already written with dates, just need a route.
- [ ] **Season leaders sidebar.** PTS / REB / AST / STL / BLK / shooting % season averages. Computed from running aggregate of every box score we've snapshotted.
- [ ] **Streak + L10 polish in standings.** Already there but worth double-checking against nba.com.
- [ ] **Game series context.** For playoff games, show series state ("Lakers lead 2-1") above the box.
- [ ] **DNP / Inactive list** below each box. Currently DNPs are shown inline; could move to a separate "Inactive" line.
- [ ] **OG image per day.** Auto-generated social share card with the day's headline games.
- [ ] **Light/dark toggle.** Currently follows system. Worth exposing.

## Phase 3 — Coverage Expansion

- [ ] **Playoff bracket viz.** Auto-rendered from `scheduleLeagueV2.json` `seriesText` fields.
- [ ] **Transactions + injury report.** Daily roll-up.
- [ ] **Advanced stats** per game (TS%, USG%, eFG%). Computable from the box totals we already have.
- [ ] **Quarter-by-quarter team stats** (pace, FG% per Q).
- [ ] **Plus/minus heatmap** showing on-court combinations.
- [ ] **Lineup data** (5-man combinations + minutes).
- [ ] **G League / Summer League.** Lower priority but easy now that the multi-league plumbing is in.

## Phase 4 — Editorial

- [ ] **Auto-generated game recaps.** One paragraph per game pulled from key stat moments. Run nightly with an LLM.
- [ ] **"On this day in NBA history."** Optional sidebar.
- [ ] **Daily one-line editorial blurb** at the top — "What to watch tonight" generated from the slate + storylines.
- [ ] **Player spotlight** — when a player has a career-high, flag it.

## Phase 5 — Community / Engagement

- [ ] **Twitter/X account that posts each box score as its own tweet.** This is the growth model the baseball version (boxscore.email) used — see https://x.com/boxscoreemail for the pattern. Each game's final box score gets posted (probably as a single image with the gamebook layout rendered to PNG, since X kills text formatting). A daily kickoff tweet links to the web page; each game tweets independently as it finalizes. Big upside: organic discovery during games, retweets from team fan accounts, free distribution.
  - Sub-items once we build it: render-to-PNG of the BoxScore component (Vercel OG image or Puppeteer), X API v2 auth + posting, queue logic so we don't tweet a half-finished game, alt-text generation for accessibility.
- [ ] **RSS feed.**
- [ ] **iCal feed** of today's games.
- [ ] **Push notifications** when your favorited team's box is posted (PWA).
- [ ] **User accounts + favorited teams/players.**
- [ ] **Comments / discussion** per game (probably never — high moderation cost).

## Parking Lot (not sure if/when)

- [ ] Betting lines / odds overlay
- [ ] Fantasy points column in box (need scoring rules picker)
- [ ] Historical comparisons ("Castle's 32 is the most by a rookie in a playoff game since…")
- [ ] Mobile app (PWA likely sufficient)
- [ ] Multi-language support
- [ ] Highlight video links (NBA blocks embeds, would need workaround)

## Shipped

*Move things here once they're live in production. Keep this brief — date + one line.*

- **2026-05-18** — WNBA as a second tab. Same gamebook layout, conference standings (no divisions), `cdn.wnba.com` data, shared daily refresh.

---

## Domain shortlist (priced 2026-05-16)

We're currently on `dailystats-nba.vercel.app`. Real domain candidates that are available right now:

| Domain | Price/yr | Why |
|---|---|---|
| `thedailybox.email` | $9.99 | Matches our masthead exactly; `.email` echoes boxscore.email lineage. **Top pick.** |
| `gamebook.email` | $9.99 | References the NBA Game Book PDF format the layout mimics. Strong concept domain. |
| `nbabox.email` | $9.99 | Shortest NBA-specific option. |
| `dailybox.email` | $9.99 | Clean but loses the NBA angle. |
| `nbagamebook.com` | $11.25 | Descriptive `.com`, on-brand with the PDF reference. |
| `dailyhardwood.com` | $11.25 | Basketball-coded ("hardwood" = court). Slightly insider. |
| `statline.email` | $9.99 | Stats-forward framing. |
| `finalbuzzer.email` | $9.99 | Temporal/post-game framing. Cute but less clear product. |

Taken (so we don't keep searching): `thedailybox.com`, `dailybox.com`, `nbabox.com`, `nbaboxscore.com`, `nbaboxscores.com`, `hardwoodbox.com`, `boxscoredaily.com`, `thebox.email`, `nightlybox.com`, `morningbox.com`, `recapnba.com`, `dailyhoops.com`.

Purchase any of these via Vercel directly (`vercel domains buy <name>`) — no GoDaddy roundtrip needed, DNS auto-configures since we're already deployed there.

---

## Operating notes

- **Data source:** cdn.nba.com (Akamai-cached, S3-backed). Two endpoints do everything: `scheduleLeagueV2.json` (master schedule) + `liveData/boxscore/boxscore_{gameId}.json` (per-game box).
- **Standings** are computed from the schedule — no separate endpoint needed. Saves us a dependency on stats.nba.com (which is unreachable from many networks).
- **Season leaders** require aggregating box scores across the season. Phase 2 work — needs a running totals store.
- **Cost target:** $0. Vercel Hobby, Blob free tier (1GB), Cron free tier (1 job/day fine).
