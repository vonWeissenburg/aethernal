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
    <div className="relative min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 lg:px-8 py-8 lg:py-12">
        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-3xl font-headline font-semibold text-primary">
            Tagebuch
          </h1>
          <p className="mt-1 text-sm font-body text-on-surface-variant">
            Deine persönlichen Erinnerungen und Gedanken.
          </p>
        </div>

        {entries && entries.length > 0 ? (
          <div className="space-y-3">
            {entries.map((entry) => (
              <Link
                key={entry.id}
                href={`/tagebuch/${entry.id}`}
                className="block bg-card rounded-xl p-5 border border-white/5 hover:border-primary/20 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <h3 className="font-body font-medium text-on-surface truncate">
                        {entry.title ?? "Ohne Titel"}
                      </h3>
                    </div>
                    <p className="text-sm font-body text-on-surface-variant line-clamp-2 mb-3">
                      {entry.content}
                    </p>
                    <div className="flex items-center gap-3 text-xs font-label text-outline">
                      <span>{formatDate(entry.entry_date)}</span>
                      {entry.memorial && (
                        <>
                          <span className="text-outline/50">|</span>
                          <span>
                            {entry.memorial.type === "animal" ? "🐾" : "🕊️"}{" "}
                            {entry.memorial.name}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  {entry.mood && (
                    <span
                      className="text-2xl flex-shrink-0"
                      title={MOOD_LABELS[entry.mood]}
                    >
                      {MOOD_ICONS[entry.mood]}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-xl bg-card border border-white/5 p-12 text-center">
            <span className="material-symbols-outlined text-5xl text-on-surface-variant mb-4 block">
              dove
            </span>
            <h3 className="text-lg font-headline font-semibold text-on-surface mb-2">
              Noch keine Einträge
            </h3>
            <p className="text-sm font-body text-on-surface-variant mb-6 max-w-md mx-auto">
              Halte deine Gedanken, Erinnerungen und Gefühle in deinem
              persönlichen Tagebuch fest.
            </p>
            <Link
              href="/tagebuch/neu"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-label font-semibold text-on-primary hover:brightness-110 transition shadow-sm"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              Ersten Eintrag schreiben
            </Link>
          </div>
        )}
      </div>

      {/* FAB - only show when there are entries */}
      {entries && entries.length > 0 && (
        <Link
          href="/tagebuch/neu"
          className="fixed bottom-6 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-on-primary shadow-lg hover:brightness-110 transition z-50"
          title="Neuer Eintrag"
        >
          <span className="material-symbols-outlined text-[28px]">add</span>
        </Link>
      )}
    </div>
  );
}
