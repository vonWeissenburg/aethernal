import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getGreeting, formatLifespan } from "@/lib/utils";
import type { Memorial, Profile } from "@/lib/types";
import Link from "next/link";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single<Profile>();

  // Redirect to onboarding if not done
  if (profile && !profile.onboarding_done) {
    redirect("/onboarding");
  }

  const { data: memorials } = await supabase
    .from("memorials")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .returns<Memorial[]>();

  const firstName = profile?.full_name?.split(" ")[0] ?? "";

  return (
    <div className="max-w-5xl mx-auto px-4 lg:px-8 py-8 lg:py-12">
      {/* Greeting */}
      <div className="mb-10">
        <h1 className="text-3xl font-serif font-semibold text-violet">
          {getGreeting()}
          {firstName ? `, ${firstName}` : ""}
        </h1>
        <p className="mt-2 text-aether-gray">
          Verwalte deine Gedenkprofile und halte Erinnerungen lebendig.
        </p>
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-3 mb-10">
        <Link
          href="/memorial/new"
          className="inline-flex items-center gap-2 rounded-lg bg-violet px-5 py-2.5 text-sm font-medium text-white hover:bg-violet-light transition shadow-sm"
        >
          <span className="text-lg">+</span>
          Neues Gedenkprofil
        </Link>
        <Link
          href="/tagebuch/neu"
          className="inline-flex items-center gap-2 rounded-lg border border-violet/20 bg-white px-5 py-2.5 text-sm font-medium text-violet hover:bg-lavender transition"
        >
          Tagebucheintrag schreiben
        </Link>
      </div>

      {/* Memorial cards */}
      {memorials && memorials.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {memorials.map((m) => (
            <Link
              key={m.id}
              href={`/memorial/${m.id}`}
              className="group rounded-xl border border-lavender-dark bg-white p-5 hover:shadow-md hover:border-violet/30 transition"
            >
              <div className="flex items-start gap-4">
                {m.profile_photo_url ? (
                  <img
                    src={m.profile_photo_url}
                    alt={m.name}
                    className="w-14 h-14 rounded-full object-cover border-2 border-lavender"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-lavender flex items-center justify-center text-xl">
                    {m.type === "animal" ? "🐾" : "🕊️"}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-serif text-lg font-semibold text-violet group-hover:text-violet-light transition truncate">
                    {m.name}
                  </h3>
                  {(m.birth_date || m.death_date) && (
                    <p className="text-sm text-aether-gray mt-0.5">
                      {formatLifespan(m.birth_date, m.death_date)}
                    </p>
                  )}
                  {m.description && (
                    <p className="text-sm text-aether-gray mt-1.5 line-clamp-2">
                      {m.description}
                    </p>
                  )}
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    m.is_public
                      ? "bg-green-50 text-green-700"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {m.is_public ? "Öffentlich" : "Privat"}
                </span>
                {m.is_public && m.slug && (
                  <span className="text-xs text-amber">
                    SpiritLink aktiv
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border-2 border-dashed border-lavender-dark bg-white p-12 text-center">
          <div className="text-4xl mb-4">🕊️</div>
          <h3 className="text-lg font-serif font-semibold text-violet mb-2">
            Noch keine Gedenkprofile
          </h3>
          <p className="text-sm text-aether-gray mb-6 max-w-md mx-auto">
            Erstelle dein erstes Gedenkprofil, um die Erinnerung an einen
            geliebten Menschen oder ein Tier zu bewahren.
          </p>
          <Link
            href="/memorial/new"
            className="inline-flex items-center gap-2 rounded-lg bg-violet px-6 py-2.5 text-sm font-medium text-white hover:bg-violet-light transition shadow-sm"
          >
            Erstes Gedenkprofil erstellen
          </Link>
        </div>
      )}
    </div>
  );
}
