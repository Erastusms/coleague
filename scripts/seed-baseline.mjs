import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

if (typeof process.loadEnvFile === "function") {
  try {
    process.loadEnvFile();
  } catch {
    // In production/Vercel, environment variables are injected directly
  }
}

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL =
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_URL_NON_POOLING;
}

const prisma = new PrismaClient({
  datasources: process.env.DATABASE_URL
    ? {
        db: {
          url: process.env.DATABASE_URL,
        },
      }
    : undefined,
});

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derived}`;
}

const LEAGUES = [
  {
    slug: "eng.1",
    name: "Premier League",
    logoUrl: "https://a.espncdn.com/i/leaguelogos/soccer/500/23.png",
  },
  {
    slug: "esp.1",
    name: "La Liga",
    logoUrl: "https://a.espncdn.com/i/leaguelogos/soccer/500/15.png",
  },
  {
    slug: "ita.1",
    name: "Serie A",
    logoUrl: "https://a.espncdn.com/i/leaguelogos/soccer/500/12.png",
  },
  {
    slug: "ger.1",
    name: "Bundesliga",
    logoUrl: "https://a.espncdn.com/i/leaguelogos/soccer/500/10.png",
  },
  {
    slug: "fra.1",
    name: "Ligue 1",
    logoUrl: "https://a.espncdn.com/i/leaguelogos/soccer/500/9.png",
  },
];

const SEASONS = [2023, 2024, 2025, 2026];

async function seedBaseline() {
  console.log("🌱 [Seed] Checking and seeding baseline records (Leagues, Seasons, Admin)...");

  // 1. Ensure Leagues exist
  for (const league of LEAGUES) {
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
  console.log(`✅ [Seed] ${LEAGUES.length} leagues verified.`);

  // 2. Ensure Seasons exist
  for (const year of SEASONS) {
    await prisma.season.upsert({
      where: { year },
      update: {},
      create: { year },
    });
  }
  console.log(`✅ [Seed] ${SEASONS.length} seasons verified (${SEASONS.join(", ")}).`);

  // 3. Ensure Default Admin User exists
  const adminCount = await prisma.user.count();
  if (adminCount === 0) {
    const username = process.env.ADMIN_USERNAME || "admin";
    const password =
      process.env.ADMIN_PASSWORD ||
      process.env.ADMIN_DEFAULT_PASSWORD ||
      "admin123";
    const hashedPassword = hashPassword(password);

    await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        userType: "admin",
        name: "System Administrator",
        email: "admin@coleague.internal",
      },
    });
    console.log(`✅ [Seed] Created default admin user '${username}'.`);
  } else {
    console.log("✅ [Seed] Admin account already configured.");
  }
}

seedBaseline()
  .catch((e) => {
    console.warn("⚠️ [Seed] Baseline seed completed with warning:", e.message);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
