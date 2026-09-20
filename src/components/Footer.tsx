import React from "react";
import { ShieldCheck } from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-slate-200 dark:border-slate-800/80 bg-slate-100/60 dark:bg-slate-950/60 py-6 mt-12 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <span>
            Coleague © {new Date().getFullYear()} • Aggregating Premier League, La Liga, Serie A, Bundesliga, & Ligue 1
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span>Data synced once daily from ESPN API</span>
          <span>•</span>
          <span className="text-slate-600 dark:text-slate-300">PostgreSQL + Prisma ORM</span>
        </div>
      </div>
    </footer>
  );
};
