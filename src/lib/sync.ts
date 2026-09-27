import { prisma } from "./prisma";
import { Prisma } from "@prisma/client";
import { LEAGUES, SEASONS, SeasonYear, LeagueConfig } from "./constants";
import { fetchLeagueStandings, fetchLeagueStatistics, fetchLeagueLogos, ParsedTeamStanding, ParsedPlayerLeader } from "./espn";

export interface SyncOptions {
  seasons?: SeasonYear[];
  leagues?: string[];
}

export interface SyncResult {
  success: boolean;
  leaguesProcessed: number;
  teamsUpserted: number;
  standingsUpserted: number;
  playerStatsUpserted: number;
  durationMs: number;
  errors: string[];
}

interface TeamUpsertData {
  id: string;
  leagueId: string;
  name: string;
  shortDisplayName: string;
  logoUrl: string;
}

/**
 * Bulk upserts leagues into PostgreSQL in a single query.
 * Fetches latest dark and light mode logos from ESPN API with fallback to static constants.
 */
async function bulkUpsertLeagues(leagues: LeagueConfig[]): Promise<void> {
  if (leagues.length === 0) return;

  const enrichedLeagues = await Promise.all(
    leagues.map(async (l) => {
      try {
        const liveLogos = await fetchLeagueLogos(l.slug);
        return {
          ...l,
          logoUrl: liveLogos.logoUrl || l.logoUrl,
          darkLogoUrl: liveLogos.darkLogoUrl || l.darkLogoUrl,
        };
      } catch {
        return l;
      }
    })
  );

  const values = enrichedLeagues.map(
    (l) => Prisma.sql`(${l.slug}, ${l.slug}, ${l.name}, ${l.logoUrl}, ${l.darkLogoUrl})`
  );
  await prisma.$executeRaw`
    INSERT INTO "leagues" ("id", "slug", "name", "logo_url", "dark_logo_url")
    VALUES ${Prisma.join(values)}
    ON CONFLICT ("id") DO UPDATE SET
      "name" = EXCLUDED."name",
      "logo_url" = EXCLUDED."logo_url",
      "dark_logo_url" = EXCLUDED."dark_logo_url",
      "slug" = EXCLUDED."slug";
  `;
}

/**
 * Bulk upserts teams into PostgreSQL in a single query.
 * Deduplicates in-memory by ID to prevent Postgres 'ON CONFLICT DO UPDATE command cannot affect row a second time'.
 */
async function bulkUpsertTeams(teams: TeamUpsertData[]): Promise<number> {
  if (teams.length === 0) return 0;
  const uniqueTeams = Array.from(
    new Map(teams.map((t) => [t.id, t])).values()
  );

  const values = uniqueTeams.map(
    (t) =>
      Prisma.sql`(${t.id}, ${t.leagueId}, ${t.name}, ${t.shortDisplayName}, ${t.logoUrl})`
  );

  await prisma.$executeRaw`
    INSERT INTO "teams" ("id", "league_id", "name", "short_display_name", "logo_url")
    VALUES ${Prisma.join(values)}
    ON CONFLICT ("id") DO UPDATE SET
      "league_id" = EXCLUDED."league_id",
      "name" = EXCLUDED."name",
      "short_display_name" = EXCLUDED."short_display_name",
      "logo_url" = EXCLUDED."logo_url";
  `;

  return uniqueTeams.length;
}

/**
 * Ensures any edge-case teams referenced by player leaders that were not in standings exist.
 * Eliminates redundant per-player team updates and row lock contention by deduplicating in memory.
 */
