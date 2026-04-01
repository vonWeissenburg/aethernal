"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { validateDiaryEntry, firstError } from "@/lib/validation";
import { useToast } from "@/components/toast";
import { MOOD_ICONS, MOOD_LABELS } from "@/lib/types";
import type { DiaryMood, Memorial } from "@/lib/types";

const MOODS: DiaryMood[] = ["sad", "reflective", "grateful", "loving", "joyful"];

export default function NewDiaryEntryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedMemorial = searchParams.get("memorial");
  const { showToast } = useToast();

  const [memorials, setMemorials] = useState<Memorial[]>([]);
  const [memorialId, setMemorialId] = useState(preselectedMemorial ?? "");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [mood, setMood] = useState<DiaryMood | "">("");
  const [entryDate, setEntryDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadMemorials() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("memorials")
        .select("*")
        .eq("user_id", user.id)
        .order("name");

      if (data) setMemorials(data);
      if (data && data.length > 0 && !memorialId) {
        setMemorialId(data[0].id);
      }
    }
    loadMemorials();
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

    if (!memorialId) {
      setError("Bitte wähle ein Gedenkprofil aus.");
      return;
    }

    setLoading(true);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const { data, error: insertError } = await supabase
      .from("diary_entries")
      .insert({
        user_id: user.id,
        memorial_id: memorialId,
        title: title.trim() || null,
        content: content.trim(),
        mood: mood || null,
        entry_date: entryDate,
      })
      .select("id")
      .single();

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    showToast("Eintrag gespeichert");
    router.push(`/tagebuch/${data.id}`);
    router.refresh();
  }

  const selectedMemorial = memorials.find((m) => m.id === memorialId);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 lg:px-8 py-8 lg:py-12">
        {/* Back navigation */}
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-1 text-sm font-label text-on-surface-variant hover:text-primary transition mb-6"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Zurück
        </button>

        <h1 className="text-3xl font-headline font-semibold text-primary mb-2">
          Neuer Tagebucheintrag
        </h1>
        <p className="font-body text-on-surface-variant mb-8">
          Halte deine Gedanken und Erinnerungen fest.
        </p>

        {/* Memorial profile preview */}
        {selectedMemorial && (
          <div className="flex items-center gap-3 bg-surface-container-low rounded-xl p-4 mb-6 border border-white/5">
            <span className="material-symbols-outlined text-2xl text-on-surface-variant">
              {selectedMemorial.type === "animal" ? "pets" : "person"}
            </span>
            <div>
              <p className="text-sm font-label font-medium text-on-surface">
                {selectedMemorial.name}
              </p>
              <p className="text-xs font-label text-outline">Gedenkprofil</p>
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-xl bg-error/10 border border-error/20 px-4 py-3 text-sm font-body text-error mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">error</span>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Memorial selector */}
          <div>
            <label className="block text-sm font-label font-medium text-on-surface mb-1.5">
              Gedenkprofil
            </label>
            <select
              value={memorialId}
              onChange={(e) => setMemorialId(e.target.value)}
              required
              className="w-full rounded-xl bg-surface-container-high border border-outline-variant px-4 py-3 text-sm font-body text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition"
            >
              <option value="">Bitte wählen...</option>
              {memorials.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.type === "animal" ? "🐾" : "🕊️"} {m.name}
                </option>
              ))}
            </select>
          </div>

          {/* Mood selector */}
          <div>
            <label className="block text-sm font-label font-medium text-on-surface mb-3">
              Wie fühlst du dich?
            </label>
            <div className="flex gap-3">
              {MOODS.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMood(mood === m ? "" : m)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition ${
                    mood === m
                      ? "border-primary bg-primary/10 ring-2 ring-primary/30"
                      : "border-outline-variant hover:border-primary/40 bg-surface-container-high"
                  }`}
                >
                  <span className="text-2xl">{MOOD_ICONS[m]}</span>
                  <span className="text-[10px] font-label text-on-surface-variant">
                    {MOOD_LABELS[m]}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-label font-medium text-on-surface mb-1.5">
                Titel{" "}
                <span className="text-outline font-normal">(optional)</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={200}
                placeholder="z.B. Ein schöner Gedanke"
                className="w-full rounded-xl bg-surface-container-high border border-outline-variant px-4 py-3 text-sm font-body text-on-surface placeholder:text-outline/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition"
              />
            </div>
            <div>
              <label className="block text-sm font-label font-medium text-on-surface mb-1.5">
                Datum
              </label>
              <input
                type="date"
                value={entryDate}
                onChange={(e) => setEntryDate(e.target.value)}
                className="w-full rounded-xl bg-surface-container-high border border-outline-variant px-4 py-3 text-sm font-body text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-label font-medium text-on-surface mb-1.5">
              Dein Eintrag *
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              rows={10}
              maxLength={10000}
              placeholder="Was bewegt dich heute?"
              className="w-full rounded-xl bg-surface-container-high border border-outline-variant px-4 py-3 text-sm font-body text-on-surface placeholder:text-outline/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition resize-y"
            />
            <p className="text-xs font-label text-outline mt-1 text-right">
              {content.length}/10000
            </p>
          </div>

          <div className="flex items-center gap-3 pt-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-5 py-2.5 text-sm font-label text-on-surface-variant hover:text-on-surface transition"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-full bg-primary px-6 py-3 text-sm font-label font-semibold text-on-primary hover:brightness-110 transition shadow-sm disabled:opacity-50"
            >
              {loading ? "Wird gespeichert..." : "Speichern"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
