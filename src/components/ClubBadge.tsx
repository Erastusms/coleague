"use client";

import React, { useState } from "react";

interface ClubBadgeProps {
  shortDisplayName: string;
  name?: string;
  logoUrl: string;
  size?: number;
  className?: string;
}

export const ClubBadge: React.FC<ClubBadgeProps> = ({
  shortDisplayName,
  name,
  logoUrl,
  size = 28,
  className = "",
}) => {
  const [error, setError] = useState(false);

  return (
    <div className={`flex items-center gap-1.5 md:gap-2.5 min-w-0 ${className}`}>
      {/* Clean, borderless container with no backgrounds, rings, or outlines */}
      <div
        className="relative flex-shrink-0 flex items-center justify-center bg-transparent w-5 h-5 md:w-7 md:h-7"
      >
        {!error && logoUrl ? (
          <img
            src={logoUrl}
            alt={shortDisplayName}
            onError={() => setError(true)}
            className="w-full h-full object-contain"
            style={{ background: "transparent" }}
            loading="lazy"
          />
        ) : (
          <span className="text-[9px] md:text-[10px] font-bold text-slate-500 dark:text-slate-400">
            {shortDisplayName.slice(0, 2).toUpperCase()}
          </span>
        )}
      </div>
      <span
        className="font-semibold text-slate-900 dark:text-slate-100 truncate tracking-tight text-xs md:text-sm hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors"
        title={name || shortDisplayName}
      >
        {shortDisplayName}
      </span>
    </div>
  );
};
