import { fetchJson } from "./client";
import type {
  CdnBoxScoreResponse,
  CdnScheduleResponse,
  CdnScoreboardResponse,
} from "./types";

const CDN = "https://cdn.nba.com/static/json";

export function getTodaysScoreboard() {
  return fetchJson<CdnScoreboardResponse>(
    `${CDN}/liveData/scoreboard/todaysScoreboard_00.json`
  );
}

export function getSeasonSchedule() {
  return fetchJson<CdnScheduleResponse>(
    `${CDN}/staticData/scheduleLeagueV2.json`
  );
}

export function getBoxScore(gameId: string) {
  return fetchJson<CdnBoxScoreResponse>(
    `${CDN}/liveData/boxscore/boxscore_${gameId}.json`
  );
}

export function decodeSeasonType(gameId: string): SeasonType {
  const prefix = gameId.slice(0, 3);
  switch (prefix) {
    case "001":
      return "preseason";
    case "002":
      return "regular";
    case "003":
      return "allstar";
    case "004":
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
