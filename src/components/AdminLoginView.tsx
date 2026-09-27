"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Shield,
  Lock,
  User as UserIcon,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Trophy,
  Database,
  ArrowRight,
  LogOut,
  Sparkles,
  ExternalLink,
  Flame,
  Activity,
  Layers,
  Calendar,
} from "lucide-react";
import { LEAGUES, SEASONS } from "@/lib/constants";
import { ThemeToggle } from "./ThemeToggle";

interface UserSession {
  id: string;
  username: string;
  userType: string;
  name?: string | null;
  email?: string | null;
}

interface DbStats {
  teamCount: number;
  standingsCount: number;
  playerStatsCount: number;
  matchesCount?: number;
  lastStandingUpdated: string | null;
  lastPlayerStatUpdated: string | null;
  lastMatchUpdated?: string | null;
}

interface SyncResponseResult {
  leaguesProcessed: number;
  teamsUpserted: number;
  standingsUpserted: number;
  playerStatsUpserted: number;
  durationSeconds: number;
  errors: string[];
}

export function AdminLoginView() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Authenticated state
  const [adminUser, setAdminUser] = useState<UserSession | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  // ESPN Sync state
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{
    success: boolean;
    message: string;
    result?: SyncResponseResult;
  } | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  // Sync options
  const [selectedSeasons, setSelectedSeasons] = useState<number[]>([2026]);
  const [selectedLeagues, setSelectedLeagues] = useState<string[]>(
    LEAGUES.map((l) => l.slug)
  );

  // Match Fixtures Sync state
  const [matchSeason, setMatchSeason] = useState<number>(2026);
  const [matchLeague, setMatchLeague] = useState<string>("eng.1");
  const [isSyncingMatches, setIsSyncingMatches] = useState(false);
  const [matchSyncResult, setMatchSyncResult] = useState<{
    success: boolean;
    message: string;
    result?: {
      season: number;
      leagueSlug: string;
      leagueName: string;
      matchesIngested: number;
      teamsUpserted: number;
      summariesFetched: number;
      durationSeconds: number;
      errors: string[];
    };
  } | null>(null);
  const [matchSyncError, setMatchSyncError] = useState<string | null>(null);

  // Database metrics
  const [dbStats, setDbStats] = useState<DbStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  const fetchDbStats = React.useCallback(async () => {
    setIsLoadingStats(true);
    try {
      const res = await fetch("/api/admin/status");
      if (res.ok) {
        const data = await res.json();
        if (data.stats) {
          setDbStats(data.stats);
        }
      }
    } catch (e: unknown) {
      console.error("Failed to load db stats:", e);
    } finally {
      setIsLoadingStats(false);
    }
  }, []);

  // Check existing session on load
  useEffect(() => {
    let isMounted = true;

    async function loadSession() {
      try {
        const res = await fetch("/api/admin/me");
        if (res.ok && isMounted) {
          const data = await res.json();
          if (data.authenticated && data.user) {
            setAdminUser(data.user);
            fetchDbStats();
          }
        }
      } catch {
        // not authenticated
      } finally {
        if (isMounted) {
          setIsCheckingSession(false);
        }
      }
    }

    loadSession();

    return () => {
      isMounted = false;
    };
  }, [fetchDbStats]);

  const refreshSession = React.useCallback(async () => {
    try {
      const res = await fetch("/api/admin/me");
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated && data.user) {
          setAdminUser(data.user);
          fetchDbStats();
        }
      }
    } catch {
      // not authenticated
    }
  }, [fetchDbStats]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsLoggingIn(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setLoginError(data.error || "Login failed. Check your credentials.");
      } else {
        setAdminUser(data.user);
        setPassword("");
        fetchDbStats();
      }
    } catch {
      setLoginError("A network error occurred. Please try again.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/logout", { method: "POST" });
    } finally {
      setAdminUser(null);
      setDbStats(null);
      setSyncResult(null);
      setSyncError(null);
    }
  };

  // Dedicated function to update Standings, Top Scorers, and Top Assists via ESPN API
  const handleUpdateEspnData = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    setSyncError(null);
    setSyncResult(null);
    setIsSyncing(true);

    try {
      // If not logged in but credentials entered, pass them in the payload
      const payload: {
        username?: string;
        password?: string;
        seasons: number[];
        leagues: string[];
      } = {
        seasons: selectedSeasons,
        leagues: selectedLeagues,
      };

      if (!adminUser && username && password) {
        payload.username = username;
        payload.password = password;
      }

      const res = await fetch("/api/admin/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setSyncError(data.error || "Failed to update data from ESPN API.");
      } else {
        setSyncResult({
          success: data.success,
          message: data.message,
          result: data.result,
        });

        // If user logged in via credentials during sync, refresh session
        if (!adminUser && (data.triggeredBy || data.success)) {
          refreshSession();
        } else {
          fetchDbStats();
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Network error while connecting to ESPN API.";
      setSyncError(msg);
    } finally {
      setIsSyncing(false);
    }
  };

  const toggleSeason = (season: number) => {
    setSelectedSeasons((prev) =>
      prev.includes(season)
        ? prev.length > 1
          ? prev.filter((s) => s !== season)
          : prev
        : [...prev, season].sort((a, b) => b - a)
    );
  };

  const toggleLeague = (slug: string) => {
    setSelectedLeagues((prev) =>
      prev.includes(slug)
        ? prev.length > 1
          ? prev.filter((s) => s !== slug)
          : prev
        : [...prev, slug]
    );
  };

  const handleSyncMatches = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setMatchSyncError(null);
    setMatchSyncResult(null);
    setIsSyncingMatches(true);

    try {
      const payload: {
        username?: string;
        password?: string;
        season: number;
        league: string;
      } = {
        season: matchSeason,
        league: matchLeague,
      };

      if (!adminUser && username && password) {
        payload.username = username;
        payload.password = password;
      }

      const res = await fetch("/api/admin/sync-matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setMatchSyncError(data.error || "Failed to sync match fixtures from ESPN API.");
      } else {
        setMatchSyncResult({
          success: data.success,
          message: data.message,
          result: data.result,
        });
        fetchDbStats();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Network error while syncing match fixtures.";
      setMatchSyncError(msg);
    } finally {
      setIsSyncingMatches(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-indigo-500 selection:text-white flex flex-col">
      {/* Top Bar for Admin */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center shadow-md shadow-indigo-500/20 text-white font-black text-sm">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold tracking-tight text-slate-900 dark:text-white text-base">
                  COLEAGUE ADMIN
                </span>
                <span className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                  Protected
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Dedicated Management & ESPN Ingestion Portal
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {adminUser && (
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            )}
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8">
        {isCheckingSession ? (
          <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
            <RefreshCw className="w-8 h-8 animate-spin text-indigo-500" />
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Verifying administrative credentials...
            </p>
          </div>
        ) : !adminUser ? (
          /* ======================================================== */
          /*  LOGIN FORM VIEW (UNAUTHENTICATED)                        */
          /* ======================================================== */
          <div className="max-w-md mx-auto pt-6 pb-12">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
              {/* Header Card Graphic */}
              <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 p-6 text-white text-center relative overflow-hidden">
                <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />
                <div className="inline-flex p-3 bg-white/10 rounded-2xl backdrop-blur-md mb-3 border border-white/20">
                  <Lock className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-xl font-bold tracking-tight">Admin Sign In</h1>
                <p className="text-xs text-indigo-100 mt-1 max-w-xs mx-auto">
                  Enter your administrator credentials to access ESPN data sync and league operations.
                </p>
              </div>

              {/* Login Form */}
              <form onSubmit={handleLogin} className="p-6 space-y-4">
                {loginError && (
                  <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 flex items-start gap-2.5 text-rose-700 dark:text-rose-300 text-xs">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>{loginError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Username
                  </label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="admin"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 text-slate-900 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoggingIn}
                  className="w-full mt-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isLoggingIn ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Authenticating...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In to Admin Panel</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                {/* Direct Sync with entered credentials feature on login screen */}
                <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                  <div className="p-3.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/70 dark:border-indigo-900/60">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900 dark:text-indigo-300">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                        <span>Direct ESPN Update</span>
                      </div>
                      <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">
                        Instant Action
                      </span>
                    </div>
                    <p className="text-[11px] text-indigo-800/80 dark:text-indigo-300/80 mb-2.5 leading-relaxed">
                      You can also execute the ESPN Standings & Leaderboards sync directly using your credentials without navigating away.
                    </p>
                    <button
                      type="button"
                      disabled={isSyncing || !username || !password}
                      onClick={() => handleUpdateEspnData()}
                      className="w-full py-2 px-3 bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-40 cursor-pointer shadow-sm"
                    >
                      <RefreshCw
                        className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin text-indigo-600" : ""}`}
                      />
                      <span>
                        {isSyncing
                          ? "Calling ESPN API & Updating DB..."
                          : "Run ESPN Sync with Credentials"}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Sync feedback on login card if triggered directly */}
                {syncError && (
                  <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{syncError}</span>
                  </div>
                )}

                {syncResult && (
                  <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs">
                    <div className="flex items-center gap-2 font-bold mb-1">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>{syncResult.message}</span>
                    </div>
                    {syncResult.result && (
                      <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-600 dark:text-slate-300 mt-1">
                        <div>Standings: +{syncResult.result.standingsUpserted}</div>
                        <div>Player Stats: +{syncResult.result.playerStatsUpserted}</div>
                      </div>
                    )}
                  </div>
                )}
              </form>
            </div>

            {/* Note regarding manual URL access & privacy */}
            <div className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              <p>
                🔒 This admin page is dedicated and unlinked from the public site. Only accessible via manual URL entry.
              </p>
            </div>
          </div>
        ) : (
          /* ======================================================== */
          /*  AUTHENTICATED ADMIN CONTROL PANEL                       */
          /* ======================================================== */
          <div className="space-y-6">
            {/* Top Welcome & Session Info Card */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-900/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                    <UserIcon className="w-7 h-7" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5">
                      <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                        {adminUser.name || adminUser.username}
                      </h2>
                      <span className="px-2.5 py-0.5 text-xs font-bold uppercase rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        {adminUser.userType}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Logged in as <span className="font-semibold text-slate-700 dark:text-slate-200">@{adminUser.username}</span> • User ID: {adminUser.id}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Link
                    href="/"
                    target="_blank"
                    className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
                  >
                    <span>View Public League</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-900/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Database Teams
                  </span>
                  <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
                    <Database className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
                  {isLoadingStats ? "..." : dbStats?.teamCount ?? "—"}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Across 5 European Leagues
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Standings Entries
                  </span>
                  <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400">
                    <Trophy className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
                  {isLoadingStats ? "..." : dbStats?.standingsCount ?? "—"}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Points, W/D/L, GD & Form
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Top Scorers & Assists
                  </span>
                  <div className="p-2 rounded-xl bg-pink-50 dark:bg-pink-950/50 text-pink-600 dark:text-pink-400">
                    <Flame className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
                  {isLoadingStats ? "..." : dbStats?.playerStatsCount ?? "—"}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Individual Player Statistics
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Match Fixtures
                  </span>
                  <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
                    <Calendar className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
                  {isLoadingStats ? "..." : dbStats?.matchesCount ?? "—"}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Full Scoreboards & Thrillers
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Standings Last Synced
                  </span>
                  <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
                    <Activity className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-2 text-sm font-bold text-slate-900 dark:text-white truncate">
                  {dbStats?.lastStandingUpdated
                    ? new Date(dbStats.lastStandingUpdated).toLocaleDateString(
                        undefined,
                        {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )
                    : "Not yet synced"}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  From ESPN REST API
                </div>
              </div>
            </div>

            {/* ===================================================== */}
            {/* PRIMARY FUNCTION: ESPN DATA SYNCHRONIZATION CARD     */}
            {/* ===================================================== */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-md relative overflow-hidden">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-400 text-xs font-bold mb-2">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>ESPN Live Feed Synchronization</span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                    Update Standings, Top Scorers & Top Assists
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
                    Fetches real-time league tables, team statistics, and player leaderboards (goals and assists) directly from the ESPN REST API and updates the PostgreSQL database.
                  </p>
                </div>

                {/* Primary Action Button */}
                <div className="flex-shrink-0">
                  <button
                    onClick={() => handleUpdateEspnData()}
                    disabled={isSyncing}
                    className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-500 hover:via-purple-500 hover:to-indigo-600 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2.5 transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:transform-none cursor-pointer"
                  >
                    <RefreshCw
                      className={`w-4 h-4 ${isSyncing ? "animate-spin text-white" : ""}`}
                    />
                    <span>
                      {isSyncing
                        ? "Ingesting ESPN Data..."
                        : "Sync Standings & Leaders Now"}
                    </span>
                  </button>
                </div>
              </div>

              {/* Sync Configuration Controls */}
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Target Seasons Selector */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
                    Target Seasons
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {SEASONS.map((year) => {
                      const isSelected = selectedSeasons.includes(year);
                      return (
                        <button
                          key={year}
                          type="button"
                          onClick={() => toggleSeason(year)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            isSelected
                              ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/30"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                          }`}
                        >
                          {year} Season
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
                    Select one or more seasons to refresh. Default is 2026.
                  </p>
                </div>

                {/* Target Leagues Selector */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
                    Target Leagues (Top 5)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {LEAGUES.map((league) => {
                      const isSelected = selectedLeagues.includes(league.slug);
                      return (
                        <button
                          key={league.slug}
                          type="button"
                          onClick={() => toggleLeague(league.slug)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                            isSelected
                              ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/30"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                          }`}
                        >
                          <span>{league.shortName}</span>
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
                    Syncs EPL, La Liga, Serie A, Bundesliga, and Ligue 1.
                  </p>
                </div>
              </div>

              {/* In-Progress Notification */}
              {isSyncing && (
                <div className="mt-6 p-4 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900 flex items-center gap-3">
                  <RefreshCw className="w-5 h-5 text-indigo-600 dark:text-indigo-400 animate-spin flex-shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold text-indigo-900 dark:text-indigo-200">
                      ESPN Ingestion in Progress...
                    </h4>
                    <p className="text-xs text-indigo-700 dark:text-indigo-300/90 mt-0.5">
                      Requesting standings and top scorer/assist leaderboards from ESPN API and writing records to PostgreSQL. Please do not close this window.
                    </p>
                  </div>
                </div>
              )}

              {/* Sync Error Alert */}
              {syncError && (
                <div className="mt-6 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-rose-900 dark:text-rose-200">
                      Sync Failed
                    </h4>
                    <p className="text-xs text-rose-700 dark:text-rose-300 mt-0.5">
                      {syncError}
                    </p>
                  </div>
                </div>
              )}

              {/* Sync Success Detailed Results Card */}
              {syncResult && (
                <div className="mt-6 p-5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/80">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                    <h4 className="text-sm font-bold text-emerald-900 dark:text-emerald-200">
                      {syncResult.message}
                    </h4>
                  </div>

                  {syncResult.result && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                      <div className="bg-white dark:bg-slate-800/80 p-3 rounded-xl border border-emerald-100 dark:border-emerald-900/60">
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                          Leagues Processed
                        </span>
                        <div className="text-lg font-black text-slate-900 dark:text-white mt-0.5">
                          {syncResult.result.leaguesProcessed}
                        </div>
                      </div>

                      <div className="bg-white dark:bg-slate-800/80 p-3 rounded-xl border border-emerald-100 dark:border-emerald-900/60">
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                          Teams Upserted
                        </span>
                        <div className="text-lg font-black text-slate-900 dark:text-white mt-0.5">
                          {syncResult.result.teamsUpserted}
                        </div>
                      </div>

                      <div className="bg-white dark:bg-slate-800/80 p-3 rounded-xl border border-emerald-100 dark:border-emerald-900/60">
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                          Standings Saved
                        </span>
                        <div className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                          +{syncResult.result.standingsUpserted}
                        </div>
                      </div>

                      <div className="bg-white dark:bg-slate-800/80 p-3 rounded-xl border border-emerald-100 dark:border-emerald-900/60">
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                          Player Stats (Scorers/Assists)
                        </span>
                        <div className="text-lg font-black text-indigo-600 dark:text-indigo-400 mt-0.5">
                          +{syncResult.result.playerStatsUpserted}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-2 border-t border-emerald-200/60 dark:border-emerald-900/40">
                    <span>
                      Execution time: {syncResult.result?.durationSeconds}s
                    </span>
                    <Link
                      href="/"
                      target="_blank"
                      className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline inline-flex items-center gap-1"
                    >
                      <span>Check home dashboard</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>

                  {syncResult.result?.errors && syncResult.result.errors.length > 0 && (
                    <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-900 text-xs text-amber-800 dark:text-amber-300">
                      <p className="font-bold mb-1">Warnings / Errors:</p>
                      <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                        {syncResult.result.errors.map((err, i) => (
                          <li key={i}>{err}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ===================================================== */}
            {/* MATCH FIXTURES SYNCHRONIZATION CARD (BY SEASON & LEAGUE) */}
            {/* ===================================================== */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-md relative overflow-hidden">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 text-xs font-bold mb-2">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Match Fixtures Ingestion (1 Season & 1 League at a time)</span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                    Sync Match Fixtures & Thrillers
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
                    Ingests full season scoreboards, home/away scores, and pre-caches the top 10 highest-scoring fixtures with full rosters and goalscorers. To ensure reliability and avoid serverless timeouts, sync runs <strong>one season and one league at a time</strong>.
                  </p>
                </div>

                {/* Match Sync Action Button */}
                <div className="flex-shrink-0">
                  <button
                    onClick={() => handleSyncMatches()}
                    disabled={isSyncingMatches || isSyncing}
                    className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 hover:from-amber-500 hover:via-orange-500 hover:to-rose-500 text-white font-bold text-sm shadow-lg shadow-orange-600/30 flex items-center justify-center gap-2.5 transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:transform-none cursor-pointer"
                  >
                    <RefreshCw
                      className={`w-4 h-4 ${isSyncingMatches ? "animate-spin text-white" : ""}`}
                    />
                    <span>
                      {isSyncingMatches
                        ? `Syncing ${matchSeason} ${LEAGUES.find((l) => l.slug === matchLeague)?.shortName || matchLeague}...`
                        : `Sync ${matchSeason} ${LEAGUES.find((l) => l.slug === matchLeague)?.shortName || matchLeague} Matches`}
                    </span>
                  </button>
                </div>
              </div>

              {/* Match Sync Configuration Controls */}
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Target Season (Single Selection) */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
                    Target Season
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {SEASONS.map((year) => {
                      const isSelected = matchSeason === year;
                      return (
                        <button
                          key={year}
                          type="button"
                          onClick={() => setMatchSeason(year)}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            isSelected
                              ? "bg-amber-600 text-white shadow-sm shadow-amber-600/30 ring-2 ring-amber-400/50"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                          }`}
                        >
                          {year} Season
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
                    Choose which season's matches to ingest (e.g. 2023, 2024, 2025, 2026).
                  </p>
                </div>

                {/* Target League (Single Selection) */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
                    Target League (Top 5)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {LEAGUES.map((league) => {
                      const isSelected = matchLeague === league.slug;
                      return (
                        <button
                          key={league.slug}
                          type="button"
                          onClick={() => setMatchLeague(league.slug)}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                            isSelected
                              ? "bg-amber-600 text-white shadow-sm shadow-amber-600/30 ring-2 ring-amber-400/50"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                          }`}
                        >
                          <span>{league.shortName}</span>
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
                    Sync one league at a time to keep execution within serverless limits.
                  </p>
                </div>
              </div>

              {/* Match Sync In-Progress Alert */}
              {isSyncingMatches && (
                <div className="mt-6 p-4 rounded-xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 flex items-center gap-3">
                  <RefreshCw className="w-5 h-5 text-amber-600 dark:text-amber-400 animate-spin flex-shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200">
                      Syncing Match Data from ESPN...
                    </h4>
                    <p className="text-xs text-amber-700 dark:text-amber-300/90 mt-0.5">
                      Ingesting ~380 match scoreboards and pre-caching tactical summaries for top scoring matches. This takes roughly 5 to 10 seconds.
                    </p>
                  </div>
                </div>
              )}

              {/* Match Sync Error Alert */}
              {matchSyncError && (
                <div className="mt-6 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-rose-900 dark:text-rose-200">
                      Match Sync Failed
                    </h4>
                    <p className="text-xs text-rose-700 dark:text-rose-300 mt-0.5">
                      {matchSyncError}
                    </p>
                  </div>
                </div>
              )}

              {/* Match Sync Success Detailed Results Card */}
              {matchSyncResult && (
                <div className="mt-6 p-5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/80">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                    <h4 className="text-sm font-bold text-emerald-900 dark:text-emerald-200">
                      {matchSyncResult.message}
                    </h4>
                  </div>

                  {matchSyncResult.result && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                      <div className="bg-white dark:bg-slate-800/80 p-3 rounded-xl border border-emerald-100 dark:border-emerald-900/60">
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                          Target League & Season
                        </span>
                        <div className="text-base font-black text-slate-900 dark:text-white mt-0.5 truncate">
                          {matchSyncResult.result.leagueName} ({matchSyncResult.result.season})
                        </div>
                      </div>

                      <div className="bg-white dark:bg-slate-800/80 p-3 rounded-xl border border-emerald-100 dark:border-emerald-900/60">
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                          Matches Ingested
                        </span>
                        <div className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                          +{matchSyncResult.result.matchesIngested}
                        </div>
                      </div>

                      <div className="bg-white dark:bg-slate-800/80 p-3 rounded-xl border border-emerald-100 dark:border-emerald-900/60">
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                          Teams Verified / Upserted
                        </span>
                        <div className="text-lg font-black text-slate-900 dark:text-white mt-0.5">
                          {matchSyncResult.result.teamsUpserted}
                        </div>
                      </div>

                      <div className="bg-white dark:bg-slate-800/80 p-3 rounded-xl border border-emerald-100 dark:border-emerald-900/60">
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                          Top Summaries Pre-cached
                        </span>
                        <div className="text-lg font-black text-amber-600 dark:text-amber-400 mt-0.5">
                          {matchSyncResult.result.summariesFetched}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-2 border-t border-emerald-200/60 dark:border-emerald-900/40">
                    <span>
                      Execution time: {matchSyncResult.result?.durationSeconds}s
                    </span>
                    <Link
                      href="/fixtures"
                      target="_blank"
                      className="text-amber-600 dark:text-amber-400 font-semibold hover:underline inline-flex items-center gap-1"
                    >
                      <span>Explore Fixtures & Thrillers page</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Links & Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
                <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-sm mb-2">
                  <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>About This Dedicated Endpoint</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  This administrative panel is intentionally excluded from the public homepage, navigation bar, and footer. It serves exclusively as the administrative management endpoint accessible via manual URL navigation (<code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-mono text-[11px]">/admin/login</code> or <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-mono text-[11px]">/login-admin</code>).
                </p>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
                <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-sm mb-2">
                  <Database className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <span>User Table Management</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Admin authentication is backed by the <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-mono text-[11px]">users</code> table in PostgreSQL via Prisma ORM, utilizing cryptographically salted scrypt password hashing and HTTP-only session cookies.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
