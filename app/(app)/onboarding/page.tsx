"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { generateSlug } from "@/lib/utils";
import { validateMemorial, firstError } from "@/lib/validation";

const TOTAL_STEPS = 4;

function ProgressHeader({ step, onBack }: { step: number; onBack?: () => void }) {
  const pct = ((step + 1) / TOTAL_STEPS) * 100;
  return (
    <header className="w-full max-w-2xl mx-auto px-6 pt-10 relative z-10">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              aria-label="Zurück"
              className="text-on-surface-variant hover:text-primary transition-colors duration-250 ease-out rounded-full flex items-center"
            >
              <span className="material-symbols-outlined" aria-hidden="true">arrow_back</span>
            </button>
          )}
          <span className="font-label text-[10px] tracking-[0.2em] uppercase text-on-surface-variant/70">
            Schritt {step + 1} von {TOTAL_STEPS}
          </span>
        </div>
        <span className="font-headline italic text-primary text-lg">Aethernal</span>
      </div>
      <div className="h-1 w-full bg-surface-container-highest rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full shadow-[0_0_8px_rgba(242,202,80,0.5)] transition-all duration-400 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </header>
  );
}

function TypeCard({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`relative overflow-hidden flex flex-col items-center justify-center p-8 rounded-card transition-all duration-250 ease-out ${
        active
          ? "bg-surface-container-high border-2 border-primary shadow-[0_0_20px_rgba(242,202,80,0.1)]"
          : "bg-surface-container-low border-2 border-outline-variant/30 hover:bg-surface-container-high hover:border-outline-variant/60"
      }`}
    >
      {/* Großes gedämpftes Hintergrund-Icon (Trigger-Card-Muster) */}
      <span
        className="material-symbols-outlined absolute -bottom-5 -right-5 text-[96px] text-on-surface/5 pointer-events-none"
        aria-hidden="true"
      >
        {icon}
      </span>
      <div className={`mb-4 relative ${active ? "text-primary" : "text-on-surface-variant"}`}>
        <span
          className="material-symbols-outlined text-5xl"
          style={active ? { fontVariationSettings: "'FILL' 1" } : undefined}
          aria-hidden="true"
        >
          {icon}
        </span>
      </div>
      <span className="font-headline text-lg text-on-surface relative">{label}</span>
      {active && (
        <div className="absolute top-3 right-3">
          <span
            className="material-symbols-outlined text-primary text-xl"
            style={{ fontVariationSettings: "'FILL' 1" }}
            aria-hidden="true"
          >
            check_circle
          </span>
        </div>
      )}
    </button>
  );
}

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [type, setType] = useState<"human" | "animal">("human");
  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [deathDate, setDeathDate] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function handleStep1Next() {
    const errors = validateMemorial({
      name,
      birth_date: birthDate || null,
      death_date: deathDate || null,
    });
    if (errors.length > 0) {
      setError(firstError(errors));
      return;
    }
    setError(null);
    setStep(2);
  }

  async function handleSkip() {
    setLoading(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    await supabase
      .from("profiles")
      .update({ onboarding_done: true })
      .eq("id", user.id);

    router.push("/dashboard");
    router.refresh();
  }

  async function handleFinish() {
    const errors = validateMemorial({
      name,
      birth_date: birthDate || null,
      death_date: deathDate || null,
    });
    if (errors.length > 0) {
      setError(firstError(errors));
      return;
    }

    setLoading(true);
    setError(null);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const { error: memError } = await supabase.from("memorials").insert({
      user_id: user.id,
      name: name.trim(),
      slug: generateSlug(name.trim()),
      type,
      description: description.trim() || null,
      birth_date: birthDate || null,
      death_date: deathDate || null,
    });

    if (memError) {
      setError(memError.message);
      setLoading(false);
      return;
    }

    await supabase
      .from("profiles")
      .update({ onboarding_done: true })
      .eq("id", user.id);

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-background text-on-surface font-body flex flex-col">
      {/* Background decoration */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute top-[60%] -right-[15%] w-[50%] h-[50%] rounded-full bg-tertiary-container/5 blur-[150px]" />
      </div>

      {/* Step 0: Willkommen */}
      {step === 0 && (
        <>
          <ProgressHeader step={0} />

          <main className="flex-grow flex flex-col items-center justify-center px-8 text-center max-w-2xl mx-auto relative z-10">
            <div className="mb-12 relative">
              <div className="absolute inset-0 bg-primary/10 blur-[60px] rounded-full scale-150" />
              <div className="relative" style={{ filter: "drop-shadow(0 0 20px rgba(242, 202, 80, 0.2))" }}>
                <span
                  className="material-symbols-outlined text-primary text-8xl md:text-9xl"
                  style={{ fontVariationSettings: "'wght' 200" }}
                  aria-hidden="true"
                >
                  potted_plant
                </span>
              </div>
            </div>
            <div className="space-y-6">
              <h1 className="font-headline text-4xl md:text-5xl font-semibold text-on-surface tracking-tight leading-tight">
                Willkommen bei Aethernal
              </h1>
              <p className="font-body text-lg md:text-xl text-on-surface-variant leading-relaxed max-w-sm mx-auto">
                In wenigen Schritten richtest du deinen persönlichen Gedenkraum ein.
              </p>
            </div>
          </main>

          <footer className="w-full px-8 pb-16 pt-8 flex flex-col items-center max-w-md mx-auto space-y-8 relative z-10">
            <button
              onClick={() => setStep(1)}
              className="w-full bg-primary text-on-primary font-body font-semibold py-5 rounded-button text-lg tracking-wide hover:brightness-110 active:scale-[0.98] transition-all duration-250 ease-out shadow-[0_10px_30px_rgba(242,202,80,0.15)]"
            >
              Weiter
            </button>
            <button
              onClick={handleSkip}
              disabled={loading}
              className="font-label text-sm text-on-surface-variant/70 hover:text-primary transition-colors duration-250 ease-out tracking-widest uppercase disabled:opacity-50"
            >
              {loading ? "Einen Moment …" : "Später einrichten"}
            </button>
          </footer>
        </>
      )}

      {/* Step 1: Art + Name/Daten */}
      {step === 1 && (
        <>
          <ProgressHeader step={1} onBack={() => setStep(0)} />

          <main className="w-full max-w-2xl mx-auto px-6 pt-12 pb-40 relative z-10">
            <div className="text-center mb-16">
              <h2 className="font-headline text-3xl md:text-4xl text-on-surface leading-tight mb-4">
                Für wen möchtest du gedenken?
              </h2>
              <p className="font-body text-on-surface-variant text-base">
                Wähle die Art des Gedenkprofils, das du erstellen möchtest.
              </p>
            </div>

            {error && (
              <div className="rounded-button bg-error/10 border border-error-container/30 px-4 py-3 text-sm text-error mb-6">
                {error}
              </div>
            )}

            {/* Auswahl-Trigger-Karten */}
            <div className="grid grid-cols-2 gap-6 mb-16">
              <TypeCard
                active={type === "human"}
                icon="person"
                label="Mensch"
                onClick={() => setType("human")}
              />
              <TypeCard
                active={type === "animal"}
                icon="pets"
                label="Haustier"
                onClick={() => setType("animal")}
              />
            </div>

            {/* Formularfelder */}
            <div className="space-y-10">
              <div>
                <label
                  className="font-label text-xs uppercase tracking-widest text-on-surface-variant mb-2 block"
                  htmlFor="name"
                >
                  Name {type === "animal" ? "des Tieres" : "des Verstorbenen"}
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Vollständiger Name"
                  className="w-full bg-surface-container border-none rounded-button p-4 text-on-surface placeholder:text-on-surface-variant/40 focus:ring-2 focus:ring-primary/50 transition-all duration-250 ease-out"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label
                    className="font-label text-xs uppercase tracking-widest text-on-surface-variant mb-2 block"
                    htmlFor="birth_date"
                  >
                    Geburtsdatum
                  </label>
                  <input
                    id="birth_date"
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="w-full bg-surface-container border-none rounded-button p-4 text-on-surface focus:ring-2 focus:ring-primary/50 transition-all duration-250 ease-out"
                  />
                </div>
                <div>
                  <label
                    className="font-label text-xs uppercase tracking-widest text-on-surface-variant mb-2 block"
                    htmlFor="death_date"
                  >
                    Sterbedatum
                  </label>
                  <input
                    id="death_date"
                    type="date"
                    value={deathDate}
                    onChange={(e) => setDeathDate(e.target.value)}
                    className="w-full bg-surface-container border-none rounded-button p-4 text-on-surface focus:ring-2 focus:ring-primary/50 transition-all duration-250 ease-out"
                  />
                </div>
              </div>
            </div>
          </main>

          <footer className="fixed bottom-0 left-0 w-full p-8 bg-surface-container-lowest/80 backdrop-blur-xl z-50">
            <div className="max-w-2xl mx-auto">
              <button
                onClick={handleStep1Next}
                className="w-full py-5 bg-primary text-on-primary font-body font-semibold text-lg rounded-button shadow-[0_10px_30px_rgba(242,202,80,0.2)] hover:brightness-110 active:scale-[0.98] transition-all duration-250 ease-out"
              >
                Weiter
              </button>
              <p className="text-center mt-4 text-on-surface-variant/70 text-xs font-label tracking-wide uppercase">
                Deine Daten werden vertraulich behandelt
              </p>
            </div>
          </footer>
        </>
      )}

      {/* Step 2: Foto — ehrlich optional, Upload kommt mit B0 */}
      {step === 2 && (
        <>
          <ProgressHeader step={2} onBack={() => setStep(1)} />

          <main className="flex-1 w-full max-w-lg mx-auto px-8 flex flex-col items-center justify-center text-center py-12 relative z-10">
            <div className="mb-10">
              <span className="inline-block mb-6 px-4 py-1.5 rounded-full bg-surface-container-high border border-outline-variant/30 font-label text-[10px] tracking-[0.2em] uppercase text-on-surface-variant">
                Optional
              </span>
              <h1 className="font-headline text-3xl md:text-4xl text-on-surface leading-snug mb-4">
                Ein Foto sagt mehr als tausend Worte
              </h1>
              <p className="text-on-surface-variant font-body font-light max-w-sm mx-auto">
                Der Foto-Upload ist hier bald möglich. Du kannst Fotos jederzeit
                später im Gedenkprofil hinzufügen.
              </p>
            </div>

            <div className="relative">
              <div className="absolute -inset-4 bg-primary/5 rounded-full blur-3xl" />
              <div className="relative w-56 h-56 rounded-full border-2 border-dashed border-outline-variant/60 bg-surface-container-low flex flex-col items-center justify-center">
                <div className="bg-surface-container-high p-6 rounded-full mb-4">
                  <span
                    className="material-symbols-outlined text-on-surface-variant text-5xl"
                    aria-hidden="true"
                  >
                    photo_camera
                  </span>
                </div>
                <span className="font-label text-[10px] text-on-surface-variant tracking-[0.2em] uppercase">
                  Bald verfügbar
                </span>
              </div>
            </div>
          </main>

          <footer className="w-full max-w-lg mx-auto px-8 pb-12 relative z-10">
            <button
              onClick={() => setStep(3)}
              className="w-full py-4 bg-primary text-on-primary font-label font-semibold tracking-widest uppercase rounded-button shadow-lg shadow-primary/10 hover:brightness-110 active:scale-[0.98] transition-all duration-250 ease-out"
            >
              Weiter
            </button>
          </footer>
        </>
      )}

      {/* Step 3: Fertig */}
      {step === 3 && (
        <>
          <ProgressHeader step={3} onBack={() => setStep(2)} />

          <main className="flex-grow flex flex-col items-center justify-center px-8 text-center relative">
            <div className="absolute inset-0 pointer-events-none golden-glow z-0" />

            <div className="relative z-10 mb-12 flex items-center justify-center">
              <div className="absolute w-64 h-64 bg-primary/5 rounded-full blur-3xl animate-pulse" />
              <div className="relative flex flex-col items-center">
                <div className="w-24 h-24 rounded-full bg-surface-container-high flex items-center justify-center border border-primary/20 shadow-2xl">
                  <span
                    className="material-symbols-outlined text-primary text-5xl"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                    aria-hidden="true"
                  >
                    potted_plant
                  </span>
                </div>
                <span
                  className="material-symbols-outlined absolute -top-4 -right-4 text-primary/40 text-xl"
                  aria-hidden="true"
                >
                  auto_awesome
                </span>
                <span
                  className="material-symbols-outlined absolute bottom-0 -left-6 text-primary/60 text-lg"
                  aria-hidden="true"
                >
                  auto_awesome
                </span>
              </div>
            </div>

            {error && (
              <div className="relative z-10 rounded-button bg-error/10 border border-error-container/30 px-4 py-3 text-sm text-error mb-6 max-w-sm">
                {error}
              </div>
            )}

            <div className="relative z-10 space-y-6 max-w-sm">
              <h1 className="text-4xl md:text-5xl font-headline leading-tight font-bold shimmer-text">
                Dein Gedenkraum ist bereit
              </h1>
              <p className="text-on-surface-variant text-base md:text-lg leading-relaxed font-body">
                Du kannst jetzt Erinnerungen festhalten, Tagebuch schreiben und
                Nachrichten hinterlassen.
              </p>
            </div>

            <div className="relative z-10 mt-10 flex flex-wrap justify-center gap-3">
              {[
                { icon: "history_edu", label: "Tagebuch" },
                { icon: "photo_library", label: "Galerie" },
                { icon: "mail", label: "Botschaften" },
              ].map((chip) => (
                <div
                  key={chip.label}
                  className="px-4 py-2 bg-surface-container-high rounded-full border border-outline-variant/30 flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-primary text-sm" aria-hidden="true">
                    {chip.icon}
                  </span>
                  <span className="text-[11px] font-label tracking-wide uppercase text-on-surface-variant">
                    {chip.label}
                  </span>
                </div>
              ))}
            </div>
          </main>

          <footer className="w-full px-6 pb-16 max-w-lg mx-auto relative z-10">
            <button
              onClick={handleFinish}
              disabled={loading}
              className="w-full py-5 bg-primary hover:bg-primary-container text-on-primary font-bold rounded-button transition-all duration-250 ease-out flex items-center justify-center gap-3 shadow-lg shadow-primary/10 group disabled:opacity-50"
            >
              <span className="font-body text-base tracking-wide">
                {loading ? "Wird erstellt..." : "Zum Dashboard"}
              </span>
              {!loading && (
                <span
                  className="material-symbols-outlined text-xl transition-transform duration-250 ease-out group-hover:translate-x-1"
                  aria-hidden="true"
                >
                  arrow_forward
                </span>
              )}
            </button>
          </footer>
        </>
      )}
    </div>
  );
}
