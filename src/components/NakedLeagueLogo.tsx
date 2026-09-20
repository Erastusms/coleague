"use client";

import React, { useState } from "react";
import Image from "next/image";

interface NakedLeagueLogoProps {
  name: string;
  logoUrl: string;
  slug?: string;
  size?: number;
}

export const NakedLeagueLogo: React.FC<NakedLeagueLogoProps> = ({
  name,
  logoUrl,
  size = 28,
}) => {
  const [error, setError] = useState(false);

  if (error || !logoUrl) {
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
      <img
        src={logoUrl}
        alt={name}
        title={name}
        width={size}
        height={size}
        onError={() => setError(true)}
        className="object-contain transition-transform duration-150 group-hover:scale-115 drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]"
        style={{ width: `${size}px`, height: `${size}px`, background: "transparent" }}
        loading="lazy"
      />
    </div>
  );
};
