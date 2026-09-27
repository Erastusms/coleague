/**
 * story-share.ts
 * Core utilities for rendering and sharing 9:16 Instagram Story leaderboards
 */

export type StoryLeaderboardType = "standings" | "scorers" | "assists";

export interface ShareResult {
  success: boolean;
  method: "web-share" | "download";
  filename: string;
  cancelled?: boolean;
  error?: string;
}

export interface ShareStoryMetadata {
  title: string;
  filename: string;
  text?: string;
}

/**
 * Checks if the browser supports sharing files via the Web Share API (Level 2).
 */
export function canShareFiles(): boolean {
  if (
    typeof navigator === "undefined" ||
    typeof navigator.share !== "function" ||
    typeof navigator.canShare !== "function"
  ) {
    return false;
  }

  try {
    const testFile = new File(["test"], "test.png", { type: "image/png" });
    return navigator.canShare({ files: [testFile] });
  } catch {
    return false;
  }
}

/**
 * Checks if the current client is a mobile device or tablet.
 */
export function isMobileDevice(): boolean {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return false;
  }
  const ua = navigator.userAgent || "";
  const mobileRegex =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile|CriOS/i;
  const touchPoints = navigator.maxTouchPoints || 0;
  return mobileRegex.test(ua) || (touchPoints > 1 && window.innerWidth < 1024);
}

/**
 * Preload all <img> tags inside a DOM node before capturing to avoid blank image tiles.
 */
export async function preloadImages(
  container: HTMLElement,
  timeoutMs = 2500
): Promise<void> {
  const images = Array.from(container.querySelectorAll("img"));
  if (images.length === 0) return;

  const promises = images.map((img) => {
    if (img.complete && img.naturalWidth > 0) {
      return Promise.resolve();
    }
    return new Promise<void>((resolve) => {
      const handleDone = () => {
        img.removeEventListener("load", handleDone);
        img.removeEventListener("error", handleDone);
        resolve();
      };
      img.addEventListener("load", handleDone);
      img.addEventListener("error", handleDone);
      // In case image never fires
      setTimeout(handleDone, timeoutMs);
    });
  });

  await Promise.race([
    Promise.all(promises),
    new Promise((resolve) => setTimeout(resolve, timeoutMs)),
  ]);
}

/**
 * Converts a DOM element into a PNG Blob client-side using html-to-image.
 */
export async function renderStoryToBlob(element: HTMLElement): Promise<Blob> {
  const { toBlob, toPng } = await import("html-to-image");

  // Ensure images are fully loaded
  await preloadImages(element);

  const options = {
    cacheBust: false,
    pixelRatio: 1, // 1080x1920 layout is already native high-resolution 1080p
    skipFonts: true, // Prevents external font CORS freezes and speed up rendering
    backgroundColor: "#080c14",
  };

  try {
    const blob = await toBlob(element, options);
    if (blob) return blob;
  } catch (err) {
    console.warn("toBlob attempt failed, trying toPng fallback:", err);
  }

  // Fallback if toBlob returned null
  const dataUrl = await toPng(element, options);
  const response = await fetch(dataUrl);
  return await response.blob();
}

/**
 * Converts a DOM element into a File object ready for Web Share API.
 */
export async function renderStoryToFile(
  element: HTMLElement,
  filename: string
): Promise<File> {
  const blob = await renderStoryToBlob(element);
  return new File([blob], filename, { type: "image/png" });
}

/**
 * Triggers direct client-side download of a PNG blob.
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.style.display = "none";
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 300);
}

/**
 * Copies an image blob to clipboard if supported by the browser.
 */
export async function copyImageToClipboard(blob: Blob): Promise<boolean> {
  if (
    typeof navigator === "undefined" ||
    !navigator.clipboard ||
    typeof ClipboardItem === "undefined"
  ) {
    return false;
  }

  try {
    const item = new ClipboardItem({ "image/png": blob });
    await navigator.clipboard.write([item]);
    return true;
  } catch (err) {
    console.warn("Failed to copy image to clipboard:", err);
    return false;
  }
}

/**
 * Shares or downloads a story graphic:
 * - If on mobile with Web Share API file support -> triggers native share sheet (Instagram Story option appears).
 * - If user cancels the share sheet -> returns cancelled state without error.
 * - If on desktop or unsupported -> triggers direct PNG download.
 */
export async function shareStoryGraphic(
  blob: Blob,
  metadata: ShareStoryMetadata
): Promise<ShareResult> {
  const { title, filename, text } = metadata;

  // Check Web Share API Level 2 (files)
  if (canShareFiles()) {
    try {
      const file = new File([blob], filename, { type: "image/png" });
      await navigator.share({
        files: [file],
        title,
        text: text || `${title} • CoLeague Stats`,
      });
      return { success: true, method: "web-share", filename };
    } catch (err: unknown) {
      const errorObj = err as Error;
      // AbortError indicates user dismissed the share modal intentionally
      if (errorObj?.name === "AbortError") {
        return { success: false, method: "web-share", filename, cancelled: true };
      }

      console.warn("Web Share API failed, falling back to direct download:", err);
      // Fallback to download if sharing threw an error
      downloadBlob(blob, filename);
      return {
        success: true,
        method: "download",
        filename,
        error: errorObj?.message,
      };
    }
  }

  // Fallback for Desktop or unsupported devices: direct download
  downloadBlob(blob, filename);
  return { success: true, method: "download", filename };
}

/**
 * One-shot helper to render a story element and trigger sharing / download.
 */
export async function shareToInstagramStory(
  element: HTMLElement,
  metadata: ShareStoryMetadata
): Promise<ShareResult> {
  const blob = await renderStoryToBlob(element);
  return await shareStoryGraphic(blob, metadata);
}

/**
 * Generates an informative default filename for the story PNG.
 */
export function getStoryFilename(
  type: StoryLeaderboardType,
  season?: string | number
): string {
  const seasonStr = season ? `-${season}` : "";
  const dateStr = new Date().toISOString().slice(0, 10);
  switch (type) {
    case "standings":
      return `coleague-top10-standings${seasonStr}-${dateStr}.png`;
    case "scorers":
      return `coleague-top10-scorers${seasonStr}-${dateStr}.png`;
    case "assists":
      return `coleague-top10-assists${seasonStr}-${dateStr}.png`;
  }
}
