"use client";

import React from "react";
import Link from "next/link";
import { MatchItem } from "@/types/match";
import { Sparkles, ChevronRight, MapPin } from "lucide-react";

interface MatchCardProps {
  match: MatchItem;
  onSelect?: (match: MatchItem) => void;
}

export const MatchCard: React.FC<MatchCardProps> = ({ match, onSelect }) => {
  const formatMatchDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const getGoalBadge = (totalGoals: number) => {
    if (totalGoals >= 8) {
      return {
        text: `${totalGoals} Goals Thriller`,
        badgeClass:
          "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30",
      };
    }
    if (totalGoals >= 6) {
      return {
        text: `${totalGoals} Goals Classic`,
        badgeClass:
          "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
      };
    }
    return {
      text: `${totalGoals} Goals`,
      badgeClass:
        "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30",
    };
  };

  const badge = getGoalBadge(match.totalGoals);

  return (
    <Link
      href={`/fixtures/${match.id}`}
      onClick={() => onSelect?.(match)}
      className="group relative bg-white dark:bg-slate-900/80 backdrop-blur-md border border-slate-200 dark:border-slate-800/90 hover:border-indigo-500/50 dark:hover:border-indigo-500/60 rounded-2xl p-5 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 dark:hover:shadow-indigo-950/30 transition-all duration-300 cursor-pointer flex flex-col justify-between block"
    >
      {/* Top Meta Bar */}
      <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800/70">
        <div className="flex items-center gap-2 min-w-0">
          {/* Naked borderless League Logo */}
          <img
            src={match.leagueLogoUrl}
            alt={match.leagueName}
            title={match.leagueName}
            className="w-5 h-5 object-contain flex-shrink-0"
          />
          <span className="hidden md:inline text-xs font-semibold text-slate-500 dark:text-slate-400 truncate">
            {match.leagueName}
          </span>
          <span className="hidden md:inline text-slate-300 dark:text-slate-700 text-xs">•</span>
          <span className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
            {formatMatchDate(match.matchDate)}
          </span>
        </div>

        {/* Goal Badge */}
        <div
          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border tracking-tight flex-shrink-0 ${badge.badgeClass}`}
        >
          <Sparkles className="w-3 h-3" />
          <span>{badge.text}</span>
        </div>
      </div>

      {/* Main Score & Teams Display */}
      <div className="grid grid-cols-7 items-center gap-2 my-2">
        {/* Home Club */}
        <div className="col-span-3 flex flex-col items-center sm:items-start text-center sm:text-left">
          <div className="w-10 h-10 sm:w-12 sm:h-12 mb-2 flex items-center justify-center">
            <img
              src={match.homeTeam.logoUrl}
              alt={match.homeTeam.shortDisplayName}
              className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform duration-200"
            />
          </div>
          <span className="text-sm sm:text-base font-bold text-slate-900 dark:text-white line-clamp-1">
            {match.homeTeam.shortDisplayName}
          </span>
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
            Home
          </span>
        </div>

        {/* Central Scoreboard */}
        <div className="col-span-1 flex flex-col items-center justify-center">
          <div className="flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 shadow-inner">
            <span className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white tabular-nums">
              {match.homeScore}
            </span>
            <span className="text-slate-400 dark:text-slate-500 font-bold text-sm sm:text-base">
              -
            </span>
            <span className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white tabular-nums">
              {match.awayScore}
            </span>
          </div>
          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mt-1.5">
            {match.status}
          </span>
        </div>

        {/* Away Club */}
        <div className="col-span-3 flex flex-col items-center sm:items-end text-center sm:text-right">
          <div className="w-10 h-10 sm:w-12 sm:h-12 mb-2 flex items-center justify-center">
            <img
              src={match.awayTeam.logoUrl}
              alt={match.awayTeam.shortDisplayName}
              className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform duration-200"
            />
          </div>
          <span className="text-sm sm:text-base font-bold text-slate-900 dark:text-white line-clamp-1">
            {match.awayTeam.shortDisplayName}
          </span>
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
            Away
          </span>
        </div>
      </div>

      {/* Venue & CTA Footer */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/70 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 truncate pr-2 min-w-0">
          <MapPin className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 flex-shrink-0" />
          <span className="truncate font-medium">
            {match.venue || "Stadium"}
          </span>
        </div>

        <div className="inline-flex items-center gap-0.5 font-bold text-indigo-600 dark:text-indigo-400 group-hover:translate-x-0.5 transition-transform flex-shrink-0">
          <span>Match Detail</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </div>
      </div>
    </Link>
  );
};
