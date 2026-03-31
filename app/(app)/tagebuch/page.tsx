import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { formatDate } from "@/lib/utils";
import { MOOD_ICONS, MOOD_LABELS } from "@/lib/types";
import type { DiaryEntry, Memorial } from "@/lib/types";
import Link from "next/link";

export const metadata = { title: "Tagebuch" };

export default async function TagebuchPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: entries } = await supabase
    .from("diary_entries")
    .select("*, memorial:memorials(name, type)")
    .eq("user_id", user.id)
    .order("entry_date", { ascending: false })
    .returns<(DiaryEntry & { memorial: Pick<Memorial, "name" | "type"> })[]>();

  return (
    <div className="max-w-3xl mx-auto px-4 lg:px-8 py-8 lg:py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-serif font-semibold text-gold-light">
            Tagebuch
          </h1>
          <p className="mt-1 text-text-secondary">
            Deine persönlichen Erinnerungen und Gedanken.
          </p>
        </div>
        <Link
          href="/tagebuch/neu"
          className="rounded-lg bg-gold px-5 py-3 text-sm font-semibold text-bg-primary hover:brightness-110 transition shadow-sm"
        >
          Neuer Eintrag
        </Link>
      </div>

      {entries && entries.length > 0 ? (
        <div className="space-y-4">
          {entries.map((entry) => (
            <Link
              key={entry.id}
              href={`/tagebuch/${entry.id}`}
              className="block bg-bg-card rounded-xl border border-border-card p-5 hover:bg-bg-card-hover transition"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {entry.mood && (
                      <span title={MOOD_LABELS[entry.mood]}>
                        {MOOD_ICONS[entry.mood]}
                      </span>
                    )}
                    <h3 className="font-medium text-gold-light truncate">
                      {entry.title ?? "Ohne Titel"}
                    </h3>
                  </div>
                  <p className="text-sm text-text-secondary line-clamp-2 mb-2">
                    {entry.content}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-text-secondary">
                    <span>{formatDate(entry.entry_date)}</span>
                    {entry.memorial && (
                      <>
                        <span className="text-text-secondary-dark">|</span>
                        <span>
                          {entry.memorial.type === "animal" ? "🐾" : "🕊️"}{" "}
                          {entry.memorial.name}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border-2 border-dashed border-outline-variant bg-bg-card p-12 text-center">
          <div className="text-4xl mb-4">📖</div>
          <h3 className="text-lg font-serif font-semibold text-gold-light mb-2">
            Noch keine Einträge
          </h3>
          <p className="text-sm text-text-secondary mb-6 max-w-md mx-auto">
            Halte deine Gedanken, Erinnerungen und Gefühle in deinem
            persönlichen Tagebuch fest.
          </p>
          <Link
            href="/tagebuch/neu"
            className="inline-flex items-center gap-2 rounded-lg bg-gold px-6 py-3 text-sm font-semibold text-bg-primary hover:brightness-110 transition shadow-sm"
          >
            Ersten Eintrag schreiben
          </Link>
        </div>
      )}
    </div>
  );
}
