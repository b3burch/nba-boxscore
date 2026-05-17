import type { CdnScheduleResponse, ScheduleGame } from "./types";
import { LEAGUES, type League } from "./leagues";

export interface StandingRow {
  teamId: number;
  tricode: string;
  city: string;
  name: string;
  conference: "East" | "West";
  division: string;
  wins: number;
  losses: number;
  pct: number;
  gb: number | null;
  pf: number;
  pa: number;
  diff: number;
  homeW: number;
  homeL: number;
  awayW: number;
  awayL: number;
  last10W: number;
  last10L: number;
  streak: string;
}

const NBA_TEAM_META: Record<number, { conf: "East" | "West"; div: string }> = {
  1610612737: { conf: "East", div: "Southeast" }, // ATL
  1610612738: { conf: "East", div: "Atlantic" }, // BOS
  1610612751: { conf: "East", div: "Atlantic" }, // BKN
  1610612766: { conf: "East", div: "Southeast" }, // CHA
  1610612741: { conf: "East", div: "Central" }, // CHI
  1610612739: { conf: "East", div: "Central" }, // CLE
  1610612742: { conf: "West", div: "Southwest" }, // DAL
  1610612743: { conf: "West", div: "Northwest" }, // DEN
  1610612765: { conf: "East", div: "Central" }, // DET
  1610612744: { conf: "West", div: "Pacific" }, // GSW
  1610612745: { conf: "West", div: "Southwest" }, // HOU
  1610612754: { conf: "East", div: "Central" }, // IND
  1610612746: { conf: "West", div: "Pacific" }, // LAC
  1610612747: { conf: "West", div: "Pacific" }, // LAL
  1610612763: { conf: "West", div: "Southwest" }, // MEM
  1610612748: { conf: "East", div: "Southeast" }, // MIA
  1610612749: { conf: "East", div: "Central" }, // MIL
  1610612750: { conf: "West", div: "Northwest" }, // MIN
  1610612740: { conf: "West", div: "Southwest" }, // NOP
  1610612752: { conf: "East", div: "Atlantic" }, // NYK
  1610612760: { conf: "West", div: "Northwest" }, // OKC
  1610612753: { conf: "East", div: "Southeast" }, // ORL
  1610612755: { conf: "East", div: "Atlantic" }, // PHI
  1610612756: { conf: "West", div: "Pacific" }, // PHX
  1610612757: { conf: "West", div: "Northwest" }, // POR
  1610612758: { conf: "West", div: "Pacific" }, // SAC
  1610612759: { conf: "West", div: "Southwest" }, // SAS
  1610612761: { conf: "East", div: "Atlantic" }, // TOR
  1610612762: { conf: "West", div: "Northwest" }, // UTA
  1610612764: { conf: "East", div: "Southeast" }, // WAS
};

const WNBA_TEAM_META: Record<number, { conf: "East" | "West"; div: string }> = {
  1611661313: { conf: "East", div: "" }, // NYL
  1611661317: { conf: "West", div: "" }, // PHX
  1611661319: { conf: "West", div: "" }, // LVA
  1611661320: { conf: "West", div: "" }, // LAS
  1611661321: { conf: "West", div: "" }, // DAL
  1611661322: { conf: "East", div: "" }, // WAS
  1611661323: { conf: "East", div: "" }, // CON
  1611661324: { conf: "West", div: "" }, // MIN
  1611661325: { conf: "East", div: "" }, // IND
  1611661327: { conf: "West", div: "" }, // PDX (Portland Fire)
  1611661328: { conf: "West", div: "" }, // SEA
  1611661329: { conf: "East", div: "" }, // CHI
  1611661330: { conf: "East", div: "" }, // ATL
  1611661331: { conf: "West", div: "" }, // GSV
  1611661332: { conf: "East", div: "" }, // TOR (Tempo)
};

function teamMeta(league: League, teamId: number) {
  const table = league === "wnba" ? WNBA_TEAM_META : NBA_TEAM_META;
  return table[teamId];
}

