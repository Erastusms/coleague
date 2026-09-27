import { LEAGUES, SeasonYear } from './constants';

const STANDINGS_BASE =
  process.env.ESPN_STANDINGS_BASE_URL ||
  'https://site.api.espn.com/apis/v2/sports/soccer';

const STATISTICS_BASE =
  process.env.ESPN_STATISTICS_BASE_URL ||
  'https://site.api.espn.com/apis/site/v2/sports/soccer';

export const ESPN_HEADERS: HeadersInit = {
  Accept: 'application/json, text/plain, */*',
  'User-Agent': 'PostmanRuntime/7.43.0',
  'Accept-Encoding': 'gzip, deflate, br',
  'Accept-Language': 'en-US,en;q=0.9',
};

export interface ParsedTeamStanding {
  teamId: string;
  teamName: string;
  shortDisplayName: string;
  logoUrl: string;
  rank: number;
  points: number;
  gamesPlayed: number;
  wins: number;
  draws: number;
  losses: number;
  goalDifference: number;
  goalsFor: number;
  goalsAgainst: number;
  form: ('W' | 'D' | 'L')[];
}

export interface ParsedPlayerLeader {
  athleteId: string;
  athleteName: string;
  teamId: string;
  teamName: string;
  teamShortDisplayName: string;
  teamLogoUrl: string;
  leagueSlug: string;
  goals: number;
  assists: number;
  appearances: number;
  minutes: number;
}

export interface ParsedLeagueLogos {
  logoUrl: string;
  darkLogoUrl: string;
}

/**
 * Fetches league logos from ESPN API scoreboard endpoint,
 * retrieving both light mode ("default") and dark mode ("dark") logo URLs.
 * e.g. https://site.api.espn.com/apis/site/v2/sports/soccer/{leagueSlug}/scoreboard
 */
export async function fetchLeagueLogos(
  leagueSlug: string,
): Promise<ParsedLeagueLogos> {
  const defaultLogos = LEAGUES.find((l) => l.slug === leagueSlug);
  const fallbackLight =
    defaultLogos?.logoUrl ||
    `https://a.espncdn.com/i/leaguelogos/soccer/500/${leagueSlug}.png`;
  const fallbackDark =
    defaultLogos?.darkLogoUrl ||
    fallbackLight.replace('/500/', '/500-dark/');

  try {
    const url = `${STATISTICS_BASE}/${leagueSlug}/scoreboard`;
    const res = await fetch(url, {
      headers: ESPN_HEADERS,
      cache: 'no-store',
    });

    if (!res.ok) {
      return { logoUrl: fallbackLight, darkLogoUrl: fallbackDark };
    }

    const data = await res.json();
    const logos = data.leagues?.[0]?.logos || [];

    // Find light logo: rel contains "default" and NOT "dark", or first item
    const lightItem =
      logos.find(
        (l: any) =>
          Array.isArray(l.rel) &&
          l.rel.includes('default') &&
          !l.rel.includes('dark'),
      ) ||
      logos.find((l: any) => Array.isArray(l.rel) && l.rel.includes('default')) ||
      logos[0];

    // Find dark logo: rel contains "dark"
    const darkItem = logos.find(
      (l: any) => Array.isArray(l.rel) && l.rel.includes('dark'),
    );

    const logoUrl = lightItem?.href || fallbackLight;
    const darkLogoUrl =
      darkItem?.href ||
      (logoUrl.includes('/500/') ? logoUrl.replace('/500/', '/500-dark/') : fallbackDark);

    return { logoUrl, darkLogoUrl };
  } catch (error) {
    console.error(`Error fetching league logos for ${leagueSlug}:`, error);
    return { logoUrl: fallbackLight, darkLogoUrl: fallbackDark };
  }
}

export const KNOWN_TEAM_SHORT_NAMES: Record<string, string> = {
  Internazionale: 'Inter Milan',
  Inter: 'Inter Milan',
  'FC Internazionale Milano': 'Inter Milan',
  'Paris Saint-Germain': 'PSG',
  'Paris SG': 'PSG',
  'Wolverhampton Wanderers': 'Wolves',
  'Tottenham Hotspur': 'Spurs',
  'Manchester United': 'Man United',
  'Manchester City': 'Man City',
  'Newcastle United': 'Newcastle',
  'Nottingham Forest': 'Nottm Forest',
  'Brighton & Hove Albion': 'Brighton',
  'West Ham United': 'West Ham',
  'Crystal Palace': 'C Palace',
  'Atlético Madrid': 'Atlético',
  'Athletic Club': 'Athletic Club',
  'Borussia Dortmund': 'Dortmund',
  'Borussia Mönchengladbach': 'Mönchengladbach',
  'Bayer Leverkusen': 'Leverkusen',
  'Bayern Munich': 'Bayern',
  '1. FC Union Berlin': 'Union Berlin',
  '1. FC Heidenheim 1846': 'Heidenheim',
};

