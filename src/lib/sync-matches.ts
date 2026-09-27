import { prisma } from "./prisma";
import { Prisma } from "@prisma/client";
import { LEAGUES } from "./constants";
import { fetchLeagueMatches, fetchMatchSummary, fetchLeagueLogos, ParsedMatchScoreboard } from "./espn";

export interface SyncMatchOptions {
  season: number;
  league: string; // league slug, e.g. "eng.1"
  topSummaryLimit?: number; // default: 10
}

export interface SyncMatchResult {
  success: boolean;
  season: number;
  leagueSlug: string;
  leagueName: string;
  matchesIngested: number;
  teamsUpserted: number;
  summariesFetched: number;
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
 * Bulk upserts home & away teams for matches into PostgreSQL.
 * Deduplicates in-memory by ID and preserves curated shortDisplayNames.
 */
async function bulkUpsertTeams(teams: TeamUpsertData[]): Promise<number> {
  if (teams.length === 0) return 0;
  const uniqueTeams = Array.from(new Map(teams.map((t) => [t.id, t])).values());

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
      "short_display_name" = CASE
        WHEN "teams"."short_display_name" IS NOT NULL AND "teams"."short_display_name" != '' AND "teams"."short_display_name" != "teams"."name"
        THEN "teams"."short_display_name"
        ELSE EXCLUDED."short_display_name"
      END,
      "logo_url" = EXCLUDED."logo_url";
  `;

  return uniqueTeams.length;
}

/**
 * Bulk upserts matches into PostgreSQL in a single native SQL query.
 */
async function bulkUpsertMatches(
  matches: ParsedMatchScoreboard[],
  year: number,
  leagueSlug: string
): Promise<number> {
  if (matches.length === 0) return 0;
  const uniqueMatches = Array.from(new Map(matches.map((m) => [m.id, m])).values());

  const values = uniqueMatches.map((m) => {
    return Prisma.sql`(${m.id}, ${leagueSlug}, ${year}, ${m.matchDate}, ${m.status}, ${m.homeTeam.id}, ${m.awayTeam.id}, ${m.homeScore}, ${m.awayScore}, ${m.totalGoals}, ${m.venue || ""}, CURRENT_TIMESTAMP)`;
  });

  await prisma.$executeRaw`
    INSERT INTO "matches" (
      "id", "league_id", "season_year", "match_date", "status",
      "home_team_id", "away_team_id", "home_score", "away_score",
      "total_goals", "venue", "updated_at"
    )
    VALUES ${Prisma.join(values)}
    ON CONFLICT ("id") DO UPDATE SET
      "league_id" = EXCLUDED."league_id",
      "season_year" = EXCLUDED."season_year",
      "match_date" = EXCLUDED."match_date",
      "status" = EXCLUDED."status",
      "home_team_id" = EXCLUDED."home_team_id",
      "away_team_id" = EXCLUDED."away_team_id",
      "home_score" = EXCLUDED."home_score",
      "away_score" = EXCLUDED."away_score",
      "total_goals" = EXCLUDED."total_goals",
      "venue" = CASE
        WHEN EXCLUDED."venue" IS NOT NULL AND EXCLUDED."venue" != '' THEN EXCLUDED."venue"
        ELSE "matches"."venue"
      END,
      "updated_at" = CURRENT_TIMESTAMP;
  `;

  return uniqueMatches.length;
}

/**
 * Syncs full match data for a single league and a single season.
 * Engineered for fast, serverless-safe execution (under 10 seconds).
 */
export async function syncMatchesForSeasonAndLeague(
  options: SyncMatchOptions
): Promise<SyncMatchResult> {
  const startTime = Date.now();
  const errors: string[] = [];
  const topSummaryLimit = options.topSummaryLimit ?? 10;

  const leagueConfig = LEAGUES.find(
    (l) => l.slug.toLowerCase() === options.league.toLowerCase()
  );

  if (!leagueConfig) {
    throw new Error(`Invalid league slug: "${options.league}". Must be one of: ${LEAGUES.map((l) => l.slug).join(", ")}`);
  }

  const leagueSlug = leagueConfig.slug;
  const season = options.season;

  try {
    // 1. Ensure league exists in DB with latest logos from ESPN (fallback to config)
    const liveLogos = await fetchLeagueLogos(leagueSlug).catch(() => null);
    const logoUrl = liveLogos?.logoUrl || leagueConfig.logoUrl;
    const darkLogoUrl = liveLogos?.darkLogoUrl || leagueConfig.darkLogoUrl;

    await prisma.league.upsert({
      where: { id: leagueSlug },
      update: { name: leagueConfig.name, logoUrl, darkLogoUrl },
      create: {
        id: leagueSlug,
        slug: leagueSlug,
        name: leagueConfig.name,
        logoUrl,
        darkLogoUrl,
      },
    });

    // 2. Fetch matches from ESPN for this league and season
    console.log(`[Match Sync] Fetching matches for ${leagueConfig.name} (${leagueSlug}) season ${season}...`);
    const matches = await fetchLeagueMatches(leagueSlug, season);
    console.log(`[Match Sync] Retrieved ${matches.length} completed matches.`);

    if (matches.length === 0) {
      return {
        success: true,
        season,
        leagueSlug,
        leagueName: leagueConfig.name,
        matchesIngested: 0,
        teamsUpserted: 0,
        summariesFetched: 0,
        durationMs: Date.now() - startTime,
        errors: [`No completed matches found on ESPN for ${leagueConfig.name} in season ${season}.`],
      };
    }

    // 3. Extract and bulk upsert home & away teams
    const teamsToUpsert: TeamUpsertData[] = [];
    for (const m of matches) {
      teamsToUpsert.push({
        id: m.homeTeam.id,
        leagueId: leagueSlug,
        name: m.homeTeam.name,
        shortDisplayName: m.homeTeam.shortDisplayName,
        logoUrl: m.homeTeam.logoUrl,
      });
      teamsToUpsert.push({
        id: m.awayTeam.id,
        leagueId: leagueSlug,
        name: m.awayTeam.name,
        shortDisplayName: m.awayTeam.shortDisplayName,
        logoUrl: m.awayTeam.logoUrl,
      });
    }

    const teamsUpserted = await bulkUpsertTeams(teamsToUpsert);

    // 4. Bulk upsert match scoreboards into DB
    const matchesIngested = await bulkUpsertMatches(matches, season, leagueSlug);

    // 5. Pre-fetch detailed match summaries for Top N highest-scoring matches
    let summariesFetched = 0;
    if (topSummaryLimit > 0) {
      const topMatches = [...matches]
        .sort((a, b) => b.totalGoals - a.totalGoals)
        .slice(0, topSummaryLimit);

      for (const m of topMatches) {
        try {
          const summary = await fetchMatchSummary(leagueSlug, m.id);
          if (summary) {
            await prisma.match.update({
              where: { id: m.id },
              data: {
                scorersData: summary.scorers as any,
                statsData: summary.stats as any,
                rostersData: summary.rosters as any,
                venue: summary.venue || undefined,
                attendance: summary.attendance || undefined,
              },
            });
            summariesFetched++;
          }
          // Micro delay to be gentle on ESPN API
          await new Promise((resolve) => setTimeout(resolve, 80));
        } catch (summaryErr: unknown) {
          const msg = summaryErr instanceof Error ? summaryErr.message : String(summaryErr);
          console.warn(`Failed to pre-fetch summary for match ${m.id}: ${msg}`);
        }
      }
    }

    return {
      success: true,
      season,
      leagueSlug,
      leagueName: leagueConfig.name,
      matchesIngested,
      teamsUpserted,
      summariesFetched,
      durationMs: Date.now() - startTime,
      errors,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error during match sync";
    console.error(`[Match Sync Error] ${leagueSlug} season ${season}:`, error);
    return {
      success: false,
      season,
      leagueSlug,
      leagueName: leagueConfig.name,
      matchesIngested: 0,
      teamsUpserted: 0,
      summariesFetched: 0,
      durationMs: Date.now() - startTime,
      errors: [message],
    };
  }
}

/**
 * Backward compatibility function for seed script
 */
export async function syncMatchesFor2026(topSummaryLimit: number = 35) {
  console.log("=== Starting Matches Sync across Top 5 Leagues (2026 Season) ===");
  for (const league of LEAGUES) {
    const res = await syncMatchesForSeasonAndLeague({
      season: 2026,
      league: league.slug,
      topSummaryLimit: Math.round(topSummaryLimit / LEAGUES.length),
    });
    console.log(`[${league.name}] Ingested ${res.matchesIngested} matches in ${(res.durationMs / 1000).toFixed(2)}s`);
  }
}