async function bulkEnsureTeamsForLeaders(
  leaders: ParsedPlayerLeader[],
  leagueSlug: string,
  knownTeamIds: Set<string>
): Promise<number> {
  const missingTeamsMap = new Map<string, TeamUpsertData>();

  for (const leader of leaders) {
    if (leader.teamId && !knownTeamIds.has(leader.teamId)) {
      missingTeamsMap.set(leader.teamId, {
        id: leader.teamId,
        leagueId: leagueSlug,
        name: leader.teamName,
        shortDisplayName: leader.teamShortDisplayName,
        logoUrl: leader.teamLogoUrl,
      });
    }
  }

  if (missingTeamsMap.size === 0) return 0;

  const missingTeams = Array.from(missingTeamsMap.values());
  const values = missingTeams.map(
    (t) =>
      Prisma.sql`(${t.id}, ${t.leagueId}, ${t.name}, ${t.shortDisplayName}, ${t.logoUrl})`
  );

  await prisma.$executeRaw`
    INSERT INTO "teams" ("id", "league_id", "name", "short_display_name", "logo_url")
    VALUES ${Prisma.join(values)}
    ON CONFLICT ("id") DO UPDATE SET
      "league_id" = EXCLUDED."league_id",
      "name" = EXCLUDED."name",
      "logo_url" = EXCLUDED."logo_url",
      "short_display_name" = CASE
        WHEN "teams"."short_display_name" IS NOT NULL AND "teams"."short_display_name" != '' AND "teams"."short_display_name" != "teams"."name"
        THEN "teams"."short_display_name"
        ELSE EXCLUDED."short_display_name"
      END;
  `;

  for (const t of missingTeams) {
    knownTeamIds.add(t.id);
  }

  return missingTeams.length;
}

/**
 * Bulk upserts league standings into PostgreSQL in a single query.
 */
async function bulkUpsertStandings(
  entries: ParsedTeamStanding[],
  seasonId: number
): Promise<number> {
  if (entries.length === 0) return 0;

  const uniqueEntries = Array.from(
    new Map(entries.map((e) => [e.teamId, e])).values()
  );

  const values = uniqueEntries.map(
    (e) =>
      Prisma.sql`(${e.teamId}, ${seasonId}, ${e.rank}, ${e.points}, ${e.gamesPlayed}, ${e.wins}, ${e.draws}, ${e.losses}, ${e.goalDifference}, ${e.goalsFor}, ${e.goalsAgainst}, ${JSON.stringify(e.form || [])}::jsonb, CURRENT_TIMESTAMP)`
  );

  await prisma.$executeRaw`
    INSERT INTO "standings" (
      "team_id", "season_id", "rank", "points", "games_played",
      "wins", "draws", "losses", "goal_difference", "goals_for",
      "goals_against", "form", "updated_at"
    )
    VALUES ${Prisma.join(values)}
    ON CONFLICT ("team_id", "season_id") DO UPDATE SET
      "rank" = EXCLUDED."rank",
      "points" = EXCLUDED."points",
      "games_played" = EXCLUDED."games_played",
      "wins" = EXCLUDED."wins",
      "draws" = EXCLUDED."draws",
      "losses" = EXCLUDED."losses",
      "goal_difference" = EXCLUDED."goal_difference",
      "goals_for" = EXCLUDED."goals_for",
      "goals_against" = EXCLUDED."goals_against",
      "form" = EXCLUDED."form",
      "updated_at" = CURRENT_TIMESTAMP;
  `;

  return uniqueEntries.length;
}

/**
 * Bulk upserts player statistics (scorers & assists) into PostgreSQL in a single query.
 */
async function bulkUpsertPlayerStats(
  leaders: ParsedPlayerLeader[],
  seasonId: number,
  leagueSlug: string
): Promise<number> {
  const validLeaders = leaders.filter(
    (l) => l.athleteId && l.athleteId !== "undefined" && l.teamId
  );
  if (validLeaders.length === 0) return 0;

  const uniqueLeaders = Array.from(
    new Map(validLeaders.map((l) => [l.athleteId, l])).values()
  );

  const values = uniqueLeaders.map(
    (l) =>
      Prisma.sql`(${l.athleteId}, ${l.athleteName}, ${l.teamId}, ${leagueSlug}, ${seasonId}, ${l.goals}, ${l.assists}, ${l.appearances}, ${l.minutes}, CURRENT_TIMESTAMP)`
  );

  await prisma.$executeRaw`
    INSERT INTO "player_stats" (
      "athlete_id", "athlete_name", "team_id", "league_id", "season_id",
      "goals", "assists", "appearances", "minutes", "updated_at"
    )
    VALUES ${Prisma.join(values)}
    ON CONFLICT ("athlete_id", "season_id", "league_id") DO UPDATE SET
      "athlete_name" = EXCLUDED."athlete_name",
      "team_id" = EXCLUDED."team_id",
      "goals" = EXCLUDED."goals",
      "assists" = EXCLUDED."assists",
      "appearances" = EXCLUDED."appearances",
      "minutes" = EXCLUDED."minutes",
      "updated_at" = CURRENT_TIMESTAMP;
  `;

  return uniqueLeaders.length;
}

