"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { TrustedPerson } from "@/lib/types";
import { useState } from "react";

export function TrustedPersonSection({
  trustedPersons,
}: {
  trustedPersons: TrustedPerson[];
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const form = new FormData(e.currentTarget);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { error: err } = await supabase.from("trusted_persons").insert({
      user_id: user.id,
      name: form.get("name") as string,
      email: form.get("email") as string,
      relationship: (form.get("relationship") as string) || null,
    });

    if (err) {
      setError("Fehler beim Speichern. Bitte versuche es erneut.");
      setSaving(false);
      return;
    }

    e.currentTarget.reset();
    setSaving(false);
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!confirm("Vertrauensperson wirklich entfernen?")) return;
    const supabase = createClient();
    await supabase.from("trusted_persons").delete().eq("id", id);
    router.refresh();
  }

  return (
    <div>
      <div className="rounded-xl border border-lavender-dark bg-lavender/30 p-6 mb-8">
        <p className="text-sm text-aether-gray leading-relaxed">
          Deine Vertrauensperson kann bestätigen, dass du verstorben bist. Erst
          dann werden deine &quot;Nach dem Tod&quot;-Nachrichten versendet.
        </p>
      </div>

      {trustedPersons.length > 0 && (
        <div className="space-y-4 mb-8">
          {trustedPersons.map((tp) => (
            <div
              key={tp.id}
              className="rounded-xl border border-lavender-dark bg-white p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-serif text-lg font-semibold text-violet">
                    {tp.name}
                  </h3>
                  <p className="text-sm text-aether-gray mt-0.5">{tp.email}</p>
                  {tp.relationship && (
                    <p className="text-sm text-aether-gray mt-0.5">
                      {tp.relationship}
                    </p>
                  )}
                  <span
                    className={`inline-block mt-2 text-xs px-2 py-0.5 rounded-full font-medium ${
                      tp.confirmed
                        ? "bg-green-100 text-green-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {tp.confirmed ? "Bestätigt" : "Ausstehend"}
                  </span>
                </div>
                <button
                  onClick={() => handleDelete(tp.id)}
                  className="text-aether-gray hover:text-red-600 transition p-1"
                  title="Entfernen"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-xl border border-lavender-dark bg-white p-6">
        <h3 className="font-serif text-lg font-semibold text-violet mb-4">
          {trustedPersons.length > 0
            ? "Weitere Vertrauensperson hinzufügen"
            : "Vertrauensperson festlegen"}
        </h3>

        {error && (
          <p className="text-sm text-red-600 mb-4">{error}</p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-violet mb-1">
              Name *
            </label>
            <input
              name="name"
              required
              className="w-full rounded-lg border border-lavender-dark px-4 py-2.5 text-sm focus:border-amber focus:ring-1 focus:ring-amber outline-none"
              placeholder="Vor- und Nachname"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-violet mb-1">
              E-Mail *
            </label>
            <input
              name="email"
              type="email"
              required
              className="w-full rounded-lg border border-lavender-dark px-4 py-2.5 text-sm focus:border-amber focus:ring-1 focus:ring-amber outline-none"
              placeholder="email@beispiel.at"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-violet mb-1">
              Beziehung / Verhältnis
            </label>
            <input
              name="relationship"
              className="w-full rounded-lg border border-lavender-dark px-4 py-2.5 text-sm focus:border-amber focus:ring-1 focus:ring-amber outline-none"
              placeholder="z.B. Ehepartner, Kind, beste Freundin"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-violet px-6 py-2.5 text-sm font-medium text-white hover:bg-violet-light transition disabled:opacity-50"
          >
            {saving ? "Wird gespeichert..." : "Vertrauensperson speichern"}
          </button>
        </form>
      </div>
    </div>
  );
}
