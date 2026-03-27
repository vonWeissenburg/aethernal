"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { MOOD_ICONS, MOOD_LABELS } from "@/lib/types";
import type { DiaryMood, Memorial } from "@/lib/types";

const MOODS: DiaryMood[] = ["sad", "reflective", "grateful", "loving", "joyful"];

export default function NewDiaryEntryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedMemorial = searchParams.get("memorial");

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
  }, [memorialId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!content.trim()) {
      setError("Bitte schreibe etwas in deinen Eintrag.");
      return;
    }
    if (!memorialId) {
      setError("Bitte wähle ein Gedenkprofil aus.");
      return;
    }

    setLoading(true);
    setError(null);

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

    router.push(`/tagebuch/${data.id}`);
    router.refresh();
  }

  return (
    <div className="max-w-2xl mx-auto px-4 lg:px-8 py-8 lg:py-12">
      <h1 className="text-3xl font-serif font-semibold text-violet mb-2">
        Neuer Tagebucheintrag
      </h1>
      <p className="text-aether-gray mb-8">
        Halte deine Gedanken und Erinnerungen fest.
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
            required
            className="w-full rounded-lg border border-lavender-dark bg-white px-4 py-2.5 text-sm text-aether-text focus:border-violet focus:ring-2 focus:ring-violet/20 outline-none transition"
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
            Dein Eintrag
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            rows={10}
            placeholder="Was bewegt dich heute?"
            className="w-full rounded-lg border border-lavender-dark bg-white px-4 py-2.5 text-sm text-aether-text placeholder:text-aether-gray/50 focus:border-violet focus:ring-2 focus:ring-violet/20 outline-none transition resize-y"
          />
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
            {loading ? "Wird gespeichert..." : "Eintrag speichern"}
          </button>
        </div>
      </form>
    </div>
  );
}
