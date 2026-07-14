"use client";

import { useToast } from "@/components/toast";

// Web-Share-API mit Copy-Fallback (B5)
export default function ShareLinkButton({
  url,
  title,
  className,
}: {
  url: string;
  title: string;
  className?: string;
}) {
  const { showToast } = useToast();

  async function handleShare() {
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({ title, url });
      } catch {
        // Nutzer hat den Share-Dialog abgebrochen — kein Fehler
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      showToast("Link kopiert");
    } catch {
      showToast("Teilen nicht möglich", "error");
    }
  }

  return (
    <button type="button" onClick={handleShare} className={className}>
      <span className="material-symbols-outlined text-lg" aria-hidden="true">share</span>
      Teilen
    </button>
  );
}
