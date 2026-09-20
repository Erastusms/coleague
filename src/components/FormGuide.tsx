"use client";

import React from "react";
import { FormResult } from "@/lib/types";

interface FormGuideProps {
  form: FormResult[];
}

export const FormGuide: React.FC<FormGuideProps> = ({ form }) => {
  const results = form.length > 0 ? form.slice(-5) : [];

  if (results.length === 0) {
    return <span className="text-xs text-slate-400 dark:text-slate-500 italic">No matches</span>;
  }

  return (
    <div className="flex items-center gap-1.5 justify-end" title="Last 5 matches (Most recent on far right)">
      {results.map((res, index) => {
        const isMostRecent = index === results.length - 1;

        // Solid, vibrant, saturated colors resembling Google Sports match stats
        let bgClass = "";
        let glowClass = "";

        if (res === "W") {
          bgClass = "bg-emerald-600 text-white";
          glowClass = isMostRecent
            ? "ring-2 ring-emerald-500 ring-offset-2 ring-offset-white dark:ring-offset-slate-900 shadow-md shadow-emerald-600/30"
            : "";
        } else if (res === "D") {
          bgClass = "bg-slate-500 text-white";
          glowClass = isMostRecent
            ? "ring-2 ring-slate-400 ring-offset-2 ring-offset-white dark:ring-offset-slate-900 shadow-md shadow-slate-500/30"
            : "";
        } else {
          bgClass = "bg-rose-600 text-white";
          glowClass = isMostRecent
            ? "ring-2 ring-rose-500 ring-offset-2 ring-offset-white dark:ring-offset-slate-900 shadow-md shadow-rose-600/30"
            : "";
        }

        return (
          <span
            key={index}
            className={`inline-flex items-center justify-center font-bold text-[11px] rounded-md transition-all duration-150 ${
              isMostRecent
                ? `w-6 h-6 scale-110 font-extrabold z-10 ${glowClass}`
                : "w-5 h-5 opacity-90"
            } ${bgClass}`}
            title={
              isMostRecent
                ? `Most Recent: ${res === "W" ? "Win" : res === "D" ? "Draw" : "Loss"}`
                : `${res === "W" ? "Win" : res === "D" ? "Draw" : "Loss"}`
            }
          >
            {res}
          </span>
        );
      })}
    </div>
  );
};