export async function syncColeagueData(
  options: SyncOptions = {}
): Promise<SyncResult> {
  const startTime = Date.now();
  const errors: string[] = [];
  let teamsUpserted = 0;
  let standingsUpserted = 0;
  let playerStatsUpserted = 0;

  const targetLeagues = options.leagues
    ? LEAGUES.filter((l) => options.leagues!.includes(l.slug))
    : LEAGUES;

  const targetSeasons = options.seasons || (SEASONS as unknown as SeasonYear[]);

  try {
    // 1. Ensure Leagues exist in DB via single bulk upsert
    await bulkUpsertLeagues(targetLeagues);

    // 2. Ensure Seasons exist in DB
    const seasonMap = new Map<number, number>();
    for (const year of targetSeasons) {
      const seasonRecord = await prisma.season.upsert({
        where: { year },
        update: {},
        create: { year },
      });
      seasonMap.set(year, seasonRecord.id);
    }

    // 3. Ingest Standings and Player Stats
    for (const league of targetLeagues) {
      for (const year of targetSeasons) {
        const seasonId = seasonMap.get(year);
        if (!seasonId) continue;

        try {
          // Fetch standings & leaders concurrently to halve HTTP latency
          const [standingsEntries, leaders] = await Promise.all([
            fetchLeagueStandings(league.slug, year),
            fetchLeagueStatistics(league.slug, year),
          ]);

          // A. Bulk upsert teams from standings (establishes authoritative team names & shortDisplayName)
          const teamsToUpsert: TeamUpsertData[] = standingsEntries.map((entry) => ({
            id: entry.teamId,
            leagueId: league.slug,
            name: entry.teamName,
            shortDisplayName: entry.shortDisplayName,
            logoUrl: entry.logoUrl,
          }));
          const knownTeamIds = new Set(teamsToUpsert.map((t) => t.id));

          const numTeams = await bulkUpsertTeams(teamsToUpsert);
          teamsUpserted += numTeams;

          // B. Bulk upsert standings in ONE single query
          const numStandings = await bulkUpsertStandings(standingsEntries, seasonId);
          standingsUpserted += numStandings;

          // C. Ensure any edge-case teams for player leaders not already present (0 queries in 99.9% of cases,
          // eliminating redundant team updates, N+1 queries, and row lock contention)
          const numLeaderTeams = await bulkEnsureTeamsForLeaders(leaders, league.slug, knownTeamIds);
          teamsUpserted += numLeaderTeams;

          // D. Bulk upsert player statistics in ONE single query
          const numPlayerStats = await bulkUpsertPlayerStats(leaders, seasonId, league.slug);
          playerStatsUpserted += numPlayerStats;
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : String(err);
          const errMsg = `Failed to sync ${league.slug} for season ${year}: ${message}`;
          console.error(errMsg);
          errors.push(errMsg);
        }
      }
    }

    return {
      success: errors.length === 0,
      leaguesProcessed: targetLeagues.length,
      teamsUpserted,
      standingsUpserted,
      playerStatsUpserted,
      durationMs: Date.now() - startTime,
      errors,
    };
  } catch (error: unknown) {
    console.error("Critical error in syncColeagueData:", error);
    const message = error instanceof Error ? error.message : "Unknown error during sync";
    return {
      success: false,
      leaguesProcessed: 0,
      teamsUpserted,
      standingsUpserted,
      playerStatsUpserted,
      durationMs: Date.now() - startTime,
      errors: [message],
    };
  }
}
