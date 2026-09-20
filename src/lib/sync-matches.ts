import { prisma } from "./prisma";
import { LEAGUES } from "./constants";
import { fetchLeagueMatches, fetchMatchSummary } from "./espn";

export async function syncMatchesFor2026(topSummaryLimit: number = 35) {
  console.log("=== Starting Matches Sync & Reclassification ===");

  // 1. Data Preservation: Reclassify earlier matches (Jan-May 2026) to 2025/2026 season (2025)
  const reclassifyResult = await prisma.match.updateMany({
    where: {
      matchDate: {
        lt: new Date("2026-07-01T00:00:00Z"),
      },
    },
    data: {
      seasonYear: 2025,
    },
  });
  console.log(
    `Preserved and reclassified ${reclassifyResult.count} matches from Jan–May 2026 under season 2025.`
  );

  // 2. Ingest 2026/2027 Season matches (July 1, 2026 to present date)
  console.log("Ingesting 2026/2027 season matches (July 1, 2026 - present)...");
  const newIngestedMatches: Array<{
    id: string;
    leagueSlug: string;
    totalGoals: number;
  }> = [];

  for (const league of LEAGUES) {
    console.log(`Fetching 2026/27 matches for ${league.name} (${league.slug})...`);
    const matches = await fetchLeagueMatches(league.slug, 2026);
    console.log(`Found ${matches.length} matches for ${league.name}.`);

    // Ensure league exists
    await prisma.league.upsert({
      where: { id: league.slug },
      update: { name: league.name, logoUrl: league.logoUrl },
      create: {
        id: league.slug,
        slug: league.slug,
        name: league.name,
        logoUrl: league.logoUrl,
      },
    });

    for (const m of matches) {
      // Upsert home and away teams
      await prisma.team.upsert({
        where: { id: m.homeTeam.id },
        update: {
          name: m.homeTeam.name,
          shortDisplayName: m.homeTeam.shortDisplayName,
          logoUrl: m.homeTeam.logoUrl,
        },
        create: {
          id: m.homeTeam.id,
          leagueId: league.slug,
          name: m.homeTeam.name,
          shortDisplayName: m.homeTeam.shortDisplayName,
          logoUrl: m.homeTeam.logoUrl,
        },
      });

      await prisma.team.upsert({
        where: { id: m.awayTeam.id },
        update: {
          name: m.awayTeam.name,
          shortDisplayName: m.awayTeam.shortDisplayName,
          logoUrl: m.awayTeam.logoUrl,
        },
        create: {
          id: m.awayTeam.id,
          leagueId: league.slug,
          name: m.awayTeam.name,
          shortDisplayName: m.awayTeam.shortDisplayName,
          logoUrl: m.awayTeam.logoUrl,
        },
      });

      // Upsert match record with seasonYear = 2026
      await prisma.match.upsert({
        where: { id: m.id },
        update: {
          leagueId: league.slug,
          seasonYear: 2026,
          matchDate: m.matchDate,
          status: m.status,
          homeTeamId: m.homeTeam.id,
          awayTeamId: m.awayTeam.id,
          homeScore: m.homeScore,
          awayScore: m.awayScore,
          totalGoals: m.totalGoals,
          venue: m.venue || undefined,
        },
        create: {
          id: m.id,
          leagueId: league.slug,
          seasonYear: 2026,
          matchDate: m.matchDate,
          status: m.status,
          homeTeamId: m.homeTeam.id,
          awayTeamId: m.awayTeam.id,
          homeScore: m.homeScore,
          awayScore: m.awayScore,
          totalGoals: m.totalGoals,
          venue: m.venue || "",
        },
      });

      newIngestedMatches.push({
        id: m.id,
        leagueSlug: league.slug,
        totalGoals: m.totalGoals,
      });
    }
  }

  console.log(`Total 2026/27 matches ingested: ${newIngestedMatches.length}`);

  // 3. Pre-fetch detailed summaries for Top 2026 matches
  newIngestedMatches.sort((a, b) => b.totalGoals - a.totalGoals);
  const top2026 = newIngestedMatches.slice(0, topSummaryLimit);

  console.log(
    `Pre-fetching detailed summaries for Top ${top2026.length} matches of 2026/27 season...`
  );

  let count = 0;
  for (const m of top2026) {
    count++;
    try {
      console.log(`[${count}/${top2026.length}] Fetching summary for 2026/27 match ${m.id} (${m.leagueSlug})...`);
      const summary = await fetchMatchSummary(m.leagueSlug, m.id);
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
      }
      await new Promise((resolve) => setTimeout(resolve, 150));
    } catch (err) {
      console.error(`Failed to fetch summary for ${m.id}:`, err);
    }
  }

  console.log("=== Matches Sync & Reclassification Finished Successfully ===");
}
