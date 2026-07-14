import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { formatDate } from "@/lib/utils";
import { MOOD_ICONS, MOOD_LABELS } from "@/lib/types";
import type { DiaryEntry, Memorial } from "@/lib/types";
import Link from "next/link";
import { DiaryEntryActions } from "./diary-entry-actions";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("diary_entries")
    .select("title")
    .eq("id", id)
    .single();
  return { title: data?.title ?? "Tagebucheintrag" };
}

export default async function DiaryEntryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: entry } = await supabase
    .from("diary_entries")
    .select("*, memorial:memorials(id, name, type)")
    .eq("id", id)
    .eq("user_id", user.id)
    .single<DiaryEntry & { memorial: Pick<Memorial, "id" | "name" | "type"> }>();

  if (!entry) notFound();

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 lg:px-8 py-8 lg:py-12">
        {/* Header with back link and actions */}
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/tagebuch"
            className="inline-flex items-center gap-1 text-sm font-label text-on-surface-variant hover:text-primary transition"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Zurück zum Tagebuch
          </Link>
          <DiaryEntryActions id={entry.id} title={entry.title} />
        </div>

        <article className="bg-card rounded-card border border-outline-variant/30 p-6 lg:p-8">
          {/* Header */}
          <div className="mb-6">
            <p className="text-[10px] font-label uppercase tracking-[0.2em] text-on-surface-variant/70 mb-2">
              {formatDate(entry.entry_date)}
            </p>
            <div className="flex items-center gap-3 mb-3">
              {entry.mood && (
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-container-high text-xl"
                  title={MOOD_LABELS[entry.mood]}
                >
                  {MOOD_ICONS[entry.mood]}
                </span>
              )}
              <h1 className="text-2xl font-headline font-semibold text-on-surface">
                {entry.title ?? "Ohne Titel"}
              </h1>
            </div>
            <div className="flex items-center gap-3 text-sm font-label text-on-surface-variant/70">
              {entry.memorial && (
                <Link
                  href={`/memorial/${entry.memorial.id}`}
                  className="inline-flex items-center gap-1.5 text-primary hover:brightness-110 transition-colors duration-250 ease-out"
                >
                  <span className="material-symbols-outlined text-sm" aria-hidden="true">
                    {entry.memorial.type === "animal" ? "pets" : "potted_plant"}
                  </span>
                  {entry.memorial.name}
                </Link>
              )}
              {entry.mood && (
                <>
                  {entry.memorial && <span className="text-on-surface-variant/40">·</span>}
                  <span>{MOOD_LABELS[entry.mood]}</span>
                </>
              )}
            </div>
          </div>

          <div className="w-full h-px bg-outline-variant/30 mb-6" />

          {/* Content */}
          <div className="prose prose-sm prose-invert max-w-none font-body text-on-surface whitespace-pre-line leading-relaxed">
            {entry.content}
          </div>
        </article>
      </div>
    </div>
  );
}
