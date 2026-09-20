import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/ratelimit";
import { DEFAULT_LEAGUES, DEFAULT_SEASON } from "@/lib/constants";

export async function GET(req: NextRequest) {
  // Rate limiting check
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

    // Fetch player stats for the season & selected leagues
    const allStats = await prisma.playerStat.findMany({
      where: {
        seasonId: seasonRecord.id,
        leagueId: {
          in: selectedLeagues,
        },
      },
      include: {
        team: true,
        league: true,
      },
    });

    // Top Scorers: Goals DESC, then Assists DESC, then Minutes ASC
    const sortedScorers = [...allStats]
      .filter((s) => s.goals > 0)
      .sort((a, b) => {
        if (b.goals !== a.goals) return b.goals - a.goals;
        if (b.assists !== a.assists) return b.assists - a.assists;
        return a.minutes - b.minutes;
      })
      .slice(0, 10)
      .map((item, index) => ({
        rank: index + 1,
        athleteId: item.athleteId,
        athleteName: item.athleteName,
        team: {
          id: item.team.id,
          name: item.team.name,
          shortDisplayName: item.team.shortDisplayName,
          logoUrl: item.team.logoUrl,
        },
        league: {
          id: item.league.id,
          slug: item.league.slug,
          name: item.league.name,
          logoUrl: item.league.logoUrl,
        },
        goals: item.goals,
        assists: item.assists,
        appearances: item.appearances,
        minutes: item.minutes,
      }));

    // Top Assists: Assists DESC, then Goals DESC, then Minutes ASC
    const sortedAssists = [...allStats]
      .filter((s) => s.assists > 0)
      .sort((a, b) => {
        if (b.assists !== a.assists) return b.assists - a.assists;
        if (b.goals !== a.goals) return b.goals - a.goals;
        return a.minutes - b.minutes;
      })
      .slice(0, 10)
      .map((item, index) => ({
        rank: index + 1,
        athleteId: item.athleteId,
        athleteName: item.athleteName,
        team: {
          id: item.team.id,
          name: item.team.name,
          shortDisplayName: item.team.shortDisplayName,
          logoUrl: item.team.logoUrl,
        },
        league: {
          id: item.league.id,
          slug: item.league.slug,
          name: item.league.name,
          logoUrl: item.league.logoUrl,
        },
        goals: item.goals,
        assists: item.assists,
        appearances: item.appearances,
        minutes: item.minutes,
      }));

    return NextResponse.json(
      {
        season: year,
        leagues: selectedLeagues,
        topScorers: sortedScorers,
        topAssists: sortedAssists,
      },
      {
        headers: {
          "X-RateLimit-Limit": String(rl.limit),
          "X-RateLimit-Remaining": String(rl.remaining),
        },
      }
    );
  } catch (error: any) {
    console.error("Error in /api/leaders:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
