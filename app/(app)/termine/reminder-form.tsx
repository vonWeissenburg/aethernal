"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { validateReminder, firstError } from "@/lib/validation";
import { useToast } from "@/components/toast";
import type { Reminder, ReminderType } from "@/lib/types";
import { REMINDER_TYPE_LABELS, REMINDER_TYPE_ICONS } from "@/lib/types";

interface ReminderFormProps {
  memorials: { id: string; name: string }[];
  existingReminder?: Reminder;
}

const REMINDER_TYPES: ReminderType[] = [
  "birthday",
  "deathday",
  "anniversary",
  "custom",
];

export function ReminderForm({
  memorials,
  existingReminder,
}: ReminderFormProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [reminderType, setReminderType] = useState<ReminderType>(
    existingReminder?.reminder_type ?? "custom"
  );

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    const form = new FormData(e.currentTarget);
    const title = (form.get("title") as string).trim();
    const description = (form.get("description") as string) || null;
    const reminderDate = form.get("reminder_date") as string;

    const errors = validateReminder({
      title,
      description,
      reminder_date: reminderDate,
      reminder_type: reminderType,
    });

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

    const data = {
      user_id: user.id,
      title,
      description: description?.trim() || null,
      reminder_date: reminderDate,
      reminder_type: reminderType,
      memorial_id: (form.get("memorial_id") as string) || null,
      repeat_yearly: form.get("repeat_yearly") === "on",
    };

    let err;
    if (existingReminder) {
      ({ error: err } = await supabase
        .from("reminders")
        .update(data)
        .eq("id", existingReminder.id));
    } else {
      ({ error: err } = await supabase.from("reminders").insert(data));
    }

    if (err) {
      setError("Fehler beim Speichern. Bitte versuche es erneut.");
      setSaving(false);
      return;
    }

    showToast("Termin gespeichert");
    router.push("/termine");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <p className="text-sm text-error-light mb-6 p-3 bg-error/10 border border-error/30 rounded-lg">
          {error}
        </p>
      )}

      {/* Typ */}
      <div className="rounded-xl bg-surface-container-high border-none p-6 mb-6">
        <h2 className="font-serif text-xl font-semibold text-gold-light mb-4">
          Art des Termins
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {REMINDER_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setReminderType(type)}
              className={`rounded-xl border-2 p-4 text-center transition ${
                reminderType === type
                  ? "border-gold bg-gold/5"
                  : "border-border-card bg-bg-card hover:border-gold/30"
              }`}
            >
              <div className="text-2xl mb-1">
                {REMINDER_TYPE_ICONS[type]}
              </div>
              <p className="text-xs font-medium text-gold-light">
                {REMINDER_TYPE_LABELS[type]}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Details */}
      <div className="rounded-xl bg-surface-container-high border-none p-6 mb-6">
        <h2 className="font-serif text-xl font-semibold text-gold-light mb-4">
          Details
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gold-light mb-1">
              Titel *
            </label>
            <input
              name="title"
              required
              maxLength={200}
              defaultValue={existingReminder?.title ?? ""}
              className="w-full rounded-lg bg-surface-container border-none px-4 py-3 text-sm text-text-primary focus:ring-1 focus:ring-gold-light/50 transition-all"
              placeholder={
                reminderType === "birthday"
                  ? "z.B. Omas Geburtstag"
                  : reminderType === "deathday"
                    ? "z.B. Todestag von Papa"
                    : reminderType === "anniversary"
                      ? "z.B. Hochzeitstag"
                      : "z.B. Besuch am Friedhof"
              }
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gold-light mb-1">
              Beschreibung
            </label>
            <textarea
              name="description"
              rows={3}
              maxLength={2000}
              defaultValue={existingReminder?.description ?? ""}
              className="w-full rounded-lg bg-surface-container border-none px-4 py-3 text-sm text-text-primary focus:ring-1 focus:ring-gold-light/50 transition-all resize-y"
              placeholder="Optionale Notizen..."
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gold-light mb-1">
                Datum *
              </label>
              <input
                name="reminder_date"
                type="date"
                required
                defaultValue={existingReminder?.reminder_date ?? ""}
                className="w-full rounded-lg bg-surface-container border-none px-4 py-3 text-sm text-text-primary focus:ring-1 focus:ring-gold-light/50 transition-all"
              />
            </div>
            {memorials.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gold-light mb-1">
                  Gedenkprofil zuordnen
                </label>
                <select
                  name="memorial_id"
                  defaultValue={existingReminder?.memorial_id ?? ""}
                  className="w-full rounded-lg bg-surface-container border-none px-4 py-3 text-sm text-text-primary focus:ring-1 focus:ring-gold-light/50 transition-all"
                >
                  <option value="">Kein Profil</option>
                  {memorials.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              name="repeat_yearly"
              type="checkbox"
              defaultChecked={existingReminder?.repeat_yearly ?? true}
              className="rounded border-border-card text-gold-light focus:ring-gold-light"
            />
            <span className="text-sm text-gold-light">Jährlich wiederholen</span>
          </label>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex flex-wrap gap-3 justify-end">
        <Link
          href="/termine"
          className="rounded-lg border border-border-card px-5 py-2.5 text-sm font-medium text-text-secondary hover:bg-surface-container-high transition"
        >
          Abbrechen
        </Link>
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-gold px-6 py-2.5 text-sm font-medium text-bg-primary hover:brightness-110 transition shadow-sm disabled:opacity-50"
        >
          {saving
            ? "Wird gespeichert..."
            : existingReminder
              ? "Änderungen speichern"
              : "Termin speichern"}
        </button>
      </div>
    </form>
  );
}
