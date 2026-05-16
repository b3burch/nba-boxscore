import type { BoxPlayer } from "./types";

export function parseMinutesPT(pt: string): number {
  if (!pt) return 0;
  const m = pt.match(/PT(\d+)M(?:([\d.]+)S)?/);
  if (!m) return 0;
  const mins = parseInt(m[1], 10);
  const secs = m[2] ? parseFloat(m[2]) : 0;
  return mins + secs / 60;
}

export function formatMinutes(pt: string): string {
  const total = parseMinutesPT(pt);
  if (total <= 0) return "0:00";
  const mins = Math.floor(total);
  const secs = Math.round((total - mins) * 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function isStarter(p: BoxPlayer): boolean {
  return p.starter === "1";
}

export function didPlay(p: BoxPlayer): boolean {
  return p.played === "1";
}

export function sortRoster(players: BoxPlayer[]): BoxPlayer[] {
  return [...players].sort((a, b) => {
    const sa = isStarter(a) ? 0 : didPlay(a) ? 1 : 2;
    const sb = isStarter(b) ? 0 : didPlay(b) ? 1 : 2;
    if (sa !== sb) return sa - sb;
    return a.order - b.order;
  });
}

export function teamTotals(players: BoxPlayer[]) {
  const t = {
    fgm: 0,
    fga: 0,
    tpm: 0,
    tpa: 0,
    ftm: 0,
    fta: 0,
    oreb: 0,
    dreb: 0,
    reb: 0,
    ast: 0,
    pf: 0,
    stl: 0,
    to: 0,
    blk: 0,
    pts: 0,
  };
  for (const p of players) {
    if (!didPlay(p)) continue;
    const s = p.statistics;
    t.fgm += s.fieldGoalsMade;
    t.fga += s.fieldGoalsAttempted;
    t.tpm += s.threePointersMade;
    t.tpa += s.threePointersAttempted;
    t.ftm += s.freeThrowsMade;
    t.fta += s.freeThrowsAttempted;
    t.oreb += s.reboundsOffensive;
    t.dreb += s.reboundsDefensive;
    t.reb += s.reboundsTotal;
    t.ast += s.assists;
    t.pf += s.foulsPersonal;
    t.stl += s.steals;
    t.to += s.turnovers;
    t.blk += s.blocks;
    t.pts += s.points;
  }
  return t;
}
