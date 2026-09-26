import { NextRequest, NextResponse } from "next/server";
import { getCurrentAdmin, verifyPassword } from "@/lib/auth";
import { syncColeagueData } from "@/lib/sync";
import { prisma } from "@/lib/prisma";
import { SEASONS, SeasonYear } from "@/lib/constants";

export const maxDuration = 60; // Allow sufficient time for external ESPN API calls

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
            "Unauthorized: Valid admin session or admin credentials required to update ESPN data.",
        },
        { status: 401 }
      );
    }

    console.log(
      `[Admin Sync] Triggered by ${adminName}. Ingesting ESPN Standings, Top Scorers & Top Assists...`
    );

    const syncOptions: {
      seasons?: SeasonYear[];
      leagues?: string[];
    } = {};

    if (Array.isArray(body.seasons) && body.seasons.length > 0) {
      const validSeasons = body.seasons
        .map(Number)
        .filter((y: number): y is SeasonYear =>
          (SEASONS as readonly number[]).includes(y)
        );
      if (validSeasons.length > 0) {
        syncOptions.seasons = validSeasons;
      }
    }

    if (Array.isArray(body.leagues) && body.leagues.length > 0) {
      syncOptions.leagues = body.leagues.map(String);
    }

    const result = await syncColeagueData(syncOptions);

    return NextResponse.json({
      success: result.success,
      message: result.success
        ? "Successfully updated standings, top scorers, and top assists from ESPN API!"
        : "Sync completed with some warnings or errors.",
      triggeredBy: adminName,
      result: {
        leaguesProcessed: result.leaguesProcessed,
        teamsUpserted: result.teamsUpserted,
        standingsUpserted: result.standingsUpserted,
        playerStatsUpserted: result.playerStatsUpserted,
        durationSeconds: Number((result.durationMs / 1000).toFixed(2)),
        errors: result.errors,
      },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("Admin sync error:", error);
    return NextResponse.json(
      {
        error: "Failed to sync data from ESPN API: " + msg,
      },
      { status: 500 }
    );
  }
}
