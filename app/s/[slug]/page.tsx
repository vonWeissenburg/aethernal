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
    description: data.description ?? `Gedenkprofil f\u00FCr ${data.name}`,
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
        background: "radial-gradient(ellipse at 50% 0%, #1C1F33 0%, #0B0D17 60%)",
      }}
    >
      <main className="pt-16 pb-20 px-6 max-w-md mx-auto">
        {/* Profile section */}
        <section className="flex flex-col items-center text-center mb-14">
          {/* Photo with gold ring */}
          <div className="relative w-[150px] h-[150px] mb-8">
            <div className="absolute -inset-1.5 rounded-full border-2 border-primary/50 shadow-[0_0_30px_rgba(242,202,80,0.12)]" />
            {memorial.profile_photo_url ? (
              <Image
                src={memorial.profile_photo_url}
                alt={memorial.name}
                width={150}
                height={150}
                className="w-full h-full rounded-full object-cover relative z-10"
              />
            ) : (
              <div className="w-full h-full rounded-full bg-surface-container-high flex items-center justify-center relative z-10">
                <span
                  className="material-symbols-outlined text-on-surface-variant"
                  style={{ fontSize: "56px", fontVariationSettings: "'wght' 200" }}
                >
                  {memorial.type === "animal" ? "pets" : "person"}
                </span>
              </div>
            )}
          </div>

          {/* Name */}
          <h1 className="font-headline text-4xl font-light text-on-surface tracking-tight mb-2">
            {memorial.name}
          </h1>

          {/* Lifespan */}
          {(memorial.birth_date || memorial.death_date) && (
            <p className="font-label text-sm uppercase tracking-[0.15em] text-primary/80 mb-8">
              {formatLifespan(memorial.birth_date, memorial.death_date)}
            </p>
          )}

          {/* Gold divider */}
          <div className="flex items-center w-full max-w-[200px] gap-4 mb-8">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-primary/30" />
            <span className="material-symbols-outlined text-primary text-sm">diamond</span>
            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-primary/30" />
          </div>

          {/* Quote / description */}
          {memorial.description && (
            <p className="font-headline italic text-on-surface-variant leading-relaxed text-lg px-2">
              &bdquo;{memorial.description}&ldquo;
            </p>
          )}
        </section>

        {/* Biography */}
        {memorial.biography && (
          <section className="mb-14">
            <h2 className="font-headline text-xl text-on-surface-variant mb-4 text-center">
              Biografie
            </h2>
            <div className="bg-surface-container-low p-6 rounded-2xl border-l-2 border-primary/30 font-body text-on-surface-variant text-sm leading-relaxed whitespace-pre-line">
              {memorial.biography}
            </div>
          </section>
        )}

        {/* Photo gallery - horizontal scroll */}
        {photos && photos.length > 0 && (
          <section className="mb-16">
            <h2 className="font-headline text-xl text-on-surface-variant mb-4">Fotos</h2>
            <div className="flex overflow-x-auto gap-4 pb-4 -mx-6 px-6 hide-scrollbar">
              {photos.map((photo) => (
                <div
                  key={photo.id}
                  className="flex-shrink-0 w-48 aspect-[3/4] rounded-xl overflow-hidden bg-surface shadow-xl"
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
        <footer className="mt-12 flex flex-col items-center border-t border-outline-variant/10 pt-12 pb-8">
          <p className="font-headline italic text-xs text-on-surface-variant/60 tracking-wide mb-6">
            Erstellt mit Aethernal
          </p>
          <a
            href="https://aethernal.me"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block py-3.5 px-10 rounded-full bg-primary text-on-primary font-label font-semibold text-sm tracking-wide shadow-lg hover:brightness-110 transition-all active:scale-95"
          >
            Eigenes Gedenkprofil erstellen
          </a>
          <p className="mt-10 font-label text-[9px] text-on-surface-variant/25 tracking-[0.2em] uppercase">
            Erinnerungen f&uuml;r die Ewigkeit
          </p>
        </footer>
      </main>
    </div>
  );
}
