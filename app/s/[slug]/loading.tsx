export default function SpiritLinkLoading() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
      <span
        className="material-symbols-outlined text-primary/70 text-4xl animate-pulse"
        style={{ fontVariationSettings: "'FILL' 1" }}
        aria-hidden="true"
      >
        auto_awesome
      </span>
      <p className="font-label text-[10px] uppercase tracking-[0.2em] text-on-surface-variant/70">
        Wird geladen
      </p>
    </div>
  );
}
