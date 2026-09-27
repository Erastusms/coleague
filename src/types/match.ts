export interface MatchScorer {
  athleteId: string;
  athleteName: string;
  teamId: string;
  minute: string;
  penaltyKick?: boolean;
  ownGoal?: boolean;
}

export interface MatchStatItem {
  name: string;
  label: string;
  homeValue: string | number;
  awayValue: string | number;
}

export interface LineupPlayer {
  athleteId: string;
  name: string;
  shortName: string;
  jersey: string;
  position: string;
  positionAbbr: string;
  starter: boolean;
  formationPlace?: number;
  jerseyUrl?: string;
  jerseyDarkUrl?: string;
  goals?: number;
  assists?: number;
  yellowCards?: number;
  redCards?: number;
  subbedOut?: boolean;
  subOutMinute?: string;
  subbedIn?: boolean;
  subInMinute?: string;
  subbedInFor?: string;
}

export interface TeamRoster {
  teamId: string;
  teamName: string;
  shortDisplayName: string;
  teamLogo?: string;
  formation: string;
  starters: LineupPlayer[];
  substitutes: LineupPlayer[];
}

export interface MatchSummaryData {
  scorers: MatchScorer[];
  stats: MatchStatItem[];
  rosters: TeamRoster[];
  venue?: string;
  attendance?: number;
}

export interface MatchItem {
  id: string;
  leagueId: string;
  leagueSlug: string;
  leagueName: string;
  leagueLogoUrl: string;
  leagueDarkLogoUrl?: string;
  seasonYear: number;
  matchDate: string;
  status: string;
  homeTeam: {
    id: string;
    name: string;
    shortDisplayName: string;
    logoUrl: string;
  };
  awayTeam: {
    id: string;
    name: string;
    shortDisplayName: string;
    logoUrl: string;
  };
  homeScore: number;
  awayScore: number;
  totalGoals: number;
  scorersData?: MatchScorer[];
  statsData?: MatchStatItem[];
  rostersData?: TeamRoster[];
  venue?: string;
  attendance?: number;
}
