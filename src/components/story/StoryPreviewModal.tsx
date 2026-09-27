/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { InstagramIcon } from "./InstagramIcon";
import {
  Download,
  Copy,
  Check,
  X,
  AlertCircle,
  Smartphone,
  Laptop,
  Loader2,
} from "lucide-react";
import {
  canShareFiles,
  isMobileDevice,
  shareStoryGraphic,
  downloadBlob,
  copyImageToClipboard,
  ShareResult,
} from "@/lib/story-share";

interface StoryPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  blob: Blob | null;
  isGenerating: boolean;
  filename: string;
  title: string;
  onRegenerate?: () => void;
}

export const StoryPreviewModal: React.FC<StoryPreviewModalProps> = ({
  isOpen,
  onClose,
  blob,
  isGenerating,
  filename,
  title,
}) => {
  const [isSharing, setIsSharing] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Lazy compute device capabilities on mount safely
  const [hasWebShare] = useState(() =>
    typeof window !== "undefined" ? canShareFiles() : false
  );
  const [isMobile] = useState(() =>
    typeof window !== "undefined" ? isMobileDevice() : false
  );

  // Generate object URL for image preview safely with useMemo
  const previewUrl = useMemo(() => {
    if (!blob) return null;
    return URL.createObjectURL(blob);
  }, [blob]);

  // Clean up object URL when component unmounts or blob changes
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleShare = async () => {
    if (!blob) return;
    setIsSharing(true);
    setFeedback(null);

    try {
      const result: ShareResult = await shareStoryGraphic(blob, {
        title,
        filename,
        text: `${title} • CoLeague European Leaderboards`,
      });

      if (result.success) {
        if (result.method === "web-share") {
          setFeedback({
            type: "success",
            message: "Share sheet opened! Choose Instagram to post to Stories.",
          });
        } else {
          setFeedback({
            type: "success",
            message: "Story image downloaded! Transfer or upload to Instagram.",
          });
        }
      } else if (result.cancelled) {
        // User closed share sheet without picking an app
        setFeedback(null);
      }
    } catch (err: unknown) {
      const errorObj = err as Error;
      setFeedback({
        type: "error",
        message: errorObj?.message || "Failed to share story graphic.",
      });
    } finally {
      setIsSharing(false);
    }
  };

  const handleDownloadOnly = () => {
    if (!blob) return;
    downloadBlob(blob, filename);
    setFeedback({
      type: "success",
      message: "PNG downloaded directly to your device!",
    });
  };

  const handleCopyClipboard = async () => {
    if (!blob) return;
    const ok = await copyImageToClipboard(blob);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      setFeedback({
        type: "success",
        message: "Image copied to clipboard!",
      });
    } else {
      setFeedback({
        type: "error",
        message: "Your browser doesn't support copying images to clipboard.",
      });
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="story-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* ================= MODAL HEADER ================= */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 flex items-center justify-center shadow-md shadow-pink-500/20 text-white">
              <InstagramIcon size={18} />
            </div>
            <div>
              <h2
                id="story-modal-title"
                className="text-base sm:text-lg font-bold text-white tracking-tight"
              >
                Share to Instagram Stories
              </h2>
              <p className="text-xs text-slate-400">
                Optimized 9:16 high-resolution format (1080 × 1920)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ================= MODAL BODY ================= */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* Left: 9:16 Phone Mockup Preview */}
          <div className="md:col-span-6 flex flex-col items-center justify-center">
            <div
              className="relative w-full max-w-[280px] sm:max-w-[310px] rounded-[36px] p-2.5 shadow-2xl border-4 border-slate-700/80 bg-slate-950 overflow-hidden"
              style={{
                aspectRatio: "9/16",
                boxShadow: "0 25px 60px -15px rgba(0,0,0,0.8)",
              }}
            >
              {/* Phone Camera Notch/Island Mockup */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 w-20 h-4 bg-slate-900 rounded-full z-20 pointer-events-none" />

              {/* Graphic Display Area */}
              <div className="w-full h-full rounded-[28px] overflow-hidden bg-slate-900 flex items-center justify-center relative">
                {isGenerating ? (
                  <div className="flex flex-col items-center gap-3 p-6 text-center">
                    <Loader2 className="w-8 h-8 text-pink-500 animate-spin" />
                    <span className="text-xs font-semibold text-slate-300">
                      Generating 1080×1920 graphic...
                    </span>
                  </div>
                ) : previewUrl ? (
                  <img
                    src={previewUrl}
                    alt={title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-xs text-slate-500 text-center p-4">
                    Preparing story preview...
                  </div>
                )}
              </div>
            </div>
            <span className="mt-2 text-[11px] font-semibold text-slate-500 uppercase tracking-widest">
              9:16 Instagram Story Preview
            </span>
          </div>

          {/* Right: Sharing Actions & Device Status */}
          <div className="md:col-span-6 flex flex-col justify-between space-y-5">
            {/* Device Info Card */}
            <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/70">
              <div className="flex items-center gap-2.5 mb-2">
                {hasWebShare && isMobile ? (
                  <>
                    <Smartphone className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-emerald-300">
                      Mobile Browser Detected
                    </span>
                  </>
                ) : (
                  <>
                    <Laptop className="w-4 h-4 text-indigo-400" />
                    <span className="text-xs font-bold text-indigo-300">
                      Desktop / Standard Mode
                    </span>
                  </>
                )}
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {hasWebShare && isMobile
                  ? "Tapping 'Share to Instagram' opens your native device share sheet where you can send this directly to Instagram Stories or other apps."
                  : "On desktop browsers, clicking Share downloads the 1080×1920 PNG file directly. You can transfer it to your phone or upload via web."}
              </p>
            </div>

            {/* Status / Feedback Banner */}
            {feedback && (
              <div
                className={`p-3.5 rounded-xl border flex items-center gap-2.5 text-xs font-medium animate-in fade-in duration-150 ${
                  feedback.type === "success"
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                    : "bg-rose-500/10 border-rose-500/30 text-rose-300"
                }`}
              >
                {feedback.type === "success" ? (
                  <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                )}
                <span>{feedback.message}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              {/* Primary Action Button */}
              <button
                onClick={handleShare}
                disabled={isGenerating || isSharing || !blob}
                className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-amber-500 via-rose-500 to-purple-600 hover:opacity-95 active:scale-[0.99] text-white font-bold text-sm shadow-lg shadow-rose-500/25 flex items-center justify-center gap-2.5 transition-all disabled:opacity-50 disabled:pointer-events-none"
              >
                {isSharing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing Share...</span>
                  </>
                ) : hasWebShare && isMobile ? (
                  <>
                    <InstagramIcon size={18} />
                    <span>Share to Instagram Stories</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Download Story PNG (1080×1920)</span>
                  </>
                )}
              </button>

              {/* Secondary Options Grid */}
              <div className="grid grid-cols-2 gap-2.5">
                {/* Download Button */}
                <button
                  onClick={handleDownloadOnly}
                  disabled={isGenerating || !blob}
                  className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border border-slate-700 disabled:opacity-50"
                >
                  <Download className="w-3.5 h-3.5 text-slate-400" />
                  <span>Save Image</span>
                </button>

                {/* Copy to Clipboard Button */}
                <button
                  onClick={handleCopyClipboard}
                  disabled={isGenerating || !blob}
                  className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border border-slate-700 disabled:opacity-50"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-300">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-400" />
                      <span>Copy Image</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Quick tips list */}
            <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 space-y-1">
              <p className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-pink-500" />
                Rendered with top safe areas for story stickers and reactions
              </p>
              <p className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                High-DPI 1080×1920 export ensures razor-sharp mobile display
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
