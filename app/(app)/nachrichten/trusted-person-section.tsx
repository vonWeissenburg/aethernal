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
      {/* Info banner */}
      <div className="flex items-start gap-3 rounded-2xl bg-surface border border-outline-variant p-5 mb-8">
        <span className="material-symbols-outlined text-primary text-[22px] mt-0.5">info</span>
        <p className="font-body text-sm text-on-surface-variant leading-relaxed">
          Deine Vertrauensperson kann bestätigen, dass du verstorben bist. Erst
          dann werden deine &quot;Nach dem Tod&quot;-Nachrichten versendet.
        </p>
      </div>

      {/* Existing trusted persons */}
      {trustedPersons.length > 0 && (
        <div className="space-y-3 mb-8">
          {trustedPersons.map((tp) => (
            <div
              key={tp.id}
              className="rounded-2xl bg-card p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <span className="material-symbols-outlined text-primary text-[22px]">person</span>
                  </div>
                  <div>
                    <h3 className="font-headline text-base font-semibold text-on-surface">
                      {tp.name}
                    </h3>
                    <p className="font-body text-sm text-on-surface-variant mt-0.5">{tp.email}</p>
                    {tp.relationship && (
                      <p className="font-body text-sm text-outline mt-0.5">
                        {tp.relationship}
                      </p>
                    )}
                    <span
                      className={`inline-flex items-center gap-1 mt-2 font-label text-xs px-2.5 py-0.5 rounded-full font-medium ${
                        tp.confirmed
                          ? "bg-success/10 text-success"
                          : "bg-primary/10 text-primary"
                      }`}
                    >
                      <span className="material-symbols-outlined text-[14px]">
                        {tp.confirmed ? "check_circle" : "schedule"}
                      </span>
                      {tp.confirmed ? "Bestätigt" : "Ausstehend"}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(tp)}
                  className="rounded-full p-2 text-on-surface-variant hover:text-error hover:bg-error/10 transition"
                  title="Entfernen"
                >
                  <span className="material-symbols-outlined text-[20px]">delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add form */}
      <div className="rounded-2xl bg-card p-6">
        <div className="flex items-center gap-2 mb-5">
          <span className="material-symbols-outlined text-primary text-[22px]">person_add</span>
          <h3 className="font-headline text-lg font-semibold text-on-surface">
            {trustedPersons.length > 0
              ? "Weitere Vertrauensperson hinzufügen"
              : "Vertrauensperson festlegen"}
          </h3>
        </div>

        {error && (
          <div className="flex items-start gap-3 rounded-xl bg-error/10 border border-error/30 p-4 mb-5">
            <span className="material-symbols-outlined text-error text-[20px] mt-0.5">error</span>
            <p className="font-body text-sm text-error">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-label text-sm font-medium text-on-surface-variant mb-1.5">
              Name *
            </label>
            <input
              name="name"
              required
              maxLength={200}
              className="w-full rounded-xl bg-surface-container-low border border-outline-variant px-4 py-3 font-body text-sm text-on-surface placeholder:text-outline focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              placeholder="Vor- und Nachname"
            />
          </div>
          <div>
            <label className="block font-label text-sm font-medium text-on-surface-variant mb-1.5">
              E-Mail *
            </label>
            <input
              name="email"
              type="email"
              required
              className="w-full rounded-xl bg-surface-container-low border border-outline-variant px-4 py-3 font-body text-sm text-on-surface placeholder:text-outline focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              placeholder="email@beispiel.at"
            />
          </div>
          <div>
            <label className="block font-label text-sm font-medium text-on-surface-variant mb-1.5">
              Beziehung / Verhältnis
            </label>
            <input
              name="relationship"
              maxLength={200}
              className="w-full rounded-xl bg-surface-container-low border border-outline-variant px-4 py-3 font-body text-sm text-on-surface placeholder:text-outline focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              placeholder="z.B. Ehepartner, Kind, beste Freundin"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-primary px-6 py-3 font-label text-sm font-semibold text-on-primary hover:brightness-110 transition shadow-md disabled:opacity-50"
          >
            <span className="inline-flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[18px]">person_add</span>
              {saving ? "Wird gespeichert..." : "Vertrauensperson speichern"}
            </span>
          </button>
        </form>
      </div>
    </div>
  );
}
