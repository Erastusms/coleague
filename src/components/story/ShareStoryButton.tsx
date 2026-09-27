"use client";

import React, { useState, useRef } from "react";
import { StandingItem, PlayerLeaderItem } from "@/lib/types";
import {
  StoryLeaderboardType,
  renderStoryToBlob,
  shareStoryGraphic,
  getStoryFilename,
  ShareResult,
} from "@/lib/story-share";
import { InstagramStoryGraphic } from "./InstagramStoryGraphic";
import { StoryPreviewModal } from "./StoryPreviewModal";
import { InstagramIcon } from "./InstagramIcon";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

export interface ShareStoryButtonProps {
  type: StoryLeaderboardType;
  data: StandingItem[] | PlayerLeaderItem[];
  season?: number | string;
  title?: string;
  subtitle?: string;
  label?: string;
  variant?: "gradient" | "default" | "outline" | "ghost" | "icon";
  size?: "sm" | "md" | "lg";
  showPreview?: boolean;
  className?: string;
  onSuccess?: (result: ShareResult) => void;
  onError?: (error: Error) => void;
}

export const ShareStoryButton: React.FC<ShareStoryButtonProps> = ({
  type,
  data,
  season = 2026,
  title,
  subtitle,
  label = "Story",
  variant = "gradient",
  size = "sm",
  showPreview = true,
  className = "",
  onSuccess,
  onError,
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [generatedBlob, setGeneratedBlob] = useState<Blob | null>(null);
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const graphicRef = useRef<HTMLDivElement>(null);

  const displayTitle =
    title ||
    (type === "standings"
      ? "Top 10 Standings"
      : type === "scorers"
      ? "Top 10 Goalscorers"
      : "Top 10 Playmakers");

  const filename = getStoryFilename(type, season);

  const handleGenerateAndAction = async () => {
    if (!graphicRef.current) return;
    setIsGenerating(true);
    setStatusMessage(null);

    try {
      // 1. Convert DOM layout to PNG blob client-side
      const blob = await renderStoryToBlob(graphicRef.current);
      setGeneratedBlob(blob);

      if (showPreview) {
        // 2. Open preview modal so user can view phone mockup & trigger native share / download
        setIsModalOpen(true);
      } else {
        // Direct trigger mode
        const result = await shareStoryGraphic(blob, {
          title: displayTitle,
          filename,
          text: `${displayTitle} • CoLeague European Leaderboards`,
        });

        if (result.success) {
          setStatusMessage({
            type: "success",
            text:
              result.method === "web-share"
                ? "Share sheet opened!"
                : "Story PNG downloaded!",
          });
          onSuccess?.(result);
        }
      }
    } catch (err: unknown) {
      const errorObj = err as Error;
      console.error("Story generation failed:", errorObj);
      setStatusMessage({
        type: "error",
        text: errorObj?.message || "Failed to generate story graphic.",
      });
      onError?.(errorObj);
    } finally {
      setIsGenerating(false);
    }
  };

  // Variant styling
  const sizeClasses = {
    sm: "px-2.5 py-1.5 text-xs gap-1.5 rounded-lg",
    md: "px-3.5 py-2 text-xs sm:text-sm gap-2 rounded-xl",
    lg: "px-5 py-2.5 text-sm sm:text-base gap-2.5 rounded-2xl",
  }[size];

  const variantClasses = {
    gradient:
      "bg-gradient-to-r from-amber-500 via-rose-500 to-purple-600 hover:opacity-95 text-white shadow-sm hover:shadow-md hover:shadow-rose-500/20 active:scale-[0.98]",
    default:
      "bg-slate-900 dark:bg-white text-white dark:text-slate-950 hover:bg-slate-800 dark:hover:bg-slate-100 shadow-sm active:scale-[0.98]",
    outline:
      "bg-transparent border border-slate-300 dark:border-slate-700 hover:border-pink-500/60 text-slate-700 dark:text-slate-200 hover:text-pink-600 dark:hover:text-pink-400 active:scale-[0.98]",
    ghost:
      "bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white",
    icon: "p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-pink-500 hover:bg-pink-50 dark:hover:bg-pink-950/30",
  }[variant];

  return (
    <>
      {/* Trigger Button */}
      <div className="relative inline-flex items-center">
        <button
          type="button"
          onClick={handleGenerateAndAction}
          disabled={isGenerating || !data || data.length === 0}
          title={`Share ${displayTitle} to Instagram Stories`}
          aria-label={`Share ${displayTitle} to Instagram Stories`}
          className={`inline-flex items-center justify-center font-bold tracking-tight transition-all duration-150 disabled:opacity-40 disabled:pointer-events-none cursor-pointer ${sizeClasses} ${variantClasses} ${className}`}
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              {variant !== "icon" && <span>Generating...</span>}
            </>
          ) : (
            <>
              <InstagramIcon
                size={size === "lg" ? 18 : size === "md" ? 16 : 14}
                gradient={variant !== "gradient"}
              />
              {variant !== "icon" && <span>{label}</span>}
            </>
          )}
        </button>

        {/* Temporary toast status tooltip if direct mode */}
        {statusMessage && (
          <div
            className={`absolute top-full mt-1.5 right-0 z-30 px-2.5 py-1 rounded-md text-[11px] font-semibold whitespace-nowrap shadow-lg flex items-center gap-1.5 ${
              statusMessage.type === "success"
                ? "bg-emerald-600 text-white"
                : "bg-rose-600 text-white"
            }`}
          >
            {statusMessage.type === "success" ? (
              <CheckCircle2 className="w-3 h-3" />
            ) : (
              <AlertCircle className="w-3 h-3" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}
      </div>

      {/* Hidden 1080x1920 DOM node for high-resolution PNG capture */}
      <div
        style={{
          position: "fixed",
          left: "-9999px",
          top: "0",
          width: "1080px",
          height: "1920px",
          zIndex: -100,
          pointerEvents: "none",
        }}
        aria-hidden="true"
      >
        <div ref={graphicRef}>
          <InstagramStoryGraphic
            type={type}
            data={data}
            season={season}
            title={title}
            subtitle={subtitle}
          />
        </div>
      </div>

      {/* Preview & Sharing Modal */}
      {showPreview && (
        <StoryPreviewModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          blob={generatedBlob}
          isGenerating={isGenerating}
          filename={filename}
          title={displayTitle}
          onRegenerate={handleGenerateAndAction}
        />
      )}
    </>
  );
};
