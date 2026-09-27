/* eslint-disable @next/next/no-img-element */
import React from "react";
import { StandingItem, PlayerLeaderItem } from "@/lib/types";
import { StoryLeaderboardType } from "@/lib/story-share";
import { getLeagueDarkLogo } from "@/lib/constants";
import { Trophy, Flame, Award, Sparkles } from "lucide-react";

export interface InstagramStoryGraphicProps {
  type: StoryLeaderboardType;
  data: StandingItem[] | PlayerLeaderItem[];
  season?: number | string;
  title?: string;
  subtitle?: string;
  id?: string;
  className?: string;
}

export const InstagramStoryGraphic: React.FC<InstagramStoryGraphicProps> = ({
  type,
  data,
  season = 2026,
  title,
  subtitle,
  id,
  className = "",
}) => {
  // Take top 10 items
  const top10 = (data || []).slice(0, 10);

  // Type configuration
  const config = {
    standings: {
      defaultTitle: "TOP 10 STANDINGS",
      defaultSubtitle: "COMBINED EUROPEAN ELITE TABLE",
      accentGradient: "from-amber-400 via-yellow-400 to-amber-500",
      pillBg: "bg-amber-400/15 border-amber-400/40 text-amber-300",
      glowColor: "rgba(245, 158, 11, 0.18)",
      icon: Trophy,
      heroLabel: "PTS",
    },
    scorers: {
      defaultTitle: "TOP 10 GOALSCORERS",
      defaultSubtitle: "GOLDEN BOOT RANKING",
      accentGradient: "from-amber-400 via-orange-500 to-rose-500",
      pillBg: "bg-orange-500/20 border-orange-500/40 text-orange-300",
      glowColor: "rgba(249, 115, 22, 0.2)",
      icon: Flame,
      heroLabel: "GOALS",
    },
    assists: {
      defaultTitle: "TOP 10 PLAYMAKERS",
      defaultSubtitle: "MOST ASSISTS RANKING",
      accentGradient: "from-indigo-400 via-purple-400 to-pink-500",
      pillBg: "bg-indigo-500/20 border-indigo-500/40 text-indigo-300",
      glowColor: "rgba(99, 102, 241, 0.22)",
      icon: Award,
      heroLabel: "ASSISTS",
    },
  }[type];

  const displayTitle = title || config.defaultTitle;
  const displaySubtitle = subtitle || config.defaultSubtitle;
  const IconComponent = config.icon;

  return (
    <div
      id={id}
      style={{
        width: "1080px",
        height: "1920px",
        backgroundColor: "#070b14",
        color: "#ffffff",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      }}
      className={`relative overflow-hidden flex flex-col justify-between select-none box-border ${className}`}
    >
      {/* ================= BACKGROUND GLOWS & TEXTURES ================= */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(circle at 50% 12%, ${config.glowColor} 0%, transparent 48%),
            radial-gradient(circle at 10% 88%, rgba(99, 102, 241, 0.12) 0%, transparent 42%),
            radial-gradient(circle at 90% 88%, rgba(236, 72, 153, 0.08) 0%, transparent 40%),
            linear-gradient(180deg, #090e1a 0%, #060910 100%)
          `,
        }}
      />

      {/* Subtle stadium light lines */}
      <div
        className="absolute inset-0 opacity-[0.035] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255, 255, 255, 0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.4) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* ================= TOP SAFE AREA & HEADER ================= */}
      {/* 140px top padding keeps everything below Instagram's top stories bar */}
      <header className="relative z-10 px-14 pt-36 pb-4">
        {/* Brand bar */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-0.5 shadow-lg shadow-indigo-500/25 flex items-center justify-center">
              <div className="w-full h-full bg-[#080d19] rounded-[14px] flex items-center justify-center">
                <Trophy className="w-6 h-6 text-indigo-400" />
              </div>
            </div>
            <div>
              <span className="text-2xl font-black tracking-wider text-white">
                CO<span className="text-indigo-400">LEAGUE</span>
              </span>
              <p className="text-xs text-slate-400 tracking-widest font-semibold uppercase">
                The Combined League
              </p>
            </div>
          </div>

          {/* Season pill */}
          <div className="flex items-center gap-2 px-5 py-2 rounded-full bg-white/[0.08] border border-white/15 backdrop-blur-md">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span className="text-sm font-bold tracking-wider text-slate-200">
              SEASON {season}
            </span>
          </div>
        </div>

        {/* Title area */}
        <div className="mt-2 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <IconComponent className="w-8 h-8 text-amber-400" />
              <h1 className="text-4xl font-black tracking-tight text-white uppercase drop-shadow-md">
                {displayTitle}
              </h1>
            </div>
            <p className="text-sm font-semibold tracking-wider text-indigo-300 uppercase">
              {displaySubtitle}
            </p>
          </div>

          {/* League Dots Indicator */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.05] border border-white/10 text-xs text-slate-300 font-semibold">
            <span>EPL</span>
            <span className="text-slate-600">•</span>
            <span>LALIGA</span>
            <span className="text-slate-600">•</span>
            <span>SERIE A</span>
            <span className="text-slate-600">•</span>
            <span>BUNDESLIGA</span>
            <span className="text-slate-600">•</span>
            <span>LIGUE 1</span>
          </div>
        </div>
      </header>

      {/* ================= TABLE CARD (960px wide, centered) ================= */}
      <main className="relative z-10 px-14 flex-1 flex flex-col justify-center">
        <div
          className="rounded-[32px] overflow-hidden border border-white/[0.12] shadow-2xl backdrop-blur-xl"
          style={{
            background: "rgba(13, 20, 36, 0.88)",
            boxShadow:
              "0 25px 60px -15px rgba(0, 0, 0, 0.7), inset 0 1px 1px rgba(255, 255, 255, 0.12)",
          }}
        >
          {/* Table Header */}
          <div className="grid grid-cols-12 px-6 py-4 bg-white/[0.04] border-b border-white/[0.08] text-xs font-black uppercase tracking-wider text-slate-400 items-center">
            <div className="col-span-1 text-center">#</div>
            <div className="col-span-5 pl-2">
              {type === "standings" ? "Club" : "Player / Club"}
            </div>
            <div className="col-span-2 text-center">League</div>
            {type === "standings" ? (
              <>
                <div className="col-span-1 text-center">P</div>
                <div className="col-span-1 text-center">W</div>
                <div className="col-span-1 text-center">GD</div>
                <div className="col-span-1 text-center font-bold text-amber-400">
                  PTS
                </div>
              </>
            ) : (
              <>
                <div className="col-span-1 text-center">Apps</div>
                <div className="col-span-1 text-center">Mins</div>
                <div className="col-span-2 text-center font-bold text-amber-400">
                  {config.heroLabel}
                </div>
              </>
            )}
          </div>

          {/* Table Body (10 Rows) */}
          <div className="divide-y divide-white/[0.06]">
            {top10.length > 0 ? (
              top10.map((item, idx) => {
                const rank = item.rank || idx + 1;
                const isFirst = rank === 1;
                const isSecond = rank === 2;
                const isThird = rank === 3;

                return (
                  <div
                    key={idx}
                    className={`grid grid-cols-12 px-6 py-3 items-center ${
                      isFirst
                        ? "bg-amber-400/[0.07]"
                        : idx % 2 === 1
                        ? "bg-white/[0.015]"
                        : "bg-transparent"
                    }`}
                    style={{ height: "94px" }}
                  >
                    {/* Rank Badge */}
                    <div className="col-span-1 flex justify-center">
                      {isFirst ? (
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-300 via-amber-400 to-yellow-600 flex items-center justify-center font-black text-amber-950 text-xl shadow-lg shadow-amber-400/25">
                          1
                        </div>
                      ) : isSecond ? (
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-200 via-slate-300 to-slate-400 flex items-center justify-center font-black text-slate-900 text-lg shadow-md shadow-slate-400/15">
                          2
                        </div>
                      ) : isThird ? (
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-600 via-amber-700 to-amber-900 flex items-center justify-center font-black text-amber-100 text-lg shadow-md shadow-amber-800/20">
                          3
                        </div>
                      ) : (
                        <div className="w-9 h-9 rounded-lg bg-white/[0.06] border border-white/[0.08] flex items-center justify-center font-bold text-slate-300 text-base">
                          {rank}
                        </div>
                      )}
                    </div>

                    {/* Standings Row Content */}
                    {type === "standings" && (
                      <>
                        {(() => {
                          const club = item as StandingItem;
                          const darkLeagueLogo =
                            club.league.darkLogoUrl ||
                            getLeagueDarkLogo(
                              club.league.slug || club.league.name
                            );

                          return (
                            <>
                              {/* Club Info */}
                              <div className="col-span-5 pl-2 flex items-center gap-3.5 min-w-0">
                                <div className="w-11 h-11 rounded-xl bg-white/[0.06] p-1 flex-shrink-0 flex items-center justify-center">
                                  {club.team.logoUrl ? (
                                    <img
                                      src={club.team.logoUrl}
                                      alt={club.team.name}
                                      crossOrigin="anonymous"
                                      className="w-full h-full object-contain"
                                    />
                                  ) : (
                                    <span className="text-xs font-bold text-slate-400">
                                      {club.team.shortDisplayName?.slice(0, 3)}
                                    </span>
                                  )}
                                </div>
                                <div className="truncate">
                                  <div className="font-bold text-white text-lg tracking-tight truncate">
                                    {club.team.name}
                                  </div>
                                  <div className="text-xs text-slate-400 font-semibold tracking-wider uppercase">
                                    {club.team.shortDisplayName}
                                  </div>
                                </div>
                              </div>

                              {/* League Badge */}
                              <div className="col-span-2 flex justify-center items-center">
                                {darkLeagueLogo ? (
                                  <img
                                    src={darkLeagueLogo}
                                    alt={club.league.name}
                                    crossOrigin="anonymous"
                                    className="w-8 h-8 object-contain drop-shadow"
                                  />
                                ) : (
                                  <span className="px-2 py-0.5 rounded bg-white/10 text-[10px] font-bold text-slate-300">
                                    {club.league.slug?.toUpperCase()}
                                  </span>
                                )}
                              </div>

                              {/* Games Played */}
                              <div className="col-span-1 text-center font-mono text-base text-slate-300 font-medium">
                                {club.gamesPlayed}
                              </div>

                              {/* Wins */}
                              <div className="col-span-1 text-center font-mono text-base text-slate-300 font-medium">
                                {club.wins}
                              </div>

                              {/* Goal Difference */}
                              <div className="col-span-1 text-center font-mono text-base font-bold">
                                <span
                                  className={
                                    club.goalDifference > 0
                                      ? "text-emerald-400"
                                      : club.goalDifference < 0
                                      ? "text-rose-400"
                                      : "text-slate-400"
                                  }
                                >
                                  {club.goalDifference > 0
                                    ? `+${club.goalDifference}`
                                    : club.goalDifference}
                                </span>
                              </div>

                              {/* Points (Hero Pill) */}
                              <div className="col-span-1 flex justify-center">
                                <span className="inline-flex items-center justify-center px-3 py-1 rounded-xl bg-amber-400/15 border border-amber-400/35 text-amber-300 font-mono font-black text-xl">
                                  {club.points}
                                </span>
                              </div>
                            </>
                          );
                        })()}
                      </>
                    )}

                    {/* Scorers / Assists Row Content */}
                    {(type === "scorers" || type === "assists") && (
                      <>
                        {(() => {
                          const player = item as PlayerLeaderItem;
                          const darkLeagueLogo =
                            player.league.darkLogoUrl ||
                            getLeagueDarkLogo(
                              player.league.slug || player.league.name
                            );
                          const heroStat =
                            type === "scorers" ? player.goals : player.assists;

                          return (
                            <>
                              {/* Player & Club */}
                              <div className="col-span-5 pl-2 flex items-center gap-3.5 min-w-0">
                                <div className="w-10 h-10 rounded-xl bg-white/[0.06] p-1 flex-shrink-0 flex items-center justify-center">
                                  {player.team.logoUrl ? (
                                    <img
                                      src={player.team.logoUrl}
                                      alt={player.team.shortDisplayName}
                                      crossOrigin="anonymous"
                                      className="w-full h-full object-contain"
                                    />
                                  ) : (
                                    <span className="text-xs font-bold text-slate-400">
                                      {player.team.shortDisplayName?.slice(0, 3)}
                                    </span>
                                  )}
                                </div>
                                <div className="truncate">
                                  <div className="font-bold text-white text-lg tracking-tight truncate">
                                    {player.athleteName}
                                  </div>
                                  <div className="text-xs text-slate-400 font-medium truncate">
                                    {player.team.shortDisplayName}
                                  </div>
                                </div>
                              </div>

                              {/* League Badge */}
                              <div className="col-span-2 flex justify-center items-center">
                                {darkLeagueLogo ? (
                                  <img
                                    src={darkLeagueLogo}
                                    alt={player.league.name}
                                    crossOrigin="anonymous"
                                    className="w-8 h-8 object-contain drop-shadow"
                                  />
                                ) : (
                                  <span className="px-2 py-0.5 rounded bg-white/10 text-[10px] font-bold text-slate-300">
                                    {player.league.slug?.toUpperCase()}
                                  </span>
                                )}
                              </div>

                              {/* Appearances */}
                              <div className="col-span-1 text-center font-mono text-base text-slate-300 font-medium">
                                {player.appearances}
                              </div>

                              {/* Minutes */}
                              <div className="col-span-1 text-center font-mono text-sm text-slate-400">
                                {player.minutes ? `${player.minutes}'` : "-"}
                              </div>

                              {/* Hero Stat (Goals or Assists) */}
                              <div className="col-span-2 flex justify-center">
                                <span
                                  className={`inline-flex items-center justify-center min-w-[54px] px-3.5 py-1 rounded-xl border font-mono font-black text-2xl ${config.pillBg}`}
                                >
                                  {heroStat}
                                </span>
                              </div>
                            </>
                          );
                        })()}
                      </>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="py-16 text-center text-slate-500 font-medium">
                No leaderboard entries available
              </div>
            )}
          </div>
        </div>
      </main>

      {/* ================= BOTTOM SAFE AREA & FOOTER ================= */}
      {/* 160px bottom margin keeps everything above Instagram story input & reactions */}
      <footer className="relative z-10 px-14 pb-28 pt-4">
        <div className="flex items-center justify-between border-t border-white/[0.08] pt-5">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-sm font-bold tracking-wider text-slate-300 uppercase">
              Live Stats & Table
            </span>
          </div>

          <div className="text-right">
            <div className="text-base font-black tracking-wide text-white">
              co-league.com
            </div>
            <div className="text-xs text-slate-400 font-medium">
              Share to your story & tag your friends
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
