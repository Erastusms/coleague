"use client";

import React, { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { FilterBar } from "@/components/FilterBar";
import { MatchCard } from "@/components/MatchCard";
import { MatchItem } from "@/types/match";
import { DEFAULT_LEAGUES, DEFAULT_SEASON, SeasonYear, LEAGUES } from "@/lib/constants";
import { Sparkles, Calendar, Flame, AlertCircle } from "lucide-react";

export default function FixturesPage() {
  const [selectedSeason, setSelectedSeason] = useState<SeasonYear>(DEFAULT_SEASON);
  const [selectedLeagues, setSelectedLeagues] = useState<string[]>(DEFAULT_LEAGUES);
  const [matches, setMatches] = useState<MatchItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // League filter handlers
  const handleLeagueToggle = (slug: string) => {
    setSelectedLeagues((prev) => {
      if (prev.includes(slug)) {
        if (prev.length === 1) return prev; // Keep at least one league
        return prev.filter((s) => s !== slug);
      } else {
        return [...prev, slug];
      }
    });
  };

  const handleSelectAllLeagues = () => {
    setSelectedLeagues(LEAGUES.map((l) => l.slug));
  };

  const handleClearLeagues = () => {
    setSelectedLeagues(DEFAULT_LEAGUES);
  };

  // Fetch matches whenever season or league filter changes
  useEffect(() => {
    let isCancelled = false;

    async function loadMatches() {
      setLoading(true);
      setError(null);

      // Only seasons 2025 and 2026 have ingested match records
      if (selectedSeason !== 2026 && selectedSeason !== 2025) {
        setMatches([]);
        setLoading(false);
        return;
      }

      try {
        const leaguesQuery = selectedLeagues.join(",");
        const res = await fetch(
          `/api/matches?seasons=${selectedSeason}&leagues=${leaguesQuery}`
        );
        if (!res.ok) {
          throw new Error(`Failed to load matches: ${res.statusText}`);
        }
        const data = await res.json();
        if (!isCancelled) {
          setMatches(data.matches || []);
        }
      } catch (err: any) {
        if (!isCancelled) {
          console.error("Error loading matches:", err);
          setError(err.message || "Failed to load matches.");
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }

    loadMatches();

    return () => {
      isCancelled = true;
    };
  }, [selectedSeason, selectedLeagues]);

  return (
    <div className="min-h-screen flex flex-col selection:bg-indigo-500 selection:text-white">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-2 sm:px-6 lg:px-8 py-4 sm:py-10 pb-28 md:pb-10">
        {/* Page Hero Header (Hidden on mobile) */}
        <div className="hidden md:block mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20 mb-3">
            <Flame className="w-3.5 h-3.5 text-rose-500" />
            <span>Top 10 Highest-Scoring Matches</span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            Matchday Fixtures & Thrillers
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mt-2 max-w-2xl">
            Relive the most entertaining, goal-heavy fixtures across Europe. Click any match card to explore comparative team statistics, tactical pitch formations, and full substitution logs.
          </p>
        </div>

        {/* Global Filter Bar */}
        <FilterBar
          selectedSeason={selectedSeason}
          onSeasonChange={setSelectedSeason}
          selectedLeagues={selectedLeagues}
          onLeagueToggle={handleLeagueToggle}
          onSelectAllLeagues={handleSelectAllLeagues}
          onClearLeagues={handleClearLeagues}
        />

        {/* Content Section */}
        {loading ? (
          /* Loading Skeletons */
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
        ) : error ? (
          /* Error State */
          <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 rounded-2xl p-8 text-center max-w-lg mx-auto">
            <AlertCircle className="w-8 h-8 text-rose-600 dark:text-rose-400 mx-auto mb-3" />
            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-1">
              Unable to Load Matches
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-4">{error}</p>
            <button
              onClick={() => setSelectedSeason(2026)}
              className="px-4 py-2 bg-rose-600 text-white text-xs font-bold rounded-xl shadow cursor-pointer hover:bg-rose-700 transition-colors"
            >
              Retry
            </button>
          </div>
        ) : matches.length === 0 ? (
          /* Clean Empty State for Seasons 2023-2024 or Filter with 0 results */
          <div className="bg-white dark:bg-slate-900/80 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-3xl p-10 sm:p-14 text-center max-w-2xl mx-auto shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 flex items-center justify-center mx-auto mb-5 text-indigo-600 dark:text-indigo-400 shadow-inner">
              <Calendar className="w-8 h-8" />
            </div>

            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
              No match data available for this season yet
            </h3>

            <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto mb-6 leading-relaxed">
              Match details, tactical lineups, and highest-scoring fixture rankings are available for the{" "}
              <strong className="text-slate-800 dark:text-slate-200">2026/2027</strong> and{" "}
              <strong className="text-slate-800 dark:text-slate-200">2025/2026</strong> seasons.
            </p>

            {selectedSeason !== 2026 && (
              <button
                onClick={() => setSelectedSeason(2026)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Switch to 2026 Season</span>
              </button>
            )}
          </div>
        ) : (
          /* Matches Grid (Top 10 Highest-Scoring) */
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Showing Top {matches.length} Matches
                </span>
                <span className="text-xs font-mono text-slate-400 dark:text-slate-500">
                  (Sorted by Combined Goals)
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {matches.map((match) => (
                <MatchCard key={match.id} match={match} />
              ))}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
