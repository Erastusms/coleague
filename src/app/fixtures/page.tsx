"use client";

import React, { useState, useEffect, useRef } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { FilterBar } from "@/components/FilterBar";
import { MatchCard } from "@/components/MatchCard";
import { MatchItem } from "@/types/match";
import { DEFAULT_LEAGUES, DEFAULT_SEASON, SeasonYear, LEAGUES } from "@/lib/constants";
import { Sparkles, Calendar, AlertCircle } from "lucide-react";

export default function FixturesPage() {
  const [selectedSeason, setSelectedSeason] = useState<SeasonYear>(DEFAULT_SEASON);
  const [selectedLeagues, setSelectedLeagues] = useState<string[]>(DEFAULT_LEAGUES);
  const [matches, setMatches] = useState<MatchItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const matchesReqId = useRef(0);

  const handleSeasonChange = (season: SeasonYear) => {
    if (season !== selectedSeason) {
      setLoading(true);
      setSelectedSeason(season);
    }
  };

  // League filter handlers
  const handleLeagueToggle = (slug: string) => {
    setSelectedLeagues((prev) => {
      if (prev.includes(slug)) {
        if (prev.length === 1) return prev; // Keep at least one league
        setLoading(true);
        return prev.filter((s) => s !== slug);
      } else {
        setLoading(true);
        return [...prev, slug];
      }
    });
  };

  const handleSelectAllLeagues = () => {
    if (selectedLeagues.length !== LEAGUES.length) {
      setLoading(true);
      setSelectedLeagues(LEAGUES.map((l) => l.slug));
    }
  };

  const handleClearLeagues = () => {
    if (selectedLeagues.length !== DEFAULT_LEAGUES.length) {
      setLoading(true);
      setSelectedLeagues(DEFAULT_LEAGUES);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setLoading(true);
    const reqId = ++matchesReqId.current;
    try {
      const leaguesQuery = selectedLeagues.join(",");
      const res = await fetch(
        `/api/matches?seasons=${selectedSeason}&leagues=${leaguesQuery}`
      );
      if (!res.ok) {
        throw new Error(`Failed to load matches: ${res.statusText}`);
      }
      const data = await res.json();
      if (reqId === matchesReqId.current) {
        setMatches(data.matches || []);
        setError(null);
      }
    } catch (err: unknown) {
      if (reqId === matchesReqId.current) {
        setError(err instanceof Error ? err.message : "Failed to load matches.");
      }
    } finally {
      if (reqId === matchesReqId.current) {
        setLoading(false);
        setIsRefreshing(false);
      }
    }
  };

  // Fetch matches whenever season or league filter changes
  useEffect(() => {
    const reqId = ++matchesReqId.current;

    async function loadMatches() {
      try {
        const leaguesQuery = selectedLeagues.join(",");
        const res = await fetch(
          `/api/matches?seasons=${selectedSeason}&leagues=${leaguesQuery}`
        );
        if (!res.ok) {
          throw new Error(`Failed to load matches: ${res.statusText}`);
        }
        const data = await res.json();
        if (reqId === matchesReqId.current) {
          setMatches(data.matches || []);
          setError(null);
        }
      } catch (err: unknown) {
        if (reqId === matchesReqId.current) {
          console.error("Error loading matches:", err);
          setError(
            err instanceof Error ? err.message : "Failed to load matches."
          );
        }
      } finally {
        if (reqId === matchesReqId.current) {
          setLoading(false);
        }
      }
    }

    loadMatches();
  }, [selectedSeason, selectedLeagues]);

  return (
    <div className="min-h-screen flex flex-col selection:bg-indigo-500 selection:text-white">
      <Header onRefresh={handleRefresh} isRefreshing={isRefreshing} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-2 sm:px-6 lg:px-8 py-3 md:py-6 pb-28 md:pb-6">
        {/* Subtle top loading progress bar */}
        {loading && (
          <div className="fixed top-0 left-0 right-0 h-1 bg-slate-100 dark:bg-slate-800 overflow-hidden z-50">
            <div className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 animate-[pulse_1s_infinite] w-full" />
          </div>
        )}

        {/* Global Filter Bar */}
        <FilterBar
          selectedSeason={selectedSeason}
          onSeasonChange={handleSeasonChange}
          selectedLeagues={selectedLeagues}
          onLeagueToggle={handleLeagueToggle}
          onSelectAllLeagues={handleSelectAllLeagues}
          onClearLeagues={handleClearLeagues}
        />

        {/* Content Section */}
        {loading && matches.length === 0 ? (
          /* Initial Loading Skeletons with Centered Circular Indicator */
          <div className="relative min-h-[400px]">
            <div
              role="status"
              aria-live="polite"
              className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-white/60 dark:bg-slate-900/60 backdrop-blur-[2px] transition-all duration-200 pointer-events-none"
            >
              <div className="flex flex-col items-center gap-3 px-6 py-4 rounded-2xl bg-white/95 dark:bg-slate-800/95 border border-slate-200/80 dark:border-slate-700/80 shadow-2xl shadow-indigo-950/10 dark:shadow-black/50 pointer-events-auto">
                <div className="w-9 h-9 rounded-full border-[3px] border-indigo-100 dark:border-indigo-950 border-t-indigo-600 dark:border-t-indigo-400 animate-spin" />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 tracking-wide">
                  Loading fixtures...
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="h-48 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 animate-pulse flex flex-col justify-between"
                >
                  <div className="flex justify-between items-center">
                    <div className="h-4 w-28 bg-slate-200 dark:bg-slate-800 rounded" />
                    <div className="h-4 w-20 bg-slate-200 dark:bg-slate-800 rounded-full" />
                  </div>
                  <div className="flex justify-around items-center my-4">
                    <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-800" />
                    <div className="h-8 w-20 bg-slate-200 dark:bg-slate-800 rounded-xl" />
                    <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-800" />
                  </div>
                  <div className="h-4 w-40 bg-slate-200 dark:bg-slate-800 rounded" />
                </div>
              ))}
            </div>
          </div>
        ) : error && !loading ? (
          /* Error State */
          <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 rounded-2xl p-8 text-center max-w-lg mx-auto">
            <AlertCircle className="w-8 h-8 text-rose-600 dark:text-rose-400 mx-auto mb-3" />
            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-1">
              Unable to Load Matches
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-4">{error}</p>
            <button
              onClick={() => handleSeasonChange(2026)}
              className="px-4 py-2 bg-rose-600 text-white text-xs font-bold rounded-xl shadow cursor-pointer hover:bg-rose-700 transition-colors"
            >
              Retry
            </button>
          </div>
        ) : matches.length === 0 && !loading ? (
          /* Clean Empty State for Seasons 2023-2024 or Filter with 0 results */
          <div className="bg-white dark:bg-slate-900/80 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-3xl p-10 sm:p-14 text-center max-w-2xl mx-auto shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 flex items-center justify-center mx-auto mb-5 text-indigo-600 dark:text-indigo-400 shadow-inner">
              <Calendar className="w-8 h-8" />
            </div>

            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
              No match data available for this selection yet
            </h3>

            <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto mb-6 leading-relaxed">
              Match details, tactical lineups, and highest-scoring fixture rankings appear once match data is ingested for the selected season and leagues. You can sync match fixtures from the Admin Portal.
            </p>

            {selectedSeason !== 2026 && (
              <button
                onClick={() => handleSeasonChange(2026)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Switch to 2026 Season</span>
              </button>
            )}
          </div>
        ) : (
          /* Matches Grid (Top 10 Highest-Scoring with Circular Loading Indicator) */
          <div className="relative min-h-[400px]">
            {/* Circular Loading Indicator Overlay */}
            {loading && (
              <div
                role="status"
                aria-live="polite"
                className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-white/60 dark:bg-slate-900/60 backdrop-blur-[2px] transition-all duration-200 pointer-events-none"
              >
                <div className="flex flex-col items-center gap-3 px-6 py-4 rounded-2xl bg-white/95 dark:bg-slate-800/95 border border-slate-200/80 dark:border-slate-700/80 shadow-2xl shadow-indigo-950/10 dark:shadow-black/50 pointer-events-auto">
                  <div className="w-9 h-9 rounded-full border-[3px] border-indigo-100 dark:border-indigo-950 border-t-indigo-600 dark:border-t-indigo-400 animate-spin" />
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 tracking-wide">
                    Loading fixtures...
                  </span>
                </div>
              </div>
            )}

            <div>
              <div className="mb-4 flex items-center justify-between">
                {/* Desktop View */}
                <div className="hidden md:flex items-center gap-2.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Showing Top {matches.length} Matches
                  </span>
                  <span className="text-xs font-mono text-slate-400 dark:text-slate-500">
                    (Sorted by Combined Goals)
                  </span>
                  {loading && (
                    <div
                      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/80 dark:border-indigo-800/80 text-indigo-600 dark:text-indigo-400"
                      title="Updating fixtures data"
                    >
                      <div className="w-3.5 h-3.5 rounded-full border-2 border-indigo-600/30 border-t-indigo-600 dark:border-indigo-400/30 dark:border-t-indigo-400 animate-spin" />
                      <span className="text-[11px] font-semibold hidden sm:inline">Updating</span>
                    </div>
                  )}
                </div>

                {/* Mobile View */}
                <div className="flex md:hidden items-center justify-center text-center w-full gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Top 10 Matches with the most goals
                  </span>
                  {loading && (
                    <div className="w-3.5 h-3.5 rounded-full border-2 border-indigo-600/30 border-t-indigo-600 dark:border-indigo-400/30 dark:border-t-indigo-400 animate-spin" />
                  )}
                </div>
              </div>

              <div
                className={`grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 transition-opacity duration-200 ${
                  loading ? "opacity-40 pointer-events-none" : "opacity-100"
                }`}
              >
                {matches.map((match) => (
                  <MatchCard key={match.id} match={match} />
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
