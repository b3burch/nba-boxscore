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

function StandingsTable({
  rows,
  caption,
}: {
  rows: StandingRow[];
  caption?: string;
}) {
  if (rows.length === 0) return null;
  return (
    <div className="div-table">
      {caption && <h4>{caption}</h4>}
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
          {rows.map((t) => (
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
  const hasDivisions = rows.some((r) => r.division !== "");
  return (
    <section className="section standings-section">
      <h2>Standings</h2>
      <div className="conf-grid">
        <div>
          <h3>Eastern Conference</h3>
          {hasDivisions ? (
            DIVISIONS.East.map((d) => (
              <StandingsTable
                key={d}
                rows={rows.filter(
                  (r) => r.conference === "East" && r.division === d
                )}
                caption={d}
              />
            ))
          ) : (
            <StandingsTable rows={rows.filter((r) => r.conference === "East")} />
          )}
        </div>
        <div>
          <h3>Western Conference</h3>
          {hasDivisions ? (
            DIVISIONS.West.map((d) => (
              <StandingsTable
                key={d}
                rows={rows.filter(
                  (r) => r.conference === "West" && r.division === d
                )}
                caption={d}
              />
            ))
          ) : (
            <StandingsTable rows={rows.filter((r) => r.conference === "West")} />
          )}
        </div>
      </div>
    </section>
  );
}
