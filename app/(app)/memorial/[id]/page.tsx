import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { formatDate, formatLifespan } from "@/lib/utils";
import type { Memorial, MemorialPhoto, DiaryEntry } from "@/lib/types";
import Link from "next/link";

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

  return (
    <div className="max-w-4xl mx-auto px-4 lg:px-8 py-8 lg:py-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-6 mb-10">
        {memorial.profile_photo_url ? (
          <img
            src={memorial.profile_photo_url}
            alt={memorial.name}
            className="w-24 h-24 rounded-full object-cover border-4 border-lavender"
          />
        ) : (
          <div className="w-24 h-24 rounded-full bg-lavender flex items-center justify-center text-4xl">
            {memorial.type === "animal" ? "🐾" : "🕊️"}
          </div>
        )}

        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-serif font-semibold text-violet">
                {memorial.name}
              </h1>
              {(memorial.birth_date || memorial.death_date) && (
                <p className="text-aether-gray mt-1">
                  {formatLifespan(memorial.birth_date, memorial.death_date)}
                </p>
              )}
            </div>
            <Link
              href={`/memorial/${id}/edit`}
              className="rounded-lg border border-violet/20 bg-white px-4 py-2 text-sm font-medium text-violet hover:bg-lavender transition"
            >
              Bearbeiten
            </Link>
          </div>

          {memorial.description && (
            <p className="mt-3 text-aether-text leading-relaxed">
              {memorial.description}
            </p>
          )}

          <div className="flex gap-3 mt-4">
            <span
              className={`text-xs px-2.5 py-1 rounded-full ${
                memorial.is_public
                  ? "bg-green-50 text-green-700"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {memorial.is_public ? "Öffentlich" : "Privat"}
            </span>
            {memorial.is_public && (
              <a
                href={`${process.env.NEXT_PUBLIC_APP_URL}/s/${memorial.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-amber hover:text-amber-dark underline"
              >
                SpiritLink öffnen
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Biography */}
      {memorial.biography && (
        <section className="mb-10">
          <h2 className="text-xl font-serif font-semibold text-violet mb-4">
            Biografie
          </h2>
          <div className="bg-white rounded-xl border border-lavender-dark p-6 prose prose-sm max-w-none text-aether-text whitespace-pre-line">
            {memorial.biography}
          </div>
        </section>
      )}

      {/* Photo gallery */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-serif font-semibold text-violet">
            Fotos
          </h2>
          <Link
            href={`/memorial/${id}/edit#fotos`}
            className="text-sm text-amber hover:text-amber-dark transition"
          >
            Fotos verwalten
          </Link>
        </div>

        {photos && photos.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {photos.map((photo) => (
              <div
                key={photo.id}
                className="aspect-square rounded-lg overflow-hidden bg-lavender"
              >
                <img
                  src={photo.url}
                  alt={photo.caption ?? ""}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border-2 border-dashed border-lavender-dark p-8 text-center">
            <p className="text-sm text-aether-gray">
              Noch keine Fotos hochgeladen.
            </p>
          </div>
        )}
      </section>

      {/* Recent diary entries */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-serif font-semibold text-violet">
            Tagebuch
          </h2>
          <Link
            href={`/tagebuch/neu?memorial=${id}`}
            className="text-sm text-amber hover:text-amber-dark transition"
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
                className="block bg-white rounded-xl border border-lavender-dark p-5 hover:shadow-sm hover:border-violet/20 transition"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-violet">
                    {entry.title ?? "Ohne Titel"}
                  </h3>
                  <span className="text-xs text-aether-gray">
                    {formatDate(entry.entry_date)}
                  </span>
                </div>
                <p className="text-sm text-aether-gray line-clamp-2">
                  {entry.content}
                </p>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border-2 border-dashed border-lavender-dark p-8 text-center">
            <p className="text-sm text-aether-gray">
              Noch keine Tagebucheinträge.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
