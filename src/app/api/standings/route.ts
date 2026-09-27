import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/ratelimit";
import { DEFAULT_LEAGUES, DEFAULT_SEASON, getLeagueDarkLogo } from "@/lib/constants";

export async function GET(req: NextRequest) {
  // 1. Rate Limiting Check (60 req/min per IP)
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
    const seasonRecord = await prisma.season.findUnique({
      where: { year },
    });

    if (!seasonRecord) {
      return NextResponse.json(
        { error: `Season ${year} not found.` },
        { status: 404 }
      );
    }

    // Fetch standings for the season and selected leagues
    const rawStandings = await prisma.standing.findMany({
      where: {
        seasonId: seasonRecord.id,
        team: {
          leagueId: {
            in: selectedLeagues,
          },
        },
      },
      include: {
        team: {
          include: {
            league: true,
          },
        },
      },
    });

    // Combined sorting:
    // 1. Points DESC
    // 2. Goal Difference DESC
    // 3. Goals For DESC
    // 4. Wins DESC
    const sorted = [...rawStandings].sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.goalDifference !== a.goalDifference)
        return b.goalDifference - a.goalDifference;
      if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
      return b.wins - a.wins;
    });

    // Row Limit Rule:
    // Always return the top 20 clubs across the selected leagues.
    // Exception: If the combined total clubs available in the selected league(s) is fewer than 20
    // (e.g., selecting only Bundesliga which has 18 clubs), return all clubs from that selection.
    const totalAvailable = sorted.length;
    const limit = totalAvailable < 20 ? totalAvailable : 20;
    const sliced = sorted.slice(0, limit);

    // Re-assign combined ranks 1..N
    const standings = sliced.map((item, index) => ({
      rank: index + 1,
      originalLeagueRank: item.rank,
      team: {
        id: item.team.id,
        name: item.team.name,
        shortDisplayName: item.team.shortDisplayName,
        logoUrl: item.team.logoUrl,
      },
      league: {
        id: item.team.league.id,
        slug: item.team.league.slug,
        name: item.team.league.name,
        logoUrl: item.team.league.logoUrl,
        darkLogoUrl: item.team.league.darkLogoUrl || getLeagueDarkLogo(item.team.league.slug),
      },
      gamesPlayed: item.gamesPlayed,
      wins: item.wins,
      draws: item.draws,
      losses: item.losses,
      goalDifference: item.goalDifference,
      goalsFor: item.goalsFor,
      goalsAgainst: item.goalsAgainst,
      points: item.points,
      form: Array.isArray(item.form) ? item.form : [],
      updatedAt: item.updatedAt,
    }));

    return NextResponse.json(
      {
        season: year,
        leagues: selectedLeagues,
        totalAvailable,
        returnedCount: standings.length,
        standings,
      },
      {
        headers: {
          "X-RateLimit-Limit": String(rl.limit),
          "X-RateLimit-Remaining": String(rl.remaining),
        },
      }
    );
  } catch (error: any) {
    console.error("Error in /api/standings:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
