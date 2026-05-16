# The Daily Box — NBA

A once-a-day NBA box-score newspaper. Renders yesterday's games in the NBA Game Book layout, plus standings, daily leaders, and today's slate. Inspired by [boxscore.email/mlb](https://boxscore.email/mlb).

Built with Next.js 16 (App Router) + TypeScript, hosted on Vercel free tier, daily refresh via Vercel Cron, snapshot stored in Vercel Blob.

## How it works

1. **12:00 UTC daily** (5am AZ) Vercel Cron hits `/api/refresh`.
2. The route fetches from `cdn.nba.com`:
   - `staticData/scheduleLeagueV2.json` — full season schedule (drives standings + today/yesterday slates)
   - `liveData/boxscore/boxscore_{gameId}.json` — for each completed game yesterday
3. It assembles a `DailySnapshot` and writes it to Vercel Blob (`snapshots/latest.json` + dated copy).
4. The home page (`/`) is a server component that reads `latest.json` and renders.

If a refresh fails partway, the previous day's snapshot keeps serving.

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

## Project layout

```
app/
  layout.tsx, page.tsx
  api/refresh/route.ts       — daily orchestration (Node runtime)
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
