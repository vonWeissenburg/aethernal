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
      className="min-h-screen text-text-primary"
      style={{
        background: "radial-gradient(circle at top center, #1a1e30 0%, #11131d 100%)",
      }}
    >
      {/* Material Symbols font */}
      <link
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
        rel="stylesheet"
      />

      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-bg-primary/60 backdrop-blur-xl flex items-center justify-center px-6 h-16">
        <h1 className="text-xl font-serif italic text-gold-light tracking-wide">
          Aethernal SpiritLink
        </h1>
      </header>

      <main className="pt-24 pb-20 px-6 max-w-md mx-auto">
        {/* Profile Section */}
        <section className="flex flex-col items-center text-center mb-12">
          <div className="relative w-[150px] h-[150px] mb-6">
            <div className="absolute inset-0 rounded-full border-[3px] border-gold/60 scale-105 shadow-[0_0_20px_rgba(212,175,55,0.15)]" />
            {memorial.profile_photo_url ? (
              <Image
                src={memorial.profile_photo_url}
                alt={memorial.name}
                width={150}
                height={150}
                className="w-full h-full rounded-full object-cover border-2 border-gold relative z-10"
              />
            ) : (
              <div className="w-full h-full rounded-full bg-surface-container-high flex items-center justify-center text-6xl relative z-10 border-2 border-gold">
                {memorial.type === "animal" ? "🐾" : "🕊️"}
              </div>
            )}
          </div>

          <h2 className="font-serif text-4xl font-light text-text-primary mb-2 tracking-tight">
            {memorial.name}
          </h2>

          {(memorial.birth_date || memorial.death_date) && (
            <p className="text-sm uppercase tracking-[0.15rem] text-gold/80 mb-8">
              {formatLifespan(memorial.birth_date, memorial.death_date)}
            </p>
          )}

          {/* Decorative Divider */}
          <div className="flex items-center w-full max-w-[220px] gap-4 mb-8">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-gold/30" />
            <span className="text-gold text-sm">✦</span>
            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-gold/30" />
          </div>

          {memorial.description && (
            <p className="font-serif italic text-text-secondary leading-relaxed text-lg px-2">
              &bdquo;{memorial.description}&ldquo;
            </p>
          )}
        </section>

        {/* Biography */}
        {memorial.biography && (
          <section className="mb-12">
            <h3 className="font-serif text-xl text-gold-dim mb-4 text-center">
              Biografie
            </h3>
            <div className="bg-surface-container-low p-6 rounded-xl border-l-2 border-gold/40 text-text-secondary text-sm leading-relaxed whitespace-pre-line">
              {memorial.biography}
            </div>
          </section>
        )}

        {/* Photo gallery */}
        {photos && photos.length > 0 && (
          <section className="mb-14">
            <h3 className="font-serif text-xl text-gold-dim mb-4">Fotos</h3>
            <div className="flex overflow-x-auto gap-4 pb-4 -mx-6 px-6 hide-scrollbar">
              {photos.map((photo) => (
                <div
                  key={photo.id}
                  className="flex-shrink-0 w-48 aspect-[3/4] rounded-lg overflow-hidden bg-surface-container shadow-xl"
                >
                  <Image
                    src={photo.url}
                    alt={photo.caption ?? ""}
                    width={192}
                    height={256}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Footer */}
        <footer className="mt-12 flex flex-col items-center border-t border-outline-variant/5 pt-12 pb-8">
          <div className="flex items-center gap-2 mb-6 opacity-80">
            <span className="font-serif italic text-xs text-gold-light tracking-wide">
              Erstellt mit Aethernal
            </span>
          </div>
          <a
            href="https://aethernal.me"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block py-3.5 px-10 rounded-full bg-gold text-bg-primary font-medium text-sm tracking-wide shadow-lg hover:brightness-110 transition-all active:scale-95"
          >
            Eigenes Gedenkprofil erstellen
          </a>
          <p className="mt-10 text-[9px] text-text-secondary/30 tracking-[0.2em] uppercase">
            Erinnerungen f&uuml;r die Ewigkeit
          </p>
        </footer>
      </main>
    </div>
  );
}
