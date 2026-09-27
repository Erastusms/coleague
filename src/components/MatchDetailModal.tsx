"use client";

import React, { useState, useEffect } from "react";
import { MatchItem, LineupPlayer, TeamRoster } from "@/types/match";
import { X, Sparkles, Shield, Users, BarChart3 } from "lucide-react";
import { getLeagueDarkLogo } from "@/lib/constants";

interface MatchDetailModalProps {
  match: MatchItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export const MatchDetailModal: React.FC<MatchDetailModalProps> = ({
  match,
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<"stats" | "lineups">("stats");
  const [activeTeamIdx, setActiveTeamIdx] = useState<0 | 1>(0);
  const [loadedMatch, setLoadedMatch] = useState<MatchItem | null>(match);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);

  // Sync internal state with prop
  useEffect(() => {
    if (match) {
      setLoadedMatch(match);
      setActiveTab("stats");
      setActiveTeamIdx(0);

      // If summary data (stats or rosters) is missing, fetch from API
      const hasStats = match.statsData && match.statsData.length > 0;
      const hasRosters = match.rostersData && match.rostersData.length > 0;

      if (!hasStats || !hasRosters) {
        setIsLoadingSummary(true);
        fetch(`/api/matches/${match.id}`)
          .then((res) => res.json())
          .then((data) => {
            if (data.match) {
              setLoadedMatch(data.match);
            }
          })
          .catch((err) => console.error("Error fetching match detail:", err))
          .finally(() => setIsLoadingSummary(false));
      }
    }
  }, [match]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "auto";
    };
  }, [isOpen, onClose]);

  if (!isOpen || !loadedMatch) return null;

  const currentMatch = loadedMatch;

  const formatMatchDate = (dateStr: string) => {
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

  // Group scorers by team
  const homeScorers = (currentMatch.scorersData || []).filter(
    (s) => s.teamId === currentMatch.homeTeam.id
  );
  const awayScorers = (currentMatch.scorersData || []).filter(
    (s) => s.teamId === currentMatch.awayTeam.id
  );

  // Fallback if teamId didn't match directly
  const unassignedScorers = (currentMatch.scorersData || []).filter(
    (s) =>
      s.teamId !== currentMatch.homeTeam.id &&
      s.teamId !== currentMatch.awayTeam.id
  );

  // Rosters
  const rosters: TeamRoster[] = currentMatch.rostersData || [];
  const activeRoster: TeamRoster | undefined = rosters[activeTeamIdx];

  // Helper to position 11 starters on the tactical pitch
  const getPitchPositions = (
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

    const positions: Array<{
      player: LineupPlayer;
      x: number;
      y: number;
    }> = [];

    const rowCount = lines.length;
    lines.forEach((row, rIdx) => {
      // GK is at bottom (~88%), Attackers near top (~15%)
      const yPct = 88 - (rIdx / (rowCount - 1 || 1)) * 73;
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto bg-slate-950/70 backdrop-blur-md transition-opacity duration-200 animate-in fade-in">
      <div
        className="relative w-full max-w-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Floating Close Button */}
        <button
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header & Google-style Scoreboard */}
        <div className="p-6 sm:p-8 bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 border-b border-slate-200 dark:border-slate-800">
          {/* League & Date Subtitle */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <img
              src={currentMatch.leagueLogoUrl}
              alt={currentMatch.leagueName}
              title={currentMatch.leagueName}
              className="w-5 h-5 object-contain dark:hidden"
            />
            <img
              src={currentMatch.leagueDarkLogoUrl || getLeagueDarkLogo(currentMatch.leagueSlug || currentMatch.leagueLogoUrl)}
              alt={currentMatch.leagueName}
              title={currentMatch.leagueName}
              className="w-5 h-5 object-contain hidden dark:block"
            />
            <span className="hidden md:inline text-xs font-bold text-slate-600 dark:text-slate-300">
              {currentMatch.leagueName}
            </span>
            <span className="hidden md:inline text-slate-300 dark:text-slate-700 text-xs">•</span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {formatMatchDate(currentMatch.matchDate)}
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 uppercase tracking-wider ml-1">
              {currentMatch.status}
            </span>
          </div>

          {/* Teams and Scoreline */}
          <div className="grid grid-cols-7 items-center gap-2 sm:gap-4 max-w-lg mx-auto">
            {/* Home Club */}
            <div className="col-span-3 flex flex-col items-center text-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 mb-2 flex items-center justify-center">
                <img
                  src={currentMatch.homeTeam.logoUrl}
                  alt={currentMatch.homeTeam.shortDisplayName}
                  className="max-w-full max-h-full object-contain drop-shadow-sm"
                />
              </div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white line-clamp-1">
                {currentMatch.homeTeam.shortDisplayName}
              </h3>
              <span className="text-xs text-slate-400 font-medium">Home</span>
            </div>

            {/* Score */}
            <div className="col-span-1 flex flex-col items-center justify-center">
              <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 shadow-inner">
                <span className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white tabular-nums">
                  {currentMatch.homeScore}
                </span>
                <span className="text-slate-400 dark:text-slate-500 font-bold text-lg sm:text-2xl">
                  -
                </span>
                <span className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white tabular-nums">
                  {currentMatch.awayScore}
                </span>
              </div>
              <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 mt-2">
                {currentMatch.totalGoals} Goals
              </span>
            </div>

            {/* Away Club */}
            <div className="col-span-3 flex flex-col items-center text-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 mb-2 flex items-center justify-center">
                <img
                  src={currentMatch.awayTeam.logoUrl}
                  alt={currentMatch.awayTeam.shortDisplayName}
                  className="max-w-full max-h-full object-contain drop-shadow-sm"
                />
              </div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white line-clamp-1">
                {currentMatch.awayTeam.shortDisplayName}
              </h3>
              <span className="text-xs text-slate-400 font-medium">Away</span>
            </div>
          </div>

          {/* Goalscorers Row */}
          <div className="mt-6 pt-5 border-t border-slate-200/80 dark:border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {/* Home Scorers */}
            <div className="flex flex-col items-center sm:items-end text-center sm:text-right space-y-1">
              {homeScorers.length > 0 ? (
                homeScorers.map((s, idx) => (
                  <div
                    key={idx}
                    className="inline-flex items-center gap-1.5 text-slate-700 dark:text-slate-300"
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
            <div className="flex flex-col items-center sm:items-start text-center sm:text-left space-y-1">
              {awayScorers.length > 0 ? (
                awayScorers.map((s, idx) => (
                  <div
                    key={idx}
                    className="inline-flex items-center gap-1.5 text-slate-700 dark:text-slate-300"
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
        </div>

        {/* Tab Navigation (Google Sports Style) */}
        <div className="flex items-center border-b border-slate-200 dark:border-slate-800 px-6 bg-slate-50/70 dark:bg-slate-950/40">
          <button
            onClick={() => setActiveTab("stats")}
            className={`flex items-center gap-2 py-3.5 px-4 font-bold text-xs uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
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
            className={`flex items-center gap-2 py-3.5 px-4 font-bold text-xs uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
              activeTab === "lineups"
                ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Lineups & Formations</span>
          </button>
        </div>

        {/* Modal Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoadingSummary && (
            <div className="py-12 flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Loading match statistics and rosters...
              </p>
            </div>
          )}

          {/* TAB 1: MATCH STATS */}
          {!isLoadingSummary && activeTab === "stats" && (
            <div className="max-w-xl mx-auto space-y-5 py-2">
              {currentMatch.statsData && currentMatch.statsData.length > 0 ? (
                currentMatch.statsData.map((stat, idx) => {
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
                    <div key={idx} className="space-y-1.5">
                      {/* Metric Values & Center Label */}
                      <div className="flex items-center justify-between text-xs sm:text-sm">
                        <span className="font-bold text-slate-900 dark:text-white tabular-nums w-14 text-left">
                          {hRaw}
                        </span>
                        <span className="font-semibold text-slate-600 dark:text-slate-300 text-xs text-center flex-1">
                          {stat.label}
                        </span>
                        <span className="font-bold text-slate-900 dark:text-white tabular-nums w-14 text-right">
                          {aRaw}
                        </span>
                      </div>

                      {/* Google Sports Comparative Horizontal Bar */}
                      <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden flex">
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
                })
              ) : (
                <div className="text-center py-12 text-slate-400 text-xs">
                  Detailed match statistics are currently unavailable.
                </div>
              )}
            </div>
          )}

          {/* TAB 2: LINEUPS & FORMATIONS */}
          {!isLoadingSummary && activeTab === "lineups" && (
            <div className="space-y-6">
              {/* Team Selector Toggle Pills */}
              {rosters.length >= 2 && (
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={() => setActiveTeamIdx(0)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      activeTeamIdx === 0
                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                        : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200"
                    }`}
                  >
                    <span>{rosters[0].shortDisplayName}</span>
                    <span className="opacity-75 font-mono text-[11px]">
                      ({rosters[0].formation || "4-3-3"})
                    </span>
                  </button>

                  <button
                    onClick={() => setActiveTeamIdx(1)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      activeTeamIdx === 1
                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                        : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200"
                    }`}
                  >
                    <span>{rosters[1].shortDisplayName}</span>
                    <span className="opacity-75 font-mono text-[11px]">
                      ({rosters[1].formation || "4-3-3"})
                    </span>
                  </button>
                </div>
              )}

              {activeRoster ? (
                <>
                  {/* Tactical Pitch Container */}
                  <div className="relative w-full max-w-lg mx-auto rounded-2xl overflow-hidden border border-slate-700/60 shadow-2xl bg-emerald-900 aspect-[3/4] sm:aspect-[4/5] min-h-[460px]">
                    {/* Realistic Pitch Background Asset */}
                    <img
                      src="/pitch.jpg"
                      alt="Tactical Pitch"
                      className="absolute inset-0 w-full h-full object-cover opacity-85"
                    />

                    {/* Dark gradient overlay for contrast */}
                    <div className="absolute inset-0 bg-gradient-to-b from-slate-950/40 via-transparent to-slate-950/50 pointer-events-none" />

                    {/* Team Formation Label Overlay */}
                    <div className="absolute top-3 left-3 z-10 px-2.5 py-1 rounded-lg bg-slate-950/80 backdrop-blur-sm border border-white/15 text-white text-[11px] font-bold">
                      {activeRoster.shortDisplayName} • {activeRoster.formation}
                    </div>

                    {/* Starters Layer */}
                    <div className="absolute inset-0 z-10">
                      {getPitchPositions(
                        activeRoster.starters,
                        activeRoster.formation
                      ).map(({ player, x, y }, pIdx) => {
                        return (
                          <div
                            key={pIdx}
                            className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group/player cursor-default transition-transform hover:scale-110"
                            style={{
                              left: `${x}%`,
                              top: `${y}%`,
                            }}
                          >
                            {/* Jersey / Player Icon */}
                            <div className="relative w-9 h-9 sm:w-11 sm:h-11 flex items-center justify-center mb-1">
                              {player.jerseyUrl ? (
                                <img
                                  src={player.jerseyUrl}
                                  alt={player.name}
                                  className="w-full h-full object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
                                  onError={(e) => {
                                    // Fallback to number badge if image fails
                                    e.currentTarget.style.display = "none";
                                  }}
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-black text-xs border border-white/40 flex items-center justify-center shadow-lg">
                                  {player.jersey || "?"}
                                </div>
                              )}

                              {/* Small shirt number indicator */}
                              <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-slate-950 text-white text-[9px] font-black flex items-center justify-center border border-white/30 shadow">
                                {player.jersey}
                              </div>

                              {/* Subbed out indicator */}
                              {player.subbedOut && (
                                <div
                                  className="absolute -bottom-1 -left-1 px-1 rounded bg-rose-600 text-white text-[8px] font-bold shadow"
                                  title={`Subbed out at ${player.subOutMinute}`}
                                >
                                  ⬇
                                </div>
                              )}
                            </div>

                            {/* Player Name Label (Clean text with text-shadow, no background container) */}
                            <span
                              className="text-white font-medium text-[10px] sm:text-[11px] truncate max-w-[85px] text-center leading-tight drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)] select-none pointer-events-none"
                              style={{ textShadow: "0 1px 3px rgba(0, 0, 0, 0.95), 0 1px 2px rgba(0, 0, 0, 0.9)" }}
                            >
                              {player.shortName || player.name}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Substitutes Section */}
                  <div className="max-w-lg mx-auto mt-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                        Substitutes ({activeRoster.substitutes.length})
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {activeRoster.substitutes.map((sub, sIdx) => {
                        return (
                          <div
                            key={sIdx}
                            className={`flex items-center justify-between p-2.5 rounded-xl border text-xs transition-colors ${
                              sub.subbedIn
                                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-950 dark:text-emerald-300"
                                : "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
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

                            {/* Sub In Badge */}
                            {sub.subbedIn ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-600 text-white flex-shrink-0 shadow-xs">
                                <span>🔄</span>
                                <span>{sub.subInMinute || "Sub"}</span>
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-400 dark:text-slate-500 flex-shrink-0">
                                Unused
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-12 text-slate-400 text-xs">
                  Lineup data is currently unavailable for this match.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
