import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { formatDate, formatLifespan } from "@/lib/utils";
import type { Memorial, MemorialPhoto, DiaryEntry } from "@/lib/types";
import Link from "next/link";
import Image from "next/image";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("memorials")
    .select("name")
    .eq("id", id)
    .single();
  return { title: data?.name ?? "Gedenkprofil" };
}

export default async function MemorialDetailPage({
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

  const { data: memorial } = await supabase
    .from("memorials")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single<Memorial>();

  if (!memorial) notFound();

  const { data: photos } = await supabase
    .from("memorial_photos")
    .select("*")
    .eq("memorial_id", id)
    .order("order_index")
    .returns<MemorialPhoto[]>();

  const { data: diaryEntries } = await supabase
    .from("diary_entries")
    .select("*")
    .eq("memorial_id", id)
    .order("entry_date", { ascending: false })
    .limit(5)
    .returns<DiaryEntry[]>();

  const photoCount = photos?.length ?? 0;
  const diaryCount = diaryEntries?.length ?? 0;
  const spiritLinkUrl = `${process.env.NEXT_PUBLIC_APP_URL}/s/${memorial.slug}`;

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <div className="sticky top-0 z-30 flex items-center gap-3 px-4 py-3 bg-surface/80 backdrop-blur-xl border-b border-outline-variant/10">
        <Link
          href="/dashboard"
          className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-surface-container-high transition"
        >
          <span className="material-symbols-outlined text-on-surface">arrow_back</span>
        </Link>
        <h1 className="font-body text-base font-medium text-on-surface">Gedenkprofil</h1>
      </div>

      {/* Hero section */}
      <div className="flex flex-col items-center pt-8 pb-6 px-4">
        {memorial.profile_photo_url ? (
          <div className="relative w-[120px] h-[120px] rounded-full border-2 border-primary overflow-hidden">
            <Image
              src={memorial.profile_photo_url}
              alt={memorial.name}
              fill
              className="object-cover"
            />
          </div>
        ) : (
          <div className="w-[120px] h-[120px] rounded-full border-2 border-primary bg-surface-container-high flex items-center justify-center">
            <span className="material-symbols-outlined text-5xl text-on-surface-variant">
              {memorial.type === "animal" ? "pets" : "person"}
            </span>
          </div>
        )}

        <h2 className="mt-4 text-2xl font-headline font-semibold text-on-surface">
          {memorial.name}
        </h2>

        {(memorial.birth_date || memorial.death_date) && (
          <p className="mt-1 text-sm font-body text-on-surface-variant">
            {formatLifespan(memorial.birth_date, memorial.death_date)}
          </p>
        )}

        {memorial.description && (
          <p className="mt-3 text-sm font-body text-on-surface-variant text-center max-w-md leading-relaxed">
            {memorial.description}
          </p>
        )}

        <div className="flex items-center gap-2 mt-3">
          <span
            className={`inline-flex items-center gap-1 text-xs font-label px-2.5 py-1 rounded-full ${
              memorial.is_public
                ? "bg-success/10 text-success"
                : "bg-surface-container-high text-on-surface-variant"
            }`}
          >
            <span className="material-symbols-outlined text-sm">
              {memorial.is_public ? "public" : "lock"}
            </span>
            {memorial.is_public ? "Öffentlich" : "Privat"}
          </span>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-outline-variant/10 px-4">
        <button className="active-underline flex-1 py-3 text-sm font-label font-medium text-primary text-center">
          Übersicht
        </button>
        <Link
          href={`/memorial/${id}/edit#fotos`}
          className="flex-1 py-3 text-sm font-label font-medium text-on-surface-variant text-center hover:text-on-surface transition"
        >
          Fotos
        </Link>
        <Link
          href={`/tagebuch/neu?memorial=${id}`}
          className="flex-1 py-3 text-sm font-label font-medium text-on-surface-variant text-center hover:text-on-surface transition"
        >
          Tagebuch
        </Link>
      </div>

      {/* Overview tab content */}
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        {/* SpiritLink card */}
        {memorial.is_public && (
          <div className="bg-surface-container-low rounded-xl p-6 border border-outline-variant/10">
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-primary">qr_code_2</span>
              <h3 className="font-headline text-base font-semibold text-on-surface">SpiritLink</h3>
            </div>

            <div className="flex items-center gap-3">
              {/* QR placeholder */}
              <div className="w-16 h-16 rounded-lg bg-surface-container-high flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-3xl text-on-surface-variant">qr_code</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-label text-on-surface-variant mb-1">Öffentlicher Link</p>
                <p className="text-sm font-body text-on-surface truncate">{spiritLinkUrl}</p>
              </div>
            </div>

            <a
              href={spiritLinkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 w-full flex items-center justify-center gap-2 rounded-xl bg-primary/10 border border-primary/20 px-4 py-2.5 text-sm font-label font-medium text-primary hover:bg-primary/20 transition"
            >
              <span className="material-symbols-outlined text-lg">share</span>
              Teilen
            </a>
          </div>
        )}

        {/* Stats card */}
        <div className="bg-surface-container-low rounded-xl p-6 border border-outline-variant/10">
          <h3 className="font-headline text-base font-semibold text-on-surface mb-4">Statistiken</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <span className="material-symbols-outlined text-2xl text-primary mb-1">auto_stories</span>
              <p className="text-xl font-headline font-semibold text-on-surface">{diaryCount}</p>
              <p className="text-xs font-label text-on-surface-variant">Einträge</p>
            </div>
            <div className="text-center">
              <span className="material-symbols-outlined text-2xl text-primary mb-1">mail</span>
              <p className="text-xl font-headline font-semibold text-on-surface">0</p>
              <p className="text-xs font-label text-on-surface-variant">Nachrichten</p>
            </div>
            <div className="text-center">
              <span className="material-symbols-outlined text-2xl text-primary mb-1">photo_library</span>
              <p className="text-xl font-headline font-semibold text-on-surface">{photoCount}</p>
              <p className="text-xs font-label text-on-surface-variant">Fotos</p>
            </div>
          </div>
        </div>

        {/* Biography */}
        {memorial.biography && (
          <div className="bg-surface-container-low rounded-xl p-6 border border-outline-variant/10">
            <div className="flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-primary">menu_book</span>
              <h3 className="font-headline text-base font-semibold text-on-surface">Biografie</h3>
            </div>
            <p className="text-sm font-body text-on-surface-variant leading-relaxed whitespace-pre-line">
              {memorial.biography}
            </p>
          </div>
        )}

        {/* Photo gallery preview */}
        <div className="bg-surface-container-low rounded-xl p-6 border border-outline-variant/10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">photo_library</span>
              <h3 className="font-headline text-base font-semibold text-on-surface">Fotos</h3>
            </div>
            <Link
              href={`/memorial/${id}/edit#fotos`}
              className="text-xs font-label text-primary hover:text-primary/80 transition"
            >
              Verwalten
            </Link>
          </div>

          {photos && photos.length > 0 ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {photos.map((photo) => (
                <div
                  key={photo.id}
                  className="relative aspect-square rounded-lg overflow-hidden bg-surface-container-high"
                >
                  <Image
                    src={photo.url}
                    alt={photo.caption ?? ""}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 33vw, 25vw"
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-outline-variant/30 p-8 text-center">
              <span className="material-symbols-outlined text-3xl text-on-surface-variant/50 mb-2">add_photo_alternate</span>
              <p className="text-sm font-body text-on-surface-variant">
                Noch keine Fotos hochgeladen.
              </p>
            </div>
          )}
        </div>

        {/* Recent diary entries */}
        <div className="bg-surface-container-low rounded-xl p-6 border border-outline-variant/10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">auto_stories</span>
              <h3 className="font-headline text-base font-semibold text-on-surface">Tagebuch</h3>
            </div>
            <Link
              href={`/tagebuch/neu?memorial=${id}`}
              className="text-xs font-label text-primary hover:text-primary/80 transition"
            >
              Neuer Eintrag
            </Link>
          </div>

          {diaryEntries && diaryEntries.length > 0 ? (
            <div className="space-y-3">
              {diaryEntries.map((entry) => (
                <Link
                  key={entry.id}
                  href={`/tagebuch/${entry.id}`}
                  className="block rounded-xl bg-surface-container-high/50 p-4 hover:bg-surface-container-high transition"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <h4 className="text-sm font-label font-medium text-on-surface">
                      {entry.title ?? "Ohne Titel"}
                    </h4>
                    <span className="text-xs font-label text-on-surface-variant">
                      {formatDate(entry.entry_date)}
                    </span>
                  </div>
                  <p className="text-xs font-body text-on-surface-variant line-clamp-2">
                    {entry.content}
                  </p>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-outline-variant/30 p-8 text-center">
              <span className="material-symbols-outlined text-3xl text-on-surface-variant/50 mb-2">edit_note</span>
              <p className="text-sm font-body text-on-surface-variant mb-3">
                Noch keine Tagebucheinträge. Halte deine Erinnerungen fest.
              </p>
              <Link
                href={`/tagebuch/neu?memorial=${id}`}
                className="inline-flex items-center gap-1 text-sm font-label text-primary hover:text-primary/80 transition"
              >
                <span className="material-symbols-outlined text-lg">add</span>
                Neuer Eintrag
              </Link>
            </div>
          )}
        </div>

        {/* Edit button */}
        <Link
          href={`/memorial/${id}/edit`}
          className="flex items-center justify-center gap-2 w-full rounded-xl border border-primary/30 px-5 py-3 text-sm font-label font-medium text-primary hover:bg-primary/10 transition"
        >
          <span className="material-symbols-outlined text-lg">edit</span>
          Bearbeiten
        </Link>
      </div>
    </div>
  );
}
