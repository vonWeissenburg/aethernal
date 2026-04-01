"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { generateSlug } from "@/lib/utils";
import { validateMemorial, firstError } from "@/lib/validation";
import { useToast } from "@/components/toast";

export default function NewMemorialPage() {
  const [type, setType] = useState<"human" | "animal">("human");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [deathDate, setDeathDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { showToast } = useToast();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const errors = validateMemorial({
      name: name.trim(),
      description: description.trim() || null,
      birth_date: birthDate || null,
      death_date: deathDate || null,
    });

    if (errors.length > 0) {
      setError(firstError(errors));
      return;
    }

    setLoading(true);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const { data, error: insertError } = await supabase
      .from("memorials")
      .insert({
        user_id: user.id,
        name: name.trim(),
        slug: generateSlug(name.trim()),
        type,
        description: description.trim() || null,
        birth_date: birthDate || null,
        death_date: deathDate || null,
      })
      .select("id")
      .single();

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    showToast("Gedenkprofil erstellt");
    router.push(`/memorial/${data.id}`);
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <div className="sticky top-0 z-30 flex items-center gap-3 px-4 py-3 bg-surface/80 backdrop-blur-xl border-b border-outline-variant/10">
        <button
          onClick={() => router.back()}
          className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-surface-container-high transition"
        >
          <span className="material-symbols-outlined text-on-surface">arrow_back</span>
        </button>
        <h1 className="font-body text-base font-medium text-on-surface">Neues Gedenkprofil</h1>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="bg-surface-container-low rounded-xl p-6 border border-outline-variant/10">
          <div className="flex items-center gap-3 mb-2">
            <span className="material-symbols-outlined text-primary text-2xl">add_circle</span>
            <h2 className="text-xl font-headline font-semibold text-on-surface">
              Erinnerung bewahren
            </h2>
          </div>
          <p className="text-sm font-body text-on-surface-variant mb-6">
            Erstelle ein neues Profil, um die Erinnerung zu bewahren.
          </p>

          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-error/10 border border-error/20 px-4 py-3 text-sm text-error font-body mb-6">
              <span className="material-symbols-outlined text-lg">error</span>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Type selection */}
            <div>
              <label className="block text-sm font-label font-medium text-on-surface-variant mb-2.5">
                Profil-Typ
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setType("human")}
                  className={`flex flex-col items-center gap-1.5 p-4 rounded-xl border transition ${
                    type === "human"
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-outline-variant/20 text-on-surface-variant hover:border-primary/30"
                  }`}
                >
                  <span className="material-symbols-outlined text-2xl">person</span>
                  <span className="text-sm font-label font-medium">Mensch</span>
                </button>
                <button
                  type="button"
                  onClick={() => setType("animal")}
                  className={`flex flex-col items-center gap-1.5 p-4 rounded-xl border transition ${
                    type === "animal"
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-outline-variant/20 text-on-surface-variant hover:border-primary/30"
                  }`}
                >
                  <span className="material-symbols-outlined text-2xl">pets</span>
                  <span className="text-sm font-label font-medium">Tier</span>
                </button>
              </div>
            </div>

            {/* Name */}
            <div>
              <label className="block text-sm font-label font-medium text-on-surface-variant mb-1.5">
                Name *
              </label>
              <input
                type="text"
                required
                maxLength={200}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={type === "animal" ? "z.B. Luna" : "z.B. Maria Müller"}
                className="w-full bg-[#1C1F33] border-none rounded-xl px-4 py-3.5 text-sm font-body text-on-surface focus:ring-2 focus:ring-primary/50 transition placeholder:text-on-surface-variant/40"
              />
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-label font-medium text-on-surface-variant mb-1.5">
                  Geburtsdatum
                </label>
                <input
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="w-full bg-[#1C1F33] border-none rounded-xl px-4 py-3.5 text-sm font-body text-on-surface focus:ring-2 focus:ring-primary/50 transition"
                />
              </div>
              <div>
                <label className="block text-sm font-label font-medium text-on-surface-variant mb-1.5">
                  Sterbedatum
                </label>
                <input
                  type="date"
                  value={deathDate}
                  onChange={(e) => setDeathDate(e.target.value)}
                  className="w-full bg-[#1C1F33] border-none rounded-xl px-4 py-3.5 text-sm font-body text-on-surface focus:ring-2 focus:ring-primary/50 transition"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-label font-medium text-on-surface-variant mb-1.5">
                Kurze Beschreibung
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                maxLength={500}
                placeholder="Ein paar Worte über die Person oder das Tier..."
                className="w-full bg-[#1C1F33] border-none rounded-xl px-4 py-3.5 text-sm font-body text-on-surface focus:ring-2 focus:ring-primary/50 transition resize-none placeholder:text-on-surface-variant/40"
              />
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="gold-gradient w-full rounded-xl px-6 py-3.5 text-sm font-label font-semibold text-on-primary transition shadow-sm disabled:opacity-50"
              >
                {loading ? "Wird erstellt..." : "Profil erstellen"}
              </button>

              <button
                type="button"
                onClick={() => router.back()}
                className="w-full rounded-xl px-6 py-3 text-sm font-label font-medium text-on-surface-variant hover:text-on-surface transition"
              >
                Abbrechen
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
