// Gemeinsamer Rahmen für die öffentlichen /vertrauen-Seiten (B2/B3):
// ruhige Komposition, Wortmarke, kein Login-Chrome.

export function VertrauenShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6 py-12">
      <div
        className="fixed inset-0 pointer-events-none -z-10"
        style={{
          background:
            "radial-gradient(circle at center, var(--color-surface-container-low) 0%, var(--color-background) 70%)",
        }}
      />

      <div className="flex items-center gap-2 mb-10">
        <span
          className="material-symbols-outlined text-2xl text-primary"
          style={{ fontVariationSettings: "'FILL' 1" }}
          aria-hidden="true"
        >
          auto_awesome
        </span>
        <span className="font-headline italic text-2xl font-bold tracking-tight shimmer-text">
          Aethernal
        </span>
      </div>

      <div className="w-full max-w-md">{children}</div>

      <p className="mt-10 font-label text-[10px] text-on-surface-variant/60 tracking-[0.2em] uppercase">
        Ewige Erinnerung
      </p>
    </div>
  );
}

export function StatusCard({
  icon,
  iconClass,
  title,
  text,
  children,
}: {
  icon: string;
  iconClass: string;
  title: string;
  text: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="glass-panel rounded-card border border-outline-variant/30 shadow-2xl p-8 text-center">
      <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-surface-container-high flex items-center justify-center">
        <span className={`material-symbols-outlined text-3xl ${iconClass}`} aria-hidden="true">
          {icon}
        </span>
      </div>
      <h1 className="font-headline text-2xl text-on-surface mb-3">{title}</h1>
      <p className="font-body text-sm text-on-surface-variant leading-relaxed">{text}</p>
      {children}
    </div>
  );
}
