import { NextRequest, NextResponse } from "next/server";
import { getCurrentAdmin, verifyPassword } from "@/lib/auth";
import { syncMatchesForSeasonAndLeague } from "@/lib/sync-matches";
import { prisma } from "@/lib/prisma";
import { SEASONS, LEAGUES } from "@/lib/constants";

export const maxDuration = 60; // Allow sufficient serverless execution time for ESPN API calls

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    let isAdmin = false;
    let adminName = "Admin";

    // 1. Check session cookie
    const sessionAdmin = await getCurrentAdmin(req);
    if (sessionAdmin) {
      isAdmin = true;
      adminName = sessionAdmin.name || sessionAdmin.username;
    } else if (body.username && body.password) {
      // 2. Allow direct credentials authentication
      const user = await prisma.user.findUnique({
        where: { username: String(body.username).trim() },
      });

      if (
        user &&
        verifyPassword(body.password, user.password) &&
        user.userType === "admin"
      ) {
        isAdmin = true;
        adminName = user.name || user.username;
      }
    }

    if (!isAdmin) {
      return NextResponse.json(
        {
          error:
            "Unauthorized: Valid admin session or admin credentials required to sync match fixtures.",
        },
        { status: 401 }
      );
    }

    // Validate season
    const season = Number(body.season);
    if (!season || isNaN(season) || !(SEASONS as readonly number[]).includes(season)) {
      return NextResponse.json(
        {
          error: `Invalid season: ${body.season}. Supported seasons: ${SEASONS.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Validate league
    const leagueSlug = String(body.league || "").trim().toLowerCase();
    const validLeague = LEAGUES.find((l) => l.slug.toLowerCase() === leagueSlug);
    if (!validLeague) {
      return NextResponse.json(
        {
          error: `Invalid league slug: "${body.league}". Supported leagues: ${LEAGUES.map((l) => l.slug).join(", ")}`,
        },
        { status: 400 }
      );
    }

    console.log(
      `[Admin Match Sync] Triggered by ${adminName} for ${validLeague.name} (${validLeague.slug}) Season ${season}...`
    );

    const result = await syncMatchesForSeasonAndLeague({
      season,
      league: validLeague.slug,
      topSummaryLimit: 10,
    });

    return NextResponse.json({
      success: result.success,
      message: result.success
        ? `Successfully synced matches for ${result.leagueName} (${result.season} season)!`
        : `Match sync completed with errors.`,
      triggeredBy: adminName,
      result: {
        season: result.season,
        leagueSlug: result.leagueSlug,
        leagueName: result.leagueName,
        matchesIngested: result.matchesIngested,
        teamsUpserted: result.teamsUpserted,
        summariesFetched: result.summariesFetched,
        durationSeconds: Number((result.durationMs / 1000).toFixed(2)),
        errors: result.errors,
      },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("Admin match sync error:", error);
    return NextResponse.json(
      {
        error: "Failed to sync match fixtures from ESPN API: " + msg,
      },
      { status: 500 }
    );
  }
}
