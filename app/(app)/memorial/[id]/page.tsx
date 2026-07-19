import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { formatDate, formatLifespan } from "@/lib/utils";
import type { Memorial, MemorialPhoto, DiaryEntry } from "@/lib/types";
import Link from "next/link";
import Image from "next/image";
import QRCode from "qrcode";
import CopyLinkButton from "@/components/copy-link-button";
import ShareLinkButton from "@/components/share-link-button";
import { LightboxGallery } from "@/components/photo-lightbox";

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

  const { count: diaryCount } = await supabase
    .from("diary_entries")
    .select("*", { count: "exact", head: true })
    .eq("memorial_id", id);

  const { count: messageCount } = await supabase
    .from("messages")
    .select("*", { count: "exact", head: true })
    .eq("memorial_id", id);

  const photoCount = photos?.length ?? 0;
  const spiritLinkUrl = `${process.env.NEXT_PUBLIC_APP_URL}/s/${memorial.slug}`;

  // Echter, scannbarer QR-Code (B5) — serverseitig generiert
  const qrDataUrl = memorial.is_public
    ? await QRCode.toDataURL(spiritLinkUrl, {
        width: 480,
        margin: 1,
        color: { dark: "#0B0D17", light: "#FFFFFF" },
      })
    : null;

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <div className="sticky top-0 z-30 flex items-center gap-3 px-4 py-3 bg-surface/80 backdrop-blur-xl border-b border-outline-variant/30">
        <Link
          href="/dashboard"
          aria-label="Zurück zum Dashboard"
          className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-surface-container-high transition-colors duration-250 ease-out"
        >
          <span className="material-symbols-outlined text-on-surface" aria-hidden="true">arrow_back</span>
        </Link>
        <h1 className="font-body text-base font-medium text-on-surface">Gedenkprofil</h1>
      </div>

      {/* Hero section */}
      <div className="flex flex-col items-center pt-10 pb-6 px-4 relative">
        <div className="absolute inset-x-0 top-0 h-64 pointer-events-none golden-glow animate-glow-pulse" aria-hidden="true" />

        {memorial.profile_photo_url ? (
          <div className="relative w-[140px] h-[140px] rounded-full border-2 border-primary overflow-hidden shadow-[0_0_40px_rgba(242,202,80,0.15)]">
            <Image
              src={memorial.profile_photo_url}
              alt={memorial.name}
              fill
              className="object-cover"
            />
          </div>
        ) : (
          <div className="w-[140px] h-[140px] rounded-full border-2 border-primary bg-surface-container-high flex items-center justify-center shadow-[0_0_40px_rgba(242,202,80,0.15)]">
            <span className="material-symbols-outlined text-5xl text-primary/70" aria-hidden="true">
              {memorial.type === "animal" ? "pets" : "potted_plant"}
            </span>
          </div>
        )}

        <h2 className="mt-5 text-3xl font-headline font-semibold text-on-surface text-center">
          {memorial.name}
        </h2>

        {(memorial.birth_date || memorial.death_date) && (
          <p className="mt-2 text-xs font-label uppercase tracking-[0.2em] text-on-surface-variant">
            {formatLifespan(memorial.birth_date, memorial.death_date)}
          </p>
        )}

        {memorial.description && (
          <p className="mt-4 font-headline italic text-on-surface-variant/80 text-center max-w-md leading-relaxed">
            „{memorial.description}"
          </p>
        )}

        <div className="flex items-center gap-2 mt-4">
          <span
            className={`inline-flex items-center gap-1 text-xs font-label px-2.5 py-1 rounded-full ${
              memorial.is_public
                ? "bg-success/10 text-success"
                : "bg-surface-container-high text-on-surface-variant"
            }`}
          >
            <span className="material-symbols-outlined text-sm" aria-hidden="true">
              {memorial.is_public ? "public" : "lock"}
            </span>
            {memorial.is_public ? "Öffentlich" : "Privat"}
          </span>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-outline-variant/30 px-4">
        <span
          aria-current="page"
          className="active-underline flex-1 py-3 text-sm font-label font-medium text-primary text-center"
        >
          Übersicht
        </span>
        <Link
          href="#fotos"
          className="flex-1 py-3 text-sm font-label font-medium text-on-surface-variant text-center hover:text-on-surface transition-colors duration-250 ease-out"
        >
          Fotos
        </Link>
        <Link
          href={`/tagebuch/neu?memorial=${id}`}
          className="flex-1 py-3 text-sm font-label font-medium text-on-surface-variant text-center hover:text-on-surface transition-colors duration-250 ease-out"
        >
          Tagebuch
        </Link>
      </div>

      {/* Overview tab content */}
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        {/* SpiritLink card — Layout bereit für echten QR + Web-Share (B5) */}
        {memorial.is_public && (
          <div className="bg-surface-container-low rounded-card p-6 border border-outline-variant/30">
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-primary" aria-hidden="true">qr_code_2</span>
              <h3 className="font-headline text-base font-semibold text-on-surface">SpiritLink</h3>
            </div>

            <div className="flex items-center gap-4">
              {/* Echter QR-Code */}
              <div className="w-24 h-24 rounded-button bg-white p-1.5 shrink-0">
                {qrDataUrl && (
                  <Image
                    src={qrDataUrl}
                    alt={`QR-Code für ${spiritLinkUrl}`}
                    width={96}
                    height={96}
                    unoptimized
                    className="w-full h-full"
                  />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-label uppercase tracking-[0.2em] text-on-surface-variant mb-1.5">
                  Öffentlicher Link
                </p>
                <p className="text-sm font-mono text-on-surface truncate mb-2">{spiritLinkUrl}</p>
                {qrDataUrl && (
                  <a
                    href={qrDataUrl}
                    download={`spiritlink-${memorial.slug}.png`}
                    className="inline-flex items-center gap-1 text-xs font-label text-primary hover:text-primary/80 transition-colors duration-250 ease-out"
                  >
                    <span className="material-symbols-outlined text-sm" aria-hidden="true">download</span>
                    QR-Code herunterladen
                  </a>
                )}
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3">
              <ShareLinkButton
                url={spiritLinkUrl}
                title={`Gedenkseite für ${memorial.name}`}
                className="flex items-center justify-center gap-2 rounded-button bg-primary/10 border border-primary/20 px-4 py-2.5 text-sm font-label font-medium text-primary hover:bg-primary/20 transition-colors duration-250 ease-out"
              />
              <CopyLinkButton
                url={spiritLinkUrl}
                className="flex items-center justify-center gap-2 rounded-button border border-outline-variant/40 px-4 py-2.5 text-sm font-label font-medium text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors duration-250 ease-out"
              />
              <a
                href={spiritLinkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-button border border-outline-variant/40 px-4 py-2.5 text-sm font-label font-medium text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors duration-250 ease-out"
              >
                <span className="material-symbols-outlined text-lg" aria-hidden="true">open_in_new</span>
                Öffnen
              </a>
            </div>
          </div>
        )}

        {/* Stats card (Serif-Zahlen + Uppercase-Mini-Label) */}
        <div className="bg-surface-container-low rounded-card p-6 border border-outline-variant/30">
          <h3 className="font-headline text-base font-semibold text-on-surface mb-4">Statistiken</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <span className="material-symbols-outlined text-2xl text-primary mb-1" aria-hidden="true">auto_stories</span>
              <p className="text-2xl font-headline font-semibold text-on-surface">{diaryCount ?? 0}</p>
              <p className="text-[10px] font-label uppercase tracking-[0.15em] text-on-surface-variant">Einträge</p>
            </div>
            <div className="text-center">
              <span className="material-symbols-outlined text-2xl text-primary mb-1" aria-hidden="true">mail</span>
              <p className="text-2xl font-headline font-semibold text-on-surface">{messageCount ?? 0}</p>
              <p className="text-[10px] font-label uppercase tracking-[0.15em] text-on-surface-variant">Nachrichten</p>
            </div>
            <div className="text-center">
              <span className="material-symbols-outlined text-2xl text-primary mb-1" aria-hidden="true">photo_library</span>
              <p className="text-2xl font-headline font-semibold text-on-surface">{photoCount}</p>
              <p className="text-[10px] font-label uppercase tracking-[0.15em] text-on-surface-variant">Fotos</p>
            </div>
          </div>
        </div>

        {/* Biography */}
        {memorial.biography && (
          <div className="bg-surface-container-low rounded-card p-6 border border-outline-variant/30">
            <div className="flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-primary" aria-hidden="true">menu_book</span>
              <h3 className="font-headline text-base font-semibold text-on-surface">Biografie</h3>
            </div>
            <p className="text-sm font-body text-on-surface-variant leading-relaxed whitespace-pre-line">
              {memorial.biography}
            </p>
          </div>
        )}

        {/* Photo gallery preview */}
        <div id="fotos" className="bg-surface-container-low rounded-card p-6 border border-outline-variant/30 scroll-mt-20">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary" aria-hidden="true">photo_library</span>
              <h3 className="font-headline text-base font-semibold text-on-surface">Fotos</h3>
            </div>
            <Link
              href={`/memorial/${id}/edit#fotos`}
              className="text-xs font-label text-primary hover:text-primary/80 transition-colors duration-250 ease-out"
            >
              Verwalten
            </Link>
          </div>

          {photos && photos.length > 0 ? (
            <LightboxGallery
              photos={photos.map((p) => ({ id: p.id, url: p.url, caption: p.caption }))}
              variant="grid"
            />
          ) : (
            <div className="rounded-card border border-dashed border-outline-variant/40 p-8 text-center">
              <span className="material-symbols-outlined text-3xl text-on-surface-variant/50 mb-2" aria-hidden="true">add_photo_alternate</span>
              <p className="text-sm font-body text-on-surface-variant">
                Noch keine Fotos hochgeladen.
              </p>
            </div>
          )}
        </div>

        {/* Recent diary entries */}
        <div className="bg-surface-container-low rounded-card p-6 border border-outline-variant/30">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary" aria-hidden="true">auto_stories</span>
              <h3 className="font-headline text-base font-semibold text-on-surface">Tagebuch</h3>
            </div>
            <Link
              href={`/tagebuch/neu?memorial=${id}`}
              className="text-xs font-label text-primary hover:text-primary/80 transition-colors duration-250 ease-out"
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
                  className="block rounded-button bg-surface-container-high/50 p-4 hover:bg-surface-container-high transition-colors duration-250 ease-out"
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
            <div className="rounded-card border border-dashed border-outline-variant/40 p-8 text-center">
              <span className="material-symbols-outlined text-3xl text-on-surface-variant/50 mb-2" aria-hidden="true">edit_note</span>
              <p className="text-sm font-body text-on-surface-variant mb-3">
                Noch keine Tagebucheinträge. Halte deine Erinnerungen fest.
              </p>
              <Link
                href={`/tagebuch/neu?memorial=${id}`}
                className="inline-flex items-center gap-1 text-sm font-label text-primary hover:text-primary/80 transition-colors duration-250 ease-out"
              >
                <span className="material-symbols-outlined text-lg" aria-hidden="true">add</span>
                Neuer Eintrag
              </Link>
            </div>
          )}
        </div>

        {/* Edit button */}
        <Link
          href={`/memorial/${id}/edit`}
          className="flex items-center justify-center gap-2 w-full rounded-button border border-primary/30 px-5 py-3 text-sm font-label font-medium text-primary hover:bg-primary/10 transition-colors duration-250 ease-out"
        >
          <span className="material-symbols-outlined text-lg" aria-hidden="true">edit</span>
          Bearbeiten
        </Link>
      </div>
    </div>
  );
}
