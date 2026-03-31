"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { validateTrustedPerson, firstError } from "@/lib/validation";
import { useToast } from "@/components/toast";
import { useConfirm } from "@/components/confirm-dialog";
import type { TrustedPerson } from "@/lib/types";
import { useState } from "react";

export function TrustedPersonSection({
  trustedPersons,
}: {
  trustedPersons: TrustedPerson[];
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const { confirm } = useConfirm();
  const [saving, setSaving] = useState(false);
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

    const { error: err } = await supabase.from("trusted_persons").insert({
      user_id: user.id,
      name,
      email,
      relationship: relationship?.trim() || null,
    });

    if (err) {
      setError("Fehler beim Speichern. Bitte versuche es erneut.");
      setSaving(false);
      return;
    }

    showToast("Vertrauensperson hinzugefügt");
    e.currentTarget.reset();
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

  return (
    <div>
      <div className="rounded-xl border border-border-card bg-surface-container-high/30 p-6 mb-8">
        <p className="text-sm text-text-secondary leading-relaxed">
          Deine Vertrauensperson kann bestätigen, dass du verstorben bist. Erst
          dann werden deine &quot;Nach dem Tod&quot;-Nachrichten versendet.
        </p>
      </div>

      {trustedPersons.length > 0 && (
        <div className="space-y-4 mb-8">
          {trustedPersons.map((tp) => (
            <div
              key={tp.id}
              className="rounded-xl bg-surface-container-high border-none p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-serif text-lg font-semibold text-gold-light">
                    {tp.name}
                  </h3>
                  <p className="text-sm text-text-secondary mt-0.5">{tp.email}</p>
                  {tp.relationship && (
                    <p className="text-sm text-text-secondary mt-0.5">
                      {tp.relationship}
                    </p>
                  )}
                  <span
                    className={`inline-block mt-2 text-xs px-2 py-0.5 rounded-full font-medium ${
                      tp.confirmed
                        ? "bg-success/10 text-success"
                        : "bg-gold-100 text-gold-light-700"
                    }`}
                  >
                    {tp.confirmed ? "Bestätigt" : "Ausstehend"}
                  </span>
                </div>
                <button
                  onClick={() => handleDelete(tp)}
                  className="text-text-secondary hover:text-error transition p-1"
                  title="Entfernen"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-xl bg-surface-container-high border-none p-6">
        <h3 className="font-serif text-lg font-semibold text-gold-light mb-4">
          {trustedPersons.length > 0
            ? "Weitere Vertrauensperson hinzufügen"
            : "Vertrauensperson festlegen"}
        </h3>

        {error && (
          <p className="text-sm text-error-light mb-4 p-3 bg-error/10 border border-error/30 rounded-lg">{error}</p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gold-light mb-1">
              Name *
            </label>
            <input
              name="name"
              required
              maxLength={200}
              className="w-full rounded-lg bg-surface-container border-none px-4 py-3 text-sm text-text-primary focus:ring-1 focus:ring-gold-light/50 transition-all"
              placeholder="Vor- und Nachname"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gold-light mb-1">
              E-Mail *
            </label>
            <input
              name="email"
              type="email"
              required
              className="w-full rounded-lg bg-surface-container border-none px-4 py-3 text-sm text-text-primary focus:ring-1 focus:ring-gold-light/50 transition-all"
              placeholder="email@beispiel.at"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gold-light mb-1">
              Beziehung / Verhältnis
            </label>
            <input
              name="relationship"
              maxLength={200}
              className="w-full rounded-lg bg-surface-container border-none px-4 py-3 text-sm text-text-primary focus:ring-1 focus:ring-gold-light/50 transition-all"
              placeholder="z.B. Ehepartner, Kind, beste Freundin"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-gold px-6 py-3 text-sm font-semibold text-bg-primary hover:brightness-110 transition disabled:opacity-50"
          >
            {saving ? "Wird gespeichert..." : "Vertrauensperson speichern"}
          </button>
        </form>
      </div>
    </div>
  );
}
