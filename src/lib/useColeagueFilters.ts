"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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

  const standingsReqId = useRef(0);
  const leadersReqId = useRef(0);

  const handleSeasonChange = (season: SeasonYear) => {
    if (season !== selectedSeason) {
      setIsLoadingStandings(true);
      setIsLoadingLeaders(true);
      setSelectedSeason(season);
    }
  };

  const handleLeagueToggle = (slug: string) => {
    setSelectedLeagues((prev) => {
      if (prev.includes(slug)) {
        if (prev.length === 1) return prev; // Keep at least 1 league selected
        setIsLoadingStandings(true);
        setIsLoadingLeaders(true);
        return prev.filter((s) => s !== slug);
      } else {
        setIsLoadingStandings(true);
        setIsLoadingLeaders(true);
        return [...prev, slug];
      }
    });
  };

  const handleSelectAllLeagues = () => {
    if (selectedLeagues.length !== DEFAULT_LEAGUES.length) {
      setIsLoadingStandings(true);
      setIsLoadingLeaders(true);
      setSelectedLeagues(DEFAULT_LEAGUES);
    }
  };

  const handleClearLeagues = () => {
    if (selectedLeagues.length !== DEFAULT_LEAGUES.length) {
      setIsLoadingStandings(true);
      setIsLoadingLeaders(true);
      setSelectedLeagues(DEFAULT_LEAGUES);
    }
  };

  const fetchStandings = useCallback(async () => {
    const reqId = ++standingsReqId.current;
    try {
      const leaguesParam = selectedLeagues.join(",");
      const res = await fetch(
        `/api/standings?seasons=${selectedSeason}&leagues=${leaguesParam}`
      );
      if (!res.ok) {
        throw new Error(`Failed to load standings: ${res.statusText}`);
      }
      const data: StandingsApiResponse = await res.json();
      if (reqId === standingsReqId.current) {
        setStandings(data.standings || []);
        setTotalAvailableClubs(data.totalAvailable || 0);
        setErrorMessage(null);
      }
    } catch (err: unknown) {
      if (reqId === standingsReqId.current) {
        console.error(err);
        setErrorMessage(
          err instanceof Error ? err.message : "Failed to fetch standings"
        );
      }
    } finally {
      if (reqId === standingsReqId.current) {
        setIsLoadingStandings(false);
      }
    }
  }, [selectedSeason, selectedLeagues]);

  const fetchLeaders = useCallback(async () => {
    const reqId = ++leadersReqId.current;
    try {
      const leaguesParam = selectedLeagues.join(",");
      const res = await fetch(
        `/api/leaders?seasons=${selectedSeason}&leagues=${leaguesParam}`
      );
      if (!res.ok) {
        throw new Error(`Failed to load leaders: ${res.statusText}`);
      }
      const data: LeadersApiResponse = await res.json();
      if (reqId === leadersReqId.current) {
        setTopScorers(data.topScorers || []);
        setTopAssists(data.topAssists || []);
      }
    } catch (err: unknown) {
      if (reqId === leadersReqId.current) {
        console.error(err);
      }
    } finally {
      if (reqId === leadersReqId.current) {
        setIsLoadingLeaders(false);
      }
    }
  }, [selectedSeason, selectedLeagues]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchStandings();
    fetchLeaders();
  }, [fetchStandings, fetchLeaders]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setIsLoadingStandings(true);
    setIsLoadingLeaders(true);
    await Promise.all([fetchStandings(), fetchLeaders()]);
    setIsRefreshing(false);
  };

  return {
    selectedSeason,
    setSelectedSeason: handleSeasonChange,
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
