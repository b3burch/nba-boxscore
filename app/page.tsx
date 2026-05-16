import { readLatestSnapshot } from "@/lib/storage/blob";
import Headline from "@/components/Headline";
import Standings from "@/components/Standings";
import YesterdayResults from "@/components/YesterdayResults";
import DailyLeaders from "@/components/DailyLeaders";
import BoxScore from "@/components/BoxScore";
import TodayGames from "@/components/TodayGames";
import OffSeasonNotice from "@/components/OffSeasonNotice";

export const revalidate = 3600;
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const snap = await readLatestSnapshot();

  if (!snap) {
    return (
      <main className="page">
        <Headline date={new Date().toISOString().slice(0, 10)} />
        <section className="empty">
          <p>
            No snapshot yet. Hit <code>/api/refresh</code> (with the cron
            secret) or wait for the daily cron at 12:00 UTC.
          </p>
        </section>
      </main>
    );
  }

  if (snap.isOffSeason && snap.yesterdayGames.length === 0) {
    return (
      <main className="page">
        <Headline date={snap.dateEt} season={snap.seasonString} />
        <OffSeasonNotice standings={snap.standings} season={snap.seasonString} />
      </main>
    );
  }

  return (
    <main className="page">
      <Headline date={snap.dateEt} season={snap.seasonString} />
      <YesterdayResults games={snap.yesterdayGames} dateEt={snap.yesterdayEt} />
      <DailyLeaders leaders={snap.dailyLeaders} />
      {snap.yesterdayGames.map((g) => (
        <BoxScore key={g.gameId} game={g} />
      ))}
      <TodayGames games={snap.todayGames} dateEt={snap.dateEt} />
      <Standings rows={snap.standings} />
      <footer className="footer">
        <p>
          Updated{" "}
          {new Date(snap.generatedAt).toLocaleString("en-US", {
            timeZone: "America/Phoenix",
          })}{" "}
          AZ · Source: cdn.nba.com
        </p>
        {snap.errors.length > 0 && (
          <details>
            <summary>Refresh notes ({snap.errors.length})</summary>
            <ul>
              {snap.errors.map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          </details>
        )}
      </footer>
    </main>
  );
}
