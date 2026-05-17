import { readLatestSnapshot } from "@/lib/storage/blob";
import Headline from "@/components/Headline";
import LeagueTabs from "@/components/LeagueTabs";
import Standings from "@/components/Standings";
import YesterdayResults from "@/components/YesterdayResults";
import DailyLeaders from "@/components/DailyLeaders";
import BoxScore from "@/components/BoxScore";
import TodayGames from "@/components/TodayGames";
import OffSeasonNotice from "@/components/OffSeasonNotice";
import { LEAGUES, type League } from "@/lib/nba/leagues";

export default async function LeaguePage({ league }: { league: League }) {
  const snap = await readLatestSnapshot(league);
  const cfg = LEAGUES[league];

  if (!snap) {
    return (
      <main className="page">
        <LeagueTabs active={league} />
        <Headline
          date={new Date().toISOString().slice(0, 10)}
          leagueLabel={cfg.label}
        />
        <section className="empty">
          <p>
            No snapshot yet for {cfg.label}. Hit <code>/api/refresh</code> (with
            the cron secret) or wait for the daily cron at 09:00 UTC.
          </p>
        </section>
      </main>
    );
  }

  if (snap.isOffSeason && snap.yesterdayGames.length === 0) {
    return (
      <main className="page">
        <LeagueTabs active={league} />
        <Headline
          date={snap.dateEt}
          season={snap.seasonString}
          leagueLabel={cfg.label}
        />
        <OffSeasonNotice
          standings={snap.standings}
          season={snap.seasonString}
          leagueLabel={cfg.label}
        />
      </main>
    );
  }

  return (
    <main className="page">
      <LeagueTabs active={league} />
      <Headline
        date={snap.dateEt}
        season={snap.seasonString}
        leagueLabel={cfg.label}
      />
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
          AZ · Source: {cfg.cdnHost.replace("https://", "")}
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
