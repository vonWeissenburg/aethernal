import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { Memorial } from "@/lib/types";
import { DiaryForm } from "@/components/diary-form";

export const metadata = { title: "Neuer Tagebucheintrag" };

export default async function NewDiaryEntryPage({
  searchParams,
}: {
  searchParams: Promise<{ memorial?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { memorial } = await searchParams;

  const { data: memorials } = await supabase
    .from("memorials")
    .select("id, name, type")
    .eq("user_id", user.id)
    .order("name")
    .returns<Pick<Memorial, "id" | "name" | "type">[]>();

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 lg:px-8 py-8 lg:py-12">
        <Link
          href="/tagebuch"
          className="inline-flex items-center gap-1 text-sm font-label text-on-surface-variant hover:text-primary transition-colors duration-250 ease-out mb-6"
        >
          <span className="material-symbols-outlined text-[18px]" aria-hidden="true">arrow_back</span>
          Zurück
        </Link>

        <h1 className="text-3xl font-headline font-semibold text-on-surface mb-2">
          Neuer Tagebucheintrag
        </h1>
        <p className="font-body text-on-surface-variant mb-8">
          Halte deine Gedanken und Erinnerungen fest.
        </p>

        <DiaryForm memorials={memorials ?? []} preselectedMemorialId={memorial} />
      </div>
    </div>
  );
}
