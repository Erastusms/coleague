import { syncColeagueData } from "../src/lib/sync";
import { prisma } from "../src/lib/prisma";

async function main() {
  console.log("=== Coleague Data Ingestion & Seeding ===");
  console.log("Starting full sync across Top 5 leagues (2023–2026)...");

  const result = await syncColeagueData();

  console.log("Sync completed!");
  console.log(`Duration: ${(result.durationMs / 1000).toFixed(2)}s`);
  console.log(`Leagues processed: ${result.leaguesProcessed}`);
  console.log(`Teams upserted: ${result.teamsUpserted}`);
  console.log(`Standings upserted: ${result.standingsUpserted}`);
  console.log(`Player stats upserted: ${result.playerStatsUpserted}`);

  if (result.errors.length > 0) {
    console.warn("Encountered errors:", result.errors);
  }

  // Count records in DB
  const teamCount = await prisma.team.count();
  const standingsCount = await prisma.standing.count();
  const playerStatsCount = await prisma.playerStat.count();

  console.log("=== Database Summary ===");
  console.log(`Total Teams in DB: ${teamCount}`);
  console.log(`Total Standings records: ${standingsCount}`);
  console.log(`Total Player Stats records: ${playerStatsCount}`);
}

main()
  .catch((e) => {
    console.error("Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
