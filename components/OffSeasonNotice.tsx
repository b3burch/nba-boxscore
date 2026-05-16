import Standings from "./Standings";
import type { StandingRow } from "@/lib/nba/standings";

export default function OffSeasonNotice({
  standings,
  season,
}: {
  standings: StandingRow[];
  season: string;
}) {
  return (
    <div>
      <section className="section">
        <h2>Off-Season</h2>
        <p>
          The {season} season is complete. The Daily Box will return when games
          resume in October.
        </p>
      </section>
      <Standings rows={standings} />
    </div>
  );
}
