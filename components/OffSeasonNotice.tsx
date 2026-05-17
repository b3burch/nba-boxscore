import Standings from "./Standings";
import type { StandingRow } from "@/lib/nba/standings";

export default function OffSeasonNotice({
  standings,
  season,
  leagueLabel = "NBA",
}: {
  standings: StandingRow[];
  season: string;
  leagueLabel?: string;
}) {
  return (
    <div>
      <section className="section">
        <h2>Off-Season</h2>
        <p>
          The {season} {leagueLabel} season is complete. The Daily Box will
          return when games resume.
        </p>
      </section>
      <Standings rows={standings} />
    </div>
  );
}
