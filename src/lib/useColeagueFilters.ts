"use client";

import { useState, useEffect, useCallback } from "react";
import { DEFAULT_LEAGUES, DEFAULT_SEASON, SeasonYear } from "./constants";
import {
  StandingItem,
  PlayerLeaderItem,
  StandingsApiResponse,
  LeadersApiResponse,
} from "./types";

export function useColeagueFilters() {
  const [selectedSeason, setSelectedSeason] = useState<SeasonYear>(DEFAULT_SEASON);
  const [selectedLeagues, setSelectedLeagues] = useState<string[]>(DEFAULT_LEAGUES);

  const [standings, setStandings] = useState<StandingItem[]>([]);
  const [totalAvailableClubs, setTotalAvailableClubs] = useState<number>(0);
  const [topScorers, setTopScorers] = useState<PlayerLeaderItem[]>([]);
  const [topAssists, setTopAssists] = useState<PlayerLeaderItem[]>([]);

  const [isLoadingStandings, setIsLoadingStandings] = useState<boolean>(true);
  const [isLoadingLeaders, setIsLoadingLeaders] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLeagueToggle = (slug: string) => {
    setSelectedLeagues((prev) => {
      if (prev.includes(slug)) {
        if (prev.length === 1) return prev; // Keep at least 1 league selected
        return prev.filter((s) => s !== slug);
      } else {
        return [...prev, slug];
      }
    });
  };

  const handleSelectAllLeagues = () => {
    setSelectedLeagues(DEFAULT_LEAGUES);
  };

  const handleClearLeagues = () => {
    // When "Reset" is clicked, all five leagues must be selected by default
    setSelectedLeagues(DEFAULT_LEAGUES);
  };

  const fetchStandings = useCallback(async () => {
    setIsLoadingStandings(true);
    setErrorMessage(null);
    try {
      const leaguesParam = selectedLeagues.join(",");
      const res = await fetch(
        `/api/standings?seasons=${selectedSeason}&leagues=${leaguesParam}`
      );
      if (!res.ok) {
        throw new Error(`Failed to load standings: ${res.statusText}`);
      }
      const data: StandingsApiResponse = await res.json();
      setStandings(data.standings || []);
      setTotalAvailableClubs(data.totalAvailable || 0);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "Failed to fetch standings");
    } finally {
      setIsLoadingStandings(false);
    }
  }, [selectedSeason, selectedLeagues]);

  const fetchLeaders = useCallback(async () => {
    setIsLoadingLeaders(true);
    try {
      const leaguesParam = selectedLeagues.join(",");
      const res = await fetch(
        `/api/leaders?seasons=${selectedSeason}&leagues=${leaguesParam}`
      );
      if (!res.ok) {
        throw new Error(`Failed to load leaders: ${res.statusText}`);
      }
      const data: LeadersApiResponse = await res.json();
      setTopScorers(data.topScorers || []);
      setTopAssists(data.topAssists || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsLoadingLeaders(false);
    }
  }, [selectedSeason, selectedLeagues]);

  useEffect(() => {
    fetchStandings();
    fetchLeaders();
  }, [fetchStandings, fetchLeaders]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([fetchStandings(), fetchLeaders()]);
    setIsRefreshing(false);
  };

  return {
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
  };
}
