import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/ratelimit";
import { fetchMatchSummary } from "@/lib/espn";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

  const { id } = await params;

  try {
    let match = await prisma.match.findUnique({
      where: { id },
      include: {
        league: true,
        homeTeam: true,
        awayTeam: true,
      },
    });

    if (!match) {
      return NextResponse.json(
        { error: `Match with ID ${id} not found.` },
        { status: 404 }
      );
    }

    // Check if detailed summary is missing or empty
    const rostersArray = Array.isArray(match.rostersData)
      ? match.rostersData
      : [];
    const statsArray = Array.isArray(match.statsData) ? match.statsData : [];

    if (rostersArray.length === 0 || statsArray.length === 0) {
      try {
        const summary = await fetchMatchSummary(match.league.slug, match.id);
        if (summary) {
          match = await prisma.match.update({
            where: { id: match.id },
            data: {
              scorersData: summary.scorers as any,
              statsData: summary.stats as any,
              rostersData: summary.rosters as any,
              venue: summary.venue || undefined,
              attendance: summary.attendance || undefined,
            },
            include: {
              league: true,
              homeTeam: true,
              awayTeam: true,
            },
          });
        }
      } catch (fetchErr) {
        console.error(`Failed to lazily fetch match summary for ${id}:`, fetchErr);
      }
    }

    const formattedMatch = {
      id: match.id,
      leagueId: match.leagueId,
      leagueSlug: match.league.slug,
      leagueName: match.league.name,
      leagueLogoUrl: match.league.logoUrl,
      seasonYear: match.seasonYear,
      matchDate: match.matchDate.toISOString(),
      status: match.status,
      homeTeam: {
        id: match.homeTeam.id,
        name: match.homeTeam.name,
        shortDisplayName: match.homeTeam.shortDisplayName,
        logoUrl: match.homeTeam.logoUrl,
      },
      awayTeam: {
        id: match.awayTeam.id,
        name: match.awayTeam.name,
        shortDisplayName: match.awayTeam.shortDisplayName,
        logoUrl: match.awayTeam.logoUrl,
      },
      homeScore: match.homeScore,
      awayScore: match.awayScore,
      totalGoals: match.totalGoals,
      scorersData: match.scorersData,
      statsData: match.statsData,
      rostersData: match.rostersData,
      venue: match.venue || "",
      attendance: match.attendance || 0,
    };

    return NextResponse.json(
      { match: formattedMatch },
      {
        headers: {
          "X-RateLimit-Limit": String(rl.limit),
          "X-RateLimit-Remaining": String(rl.remaining),
        },
      }
    );
  } catch (error: any) {
    console.error(`Error in /api/matches/${id}:`, error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
