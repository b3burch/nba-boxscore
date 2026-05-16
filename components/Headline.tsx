function formatDate(ymd: string): string {
  const [y, m, d] = ymd.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

export default function Headline({
  date,
  season,
}: {
  date: string;
  season?: string;
}) {
  return (
    <header className="headline">
      <div className="masthead">
        <span className="title">The Daily Box</span>
        <span className="sub">NBA · {season ?? ""}</span>
      </div>
      <div className="dateline">{formatDate(date)}</div>
    </header>
  );
}
