"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
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
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [reminderType, setReminderType] = useState<ReminderType>(
    existingReminder?.reminder_type ?? "custom"
  );

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

    const data = {
      user_id: user.id,
      title: form.get("title") as string,
      description: (form.get("description") as string) || null,
      reminder_date: form.get("reminder_date") as string,
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

    router.push("/termine");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <p className="text-sm text-red-600 mb-6 p-3 bg-red-50 rounded-lg">
          {error}
        </p>
      )}

      {/* Typ */}
      <div className="rounded-xl border border-lavender-dark bg-white p-6 mb-6">
        <h2 className="font-serif text-xl font-semibold text-violet mb-4">
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
                  ? "border-amber bg-amber/5"
                  : "border-lavender-dark bg-white hover:border-violet/30"
              }`}
            >
              <div className="text-2xl mb-1">
                {REMINDER_TYPE_ICONS[type]}
              </div>
              <p className="text-xs font-medium text-violet">
                {REMINDER_TYPE_LABELS[type]}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Details */}
      <div className="rounded-xl border border-lavender-dark bg-white p-6 mb-6">
        <h2 className="font-serif text-xl font-semibold text-violet mb-4">
          Details
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-violet mb-1">
              Titel *
            </label>
            <input
              name="title"
              required
              defaultValue={existingReminder?.title ?? ""}
              className="w-full rounded-lg border border-lavender-dark px-4 py-2.5 text-sm focus:border-amber focus:ring-1 focus:ring-amber outline-none"
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
            <label className="block text-sm font-medium text-violet mb-1">
              Beschreibung
            </label>
            <textarea
              name="description"
              rows={3}
              defaultValue={existingReminder?.description ?? ""}
              className="w-full rounded-lg border border-lavender-dark px-4 py-3 text-sm focus:border-amber focus:ring-1 focus:ring-amber outline-none resize-y"
              placeholder="Optionale Notizen..."
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-violet mb-1">
                Datum *
              </label>
              <input
                name="reminder_date"
                type="date"
                required
                defaultValue={existingReminder?.reminder_date ?? ""}
                className="w-full rounded-lg border border-lavender-dark px-4 py-2.5 text-sm focus:border-amber focus:ring-1 focus:ring-amber outline-none"
              />
            </div>
            {memorials.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-violet mb-1">
                  Gedenkprofil zuordnen
                </label>
                <select
                  name="memorial_id"
                  defaultValue={existingReminder?.memorial_id ?? ""}
                  className="w-full rounded-lg border border-lavender-dark px-4 py-2.5 text-sm focus:border-amber focus:ring-1 focus:ring-amber outline-none bg-white"
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
              className="rounded border-lavender-dark text-amber focus:ring-amber"
            />
            <span className="text-sm text-violet">Jährlich wiederholen</span>
          </label>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex flex-wrap gap-3 justify-end">
        <Link
          href="/termine"
          className="rounded-lg border border-lavender-dark px-5 py-2.5 text-sm font-medium text-aether-gray hover:bg-lavender transition"
        >
          Abbrechen
        </Link>
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-amber px-6 py-2.5 text-sm font-medium text-white hover:bg-amber-dark transition shadow-sm disabled:opacity-50"
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
