"use client";

import React from "react";
import { Header } from "@/components/Header";
import { FilterBar } from "@/components/FilterBar";
import { StandingsTable } from "@/components/StandingsTable";
import { LeadersSection } from "@/components/LeadersSection";
import { Footer } from "@/components/Footer";
import { useColeagueFilters } from "@/lib/useColeagueFilters";
import { AlertCircle } from "lucide-react";

export default function HomePage() {
  const {
    selectedSeason,
    setSelectedSeason,
    selectedLeagues,
    handleLeagueToggle,
    handleSelectAllLeagues,
    handleClearLeagues,
    standings,
    totalAvailableClubs,
    topScorers,
    topAssists,
    isLoadingStandings,
    isLoadingLeaders,
    isRefreshing,
    errorMessage,
    handleRefresh,
  } = useColeagueFilters();

  return (
    <div className="min-h-screen flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Navbar with 4 items & theme toggle */}
      <Header onRefresh={handleRefresh} isRefreshing={isRefreshing} />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-2 sm:px-6 lg:px-8 py-3 md:py-6 pb-28 md:pb-6">
        {/* Error Alert if any */}
        {errorMessage && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-3 text-rose-600 dark:text-rose-300 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Global Filter Bar: League Toggle Pills & Season Selector */}
        <FilterBar
          selectedSeason={selectedSeason}
          onSeasonChange={setSelectedSeason}
          selectedLeagues={selectedLeagues}
          onLeagueToggle={handleLeagueToggle}
          onSelectAllLeagues={handleSelectAllLeagues}
          onClearLeagues={handleClearLeagues}
        />

        {/* 1. Standings Table Section */}
        <StandingsTable
          standings={standings}
          isLoading={isLoadingStandings}
          totalAvailable={totalAvailableClubs}
          season={selectedSeason}
        />

        {/* 2. Top Scorers & Top Assists Section */}
        <div className="pt-2 border-t border-slate-200 dark:border-slate-800/80">
          <LeadersSection
            topScorers={topScorers}
            topAssists={topAssists}
            isLoading={isLoadingLeaders}
            season={selectedSeason}
          />
        </div>
      </main>

      <Footer />
    </div>
  );
}
