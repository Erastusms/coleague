"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { MatchItem, LineupPlayer, TeamRoster } from "@/types/match";
import {
  ArrowLeft,
  BarChart3,
  Users,
  AlertCircle,
  Sparkles,
  ArrowDown,
  ArrowUp,
  HelpCircle,
  MapPin,
} from "lucide-react";

export default function MatchDetailPage() {
  const params = useParams();
  const matchId = params?.id as string;

  const [match, setMatch] = useState<MatchItem | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"stats" | "lineups">("stats");
  const [lineupMode, setLineupMode] = useState<"all" | "home" | "away">("all");

  useEffect(() => {
    if (!matchId) return;

    let isCancelled = false;
    setLoading(true);
    setError(null);

    fetch(`/api/matches/${matchId}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Failed to load match detail (${res.status})`);
        }
        return res.json();
      })
      .then((data) => {
        if (!isCancelled) {
          if (data.match) {
            setMatch(data.match);
          } else {
            setError("Match not found.");
          }
        }
      })
      .catch((err) => {
        if (!isCancelled) {
          console.error("Error fetching match detail:", err);
          setError(err.message || "Failed to load match detail.");
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [matchId]);

  const formatMatchDate = (dateStr?: string) => {
    if (!dateStr) return "";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  // Helper to layout players for Single Team View (GK at bottom, attackers at top)
  const getSingleTeamPositions = (
    starters: LineupPlayer[],
    formationStr: string = "4-3-3"
  ) => {
    const parts = (formationStr || "4-3-3")
      .split("-")
      .map((n) => parseInt(n, 10))
      .filter((n) => !isNaN(n) && n > 0);

    const gk: LineupPlayer[] = [];
    const def: LineupPlayer[] = [];
    const mid: LineupPlayer[] = [];
    const fwd: LineupPlayer[] = [];

    for (const p of starters) {
      const pos = (p.positionAbbr || p.position || "").toUpperCase();
      if (pos === "G" || pos === "GK" || pos.includes("GOAL")) {
        gk.push(p);
      } else if (
        pos.includes("B") ||
        pos.includes("D") ||
        ["CB", "LB", "RB", "LWB", "RWB", "CD-L", "CD-R", "SW"].includes(pos)
      ) {
        def.push(p);
      } else if (
        pos.includes("M") ||
        ["DM", "CM", "AM", "LM", "RM", "AM-L", "AM-R"].includes(pos)
      ) {
        mid.push(p);
      } else {
        fwd.push(p);
      }
    }

    def.sort((a, b) => (a.formationPlace || 0) - (b.formationPlace || 0));
    mid.sort((a, b) => (a.formationPlace || 0) - (b.formationPlace || 0));
    fwd.sort((a, b) => (a.formationPlace || 0) - (b.formationPlace || 0));

    const lines: LineupPlayer[][] = [];
    lines.push(gk);

    const pool = [...def, ...mid, ...fwd];
    for (const count of parts) {
      if (pool.length >= count) {
        lines.push(pool.splice(0, count));
      }
    }
    if (pool.length > 0) {
      if (lines.length > 1) {
        lines[lines.length - 1].push(...pool);
      } else {
        lines.push(pool);
      }
    }

    const positions: Array<{ player: LineupPlayer; x: number; y: number }> = [];
    const rowCount = lines.length;
    lines.forEach((row, rIdx) => {
      // GK is near bottom (~80%), Attackers near top (~22%)
      const yPct = 80 - (rIdx / (rowCount - 1 || 1)) * 58;
      row.forEach((player, cIdx) => {
        const xPct = ((cIdx + 1) / (row.length + 1)) * 100;
        positions.push({
          player,
          x: Math.round(xPct),
          y: Math.round(yPct),
        });
      });
    });

    return positions;
  };

  // Helper to layout Head-to-Head "All" View on Full Pitch
  // Home team on bottom half (defending bottom, attacking up)
  // Away team on top half (defending top, attacking down)
  const getHeadToHeadPositions = (
    homeStarters: LineupPlayer[],
    homeFormation: string = "4-3-3",
    awayStarters: LineupPlayer[],
    awayFormation: string = "4-3-3"
  ) => {
    const splitIntoLines = (starters: LineupPlayer[], formationStr: string) => {
      const parts = (formationStr || "4-3-3")
        .split("-")
        .map((n) => parseInt(n, 10))
        .filter((n) => !isNaN(n) && n > 0);

      const gk: LineupPlayer[] = [];
      const def: LineupPlayer[] = [];
      const mid: LineupPlayer[] = [];
      const fwd: LineupPlayer[] = [];

      for (const p of starters) {
        const pos = (p.positionAbbr || p.position || "").toUpperCase();
        if (pos === "G" || pos === "GK" || pos.includes("GOAL")) {
          gk.push(p);
        } else if (
          pos.includes("B") ||
          pos.includes("D") ||
          ["CB", "LB", "RB", "LWB", "RWB", "CD-L", "CD-R", "SW"].includes(pos)
        ) {
          def.push(p);
        } else if (
          pos.includes("M") ||
          ["DM", "CM", "AM", "LM", "RM", "AM-L", "AM-R"].includes(pos)
        ) {
          mid.push(p);
        } else {
          fwd.push(p);
        }
      }

      def.sort((a, b) => (a.formationPlace || 0) - (b.formationPlace || 0));
      mid.sort((a, b) => (a.formationPlace || 0) - (b.formationPlace || 0));
      fwd.sort((a, b) => (a.formationPlace || 0) - (b.formationPlace || 0));

      const lines: LineupPlayer[][] = [gk];
      const pool = [...def, ...mid, ...fwd];
      for (const count of parts) {
        if (pool.length >= count) {
          lines.push(pool.splice(0, count));
        }
      }
      if (pool.length > 0) {
        if (lines.length > 1) {
          lines[lines.length - 1].push(...pool);
        } else {
          lines.push(pool);
        }
      }
      return lines;
    };

    const homeLines = splitIntoLines(homeStarters, homeFormation);
    const awayLines = splitIntoLines(awayStarters, awayFormation);

    const positions: Array<{
      player: LineupPlayer;
      x: number;
      y: number;
      team: "home" | "away";
    }> = [];

    // Home team: bottom half (y: 82% for GK up to 54% for Strikers)
    const homeRowCount = homeLines.length;
    homeLines.forEach((row, rIdx) => {
      const yPct = 82 - (rIdx / (homeRowCount - 1 || 1)) * 28;
      row.forEach((player, cIdx) => {
        const xPct = ((cIdx + 1) / (row.length + 1)) * 100;
        positions.push({
          player,
          x: Math.round(xPct),
          y: Math.round(yPct),
          team: "home",
        });
      });
    });

    // Away team: top half (y: 16.5% for GK down to 44% for Strikers)
    const awayRowCount = awayLines.length;
    awayLines.forEach((row, rIdx) => {
      const yPct = 16.5 + (rIdx / (awayRowCount - 1 || 1)) * 27.5;
      row.forEach((player, cIdx) => {
        const xPct = ((cIdx + 1) / (row.length + 1)) * 100;
        positions.push({
          player,
          x: Math.round(xPct),
          y: Math.round(yPct),
          team: "away",
        });
      });
    });

    return positions;
  };

  // 4-Corner Event Badges + Jersey Image container renderer
  const renderPlayerJerseyNode = (
    player: LineupPlayer,
    team: "home" | "away" = "home",
    size: "sm" | "md" = "sm"
  ) => {
    // Substantially enlarged jersey size (~48px–56px for clear prominence)
    const sizeClasses =
      size === "sm"
        ? "w-11 h-11 sm:w-13 sm:h-13"
        : "w-13 h-13 sm:w-16 sm:h-16";

    return (
      <div className={`relative ${sizeClasses} flex items-center justify-center mb-1`}>
        {/* Top-Left: Substituted Out badge (Only red downward arrow, no minute) */}
        {player.subbedOut && (
          <div
            className="absolute -top-1.5 -left-1.5 sm:-top-2 sm:-left-2 z-20 w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-rose-600 text-white shadow-md border-1.5 border-white flex items-center justify-center pointer-events-none"
            title={`Substituted out${player.subOutMinute ? ` at ${player.subOutMinute}` : ""}`}
          >
            <ArrowDown className="w-2.5 h-2.5 sm:w-3 sm:h-3 stroke-[3.5]" />
          </div>
        )}

        {/* Top-Right: Card badge (Vertical rectangular penalty card ~2:3 aspect ratio) */}
        {(player.yellowCards || player.redCards) && (
          <div className="absolute -top-1.5 -right-1.5 sm:-top-2 sm:-right-2 z-20 flex items-center gap-0.5 pointer-events-none">
            {player.redCards && player.redCards > 0 ? (
              <div
                className="w-3 h-4.5 sm:w-3.5 sm:h-5 rounded-[1px] bg-rose-600 shadow-md border border-white/90 ring-1 ring-rose-950/40"
                title="Red Card"
              />
            ) : player.yellowCards && player.yellowCards > 0 ? (
              <div
                className="w-3 h-4.5 sm:w-3.5 sm:h-5 rounded-[1px] bg-amber-400 shadow-md border border-white/90 ring-1 ring-amber-600/40"
                title="Yellow Card"
              />
            ) : null}
          </div>
        )}

        {/* Bottom-Left: Assist badge (Proportionately enlarged) */}
        {player.assists && player.assists > 0 && (
          <div
            className="absolute -bottom-1 -left-1.5 sm:-bottom-1.5 sm:-left-2 z-20 px-1.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-black bg-blue-600 text-white shadow-md border-1.5 border-white flex items-center gap-0.5 pointer-events-none"
            title={`${player.assists} Assist${player.assists > 1 ? "s" : ""}`}
          >
            <span className="text-[10px] sm:text-[11px] leading-none">👟</span>
            {player.assists > 1 && (
              <span className="text-[9px] sm:text-[10px] font-black leading-none">{player.assists}</span>
            )}
          </div>
        )}

        {/* Bottom-Right: Goal badge (Proportionately enlarged) */}
        {player.goals && player.goals > 0 && (
          <div
            className="absolute -bottom-1 -right-1.5 sm:-bottom-1.5 sm:-right-2 z-20 px-1.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-black bg-emerald-600 text-white shadow-md border-1.5 border-white flex items-center gap-0.5 pointer-events-none"
            title={`${player.goals} Goal${player.goals > 1 ? "s" : ""}`}
          >
            <span className="text-[10px] sm:text-[11px] leading-none">⚽</span>
            {player.goals > 1 && (
              <span className="text-[9px] sm:text-[10px] font-black leading-none">{player.goals}</span>
            )}
          </div>
        )}

        {/* Player Jersey Image or Fallback */}
        {player.jerseyUrl ? (
          <img
            src={player.jerseyUrl}
            alt={player.name}
            className="w-full h-full object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        ) : (
          <div
            className={`w-11 h-11 sm:w-13 sm:h-13 rounded-full text-white font-black text-sm sm:text-base border-2 border-white/60 flex items-center justify-center shadow-lg ${
              team === "home" ? "bg-indigo-700" : "bg-rose-700"
            }`}
          >
            {player.jersey || "?"}
          </div>
        )}
      </div>
    );
  };

  const rosters: TeamRoster[] = match?.rostersData || [];
  const homeRoster = rosters[0];
  const awayRoster = rosters[1];

  const sortedHomeSubs = [...(homeRoster?.substitutes || [])].sort((a, b) => {
    if (a.subbedIn && !b.subbedIn) return -1;
    if (!a.subbedIn && b.subbedIn) return 1;
    if (a.subbedIn && b.subbedIn) {
      const minA = parseInt(a.subInMinute?.replace("'", "") || "0", 10);
      const minB = parseInt(b.subInMinute?.replace("'", "") || "0", 10);
      return minA - minB;
    }
    return (a.jersey ? parseInt(a.jersey, 10) : 99) - (b.jersey ? parseInt(b.jersey, 10) : 99);
  });

  const sortedAwaySubs = [...(awayRoster?.substitutes || [])].sort((a, b) => {
    if (a.subbedIn && !b.subbedIn) return -1;
    if (!a.subbedIn && b.subbedIn) return 1;
    if (a.subbedIn && b.subbedIn) {
      const minA = parseInt(a.subInMinute?.replace("'", "") || "0", 10);
      const minB = parseInt(b.subInMinute?.replace("'", "") || "0", 10);
      return minA - minB;
    }
    return (a.jersey ? parseInt(a.jersey, 10) : 99) - (b.jersey ? parseInt(b.jersey, 10) : 99);
  });

  const homeScorers = (match?.scorersData || []).filter(
    (s) => s.teamId === match?.homeTeam.id
  );
  const awayScorers = (match?.scorersData || []).filter(
    (s) => s.teamId === match?.awayTeam.id
  );

  return (
    <div className="min-h-screen flex flex-col selection:bg-indigo-500 selection:text-white bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
      <Header />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        {/* Top Navigation / Breadcrumbs */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/fixtures"
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 shadow-xs transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Fixtures</span>
          </Link>

          {match && (
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <img
                src={match.leagueLogoUrl}
                alt={match.leagueName}
                className="w-4 h-4 object-contain"
              />
              <span>{match.leagueName}</span>
              <span>•</span>
              <span className="font-mono">Season {match.seasonYear}/{match.seasonYear + 1}</span>
            </div>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="py-20 flex flex-col items-center justify-center gap-4">
            <div className="w-10 h-10 rounded-full border-3 border-indigo-600 border-t-transparent animate-spin" />
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
              Loading match details, statistics, and tactical lineups...
            </p>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 rounded-3xl p-10 text-center max-w-lg mx-auto">
            <AlertCircle className="w-10 h-10 text-rose-600 dark:text-rose-400 mx-auto mb-3" />
            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-1">
              Match Unavailable
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-6">{error}</p>
            <Link
              href="/fixtures"
              className="px-5 py-2.5 bg-rose-600 text-white text-xs font-bold rounded-xl shadow cursor-pointer hover:bg-rose-700 transition-colors"
            >
              Return to Fixtures
            </Link>
          </div>
        )}

        {/* Main Content (Unrestricted, Natural Window Scrolling) */}
        {!loading && match && (
          <div className="space-y-8">
            {/* Scoreboard Card */}
            <div className="bg-white dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm dark:shadow-xl">
              {/* League & Date Header */}
              <div className="flex items-center justify-center gap-2 mb-6">
                <img
                  src={match.leagueLogoUrl}
                  alt={match.leagueName}
                  className="w-5 h-5 object-contain"
                />
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                  {match.leagueName}
                </span>
                <span className="text-slate-300 dark:text-slate-700 text-xs">•</span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {formatMatchDate(match.matchDate)}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 uppercase tracking-wider ml-1">
                  {match.status}
                </span>
              </div>

              {/* Clubs & Scores Display (Strictly Balanced 3-Column Symmetrical Layout) */}
              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 sm:gap-6 max-w-3xl mx-auto my-3">
                {/* Left Column (Home Team): Horizontally aligned towards center (justify-end items-center) */}
                <div className="flex items-center justify-end gap-2.5 sm:gap-4 min-w-0">
                  <div className="flex flex-col items-end text-right min-w-0">
                    <h2 className="text-sm sm:text-2xl font-black text-slate-900 dark:text-white truncate">
                      {match.homeTeam.shortDisplayName}
                    </h2>
                    <span className="text-[10px] sm:text-xs font-semibold text-slate-400 dark:text-slate-500">
                      Home
                    </span>
                  </div>
                  <div className="w-12 h-12 sm:w-20 sm:h-20 flex items-center justify-center flex-shrink-0">
                    <img
                      src={match.homeTeam.logoUrl}
                      alt={match.homeTeam.shortDisplayName}
                      className="max-w-full max-h-full object-contain drop-shadow-md"
                    />
                  </div>
                </div>

                {/* Center Column (Score): Perfectly centered horizontally & vertically */}
                <div className="flex items-center justify-center px-2 sm:px-6 flex-shrink-0">
                  <div className="flex items-center gap-2 sm:gap-4 leading-none">
                    <span className="text-3xl sm:text-6xl font-black text-slate-900 dark:text-white tabular-nums tracking-tight">
                      {match.homeScore}
                    </span>
                    <span className="text-slate-300 dark:text-slate-600 font-light text-xl sm:text-4xl pb-0.5">
                      -
                    </span>
                    <span className="text-3xl sm:text-6xl font-black text-slate-900 dark:text-white tabular-nums tracking-tight">
                      {match.awayScore}
                    </span>
                  </div>
                </div>

                {/* Right Column (Away Team): Horizontally aligned towards center (justify-start items-center) */}
                <div className="flex items-center justify-start gap-2.5 sm:gap-4 min-w-0">
                  <div className="w-12 h-12 sm:w-20 sm:h-20 flex items-center justify-center flex-shrink-0">
                    <img
                      src={match.awayTeam.logoUrl}
                      alt={match.awayTeam.shortDisplayName}
                      className="max-w-full max-h-full object-contain drop-shadow-md"
                    />
                  </div>
                  <div className="flex flex-col items-start text-left min-w-0">
                    <h2 className="text-sm sm:text-2xl font-black text-slate-900 dark:text-white truncate">
                      {match.awayTeam.shortDisplayName}
                    </h2>
                    <span className="text-[10px] sm:text-xs font-semibold text-slate-400 dark:text-slate-500">
                      Away
                    </span>
                  </div>
                </div>
              </div>

              {/* Goalscorers Row */}
              <div className="mt-8 pt-6 border-t border-slate-200/80 dark:border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs max-w-2xl mx-auto">
                {/* Home Scorers */}
                <div className="flex flex-col items-center sm:items-end text-center sm:text-right space-y-1.5">
                  {homeScorers.length > 0 ? (
                    homeScorers.map((s, idx) => (
                      <div
                        key={idx}
                        className="inline-flex items-center gap-1.5 text-slate-800 dark:text-slate-200"
                      >
                        <span className="font-semibold">{s.athleteName}</span>
                        <span className="text-slate-500 dark:text-slate-400 font-mono">
                          {s.minute}
                          {s.penaltyKick ? " (P)" : ""}
                          {s.ownGoal ? " (OG)" : ""}
                        </span>
                        <span className="text-[13px]">⚽</span>
                      </div>
                    ))
                  ) : (
                    <span className="text-slate-400 dark:text-slate-600 italic">
                      No home goals
                    </span>
                  )}
                </div>

                {/* Away Scorers */}
                <div className="flex flex-col items-center sm:items-start text-center sm:text-left space-y-1.5">
                  {awayScorers.length > 0 ? (
                    awayScorers.map((s, idx) => (
                      <div
                        key={idx}
                        className="inline-flex items-center gap-1.5 text-slate-800 dark:text-slate-200"
                      >
                        <span className="text-[13px]">⚽</span>
                        <span className="font-semibold">{s.athleteName}</span>
                        <span className="text-slate-500 dark:text-slate-400 font-mono">
                          {s.minute}
                          {s.penaltyKick ? " (P)" : ""}
                          {s.ownGoal ? " (OG)" : ""}
                        </span>
                      </div>
                    ))
                  ) : (
                    <span className="text-slate-400 dark:text-slate-600 italic">
                      No away goals
                    </span>
                  )}
                </div>
              </div>

              {/* Scoreboard Card Footer: Stadium (Left) & Attendance (Right) */}
              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-1.5 min-w-0">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 flex-shrink-0" />
                  <span className="font-medium truncate">{match.venue || "Stadium"}</span>
                </div>
                <div className="font-medium flex-shrink-0">
                  {match.attendance && match.attendance > 0
                    ? `Attendance: ${match.attendance.toLocaleString()}`
                    : "Attendance: N/A"}
                </div>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex items-center border-b border-slate-200 dark:border-slate-800 gap-2">
              <button
                onClick={() => setActiveTab("stats")}
                className={`flex items-center gap-2 py-3 px-5 font-bold text-xs uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                  activeTab === "stats"
                    ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400"
                    : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                <span>Match Stats</span>
              </button>

              <button
                onClick={() => setActiveTab("lineups")}
                className={`flex items-center gap-2 py-3 px-5 font-bold text-xs uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                  activeTab === "lineups"
                    ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400"
                    : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Lineups & Formations</span>
              </button>
            </div>

            {/* TAB 1: MATCH STATS (Natural Height, No Scrollboxes) */}
            {activeTab === "stats" && (
              <div className="bg-white dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-10 shadow-sm dark:shadow-xl">
                {match.statsData && match.statsData.length > 0 ? (
                  <div className="max-w-2xl mx-auto space-y-6">
                    {match.statsData.map((stat, idx) => {
                      const hRaw = stat.homeValue;
                      const aRaw = stat.awayValue;

                      const hNum =
                        typeof hRaw === "string"
                          ? parseFloat(hRaw.replace("%", "")) || 0
                          : Number(hRaw) || 0;
                      const aNum =
                        typeof aRaw === "string"
                          ? parseFloat(aRaw.replace("%", "")) || 0
                          : Number(aRaw) || 0;

                      const total = hNum + aNum;
                      const homePercent =
                        total > 0 ? Math.round((hNum / total) * 100) : 50;

                      return (
                        <div key={idx} className="space-y-2">
                          <div className="flex items-center justify-between text-xs sm:text-sm">
                            <span className="font-bold text-slate-900 dark:text-white tabular-nums w-16 text-left">
                              {hRaw}
                            </span>
                            <span className="font-semibold text-slate-700 dark:text-slate-300 text-xs sm:text-sm text-center flex-1">
                              {stat.label}
                            </span>
                            <span className="font-bold text-slate-900 dark:text-white tabular-nums w-16 text-right">
                              {aRaw}
                            </span>
                          </div>

                          <div className="h-2.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden flex">
                            <div
                              className="h-full bg-indigo-600 dark:bg-indigo-500 transition-all duration-500"
                              style={{ width: `${homePercent}%` }}
                            />
                            <div
                              className="h-full bg-amber-500 dark:bg-amber-400 transition-all duration-500"
                              style={{ width: `${100 - homePercent}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-400 text-sm">
                    Detailed match statistics are currently unavailable for this fixture.
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: LINEUPS & TACTICAL PITCH (Natural Height, 3-Way Switcher) */}
            {activeTab === "lineups" && (
              <div className="bg-white dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-10 shadow-sm dark:shadow-xl space-y-8">
                {/* 3-Way Lineup Switcher */}
                {rosters.length >= 2 && (
                  <div className="flex items-center justify-center">
                    <div className="inline-flex p-1 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-inner">
                      {/* All Button */}
                      <button
                        onClick={() => setLineupMode("all")}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          lineupMode === "all"
                            ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                            : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                        }`}
                      >
                        All (Head-to-Head)
                      </button>

                      {/* Home Team Button */}
                      <button
                        onClick={() => setLineupMode("home")}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          lineupMode === "home"
                            ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                            : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                        }`}
                      >
                        <span>{homeRoster.shortDisplayName}</span>
                        <span className="opacity-75 font-mono text-[10px] ml-1">
                          ({homeRoster.formation})
                        </span>
                      </button>

                      {/* Away Team Button */}
                      <button
                        onClick={() => setLineupMode("away")}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          lineupMode === "away"
                            ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                            : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                        }`}
                      >
                        <span>{awayRoster.shortDisplayName}</span>
                        <span className="opacity-75 font-mono text-[10px] ml-1">
                          ({awayRoster.formation})
                        </span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Tactical Pitch Board Canvas */}
                {rosters.length >= 2 ? (
                  <div className="relative w-full max-w-2xl mx-auto rounded-3xl overflow-hidden border border-slate-700/60 shadow-2xl bg-[#1e4a28] aspect-[682/1174]">
                    {/* Photorealistic Pitch Graphic Background */}
                    <img
                      src="/pitch.jpg"
                      alt="Tactical Pitch"
                      className="absolute inset-0 w-full h-full object-cover"
                    />

                    {/* Subtle Gradient Overlay for enhanced player readability */}
                    <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-black/25 pointer-events-none" />

                    {/* Team Info Placed in Perimeter Buffer Area Outside Chalk Lines */}
                    {lineupMode === "all" ? (
                      <>
                        {/* Top Margin (Away Team) */}
                        <div className="absolute top-3 sm:top-4 left-3.5 sm:left-5 right-3.5 sm:right-5 z-20 flex items-center justify-between pointer-events-none">
                          <div className="flex items-center gap-2 sm:gap-2.5 pointer-events-auto">
                            {/* Club Logo in solid white square box */}
                            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-white p-1 rounded-sm shadow-md flex items-center justify-center flex-shrink-0">
                              <img
                                src={awayRoster.teamLogo || match.awayTeam.logoUrl}
                                alt={awayRoster.shortDisplayName}
                                className="max-w-full max-h-full object-contain"
                              />
                            </div>
                            {/* Team Name in clean white text */}
                            <span className="text-white font-bold text-xs sm:text-base drop-shadow-md">
                              {awayRoster.shortDisplayName}
                            </span>
                          </div>
                          {/* Formation Badge in solid green background */}
                          <div className="px-2.5 py-0.5 sm:py-1 rounded-full sm:rounded-md bg-emerald-800/95 text-white text-[11px] sm:text-xs font-mono font-bold shadow-md pointer-events-auto">
                            {awayRoster.formation}
                          </div>
                        </div>

                        {/* Bottom Margin (Home Team) */}
                        <div className="absolute bottom-3 sm:bottom-4 left-3.5 sm:left-5 right-3.5 sm:right-5 z-20 flex items-center justify-between pointer-events-none">
                          <div className="flex items-center gap-2 sm:gap-2.5 pointer-events-auto">
                            {/* Club Logo in solid white square box */}
                            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-white p-1 rounded-sm shadow-md flex items-center justify-center flex-shrink-0">
                              <img
                                src={homeRoster.teamLogo || match.homeTeam.logoUrl}
                                alt={homeRoster.shortDisplayName}
                                className="max-w-full max-h-full object-contain"
                              />
                            </div>
                            {/* Team Name in clean white text */}
                            <span className="text-white font-bold text-xs sm:text-base drop-shadow-md">
                              {homeRoster.shortDisplayName}
                            </span>
                          </div>
                          {/* Formation Badge in solid green background */}
                          <div className="px-2.5 py-0.5 sm:py-1 rounded-full sm:rounded-md bg-emerald-800/95 text-white text-[11px] sm:text-xs font-mono font-bold shadow-md pointer-events-auto">
                            {homeRoster.formation}
                          </div>
                        </div>
                      </>
                    ) : (
                      /* Single Team Mode: Active Team at Top Margin */
                      <div className="absolute top-3 sm:top-4 left-3.5 sm:left-5 right-3.5 sm:right-5 z-20 flex items-center justify-between pointer-events-none">
                        <div className="flex items-center gap-2 sm:gap-2.5 pointer-events-auto">
                          {/* Club Logo in solid white square box */}
                          <div className="w-7 h-7 sm:w-8 sm:h-8 bg-white p-1 rounded-sm shadow-md flex items-center justify-center flex-shrink-0">
                            <img
                              src={
                                lineupMode === "home"
                                  ? homeRoster.teamLogo || match.homeTeam.logoUrl
                                  : awayRoster.teamLogo || match.awayTeam.logoUrl
                              }
                              alt={
                                lineupMode === "home"
                                  ? homeRoster.shortDisplayName
                                  : awayRoster.shortDisplayName
                              }
                              className="max-w-full max-h-full object-contain"
                            />
                          </div>
                          {/* Team Name in clean white text */}
                          <span className="text-white font-bold text-xs sm:text-base drop-shadow-md">
                            {lineupMode === "home"
                              ? homeRoster.shortDisplayName
                              : awayRoster.shortDisplayName}
                          </span>
                        </div>
                        {/* Formation Badge in solid green background */}
                        <div className="px-2.5 py-0.5 sm:py-1 rounded-full sm:rounded-md bg-emerald-800/95 text-white text-[11px] sm:text-xs font-mono font-bold shadow-md pointer-events-auto">
                          {lineupMode === "home"
                            ? homeRoster.formation
                            : awayRoster.formation}
                        </div>
                      </div>
                    )}

                    {/* Players Layer */}
                    <div className="absolute inset-0 z-10">
                      {lineupMode === "all"
                        ? getHeadToHeadPositions(
                            homeRoster.starters,
                            homeRoster.formation,
                            awayRoster.starters,
                            awayRoster.formation
                          ).map(({ player, x, y, team }, pIdx) => (
                            <div
                              key={pIdx}
                              className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group/player cursor-default transition-transform hover:scale-115"
                              style={{ left: `${x}%`, top: `${y}%` }}
                            >
                              {/* Player Jersey Image with 4-Corner Badges */}
                              {renderPlayerJerseyNode(player, team, "sm")}

                              {/* Player Name Label (Clean text with text-shadow, no background container) */}
                              <span
                                className="text-white font-medium text-[10px] sm:text-[11px] truncate max-w-[85px] sm:max-w-[100px] text-center leading-tight drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)] select-none pointer-events-none"
                                style={{ textShadow: "0 1px 3px rgba(0, 0, 0, 0.95), 0 1px 2px rgba(0, 0, 0, 0.9)" }}
                              >
                                {player.shortName || player.name}
                              </span>
                            </div>
                          ))
                        : getSingleTeamPositions(
                            lineupMode === "home"
                              ? homeRoster.starters
                              : awayRoster.starters,
                            lineupMode === "home"
                              ? homeRoster.formation
                              : awayRoster.formation
                          ).map(({ player, x, y }, pIdx) => (
                            <div
                              key={pIdx}
                              className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group/player cursor-default transition-transform hover:scale-115"
                              style={{ left: `${x}%`, top: `${y}%` }}
                            >
                              {/* Player Jersey Image with 4-Corner Badges */}
                              {renderPlayerJerseyNode(
                                player,
                                lineupMode === "home" ? "home" : "away",
                                "md"
                              )}

                              {/* Player Name Label (Clean text with text-shadow, no background container) */}
                              <span
                                className="text-white font-medium text-[11px] sm:text-xs truncate max-w-[95px] sm:max-w-[110px] text-center leading-tight drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)] select-none pointer-events-none"
                                style={{ textShadow: "0 1px 3px rgba(0, 0, 0, 0.95), 0 1px 2px rgba(0, 0, 0, 0.9)" }}
                              >
                                {player.shortName || player.name}
                              </span>
                            </div>
                          ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-400 text-sm">
                    Tactical lineup data is unavailable for this match.
                  </div>
                )}

                {/* Substitutes Section */}
                {rosters.length >= 2 && (
                  <div className="max-w-3xl mx-auto pt-6 border-t border-slate-200 dark:border-slate-800 space-y-6">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                        Substitutes
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Home Substitutes */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 pb-1.5 border-b border-slate-100 dark:border-slate-800">
                          <img
                            src={homeRoster.teamLogo || match.homeTeam.logoUrl}
                            alt={homeRoster.shortDisplayName}
                            className="w-4 h-4 object-contain"
                          />
                          <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            {homeRoster.shortDisplayName}
                          </h4>
                        </div>
                        <div className="space-y-1.5">
                          {sortedHomeSubs.map((sub, idx) => (
                            <div
                              key={idx}
                              className={`flex items-center justify-between p-2.5 rounded-xl border text-xs transition-colors ${
                                sub.subbedIn
                                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-950 dark:text-emerald-300"
                                  : "bg-slate-50 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300"
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <span className="w-5 h-5 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-mono font-bold text-[10px] flex items-center justify-center flex-shrink-0">
                                  {sub.jersey || "-"}
                                </span>
                                <div className="truncate">
                                  <span className="font-semibold block truncate">
                                    {sub.name}
                                  </span>
                                  <span className="text-[10px] text-slate-500 dark:text-slate-400">
                                    {sub.position}
                                  </span>
                                </div>
                              </div>

                              {/* Sub events & status */}
                              <div className="flex items-center gap-1.5 flex-shrink-0">
                                {/* Goals */}
                                {sub.goals && sub.goals > 0 ? (
                                  <span
                                    className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400"
                                    title={`${sub.goals} Goal${sub.goals > 1 ? "s" : ""}`}
                                  >
                                    <span>⚽</span>
                                    {sub.goals > 1 && <span>{sub.goals}</span>}
                                  </span>
                                ) : null}

                                {/* Assists */}
                                {sub.assists && sub.assists > 0 ? (
                                  <span
                                    className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/15 border border-blue-500/30 text-blue-700 dark:text-blue-400"
                                    title={`${sub.assists} Assist${sub.assists > 1 ? "s" : ""}`}
                                  >
                                    <span>👟</span>
                                    {sub.assists > 1 && <span>{sub.assists}</span>}
                                  </span>
                                ) : null}

                                {/* Yellow Card */}
                                {sub.yellowCards && sub.yellowCards > 0 ? (
                                  <span
                                    className="w-2.5 h-3.5 rounded-[1px] bg-amber-400 border border-amber-600/40 shadow-xs inline-block"
                                    title="Yellow Card"
                                  />
                                ) : null}

                                {/* Red Card */}
                                {sub.redCards && sub.redCards > 0 ? (
                                  <span
                                    className="w-2.5 h-3.5 rounded-[1px] bg-rose-600 border border-rose-700/40 shadow-xs inline-block"
                                    title="Red Card"
                                  />
                                ) : null}

                                {/* Only display badge if subbed in (NO UNUSED BADGES) */}
                                {sub.subbedIn && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-600 text-white flex-shrink-0 shadow-xs ml-0.5">
                                    <ArrowUp className="w-2.5 h-2.5 stroke-[3]" />
                                    <span>{sub.subInMinute || "Sub"}</span>
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Away Substitutes */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 pb-1.5 border-b border-slate-100 dark:border-slate-800">
                          <img
                            src={awayRoster.teamLogo || match.awayTeam.logoUrl}
                            alt={awayRoster.shortDisplayName}
                            className="w-4 h-4 object-contain"
                          />
                          <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            {awayRoster.shortDisplayName}
                          </h4>
                        </div>
                        <div className="space-y-1.5">
                          {sortedAwaySubs.map((sub, idx) => (
                            <div
                              key={idx}
                              className={`flex items-center justify-between p-2.5 rounded-xl border text-xs transition-colors ${
                                sub.subbedIn
                                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-950 dark:text-emerald-300"
                                  : "bg-slate-50 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300"
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <span className="w-5 h-5 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-mono font-bold text-[10px] flex items-center justify-center flex-shrink-0">
                                  {sub.jersey || "-"}
                                </span>
                                <div className="truncate">
                                  <span className="font-semibold block truncate">
                                    {sub.name}
                                  </span>
                                  <span className="text-[10px] text-slate-500 dark:text-slate-400">
                                    {sub.position}
                                  </span>
                                </div>
                              </div>

                              {/* Sub events & status */}
                              <div className="flex items-center gap-1.5 flex-shrink-0">
                                {/* Goals */}
                                {sub.goals && sub.goals > 0 ? (
                                  <span
                                    className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400"
                                    title={`${sub.goals} Goal${sub.goals > 1 ? "s" : ""}`}
                                  >
                                    <span>⚽</span>
                                    {sub.goals > 1 && <span>{sub.goals}</span>}
                                  </span>
                                ) : null}

                                {/* Assists */}
                                {sub.assists && sub.assists > 0 ? (
                                  <span
                                    className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/15 border border-blue-500/30 text-blue-700 dark:text-blue-400"
                                    title={`${sub.assists} Assist${sub.assists > 1 ? "s" : ""}`}
                                  >
                                    <span>👟</span>
                                    {sub.assists > 1 && <span>{sub.assists}</span>}
                                  </span>
                                ) : null}

                                {/* Yellow Card */}
                                {sub.yellowCards && sub.yellowCards > 0 ? (
                                  <span
                                    className="w-2.5 h-3.5 rounded-[1px] bg-amber-400 border border-amber-600/40 shadow-xs inline-block"
                                    title="Yellow Card"
                                  />
                                ) : null}

                                {/* Red Card */}
                                {sub.redCards && sub.redCards > 0 ? (
                                  <span
                                    className="w-2.5 h-3.5 rounded-[1px] bg-rose-600 border border-rose-700/40 shadow-xs inline-block"
                                    title="Red Card"
                                  />
                                ) : null}

                                {/* Only display badge if subbed in (NO UNUSED BADGES) */}
                                {sub.subbedIn && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-600 text-white flex-shrink-0 shadow-xs ml-0.5">
                                    <ArrowUp className="w-2.5 h-2.5 stroke-[3]" />
                                    <span>{sub.subInMinute || "Sub"}</span>
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Match Event Icon Legend Card */}
                <div className="max-w-3xl mx-auto pt-6 border-t border-slate-200 dark:border-slate-800">
                  <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-2 mb-3">
                      <HelpCircle className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                        Match Event Legend
                      </h4>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
                      {/* Goal */}
                      <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                        <span className="w-6 h-6 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-xs flex-shrink-0">
                          ⚽
                        </span>
                        <span className="font-medium">Goal</span>
                      </div>

                      {/* Assist */}
                      <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                        <span className="w-6 h-6 rounded-lg bg-blue-500/15 border border-blue-400/30 flex items-center justify-center text-xs flex-shrink-0">
                          👟
                        </span>
                        <span className="font-medium">Assist</span>
                      </div>

                      {/* Yellow Card (Vertical Rectangle) */}
                      <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                        <span className="w-6 h-6 rounded-lg bg-amber-500/15 border border-amber-400/30 flex items-center justify-center text-xs flex-shrink-0">
                          <span className="w-2.5 h-3.5 rounded-[1px] bg-amber-400 border border-amber-500 shadow-2xs inline-block" />
                        </span>
                        <span className="font-medium">Yellow Card</span>
                      </div>

                      {/* Red Card (Vertical Rectangle) */}
                      <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                        <span className="w-6 h-6 rounded-lg bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-xs flex-shrink-0">
                          <span className="w-2.5 h-3.5 rounded-[1px] bg-rose-600 border border-rose-700 shadow-2xs inline-block" />
                        </span>
                        <span className="font-medium">Red Card</span>
                      </div>

                      {/* Sub Out */}
                      <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                        <span className="w-6 h-6 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400 flex items-center justify-center text-xs flex-shrink-0">
                          <ArrowDown className="w-3.5 h-3.5 stroke-[2.5]" />
                        </span>
                        <span className="font-medium">Substituted Out</span>
                      </div>

                      {/* Sub In */}
                      <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                        <span className="w-6 h-6 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xs flex-shrink-0">
                          <ArrowUp className="w-3.5 h-3.5 stroke-[2.5]" />
                        </span>
                        <span className="font-medium">Substituted In</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
