export interface LeagueConfig {
  slug: string;
  name: string;
  shortName: string;
  country: string;
  logoUrl: string;
  accentColor: string;
  badgeBg: string;
}

export const LEAGUES: LeagueConfig[] = [
  {
    slug: "eng.1",
    name: "Premier League",
    shortName: "EPL",
    country: "England",
    logoUrl: "https://a.espncdn.com/i/leaguelogos/soccer/500/23.png",
    accentColor: "#38003c",
    badgeBg: "rgba(56, 0, 60, 0.2)",
  },
  {
    slug: "esp.1",
    name: "La Liga",
    shortName: "LaLiga",
    country: "Spain",
    logoUrl: "https://a.espncdn.com/i/leaguelogos/soccer/500/15.png",
    accentColor: "#ee8707",
    badgeBg: "rgba(238, 135, 7, 0.2)",
  },
  {
    slug: "ita.1",
    name: "Serie A",
    shortName: "Serie A",
    country: "Italy",
    logoUrl: "https://a.espncdn.com/i/leaguelogos/soccer/500/12.png",
    accentColor: "#024494",
    badgeBg: "rgba(2, 68, 148, 0.2)",
  },
  {
    slug: "ger.1",
    name: "Bundesliga",
    shortName: "Bundesliga",
    country: "Germany",
    logoUrl: "https://a.espncdn.com/i/leaguelogos/soccer/500/10.png",
    accentColor: "#d20515",
    badgeBg: "rgba(210, 5, 21, 0.2)",
  },
  {
    slug: "fra.1",
    name: "Ligue 1",
    shortName: "Ligue 1",
    country: "France",
    logoUrl: "https://a.espncdn.com/i/leaguelogos/soccer/500/9.png",
    accentColor: "#091c3e",
    badgeBg: "rgba(9, 28, 62, 0.2)",
  },
];

export const SEASONS = [2023, 2024, 2025, 2026] as const;
export type SeasonYear = (typeof SEASONS)[number];

export const DEFAULT_SEASON = 2026;

export const DEFAULT_LEAGUES = LEAGUES.map((l) => l.slug);