function emptyRow(
  league: League,
  teamId: number,
  tricode: string,
  city: string,
  name: string
): StandingRow {
  const meta = teamMeta(league, teamId) ?? { conf: "East" as const, div: "" };
  return {
    teamId,
    tricode,
    city,
    name,
    conference: meta.conf,
    division: meta.div,
    wins: 0,
    losses: 0,
    pct: 0,
    gb: null,
    pf: 0,
    pa: 0,
    diff: 0,
    homeW: 0,
    homeL: 0,
    awayW: 0,
    awayL: 0,
    last10W: 0,
    last10L: 0,
    streak: "-",
  };
}

export function computeStandings(
  schedule: CdnScheduleResponse,
  league: League,
  seasonTypeFilter: "regular" | "playoffs" = "regular"
): StandingRow[] {
  const rows = new Map<number, StandingRow>();
  const recentResults = new Map<number, ("W" | "L")[]>();
  const seasonPrefix = LEAGUES[league].seasonTypePrefix[seasonTypeFilter];
  const knownTeams = league === "wnba" ? WNBA_TEAM_META : NBA_TEAM_META;

  const finishedGames: ScheduleGame[] = [];
  for (const day of schedule.leagueSchedule.gameDates) {
    for (const g of day.games) {
      if (!g.gameId.startsWith(seasonPrefix)) continue;
      if (g.gameStatus !== 3) continue;
      if (g.homeTeam.score === 0 && g.awayTeam.score === 0) continue;
      if (!(g.homeTeam.teamId in knownTeams)) continue;
      if (!(g.awayTeam.teamId in knownTeams)) continue;
      finishedGames.push(g);
    }
  }

  finishedGames.sort((a, b) => a.gameDateTimeUTC.localeCompare(b.gameDateTimeUTC));

  for (const g of finishedGames) {
    for (const t of [g.homeTeam, g.awayTeam]) {
      if (!rows.has(t.teamId)) {
        rows.set(
          t.teamId,
          emptyRow(league, t.teamId, t.teamTricode, t.teamCity, t.teamName)
        );
        recentResults.set(t.teamId, []);
      }
    }
    const h = rows.get(g.homeTeam.teamId)!;
    const a = rows.get(g.awayTeam.teamId)!;
    h.pf += g.homeTeam.score;
    h.pa += g.awayTeam.score;
    a.pf += g.awayTeam.score;
    a.pa += g.homeTeam.score;
    const homeWon = g.homeTeam.score > g.awayTeam.score;
    if (homeWon) {
      h.wins++;
      h.homeW++;
      a.losses++;
      a.awayL++;
      recentResults.get(h.teamId)!.push("W");
      recentResults.get(a.teamId)!.push("L");
    } else {
      a.wins++;
      a.awayW++;
      h.losses++;
      h.homeL++;
      recentResults.get(a.teamId)!.push("W");
      recentResults.get(h.teamId)!.push("L");
    }
  }

  for (const row of rows.values()) {
    const gp = row.wins + row.losses;
    row.pct = gp > 0 ? row.wins / gp : 0;
    row.diff = row.pf - row.pa;
    const recent = recentResults.get(row.teamId) ?? [];
    const last10 = recent.slice(-10);
    row.last10W = last10.filter((r) => r === "W").length;
    row.last10L = last10.length - row.last10W;
    if (recent.length === 0) {
      row.streak = "-";
    } else {
      const last = recent[recent.length - 1];
      let n = 1;
      for (let i = recent.length - 2; i >= 0 && recent[i] === last; i--) n++;
      row.streak = `${last}${n}`;
    }
  }

  const all = Array.from(rows.values());
  for (const conf of ["East", "West"] as const) {
    const confTeams = all.filter((r) => r.conference === conf);
    if (confTeams.length === 0) continue;
    confTeams.sort((a, b) => b.pct - a.pct || b.wins - a.wins);
    const leader = confTeams[0];
    for (const t of confTeams) {
      t.gb =
        leader === t
          ? 0
          : (leader.wins - t.wins + (t.losses - leader.losses)) / 2;
    }
  }

  return all.sort((a, b) => {
    if (a.conference !== b.conference)
      return a.conference < b.conference ? -1 : 1;
    if (a.division !== b.division) return a.division < b.division ? -1 : 1;
    return b.pct - a.pct;
  });
}
