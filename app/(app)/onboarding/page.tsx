"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { generateSlug } from "@/lib/utils";

const STEPS = [
  { title: "Willkommen", subtitle: "Schön, dass du hier bist." },
  { title: "Gedenkprofil-Typ", subtitle: "Für wen möchtest du ein Profil erstellen?" },
  { title: "Grunddaten", subtitle: "Erzähl uns ein wenig über die Person oder das Tier." },
  { title: "Fertig", subtitle: "Dein Gedenkprofil wird erstellt." },
];

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [type, setType] = useState<"human" | "animal">("human");
  const [name, setName] = useState("");
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

    // Create memorial
    const { error: memError } = await supabase.from("memorials").insert({
      user_id: user.id,
      name: name.trim(),
      slug: generateSlug(name.trim()),
      type,
      description: description.trim() || null,
    });

    if (memError) {
      setError(memError.message);
      setLoading(false);
      return;
    }

    // Mark onboarding done
    await supabase
      .from("profiles")
      .update({ onboarding_done: true })
      .eq("id", user.id);

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-primary px-4">
      <div className="w-full max-w-lg">
        {/* Progress */}
        <div className="flex gap-2 mb-8">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition ${
                i <= step ? "bg-gold" : "bg-surface-container-highest"
              }`}
            />
          ))}
        </div>

        <div className="bg-bg-card rounded-2xl border border-border-card p-8 shadow-sm">
          <h2 className="text-2xl font-serif font-semibold text-gold-light">
            {STEPS[step].title}
          </h2>
          <p className="mt-1 text-sm text-text-secondary mb-8">
            {STEPS[step].subtitle}
          </p>

          {error && (
            <div className="rounded-lg bg-error/10 border border-error/30 px-4 py-3 text-sm text-error-light mb-6">
              {error}
            </div>
          )}

          {/* Step 0: Welcome */}
          {step === 0 && (
            <div className="space-y-6">
              <p className="text-text-primary leading-relaxed">
                Aethernal hilft dir, die Erinnerung an geliebte Menschen und
                Tiere zu bewahren. In wenigen Schritten erstellst du dein erstes
                Gedenkprofil.
              </p>
              <div className="flex gap-3 p-4 bg-gold/10 rounded-lg">
                <span className="text-2xl">🕊️</span>
                <div>
                  <p className="text-sm font-medium text-gold-light">
                    Was dich erwartet
                  </p>
                  <p className="text-sm text-text-secondary mt-1">
                    Wähle einen Profil-Typ, gib Grunddaten ein und schon kann es
                    losgehen.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 1: Type */}
          {step === 1 && (
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setType("human")}
                className={`p-6 rounded-xl border-2 text-center transition ${
                  type === "human"
                    ? "border-gold bg-gold/10"
                    : "border-border-card hover:border-gold/30"
                }`}
              >
                <span className="text-4xl block mb-3">🕊️</span>
                <span className="font-medium text-gold-light">Mensch</span>
              </button>
              <button
                onClick={() => setType("animal")}
                className={`p-6 rounded-xl border-2 text-center transition ${
                  type === "animal"
                    ? "border-gold bg-gold/10"
                    : "border-border-card hover:border-gold/30"
                }`}
              >
                <span className="text-4xl block mb-3">🐾</span>
                <span className="font-medium text-gold-light">Tier</span>
              </button>
            </div>
          )}

          {/* Step 2: Basic info */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">
                  Name {type === "animal" ? "des Tieres" : "der Person"}
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={
                    type === "animal" ? "z.B. Luna" : "z.B. Maria Müller"
                  }
                  className="w-full rounded-lg bg-surface-container-high border-none px-4 py-3 text-sm text-text-primary placeholder:text-text-muted/50 focus:ring-1 focus:ring-gold-light/50 transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">
                  Kurze Beschreibung{" "}
                  <span className="text-text-secondary font-normal">
                    (optional)
                  </span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder={
                    type === "animal"
                      ? "Ein treuer Begleiter, der immer..."
                      : "Ein liebevoller Mensch, der..."
                  }
                  className="w-full rounded-lg bg-surface-container-high border-none px-4 py-3 text-sm text-text-primary placeholder:text-text-muted/50 focus:ring-1 focus:ring-gold-light/50 transition resize-none"
                />
              </div>
            </div>
          )}

          {/* Step 3: Finish */}
          {step === 3 && (
            <div className="text-center space-y-4">
              <div className="text-5xl">
                {type === "animal" ? "🐾" : "🕊️"}
              </div>
              <p className="text-text-primary">
                Dein Gedenkprofil für{" "}
                <strong className="text-gold-light">{name || "..."}</strong> wird
                jetzt erstellt.
              </p>
              <p className="text-sm text-text-secondary">
                Du kannst danach jederzeit weitere Details, Fotos und
                Tagebucheinträge hinzufügen.
              </p>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8 pt-6 border-t border-border-card">
            {step > 0 ? (
              <button
                onClick={() => setStep(step - 1)}
                className="px-5 py-2.5 text-sm text-text-secondary hover:text-gold-light transition"
              >
                Zurück
              </button>
            ) : (
              <div />
            )}

            {step < STEPS.length - 1 ? (
              <button
                onClick={() => setStep(step + 1)}
                className="rounded-lg bg-gold px-6 py-3 text-sm font-semibold text-bg-primary hover:brightness-110 transition shadow-sm"
              >
                Weiter
              </button>
            ) : (
              <button
                onClick={handleFinish}
                disabled={loading}
                className="rounded-lg bg-gold px-6 py-2.5 text-sm font-medium text-bg-primary hover:brightness-110 transition shadow-sm disabled:opacity-50"
              >
                {loading ? "Wird erstellt..." : "Profil erstellen"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
