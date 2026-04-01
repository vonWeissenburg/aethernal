"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { generateSlug } from "@/lib/utils";

const TOTAL_STEPS = 4;

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

  async function handleFinish() {
    if (!name.trim()) {
      setError("Bitte gib einen Namen ein.");
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

      {/* Step 0: Welcome */}
      {step === 0 && (
        <>
          <header className="w-full flex flex-col items-center pt-12 px-8 space-y-6 relative z-10">
            <div className="w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <span className="font-label text-[10px] tracking-[0.2em] uppercase text-on-surface-variant/60">
                  Schritt 1 von {TOTAL_STEPS}
                </span>
                <span className="font-headline italic text-primary text-lg">Aethernal</span>
              </div>
              <div className="h-[2px] w-full bg-surface-container-highest rounded-full overflow-hidden">
                <div className="h-full bg-primary w-1/4 rounded-full shadow-[0_0_8px_rgba(242,202,80,0.5)]" />
              </div>
            </div>
          </header>

          <main className="flex-grow flex flex-col items-center justify-center px-8 text-center max-w-2xl mx-auto relative z-10">
            <div className="mb-12 relative">
              <div className="absolute inset-0 bg-primary/10 blur-[60px] rounded-full scale-150" />
              <div className="relative" style={{ filter: "drop-shadow(0 0 20px rgba(242, 202, 80, 0.2))" }}>
                <span className="material-symbols-outlined text-primary text-8xl md:text-9xl" style={{ fontVariationSettings: "'wght' 200" }}>
                  raven
                </span>
              </div>
            </div>
            <div className="space-y-6">
              <h1 className="font-headline text-4xl md:text-5xl font-semibold text-on-surface tracking-tight leading-tight">
                Willkommen bei Aethernal
              </h1>
              <p className="font-body text-lg md:text-xl text-on-surface-variant leading-relaxed max-w-sm mx-auto opacity-80">
                In wenigen Schritten richtest du deinen persönlichen Gedenkraum ein.
              </p>
            </div>
          </main>

          <footer className="w-full px-8 pb-16 pt-8 flex flex-col items-center max-w-md mx-auto space-y-8 relative z-10">
            <button
              onClick={() => setStep(1)}
              className="w-full bg-primary text-on-primary font-body font-semibold py-5 rounded-lg text-lg tracking-wide hover:opacity-90 active:scale-[0.98] transition-all duration-300 shadow-[0_10px_30px_rgba(242,202,80,0.15)]"
            >
              Weiter
            </button>
            <button
              onClick={() => setStep(3)}
              className="font-label text-sm text-on-surface-variant/60 hover:text-primary transition-colors duration-300 tracking-widest uppercase"
            >
              Überspringen
            </button>
          </footer>
        </>
      )}

      {/* Step 1: Type selection + Name/Dates */}
      {step === 1 && (
        <>
          <header className="bg-surface sticky top-0 z-50 flex justify-between items-center px-6 py-4 w-full">
            <button onClick={() => setStep(0)}>
              <span className="material-symbols-outlined text-primary">close</span>
            </button>
            <h1 className="font-headline text-xl italic text-primary">Aethernal</h1>
            <div className="w-8" />
          </header>

          <main className="max-w-2xl mx-auto px-6 pt-12 pb-32 relative z-10">
            {/* Progress */}
            <div className="mb-16">
              <div className="flex justify-between items-center mb-4">
                <span className="font-label text-xs tracking-widest text-on-surface-variant uppercase">
                  Schritt 2 von {TOTAL_STEPS}
                </span>
                <span className="font-label text-xs tracking-widest text-primary uppercase">
                  Erstes Gedenkprofil
                </span>
              </div>
              <div className="h-1 w-full bg-surface-container-highest rounded-full overflow-hidden">
                <div className="h-full bg-primary w-2/4 transition-all duration-700 ease-out" />
              </div>
            </div>

            <div className="text-center mb-16">
              <h2 className="font-headline text-3xl md:text-4xl text-on-surface leading-tight mb-4">
                Für wen möchtest du gedenken?
              </h2>
              <p className="font-body text-on-surface-variant text-base">
                Wähle die Art des Gedenkprofils, das du erstellen möchtest.
              </p>
            </div>

            {error && (
              <div className="rounded-lg bg-error/10 border border-error-container/30 px-4 py-3 text-sm text-error mb-6">
                {error}
              </div>
            )}

            {/* Selection Cards */}
            <div className="grid grid-cols-2 gap-6 mb-16">
              <button
                onClick={() => setType("human")}
                className={`relative group flex flex-col items-center justify-center p-8 rounded-xl transition-all duration-300 ${
                  type === "human"
                    ? "bg-surface-container-high border-2 border-primary shadow-[0_0_20px_rgba(242,202,80,0.1)]"
                    : "bg-surface-container-low border-2 border-outline-variant/30 hover:bg-surface-container-high hover:border-outline-variant/60"
                }`}
              >
                <div className={`mb-4 ${type === "human" ? "text-primary" : "text-on-surface-variant"}`}>
                  <span className="material-symbols-outlined text-5xl" style={type === "human" ? { fontVariationSettings: "'FILL' 1" } : undefined}>
                    person
                  </span>
                </div>
                <span className="font-headline text-lg text-on-surface">Mensch</span>
                {type === "human" && (
                  <div className="absolute top-3 right-3">
                    <span className="material-symbols-outlined text-primary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                      check_circle
                    </span>
                  </div>
                )}
              </button>

              <button
                onClick={() => setType("animal")}
                className={`relative group flex flex-col items-center justify-center p-8 rounded-xl transition-all duration-300 ${
                  type === "animal"
                    ? "bg-surface-container-high border-2 border-primary shadow-[0_0_20px_rgba(242,202,80,0.1)]"
                    : "bg-surface-container-low border-2 border-outline-variant/30 hover:bg-surface-container-high hover:border-outline-variant/60"
                }`}
              >
                <div className={`mb-4 ${type === "animal" ? "text-primary" : "text-on-surface-variant"}`}>
                  <span className="material-symbols-outlined text-5xl">pets</span>
                </div>
                <span className="font-headline text-lg text-on-surface">Haustier</span>
                {type === "animal" && (
                  <div className="absolute top-3 right-3">
                    <span className="material-symbols-outlined text-primary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                      check_circle
                    </span>
                  </div>
                )}
              </button>
            </div>

            {/* Form Fields */}
            <div className="space-y-10">
              <div>
                <label className="font-headline text-sm text-on-surface-variant mb-2 block" htmlFor="name">
                  Name {type === "animal" ? "des Tieres" : "des Verstorbenen"}
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Vollständiger Name"
                  className="w-full bg-surface-container-low border-none rounded-lg p-4 text-on-surface placeholder:text-on-surface-variant/40 focus:ring-2 focus:ring-primary focus:bg-surface-container transition-all"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="font-headline text-sm text-on-surface-variant mb-2 block" htmlFor="birth_date">
                    Geburtsdatum
                  </label>
                  <input
                    id="birth_date"
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="w-full bg-surface-container-low border-none rounded-lg p-4 text-on-surface focus:ring-2 focus:ring-primary focus:bg-surface-container transition-all"
                  />
                </div>
                <div>
                  <label className="font-headline text-sm text-on-surface-variant mb-2 block" htmlFor="death_date">
                    Sterbedatum
                  </label>
                  <input
                    id="death_date"
                    type="date"
                    value={deathDate}
                    onChange={(e) => setDeathDate(e.target.value)}
                    className="w-full bg-surface-container-low border-none rounded-lg p-4 text-on-surface focus:ring-2 focus:ring-primary focus:bg-surface-container transition-all"
                  />
                </div>
              </div>
            </div>
          </main>

          <footer className="fixed bottom-0 left-0 w-full p-8 bg-surface-container-lowest/80 backdrop-blur-xl z-50">
            <div className="max-w-2xl mx-auto">
              <button
                onClick={() => setStep(2)}
                className="w-full py-5 bg-primary text-on-primary font-body font-semibold text-lg rounded-lg shadow-[0_10px_30px_rgba(242,202,80,0.2)] hover:opacity-90 active:scale-[0.98] transition-all duration-300"
              >
                Weiter
              </button>
              <p className="text-center mt-4 text-on-surface-variant/50 text-xs font-label tracking-wide uppercase">
                Deine Daten werden vertraulich behandelt
              </p>
            </div>
          </footer>
        </>
      )}

      {/* Step 2: Photo upload (placeholder) */}
      {step === 2 && (
        <>
          <header className="w-full max-w-lg mx-auto px-6 pt-12 relative z-10">
            <div className="flex items-center justify-between mb-4">
              <span className="text-primary font-headline text-lg tracking-widest uppercase opacity-80">
                Aethernal
              </span>
              <span className="text-on-surface-variant font-label text-sm tracking-widest">
                3 / {TOTAL_STEPS}
              </span>
            </div>
            <div className="h-1 w-full bg-surface-container rounded-full overflow-hidden">
              <div className="h-full bg-primary w-3/4 shadow-[0_0_8px_rgba(242,202,80,0.5)]" />
            </div>
          </header>

          <main className="flex-1 w-full max-w-lg px-8 flex flex-col items-center justify-center text-center py-12 relative z-10">
            <div className="mb-12">
              <h1 className="font-headline text-3xl md:text-4xl text-on-surface leading-snug mb-4">
                Ein Foto sagt mehr als tausend Worte
              </h1>
              <p className="text-on-surface-variant font-body font-light max-w-sm mx-auto">
                Wähle ein Bild, das die Essenz dieser unvergesslichen Reise einfängt.
              </p>
            </div>

            <div className="relative group cursor-pointer">
              <div className="absolute -inset-4 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-all duration-500" />
              <div className="relative w-64 h-64 rounded-full border-2 border-dashed border-primary/40 bg-surface-container-low flex flex-col items-center justify-center overflow-hidden transition-all duration-500 group-hover:border-primary group-hover:bg-surface-container">
                <div className="bg-primary/10 p-6 rounded-full mb-4">
                  <span className="material-symbols-outlined text-primary text-5xl">photo_camera</span>
                </div>
                <span className="font-label text-sm text-primary tracking-widest uppercase">
                  Foto auswählen
                </span>
              </div>
            </div>

            <p className="mt-8 text-on-surface-variant/60 font-body text-xs tracking-wide">
              Du kannst das später jederzeit ändern
            </p>
          </main>

          <footer className="w-full max-w-lg mx-auto px-8 pb-12 flex flex-col gap-4 relative z-10">
            <button
              onClick={() => setStep(3)}
              className="w-full py-4 bg-primary text-on-primary font-label font-semibold tracking-widest uppercase rounded-lg shadow-[0_4px_20px_rgba(0,0,0,0.3)] hover:brightness-110 active:scale-[0.98] transition-all duration-300"
            >
              Weiter
            </button>
            <button
              onClick={() => setStep(3)}
              className="w-full py-3 text-on-surface-variant font-label text-sm tracking-widest uppercase hover:text-primary transition-colors duration-300"
            >
              Überspringen
            </button>
          </footer>
        </>
      )}

      {/* Step 3: Finish */}
      {step === 3 && (
        <>
          <header className="w-full px-6 pt-12 max-w-lg mx-auto relative z-10">
            <div className="flex items-center justify-between mb-4">
              <span className="text-primary font-label text-[10px] uppercase tracking-widest">
                Schritt {TOTAL_STEPS} von {TOTAL_STEPS}
              </span>
              <span className="text-primary font-label text-[10px] uppercase tracking-widest">
                Fertig!
              </span>
            </div>
            <div className="h-1 w-full bg-surface-container rounded-full overflow-hidden">
              <div className="h-full w-full bg-primary rounded-full shadow-[0_0_12px_rgba(242,202,80,0.4)]" />
            </div>
          </header>

          <main className="flex-grow flex flex-col items-center justify-center px-8 text-center relative">
            <div className="absolute inset-0 pointer-events-none golden-glow z-0" />

            <div className="relative z-10 mb-12 flex items-center justify-center">
              <div className="absolute w-64 h-64 bg-primary/5 rounded-full blur-3xl animate-pulse" />
              <div className="relative flex flex-col items-center">
                <div className="w-24 h-24 rounded-full bg-surface-container-high flex items-center justify-center border border-primary/20 shadow-2xl">
                  <span className="material-symbols-outlined text-primary text-5xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                    raven
                  </span>
                </div>
                <span className="material-symbols-outlined absolute -top-4 -right-4 text-primary/40 text-xl">auto_awesome</span>
                <span className="material-symbols-outlined absolute bottom-0 -left-6 text-primary/60 text-lg">spark_</span>
              </div>
            </div>

            {error && (
              <div className="relative z-10 rounded-lg bg-error/10 border border-error-container/30 px-4 py-3 text-sm text-error mb-6 max-w-sm">
                {error}
              </div>
            )}

            <div className="relative z-10 space-y-6 max-w-sm">
              <h1 className="text-4xl md:text-5xl font-headline text-on-surface leading-tight font-bold shimmer-text">
                Dein Gedenkraum ist bereit
              </h1>
              <p className="text-on-surface-variant text-base md:text-lg leading-relaxed font-body">
                Du kannst jetzt Erinnerungen festhalten, Tagebuch schreiben und Nachrichten hinterlassen.
              </p>
            </div>

            <div className="relative z-10 mt-10 flex flex-wrap justify-center gap-3">
              <div className="px-4 py-2 bg-surface-container-high rounded-full border border-outline-variant/10 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-sm">history_edu</span>
                <span className="text-[11px] font-label tracking-wide uppercase text-on-surface-variant">Tagebuch</span>
              </div>
              <div className="px-4 py-2 bg-surface-container-high rounded-full border border-outline-variant/10 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-sm">photo_library</span>
                <span className="text-[11px] font-label tracking-wide uppercase text-on-surface-variant">Galerie</span>
              </div>
              <div className="px-4 py-2 bg-surface-container-high rounded-full border border-outline-variant/10 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-sm">mail</span>
                <span className="text-[11px] font-label tracking-wide uppercase text-on-surface-variant">Botschaften</span>
              </div>
            </div>
          </main>

          <footer className="w-full px-6 pb-16 max-w-lg mx-auto relative z-10">
            <button
              onClick={handleFinish}
              disabled={loading}
              className="w-full py-5 bg-primary hover:bg-primary-container text-on-primary font-bold rounded-lg transition-all duration-300 flex items-center justify-center gap-3 shadow-lg shadow-primary/10 group disabled:opacity-50"
            >
              <span className="font-body text-base tracking-wide">
                {loading ? "Wird erstellt..." : "Zum Dashboard"}
              </span>
              {!loading && (
                <span className="material-symbols-outlined text-xl transition-transform group-hover:translate-x-1">
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