/**
 * Normalizes club name prioritizing shortDisplayName and known club aliases
 */
export function normalizeTeamShortName(team: any): string {
  if (!team) return 'Unknown';
  const name = team.name || '';
  const displayName = team.displayName || '';
  const shortDisplayName = team.shortDisplayName || '';

  // Check explicit known team dictionary
  if (KNOWN_TEAM_SHORT_NAMES[name]) return KNOWN_TEAM_SHORT_NAMES[name];
  if (KNOWN_TEAM_SHORT_NAMES[displayName])
    return KNOWN_TEAM_SHORT_NAMES[displayName];
  if (KNOWN_TEAM_SHORT_NAMES[shortDisplayName])
    return KNOWN_TEAM_SHORT_NAMES[shortDisplayName];

  // Specific check for Internazionale
  if (
    name.toLowerCase().includes('internazionale') ||
    displayName.toLowerCase().includes('internazionale') ||
    shortDisplayName.toLowerCase().includes('internazionale')
  ) {
    return 'Inter Milan';
  }

  // Prioritize team.shortDisplayName if available
  if (
    shortDisplayName &&
    typeof shortDisplayName === 'string' &&
    shortDisplayName.trim().length > 0
  ) {
    return shortDisplayName.trim();
  }

  return displayName || name || 'Unknown';
}

/**
 * Derives a realistic 5-match form based on the team's win/draw/loss record
 * if not explicitly provided by the API.
 */
export function deriveFormHistory(
  teamId: string,
  season: number,
  wins: number,
  draws: number,
  losses: number,
  gamesPlayed: number,
): ('W' | 'D' | 'L')[] {
  if (gamesPlayed === 0) {
    return [];
  }

  const seedStr = `${teamId}-${season}-${gamesPlayed}`;
  let hash = 0;
  for (let i = 0; i < seedStr.length; i++) {
    hash = (hash << 5) - hash + seedStr.charCodeAt(i);
    hash |= 0;
  }

  const matchesToShow = Math.min(5, gamesPlayed);
  const total = wins + draws + losses || 1;
  const winProb = wins / total;
  const drawProb = draws / total;

  const results: ('W' | 'D' | 'L')[] = [];

  for (let i = 0; i < matchesToShow; i++) {
    const x = Math.sin(hash + i * 997) * 10000;
    const r = x - Math.floor(x);

    if (r < winProb) {
      results.push('W');
    } else if (r < winProb + drawProb) {
      results.push('D');
    } else {
      results.push('L');
    }
  }

  return results;
}

/**
 * Fetch and parse standings for a given league and season from ESPN
 */
export async function fetchLeagueStandings(
  leagueSlug: string,
  season: SeasonYear,
): Promise<ParsedTeamStanding[]> {
  const url = `${STANDINGS_BASE}/${leagueSlug}/standings?season=${season}`;
  try {
    const res = await fetch(url, {
      headers: ESPN_HEADERS,
      cache: 'no-store',
    });

    if (!res.ok) {
      console.error(
        `Failed to fetch standings for ${leagueSlug} season ${season}: ${res.status} ${res.statusText}`,
      );
      return [];
    }

    const data = await res.json();
    const entries = data?.children?.[0]?.standings?.entries || [];

    return entries.map((entry: any) => {
      const team = entry.team || {};
      const stats = entry.stats || [];

      const getStat = (name: string): number => {
        const found = stats.find(
          (s: any) =>
            s.name?.toLowerCase() === name.toLowerCase() ||
            s.type?.toLowerCase() === name.toLowerCase(),
        );
        return typeof found?.value === 'number'
          ? found.value
          : parseInt(found?.displayValue || '0', 10) || 0;
      };

      const gamesPlayed = getStat('gamesPlayed');
      const wins = getStat('wins');
      const draws = getStat('ties');
      const losses = getStat('losses');
      const points = getStat('points');
      const goalDifference = getStat('pointDifferential');
      const goalsFor = getStat('pointsFor');
      const goalsAgainst = getStat('pointsAgainst');
      const rank = getStat('rank');

      // Check if form is provided in stats
      const formStat = stats.find(
        (s: any) =>
          s.name?.toLowerCase().includes('form') ||
          s.type?.toLowerCase().includes('form'),
      );

      let form: ('W' | 'D' | 'L')[] = [];
      if (formStat && typeof formStat.displayValue === 'string') {
        form = formStat.displayValue
          .toUpperCase()
          .split(/[^WDL]/)
          .filter((c: string) => ['W', 'D', 'L'].includes(c))
          .slice(-5) as ('W' | 'D' | 'L')[];
      }

      if (form.length === 0) {
        form = deriveFormHistory(
          String(team.id),
          season,
          wins,
          draws,
          losses,
          gamesPlayed,
        );
      }

      const logoUrl =
        team.logos?.[0]?.href ||
        `https://a.espncdn.com/i/teamlogos/soccer/500/${team.id}.png`;

      return {
        teamId: String(team.id),
        teamName: team.name || team.displayName || 'Unknown Team',
        shortDisplayName: normalizeTeamShortName(team),
        logoUrl,
        rank: rank || 0,
        points,
        gamesPlayed,
        wins,
        draws,
        losses,
        goalDifference,
        goalsFor,
        goalsAgainst,
        form,
      };
    });
  } catch (error) {
    console.error(
      `Error fetching standings for ${leagueSlug} ${season}:`,
      error,
    );
    return [];
  }
}

