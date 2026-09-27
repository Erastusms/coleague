import React, { useId } from "react";

interface InstagramIconProps {
  className?: string;
  size?: number;
  gradient?: boolean;
}

export const InstagramIcon: React.FC<InstagramIconProps> = ({
  className = "",
  size = 20,
  gradient = false,
}) => {
  const rawId = useId();
  const gradientId = `ig-gradient-${rawId.replace(/:/g, "")}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {gradient && (
        <defs>
          <linearGradient
            id={gradientId}
            x1="2"
            y1="22"
            x2="22"
            y2="2"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#f09433" />
            <stop offset="25%" stopColor="#e6683c" />
            <stop offset="50%" stopColor="#dc2743" />
            <stop offset="75%" stopColor="#cc2366" />
            <stop offset="100%" stopColor="#bc1888" />
          </linearGradient>
        </defs>
      )}

      {/* Outer rounded squircle */}
      <rect
        x="2"
        y="2"
        width="20"
        height="20"
        rx="5.5"
        stroke={gradient ? `url(#${gradientId})` : "currentColor"}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Inner lens circle */}
      <circle
        cx="12"
        cy="12"
        r="4.2"
        stroke={gradient ? `url(#${gradientId})` : "currentColor"}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Top right flash dot */}
      <circle
        cx="17.5"
        cy="6.5"
        r="1.2"
        fill={gradient ? `url(#${gradientId})` : "currentColor"}
      />
    </svg>
  );
};
