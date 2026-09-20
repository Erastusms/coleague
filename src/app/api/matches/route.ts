import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/ratelimit";
import { DEFAULT_LEAGUES, DEFAULT_SEASON } from "@/lib/constants";

export async function GET(req: NextRequest) {
  // Rate Limiting Check (60 req/min per IP)
  const rl = checkRateLimit(req, { maxTokens: 60, refillRate: 1 });
  if (!rl.success) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: {
          "Retry-After": String(rl.reset),
          "X-RateLimit-Limit": String(rl.limit),
          "X-RateLimit-Remaining": String(rl.remaining),
        },
      }
    );
  }

  const { searchParams } = new URL(req.url);
  const seasonParam = searchParams.get("seasons") || searchParams.get("season");
  const year = seasonParam ? parseInt(seasonParam, 10) : DEFAULT_SEASON;

  const leaguesParam = searchParams.get("leagues");
  const selectedLeagues = leaguesParam
    ? leaguesParam
        .split(",")
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean)
    : DEFAULT_LEAGUES;

  try {
    // Only seasons 2025 and 2026 have match data
    if (year !== 2026 && year !== 2025) {
      return NextResponse.json(
        {
          season: year,
          leagues: selectedLeagues,
          totalAvailable: 0,
          returnedCount: 0,
          matches: [],
        },
        {
          headers: {
            "X-RateLimit-Limit": String(rl.limit),
            "X-RateLimit-Remaining": String(rl.remaining),
          },
        }
      );
    }

    const matches = await prisma.match.findMany({
      where: {
        seasonYear: year,
        leagueId: {
          in: selectedLeagues,
        },
      },
      include: {
        league: true,
        homeTeam: true,
        awayTeam: true,
      },
      orderBy: [
        { totalGoals: "desc" },
        { matchDate: "desc" },
      ],
      take: 10,
    });

    const formattedMatches = matches.map((m) => ({
      id: m.id,
      leagueId: m.leagueId,
      leagueSlug: m.league.slug,
      leagueName: m.league.name,
      leagueLogoUrl: m.league.logoUrl,
      seasonYear: m.seasonYear,
      matchDate: m.matchDate.toISOString(),
      status: m.status,
      homeTeam: {
        id: m.homeTeam.id,
        name: m.homeTeam.name,
        shortDisplayName: m.homeTeam.shortDisplayName,
        logoUrl: m.homeTeam.logoUrl,
      },
      awayTeam: {
        id: m.awayTeam.id,
        name: m.awayTeam.name,
        shortDisplayName: m.awayTeam.shortDisplayName,
        logoUrl: m.awayTeam.logoUrl,
      },
      homeScore: m.homeScore,
      awayScore: m.awayScore,
      totalGoals: m.totalGoals,
      scorersData: m.scorersData,
      statsData: m.statsData,
      rostersData: m.rostersData,
      venue: m.venue || "",
      attendance: m.attendance || 0,
    }));

    return NextResponse.json(
      {
        season: year,
        leagues: selectedLeagues,
        totalAvailable: formattedMatches.length,
        returnedCount: formattedMatches.length,
        matches: formattedMatches,
      },
      {
        headers: {
          "X-RateLimit-Limit": String(rl.limit),
          "X-RateLimit-Remaining": String(rl.remaining),
        },
      }
    );
  } catch (error: any) {
    console.error("Error in /api/matches:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
