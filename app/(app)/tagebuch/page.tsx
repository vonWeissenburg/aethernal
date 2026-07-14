import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { formatDate } from "@/lib/utils";
import { MOOD_ICONS, MOOD_LABELS } from "@/lib/types";
import type { DiaryEntry, Memorial } from "@/lib/types";
import Link from "next/link";
import EmptyState from "@/components/empty-state";

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
          <h1 className="text-3xl font-headline font-semibold text-on-surface">
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
                className="group block bg-card rounded-card p-5 border border-outline-variant/30 hover:bg-card-hover transition-colors duration-250 ease-out"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-label uppercase tracking-[0.2em] text-on-surface-variant/70 mb-1.5">
                      {formatDate(entry.entry_date)}
                      {entry.memorial && ` · ${entry.memorial.name}`}
                    </p>
                    <h3 className="font-headline text-lg text-on-surface truncate mb-1.5">
                      {entry.title ?? "Ohne Titel"}
                    </h3>
                    <p className="text-sm font-body text-on-surface-variant line-clamp-2">
                      {entry.content}
                    </p>
                    <span className="inline-flex items-center gap-1 mt-3 text-xs font-label text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-250 ease-out">
                      Weiterlesen
                      <span className="material-symbols-outlined text-sm" aria-hidden="true">arrow_forward</span>
                    </span>
                  </div>
                  {entry.mood && (
                    <span
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-container-high text-xl"
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
          <EmptyState
            icon="history_edu"
            title="Noch keine Einträge"
            description="Halte deine Gedanken, Erinnerungen und Gefühle in deinem persönlichen Tagebuch fest."
            actionHref="/tagebuch/neu"
            actionLabel="Ersten Eintrag schreiben"
          />
        )}
      </div>

      {/* FAB - only show when there are entries */}
      {entries && entries.length > 0 && (
        <Link
          href="/tagebuch/neu"
          aria-label="Neuen Tagebucheintrag schreiben"
          className="fixed bottom-24 lg:bottom-12 right-6 lg:right-12 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-on-primary shadow-2xl shadow-primary/20 hover:scale-110 active:scale-95 transition-transform duration-250 ease-out z-40"
        >
          <span className="material-symbols-outlined text-[28px]" aria-hidden="true">add</span>
        </Link>
      )}
    </div>
  );
}
