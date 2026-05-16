import type { ScheduleGame } from "@/lib/nba/types";

function formatTip(utc: string): string {
  if (!utc) return "TBD";
  const d = new Date(utc);
  if (Number.isNaN(d.getTime())) return "TBD";
  return d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/New_York",
  }) + " ET";
}

export default function TodayGames({
  games,
  dateEt,
}: {
  games: ScheduleGame[];
  dateEt: string;
}) {
  if (games.length === 0) {
    return (
      <section className="section">
        <h2>Today&apos;s Games</h2>
        <p className="muted">No games scheduled.</p>
      </section>
    );
  }
  return (
    <section className="section">
      <h2>Today&apos;s Games</h2>
      <ul className="today-list">
        {games.map((g) => (
          <li key={g.gameId}>
            <span className="matchup">
              {g.awayTeam.teamCity} {g.awayTeam.teamName} at{" "}
              {g.homeTeam.teamCity} {g.homeTeam.teamName}
            </span>
            <span className="tip">
              {formatTip(g.gameDateTimeUTC ?? "")}
              {g.gameLabel ? ` · ${g.gameLabel}` : ""}
              {g.seriesText ? ` · ${g.seriesText}` : ""}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
