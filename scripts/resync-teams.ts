import { syncColeagueData } from "../src/lib/sync";
import { prisma } from "../src/lib/prisma";
import { KNOWN_TEAM_SHORT_NAMES } from "../src/lib/espn";

async function main() {
  console.log("=== Re-syncing Coleague Data and Normalizing Team Names ===");

  // 1. Re-run sync with updated logic
  const syncResult = await syncColeagueData();
  console.log("Sync completed in", (syncResult.durationMs / 1000).toFixed(2), "s");

  // 2. Direct database normalization for any remaining legacy names
  for (const [fullName, shortName] of Object.entries(KNOWN_TEAM_SHORT_NAMES)) {
    const updated = await prisma.team.updateMany({
      where: {
        OR: [
          { name: fullName },
          { shortDisplayName: fullName },
        ],
      },
      data: {
        shortDisplayName: shortName,
      },
    });
    if (updated.count > 0) {
      console.log(`Updated ${updated.count} team(s): ${fullName} -> ${shortName}`);
    }
  }

  // 3. Verify Inter Milan specifically
  const inter = await prisma.team.findFirst({
    where: {
      OR: [
        { id: "110" },
        { name: { contains: "Internazionale", mode: "insensitive" } },
      ],
    },
  });

  console.log("=== Verification for Inter Milan ===");
  console.log("ID:", inter?.id);
  console.log("Name:", inter?.name);
  console.log("Short Display Name:", inter?.shortDisplayName);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
