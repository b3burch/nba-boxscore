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
import type { DailyLeader, DailySnapshot } from "@/lib/types/snapshot";
import type {
  BoxScoreGame,
  CdnScheduleResponse,
  ScheduleGame,
} from "@/lib/nba/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

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

function topN(rows: DailyLeader[], n: number): DailyLeader[] {
  return [...rows].sort((a, b) => b.value - a.value).slice(0, n);
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const errors: string[] = [];
  const now = new Date();
  const dateEt = todayEt(now);
  const ydayEt = yesterdayEt(now);

  let schedule: CdnScheduleResponse;
  try {
    schedule = await getSeasonSchedule();
  } catch (e) {
    return NextResponse.json(
      { error: "schedule fetch failed", detail: String(e) },
      { status: 502 }
    );
  }

  await sleep(500);

  let todayGames: ScheduleGame[] = [];
  try {
    const sb = await getTodaysScoreboard();
    todayGames = sb.scoreboard.gameDate === dateEt
      ? (sb.scoreboard.games as unknown as ScheduleGame[])
      : findGamesOnDate(schedule, dateEt);
  } catch (e) {
    errors.push(`today scoreboard: ${String(e)}`);
    todayGames = findGamesOnDate(schedule, dateEt);
  }

  const yesterdayScheduleGames = findGamesOnDate(schedule, ydayEt).filter(
    (g) => g.gameStatus === 3
  );

  const yesterdayGames: BoxScoreGame[] = [];
  for (const g of yesterdayScheduleGames) {
    await sleep(1100);
    try {
      const bs = await getBoxScore(g.gameId);
      yesterdayGames.push(bs.game);
    } catch (e) {
      errors.push(`boxscore ${g.gameId}: ${String(e)}`);
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

  const standings = computeStandings(schedule, "regular");

  const snap: DailySnapshot = {
    generatedAt: now.toISOString(),
    dateEt,
    yesterdayEt: ydayEt,
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

  try {
    await writeSnapshot(snap);
  } catch (e) {
    return NextResponse.json(
      { error: "snapshot write failed", detail: String(e) },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    mode: process.env.BLOB_READ_WRITE_TOKEN ? "blob" : "local",
    dateEt,
    yesterdayGames: yesterdayGames.length,
    todayGames: todayGames.length,
    standings: standings.length,
    errors,
  });
}

export async function POST(req: NextRequest) {
  return GET(req);
}
