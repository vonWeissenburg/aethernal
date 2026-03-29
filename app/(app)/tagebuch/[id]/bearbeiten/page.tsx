"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { validateDiaryEntry, firstError } from "@/lib/validation";
import { useToast } from "@/components/toast";
import { MOOD_ICONS, MOOD_LABELS } from "@/lib/types";
import type { DiaryMood, Memorial, DiaryEntry } from "@/lib/types";

const MOODS: DiaryMood[] = ["sad", "reflective", "grateful", "loving", "joyful"];

export default function EditDiaryEntryPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { showToast } = useToast();

  const [memorials, setMemorials] = useState<Memorial[]>([]);
  const [memorialId, setMemorialId] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [mood, setMood] = useState<DiaryMood | "">("");
  const [entryDate, setEntryDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const [{ data: entry }, { data: memorialsData }] = await Promise.all([
        supabase
          .from("diary_entries")
          .select("*")
          .eq("id", params.id)
          .eq("user_id", user.id)
          .single<DiaryEntry>(),
        supabase
          .from("memorials")
          .select("*")
          .eq("user_id", user.id)
          .order("name"),
      ]);

      if (!entry) {
        router.push("/tagebuch");
        return;
      }

      setTitle(entry.title ?? "");
      setContent(entry.content);
      setMood(entry.mood ?? "");
      setEntryDate(entry.entry_date);
      setMemorialId(entry.memorial_id ?? "");
      if (memorialsData) setMemorials(memorialsData);
      setInitialLoading(false);
    }
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const errors = validateDiaryEntry({ title: title.trim() || null, content: content.trim() });
    if (errors.length > 0) {
      setError(firstError(errors));
      return;
    }

    setLoading(true);

    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("diary_entries")
      .update({
        memorial_id: memorialId || null,
        title: title.trim() || null,
        content: content.trim(),
        mood: mood || null,
        entry_date: entryDate,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.id);

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    showToast("Eintrag gespeichert");
    router.push(`/tagebuch/${params.id}`);
    router.refresh();
  }

  if (initialLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 lg:px-8 py-8 lg:py-12">
        <p className="text-aether-gray">Laden...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 lg:px-8 py-8 lg:py-12">
      <h1 className="text-3xl font-serif font-semibold text-violet mb-2">
        Eintrag bearbeiten
      </h1>
      <p className="text-aether-gray mb-8">
        Bearbeite deinen Tagebucheintrag.
      </p>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Memorial selector */}
        <div>
          <label className="block text-sm font-medium text-aether-text mb-1.5">
            Gedenkprofil
          </label>
          <select
            value={memorialId}
            onChange={(e) => setMemorialId(e.target.value)}
            className="w-full rounded-lg border border-lavender-dark bg-white px-4 py-2.5 text-sm text-aether-text focus:border-violet focus:ring-2 focus:ring-violet/20 outline-none transition"
          >
            <option value="">Kein Profil</option>
            {memorials.map((m) => (
              <option key={m.id} value={m.id}>
                {m.type === "animal" ? "🐾" : "🕊️"} {m.name}
              </option>
            ))}
          </select>
        </div>

        {/* Mood selector */}
        <div>
          <label className="block text-sm font-medium text-aether-text mb-3">
            Wie fühlst du dich?
          </label>
          <div className="flex gap-3">
            {MOODS.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMood(mood === m ? "" : m)}
                className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition ${
                  mood === m
                    ? "border-violet bg-lavender/50"
                    : "border-lavender-dark hover:border-violet/30"
                }`}
              >
                <span className="text-2xl">{MOOD_ICONS[m]}</span>
                <span className="text-[10px] text-aether-gray">
                  {MOOD_LABELS[m]}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-aether-text mb-1.5">
              Titel{" "}
              <span className="text-aether-gray font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
              placeholder="z.B. Ein schöner Gedanke"
              className="w-full rounded-lg border border-lavender-dark bg-white px-4 py-2.5 text-sm text-aether-text placeholder:text-aether-gray/50 focus:border-violet focus:ring-2 focus:ring-violet/20 outline-none transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-aether-text mb-1.5">
              Datum
            </label>
            <input
              type="date"
              value={entryDate}
              onChange={(e) => setEntryDate(e.target.value)}
              className="w-full rounded-lg border border-lavender-dark bg-white px-4 py-2.5 text-sm text-aether-text focus:border-violet focus:ring-2 focus:ring-violet/20 outline-none transition"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-aether-text mb-1.5">
            Dein Eintrag *
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            rows={10}
            maxLength={10000}
            placeholder="Was bewegt dich heute?"
            className="w-full rounded-lg border border-lavender-dark bg-white px-4 py-2.5 text-sm text-aether-text placeholder:text-aether-gray/50 focus:border-violet focus:ring-2 focus:ring-violet/20 outline-none transition resize-y"
          />
          <p className="text-xs text-aether-gray mt-1 text-right">
            {content.length}/10000
          </p>
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-5 py-2.5 text-sm text-aether-gray hover:text-violet transition"
          >
            Abbrechen
          </button>
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-violet px-6 py-2.5 text-sm font-medium text-white hover:bg-violet-light transition shadow-sm disabled:opacity-50"
          >
            {loading ? "Wird gespeichert..." : "Änderungen speichern"}
          </button>
        </div>
      </form>
    </div>
  );
}
