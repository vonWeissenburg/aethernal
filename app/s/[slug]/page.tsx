import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { formatLifespan } from "@/lib/utils";
import type { Memorial, MemorialPhoto } from "@/lib/types";
import Image from "next/image";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("memorials")
    .select("name, description")
    .eq("slug", slug)
    .eq("is_public", true)
    .single();

  if (!data) return { title: "Nicht gefunden" };

  return {
    title: data.name,
    description: data.description ?? `Gedenkprofil für ${data.name}`,
  };
}

export default async function SpiritLinkPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: memorial } = await supabase
    .from("memorials")
    .select("*")
    .eq("slug", slug)
    .eq("is_public", true)
    .single<Memorial>();

  if (!memorial) notFound();

  const { data: photos } = await supabase
    .from("memorial_photos")
    .select("*")
    .eq("memorial_id", memorial.id)
    .order("order_index")
    .returns<MemorialPhoto[]>();

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
            {memorial.profile_photo_url ? (
              <Image
                src={memorial.profile_photo_url}
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
        {photos && photos.length > 0 && (
          <section className="mb-16 lg:mb-20">
            <p className="text-center font-label text-[10px] uppercase tracking-[0.2em] text-on-surface-variant/70 mb-2">
              Erinnerungen
            </p>
            <h2 className="font-headline text-xl lg:text-2xl text-on-surface mb-6 text-center">
              Fotos
            </h2>
            <div className="flex overflow-x-auto gap-4 pb-4 -mx-6 px-6 hide-scrollbar lg:grid lg:grid-cols-3 lg:overflow-visible lg:mx-0 lg:px-0 lg:pb-0">
              {photos.map((photo) => (
                <figure
                  key={photo.id}
                  className="group relative flex-shrink-0 w-48 lg:w-auto aspect-[3/4] rounded-card overflow-hidden bg-surface shadow-xl"
                >
                  <Image
                    src={photo.url}
                    alt={photo.caption ?? ""}
                    width={320}
                    height={427}
                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-[filter] duration-400 ease-out"
                  />
                  {photo.caption && (
                    <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-3 pt-6 pb-2 text-[11px] font-body text-white/90">
                      {photo.caption}
                    </figcaption>
                  )}
                </figure>
              ))}
            </div>
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
          <p className="mt-10 font-label text-[9px] text-on-surface-variant/60 tracking-[0.2em] uppercase">
            Ewige Erinnerung
          </p>
        </footer>
      </main>
    </div>
  );
}
