export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-bg-primary relative">
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
        <div className="absolute top-[10%] left-[15%] w-96 h-96 bg-gold-light/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[20%] right-[10%] w-[500px] h-[500px] bg-blue-400/5 rounded-full blur-[150px]" />
      </div>

      {/* Material Symbols font */}
      <link
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
        rel="stylesheet"
      />

      {/* Logo header */}
      <header className="fixed top-0 w-full flex items-center justify-center px-6 h-16 z-50">
        <div className="flex items-center gap-2">
          <span
            className="material-symbols-outlined text-2xl text-gold-light"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            auto_awesome
          </span>
          <span className="text-2xl font-serif tracking-widest text-gold-light">
            Aethernal
          </span>
        </div>
      </header>

      {/* Content */}
      <div className="w-full max-w-md px-6 pt-20 pb-12">{children}</div>

      {/* Footer */}
      <footer className="pb-8 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-px w-12 bg-outline-variant/30" />
          <p className="text-[10px] text-text-muted/40 tracking-[0.2em] uppercase">
            Ewige Erinnerung &bull; Aethernal
          </p>
        </div>
      </footer>
    </div>
  );
}
