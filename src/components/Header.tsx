"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Trophy, Calendar, Home, RefreshCw, BarChart3 } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";

interface HeaderProps {
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onRefresh, isRefreshing }) => {
  const pathname = usePathname();
  const [isTopBarVisible, setIsTopBarVisible] = useState(true);
  const lastScrollY = useRef(0);

  // Auto-hide mobile top navigation bar when scrolling down, show when scrolling up
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = Math.max(0, window.scrollY);
      const diff = currentScrollY - lastScrollY.current;

      // Always show when near the very top of the page
      if (currentScrollY <= 15) {
        setIsTopBarVisible(true);
      } else if (diff > 6 && currentScrollY > 40) {
        // User is scrolling down past threshold -> hide bar
        setIsTopBarVisible(false);
      } else if (diff < -6) {
        // User is scrolling up -> show bar
        setIsTopBarVisible(true);
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navItems = [
    { label: "Home", href: "/", icon: Home },
    { label: "Standings", href: "/standings", icon: Trophy },
    { label: "Stats", href: "/stats", icon: BarChart3 },
    { label: "Fixtures", href: "/fixtures", icon: Calendar },
  ];

  return (
    <>
      {/* ========================================================================= */}
      {/* 1. DESKTOP HEADER (Hidden on mobile) */}
      {/* ========================================================================= */}
      <header className="hidden md:block sticky top-0 z-40 w-full backdrop-blur-xl bg-white/85 dark:bg-slate-950/85 border-b border-slate-200 dark:border-slate-800/80 shadow-sm dark:shadow-2xl transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-18">
            {/* Brand Logo & Subtitle */}
            <Link href="/" className="flex items-center gap-3.5 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-0.5 shadow-lg shadow-indigo-500/20 flex items-center justify-center transition-transform group-hover:scale-105">
                <div className="w-full h-full bg-white dark:bg-slate-950 rounded-[10px] flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-black tracking-tight bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-800 dark:from-white dark:via-slate-100 dark:to-slate-300 bg-clip-text text-transparent font-sans">
                    COLEAGUE
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium tracking-wide">
                  Combined European Football League
                </p>
              </div>
            </Link>

            {/* Desktop Navigation (4 items with labels) */}
            <nav className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900/90 p-1 rounded-xl border border-slate-200 dark:border-slate-800 transition-colors">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                      isActive
                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/25"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800/50"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Right Action Icons: Refresh & Dark Mode Toggle */}
            <div className="flex items-center gap-2.5">
              {onRefresh && (
                <button
                  onClick={onRefresh}
                  disabled={isRefreshing}
                  title="Refresh latest data"
                  className="p-2 rounded-xl bg-slate-200/80 hover:bg-slate-300/80 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
                >
                  <RefreshCw
                    className={`w-4 h-4 ${isRefreshing ? "animate-spin text-indigo-500" : ""}`}
                  />
                </button>
              )}

              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. MOBILE TOP NAVIGATION BAR (Centered "COLEAGUE", disappears on scroll down) */}
      {/* ========================================================================= */}
      <div
        className={`md:hidden fixed top-0 inset-x-0 z-40 backdrop-blur-xl bg-white/85 dark:bg-slate-950/85 border-b border-slate-200/80 dark:border-slate-800/80 shadow-xs transition-transform duration-300 ease-in-out ${
          isTopBarVisible ? "translate-y-0" : "-translate-y-full"
        }`}
      >
        <div className="relative flex items-center justify-between h-14 px-4">
          {/* Left Action: Refresh (if available) or spacer for balance */}
          <div className="w-10 flex items-center justify-start">
            {onRefresh ? (
              <button
                onClick={onRefresh}
                disabled={isRefreshing}
                title="Refresh latest data"
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
              >
                <RefreshCw
                  className={`w-4 h-4 ${isRefreshing ? "animate-spin text-indigo-500" : ""}`}
                />
              </button>
            ) : null}
          </div>

          {/* Centered App Name "COLEAGUE" */}
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center">
            <Link href="/" className="flex items-center gap-1.5 py-1">
              <span className="text-lg font-black tracking-widest bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-800 dark:from-white dark:via-slate-100 dark:to-slate-300 bg-clip-text text-transparent font-sans select-none">
                COLEAGUE
              </span>
            </Link>
          </div>

          {/* Right Action: Theme Toggle */}
          <div className="w-10 flex items-center justify-end">
            <ThemeToggle />
          </div>
        </div>
      </div>

      {/* Spacer for fixed top bar on mobile so initial content isn't covered */}
      <div className="md:hidden h-14 w-full shrink-0" aria-hidden="true" />

      {/* ========================================================================= */}
      {/* 3. MOBILE BOTTOM NAVIGATION ("Liquid Glass" Floating Dock, Fixed on Scroll) */}
      {/* ========================================================================= */}
      <div
        className="fixed inset-x-0 bottom-5 z-50 flex justify-center pointer-events-none md:hidden px-4"
        style={{
          bottom: "calc(1.25rem + env(safe-area-inset-bottom, 0px) * 0.4)",
        }}
      >
        <nav
          className="liquid-glass pointer-events-auto flex items-center gap-1.5 p-1.5 rounded-full"
          aria-label="Mobile Navigation Menu"
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                aria-label={item.label}
                className={`relative flex items-center justify-center w-12 h-12 rounded-full transition-all duration-200 cursor-pointer ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/35 scale-105"
                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 active:scale-95"
                }`}
              >
                <Icon className="w-5 h-5 stroke-[2.2]" />
                {isActive && (
                  <span className="absolute bottom-1.5 w-1 h-1 rounded-full bg-white/90" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
};
