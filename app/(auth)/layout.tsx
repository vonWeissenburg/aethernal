export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left panel — violet branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-violet flex-col items-center justify-center p-12 text-white">
        <div className="max-w-md text-center space-y-6">
          <h1 className="font-serif text-5xl font-light tracking-wide">
            Aethernal
          </h1>
          <div className="w-16 h-px bg-amber mx-auto" />
          <p className="text-lg text-lavender/80 font-light leading-relaxed">
            Das digitale Gedenkprofil, das Erinnerungen bewahrt und Verbindungen
            schafft, die über die Zeit hinausgehen.
          </p>
        </div>
      </div>

      {/* Mobile header */}
      <div className="lg:hidden bg-violet px-6 py-8 text-center text-white">
        <h1 className="font-serif text-3xl font-light tracking-wide">
          Aethernal
        </h1>
        <p className="mt-2 text-sm text-lavender/70">
          Erinnerungen, die bleiben.
        </p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-white">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
