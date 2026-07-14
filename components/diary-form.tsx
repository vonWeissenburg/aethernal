"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { validateDiaryEntry, firstError } from "@/lib/validation";
import { useToast } from "@/components/toast";
import { MOOD_ICONS, MOOD_LABELS } from "@/lib/types";
import type { DiaryEntry, DiaryMood, Memorial } from "@/lib/types";

const MOODS: DiaryMood[] = ["sad", "reflective", "grateful", "loving", "joyful"];

// Das EINE Tagebuch-Formular (A6) für Anlegen + Bearbeiten. Memorials kommen
// serverseitig als Props — kein Client-Nachladen, kein Selector-Flash.
export function DiaryForm({
  memorials,
  existingEntry,
  preselectedMemorialId,
}: {
  memorials: Pick<Memorial, "id" | "name" | "type">[];
  existingEntry?: DiaryEntry;
  preselectedMemorialId?: string;
}) {
  const router = useRouter();
  const { showToast } = useToast();

  const [memorialId, setMemorialId] = useState(
    existingEntry?.memorial_id ?? preselectedMemorialId ?? memorials[0]?.id ?? ""
  );
  const [title, setTitle] = useState(existingEntry?.title ?? "");
  const [content, setContent] = useState(existingEntry?.content ?? "");
  const [mood, setMood] = useState<DiaryMood | "">(existingEntry?.mood ?? "");
  const [entryDate, setEntryDate] = useState(
    existingEntry?.entry_date ?? new Date().toISOString().split("T")[0]
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedMemorial = memorials.find((m) => m.id === memorialId);

  const inputClass =
    "w-full rounded-button bg-surface-container border-none px-4 py-3.5 text-sm font-body text-on-surface placeholder:text-on-surface-variant/40 focus:ring-2 focus:ring-primary/50 transition-all duration-250 ease-out";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const errors = validateDiaryEntry({
      title: title.trim() || null,
      content: content.trim(),
    });
    if (errors.length > 0) {
      setError(firstError(errors));
      return;
    }

    if (!memorialId) {
      setError("Bitte wähle ein Gedenkprofil aus.");
      return;
    }

    setSaving(true);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const entryData = {
      memorial_id: memorialId,
      title: title.trim() || null,
      content: content.trim(),
      mood: mood || null,
      entry_date: entryDate,
    };

    let entryId = existingEntry?.id;
    let err;
    if (existingEntry) {
      ({ error: err } = await supabase
        .from("diary_entries")
        .update(entryData)
        .eq("id", existingEntry.id));
    } else {
      const { data, error: insertError } = await supabase
        .from("diary_entries")
        .insert({ ...entryData, user_id: user.id })
        .select("id")
        .single();
      err = insertError;
      entryId = data?.id;
    }

    if (err) {
      setError(err.message);
      setSaving(false);
      return;
    }

    showToast("Eintrag gespeichert");
    router.push(entryId ? `/tagebuch/${entryId}` : "/tagebuch");
    router.refresh();
  }

  return (
    <>
      {/* Gedenkprofil-Vorschau */}
      {selectedMemorial && (
        <div className="flex items-center gap-3 bg-surface-container-low rounded-card p-4 mb-6 border border-outline-variant/30">
          <span className="material-symbols-outlined text-2xl text-primary/70" aria-hidden="true">
            {selectedMemorial.type === "animal" ? "pets" : "potted_plant"}
          </span>
          <div>
            <p className="text-sm font-label font-medium text-on-surface">
              {selectedMemorial.name}
            </p>
            <p className="text-[10px] font-label uppercase tracking-[0.15em] text-on-surface-variant/70">
              Gedenkprofil
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-button bg-error/10 border border-error/20 px-4 py-3 text-sm font-body text-error mb-6 flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]" aria-hidden="true">error</span>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Memorial selector */}
        <div>
          <label htmlFor="diary-memorial" className="block font-label text-xs uppercase tracking-widest text-on-surface-variant mb-1.5">
            Gedenkprofil
          </label>
          <select
            id="diary-memorial"
            value={memorialId}
            onChange={(e) => setMemorialId(e.target.value)}
            required
            className={inputClass}
          >
            <option value="">Bitte wählen...</option>
            {memorials.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>

        {/* Mood selector */}
        <div>
          <span className="block font-label text-xs uppercase tracking-widest text-on-surface-variant mb-3">
            Wie fühlst du dich?
          </span>
          <div className="flex flex-wrap gap-3">
            {MOODS.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMood(mood === m ? "" : m)}
                aria-pressed={mood === m}
                className={`flex flex-col items-center gap-1.5 p-3 min-w-[64px] rounded-button border-2 transition-colors duration-250 ease-out ${
                  mood === m
                    ? "border-primary bg-primary/10"
                    : "border-outline-variant/40 hover:border-primary/40 bg-surface-container-low"
                }`}
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-container-high text-xl">
                  {MOOD_ICONS[m]}
                </span>
                <span className="text-[10px] font-label text-on-surface-variant">
                  {MOOD_LABELS[m]}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="diary-title" className="block font-label text-xs uppercase tracking-widest text-on-surface-variant mb-1.5">
              Titel <span className="normal-case tracking-normal text-on-surface-variant/70">(optional)</span>
            </label>
            <input
              id="diary-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
              placeholder="z.B. Ein schöner Gedanke"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="diary-date" className="block font-label text-xs uppercase tracking-widest text-on-surface-variant mb-1.5">
              Datum
            </label>
            <input
              id="diary-date"
              type="date"
              value={entryDate}
              onChange={(e) => setEntryDate(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label htmlFor="diary-content" className="block font-label text-xs uppercase tracking-widest text-on-surface-variant mb-1.5">
            Dein Eintrag *
          </label>
          <textarea
            id="diary-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            rows={10}
            maxLength={10000}
            placeholder="Was bewegt dich heute?"
            className={`${inputClass} resize-y`}
          />
          <p className="text-xs font-label text-on-surface-variant/70 mt-1 text-right">
            {content.length}/10000
          </p>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-5 py-2.5 text-sm font-label text-on-surface-variant hover:text-on-surface transition-colors duration-250 ease-out"
          >
            Abbrechen
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-button bg-primary px-6 py-3 text-sm font-label font-semibold text-on-primary shadow-lg shadow-primary/10 hover:brightness-110 active:scale-[0.98] transition-all duration-250 ease-out disabled:opacity-50"
          >
            {saving
              ? "Wird gespeichert..."
              : existingEntry
                ? "Änderungen speichern"
                : "Speichern"}
          </button>
        </div>
      </form>
    </>
  );
}
