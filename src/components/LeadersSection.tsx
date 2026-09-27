"use client";

import React, { useState } from "react";
import { PlayerLeaderItem } from "@/lib/types";
import { NakedLeagueLogo } from "./NakedLeagueLogo";
import { Flame, Award } from "lucide-react";
import { ShareStoryButton } from "./story/ShareStoryButton";

interface LeadersSectionProps {
  topScorers: PlayerLeaderItem[];
  topAssists: PlayerLeaderItem[];
  isLoading: boolean;
  season?: number | string;
}

interface PlayerStackedCellProps {
  playerName: string;
  clubShortName: string;
  clubLogoUrl: string;
}

const PlayerStackedCell: React.FC<PlayerStackedCellProps> = ({
  playerName,
  clubShortName,
  clubLogoUrl,
}) => {
  const [logoError, setLogoError] = useState(false);

  return (
    <div className="flex flex-col justify-center py-0.5 md:py-1 min-w-0">
      {/* Top Row: Player Name */}
      <span className="font-bold text-slate-900 dark:text-slate-100 text-xs md:text-sm tracking-tight hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors truncate">
        {playerName}
      </span>
      {/* Bottom Row: Small Club Logo + Club ShortDisplayName */}
      <div className="flex items-center gap-1 md:gap-1.5 mt-0.5">
        <div className="w-3 h-3 md:w-3.5 md:h-3.5 rounded-full overflow-hidden flex-shrink-0 bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
          {!logoError && clubLogoUrl ? (
            <img
              src={clubLogoUrl}
              alt={clubShortName}
              width={14}
              height={14}
              onError={() => setLogoError(true)}
              className="w-full h-full object-contain"
              loading="lazy"
            />
          ) : (
            <span className="text-[7px] md:text-[8px] font-bold text-slate-400">
              {clubShortName.slice(0, 1)}
            </span>
          )}
        </div>
        <span className="text-[10px] md:text-xs text-slate-500 dark:text-slate-400 truncate tracking-tight font-medium">
          {clubShortName}
        </span>
      </div>
    </div>
  );
};

