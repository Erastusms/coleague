import { syncMatchesFor2026 } from "../src/lib/sync-matches";
import { prisma } from "../src/lib/prisma";

async function main() {
  try {
    await syncMatchesFor2026(40); // Pre-fetch detailed summaries for top 40 matches
    console.log("Seeding matches finished successfully.");
  } catch (err) {
    console.error("Error seeding matches:", err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
