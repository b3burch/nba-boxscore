import type { StandingRow } from "@/lib/nba/standings";

const DIVISIONS = {
  East: ["Atlantic", "Central", "Southeast"],
  West: ["Northwest", "Pacific", "Southwest"],
} as const;

function fmtGB(gb: number | null): string {
  if (gb == null || gb === 0) return "-";
  return gb.toFixed(1);
}

function fmtPct(p: number): string {
  return p.toFixed(3).replace(/^0/, "");
}

function DivTable({ rows, division }: { rows: StandingRow[]; division: string }) {
  const teams = rows.filter((r) => r.division === division);
  if (teams.length === 0) return null;
  return (
    <div className="div-table">
      <h4>{division}</h4>
      <table className="standings">
        <thead>
          <tr>
            <th className="t">Team</th>
            <th>W</th>
            <th>L</th>
            <th>Pct</th>
            <th>GB</th>
            <th>Home</th>
            <th>Away</th>
            <th>L10</th>
            <th>Strk</th>
            <th>Diff</th>
          </tr>
        </thead>
        <tbody>
          {teams.map((t) => (
            <tr key={t.teamId}>
              <td className="t">{t.tricode}</td>
              <td>{t.wins}</td>
              <td>{t.losses}</td>
              <td>{fmtPct(t.pct)}</td>
              <td>{fmtGB(t.gb)}</td>
              <td>
                {t.homeW}-{t.homeL}
              </td>
              <td>
                {t.awayW}-{t.awayL}
              </td>
              <td>
                {t.last10W}-{t.last10L}
              </td>
              <td>{t.streak}</td>
              <td>
                {t.diff > 0 ? "+" : ""}
                {t.diff}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function Standings({ rows }: { rows: StandingRow[] }) {
  if (rows.length === 0) return null;
  return (
    <section className="section standings-section">
      <h2>Standings</h2>
      <div className="conf-grid">
        <div>
          <h3>Eastern Conference</h3>
          {DIVISIONS.East.map((d) => (
            <DivTable key={d} rows={rows} division={d} />
          ))}
        </div>
        <div>
          <h3>Western Conference</h3>
          {DIVISIONS.West.map((d) => (
            <DivTable key={d} rows={rows} division={d} />
          ))}
        </div>
      </div>
    </section>
  );
}
