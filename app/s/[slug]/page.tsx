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
    <div className="min-h-screen bg-[#fafaf7]">
      {/* Header */}
      <header className="bg-violet text-white py-4 px-6">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <span className="font-serif text-xl font-light tracking-wide">
            Aethernal
          </span>
          <span className="text-xs text-lavender/60">SpiritLink</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 lg:px-8 py-10 lg:py-16">
        {/* Profile header */}
        <div className="text-center mb-12">
          {memorial.profile_photo_url ? (
            <Image
              src={memorial.profile_photo_url}
              alt={memorial.name}
              width={112}
              height={112}
              className="w-28 h-28 rounded-full object-cover border-4 border-lavender mx-auto mb-6"
            />
          ) : (
            <div className="w-28 h-28 rounded-full bg-lavender flex items-center justify-center text-5xl mx-auto mb-6">
              {memorial.type === "animal" ? "🐾" : "🕊️"}
            </div>
          )}

          <h1 className="text-4xl font-serif font-semibold text-violet">
            {memorial.name}
          </h1>

          {(memorial.birth_date || memorial.death_date) && (
            <p className="mt-2 text-lg text-aether-gray">
              {formatLifespan(memorial.birth_date, memorial.death_date)}
            </p>
          )}

          {memorial.description && (
            <p className="mt-4 text-aether-text max-w-lg mx-auto leading-relaxed">
              {memorial.description}
            </p>
          )}
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4 mb-12">
          <div className="flex-1 h-px bg-lavender-dark" />
          <span className="text-amber text-lg">✦</span>
          <div className="flex-1 h-px bg-lavender-dark" />
        </div>

        {/* Biography */}
        {memorial.biography && (
          <section className="mb-12">
            <h2 className="text-2xl font-serif font-semibold text-violet mb-4 text-center">
              Biografie
            </h2>
            <div className="bg-white rounded-2xl border border-lavender-dark p-8 text-aether-text leading-relaxed whitespace-pre-line">
              {memorial.biography}
            </div>
          </section>
        )}

        {/* Photo gallery */}
        {photos && photos.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-serif font-semibold text-violet mb-4 text-center">
              Erinnerungen
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {photos.map((photo) => (
                <div
                  key={photo.id}
                  className="relative aspect-square rounded-xl overflow-hidden bg-lavender"
                >
                  <Image
                    src={photo.url}
                    alt={photo.caption ?? ""}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 50vw, 33vw"
                  />
                  {photo.caption && (
                    <p className="text-xs text-aether-gray mt-1 text-center px-1">
                      {photo.caption}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Footer */}
        <footer className="text-center pt-8 border-t border-lavender-dark">
          <p className="text-sm text-aether-gray">
            Erstellt mit{" "}
            <a
              href="https://aethernal.me"
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber hover:text-amber-dark transition font-medium"
            >
              Aethernal
            </a>
          </p>
          <p className="text-xs text-aether-gray/60 mt-1">
            Erinnerungen, die bleiben.
          </p>
        </footer>
      </main>
    </div>
  );
}
