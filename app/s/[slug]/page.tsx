import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { formatLifespan } from "@/lib/utils";
import type { Memorial, MemorialPhoto } from "@/lib/types";
import Image from "next/image";
import { LightboxGallery } from "@/components/photo-lightbox";
import { signPhotoPaths } from "@/lib/photo-urls";

type PublicMemorial = { memorial: Memorial; photos: MemorialPhoto[] };

/**
 * Öffentliche Gedenkseite: Profil und Fotos über die Datenbankfunktion
 * get_public_memorial (Migration 20260828_public_memorial_no_enumeration).
 *
 * Bewusst NICHT mehr als zwei Tabellen-Abfragen: die früheren Policies gaben
 * Unangemeldeten SELECT auf alle Zeilen mit is_public = true und machten damit die
 * gesamte Tabelle über die öffentliche REST-Schnittstelle auflistbar — Klarnamen und
 * Sterbedaten realer Verstorbener inklusive. Die Funktion liefert genau eine Zeile
 * per Kurzname; die Policies sind entfernt.
 *
 * `cache` dedupliziert den Aufruf innerhalb einer Anfrage, damit generateMetadata und
 * die Seite selbst nur einmal fragen.
 */
const loadPublicMemorial = cache(async (slug: string): Promise<PublicMemorial | null> => {
  const supabase = await createClient();
  // Die Funktion gibt kein Rowset zurück, sondern ein einzelnes jsonb — PostgREST
  // liefert es direkt als Antwortkörper, bei fehlendem Treffer null. Deshalb kein
  // .single()/.returns(), sondern eine explizite Umtypisierung des Ergebnisses.
  const { data, error } = await supabase.rpc("get_public_memorial", { p_slug: slug });

  if (error) {
    // Häufigster Fall: Migration noch nicht eingespielt. Sichtbar machen, nicht schlucken.
    console.error("get_public_memorial fehlgeschlagen (Migration eingespielt?):", error.message);
    return null;
  }

  const result = data as PublicMemorial | null;
  if (!result?.memorial) return null;
  return { memorial: result.memorial, photos: result.photos ?? [] };
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const result = await loadPublicMemorial(slug);

  // Nicht indexieren (Etappe B, Masterplan 28.08.). Hier stehen Klarnamen,
  // Geburts- und Sterbedaten realer Verstorbener. Wer den QR-Code am Grabstein
  // scannt, soll die Seite finden — eine Suchmaschine soll sie nicht auffindbar
  // machen. Gilt auch für die Nicht-gefunden-Fassung, damit Suchmaschinen keine
  // Kurznamen durchprobieren.
  const robots = { index: false, follow: false, nocache: true };

  if (!result) return { title: "Nicht gefunden", robots };

  const { memorial } = result;
  return {
    title: memorial.name,
    description: memorial.description ?? `Gedenkprofil für ${memorial.name}`,
    robots,
  };
}

export default async function SpiritLinkPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const result = await loadPublicMemorial(slug);

  if (!result) notFound();

  const { memorial, photos } = result;

  // Fotos liegen im privaten Bucket (Migration 20260923_fotospeicher_privat). Signiert wird
  // mit demselben Client wie oben — also mit dem anon-Schlüssel (oder dem des angemeldeten
  // Besuchers), NICHT mit dem Service-Role-Key. Ob das Signieren erlaubt ist, entscheidet
  // die Storage-RLS: nur Dateien öffentlicher Gedenkprofile. Ein privat geschaltetes Profil
  // gibt ab dem Moment keine Fotoadressen mehr her, ganz gleich wer fragt.
  const supabase = await createClient();
  const signed = await signPhotoPaths(supabase, [
    memorial.profile_photo_path,
    ...photos.map((p) => p.path),
  ]);
  const profilePhotoUrl = memorial.profile_photo_path
    ? signed.get(memorial.profile_photo_path) ?? null
    : null;
  const galleryPhotos = photos.flatMap((p) => {
    const url = signed.get(p.path);
    return url ? [{ id: p.id, url, caption: p.caption }] : [];
  });

  return (
    <div
      className="min-h-screen text-on-surface"
      style={{
        background:
          "radial-gradient(ellipse at 50% 0%, var(--color-card) 0%, var(--color-background) 60%)",
      }}
    >
      {/* Leiser, sakraler Hintergrund (CD-Naturbild kann hier später als Layer ergänzt werden) */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[600px] h-[400px] golden-glow animate-glow-pulse" />
        <div className="absolute bottom-[10%] left-[8%] w-72 h-72 bg-tertiary-container/5 rounded-full blur-[120px]" />
      </div>

      <main className="relative pt-16 lg:pt-24 pb-20 px-6 max-w-md lg:max-w-3xl mx-auto">
        {/* Profile section */}
        <section className="flex flex-col items-center text-center mb-14 lg:mb-20">
          {/* Photo with gold ring */}
          <div className="relative w-[150px] h-[150px] lg:w-[180px] lg:h-[180px] mb-8">
            <div className="absolute -inset-1.5 rounded-full border-2 border-primary/50 shadow-[0_0_40px_rgba(242,202,80,0.15)]" />
            {profilePhotoUrl ? (
              <Image
                src={profilePhotoUrl}
                alt={memorial.name}
                width={180}
                height={180}
                className="w-full h-full rounded-full object-cover relative z-10"
              />
            ) : (
              <div className="w-full h-full rounded-full bg-surface-container-high flex items-center justify-center relative z-10">
                <span
                  className="material-symbols-outlined text-primary/70"
                  style={{ fontSize: "56px", fontVariationSettings: "'wght' 200" }}
                  aria-hidden="true"
                >
                  {memorial.type === "animal" ? "pets" : "potted_plant"}
                </span>
              </div>
            )}
          </div>

          {/* Name */}
          <h1 className="font-headline text-4xl lg:text-5xl font-light text-on-surface tracking-tight mb-3">
            {memorial.name}
          </h1>

          {/* Lifespan */}
          {(memorial.birth_date || memorial.death_date) && (
            <p className="font-label text-sm uppercase tracking-[0.2em] text-primary/80 mb-8">
              {formatLifespan(memorial.birth_date, memorial.death_date)}
            </p>
          )}

          {/* Ornament divider */}
          <div className="flex items-center w-full max-w-[220px] gap-4 mb-8" aria-hidden="true">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-primary/30" />
            <span className="material-symbols-outlined text-primary/60 text-base">potted_plant</span>
            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-primary/30" />
          </div>

          {/* Quote / description */}
          {memorial.description && (
            <p className="font-headline italic text-on-surface-variant leading-relaxed text-lg lg:text-xl px-2 max-w-xl">
              &bdquo;{memorial.description}&ldquo;
            </p>
          )}
        </section>

        {/* Biography */}
        {memorial.biography && (
          <section className="mb-14 lg:mb-20 max-w-2xl mx-auto">
            <p className="text-center font-label text-[10px] uppercase tracking-[0.2em] text-on-surface-variant/70 mb-2">
              Lebensgeschichte
            </p>
            <h2 className="font-headline text-xl lg:text-2xl text-on-surface mb-6 text-center">
              Biografie
            </h2>
            <div className="bg-surface-container-low/80 p-6 lg:p-8 rounded-card border border-outline-variant/30 font-body text-on-surface-variant text-sm lg:text-base leading-relaxed whitespace-pre-line">
              {memorial.biography}
            </div>
          </section>
        )}

        {/* Photo gallery */}
        {galleryPhotos.length > 0 && (
          <section className="mb-16 lg:mb-20">
            <p className="text-center font-label text-[10px] uppercase tracking-[0.2em] text-on-surface-variant/70 mb-2">
              Erinnerungen
            </p>
            <h2 className="font-headline text-xl lg:text-2xl text-on-surface mb-6 text-center">
              Fotos
            </h2>
            <LightboxGallery photos={galleryPhotos} variant="strip" />
          </section>
        )}

        {/* Footer */}
        <footer className="mt-12 flex flex-col items-center border-t border-outline-variant/30 pt-12 pb-8">
          <p className="flex items-center gap-1.5 mb-6">
            <span className="font-body text-xs text-on-surface-variant/70">Erstellt mit</span>
            <span
              className="material-symbols-outlined text-primary text-sm"
              style={{ fontVariationSettings: "'FILL' 1" }}
              aria-hidden="true"
            >
              auto_awesome
            </span>
            <span className="font-headline italic text-sm text-primary">Aethernal</span>
          </p>
          <a
            href="https://aethernal.me"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block py-3.5 px-10 rounded-full gold-gradient text-on-primary font-label font-semibold text-sm tracking-wide shadow-lg shadow-primary/20 hover:brightness-110 active:scale-95 transition-all duration-250 ease-out"
          >
            Eigenes Gedenkprofil erstellen
          </a>
          {/* Pflichtangaben: Das hier ist eine oeffentlich abrufbare Seite. */}
          <nav className="mt-10 flex items-center gap-4">
            <a
              href="https://aethernal.me/impressum.html"
              className="font-label text-[11px] text-on-surface-variant/70 hover:text-primary underline underline-offset-4 transition-colors"
            >
              Impressum
            </a>
            <span className="text-on-surface-variant/30" aria-hidden="true">·</span>
            <a
              href="https://aethernal.me/datenschutz.html"
              className="font-label text-[11px] text-on-surface-variant/70 hover:text-primary underline underline-offset-4 transition-colors"
            >
              Datenschutz
            </a>
          </nav>
          <p className="mt-6 font-label text-[9px] text-on-surface-variant/60 tracking-[0.2em] uppercase">
            Ewige Erinnerung
          </p>
        </footer>
      </main>
    </div>
  );
}
