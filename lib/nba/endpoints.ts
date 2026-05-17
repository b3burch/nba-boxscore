import { fetchJson } from "./client";
import { LEAGUES, type League } from "./leagues";
import type {
  CdnBoxScoreResponse,
  CdnScheduleResponse,
  CdnScoreboardResponse,
} from "./types";

export function getTodaysScoreboard(league: League) {
  const cfg = LEAGUES[league];
  return fetchJson<CdnScoreboardResponse>(
    `${cfg.cdnHost}/static/json/liveData/scoreboard/todaysScoreboard_${cfg.scoreboardSuffix}.json`,
    cfg.referer
  );
}

export function getSeasonSchedule(league: League) {
  const cfg = LEAGUES[league];
  return fetchJson<CdnScheduleResponse>(
    `${cfg.cdnHost}/static/json/staticData/scheduleLeagueV2.json`,
    cfg.referer
  );
}

export function getBoxScore(gameId: string, league: League) {
  const cfg = LEAGUES[league];
  return fetchJson<CdnBoxScoreResponse>(
    `${cfg.cdnHost}/static/json/liveData/boxscore/boxscore_${gameId}.json`,
    cfg.referer
  );
}

export function decodeSeasonType(gameId: string): SeasonType {
  const prefix = gameId.slice(0, 3);
  switch (prefix) {
    case "001":
    case "101":
      return "preseason";
    case "002":
    case "102":
      return "regular";
    case "003":
      return "allstar";
    case "004":
    case "104":
      return "playoffs";
    case "005":
      return "playin";
    case "006":
      return "ist";
    default:
      return "unknown";
  }
}

export type SeasonType =
  | "preseason"
  | "regular"
  | "allstar"
  | "playoffs"
  | "playin"
  | "ist"
  | "unknown";