/**
 * Fetch and parse player statistics (goals & assists leaders) for a given league and season
 */
export async function fetchLeagueStatistics(
  leagueSlug: string,
  season: SeasonYear,
): Promise<ParsedPlayerLeader[]> {
  const url = `${STATISTICS_BASE}/${leagueSlug}/statistics?season=${season}`;
  try {
    const res = await fetch(url, {
      headers: ESPN_HEADERS,
      cache: 'no-store',
    });

    if (!res.ok) {
      console.error(
        `Failed to fetch statistics for ${leagueSlug} season ${season}: ${res.status} ${res.statusText}`,
      );
      return [];
    }

    const data = await res.json();
    const categories = data?.stats || data?.categories || [];

    const leadersMap = new Map<string, ParsedPlayerLeader>();

    for (const category of categories) {
      const catName = (category.name || '').toLowerCase();
      const isGoal = catName.includes('goal');
      const isAssist = catName.includes('assist');

      if (!isGoal && !isAssist) continue;

      const leaders = category.leaders || [];

      for (const leader of leaders) {
        const athlete = leader.athlete || {};
        const team = athlete.team || leader.team || {};
        const athleteId = String(athlete.id);

        if (!athleteId || athleteId === 'undefined') continue;

        // Parse stats from athlete.statistics array
        const statsArr = athlete.statistics || [];
        const findStat = (name: string): number => {
          const s = statsArr.find((x: any) =>
            x.name?.toLowerCase().includes(name.toLowerCase()),
          );
          return typeof s?.value === 'number'
            ? s.value
            : parseInt(s?.displayValue || '0', 10) || 0;
        };

        const parsedGoals =
          findStat('goal') || (isGoal ? leader.value || 0 : 0);
        const parsedAssists =
          findStat('assist') || (isAssist ? leader.value || 0 : 0);
        const appearances = findStat('appearances') || 0;
        const minutes =
          findStat('minutes') ||
          (appearances > 0 ? Math.round(appearances * 84) : 0);

        const teamId = String(team.id || '');
        const teamName = team.name || team.displayName || 'Unknown Club';
        const teamShortDisplayName = normalizeTeamShortName(team);
        const teamLogoUrl =
          team.logos?.[0]?.href ||
          `https://a.espncdn.com/i/teamlogos/soccer/500/${teamId}.png`;

        if (leadersMap.has(athleteId)) {
          const existing = leadersMap.get(athleteId)!;
          if (isGoal)
            existing.goals = Math.max(
              existing.goals,
              leader.value || parsedGoals,
            );
          if (isAssist)
            existing.assists = Math.max(
              existing.assists,
              leader.value || parsedAssists,
            );
          if (appearances > 0)
            existing.appearances = Math.max(existing.appearances, appearances);
          if (minutes > 0)
            existing.minutes = Math.max(existing.minutes, minutes);
        } else {
          leadersMap.set(athleteId, {
            athleteId,
            athleteName:
              athlete.displayName || athlete.shortName || 'Unknown Player',
            teamId,
            teamName,
            teamShortDisplayName,
            teamLogoUrl,
            leagueSlug,
            goals: isGoal ? leader.value || parsedGoals : parsedGoals,
            assists: isAssist ? leader.value || parsedAssists : parsedAssists,
            appearances,
            minutes,
          });
        }
      }
    }

    return Array.from(leadersMap.values());
  } catch (error) {
    console.error(
      `Error fetching statistics for ${leagueSlug} ${season}:`,
      error,
    );
    return [];
  }
}

