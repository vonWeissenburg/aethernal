import Link from "next/link";

export const metadata = { title: "Nicht gefunden" };

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-bg-primary px-6 relative">
      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at center, rgba(242, 202, 80, 0.05) 0%, transparent 70%)",
          }}
        />
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-gold-light/5 rounded-full blur-[100px]" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-gold-light/5 rounded-full blur-[100px]" />
      </div>

      {/* Material Symbols */}
      <link
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
        rel="stylesheet"
      />

      <div className="max-w-2xl w-full text-center">
        {/* Illustration */}
        <div className="relative mb-12 opacity-20">
          <span
            className="material-symbols-outlined text-gold-light"
            style={{ fontSize: "160px", fontVariationSettings: "'wght' 100" }}
          >
            eco
          </span>
        </div>

        {/* Text */}
        <h1 className="font-serif text-5xl md:text-6xl text-text-primary tracking-tight leading-tight mb-6">
          Seite nicht gefunden
        </h1>
        <p className="text-lg md:text-xl text-text-secondary max-w-md mx-auto leading-relaxed font-light mb-12">
          Die gesuchte Seite existiert nicht oder wurde verschoben.
        </p>

        {/* Actions */}
        <div className="flex flex-col items-center space-y-6">
          <Link
            href="/dashboard"
            className="group relative px-10 py-4 rounded-lg bg-gold text-bg-primary font-semibold transition-all duration-300 hover:brightness-110 active:scale-95 shadow-lg overflow-hidden"
          >
            <span className="relative z-10">Zum Dashboard</span>
            <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>

          <Link
            href="https://aethernal.me"
            className="text-sm tracking-widest uppercase text-text-secondary hover:text-gold-light transition-colors flex items-center gap-2 group"
          >
            <span
              className="material-symbols-outlined text-sm group-hover:-translate-x-1 transition-transform"
            >
              arrow_back
            </span>
            Zurück zur Startseite
          </Link>
        </div>
      </div>

      {/* Branding footer */}
      <footer className="fixed bottom-12 w-full text-center pointer-events-none">
        <div className="flex flex-col items-center gap-2 opacity-40">
          <div className="h-px w-8 bg-outline-variant mb-2" />
          <span className="font-serif text-xl font-bold tracking-[0.2em] text-gold-light">
            Aethernal
          </span>
          <span className="text-[10px] tracking-[0.4em] uppercase text-text-secondary">
            Digital Sanctuary
          </span>
        </div>
      </footer>
    </div>
  );
}
