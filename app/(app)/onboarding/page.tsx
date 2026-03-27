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
    <div className="min-h-screen flex items-center justify-center bg-[#fafaf7] px-4">
      <div className="w-full max-w-lg">
        {/* Progress */}
        <div className="flex gap-2 mb-8">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition ${
                i <= step ? "bg-violet" : "bg-lavender-dark"
              }`}
            />
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-lavender-dark p-8 shadow-sm">
          <h2 className="text-2xl font-serif font-semibold text-violet">
            {STEPS[step].title}
          </h2>
          <p className="mt-1 text-sm text-aether-gray mb-8">
            {STEPS[step].subtitle}
          </p>

          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 mb-6">
              {error}
            </div>
          )}

          {/* Step 0: Welcome */}
          {step === 0 && (
            <div className="space-y-6">
              <p className="text-aether-text leading-relaxed">
                Aethernal hilft dir, die Erinnerung an geliebte Menschen und
                Tiere zu bewahren. In wenigen Schritten erstellst du dein erstes
                Gedenkprofil.
              </p>
              <div className="flex gap-3 p-4 bg-lavender/50 rounded-lg">
                <span className="text-2xl">🕊️</span>
                <div>
                  <p className="text-sm font-medium text-violet">
                    Was dich erwartet
                  </p>
                  <p className="text-sm text-aether-gray mt-1">
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
                    ? "border-violet bg-lavender/50"
                    : "border-lavender-dark hover:border-violet/30"
                }`}
              >
                <span className="text-4xl block mb-3">🕊️</span>
                <span className="font-medium text-violet">Mensch</span>
              </button>
              <button
                onClick={() => setType("animal")}
                className={`p-6 rounded-xl border-2 text-center transition ${
                  type === "animal"
                    ? "border-violet bg-lavender/50"
                    : "border-lavender-dark hover:border-violet/30"
                }`}
              >
                <span className="text-4xl block mb-3">🐾</span>
                <span className="font-medium text-violet">Tier</span>
              </button>
            </div>
          )}

          {/* Step 2: Basic info */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-aether-text mb-1.5">
                  Name {type === "animal" ? "des Tieres" : "der Person"}
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={
                    type === "animal" ? "z.B. Luna" : "z.B. Maria Müller"
                  }
                  className="w-full rounded-lg border border-lavender-dark bg-white px-4 py-2.5 text-sm text-aether-text placeholder:text-aether-gray/50 focus:border-violet focus:ring-2 focus:ring-violet/20 outline-none transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-aether-text mb-1.5">
                  Kurze Beschreibung{" "}
                  <span className="text-aether-gray font-normal">
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
                  className="w-full rounded-lg border border-lavender-dark bg-white px-4 py-2.5 text-sm text-aether-text placeholder:text-aether-gray/50 focus:border-violet focus:ring-2 focus:ring-violet/20 outline-none transition resize-none"
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
              <p className="text-aether-text">
                Dein Gedenkprofil für{" "}
                <strong className="text-violet">{name || "..."}</strong> wird
                jetzt erstellt.
              </p>
              <p className="text-sm text-aether-gray">
                Du kannst danach jederzeit weitere Details, Fotos und
                Tagebucheinträge hinzufügen.
              </p>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8 pt-6 border-t border-lavender-dark">
            {step > 0 ? (
              <button
                onClick={() => setStep(step - 1)}
                className="px-5 py-2.5 text-sm text-aether-gray hover:text-violet transition"
              >
                Zurück
              </button>
            ) : (
              <div />
            )}

            {step < STEPS.length - 1 ? (
              <button
                onClick={() => setStep(step + 1)}
                className="rounded-lg bg-violet px-6 py-2.5 text-sm font-medium text-white hover:bg-violet-light transition shadow-sm"
              >
                Weiter
              </button>
            ) : (
              <button
                onClick={handleFinish}
                disabled={loading}
                className="rounded-lg bg-amber px-6 py-2.5 text-sm font-medium text-white hover:bg-amber-light transition shadow-sm disabled:opacity-50"
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
