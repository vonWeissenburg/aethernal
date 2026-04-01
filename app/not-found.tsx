import Link from "next/link";

export const metadata = { title: "Nicht gefunden" };

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6 relative">
      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at center, rgba(242, 202, 80, 0.04) 0%, transparent 70%)",
          }}
        />
      </div>

      <div className="max-w-2xl w-full text-center">
        {/* Dove icon (muted) */}
        <div className="relative mb-12 opacity-15">
          <span
            className="material-symbols-outlined text-on-surface-variant"
            style={{ fontSize: "140px", fontVariationSettings: "'wght' 100" }}
          >
            dove
          </span>
        </div>

        {/* Heading */}
        <h1 className="font-headline text-5xl md:text-6xl text-on-surface tracking-tight leading-tight mb-6">
          Seite nicht gefunden
        </h1>
        <p className="font-body text-lg md:text-xl text-on-surface-variant max-w-md mx-auto leading-relaxed font-light mb-12">
          Die gesuchte Seite existiert nicht oder wurde verschoben.
        </p>

        {/* Actions */}
        <div className="flex flex-col items-center space-y-6">
          {/* Gold CTA button */}
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-10 py-4 rounded-xl bg-primary text-on-primary font-label font-semibold transition-all duration-300 hover:brightness-110 active:scale-95 shadow-lg"
          >
            <span className="material-symbols-outlined text-xl">home</span>
            Zum Dashboard
          </Link>

          {/* Text link */}
          <Link
            href="https://aethernal.me"
            className="inline-flex items-center gap-2 font-label text-sm tracking-widest uppercase text-on-surface-variant hover:text-primary transition-colors group"
          >
            <span className="material-symbols-outlined text-sm group-hover:-translate-x-1 transition-transform">
              arrow_back
            </span>
            Zur&uuml;ck zur Startseite
          </Link>
        </div>
      </div>

      {/* Branding footer */}
      <footer className="fixed bottom-12 w-full text-center pointer-events-none">
        <div className="flex flex-col items-center gap-2 opacity-30">
          <div className="h-px w-8 bg-outline-variant mb-2" />
          <span className="font-headline text-xl font-bold tracking-[0.2em] text-primary">
            Aethernal
          </span>
          <span className="font-label text-[10px] tracking-[0.4em] uppercase text-on-surface-variant">
            Digital Sanctuary
          </span>
        </div>
      </footer>
    </div>
  );
}
