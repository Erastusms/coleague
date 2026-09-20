import { NextRequest, NextResponse } from "next/server";
import { syncColeagueData } from "@/lib/sync";

function verifyCronSecret(req: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET || "your-cron-secret-key";
  const authHeader = req.headers.get("authorization");

  if (authHeader) {
    const [scheme, token] = authHeader.split(" ");
    if (scheme === "Bearer" && token === cronSecret) {
      return true;
    }
  }

  // Also allow ?secret= query parameter
  const { searchParams } = new URL(req.url);
  const secretParam = searchParams.get("secret");
  if (secretParam === cronSecret) {
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
