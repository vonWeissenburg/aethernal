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
          <h1 className="text-3xl font-serif font-semibold text-violet">
            Tagebuch
          </h1>
          <p className="mt-1 text-aether-gray">
            Deine persönlichen Erinnerungen und Gedanken.
          </p>
        </div>
        <Link
          href="/tagebuch/neu"
          className="rounded-lg bg-violet px-5 py-2.5 text-sm font-medium text-white hover:bg-violet-light transition shadow-sm"
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
              className="block bg-white rounded-xl border border-lavender-dark p-5 hover:shadow-sm hover:border-violet/20 transition"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {entry.mood && (
                      <span title={MOOD_LABELS[entry.mood]}>
                        {MOOD_ICONS[entry.mood]}
                      </span>
                    )}
                    <h3 className="font-medium text-violet truncate">
                      {entry.title ?? "Ohne Titel"}
                    </h3>
                  </div>
                  <p className="text-sm text-aether-gray line-clamp-2 mb-2">
                    {entry.content}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-aether-gray">
                    <span>{formatDate(entry.entry_date)}</span>
                    {entry.memorial && (
                      <>
                        <span className="text-lavender-dark">|</span>
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
        <div className="rounded-xl border-2 border-dashed border-lavender-dark bg-white p-12 text-center">
          <div className="text-4xl mb-4">📖</div>
          <h3 className="text-lg font-serif font-semibold text-violet mb-2">
            Noch keine Einträge
          </h3>
          <p className="text-sm text-aether-gray mb-6 max-w-md mx-auto">
            Halte deine Gedanken, Erinnerungen und Gefühle in deinem
            persönlichen Tagebuch fest.
          </p>
          <Link
            href="/tagebuch/neu"
            className="inline-flex items-center gap-2 rounded-lg bg-violet px-6 py-2.5 text-sm font-medium text-white hover:bg-violet-light transition shadow-sm"
          >
            Ersten Eintrag schreiben
          </Link>
        </div>
      )}
    </div>
  );
}
