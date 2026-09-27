"use client";

import React from "react";
import { LEAGUES, SEASONS, SeasonYear } from "@/lib/constants";
import { Check, Calendar, SlidersHorizontal } from "lucide-react";

interface FilterBarProps {
  selectedSeason: SeasonYear;
  onSeasonChange: (season: SeasonYear) => void;
  selectedLeagues: string[];
  onLeagueToggle: (slug: string) => void;
  onSelectAllLeagues: () => void;
  onClearLeagues: () => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  selectedSeason,
  onSeasonChange,
  selectedLeagues,
  onLeagueToggle,
  onSelectAllLeagues,
  onClearLeagues,
}) => {
  const isAllSelected = selectedLeagues.length === LEAGUES.length;

  return (
    <div className="bg-transparent md:bg-white md:dark:bg-slate-900/80 md:backdrop-blur-md border-0 md:border md:border-slate-200 md:dark:border-slate-800/90 rounded-none md:rounded-2xl p-0 md:p-5 shadow-none md:shadow-sm md:dark:shadow-xl mb-4 md:mb-6 transition-colors duration-200">
      {/* ========================================================================= */}
      {/* DESKTOP LAYOUT (md:flex) */}
      {/* ========================================================================= */}
      <div className="hidden md:flex md:flex-row md:items-center md:justify-between gap-4">
        {/* Left Side: League Multi-Select Toggle Pills */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Filter by Leagues
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                ({selectedLeagues.length} of {LEAGUES.length} selected)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onSelectAllLeagues}
                disabled={isAllSelected}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors disabled:opacity-40 cursor-pointer"
              >
                Select All
              </button>
              <span className="text-slate-300 dark:text-slate-600 text-xs">|</span>
              <button
                onClick={onClearLeagues}
                disabled={isAllSelected}
                className="text-xs font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300 transition-colors disabled:opacity-40 cursor-pointer"
                title="Reset to all leagues"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Desktop Multi-Select Pills */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {LEAGUES.map((league) => {
              const isSelected = selectedLeagues.includes(league.slug);

              return (
                <button
                  key={league.slug}
                  onClick={() => onLeagueToggle(league.slug)}
                  title={league.name}
                  aria-label={league.name}
                  className={`group flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border transition-all duration-200 cursor-pointer select-none ${
                    isSelected
                      ? "bg-indigo-50 border-indigo-400 text-indigo-950 dark:bg-slate-800 dark:text-white dark:border-indigo-500/60 shadow-sm dark:shadow-lg dark:shadow-indigo-950/40 ring-1 ring-indigo-500/30"
                      : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900 dark:bg-slate-950/60 dark:text-slate-400 dark:border-slate-800/80 dark:hover:bg-slate-800/40 dark:hover:text-slate-300"
                  }`}
                >
                  <div className="w-5 h-5 flex-shrink-0 flex items-center justify-center">
                    <img
                      src={league.logoUrl}
                      alt={league.name}
                      className={`w-4 h-4 object-contain transition-transform group-hover:scale-110 dark:hidden ${
                        isSelected
                          ? "opacity-100 drop-shadow-[0_0_6px_rgba(99,102,241,0.5)]"
                          : "opacity-45 grayscale group-hover:grayscale-0 group-hover:opacity-80"
                      }`}
                    />
                    <img
                      src={league.darkLogoUrl}
                      alt={league.name}
                      className={`w-4 h-4 object-contain transition-transform group-hover:scale-110 hidden dark:block ${
                        isSelected
                          ? "opacity-100 drop-shadow-[0_0_6px_rgba(99,102,241,0.5)]"
                          : "opacity-45 grayscale group-hover:grayscale-0 group-hover:opacity-80"
                      }`}
                    />
                  </div>
                  <span className="tracking-tight">{league.name}</span>
                  {isSelected && (
                    <div className="flex w-3.5 h-3.5 rounded-full bg-indigo-600/15 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 items-center justify-center">
                      <Check className="w-2.5 h-2.5" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Desktop Season Dropdown */}
        <div className="flex items-center gap-3 self-center">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Season
            </span>
          </div>

          <div className="relative">
            <select
              value={selectedSeason}
              onChange={(e) => onSeasonChange(parseInt(e.target.value, 10) as SeasonYear)}
              className="bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm font-semibold rounded-xl px-4 py-2 pr-9 appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 cursor-pointer shadow-sm transition-colors"
            >
              {SEASONS.map((year) => (
                <option key={year} value={year} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                  {year} – {year + 1}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MOBILE LAYOUT (md:hidden) */}
      {/* Row 1: Only full logos of each league (no text labels) */}
      {/* Row 2: Season dropdown aligned to the right (no text labels) */}
      {/* ========================================================================= */}
      <div className="md:hidden flex flex-col gap-2.5">
        {/* Row 1: Full logos of each league in a 5-column grid */}
        <div className="grid grid-cols-5 gap-2 w-full">
          {LEAGUES.map((league) => {
            const isSelected = selectedLeagues.includes(league.slug);

            return (
              <button
                key={league.slug}
                onClick={() => onLeagueToggle(league.slug)}
                title={league.name}
                aria-label={league.name}
                className={`flex items-center justify-center p-2 rounded-xl border transition-all duration-200 cursor-pointer select-none aspect-square ${
                  isSelected
                    ? "bg-indigo-50/80 border-indigo-400 dark:bg-slate-800 dark:border-indigo-500/60 shadow-sm ring-1 ring-indigo-500/30"
                    : "bg-slate-100/70 border-slate-200/80 dark:bg-slate-900/60 dark:border-slate-800/80"
                }`}
              >
                <img
                  src={league.logoUrl}
                  alt={league.name}
                  className={`w-7 h-7 object-contain transition-transform duration-200 dark:hidden ${
                    isSelected
                      ? "opacity-100 drop-shadow-[0_0_6px_rgba(99,102,241,0.5)] scale-105"
                      : "opacity-40 grayscale"
                  }`}
                />
                <img
                  src={league.darkLogoUrl}
                  alt={league.name}
                  className={`w-7 h-7 object-contain transition-transform duration-200 hidden dark:block ${
                    isSelected
                      ? "opacity-100 drop-shadow-[0_0_6px_rgba(99,102,241,0.5)] scale-105"
                      : "opacity-40 grayscale"
                  }`}
                />
              </button>
            );
          })}
        </div>

        {/* Row 2: Season dropdown aligned to the right (no text) */}
        <div className="flex items-center justify-end w-full pt-1">
          <div className="relative">
            <select
              value={selectedSeason}
              onChange={(e) => onSeasonChange(parseInt(e.target.value, 10) as SeasonYear)}
              className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs font-semibold rounded-lg px-3 py-1.5 pr-7 appearance-none focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer shadow-xs"
            >
              {SEASONS.map((year) => (
                <option key={year} value={year} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                  {year} – {year + 1}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Divider line separating filter section from next section */}
        <div className="border-b border-slate-200 dark:border-slate-800/80 my-2" />
      </div>
    </div>
  );
};
