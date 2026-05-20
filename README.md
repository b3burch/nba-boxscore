# The Daily Box — NBA

An NBA box-score newspaper that rolls over as games end, not on a calendar boundary. Renders the **current slate** (yesterday by default, today once today's first game has gone final) in the NBA Game Book layout, plus standings, daily leaders, and today's slate. Inspired by [boxscore.email/mlb](https://boxscore.email/mlb).

Built with Next.js 16 (App Router) + TypeScript, hosted on Vercel free tier. Refresh is driven by GitHub Actions during NBA game hours (every 5 min) plus a Vercel Cron backstop daily. Snapshot stored in Vercel Blob.

## How it works

1. **Refresh trigger**: GitHub Actions hits `/api/refresh` every 5 minutes from ~6pm ET through ~3am ET (see `.github/workflows/refresh.yml`). A daily Vercel Cron at 09:00 UTC also fires as a backstop.
2. The route fetches from `cdn.nba.com`:
   - `staticData/scheduleLeagueV2.json` — full season schedule (drives standings + today/yesterday slates)
   - `liveData/scoreboard/todaysScoreboard_00.json` — live status, used to detect completions
   - `liveData/boxscore/boxscore_{gameId}.json` — for each completed game in the coverage slate
3. **Coverage slate** = today if any of today's games has `gameStatus === 3` (Final), otherwise yesterday. This is the flip that "starts a new day" the moment the first game of the night ends.
4. It assembles a `DailySnapshot` and writes it to Vercel Blob (`snapshots/latest.json` + dated copy).
5. The home page (`/`) is a server component that reads `latest.json` and renders.

If a refresh fails partway, the previous snapshot keeps serving.

The `yesterdayGames` / `yesterdayEt` snapshot fields are kept for compatibility but now mean "coverage slate" rather than literally yesterday.

## Local dev

```bash
npm install
npm run dev
# in another terminal:
curl http://localhost:3000/api/refresh
# then open http://localhost:3000/
```

Without `BLOB_READ_WRITE_TOKEN` set, the refresh route writes to `.snapshots/latest.json` locally instead of Vercel Blob. The page reads from the same fallback location.

## Deploying to Vercel

1. **Push to GitHub** (already done if you're reading this from `github.com/b3burch/nba-boxscore`).
2. **Import the repo into Vercel** (vercel.com/new).
3. **Add a Blob store** to the project: Vercel dashboard → Storage → Create → Blob. Vercel auto-injects `BLOB_READ_WRITE_TOKEN`.
4. **Set `CRON_SECRET`** in Project Settings → Environment Variables. Generate a long random string — this prevents anyone but Vercel Cron from hitting `/api/refresh`. (Vercel Cron automatically sends `Authorization: Bearer ${CRON_SECRET}` if the env var is set.)
5. **Deploy.** First deploy creates the cron job from `vercel.json`.
6. **Manually trigger the first refresh:** Vercel dashboard → Cron Jobs → Run. Confirm the snapshot writes to Blob.
7. **Load the deployed URL** to confirm everything renders.

## Wiring up the 5-minute refresh

Vercel Hobby caps Vercel Cron at one daily run, so the in-game cadence is driven by GitHub Actions instead.

1. In GitHub: Repo → Settings → Secrets and variables → Actions.
2. **Variable** `DEPLOYMENT_URL` = the Vercel URL (e.g. `https://nba-boxscore.vercel.app` or the custom domain). No trailing slash.
3. **Secret** `CRON_SECRET` = same value you set in Vercel env vars.
4. Workflow `.github/workflows/refresh.yml` runs `*/5` UTC from 22:00–07:59 (NBA evening through end of West-coast OTs). You can also fire it on demand via Actions → Refresh box scores → Run workflow.

Note: GitHub Actions scheduled runs are best-effort and can lag by a few minutes under load; typical latency from "game goes final" → "page reflects it" is 3–8 minutes.

## Project layout

```
app/
  layout.tsx, page.tsx
  api/refresh/route.ts       — refresh orchestration (Node runtime)
  globals.css                — newspaper + gamebook styles
components/
  Headline.tsx               — masthead + date
  Standings.tsx              — East/West by division
  YesterdayResults.tsx       — score list with anchors
  DailyLeaders.tsx           — PTS / REB / AST top 5
  BoxScore.tsx               — gamebook layout per game (the hardest one)
  TodayGames.tsx             — schedule
  OffSeasonNotice.tsx        — fallback when no games
lib/
  nba/
    client.ts                — fetch wrapper, browser headers, retry/backoff
    endpoints.ts             — typed cdn.nba.com wrappers
    types.ts                 — response shapes
    parse.ts                 — minutes formatting, totals
    season.ts                — ET date math, off-season detection
    standings.ts             — compute from schedule
  storage/
    blob.ts                  — Vercel Blob + local fallback
  types/
    snapshot.ts              — DailySnapshot shape
docs/
  IDEAS.md                   — phased roadmap
vercel.json                  — cron schedule
```

## Roadmap

See [`docs/IDEAS.md`](docs/IDEAS.md). Phase 1 (this) is the MVP. Phase 2 adds the email digest, archive pages, and season leaders.
