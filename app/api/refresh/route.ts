import { NextRequest, NextResponse } from "next/server";
import {
  getBoxScore,
  getSeasonSchedule,
  getTodaysScoreboard,
} from "@/lib/nba/endpoints";
import { computeStandings } from "@/lib/nba/standings";
import {
  currentSeasonString,
  isOffSeason,
  scheduleKey,
  todayEt,
  yesterdayEt,
} from "@/lib/nba/season";
import { writeSnapshot } from "@/lib/storage/blob";
import { ALL_LEAGUES, type League } from "@/lib/nba/leagues";
import type { DailyLeader, DailySnapshot } from "@/lib/types/snapshot";
import type {
  BoxScoreGame,
  CdnScheduleResponse,
  ScheduleGame,
} from "@/lib/nba/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 90;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return process.env.NODE_ENV !== "production";
  const header = req.headers.get("authorization");
  return header === `Bearer ${secret}`;
}

function findGamesOnDate(
  schedule: CdnScheduleResponse,
  dateYmd: string
): ScheduleGame[] {
  const key = scheduleKey(dateYmd);
  for (const d of schedule.leagueSchedule.gameDates) {
    if (d.gameDate === key) return d.games;
  }
  return [];
}

function isConditionalPlaceholder(g: {
  ifNecessary?: boolean;
  gameStatusText?: string;
  gameStatus?: number;
}): boolean {
  if (!g.ifNecessary) return false;
  if (g.gameStatus === 3) return false;
  return (g.gameStatusText ?? "").toUpperCase() === "TBD";
}

function topN(rows: DailyLeader[], n: number): DailyLeader[] {
  return [...rows].sort((a, b) => b.value - a.value).slice(0, n);
}

async function buildLeagueSnapshot(
  league: League,
  now: Date
): Promise<{ snap: DailySnapshot; errors: string[] }> {
  const errors: string[] = [];
  const dateEt = todayEt(now);
  const ydayEt = yesterdayEt(now);

  const schedule = await getSeasonSchedule(league);
  await sleep(500);

  // Pull the live scoreboard. It tracks NBA's current active game day, which is
  // today during the day/evening but can still be *yesterday* in the small hours
  // (NBA doesn't roll the slate over until well after the last game ends). Read
  // completions straight from it so late games that finish after midnight ET show
  // up immediately, instead of waiting on the static schedule file to update.
  let scoreboardDate = "";
  let scoreboardGames: ScheduleGame[] = [];
  let scoreboardCompletedIds: string[] = [];
  try {
    const sb = await getTodaysScoreboard(league);
    scoreboardDate = sb.scoreboard.gameDate;
    scoreboardGames = sb.scoreboard.games as unknown as ScheduleGame[];
    scoreboardCompletedIds = scoreboardGames
      .filter((g) => g.gameStatus === 3 && !isConditionalPlaceholder(g))
      .map((g) => g.gameId);
  } catch (e) {
    errors.push(`${league} today scoreboard: ${String(e)}`);
  }

  // Today's slate for the sidebar (live if the scoreboard is on today, else schedule).
  let todayGames: ScheduleGame[] =
    scoreboardDate === dateEt ? scoreboardGames : findGamesOnDate(schedule, dateEt);
  todayGames = todayGames.filter((g) => !isConditionalPlaceholder(g));

  // Coverage slate = the most recent slate that has at least one final game.
  // Prefer the live scoreboard's day whenever it has a completion (covers both
  // today's in-progress slate and last night's late finishers), otherwise fall
  // back to yesterday's schedule. The newspaper therefore shows yesterday until
  // the first game of the current slate goes final, then flips and grows from there.
  let coverageDate: string;
  let coverageGameIds: string[];
  if (scoreboardCompletedIds.length > 0) {
    coverageDate = scoreboardDate;
    coverageGameIds = scoreboardCompletedIds;
  } else {
    coverageDate = ydayEt;
    coverageGameIds = findGamesOnDate(schedule, ydayEt)
      .filter((g) => g.gameStatus === 3 && !isConditionalPlaceholder(g))
      .map((g) => g.gameId);
  }

  const yesterdayGames: BoxScoreGame[] = [];
  for (const gameId of coverageGameIds) {
    await sleep(1100);
    try {
      const bs = await getBoxScore(gameId, league);
      yesterdayGames.push(bs.game);
    } catch (e) {
      errors.push(`${league} boxscore ${gameId}: ${String(e)}`);
    }
  }

  const points: DailyLeader[] = [];
  const rebounds: DailyLeader[] = [];
  const assists: DailyLeader[] = [];
  for (const game of yesterdayGames) {
    for (const team of [game.homeTeam, game.awayTeam]) {
      for (const p of team.players) {
        if (p.played !== "1") continue;
        const base = {
          personId: p.personId,
          name: p.name,
          team: team.teamTricode,
        };
        points.push({ ...base, value: p.statistics.points });
        rebounds.push({ ...base, value: p.statistics.reboundsTotal });
        assists.push({ ...base, value: p.statistics.assists });
      }
    }
  }

  const standings = computeStandings(schedule, league, "regular");

  const snap: DailySnapshot = {
    league,
    generatedAt: now.toISOString(),
    dateEt,
    yesterdayEt: coverageDate,
    isOffSeason: isOffSeason(now),
    seasonString: currentSeasonString(now),
    standings,
    yesterdayGames,
    todayGames,
    dailyLeaders: {
      points: topN(points, 5),
      rebounds: topN(rebounds, 5),
      assists: topN(assists, 5),
    },
    errors,
  };
  return { snap, errors };
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const results: Array<{
    league: League;
    status: "ok" | "failed";
    yesterdayGames?: number;
    todayGames?: number;
    standings?: number;
    errors?: string[];
    detail?: string;
  }> = [];

  for (const league of ALL_LEAGUES) {
    try {
      const { snap } = await buildLeagueSnapshot(league, now);
      await writeSnapshot(snap);
      results.push({
        league,
        status: "ok",
        yesterdayGames: snap.yesterdayGames.length,
        todayGames: snap.todayGames.length,
        standings: snap.standings.length,
        errors: snap.errors,
      });
    } catch (e) {
      results.push({ league, status: "failed", detail: String(e) });
    }
  }

  const anyFailed = results.some((r) => r.status === "failed");
  return NextResponse.json(
    {
      ok: !anyFailed,
      mode: process.env.BLOB_READ_WRITE_TOKEN ? "blob" : "local",
      results,
    },
    { status: anyFailed ? 207 : 200 }
  );
}

export async function POST(req: NextRequest) {
  return GET(req);
}
