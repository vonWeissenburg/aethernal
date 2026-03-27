"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { generateSlug } from "@/lib/utils";

export default function NewMemorialPage() {
  const [type, setType] = useState<"human" | "animal">("human");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [deathDate, setDeathDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
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

    router.push(`/memorial/${data.id}`);
    router.refresh();
  }

  return (
    <div className="max-w-2xl mx-auto px-4 lg:px-8 py-8 lg:py-12">
      <h1 className="text-3xl font-serif font-semibold text-violet mb-2">
        Neues Gedenkprofil
      </h1>
      <p className="text-aether-gray mb-8">
        Erstelle ein neues Profil, um die Erinnerung zu bewahren.
      </p>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Type selection */}
        <div>
          <label className="block text-sm font-medium text-aether-text mb-3">
            Profil-Typ
          </label>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setType("human")}
              className={`p-4 rounded-xl border-2 text-center transition ${
                type === "human"
                  ? "border-violet bg-lavender/50"
                  : "border-lavender-dark hover:border-violet/30"
              }`}
            >
              <span className="text-2xl block mb-1">🕊️</span>
              <span className="text-sm font-medium text-violet">Mensch</span>
            </button>
            <button
              type="button"
              onClick={() => setType("animal")}
              className={`p-4 rounded-xl border-2 text-center transition ${
                type === "animal"
                  ? "border-violet bg-lavender/50"
                  : "border-lavender-dark hover:border-violet/30"
              }`}
            >
              <span className="text-2xl block mb-1">🐾</span>
              <span className="text-sm font-medium text-violet">Tier</span>
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-aether-text mb-1.5">
            Name
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={type === "animal" ? "z.B. Luna" : "z.B. Maria Müller"}
            className="w-full rounded-lg border border-lavender-dark bg-white px-4 py-2.5 text-sm text-aether-text placeholder:text-aether-gray/50 focus:border-violet focus:ring-2 focus:ring-violet/20 outline-none transition"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-aether-text mb-1.5">
              Geburtsdatum
            </label>
            <input
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              className="w-full rounded-lg border border-lavender-dark bg-white px-4 py-2.5 text-sm text-aether-text focus:border-violet focus:ring-2 focus:ring-violet/20 outline-none transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-aether-text mb-1.5">
              Sterbedatum
            </label>
            <input
              type="date"
              value={deathDate}
              onChange={(e) => setDeathDate(e.target.value)}
              className="w-full rounded-lg border border-lavender-dark bg-white px-4 py-2.5 text-sm text-aether-text focus:border-violet focus:ring-2 focus:ring-violet/20 outline-none transition"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-aether-text mb-1.5">
            Kurze Beschreibung
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Ein paar Worte über die Person oder das Tier..."
            className="w-full rounded-lg border border-lavender-dark bg-white px-4 py-2.5 text-sm text-aether-text placeholder:text-aether-gray/50 focus:border-violet focus:ring-2 focus:ring-violet/20 outline-none transition resize-none"
          />
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-5 py-2.5 text-sm text-aether-gray hover:text-violet transition"
          >
            Abbrechen
          </button>
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-violet px-6 py-2.5 text-sm font-medium text-white hover:bg-violet-light transition shadow-sm disabled:opacity-50"
          >
            {loading ? "Wird erstellt..." : "Profil erstellen"}
          </button>
        </div>
      </form>
    </div>
  );
}
