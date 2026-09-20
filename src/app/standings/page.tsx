"use client";

import React from "react";
import { Header } from "@/components/Header";
import { FilterBar } from "@/components/FilterBar";
import { StandingsTable } from "@/components/StandingsTable";
import { Footer } from "@/components/Footer";
import { useColeagueFilters } from "@/lib/useColeagueFilters";
import { AlertCircle } from "lucide-react";

export default function StandingsPage() {
  const {
    selectedSeason,
    setSelectedSeason,
    selectedLeagues,
    handleLeagueToggle,
    handleSelectAllLeagues,
    handleClearLeagues,
    standings,
    totalAvailableClubs,
    isLoadingStandings,
    isRefreshing,
    errorMessage,
    handleRefresh,
  } = useColeagueFilters();

  return (
    <div className="min-h-screen flex flex-col selection:bg-indigo-500 selection:text-white">
      <Header onRefresh={handleRefresh} isRefreshing={isRefreshing} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {errorMessage && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-3 text-rose-600 dark:text-rose-300 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Filters */}
        <FilterBar
          selectedSeason={selectedSeason}
          onSeasonChange={setSelectedSeason}
          selectedLeagues={selectedLeagues}
          onLeagueToggle={handleLeagueToggle}
          onSelectAllLeagues={handleSelectAllLeagues}
          onClearLeagues={handleClearLeagues}
        />

        {/* Standings Table Only */}
        <StandingsTable
          standings={standings}
          isLoading={isLoadingStandings}
          totalAvailable={totalAvailableClubs}
        />
      </main>

      <Footer />
    </div>
  );
}
