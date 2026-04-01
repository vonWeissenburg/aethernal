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

const TYPE_ICONS: Record<ReminderType, string> = {
  birthday: "cake",
  deathday: "water_drop",
  anniversary: "favorite",
  custom: "event",
};

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
        <div className="flex items-center gap-2 rounded-xl bg-error/10 border border-error/20 p-3 mb-6">
          <span className="material-symbols-outlined text-error text-lg">error</span>
          <p className="font-body text-sm text-error">{error}</p>
        </div>
      )}

      {/* Type selection */}
      <div className="rounded-2xl bg-card p-6 mb-6">
        <h2 className="font-headline text-xl font-semibold text-on-surface mb-4">
          Art des Termins
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {REMINDER_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setReminderType(type)}
              className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition ${
                reminderType === type
                  ? "border-primary bg-primary/5"
                  : "border-outline-variant/30 bg-surface-container-low hover:border-primary/30"
              }`}
            >
              <span
                className={`material-symbols-outlined text-2xl ${
                  reminderType === type ? "text-primary" : "text-on-surface-variant"
                }`}
              >
                {TYPE_ICONS[type]}
              </span>
              <p className="font-label text-xs font-medium text-on-surface">
                {REMINDER_TYPE_LABELS[type]}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Details */}
      <div className="rounded-2xl bg-card p-6 mb-6">
        <h2 className="font-headline text-xl font-semibold text-on-surface mb-4">
          Details
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block font-label text-sm font-medium text-on-surface-variant mb-1.5">
              Titel *
            </label>
            <input
              name="title"
              required
              maxLength={200}
              defaultValue={existingReminder?.title ?? ""}
              className="w-full rounded-xl bg-surface-container-low border border-outline-variant/30 px-4 py-3 font-body text-sm text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
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
            <label className="block font-label text-sm font-medium text-on-surface-variant mb-1.5">
              Beschreibung
            </label>
            <textarea
              name="description"
              rows={3}
              maxLength={2000}
              defaultValue={existingReminder?.description ?? ""}
              className="w-full rounded-xl bg-surface-container-low border border-outline-variant/30 px-4 py-3 font-body text-sm text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all resize-y"
              placeholder="Optionale Notizen..."
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block font-label text-sm font-medium text-on-surface-variant mb-1.5">
                Datum *
              </label>
              <input
                name="reminder_date"
                type="date"
                required
                defaultValue={existingReminder?.reminder_date ?? ""}
                className="w-full rounded-xl bg-surface-container-low border border-outline-variant/30 px-4 py-3 font-body text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
              />
            </div>
            {memorials.length > 0 && (
              <div>
                <label className="block font-label text-sm font-medium text-on-surface-variant mb-1.5">
                  Gedenkprofil zuordnen
                </label>
                <select
                  name="memorial_id"
                  defaultValue={existingReminder?.memorial_id ?? ""}
                  className="w-full rounded-xl bg-surface-container-low border border-outline-variant/30 px-4 py-3 font-body text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
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
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              name="repeat_yearly"
              type="checkbox"
              defaultChecked={existingReminder?.repeat_yearly ?? true}
              className="h-5 w-5 rounded border-outline-variant text-primary focus:ring-primary"
            />
            <span className="font-label text-sm text-on-surface">J&auml;hrlich wiederholen</span>
          </label>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex flex-wrap gap-3 justify-end">
        <Link
          href="/termine"
          className="rounded-xl border border-outline-variant/30 px-5 py-3 font-label text-sm font-medium text-on-surface-variant hover:bg-surface-container-high transition"
        >
          Abbrechen
        </Link>
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 font-label text-sm font-semibold text-on-primary hover:brightness-110 transition shadow-sm disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-lg">save</span>
          {saving
            ? "Wird gespeichert..."
            : existingReminder
              ? "\u00C4nderungen speichern"
              : "Termin speichern"}
        </button>
      </div>
    </form>
  );
}
