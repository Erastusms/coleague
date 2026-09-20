export interface TeamInfo {
  id: string;
  name: string;
  shortDisplayName: string;
  logoUrl: string;
}

export interface LeagueInfo {
  id: string;
  slug: string;
  name: string;
  logoUrl: string;
}

export type FormResult = "W" | "D" | "L";

export interface StandingItem {
  rank: number;
  originalLeagueRank?: number;
  team: TeamInfo;
  league: LeagueInfo;
  gamesPlayed: number;
  wins: number;
  draws: number;
  losses: number;
  goalDifference: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
  form: FormResult[];
  updatedAt?: string;
}

export interface PlayerLeaderItem {
  rank: number;
  athleteId: string;
  athleteName: string;
  team: TeamInfo;
  league: LeagueInfo;
  goals: number;
  assists: number;
  appearances: number;
  minutes: number;
}

export interface StandingsApiResponse {
  season: number;
  leagues: string[];
  totalAvailable: number;
  returnedCount: number;
  standings: StandingItem[];
  error?: string;
}

export interface LeadersApiResponse {
  season: number;
  leagues: string[];
  topScorers: PlayerLeaderItem[];
  topAssists: PlayerLeaderItem[];
  error?: string;
}
