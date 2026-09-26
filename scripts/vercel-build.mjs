import { execSync } from "child_process";

// Attempt to load .env file if running locally in Node 20+
if (typeof process.loadEnvFile === "function") {
  try {
    process.loadEnvFile();
  } catch {
    // In production/Vercel, environment variables are injected directly
  }
}

console.log("=========================================");
console.log("🚀 Coleague - Vercel Build Pipeline");
console.log("=========================================");

// 1. Generate Prisma Client
console.log("\n📦 1. Generating Prisma Client...");
try {
  execSync("npx prisma generate", { stdio: "inherit" });
  console.log("✅ Prisma Client generated successfully.");
} catch (err) {
  if (process.env.VERCEL) {
    console.error("❌ Failed to generate Prisma Client on Vercel:", err.message);
    process.exit(1);
  } else {
    console.warn("⚠️ Warning: Prisma Client generation encountered a local file lock (e.g. active dev server). Proceeding with existing client...");
  }
}

// 2. Database Migrations & Baseline Seeding
if (!process.env.DATABASE_URL) {
  const vercelPg =
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_URL_NON_POOLING;
  if (vercelPg) {
    console.log("🔗 Detected Vercel Postgres connection URL. Aliasing to DATABASE_URL...");
    process.env.DATABASE_URL = vercelPg;
  }
}

if (process.env.SKIP_MIGRATIONS === "true") {
  console.log("\n⏭️ 2. SKIP_MIGRATIONS=true detected. Skipping database migrations.");
} else if (process.env.DATABASE_URL) {
  console.log("\n🔄 2. Applying database migrations (prisma migrate deploy)...");
  try {
    execSync("npx prisma migrate deploy", { stdio: "inherit", env: process.env });
    console.log("✅ Migrations applied successfully.");

    console.log("\n🌱 Checking baseline seed (Leagues, Seasons, Admin)...");
    execSync("node scripts/seed-baseline.mjs", { stdio: "inherit", env: process.env });
  } catch (err) {
    console.error("❌ Database migration or seeding failed:", err.message);
    process.exit(1);
  }
} else {
  console.log(
    "\nℹ️ 2. DATABASE_URL not detected in environment.\n" +
    "   Skipping database migrations during build.\n" +
    "   Remember to configure DATABASE_URL in your Vercel Project Settings > Environment Variables."
  );
}

// 3. Next.js Production Build
console.log("\n⚡ 3. Building Next.js application (next build)...");
try {
  execSync("npx next build", { stdio: "inherit" });
  console.log("\n🎉 Vercel build finished successfully!");
} catch (err) {
  console.error("❌ Next.js build failed:", err.message);
  process.exit(1);
}
