"use client";

import React from "react";
import { StandingItem } from "@/lib/types";
import { ClubBadge } from "./ClubBadge";
import { NakedLeagueLogo } from "./NakedLeagueLogo";
import { FormGuide } from "./FormGuide";
import { Info } from "lucide-react";

interface StandingsTableProps {
  standings: StandingItem[];
  isLoading: boolean;
  totalAvailable: number;
}

export const StandingsTable: React.FC<StandingsTableProps> = ({
  standings,
  isLoading,
  totalAvailable,
}) => {
  const showInitialSkeleton = isLoading && (!standings || standings.length === 0);

  if (!isLoading && (!standings || standings.length === 0)) {
    return (
      <div className="bg-white dark:bg-slate-900/80 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center shadow-sm dark:shadow-xl transition-colors duration-200 min-h-[400px] flex flex-col items-center justify-center">
        <div className="w-16 h-16 mb-4 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
          <Info className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">No Standings Found</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Try selecting different leagues or another season.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900/80 backdrop-blur-md border border-slate-200 dark:border-slate-800/90 rounded-2xl shadow-sm dark:shadow-xl overflow-hidden mb-8 transition-colors duration-200 relative">
      {/* Subtle top loading progress bar to indicate active filter fetch */}
      {isLoading && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-slate-100 dark:bg-slate-800 overflow-hidden z-20">
          <div className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 animate-[pulse_1s_infinite] w-full" />
        </div>
      )}

      {/* Table Header Title */}
      <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
            Combined Standings
          </h2>
        </div>

        <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-medium">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>
            {standings.length > 0
              ? standings.length < 20
                ? `Displaying all ${standings.length} available clubs`
                : `Showing ${standings.length} of ${totalAvailable} clubs`
              : "Loading standings..."}
          </span>
        </div>
      </div>

      {/* Responsive Horizontal Scroll Wrapper with Stable Gutter and Fixed Min-Height to eliminate scrollbar flash */}
      <div
        className="overflow-x-auto custom-scrollbar scrollbar-stable min-h-[640px]"
        style={{ scrollbarGutter: "stable" }}
      >
        <table className="w-full text-left border-collapse min-w-[760px]">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 bg-slate-50/80 dark:bg-slate-950/40 select-none">
              <th className="py-3.5 pl-6 pr-2 w-14 text-center">#</th>
              <th className="py-3.5 px-3 min-w-[190px]">Club</th>
              <th className="py-3.5 px-3 w-16 text-center" title="League">
                League
              </th>
              <th className="py-3.5 px-2.5 w-12 text-center" title="Matches Played">
                MP
              </th>
              <th className="py-3.5 px-2.5 w-12 text-center" title="Wins">
                W
              </th>
              <th className="py-3.5 px-2.5 w-12 text-center" title="Draws">
                D
              </th>
              <th className="py-3.5 px-2.5 w-12 text-center" title="Losses">
                L
              </th>
              {/* GF:GA Column */}
              <th className="py-3.5 px-3 w-18 text-center" title="Goals For : Goals Against">
                GF:GA
              </th>
              <th className="py-3.5 px-2.5 w-14 text-center" title="Goal Difference">
                GD
              </th>
              <th className="py-3.5 px-3 w-16 text-center font-extrabold text-slate-800 dark:text-slate-200" title="Points">
                Pts
              </th>
              <th className="py-3.5 pr-6 pl-3 w-40 text-right" title="Last 5 matches (Most recent on far right)">
                Last 5 Form
              </th>
            </tr>
          </thead>
          <tbody
            className={`divide-y divide-slate-100 dark:divide-slate-800/60 text-sm font-medium transition-opacity duration-200 ${
              isLoading ? "opacity-60 pointer-events-none" : "opacity-100"
            }`}
          >
            {showInitialSkeleton ? (
              /* Initial 20 identical skeleton rows matching data layout exactly to prevent layout shifts */
              [...Array(20)].map((_, i) => (
                <tr key={i} className="h-13.5">
                  <td className="py-3.5 pl-6 pr-2 text-center">
                    <div className="w-6 h-6 mx-auto bg-slate-200 dark:bg-slate-800 rounded-md animate-pulse" />
                  </td>
                  <td className="py-3.5 px-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 bg-slate-200 dark:bg-slate-800 rounded-md animate-pulse" />
                      <div className="h-4 w-28 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
                    </div>
                  </td>
                  <td className="py-3.5 px-3 text-center">
                    <div className="w-6 h-6 mx-auto bg-slate-200 dark:bg-slate-800 rounded-md animate-pulse" />
                  </td>
                  <td className="py-3.5 px-2.5 text-center">
                    <div className="h-4 w-5 mx-auto bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
                  </td>
                  <td className="py-3.5 px-2.5 text-center">
                    <div className="h-4 w-5 mx-auto bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
                  </td>
                  <td className="py-3.5 px-2.5 text-center">
                    <div className="h-4 w-5 mx-auto bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
                  </td>
                  <td className="py-3.5 px-2.5 text-center">
                    <div className="h-4 w-5 mx-auto bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
                  </td>
                  <td className="py-3.5 px-3 text-center">
                    <div className="h-4 w-10 mx-auto bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
                  </td>
                  <td className="py-3.5 px-2.5 text-center">
                    <div className="h-4 w-6 mx-auto bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
                  </td>
                  <td className="py-3.5 px-3 text-center">
                    <div className="h-6 w-8 mx-auto bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
                  </td>
                  <td className="py-3.5 pr-6 pl-3 text-right">
                    <div className="flex items-center gap-1.5 justify-end">
                      {[...Array(5)].map((_, j) => (
                        <div key={j} className="w-5 h-5 bg-slate-200 dark:bg-slate-800 rounded-md animate-pulse" />
                      ))}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              standings.map((item) => {
                const isGold = item.rank === 1;
                const isSilver = item.rank === 2;
                const isBronze = item.rank === 3;

                return (
                  <tr
                    key={`${item.team.id}-${item.rank}`}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group h-13.5"
                  >
                    {/* Podium Badges ONLY for Top 3; plain text for 4+ */}
                    <td className="py-3 pl-6 pr-2 text-center">
                      <div className="flex items-center justify-center">
                        {isGold ? (
                          <span
                            className="inline-flex items-center justify-center w-6 h-6 rounded-md font-black text-xs bg-amber-400 text-amber-950 shadow-md shadow-amber-400/25"
                            title="1st Place (Gold)"
                          >
                            1
                          </span>
                        ) : isSilver ? (
                          <span
                            className="inline-flex items-center justify-center w-6 h-6 rounded-md font-black text-xs bg-slate-300 text-slate-900 shadow-md shadow-slate-300/25"
                            title="2nd Place (Silver)"
                          >
                            2
                          </span>
                        ) : isBronze ? (
                          <span
                            className="inline-flex items-center justify-center w-6 h-6 rounded-md font-black text-xs bg-amber-700 text-amber-50 shadow-md shadow-amber-700/25"
                            title="3rd Place (Bronze)"
                          >
                            3
                          </span>
                        ) : (
                          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                            {item.rank}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Club Column (Clean borderless logo + ShortDisplayName) */}
                    <td className="py-3 px-3">
                      <ClubBadge
                        shortDisplayName={item.team.shortDisplayName}
                        name={item.team.name}
                        logoUrl={item.team.logoUrl}
                        size={28}
                      />
                    </td>

                    {/* League Column (Naked Logo only with hover tooltip) */}
                    <td className="py-3 px-3 text-center">
                      <div className="flex justify-center">
                        <NakedLeagueLogo
                          name={item.league.name}
                          logoUrl={item.league.logoUrl}
                          slug={item.league.slug}
                          size={24}
                        />
                      </div>
                    </td>

                    {/* Matches Played */}
                    <td className="py-3 px-2.5 text-center text-slate-600 dark:text-slate-300 font-mono text-xs">
                      {item.gamesPlayed}
                    </td>

                    {/* Wins */}
                    <td className="py-3 px-2.5 text-center text-emerald-600 dark:text-emerald-400 font-mono text-xs font-semibold">
                      {item.wins}
                    </td>

                    {/* Draws */}
                    <td className="py-3 px-2.5 text-center text-slate-500 dark:text-slate-400 font-mono text-xs">
                      {item.draws}
                    </td>

                    {/* Losses */}
                    <td className="py-3 px-2.5 text-center text-rose-600 dark:text-rose-400 font-mono text-xs font-semibold">
                      {item.losses}
                    </td>

                    {/* GF:GA Column (e.g. 45:18) */}
                    <td className="py-3 px-3 text-center text-slate-600 dark:text-slate-300 font-mono text-xs font-semibold tracking-wider">
                      {item.goalsFor}:{item.goalsAgainst}
                    </td>

                    {/* Goal Difference */}
                    <td className="py-3 px-2.5 text-center font-mono text-xs">
                      <span
                        className={`font-semibold ${
                          item.goalDifference > 0
                            ? "text-emerald-600 dark:text-emerald-400"
                            : item.goalDifference < 0
                            ? "text-rose-600 dark:text-rose-400"
                            : "text-slate-500 dark:text-slate-400"
                        }`}
                      >
                        {item.goalDifference > 0 ? `+${item.goalDifference}` : item.goalDifference}
                      </span>
                    </td>

                    {/* Points (Bolded) */}
                    <td className="py-3 px-3 text-center">
                      <span className="font-mono text-sm font-black text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800/80 px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700/60 shadow-inner">
                        {item.points}
                      </span>
                    </td>

                    {/* Last 5 Form (Far-right emphasized with solid colors) */}
                    <td className="py-3 pr-6 pl-3 text-right">
                      <FormGuide form={item.form} />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
