"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { validateTrustedPerson, firstError } from "@/lib/validation";
import { useToast } from "@/components/toast";
import { useConfirm } from "@/components/confirm-dialog";
import type { TrustedPerson } from "@/lib/types";

// Die EINE Vertrauenspersonen-UI (A5) — genutzt auf /vertrauenspersonen und
// im Tab auf /nachrichten. Einladungs-/Bestätigungs-Logik folgt mit B2.
export function TrustedPersons({
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

  // Einladungs-Mail mit Bestätigungs-Link (B2)
  async function sendInvite(id: string, email: string) {
    const res = await fetch("/api/trusted-persons/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      showToast(`Einladung an ${email} gesendet`);
      router.refresh();
      return;
    }
    const body = await res.json().catch(() => null);
    showToast(body?.error ?? "Einladung konnte nicht gesendet werden.", "error");
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    const formEl = e.currentTarget;
    const form = new FormData(formEl);
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

    let newId: string | null = null;
    let emailChanged = false;
    let err;
    if (editingId) {
      emailChanged = editingPerson?.email !== email;
      ({ error: err } = await supabase
        .from("trusted_persons")
        .update(data)
        .eq("id", editingId));
    } else {
      const { data: inserted, error: insertError } = await supabase
        .from("trusted_persons")
        .insert({ ...data, user_id: user.id })
        .select("id")
        .single();
      err = insertError;
      newId = inserted?.id ?? null;
    }

    if (err) {
      setError("Fehler beim Speichern. Bitte versuche es erneut.");
      setSaving(false);
      return;
    }

    showToast(editingId ? "Vertrauensperson aktualisiert" : "Vertrauensperson hinzugefügt");

    // Einladung: automatisch nach dem Anlegen; nach E-Mail-Änderung erneut
    // (die DB setzt die Bestätigung bei E-Mail-Wechsel zurück).
    if (newId) {
      await sendInvite(newId, email);
    } else if (editingId && emailChanged) {
      await sendInvite(editingId, email);
    }

    formEl.reset();
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

  const inputClass =
    "w-full rounded-button bg-surface-container border-none px-4 py-3.5 font-body text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:ring-2 focus:ring-primary/50 transition-all duration-250 ease-out";

  return (
    <div>
      {/* Info card */}
      <div className="rounded-card bg-card border border-outline-variant/30 p-5 mb-8">
        <div className="flex gap-4 items-start">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <span className="material-symbols-outlined text-primary text-xl" aria-hidden="true">
              handshake
            </span>
          </div>
          <div className="font-body text-sm text-on-surface-variant leading-relaxed">
            <p className="font-label font-semibold text-primary mb-1">Wie funktioniert das?</p>
            <p>
              Wenn du „Nach dem Tod"-Nachrichten eingerichtet hast, braucht es
              eine Person deines Vertrauens, die deinen Tod bestätigen kann.
              Erst nach dieser Bestätigung werden die Nachrichten versendet.
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
              className="rounded-card bg-card p-5 border border-outline-variant/30 transition-colors duration-250 ease-out hover:bg-card-hover"
            >
              <div className="flex items-center gap-4">
                {/* Avatar (Monogramm) */}
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 border border-primary/20 font-headline text-lg text-primary">
                  {tp.name.charAt(0).toUpperCase()}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h2 className="font-headline text-base font-semibold text-on-surface truncate">
                    {tp.name}
                  </h2>
                  {tp.relationship && (
                    <p className="font-body text-xs text-on-surface-variant mt-0.5">
                      {tp.relationship}
                    </p>
                  )}
                  <p className="font-body text-xs text-on-surface-variant/70 mt-0.5 truncate">{tp.email}</p>
                </div>

                {/* Status badge */}
                <span
                  className={`shrink-0 inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-label text-xs font-medium ${
                    tp.confirmed
                      ? "bg-success/10 text-success"
                      : "bg-surface-container-high text-on-surface-variant"
                  }`}
                >
                  <span className="material-symbols-outlined text-sm" aria-hidden="true">
                    {tp.confirmed ? "verified" : "schedule"}
                  </span>
                  {tp.confirmed ? "Bestätigt" : "Ausstehend"}
                </span>

                {/* More menu */}
                <div className="relative shrink-0">
                  <button
                    onClick={() =>
                      setOpenMenuId(openMenuId === tp.id ? null : tp.id)
                    }
                    className="flex h-9 w-9 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-high transition-colors duration-250 ease-out"
                    aria-label={`Optionen für ${tp.name}`}
                    aria-expanded={openMenuId === tp.id}
                  >
                    <span className="material-symbols-outlined text-xl" aria-hidden="true">more_vert</span>
                  </button>
                  {openMenuId === tp.id && (
                    <div className="absolute right-0 top-10 z-20 min-w-[200px] rounded-card bg-surface-container-high border border-outline-variant/30 shadow-xl py-1 animate-fade-in">
                      {!tp.confirmed && (
                        <button
                          onClick={() => {
                            sendInvite(tp.id, tp.email);
                            setOpenMenuId(null);
                          }}
                          className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-body text-on-surface hover:bg-surface-container-low transition-colors duration-250 ease-out"
                        >
                          <span className="material-symbols-outlined text-lg text-on-surface-variant" aria-hidden="true">forward_to_inbox</span>
                          Einladung senden
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setEditingId(tp.id);
                          setOpenMenuId(null);
                        }}
                        className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-body text-on-surface hover:bg-surface-container-low transition-colors duration-250 ease-out"
                      >
                        <span className="material-symbols-outlined text-lg text-on-surface-variant" aria-hidden="true">edit</span>
                        Bearbeiten
                      </button>
                      <button
                        onClick={() => {
                          handleDelete(tp);
                          setOpenMenuId(null);
                        }}
                        className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-body text-error hover:bg-surface-container-low transition-colors duration-250 ease-out"
                      >
                        <span className="material-symbols-outlined text-lg" aria-hidden="true">delete</span>
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
      <div className="rounded-card bg-card border border-outline-variant/30 p-6">
        <h2 className="font-headline text-lg font-semibold text-on-surface mb-5">
          {editingId
            ? "Vertrauensperson bearbeiten"
            : trustedPersons.length > 0
              ? "Weitere Vertrauensperson hinzufügen"
              : "Vertrauensperson festlegen"}
        </h2>

        {error && (
          <div className="flex items-center gap-2 rounded-button bg-error/10 border border-error/20 p-3 mb-5">
            <span className="material-symbols-outlined text-error text-lg" aria-hidden="true">error</span>
            <p className="font-body text-sm text-error">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="tp-name" className="block font-label text-xs uppercase tracking-widest text-on-surface-variant mb-1.5">
              Name *
            </label>
            <input
              id="tp-name"
              name="name"
              required
              maxLength={200}
              defaultValue={editingPerson?.name ?? ""}
              key={editingId ?? "new"}
              className={inputClass}
              placeholder="Vor- und Nachname"
            />
          </div>
          <div>
            <label htmlFor="tp-email" className="block font-label text-xs uppercase tracking-widest text-on-surface-variant mb-1.5">
              E-Mail *
            </label>
            <input
              id="tp-email"
              name="email"
              type="email"
              required
              defaultValue={editingPerson?.email ?? ""}
              key={`email-${editingId ?? "new"}`}
              className={inputClass}
              placeholder="email@beispiel.at"
            />
          </div>
          <div>
            <label htmlFor="tp-relationship" className="block font-label text-xs uppercase tracking-widest text-on-surface-variant mb-1.5">
              Beziehung / Verhältnis
            </label>
            <input
              id="tp-relationship"
              name="relationship"
              maxLength={200}
              defaultValue={editingPerson?.relationship ?? ""}
              key={`rel-${editingId ?? "new"}`}
              className={inputClass}
              placeholder="z.B. Ehepartner, Kind, beste Freundin"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-button bg-primary px-6 py-3 font-label text-sm font-semibold text-on-primary shadow-lg shadow-primary/10 hover:brightness-110 active:scale-[0.98] transition-all duration-250 ease-out disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-lg" aria-hidden="true">
                {editingId ? "save" : "person_add"}
              </span>
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
                className="rounded-button border border-outline-variant/40 px-5 py-3 font-label text-sm font-medium text-on-surface-variant hover:bg-surface-container-high transition-colors duration-250 ease-out"
              >
                Abbrechen
              </button>
            )}
          </div>
        </form>
      </div>

    </div>
  );
}