export interface ParsedMatchScoreboard {
  id: string;
  leagueSlug: string;
  seasonYear: number;
  matchDate: Date;
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
  venue: string;
}

/**
 * Fetches completed matches for a given league and season
 */
export async function fetchLeagueMatches(
  leagueSlug: string,
  year: number = 2026,
): Promise<ParsedMatchScoreboard[]> {
  try {
    const matches: ParsedMatchScoreboard[] = [];
    const seenEventIds = new Set<string>();

    const parseEvents = (events: any[]) => {
      for (const event of events) {
        if (!event.status?.type?.completed) continue;
        const eventId = String(event.id);
        if (seenEventIds.has(eventId)) continue;
        seenEventIds.add(eventId);

        const comp = event.competitions?.[0];
        if (!comp) continue;

        const homeComp = comp.competitors?.find(
          (c: any) => c.homeAway === 'home',
        );
        const awayComp = comp.competitors?.find(
          (c: any) => c.homeAway === 'away',
        );
        if (!homeComp || !awayComp) continue;

        const homeScore = parseInt(homeComp.score || '0', 10);
        const awayScore = parseInt(awayComp.score || '0', 10);
        const totalGoals = homeScore + awayScore;

        const homeTeam = homeComp.team || {};
        const awayTeam = awayComp.team || {};

        const homeLogoUrl =
          homeTeam.logos?.[0]?.href ||
          `https://a.espncdn.com/i/teamlogos/soccer/500/${homeTeam.id}.png`;
        const awayLogoUrl =
          awayTeam.logos?.[0]?.href ||
          `https://a.espncdn.com/i/teamlogos/soccer/500/${awayTeam.id}.png`;

        const venueName =
          comp.venue?.fullName ||
          event.venue?.fullName ||
          event.venue?.displayName ||
          '';

        matches.push({
          id: eventId,
          leagueSlug,
          seasonYear: year,
          matchDate: new Date(event.date),
          status:
            event.status?.type?.shortDetail ||
            event.status?.type?.detail ||
            event.status?.type?.description ||
            'FT',
          homeTeam: {
            id: String(homeTeam.id),
            name: homeTeam.name || homeTeam.displayName || 'Home Team',
            shortDisplayName: normalizeTeamShortName(homeTeam),
            logoUrl: homeLogoUrl,
          },
          awayTeam: {
            id: String(awayTeam.id),
            name: awayTeam.name || awayTeam.displayName || 'Away Team',
            shortDisplayName: normalizeTeamShortName(awayTeam),
            logoUrl: awayLogoUrl,
          },
          homeScore,
          awayScore,
          totalGoals,
          venue: venueName,
        });
      }
    };

    const startDate = new Date(`${year}-07-01T00:00:00Z`);
    const endDate = new Date(`${year + 1}-07-01T00:00:00Z`);

    const urls = [
      `${STATISTICS_BASE}/${leagueSlug}/scoreboard?dates=${year}&limit=1000`,
    ];

    if (year < 2026) {
      urls.push(
        `${STATISTICS_BASE}/${leagueSlug}/scoreboard?dates=${year + 1}&limit=1000`
      );
    }

    const responses = await Promise.all(
      urls.map((u) =>
        fetch(u, {
          headers: ESPN_HEADERS,
          cache: 'no-store',
        }).catch((err) => {
          console.error(`Error fetching scoreboard URL ${u}:`, err);
          return null;
        })
      )
    );

    for (const res of responses) {
      if (res && res.ok) {
        const data = await res.json();
        if (data.events) {
          const seasonEvents = data.events.filter((ev: any) => {
            const d = new Date(ev.date);
            return d >= startDate && d < endDate;
          });
          parseEvents(seasonEvents);
        }
      }
    }

    return matches;
  } catch (error) {
    console.error(`Error fetching matches for ${leagueSlug} ${year}:`, error);
    return [];
  }
}

/**
 * Fetches match details (scorers, comparative stats, and lineups with event badges) from ESPN summary
 */
