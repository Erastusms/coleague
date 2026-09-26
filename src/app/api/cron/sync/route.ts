import { NextRequest, NextResponse } from "next/server";
import { syncColeagueData } from "@/lib/sync";

export const maxDuration = 60; // Allow sufficient serverless execution time for ESPN API sync

function verifyCronSecret(req: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization");

  // 1. If CRON_SECRET is configured, strictly enforce bearer token or query secret
  if (cronSecret) {
    if (authHeader) {
      const [scheme, token] = authHeader.split(" ");
      if (scheme === "Bearer" && token === cronSecret) {
        return true;
      }
    }
    const { searchParams } = new URL(req.url);
    const secretParam = searchParams.get("secret");
    if (secretParam === cronSecret) {
      return true;
    }
    return false;
  }

  // 2. If CRON_SECRET is left blank:
  // Allow Vercel's scheduled cron job header or local development requests
  const userAgent = req.headers.get("user-agent") || "";
  if (
    process.env.NODE_ENV === "development" ||
    userAgent.toLowerCase().includes("vercel-cron")
  ) {
    return true;
  }

  // Also support fallback development key for manual testing
  const { searchParams } = new URL(req.url);
  if (searchParams.get("secret") === "your-cron-secret-key") {
    return true;
  }

  return false;
}

export async function GET(req: NextRequest) {
  if (!verifyCronSecret(req)) {
    return NextResponse.json(
      { error: "Unauthorized: Invalid or missing bearer token." },
      { status: 401 }
    );
  }

  const result = await syncColeagueData();
  return NextResponse.json({
    message: "Sync job completed",
    result,
  });
}

export async function POST(req: NextRequest) {
  if (!verifyCronSecret(req)) {
    return NextResponse.json(
      { error: "Unauthorized: Invalid or missing bearer token." },
      { status: 401 }
    );
  }

  const result = await syncColeagueData();
  return NextResponse.json({
    message: "Sync job completed",
    result,
  });
}
