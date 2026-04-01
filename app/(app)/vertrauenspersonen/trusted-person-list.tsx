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
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

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

    showToast(editingId ? "Vertrauensperson aktualisiert" : "Vertrauensperson hinzugef\u00FCgt");
    e.currentTarget.reset();
    setEditingId(null);
    setSaving(false);
    router.refresh();
  }

  async function handleDelete(tp: TrustedPerson) {
    const ok = await confirm({
      title: "Vertrauensperson entfernen?",
      message: `M\u00F6chtest du \u201E${tp.name}\u201C wirklich als Vertrauensperson entfernen? Diese Aktion kann nicht r\u00FCckg\u00E4ngig gemacht werden.`,
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
      {/* Info card */}
      <div className="rounded-2xl bg-card border border-outline-variant/30 p-5 mb-8">
        <div className="flex gap-4 items-start">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <span className="material-symbols-outlined text-primary text-xl">
              handshake
            </span>
          </div>
          <div className="font-body text-sm text-on-surface-variant leading-relaxed">
            <p className="font-label font-semibold text-primary mb-1">Wie funktioniert das?</p>
            <p>
              Wenn du &quot;Nach dem Tod&quot;-Nachrichten eingerichtet hast, braucht es
              eine Person deines Vertrauens, die deinen Tod best&auml;tigen kann.
              Erst nach dieser Best&auml;tigung werden die Nachrichten versendet.
            </p>
          </div>
        </div>
      </div>

      {/* Person cards */}
      {trustedPersons.length > 0 && (
        <div className="space-y-3 mb-8">
          {trustedPersons.map((tp) => (
            <div
              key={tp.id}
              className="rounded-2xl bg-card p-5 transition hover:bg-surface-container-high"
            >
              <div className="flex items-center gap-4">
                {/* Avatar */}
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-surface-container-high text-on-surface-variant">
                  <span className="material-symbols-outlined text-2xl">person</span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-headline text-base font-semibold text-on-surface truncate">
                    {tp.name}
                  </h3>
                  {tp.relationship && (
                    <p className="font-body text-xs text-on-surface-variant mt-0.5">
                      {tp.relationship}
                    </p>
                  )}
                  <p className="font-body text-xs text-outline mt-0.5">{tp.email}</p>
                </div>

                {/* Status badge */}
                <span
                  className={`shrink-0 inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-label text-xs font-medium ${
                    tp.confirmed
                      ? "bg-success/10 text-success"
                      : "bg-primary/10 text-primary"
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">
                    {tp.confirmed ? "check_circle" : "schedule"}
                  </span>
                  {tp.confirmed ? "Best\u00E4tigt" : "Ausstehend"}
                </span>

                {/* More menu */}
                <div className="relative shrink-0">
                  <button
                    onClick={() =>
                      setOpenMenuId(openMenuId === tp.id ? null : tp.id)
                    }
                    className="flex h-9 w-9 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-high transition"
                    title="Optionen"
                  >
                    <span className="material-symbols-outlined text-xl">more_vert</span>
                  </button>
                  {openMenuId === tp.id && (
                    <div className="absolute right-0 top-10 z-20 min-w-[160px] rounded-xl bg-surface-container-high border border-outline-variant/20 shadow-xl py-1 animate-fade-in">
                      <button
                        onClick={() => {
                          setEditingId(tp.id);
                          setOpenMenuId(null);
                        }}
                        className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-body text-on-surface hover:bg-surface-container-low transition"
                      >
                        <span className="material-symbols-outlined text-lg text-on-surface-variant">edit</span>
                        Bearbeiten
                      </button>
                      <button
                        onClick={() => {
                          handleDelete(tp);
                          setOpenMenuId(null);
                        }}
                        className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-body text-error hover:bg-surface-container-low transition"
                      >
                        <span className="material-symbols-outlined text-lg">delete</span>
                        Entfernen
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit form */}
      <div className="rounded-2xl bg-card p-6">
        <h3 className="font-headline text-lg font-semibold text-on-surface mb-5">
          {editingId
            ? "Vertrauensperson bearbeiten"
            : trustedPersons.length > 0
              ? "Weitere Vertrauensperson hinzuf\u00FCgen"
              : "Vertrauensperson festlegen"}
        </h3>

        {error && (
          <div className="flex items-center gap-2 rounded-xl bg-error/10 border border-error/20 p-3 mb-5">
            <span className="material-symbols-outlined text-error text-lg">error</span>
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
              defaultValue={editingPerson?.name ?? ""}
              key={editingId ?? "new"}
              className="w-full rounded-xl bg-surface-container-low border border-outline-variant/30 px-4 py-3 font-body text-sm text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
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
              defaultValue={editingPerson?.email ?? ""}
              key={`email-${editingId ?? "new"}`}
              className="w-full rounded-xl bg-surface-container-low border border-outline-variant/30 px-4 py-3 font-body text-sm text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
              placeholder="email@beispiel.at"
            />
          </div>
          <div>
            <label className="block font-label text-sm font-medium text-on-surface-variant mb-1.5">
              Beziehung / Verh&auml;ltnis
            </label>
            <input
              name="relationship"
              maxLength={200}
              defaultValue={editingPerson?.relationship ?? ""}
              key={`rel-${editingId ?? "new"}`}
              className="w-full rounded-xl bg-surface-container-low border border-outline-variant/30 px-4 py-3 font-body text-sm text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
              placeholder="z.B. Ehepartner, Kind, beste Freundin"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 font-label text-sm font-semibold text-on-primary hover:brightness-110 transition disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-lg">
                {editingId ? "save" : "person_add"}
              </span>
              {saving
                ? "Wird gespeichert..."
                : editingId
                  ? "\u00C4nderungen speichern"
                  : "Vertrauensperson speichern"}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={() => setEditingId(null)}
                className="rounded-xl border border-outline-variant/30 px-5 py-3 font-label text-sm font-medium text-on-surface-variant hover:bg-surface-container-high transition"
              >
                Abbrechen
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Notice */}
      <div className="mt-6 rounded-xl bg-primary/5 border border-primary/15 p-4 flex items-start gap-3">
        <span className="material-symbols-outlined text-primary text-lg mt-0.5">info</span>
        <p className="font-body text-xs text-on-surface-variant">
          Die Best&auml;tigungs-E-Mail an deine Vertrauensperson wird in K&uuml;rze aktiviert.
          Bis dahin wird der Status als &quot;Ausstehend&quot; angezeigt.
        </p>
      </div>
    </div>
  );
}
