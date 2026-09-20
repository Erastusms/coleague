import { prisma } from "./prisma";
import { LEAGUES, SEASONS, SeasonYear } from "./constants";
import { fetchLeagueStandings, fetchLeagueStatistics } from "./espn";

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
    // 1. Ensure Leagues exist in DB
    for (const league of targetLeagues) {
      await prisma.league.upsert({
        where: { slug: league.slug },
        update: {
          name: league.name,
          logoUrl: league.logoUrl,
        },
        create: {
          id: league.slug,
          slug: league.slug,
          name: league.name,
          logoUrl: league.logoUrl,
        },
      });
    }

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
          // A. Fetch and store standings
          const standingsEntries = await fetchLeagueStandings(league.slug, year);

          for (const entry of standingsEntries) {
            // Upsert team
            await prisma.team.upsert({
              where: { id: entry.teamId },
              update: {
                leagueId: league.slug,
                name: entry.teamName,
                shortDisplayName: entry.shortDisplayName,
                logoUrl: entry.logoUrl,
              },
              create: {
                id: entry.teamId,
                leagueId: league.slug,
                name: entry.teamName,
                shortDisplayName: entry.shortDisplayName,
                logoUrl: entry.logoUrl,
              },
            });
            teamsUpserted++;

            // Upsert standing
            await prisma.standing.upsert({
              where: {
                teamId_seasonId: {
                  teamId: entry.teamId,
                  seasonId,
                },
              },
              update: {
                rank: entry.rank,
                points: entry.points,
                gamesPlayed: entry.gamesPlayed,
                wins: entry.wins,
                draws: entry.draws,
                losses: entry.losses,
                goalDifference: entry.goalDifference,
                goalsFor: entry.goalsFor,
                goalsAgainst: entry.goalsAgainst,
                form: entry.form,
                updatedAt: new Date(),
              },
              create: {
                teamId: entry.teamId,
                seasonId,
                rank: entry.rank,
                points: entry.points,
                gamesPlayed: entry.gamesPlayed,
                wins: entry.wins,
                draws: entry.draws,
                losses: entry.losses,
                goalDifference: entry.goalDifference,
                goalsFor: entry.goalsFor,
                goalsAgainst: entry.goalsAgainst,
                form: entry.form,
              },
            });
            standingsUpserted++;
          }

          // B. Fetch and store player statistics
          const leaders = await fetchLeagueStatistics(league.slug, year);

          for (const leader of leaders) {
            // Ensure player's team exists without clobbering standings shortDisplayName
            if (leader.teamId) {
              const existingTeam = await prisma.team.findUnique({
                where: { id: leader.teamId },
              });

              if (existingTeam) {
                await prisma.team.update({
                  where: { id: leader.teamId },
                  data: {
                    leagueId: league.slug,
                    name: leader.teamName,
                    logoUrl: leader.teamLogoUrl,
                    shortDisplayName:
                      existingTeam.shortDisplayName &&
                      !existingTeam.shortDisplayName.toLowerCase().includes("internazionale") &&
                      existingTeam.shortDisplayName !== existingTeam.name
                        ? existingTeam.shortDisplayName
                        : leader.teamShortDisplayName,
                  },
                });
              } else {
                await prisma.team.create({
                  data: {
                    id: leader.teamId,
                    leagueId: league.slug,
                    name: leader.teamName,
                    shortDisplayName: leader.teamShortDisplayName,
                    logoUrl: leader.teamLogoUrl,
                  },
                });
              }
            }

            // Upsert player stat
            await prisma.playerStat.upsert({
              where: {
                athleteId_seasonId_leagueId: {
                  athleteId: leader.athleteId,
                  seasonId,
                  leagueId: league.slug,
                },
              },
              update: {
                athleteName: leader.athleteName,
                teamId: leader.teamId,
                goals: leader.goals,
                assists: leader.assists,
                appearances: leader.appearances,
                minutes: leader.minutes,
                updatedAt: new Date(),
              },
              create: {
                athleteId: leader.athleteId,
                athleteName: leader.athleteName,
                teamId: leader.teamId,
                leagueId: league.slug,
                seasonId,
                goals: leader.goals,
                assists: leader.assists,
                appearances: leader.appearances,
                minutes: leader.minutes,
              },
            });
            playerStatsUpserted++;
          }
        } catch (err: any) {
          const errMsg = `Failed to sync ${league.slug} for season ${year}: ${err.message}`;
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
  } catch (error: any) {
    console.error("Critical error in syncColeagueData:", error);
    return {
      success: false,
      leaguesProcessed: 0,
      teamsUpserted,
      standingsUpserted,
      playerStatsUpserted,
      durationMs: Date.now() - startTime,
      errors: [error.message || "Unknown error during sync"],
    };
  }
}
