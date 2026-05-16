import type { DailyLeader } from "@/lib/types/snapshot";

function LeaderList({
  title,
  rows,
  unit,
}: {
  title: string;
  rows: DailyLeader[];
  unit: string;
}) {
  if (rows.length === 0) return null;
  return (
    <div className="leader-col">
      <h4>{title}</h4>
      <ol className="leader-list">
        {rows.map((r, i) => (
          <li key={`${r.personId}-${i}`}>
            <span className="leader-name">
              {r.name} <span className="leader-team">({r.team})</span>
            </span>
            <span className="leader-value">
              {r.value} {unit}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

export default function DailyLeaders({
  leaders,
}: {
  leaders: { points: DailyLeader[]; rebounds: DailyLeader[]; assists: DailyLeader[] };
}) {
  const total =
    leaders.points.length + leaders.rebounds.length + leaders.assists.length;
  if (total === 0) return null;
  return (
    <section className="section">
      <h2>Yesterday&apos;s Leaders</h2>
      <div className="leaders-grid">
        <LeaderList title="Points" rows={leaders.points} unit="pts" />
        <LeaderList title="Rebounds" rows={leaders.rebounds} unit="reb" />
        <LeaderList title="Assists" rows={leaders.assists} unit="ast" />
      </div>
    </section>
  );
}
