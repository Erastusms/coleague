"use client";

import React, { useState } from "react";
import { getLeagueDarkLogo } from "@/lib/constants";

interface NakedLeagueLogoProps {
  name: string;
  logoUrl: string;
  darkLogoUrl?: string;
  slug?: string;
  size?: number;
}

export const NakedLeagueLogo: React.FC<NakedLeagueLogoProps> = ({
  name,
  logoUrl,
  darkLogoUrl,
  slug,
  size = 28,
}) => {
  const [errorLight, setErrorLight] = useState(false);
  const [errorDark, setErrorDark] = useState(false);

  const resolvedDarkLogoUrl =
    darkLogoUrl || getLeagueDarkLogo(slug || name || logoUrl);

  if ((errorLight && errorDark) || (!logoUrl && !resolvedDarkLogoUrl)) {
    return (
      <div
        className="inline-flex items-center justify-center font-bold text-xs text-slate-400 bg-transparent cursor-pointer"
        title={name}
        aria-label={name}
      >
        {name.slice(0, 3).toUpperCase()}
      </div>
    );
  }

  return (
    <div
      className="inline-flex items-center justify-center bg-transparent cursor-pointer group relative"
      title={name}
      aria-label={name}
    >
      {/* Light Mode Logo */}
      <img
        src={errorLight ? resolvedDarkLogoUrl : logoUrl}
        alt={name}
        title={name}
        width={size}
        height={size}
        onError={() => setErrorLight(true)}
        className="object-contain transition-transform duration-150 group-hover:scale-115 drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)] dark:hidden"
        style={{ width: `${size}px`, height: `${size}px`, background: "transparent" }}
        loading="lazy"
      />
      {/* Dark Mode Logo */}
      <img
        src={errorDark ? logoUrl : (resolvedDarkLogoUrl || logoUrl)}
        alt={name}
        title={name}
        width={size}
        height={size}
        onError={() => setErrorDark(true)}
        className="object-contain transition-transform duration-150 group-hover:scale-115 drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)] hidden dark:block"
        style={{ width: `${size}px`, height: `${size}px`, background: "transparent" }}
        loading="lazy"
      />
    </div>
  );
};

