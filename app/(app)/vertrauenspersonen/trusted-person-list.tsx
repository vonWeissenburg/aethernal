"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { validateTrustedPerson, firstError } from "@/lib/validation";
import { useToast } from "@/components/toast";
import { useConfirm } from "@/components/confirm-dialog";
import type { TrustedPerson } from "@/lib/types";

export function TrustedPersonList({
  trustedPersons,
}: {
  trustedPersons: TrustedPerson[];
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const { confirm } = useConfirm();
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    const form = new FormData(e.currentTarget);
    const name = (form.get("name") as string).trim();
    const email = (form.get("email") as string).trim();
    const relationship = (form.get("relationship") as string) || null;

    const errors = validateTrustedPerson({ name, email, relationship });
    if (errors.length > 0) {
      setError(firstError(errors));
      return;
    }

    setSaving(true);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const data = { name, email, relationship: relationship?.trim() || null };

    let err;
    if (editingId) {
      ({ error: err } = await supabase
        .from("trusted_persons")
        .update(data)
        .eq("id", editingId));
    } else {
      ({ error: err } = await supabase
        .from("trusted_persons")
        .insert({ ...data, user_id: user.id }));
    }

    if (err) {
      setError("Fehler beim Speichern. Bitte versuche es erneut.");
      setSaving(false);
      return;
    }

    showToast(editingId ? "Vertrauensperson aktualisiert" : "Vertrauensperson hinzugefügt");
    e.currentTarget.reset();
    setEditingId(null);
    setSaving(false);
    router.refresh();
  }

  async function handleDelete(tp: TrustedPerson) {
    const ok = await confirm({
      title: "Vertrauensperson entfernen?",
      message: `Möchtest du „${tp.name}" wirklich als Vertrauensperson entfernen? Diese Aktion kann nicht rückgängig gemacht werden.`,
      confirmLabel: "Entfernen",
    });
    if (!ok) return;
    const supabase = createClient();
    await supabase.from("trusted_persons").delete().eq("id", tp.id);
    showToast("Vertrauensperson entfernt");
    router.refresh();
  }

  const editingPerson = editingId
    ? trustedPersons.find((tp) => tp.id === editingId)
    : null;

  return (
    <div>
      {/* Info box */}
      <div className="rounded-xl border border-lavender-dark bg-lavender/30 p-5 mb-8">
        <div className="flex gap-3">
          <span className="text-xl">🤝</span>
          <div className="text-sm text-aether-gray leading-relaxed">
            <p className="font-medium text-violet mb-1">Wie funktioniert das?</p>
            <p>
              Wenn du &quot;Nach dem Tod&quot;-Nachrichten eingerichtet hast, braucht es
              eine Person deines Vertrauens, die deinen Tod bestätigen kann.
              Erst nach dieser Bestätigung werden die Nachrichten versendet.
            </p>
          </div>
        </div>
      </div>

      {/* List */}
      {trustedPersons.length > 0 && (
        <div className="space-y-4 mb-8">
          {trustedPersons.map((tp) => (
            <div
              key={tp.id}
              className="rounded-xl border border-lavender-dark bg-white p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
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
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setEditingId(tp.id)}
                    className="text-aether-gray hover:text-violet transition p-1"
                    title="Bearbeiten"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDelete(tp)}
                    className="text-aether-gray hover:text-red-600 transition p-1"
                    title="Entfernen"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Form */}
      <div className="rounded-xl border border-lavender-dark bg-white p-6">
        <h3 className="font-serif text-lg font-semibold text-violet mb-4">
          {editingId
            ? "Vertrauensperson bearbeiten"
            : trustedPersons.length > 0
              ? "Weitere Vertrauensperson hinzufügen"
              : "Vertrauensperson festlegen"}
        </h3>

        {error && (
          <p className="text-sm text-red-600 mb-4 p-3 bg-red-50 rounded-lg">{error}</p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-violet mb-1">
              Name *
            </label>
            <input
              name="name"
              required
              maxLength={200}
              defaultValue={editingPerson?.name ?? ""}
              key={editingId ?? "new"}
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
              defaultValue={editingPerson?.email ?? ""}
              key={`email-${editingId ?? "new"}`}
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
              maxLength={200}
              defaultValue={editingPerson?.relationship ?? ""}
              key={`rel-${editingId ?? "new"}`}
              className="w-full rounded-lg border border-lavender-dark px-4 py-2.5 text-sm focus:border-amber focus:ring-1 focus:ring-amber outline-none"
              placeholder="z.B. Ehepartner, Kind, beste Freundin"
            />
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-violet px-6 py-2.5 text-sm font-medium text-white hover:bg-violet-light transition disabled:opacity-50"
            >
              {saving
                ? "Wird gespeichert..."
                : editingId
                  ? "Änderungen speichern"
                  : "Vertrauensperson speichern"}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={() => setEditingId(null)}
                className="rounded-lg border border-lavender-dark px-5 py-2.5 text-sm font-medium text-aether-gray hover:bg-lavender transition"
              >
                Abbrechen
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Notice */}
      <div className="mt-6 rounded-lg bg-amber/5 border border-amber/20 p-4">
        <p className="text-xs text-aether-gray">
          Die Bestätigungs-E-Mail an deine Vertrauensperson wird in Kürze aktiviert.
          Bis dahin wird der Status als &quot;Ausstehend&quot; angezeigt.
        </p>
      </div>
    </div>
  );
}
