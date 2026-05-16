import type { BoxScoreGame } from "@/lib/nba/types";

function formatDate(ymd: string): string {
  const [y, m, d] = ymd.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

export default function YesterdayResults({
  games,
  dateEt,
}: {
  games: BoxScoreGame[];
  dateEt: string;
}) {
  if (games.length === 0) {
    return (
      <section className="section">
        <h2>{formatDate(dateEt)} — Results</h2>
        <p className="muted">No games yesterday.</p>
      </section>
    );
  }
  return (
    <section className="section">
      <h2>{formatDate(dateEt)} — Results</h2>
      <ul className="results-list">
        {games.map((g) => {
          const winner =
            g.awayTeam.score > g.homeTeam.score ? g.awayTeam : g.homeTeam;
          const loser =
            g.awayTeam.score > g.homeTeam.score ? g.homeTeam : g.awayTeam;
          const ot = g.period > 4 ? ` (${g.period - 4}OT)` : "";
          return (
            <li key={g.gameId}>
              <a href={`#g${g.gameId}`}>
                <strong>{winner.teamCity} {winner.teamName}</strong> {winner.score},{" "}
                {loser.teamCity} {loser.teamName} {loser.score}
                {ot}
              </a>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
