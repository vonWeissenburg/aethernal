import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { formatLifespan } from "@/lib/utils";
import type { Memorial, Profile, Reminder } from "@/lib/types";
import { REMINDER_TYPE_ICONS } from "@/lib/types";
import Link from "next/link";
import Image from "next/image";

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

  if (profile && !profile.onboarding_done) {
    redirect("/onboarding");
  }

  const { data: memorials } = await supabase
    .from("memorials")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .returns<Memorial[]>();

  const { data: upcomingReminders } = await supabase
    .from("reminders")
    .select("id, title, reminder_date, reminder_type, description")
    .eq("user_id", user.id)
    .gte("reminder_date", new Date().toISOString().split("T")[0])
    .order("reminder_date", { ascending: true })
    .limit(3)
    .returns<Pick<Reminder, "id" | "title" | "reminder_date" | "reminder_type" | "description">[]>();

  // Count diary entries per memorial
  const { data: diaryCounts } = await supabase
    .from("diary_entries")
    .select("memorial_id")
    .eq("user_id", user.id);

  const diaryCountMap: Record<string, number> = {};
  diaryCounts?.forEach((d) => {
    diaryCountMap[d.memorial_id] = (diaryCountMap[d.memorial_id] || 0) + 1;
  });

  const firstName = profile?.full_name?.split(" ")[0] ?? "";

  return (
    <div className="min-h-screen">
      {/* ===== Desktop Layout ===== */}
      <div className="hidden lg:block">
        <div className="p-8 xl:p-12 max-w-[1200px] mx-auto">
          {/* Greeting */}
          <section className="mb-10">
            <h2 className="font-headline text-5xl font-bold text-on-surface mb-3 tracking-tight">
              Hallo{firstName ? `, ${firstName}` : ""}
            </h2>
            <p className="text-slate-400 font-body text-xl">
              Du hast {memorials?.length ?? 0} aktive Gedenkprofile.
            </p>
          </section>

          <div className="grid grid-cols-12 gap-8">
            {/* Left Column */}
            <div className="col-span-8 space-y-10">
              {/* Memorial Profile Cards */}
              {memorials && memorials.length > 0 ? (
                <div className="grid grid-cols-2 gap-8">
                  {memorials.map((m, i) => (
                    <Link
                      key={m.id}
                      href={`/memorial/${m.id}`}
                      className={`bg-card group relative p-8 rounded-xl hover:bg-card-hover transition-all duration-500 cursor-pointer shadow-xl ${
                        i === 0 ? "border-l-4 border-primary/60" : "border-l-4 border-slate-700"
                      }`}
                    >
                      <div className="flex justify-between items-start mb-8">
                        <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-primary/20">
                          {m.profile_photo_url ? (
                            <Image
                              src={m.profile_photo_url}
                              alt={m.name}
                              width={80}
                              height={80}
                              className="w-full h-full object-cover grayscale"
                            />
                          ) : (
                            <div className="w-full h-full bg-background flex items-center justify-center">
                              <span className="material-symbols-outlined text-primary text-3xl">
                                {m.type === "animal" ? "pets" : "raven"}
                              </span>
                            </div>
                          )}
                        </div>
                        <span className={`text-[10px] tracking-[0.2em] uppercase font-bold px-3 py-1.5 rounded-full ${
                          m.is_public ? "text-primary bg-primary/10" : "text-slate-500 bg-white/5"
                        }`}>
                          {m.is_public ? "Aktiv" : "Privat"}
                        </span>
                      </div>
                      <h3 className="font-headline text-3xl text-on-surface mb-1.5">{m.name}</h3>
                      <p className="text-slate-500 text-base font-body mb-8">
                        {formatLifespan(m.birth_date, m.death_date) || "Keine Daten"}
                      </p>
                      <div className="flex items-center gap-6 text-slate-400 text-xs">
                        <span className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-sm">description</span>
                          {diaryCountMap[m.id] || 0} Einträge
                        </span>
                        <span className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-sm">visibility</span>
                          {m.is_public ? "Geteilt" : "Privat"}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="bg-card rounded-xl p-16 text-center border border-white/5">
                  <span className="material-symbols-outlined text-primary text-6xl mb-6 block" style={{ fontVariationSettings: "'wght' 200" }}>
                    raven
                  </span>
                  <h3 className="font-headline text-2xl text-on-surface mb-3">Noch keine Gedenkprofile</h3>
                  <p className="text-slate-400 mb-8 max-w-md mx-auto">
                    Erstelle dein erstes Gedenkprofil, um die Erinnerung an einen geliebten Menschen zu bewahren.
                  </p>
                  <Link
                    href="/memorial/new"
                    className="inline-flex items-center gap-2 bg-primary text-on-primary font-bold px-8 py-4 rounded-lg hover:brightness-110 transition-all shadow-lg shadow-primary/10"
                  >
                    <span className="material-symbols-outlined">add</span>
                    Erstes Gedenkprofil erstellen
                  </Link>
                </div>
              )}

              {/* Quick Actions Bar */}
              <div className="bg-card rounded-xl p-8 flex items-center justify-between border border-white/5">
                <span className="font-headline text-xl text-slate-400 pl-4">Schnellzugriff</span>
                <div className="flex gap-4">
                  <Link
                    href="/tagebuch"
                    className="flex items-center gap-2.5 px-6 py-3.5 bg-surface hover:bg-white/10 rounded-lg transition-all duration-300 font-medium text-sm border border-white/5"
                  >
                    <span className="material-symbols-outlined text-lg">menu_book</span>
                    Tagebuch
                  </Link>
                  <Link
                    href="/nachrichten"
                    className="flex items-center gap-2.5 px-6 py-3.5 bg-surface hover:bg-white/10 rounded-lg transition-all duration-300 font-medium text-sm border border-white/5"
                  >
                    <span className="material-symbols-outlined text-lg">mail</span>
                    Nachrichten
                  </Link>
                  <Link
                    href="/termine"
                    className="flex items-center gap-2.5 px-6 py-3.5 bg-surface hover:bg-white/10 rounded-lg transition-all duration-300 font-medium text-sm border border-white/5"
                  >
                    <span className="material-symbols-outlined text-lg">event</span>
                    Termine
                  </Link>
                  <Link
                    href="/memorial/new"
                    className="flex items-center gap-2.5 px-7 py-3.5 bg-primary text-on-primary rounded-lg hover:brightness-110 transition-all duration-300 font-bold text-sm shadow-lg shadow-primary/10"
                  >
                    <span className="material-symbols-outlined text-lg">auto_awesome</span>
                    Neues Profil
                  </Link>
                </div>
              </div>
            </div>

            {/* Right Column: Termine Widget */}
            <div className="col-span-4">
              <div className="bg-card rounded-xl p-8 sticky top-8 border border-white/5 shadow-2xl">
                <h3 className="font-headline text-2xl text-on-surface mb-8 flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary text-3xl">calendar_month</span>
                  Nächste Termine
                </h3>

                {upcomingReminders && upcomingReminders.length > 0 ? (
                  <div className="space-y-8">
                    {upcomingReminders.map((r, i) => {
                      const date = new Date(r.reminder_date);
                      return (
                        <div key={r.id} className={`flex gap-6 relative pl-8 border-l-2 ${i === 0 ? "border-primary/30" : "border-white/10"}`}>
                          <div className={`absolute -left-[7px] top-0 w-3 h-3 rounded-full ${i === 0 ? "bg-primary ring-8 ring-primary/5" : "bg-slate-700"}`} />
                          <div>
                            <p className={`text-xs font-bold tracking-[0.15em] mb-2 uppercase ${i === 0 ? "text-primary" : "text-slate-500"}`}>
                              {date.toLocaleDateString("de-AT", { day: "2-digit", month: "short" }).toUpperCase()}
                            </p>
                            <p className="text-on-surface text-lg font-semibold mb-2">{r.title}</p>
                            {r.description && (
                              <p className="text-slate-500 text-sm leading-relaxed">{r.description}</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-slate-500 text-sm">Keine anstehenden Termine.</p>
                )}

                <div className="mt-10 pt-8 border-t border-white/5">
                  <Link
                    href="/termine"
                    className="w-full py-4 rounded-lg border border-primary/30 text-primary font-semibold text-sm hover:bg-primary/5 transition-all block text-center"
                  >
                    Alle Termine ansehen
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== Mobile Layout ===== */}
      <div className="lg:hidden">
        <main className="pt-8 pb-8 px-6 max-w-lg mx-auto space-y-12">
          {/* Greeting */}
          <section>
            <h2 className="text-4xl font-headline font-bold text-on-surface mb-2">
              Hallo{firstName ? `, ${firstName}` : ""}
            </h2>
            <p className="text-on-surface-variant font-label tracking-wide opacity-80">
              Du hast {memorials?.length ?? 0} Gedenkprofile
            </p>
          </section>

          {/* Memorial Profile Cards - Horizontal Scroll */}
          <section>
            {memorials && memorials.length > 0 ? (
              <div className="flex overflow-x-auto gap-4 pb-4 hide-scrollbar -mx-6 px-6 snap-x snap-mandatory">
                {memorials.map((m) => (
                  <Link
                    key={m.id}
                    href={`/memorial/${m.id}`}
                    className="flex-shrink-0 w-[280px] bg-card rounded-lg p-6 border-l-4 border-primary snap-start shadow-xl"
                  >
                    <div className="flex items-center gap-4 mb-5">
                      <div className="w-16 h-16 rounded-full bg-background flex items-center justify-center overflow-hidden ring-1 ring-primary/20">
                        {m.profile_photo_url ? (
                          <Image
                            src={m.profile_photo_url}
                            alt={m.name}
                            width={64}
                            height={64}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="material-symbols-outlined text-primary text-3xl">
                            {m.type === "animal" ? "pets" : "raven"}
                          </span>
                        )}
                      </div>
                      <div>
                        <h3 className="text-xl font-headline font-bold text-on-surface">{m.name}</h3>
                        <p className="text-sm font-label text-on-surface-variant">
                          {formatLifespan(m.birth_date, m.death_date) || "—"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 bg-background rounded-full text-[11px] font-medium tracking-wider text-primary flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>menu_book</span>
                        {diaryCountMap[m.id] || 0} Tagebucheinträge
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="bg-card rounded-xl p-8 text-center border border-white/5">
                <span className="material-symbols-outlined text-primary text-5xl mb-4 block" style={{ fontVariationSettings: "'wght' 200" }}>
                  raven
                </span>
                <h3 className="font-headline text-xl text-on-surface mb-2">Noch keine Gedenkprofile</h3>
                <p className="text-on-surface-variant text-sm mb-6">
                  Erstelle dein erstes Gedenkprofil.
                </p>
                <Link
                  href="/memorial/new"
                  className="inline-flex items-center gap-2 bg-primary text-on-primary font-bold px-6 py-3 rounded-lg"
                >
                  Profil erstellen
                </Link>
              </div>
            )}
          </section>

          {/* Quick Actions Grid */}
          <section>
            <div className="grid grid-cols-4 gap-4">
              {[
                { href: "/tagebuch", icon: "book", label: "Tagebuch" },
                { href: "/nachrichten", icon: "mail", label: "Nachrichten" },
                { href: "/termine", icon: "calendar_today", label: "Termine" },
                { href: "/memorial/new", icon: "qr_code_2", label: "SpiritLink" },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex flex-col items-center gap-2 group active:scale-90 transition-all duration-300"
                >
                  <div className="w-full aspect-square rounded-lg bg-card flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                    <span className="material-symbols-outlined text-primary">{item.icon}</span>
                  </div>
                  <span className="text-[11px] font-label font-medium text-on-surface-variant">{item.label}</span>
                </Link>
              ))}
            </div>
          </section>

          {/* Upcoming Reminders */}
          {upcomingReminders && upcomingReminders.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-headline font-bold text-on-surface">Nächste Termine</h3>
                <Link href="/termine">
                  <span className="material-symbols-outlined text-on-surface-variant opacity-40">chevron_right</span>
                </Link>
              </div>
              <div className="space-y-4">
                {upcomingReminders.map((r) => {
                  const date = new Date(r.reminder_date);
                  return (
                    <Link
                      key={r.id}
                      href={`/termine/${r.id}/bearbeiten`}
                      className="bg-card p-5 rounded-lg flex items-center gap-4 hover:border-primary/30 border border-transparent transition-all cursor-pointer"
                    >
                      <div className="flex-shrink-0 w-12 text-center border-r border-outline/20 pr-4">
                        <span className="block text-lg font-bold text-primary leading-none">
                          {date.getDate()}
                        </span>
                        <span className="text-[10px] uppercase tracking-widest text-on-surface-variant">
                          {date.toLocaleDateString("de-AT", { month: "short" })}
                        </span>
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-on-surface">{r.title}</h4>
                        {r.description && (
                          <p className="text-xs text-on-surface-variant opacity-70">{r.description}</p>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}
        </main>
      </div>

      {/* FAB - New Memorial */}
      <Link
        href="/memorial/new"
        className="fixed bottom-24 lg:bottom-12 right-6 lg:right-12 w-16 h-16 lg:w-20 lg:h-20 bg-primary text-on-primary rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-300 group z-40"
      >
        <span className="material-symbols-outlined text-3xl lg:text-4xl group-hover:rotate-90 transition-transform duration-500">add</span>
      </Link>
    </div>
  );
}
