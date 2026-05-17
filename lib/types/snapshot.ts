import type { BoxScoreGame, ScheduleGame } from "../nba/types";
import type { StandingRow } from "../nba/standings";
import type { League } from "../nba/leagues";

export interface DailyLeader {
  personId: number;
  name: string;
  team: string;
  value: number;
}

export interface DailySnapshot {
  league: League;
  generatedAt: string;
  dateEt: string;
  yesterdayEt: string;
  isOffSeason: boolean;
  seasonString: string;
  standings: StandingRow[];
  yesterdayGames: BoxScoreGame[];
  todayGames: ScheduleGame[];
  dailyLeaders: {
    points: DailyLeader[];
    rebounds: DailyLeader[];
    assists: DailyLeader[];
  };
  seasonLeaders?: SeasonLeaders;
  errors: string[];
}

export interface SeasonLeaders {
  source: string;
  asOf: string;
  points: DailyLeader[];
  rebounds: DailyLeader[];
  assists: DailyLeader[];
  steals: DailyLeader[];
  blocks: DailyLeader[];
}
