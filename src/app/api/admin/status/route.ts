import { NextRequest, NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const admin = await getCurrentAdmin(req);
    if (!admin) {
      return NextResponse.json(
        { error: "Unauthorized: Admin session required." },
        { status: 401 }
      );
    }

    const [
      teamCount,
      standingsCount,
      playerStatsCount,
      matchesCount,
      lastStanding,
      lastPlayerStat,
      lastMatch,
    ] = await Promise.all([
      prisma.team.count(),
      prisma.standing.count(),
      prisma.playerStat.count(),
      prisma.match.count(),
      prisma.standing.findFirst({
        orderBy: { updatedAt: "desc" },
        select: { updatedAt: true },
      }),
      prisma.playerStat.findFirst({
        orderBy: { updatedAt: "desc" },
        select: { updatedAt: true },
      }),
      prisma.match.findFirst({
        orderBy: { updatedAt: "desc" },
        select: { updatedAt: true },
      }),
    ]);

    return NextResponse.json({
      success: true,
      stats: {
        teamCount,
        standingsCount,
        playerStatsCount,
        matchesCount,
        lastStandingUpdated: lastStanding?.updatedAt || null,
        lastPlayerStatUpdated: lastPlayerStat?.updatedAt || null,
        lastMatchUpdated: lastMatch?.updatedAt || null,
      },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("Admin status error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve system status: " + msg },
      { status: 500 }
    );
  }
}