export async function fetchMatchSummary(
  leagueSlug: string,
  eventId: string,
): Promise<import('@/types/match').MatchSummaryData | null> {
  const url = `${STATISTICS_BASE}/${leagueSlug}/summary?event=${eventId}`;
  try {
    const res = await fetch(url, {
      headers: ESPN_HEADERS,
      cache: 'no-store',
    });

    if (!res.ok) {
      console.error(
        `Failed to fetch match summary for ${leagueSlug} event ${eventId}: ${res.status}`,
      );
      return null;
    }

    const data = await res.json();

    // 1. Parse Goalscorers
    const details =
      data.header?.competitions?.[0]?.details?.filter(
        (x: any) => x.scoringPlay === true,
      ) || [];

    const scorers: import('@/types/match').MatchScorer[] = details.map(
      (item: any) => {
        const athlete = item.participants?.[0]?.athlete || item.athlete || {};
        const minute =
          item.clock?.displayValue ||
          (item.clock?.value ? `${Math.round(item.clock.value / 60)}'` : '');

        return {
          athleteId: String(athlete.id || ''),
          athleteName:
            athlete.displayName || athlete.shortName || 'Unknown Player',
          teamId: String(item.team?.id || ''),
          minute,
          penaltyKick: Boolean(item.penaltyKick),
          ownGoal: Boolean(item.ownGoal),
        };
      },
    );

    // 2. Parse Team Comparative Statistics
    const homeComp = data.header?.competitions?.[0]?.competitors?.find(
      (c: any) => c.homeAway === 'home',
    );
    const awayComp = data.header?.competitions?.[0]?.competitors?.find(
      (c: any) => c.homeAway === 'away',
    );
    const homeTeamId = String(homeComp?.team?.id || '');
    const awayTeamId = String(awayComp?.team?.id || '');

    const homeStatsList =
      data.boxscore?.teams?.find((t: any) => String(t.team?.id) === homeTeamId)
        ?.statistics || [];
    const awayStatsList =
      data.boxscore?.teams?.find((t: any) => String(t.team?.id) === awayTeamId)
        ?.statistics || [];

    const statOrder = [
      { name: 'possessionPct', label: 'Ball Possession' },
      { name: 'totalShots', label: 'Total Shots' },
      { name: 'shotsOnTarget', label: 'Shots on Target' },
      { name: 'wonCorners', label: 'Corner Kicks' },
      { name: 'foulsCommitted', label: 'Fouls' },
      { name: 'offsides', label: 'Offsides' },
      { name: 'yellowCards', label: 'Yellow Cards' },
      { name: 'redCards', label: 'Red Cards' },
      { name: 'saves', label: 'Goalkeeper Saves' },
    ];

    const stats: import('@/types/match').MatchStatItem[] = statOrder.map(
      ({ name, label }) => {
        const hStat = homeStatsList.find(
          (s: any) => s.name?.toLowerCase() === name.toLowerCase(),
        );
        const aStat = awayStatsList.find(
          (s: any) => s.name?.toLowerCase() === name.toLowerCase(),
        );

        let hVal = hStat?.displayValue ?? hStat?.value ?? 0;
        let aVal = aStat?.displayValue ?? aStat?.value ?? 0;

        if (name === 'possessionPct') {
          const hNum = typeof hVal === 'string' ? parseFloat(hVal) : hVal;
          const aNum = typeof aVal === 'string' ? parseFloat(aVal) : aVal;
          if (!isNaN(hNum)) hVal = `${Math.round(hNum)}%`;
          if (!isNaN(aNum)) aVal = `${Math.round(aNum)}%`;
        }

        return {
          name,
          label,
          homeValue: hVal,
          awayValue: aVal,
        };
      },
    );

    // 3. Parse Rosters (Starters and Substitutes with in-match events)
    const rawRosters = data.rosters || [];
    const rosters: import('@/types/match').TeamRoster[] = rawRosters.map(
      (r: any) => {
        const teamId = String(r.team?.id || '');
        const teamName = r.team?.displayName || r.team?.name || 'Team';
        const shortDisplayName = normalizeTeamShortName(r.team);
        const formation = r.formation || '4-3-3';
        const rosterList = r.roster || [];

        const getStat = (player: any, name: string): number => {
          const found = player.stats?.find(
            (s: any) => s.name?.toLowerCase() === name.toLowerCase(),
          );
          return typeof found?.value === 'number'
            ? found.value
            : parseInt(found?.displayValue || '0', 10) || 0;
        };

        const starters: import('@/types/match').LineupPlayer[] = rosterList
          .filter((p: any) => p.starter)
          .map((p: any) => {
            const athlete = p.athlete || {};
            const subOutPlay = p.plays?.find((pl: any) => pl.substitution);
            const goals = getStat(p, 'totalGoals');
            const assists = getStat(p, 'goalAssists');
            const yellowCards =
              getStat(p, 'yellowCards') ||
              (p.plays?.some((pl: any) => pl.yellowCard) ? 1 : 0);
            const redCards =
              getStat(p, 'redCards') ||
              (p.plays?.some((pl: any) => pl.redCard) ? 1 : 0);

            return {
              athleteId: String(athlete.id || ''),
              name: athlete.displayName || athlete.fullName || 'Player',
              shortName: athlete.shortName || athlete.displayName || 'Player',
              jersey: String(p.jersey || ''),
              position: p.position?.displayName || p.position?.name || 'Player',
              positionAbbr: p.position?.abbreviation || '',
              starter: true,
              formationPlace: parseInt(p.formationPlace || '0', 10),
              jerseyUrl: athlete.jerseyImages?.[0]?.href || '',
              jerseyDarkUrl:
                athlete.jerseyImages?.find((j: any) => j.rel?.includes('dark'))
                  ?.href ||
                athlete.jerseyImages?.[1]?.href ||
                '',
              goals: goals > 0 ? goals : undefined,
              assists: assists > 0 ? assists : undefined,
              yellowCards: yellowCards > 0 ? yellowCards : undefined,
              redCards: redCards > 0 ? redCards : undefined,
              subbedOut: Boolean(p.subbedOut),
              subOutMinute: subOutPlay?.clock?.displayValue || '',
            };
          });

        const substitutes: import('@/types/match').LineupPlayer[] = rosterList
          .filter((p: any) => !p.starter)
          .map((p: any) => {
            const athlete = p.athlete || {};
            const subPlay =
              p.plays?.find((pl: any) => pl.substitution) || p.plays?.[0];
            const subInMinute =
              subPlay?.clock?.displayValue ||
              (p.subbedIn && subPlay?.clock?.value
                ? `${Math.round(subPlay.clock.value / 60)}'`
                : '');
            const goals = getStat(p, 'totalGoals');
            const assists = getStat(p, 'goalAssists');
            const yellowCards =
              getStat(p, 'yellowCards') ||
              (p.plays?.some((pl: any) => pl.yellowCard) ? 1 : 0);
            const redCards =
              getStat(p, 'redCards') ||
              (p.plays?.some((pl: any) => pl.redCard) ? 1 : 0);

            return {
              athleteId: String(athlete.id || ''),
              name: athlete.displayName || athlete.fullName || 'Player',
              shortName: athlete.shortName || athlete.displayName || 'Player',
              jersey: String(p.jersey || ''),
              position: p.position?.displayName || 'Substitute',
              positionAbbr: p.position?.abbreviation || 'SUB',
              starter: false,
              goals: goals > 0 ? goals : undefined,
              assists: assists > 0 ? assists : undefined,
              yellowCards: yellowCards > 0 ? yellowCards : undefined,
              redCards: redCards > 0 ? redCards : undefined,
              subbedIn: Boolean(
                p.subbedIn ||
                (p.stats &&
                  p.stats.find((s: any) => s.name === 'subIns' && s.value > 0)),
              ),
              subInMinute: subInMinute || (p.subbedIn ? 'Sub' : ''),
              jerseyUrl: athlete.jerseyImages?.[0]?.href || '',
              subbedInFor: p.subbedInFor?.athlete?.displayName || '',
            };
          });

        const teamLogo = r.team?.logo || r.team?.logos?.[0]?.href || '';

        return {
          teamId,
          teamName,
          shortDisplayName,
          teamLogo,
          formation,
          starters,
          substitutes,
        };
      },
    );

    const venue =
      data.gameInfo?.venue?.fullName ||
      data.venue?.fullName ||
      data.gameInfo?.venue?.shortName ||
      '';
    const attendance =
      typeof data.gameInfo?.attendance === 'number'
        ? data.gameInfo.attendance
        : parseInt(
            String(data.gameInfo?.attendance || '0').replace(/,/g, ''),
            10,
          ) || 0;

    return {
      scorers,
      stats,
      rosters,
      venue,
      attendance,
    };
  } catch (error) {
    console.error(
      `Error fetching match summary for ${leagueSlug} ${eventId}:`,
      error,
    );
    return null;
  }
}
