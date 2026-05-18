import type { BoxScoreGame, BoxPlayer, BoxTeam } from "@/lib/nba/types";
import { formatMinutes, sortRoster, teamTotals } from "@/lib/nba/parse";

function pct(made: number, att: number): string {
  if (!att) return "-";
  return `.${Math.round((made / att) * 1000).toString().padStart(3, "0")}`;
}

function PlayerRow({ p }: { p: BoxPlayer }) {
  const s = p.statistics;
  const played = p.played === "1";
  if (!played) {
    const reason = p.notPlayingReason
      ? p.notPlayingReason.replace(/_/g, " ").toLowerCase()
      : "dnp";
    return (
      <tr className="dnp">
        <td colSpan={15} className="dnp-cell">
          <span className="dnp-name">{p.name}</span>
          <span className="dnp-sep"> — </span>
          <span className="dnp-reason">{reason}</span>
        </td>
      </tr>
    );
  }
  return (
    <tr className={p.starter === "1" ? "starter" : ""}>
      <td className="player">
        {p.name} <span className="pos">{p.position}</span>
      </td>
      <td>{formatMinutes(s.minutesCalculated || s.minutes)}</td>
      <td>{s.fieldGoalsMade}-{s.fieldGoalsAttempted}</td>
      <td>{s.threePointersMade}-{s.threePointersAttempted}</td>
      <td>{s.freeThrowsMade}-{s.freeThrowsAttempted}</td>
      <td>{s.reboundsOffensive}</td>
      <td>{s.reboundsDefensive}</td>
      <td>{s.reboundsTotal}</td>
      <td>{s.assists}</td>
      <td>{s.steals}</td>
      <td>{s.blocks}</td>
      <td>{s.turnovers}</td>
      <td>{s.foulsPersonal}</td>
      <td className={s.plusMinusPoints > 0 ? "pos" : s.plusMinusPoints < 0 ? "neg" : ""}>
        {s.plusMinusPoints > 0 ? "+" : ""}
        {s.plusMinusPoints}
      </td>
      <td className="pts">{s.points}</td>
    </tr>
  );
}

function TeamTable({ team }: { team: BoxTeam }) {
  const sorted = sortRoster(team.players);
  const playedPlayers = sorted.filter((p) => p.played === "1");
  const t = teamTotals(team.players);
  return (
    <div className="box-team">
      <h4 className="team-head">
        {team.teamCity} {team.teamName} — {team.score}
      </h4>
      <div className="box-scroll">
        <table className="box-table">
          <thead>
            <tr>
              <th className="player">Player</th>
              <th>MIN</th>
              <th>FG</th>
              <th>3P</th>
              <th>FT</th>
              <th>OR</th>
              <th>DR</th>
              <th>TOT</th>
              <th>AST</th>
              <th>ST</th>
              <th>BL</th>
              <th>TO</th>
              <th>PF</th>
              <th>+/-</th>
              <th>PTS</th>
            </tr>
          </thead>
          <tbody>
            {playedPlayers.map((p) => (
              <PlayerRow key={p.personId} p={p} />
            ))}
            <tr className="totals">
              <td className="player">TOTALS</td>
              <td>-</td>
              <td>
                {t.fgm}-{t.fga} <span className="pct">{pct(t.fgm, t.fga)}</span>
              </td>
              <td>
                {t.tpm}-{t.tpa} <span className="pct">{pct(t.tpm, t.tpa)}</span>
              </td>
              <td>
                {t.ftm}-{t.fta} <span className="pct">{pct(t.ftm, t.fta)}</span>
              </td>
              <td>{t.oreb}</td>
              <td>{t.dreb}</td>
              <td>{t.reb}</td>
              <td>{t.ast}</td>
              <td>{t.stl}</td>
              <td>{t.blk}</td>
              <td>{t.to}</td>
              <td>{t.pf}</td>
              <td>-</td>
              <td className="pts">{t.pts}</td>
            </tr>
            {sorted.filter((p) => p.played !== "1").map((p) => (
              <PlayerRow key={p.personId} p={p} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function LineScore({ game }: { game: BoxScoreGame }) {
  const periods = game.homeTeam.periods.filter((p) => p.score > 0 || p.period <= 4);
  return (
    <table className="line-score">
      <thead>
        <tr>
          <th></th>
          {periods.map((p) => (
            <th key={p.period}>
              {p.periodType === "OVERTIME" ? `OT${p.period - 4}` : p.period}
            </th>
          ))}
          <th className="final">T</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td className="team">{game.awayTeam.teamTricode}</td>
          {game.awayTeam.periods
            .filter((p) => p.score > 0 || p.period <= 4)
            .map((p) => (
              <td key={p.period}>{p.score}</td>
            ))}
          <td className="final">{game.awayTeam.score}</td>
        </tr>
        <tr>
          <td className="team">{game.homeTeam.teamTricode}</td>
          {game.homeTeam.periods
            .filter((p) => p.score > 0 || p.period <= 4)
            .map((p) => (
              <td key={p.period}>{p.score}</td>
            ))}
          <td className="final">{game.homeTeam.score}</td>
        </tr>
      </tbody>
    </table>
  );
}

const GAMEBOOK_URL = "https://www.nba.com/stats/gamebooks";

export default function BoxScore({ game }: { game: BoxScoreGame }) {
  const dateLine = new Date(game.gameTimeUTC).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "America/New_York",
  });
  return (
    <article id={`g${game.gameId}`} className="boxscore">
      <header className="box-header">
        <h3>
          {game.awayTeam.teamCity} {game.awayTeam.teamName}{" "}
          <span className="score">{game.awayTeam.score}</span> at{" "}
          {game.homeTeam.teamCity} {game.homeTeam.teamName}{" "}
          <span className="score">{game.homeTeam.score}</span>
        </h3>
        <p className="venue">
          {game.arena.arenaName}, {game.arena.arenaCity} · {dateLine}
          {" · "}
          <a
            href={GAMEBOOK_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="gamebook-link"
          >
            View Full Game Book ↗
          </a>
        </p>
      </header>
      <LineScore game={game} />
      <TeamTable team={game.awayTeam} />
      <TeamTable team={game.homeTeam} />
      <footer className="box-footer">
        {game.attendance ? (
          <p>
            Attendance: {game.attendance.toLocaleString()}
            {game.sellout === "1" ? " (sellout)" : ""}
          </p>
        ) : null}
        {game.officials && game.officials.length > 0 && (
          <p>
            Officials: {game.officials.map((o) => o.name).join(", ")}
          </p>
        )}
      </footer>
    </article>
  );
}
