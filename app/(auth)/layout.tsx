export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-surface font-body selection:bg-primary/30">
      {/* Background radial gradient */}
      <div
        className="fixed inset-0 pointer-events-none -z-10"
        style={{
          background:
            "radial-gradient(circle at center, #1a1c29 0%, #0b0d17 70%)",
        }}
      />

      {/* Subtle ambient glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-[10%] left-[15%] w-96 h-96 bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[20%] right-[10%] w-[500px] h-[500px] bg-tertiary-container/5 rounded-full blur-[150px]" />
      </div>

      {/* Logo header */}
      <header className="fixed top-0 w-full flex items-center justify-center px-6 h-16 z-50">
        <div className="flex items-center gap-2">
          <span
            className="material-symbols-outlined text-2xl text-primary"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            auto_awesome
          </span>
          <span className="text-2xl font-headline tracking-widest text-primary">
            Aethernal
          </span>
        </div>
      </header>

      {/* Content */}
      <div className="w-full max-w-md px-6 pt-20 pb-12">{children}</div>

      {/* Footer */}
      <footer className="pb-8 text-center w-full max-w-xs">
        <div className="flex flex-col items-center gap-4">
          <div className="h-px w-12 bg-outline-variant/30" />
          <p className="text-[10px] font-label text-on-surface-variant/40 tracking-[0.2em] uppercase">
            Ewige Erinnerung &bull; Aethernal
          </p>
        </div>
      </footer>
    </div>
  );
}
