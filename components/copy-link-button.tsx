"use client";

import { useToast } from "@/components/toast";

export default function CopyLinkButton({
  url,
  className,
}: {
  url: string;
  className?: string;
}) {
  const { showToast } = useToast();

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      showToast("Link kopiert");
    } catch {
      showToast("Kopieren fehlgeschlagen", "error");
    }
  }

  return (
    <button type="button" onClick={handleCopy} className={className}>
      <span className="material-symbols-outlined text-lg" aria-hidden="true">content_copy</span>
      Link kopieren
    </button>
  );
}
