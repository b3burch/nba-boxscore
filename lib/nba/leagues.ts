export type League = "nba" | "wnba";

export interface LeagueConfig {
  id: League;
  label: string;
  cdnHost: string;
  scoreboardSuffix: string;
  referer: string;
  seasonTypePrefix: { regular: string; playoffs: string };
}

export const LEAGUES: Record<League, LeagueConfig> = {
  nba: {
    id: "nba",
    label: "NBA",
    cdnHost: "https://cdn.nba.com",
    scoreboardSuffix: "00",
    referer: "https://www.nba.com/",
    seasonTypePrefix: { regular: "002", playoffs: "004" },
  },
  wnba: {
    id: "wnba",
    label: "WNBA",
    cdnHost: "https://cdn.wnba.com",
    scoreboardSuffix: "10",
    referer: "https://www.wnba.com/",
    seasonTypePrefix: { regular: "102", playoffs: "104" },
  },
};

export const ALL_LEAGUES: League[] = ["nba", "wnba"];
