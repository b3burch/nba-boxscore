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

  // Pull live scoreboard so we can detect completions in real time.
  let todayGames: ScheduleGame[] = [];
  let todayCompletedIds: string[] = [];
  try {
    const sb = await getTodaysScoreboard(league);
    if (sb.scoreboard.gameDate === dateEt) {
      todayGames = sb.scoreboard.games as unknown as ScheduleGame[];
      todayCompletedIds = todayGames
        .filter((g) => g.gameStatus === 3 && !isConditionalPlaceholder(g))
        .map((g) => g.gameId);
    } else {
      todayGames = findGamesOnDate(schedule, dateEt);
    }
  } catch (e) {
    errors.push(`${league} today scoreboard: ${String(e)}`);
    todayGames = findGamesOnDate(schedule, dateEt);
  }
  todayGames = todayGames.filter((g) => !isConditionalPlaceholder(g));

  // Coverage slate: today once any of today's games has gone final, else yesterday.
  // This flips the newspaper forward as soon as the first game of the night ends.
  let coverageDate: string;
  let coverageGameIds: string[];
  if (todayCompletedIds.length > 0) {
    coverageDate = dateEt;
    coverageGameIds = todayCompletedIds;
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