export const LeadersSection: React.FC<LeadersSectionProps> = ({
  topScorers,
  topAssists,
  isLoading,
  season,
}) => {
  const showInitialSkeleton =
    isLoading && topScorers.length === 0 && topAssists.length === 0;

  if (showInitialSkeleton) {
    return (
      <div className="relative min-h-[380px] mb-8">
        <div
          role="status"
          aria-live="polite"
          className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-white/60 dark:bg-slate-900/60 backdrop-blur-[2px] transition-all duration-200 pointer-events-none"
        >
          <div className="flex flex-col items-center gap-3 px-6 py-4 rounded-2xl bg-white/95 dark:bg-slate-800/95 border border-slate-200/80 dark:border-slate-700/80 shadow-2xl shadow-indigo-950/10 dark:shadow-black/50 pointer-events-auto">
            <div className="w-9 h-9 rounded-full border-[3px] border-indigo-100 dark:border-indigo-950 border-t-indigo-600 dark:border-t-indigo-400 animate-spin" />
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 tracking-wide">
              Loading player statistics...
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(2)].map((_, idx) => (
            <div
              key={idx}
              className="bg-transparent md:bg-white md:dark:bg-slate-900/80 md:backdrop-blur-md border-0 md:border md:border-slate-200 md:dark:border-slate-800 rounded-none md:rounded-2xl p-0 md:p-6 shadow-none md:shadow-sm md:dark:shadow-xl animate-pulse transition-colors"
            >
              <div className="h-7 bg-slate-200 dark:bg-slate-800 rounded-lg w-1/3 mb-4"></div>
              <div className="space-y-3">
                {[...Array(10)].map((_, i) => (
                  <div key={i} className="h-8 md:h-10 bg-slate-100 dark:bg-slate-800/60 rounded-xl"></div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <section className="mb-12 relative">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <Award className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <h2 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            Player Leaders
          </h2>
          {isLoading && (
            <div
              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/80 dark:border-indigo-800/80 text-indigo-600 dark:text-indigo-400"
              title="Updating player statistics"
            >
              <div className="w-3.5 h-3.5 rounded-full border-2 border-indigo-600/30 border-t-indigo-600 dark:border-indigo-400/30 dark:border-t-indigo-400 animate-spin" />
              <span className="text-[11px] font-semibold hidden sm:inline">Updating</span>
            </div>
          )}
        </div>
      </div>

      {/* Symmetrical Grid Columns on Desktop, Stack on Mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* ================= TOP SCORERS CARD ================= */}
        <div className="bg-transparent md:bg-white md:dark:bg-slate-900/80 md:backdrop-blur-md border-0 md:border md:border-slate-200 md:dark:border-slate-800/90 rounded-none md:rounded-2xl shadow-none md:shadow-sm md:dark:shadow-xl overflow-hidden flex flex-col justify-between transition-colors duration-200 relative">
          {/* Subtle top loading progress bar */}
          {isLoading && (
            <div className="absolute top-0 left-0 right-0 h-1 bg-slate-100 dark:bg-slate-800 overflow-hidden z-20">
              <div className="h-full bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-500 animate-[pulse_1s_infinite] w-full" />
            </div>
          )}

          <div>
            <div className="px-0 py-2.5 md:px-5 md:py-4 border-b border-slate-200 dark:border-slate-800/80 flex items-center justify-between bg-gradient-to-r from-amber-500/10 via-transparent to-transparent">
              <div className="flex items-center gap-2 md:gap-2.5">
                <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
                  <Flame className="w-3.5 h-3.5 md:w-4 md:h-4 text-amber-500 dark:text-amber-400" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm md:text-base">
                    Top Scorers
                  </h3>
                  <p className="text-[10px] md:text-[11px] text-slate-500 dark:text-slate-400">
                    Golden Boot Ranking
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isLoading && (
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 border border-amber-200/80 dark:border-amber-800/80 text-amber-600 dark:text-amber-400 text-xs font-medium">
                    <div className="w-3 h-3 rounded-full border-2 border-amber-500/30 border-t-amber-500 dark:border-t-amber-400 animate-spin" />
                    <span className="text-[10px] font-semibold hidden sm:inline">Updating</span>
                  </div>
                )}
                <ShareStoryButton
                  type="scorers"
                  data={topScorers}
                  season={season}
                  label="Story"
                  size="sm"
                  variant="gradient"
                />
              </div>
            </div>

            {/* Table Content & Circular Loading Indicator Area */}
            <div className="relative min-h-[360px] md:min-h-[460px]">
              {/* Circular Loading Indicator Overlay */}
              {isLoading && (
                <div
                  role="status"
                  aria-live="polite"
                  className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-white/60 dark:bg-slate-900/60 backdrop-blur-[2px] transition-all duration-200 pointer-events-none"
                >
                  <div className="flex flex-col items-center gap-3 px-6 py-4 rounded-2xl bg-white/95 dark:bg-slate-800/95 border border-slate-200/80 dark:border-slate-700/80 shadow-2xl shadow-amber-950/10 dark:shadow-black/50 pointer-events-auto">
                    <div className="w-9 h-9 rounded-full border-[3px] border-amber-100 dark:border-amber-950 border-t-amber-500 dark:border-t-amber-400 animate-spin" />
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 tracking-wide">
                      Loading top scorers...
                    </span>
                  </div>
                </div>
              )}

              {/* Table: Rank, Player, League, Goals, Assist, Apps, Mins */}
              <div className="overflow-x-auto custom-scrollbar scrollbar-stable min-h-[360px] md:min-h-[460px]" style={{ scrollbarGutter: "stable" }}>
                <table className="w-full text-left border-collapse min-w-full md:min-w-[480px]">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] md:text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 bg-slate-50/80 dark:bg-slate-950/40">
                      <th className="py-2 md:py-3 pl-2 pr-1 md:pl-4 md:pr-2 w-7 sm:w-8 md:w-10 text-center">#</th>
                      <th className="py-2 md:py-3 pl-1 pr-2 md:px-3 min-w-[110px] md:min-w-[160px]">Player</th>
                      <th className="py-2 md:py-3 px-2 md:px-3 w-16 md:w-16 text-center">League</th>
                      <th className="py-2 md:py-3 pl-2 pr-3 md:px-3 w-16 md:w-16 text-right md:text-center font-extrabold text-amber-600 dark:text-amber-400">
                        Goals
                      </th>
                      <th className="hidden md:table-cell py-2 md:py-3 px-0.5 md:px-2 w-6 md:w-12 text-center text-slate-500 dark:text-slate-400">
                        Assist
                      </th>
                      <th className="hidden md:table-cell py-2 md:py-3 px-0.5 md:px-2 w-6 md:w-12 text-center text-slate-500 dark:text-slate-400">
                        Apps
                      </th>
                      <th className="hidden md:table-cell py-2 md:py-3 pr-2 md:pr-4 pl-0.5 md:pl-2 w-9 md:w-16 text-right text-slate-500 dark:text-slate-400">
                        Mins
                      </th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y-2 divide-slate-200 dark:divide-slate-800 md:divide-y md:divide-slate-100 md:dark:divide-slate-800/50 text-xs font-medium transition-opacity duration-200 ${
                    isLoading ? "opacity-40 pointer-events-none" : "opacity-100"
                  }`}>
                    {topScorers.length > 0 ? (
                      topScorers.map((player) => (
                        <tr
                          key={player.athleteId}
                          className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group"
                        >
                          {/* Rank (Podium for 1-3, plain for 4+) */}
                          <td className="py-2.5 md:py-3 pl-2 pr-1 md:pl-4 md:pr-2 text-center">
                            {player.rank === 1 ? (
                              <span className="inline-flex items-center justify-center w-5 h-5 rounded-md font-bold text-[10px] md:text-xs bg-amber-400 text-amber-950 shadow-sm">
                                1
                              </span>
                            ) : player.rank === 2 ? (
                              <span className="inline-flex items-center justify-center w-5 h-5 rounded-md font-bold text-[10px] md:text-xs bg-slate-300 text-slate-900 shadow-sm">
                                2
                              </span>
                            ) : player.rank === 3 ? (
                              <span className="inline-flex items-center justify-center w-5 h-5 rounded-md font-bold text-[10px] md:text-xs bg-amber-700 text-amber-50 shadow-sm">
                                3
                              </span>
                            ) : (
                              <span className="text-slate-500 dark:text-slate-400 font-semibold text-[10px] md:text-xs">
                                {player.rank}
                              </span>
                            )}
                          </td>

                          {/* Player (2-row stacked cell: Name on top, Club logo+name on bottom) */}
                          <td className="py-2.5 md:py-3 pl-1 pr-2 md:px-3">
                            <PlayerStackedCell
                              playerName={player.athleteName}
                              clubShortName={player.team.shortDisplayName}
                              clubLogoUrl={player.team.logoUrl}
                            />
                          </td>

                          {/* League (Naked logo with hover tooltip) */}
                          <td className="py-2.5 md:py-3 px-2 md:px-3 text-center">
                            <div className="flex justify-center">
                              <NakedLeagueLogo
                                name={player.league.name}
                                logoUrl={player.league.logoUrl}
                                darkLogoUrl={player.league.darkLogoUrl}
                                slug={player.league.slug}
                                size={18}
                              />
                            </div>
                          </td>

                          {/* Goals */}
                          <td className="py-2.5 md:py-3 pl-2 pr-3 md:px-3 text-right md:text-center font-mono font-black text-amber-600 dark:text-amber-400 text-xs md:text-sm">
                            {player.goals}
                          </td>

                          {/* Assist */}
                          <td className="hidden md:table-cell py-2.5 md:py-3 px-0.5 md:px-2 text-center font-mono text-slate-700 dark:text-slate-300 text-[11px] md:text-xs">
                            {player.assists}
                          </td>

                          {/* Apps */}
                          <td className="hidden md:table-cell py-2.5 md:py-3 px-0.5 md:px-2 text-center font-mono text-slate-500 dark:text-slate-400 text-[11px] md:text-xs">
                            {player.appearances}
                          </td>

                          {/* Mins */}
                          <td className="hidden md:table-cell py-2.5 md:py-3 pr-2 md:pr-4 pl-0.5 md:pl-2 text-right font-mono text-slate-500 dark:text-slate-400 text-[10px] md:text-xs">
                            {player.minutes ? `${player.minutes}'` : "-"}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-500">
                          No scorer statistics available for this selection.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Divider line between scorers and assists on mobile */}
        <div className="border-b border-slate-200 dark:border-slate-800/80 my-4 md:hidden" />

        {/* ================= TOP ASSISTS CARD ================= */}
        <div className="bg-transparent md:bg-white md:dark:bg-slate-900/80 md:backdrop-blur-md border-0 md:border md:border-slate-200 md:dark:border-slate-800/90 rounded-none md:rounded-2xl shadow-none md:shadow-sm md:dark:shadow-xl overflow-hidden flex flex-col justify-between transition-colors duration-200 relative">
          {/* Subtle top loading progress bar */}
          {isLoading && (
            <div className="absolute top-0 left-0 right-0 h-1 bg-slate-100 dark:bg-slate-800 overflow-hidden z-20">
              <div className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 animate-[pulse_1s_infinite] w-full" />
            </div>
          )}

          <div>
            <div className="px-0 py-2.5 md:px-5 md:py-4 border-b border-slate-200 dark:border-slate-800/80 flex items-center justify-between bg-gradient-to-r from-indigo-500/10 via-transparent to-transparent">
              <div className="flex items-center gap-2 md:gap-2.5">
                <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
                  <Award className="w-3.5 h-3.5 md:w-4 md:h-4 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm md:text-base">
                    Top Assists
                  </h3>
                  <p className="text-[10px] md:text-[11px] text-slate-500 dark:text-slate-400">
                    Playmaker Ranking
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isLoading && (
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/80 dark:border-indigo-800/80 text-indigo-600 dark:text-indigo-400 text-xs font-medium">
                    <div className="w-3 h-3 rounded-full border-2 border-indigo-600/30 border-t-indigo-600 dark:border-t-indigo-400 animate-spin" />
                    <span className="text-[10px] font-semibold hidden sm:inline">Updating</span>
                  </div>
                )}
                <ShareStoryButton
                  type="assists"
                  data={topAssists}
                  season={season}
                  label="Story"
                  size="sm"
                  variant="gradient"
                />
              </div>
            </div>

            {/* Table Content & Circular Loading Indicator Area */}
            <div className="relative min-h-[360px] md:min-h-[460px]">
              {/* Circular Loading Indicator Overlay */}
              {isLoading && (
                <div
                  role="status"
                  aria-live="polite"
                  className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-white/60 dark:bg-slate-900/60 backdrop-blur-[2px] transition-all duration-200 pointer-events-none"
                >
                  <div className="flex flex-col items-center gap-3 px-6 py-4 rounded-2xl bg-white/95 dark:bg-slate-800/95 border border-slate-200/80 dark:border-slate-700/80 shadow-2xl shadow-indigo-950/10 dark:shadow-black/50 pointer-events-auto">
                    <div className="w-9 h-9 rounded-full border-[3px] border-indigo-100 dark:border-indigo-950 border-t-indigo-600 dark:border-t-indigo-400 animate-spin" />
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 tracking-wide">
                      Loading top assists...
                    </span>
                  </div>
                </div>
              )}

              {/* Table: Rank, Player, League, Assist, Goals, Apps, Mins */}
              <div className="overflow-x-auto custom-scrollbar scrollbar-stable min-h-[360px] md:min-h-[460px]" style={{ scrollbarGutter: "stable" }}>
                <table className="w-full text-left border-collapse min-w-full md:min-w-[480px]">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] md:text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 bg-slate-50/80 dark:bg-slate-950/40">
                      <th className="py-2 md:py-3 pl-2 pr-1 md:pl-4 md:pr-2 w-7 sm:w-8 md:w-10 text-center">#</th>
                      <th className="py-2 md:py-3 pl-1 pr-2 md:px-3 min-w-[110px] md:min-w-[160px]">Player</th>
                      <th className="py-2 md:py-3 px-2 md:px-3 w-16 md:w-16 text-center">League</th>
                      <th className="py-2 md:py-3 pl-2 pr-3 md:px-3 w-16 md:w-16 text-right md:text-center font-extrabold text-indigo-600 dark:text-indigo-400">
                        Assist
                      </th>
                      <th className="hidden md:table-cell py-2 md:py-3 px-0.5 md:px-2 w-6 md:w-12 text-center text-slate-500 dark:text-slate-400">
                        Goals
                      </th>
                      <th className="hidden md:table-cell py-2 md:py-3 px-0.5 md:px-2 w-6 md:w-12 text-center text-slate-500 dark:text-slate-400">
                        Apps
                      </th>
                      <th className="hidden md:table-cell py-2 md:py-3 pr-2 md:pr-4 pl-0.5 md:pl-2 w-9 md:w-16 text-right text-slate-500 dark:text-slate-400">
                        Mins
                      </th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y-2 divide-slate-200 dark:divide-slate-800 md:divide-y md:divide-slate-100 md:dark:divide-slate-800/50 text-xs font-medium transition-opacity duration-200 ${
                    isLoading ? "opacity-40 pointer-events-none" : "opacity-100"
                  }`}>
                    {topAssists.length > 0 ? (
                      topAssists.map((player) => (
                        <tr
                          key={player.athleteId}
                          className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group"
                        >
                          {/* Rank (Podium for 1-3, plain for 4+) */}
                          <td className="py-2.5 md:py-3 pl-2 pr-1 md:pl-4 md:pr-2 text-center">
                            {player.rank === 1 ? (
                              <span className="inline-flex items-center justify-center w-5 h-5 rounded-md font-bold text-[10px] md:text-xs bg-indigo-500 text-white shadow-sm">
                                1
                              </span>
                            ) : player.rank === 2 ? (
                              <span className="inline-flex items-center justify-center w-5 h-5 rounded-md font-bold text-[10px] md:text-xs bg-slate-300 text-slate-900 shadow-sm">
                                2
                              </span>
                            ) : player.rank === 3 ? (
                              <span className="inline-flex items-center justify-center w-5 h-5 rounded-md font-bold text-[10px] md:text-xs bg-amber-700 text-amber-50 shadow-sm">
                                3
                              </span>
                            ) : (
                              <span className="text-slate-500 dark:text-slate-400 font-semibold text-[10px] md:text-xs">
                                {player.rank}
                              </span>
                            )}
                          </td>

                          {/* Player (2-row stacked cell: Name on top, Club logo+name on bottom) */}
                          <td className="py-2.5 md:py-3 pl-1 pr-2 md:px-3">
                            <PlayerStackedCell
                              playerName={player.athleteName}
                              clubShortName={player.team.shortDisplayName}
                              clubLogoUrl={player.team.logoUrl}
                            />
                          </td>

                          {/* League (Naked logo with hover tooltip) */}
                          <td className="py-2.5 md:py-3 px-2 md:px-3 text-center">
                            <div className="flex justify-center">
                              <NakedLeagueLogo
                                name={player.league.name}
                                logoUrl={player.league.logoUrl}
                                darkLogoUrl={player.league.darkLogoUrl}
                                slug={player.league.slug}
                                size={18}
                              />
                            </div>
                          </td>

                          {/* Assist */}
                          <td className="py-2.5 md:py-3 pl-2 pr-3 md:px-3 text-right md:text-center font-mono font-black text-indigo-600 dark:text-indigo-400 text-xs md:text-sm">
                            {player.assists}
                          </td>

                          {/* Goals */}
                          <td className="hidden md:table-cell py-2.5 md:py-3 px-0.5 md:px-2 text-center font-mono text-slate-700 dark:text-slate-300 text-[11px] md:text-xs">
                            {player.goals}
                          </td>

                          {/* Apps */}
                          <td className="hidden md:table-cell py-2.5 md:py-3 px-0.5 md:px-2 text-center font-mono text-slate-500 dark:text-slate-400 text-[11px] md:text-xs">
                            {player.appearances}
                          </td>

                          {/* Mins */}
                          <td className="hidden md:table-cell py-2.5 md:py-3 pr-2 md:pr-4 pl-0.5 md:pl-2 text-right font-mono text-slate-500 dark:text-slate-400 text-[10px] md:text-xs">
                            {player.minutes ? `${player.minutes}'` : "-"}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-500">
                          No assist statistics available for this selection.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
