import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { Memorial } from "@/lib/types";
import MemorialCard from "@/components/memorial-card";
import EmptyState from "@/components/empty-state";

export const metadata = { title: "Gedenkprofile" };

export default async function GedenkprofilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: memorials } = await supabase
    .from("memorials")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .returns<Memorial[]>();

  // Tagebuch-Zähler pro Memorial (wie Dashboard)
  const { data: diaryCounts } = await supabase
    .from("diary_entries")
    .select("memorial_id")
    .eq("user_id", user.id);

  const diaryCountMap: Record<string, number> = {};
  diaryCounts?.forEach((d) => {
    diaryCountMap[d.memorial_id] = (diaryCountMap[d.memorial_id] || 0) + 1;
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 lg:px-8 py-8 lg:py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-headline text-3xl font-semibold text-on-surface">
            Gedenkprofile
          </h1>
          <p className="mt-2 font-body text-sm text-on-surface-variant">
            Alle Menschen und Tiere, deren Erinnerung du bewahrst.
          </p>
        </div>

        {memorials && memorials.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {memorials.map((m) => (
              <MemorialCard key={m.id} memorial={m} diaryCount={diaryCountMap[m.id] || 0} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="Noch keine Gedenkprofile"
            description="Erstelle dein erstes Gedenkprofil, um die Erinnerung an einen geliebten Menschen oder ein geliebtes Tier zu bewahren."
            actionHref="/memorial/new"
            actionLabel="Erstes Gedenkprofil erstellen"
          />
        )}
      </div>

      {/* FAB */}
      {memorials && memorials.length > 0 && (
        <Link
          href="/memorial/new"
          aria-label="Neues Gedenkprofil erstellen"
          className="fixed bottom-24 lg:bottom-12 right-6 lg:right-12 flex h-14 w-14 lg:h-20 lg:w-20 items-center justify-center rounded-full bg-primary text-on-primary shadow-2xl shadow-primary/20 hover:scale-110 active:scale-95 transition-transform duration-250 ease-out z-40 group"
        >
          <span
            className="material-symbols-outlined text-3xl lg:text-4xl group-hover:rotate-90 transition-transform duration-400"
            aria-hidden="true"
          >
            add
          </span>
        </Link>
      )}
    </div>
  );
}
