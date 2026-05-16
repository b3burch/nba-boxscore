export interface CdnScoreboardResponse {
  meta: { time: string; code: number };
  scoreboard: {
    gameDate: string;
    leagueId: string;
    games: ScoreboardGame[];
  };
}

export interface ScoreboardGame {
  gameId: string;
  gameCode: string;
  gameStatus: number;
  gameStatusText: string;
  period: number;
  gameClock: string;
  gameTimeUTC: string;
  gameEt: string;
  regulationPeriods: number;
  ifNecessary?: boolean;
  seriesGameNumber?: string;
  gameLabel?: string;
  gameSubLabel?: string;
  seriesText?: string;
  seriesConference?: string;
  poRoundDesc?: string;
  isNeutral?: boolean;
  homeTeam: ScoreboardTeam;
  awayTeam: ScoreboardTeam;
}

export interface ScoreboardTeam {
  teamId: number;
  teamName: string;
  teamCity: string;
  teamTricode: string;
  wins: number;
  losses: number;
  score: number;
  seed?: number;
  periods: { period: number; periodType: string; score: number }[];
}

export interface CdnScheduleResponse {
  meta: { time: string };
  leagueSchedule: {
    seasonYear: string;
    leagueId: string;
    gameDates: { gameDate: string; games: ScheduleGame[] }[];
  };
}

export interface ScheduleGame {
  gameId: string;
  gameCode: string;
  gameStatus: number;
  gameStatusText: string;
  gameDateTimeUTC: string;
  gameDateTimeEst: string;
  ifNecessary?: boolean;
  arenaName?: string;
  arenaCity?: string;
  arenaState?: string;
  gameLabel?: string;
  gameSubLabel?: string;
  seriesText?: string;
  homeTeam: ScheduleTeam;
  awayTeam: ScheduleTeam;
}

export interface ScheduleTeam {
  teamId: number;
  teamName: string;
  teamCity: string;
  teamTricode: string;
  teamSlug?: string;
  wins: number;
  losses: number;
  score: number;
  seed?: number;
}

export interface CdnBoxScoreResponse {
  meta: { time: string };
  game: BoxScoreGame;
}

export interface BoxScoreGame {
  gameId: string;
  gameTimeLocal: string;
  gameTimeUTC: string;
  gameTimeHome: string;
  gameTimeAway: string;
  gameStatus: number;
  gameStatusText: string;
  period: number;
  regulationPeriods: number;
  attendance?: number;
  sellout?: string;
  arena: {
    arenaId: number;
    arenaName: string;
    arenaCity: string;
    arenaState: string;
    arenaCountry: string;
    arenaTimezone: string;
  };
  officials: { name: string; nameI: string; familyName: string; firstName: string; jerseyNum: string; assignment: string; personId: number }[];
  homeTeam: BoxTeam;
  awayTeam: BoxTeam;
}

export interface BoxTeam {
  teamId: number;
  teamName: string;
  teamCity: string;
  teamTricode: string;
  score: number;
  inBonus?: string;
  timeoutsRemaining?: number;
  periods: { period: number; periodType: string; score: number }[];
  players: BoxPlayer[];
  statistics?: BoxTeamStatistics;
}

export interface BoxPlayer {
  status: string;
  order: number;
  personId: number;
  jerseyNum: string;
  position: string;
  starter: string;
  oncourt: string;
  played: string;
  notPlayingReason?: string;
  notPlayingDescription?: string;
  name: string;
  nameI: string;
  firstName: string;
  familyName: string;
  statistics: BoxPlayerStatistics;
}

export interface BoxPlayerStatistics {
  assists: number;
  blocks: number;
  blocksReceived: number;
  fieldGoalsAttempted: number;
  fieldGoalsMade: number;
  fieldGoalsPercentage: number;
  foulsOffensive: number;
  foulsDrawn: number;
  foulsPersonal: number;
  foulsTechnical: number;
  freeThrowsAttempted: number;
  freeThrowsMade: number;
  freeThrowsPercentage: number;
  minus: number;
  minutes: string;
  minutesCalculated: string;
  plus: number;
  plusMinusPoints: number;
  points: number;
  pointsFastBreak: number;
  pointsInThePaint: number;
  pointsSecondChance: number;
  reboundsDefensive: number;
  reboundsOffensive: number;
  reboundsTotal: number;
  steals: number;
  threePointersAttempted: number;
  threePointersMade: number;
  threePointersPercentage: number;
  turnovers: number;
}

export interface BoxTeamStatistics {
  [k: string]: number | string;
}
