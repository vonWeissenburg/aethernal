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
    <div className="max-w-2xl mx-auto px-4 lg:px-8 py-8 lg:py-12">
      <h1 className="text-3xl font-serif font-semibold text-gold-light mb-2">
        Neues Gedenkprofil
      </h1>
      <p className="text-text-secondary mb-8">
        Erstelle ein neues Profil, um die Erinnerung zu bewahren.
      </p>

      {error && (
        <div className="rounded-lg bg-error/10 border border-error/30 px-4 py-3 text-sm text-error-light mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Type selection */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-3">
            Profil-Typ
          </label>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setType("human")}
              className={`p-4 rounded-xl border-2 text-center transition ${
                type === "human"
                  ? "border-gold bg-gold/10"
                  : "border-border-card hover:border-gold/30"
              }`}
            >
              <span className="text-2xl block mb-1">🕊️</span>
              <span className="text-sm font-medium text-gold-light">Mensch</span>
            </button>
            <button
              type="button"
              onClick={() => setType("animal")}
              className={`p-4 rounded-xl border-2 text-center transition ${
                type === "animal"
                  ? "border-gold bg-gold/10"
                  : "border-border-card hover:border-gold/30"
              }`}
            >
              <span className="text-2xl block mb-1">🐾</span>
              <span className="text-sm font-medium text-gold-light">Tier</span>
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-1.5">
            Name *
          </label>
          <input
            type="text"
            required
            maxLength={200}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={type === "animal" ? "z.B. Luna" : "z.B. Maria Müller"}
            className="w-full rounded-lg bg-surface-container-high border-none px-4 py-3 text-sm text-text-primary placeholder:text-text-muted/50 focus:ring-1 focus:ring-gold-light/50 transition"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">
              Geburtsdatum
            </label>
            <input
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              className="w-full rounded-lg bg-surface-container-high border-none px-4 py-3 text-sm text-text-primary focus:ring-1 focus:ring-gold-light/50 transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">
              Sterbedatum
            </label>
            <input
              type="date"
              value={deathDate}
              onChange={(e) => setDeathDate(e.target.value)}
              className="w-full rounded-lg bg-surface-container-high border-none px-4 py-3 text-sm text-text-primary focus:ring-1 focus:ring-gold-light/50 transition"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-1.5">
            Kurze Beschreibung
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            maxLength={500}
            placeholder="Ein paar Worte über die Person oder das Tier..."
            className="w-full rounded-lg bg-surface-container-high border-none px-4 py-3 text-sm text-text-primary placeholder:text-text-muted/50 focus:ring-1 focus:ring-gold-light/50 transition resize-none"
          />
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-5 py-2.5 text-sm text-text-secondary hover:text-gold-light transition"
          >
            Abbrechen
          </button>
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-gold px-6 py-3 text-sm font-semibold text-bg-primary hover:brightness-110 transition shadow-sm disabled:opacity-50"
          >
            {loading ? "Wird erstellt..." : "Profil erstellen"}
          </button>
        </div>
      </form>
    </div>
  );
}
