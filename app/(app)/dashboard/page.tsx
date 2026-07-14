import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { Memorial, Profile, Reminder } from "@/lib/types";
import Link from "next/link";
import MemorialCard from "@/components/memorial-card";
import ReminderTimeline from "@/components/reminder-timeline";
import EmptyState from "@/components/empty-state";

export const metadata = { title: "Dashboard" };

const QUICK_ACTIONS = [
  { href: "/tagebuch", icon: "menu_book", label: "Tagebuch" },
  { href: "/nachrichten", icon: "mail", label: "Nachrichten" },
  { href: "/termine", icon: "event", label: "Termine" },
];

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
  const memorialCount = memorials?.length ?? 0;

  return (
    <div className="min-h-screen">
      <div className="px-6 py-8 max-w-lg mx-auto lg:max-w-[1200px] lg:px-8 xl:px-12 xl:py-12">
        {/* Greeting */}
        <section className="mb-10 lg:mb-12">
          <h2 className="font-headline text-4xl lg:text-6xl font-bold text-on-surface mb-3 tracking-tight">
            Hallo{firstName ? `, ${firstName}` : ""}
          </h2>
          <p className="text-on-surface-variant font-body text-base lg:text-xl">
            Du hast {memorialCount}{" "}
            {memorialCount === 1 ? "aktives Gedenkprofil" : "aktive Gedenkprofile"}.
          </p>
        </section>

        <div className="lg:grid lg:grid-cols-12 lg:gap-8">
          {/* Left column: Memorials + Schnellzugriff */}
          <div className="lg:col-span-8 space-y-12 lg:space-y-10">
            {memorials && memorials.length > 0 ? (
              <section
                aria-label="Gedenkprofile"
                className="flex overflow-x-auto gap-4 pb-4 hide-scrollbar -mx-6 px-6 snap-x snap-mandatory lg:grid lg:grid-cols-2 lg:gap-8 lg:overflow-visible lg:mx-0 lg:px-0 lg:pb-0"
              >
                {memorials.map((m) => (
                  <div key={m.id} className="w-[280px] shrink-0 snap-start lg:w-auto">
                    <MemorialCard memorial={m} diaryCount={diaryCountMap[m.id] || 0} />
                  </div>
                ))}
              </section>
            ) : (
              <EmptyState
                title="Noch keine Gedenkprofile"
                description="Erstelle dein erstes Gedenkprofil, um die Erinnerung an einen geliebten Menschen oder ein geliebtes Tier zu bewahren."
                actionHref="/memorial/new"
                actionLabel="Erstes Gedenkprofil erstellen"
              />
            )}

            {/* Schnellzugriff */}
            <section
              aria-label="Schnellzugriff"
              className="lg:bg-card lg:rounded-card lg:border lg:border-outline-variant/30 lg:p-6 lg:flex lg:items-center lg:gap-4"
            >
              <span className="hidden lg:block font-headline text-lg text-on-surface-variant shrink-0">
                Schnellzugriff
              </span>
              <div className="grid grid-cols-4 gap-3 lg:flex lg:flex-wrap lg:justify-end lg:flex-1">
                {QUICK_ACTIONS.map((a) => (
                  <Link
                    key={a.href}
                    href={a.href}
                    className="flex flex-col lg:flex-row items-center justify-center gap-2 p-3 lg:px-4 lg:py-3 rounded-button bg-card lg:bg-surface-container hover:bg-surface-container-high transition-colors duration-250 ease-out text-[11px] lg:text-sm font-medium text-on-surface-variant hover:text-on-surface"
                  >
                    <span className="material-symbols-outlined text-primary lg:text-lg" aria-hidden="true">
                      {a.icon}
                    </span>
                    {a.label}
                  </Link>
                ))}
                <Link
                  href="/memorial/new"
                  className="flex flex-col lg:flex-row items-center justify-center gap-2 p-3 lg:px-5 lg:py-3 rounded-button bg-primary text-on-primary font-bold text-[11px] lg:text-sm hover:brightness-110 active:scale-[.98] transition-all duration-250 ease-out shadow-lg shadow-primary/10"
                >
                  <span className="material-symbols-outlined lg:text-lg" aria-hidden="true">
                    auto_awesome
                  </span>
                  Neues Profil
                </Link>
              </div>
            </section>
          </div>

          {/* Right column: Termine */}
          <div className="lg:col-span-4 mt-12 lg:mt-0">
            <div className="lg:bg-card lg:rounded-card lg:border lg:border-outline-variant/30 lg:p-8 lg:sticky lg:top-8 lg:shadow-2xl">
              <h3 className="font-headline text-xl lg:text-2xl text-on-surface mb-6 lg:mb-8 flex items-center gap-3">
                <span className="material-symbols-outlined text-primary text-2xl lg:text-3xl" aria-hidden="true">
                  calendar_month
                </span>
                Nächste Termine
              </h3>
              <ReminderTimeline reminders={upcomingReminders ?? []} />
              <div className="mt-8 lg:mt-10 pt-6 lg:pt-8 border-t border-outline-variant/30">
                <Link
                  href="/termine"
                  className="w-full py-3.5 lg:py-4 rounded-button border border-primary/30 text-primary font-semibold text-sm hover:bg-primary/5 transition-colors duration-250 ease-out block text-center"
                >
                  Alle Termine ansehen
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FAB - Neues Gedenkprofil */}
      <Link
        href="/memorial/new"
        aria-label="Neues Gedenkprofil erstellen"
        className="fixed bottom-24 lg:bottom-12 right-6 lg:right-12 w-14 h-14 lg:w-20 lg:h-20 bg-primary text-on-primary rounded-full shadow-2xl shadow-primary/20 flex items-center justify-center hover:scale-110 active:scale-95 transition-transform duration-250 ease-out group z-40"
      >
        <span
          className="material-symbols-outlined text-3xl lg:text-4xl group-hover:rotate-90 transition-transform duration-400"
          aria-hidden="true"
        >
          add
        </span>
      </Link>
    </div>
  );
}
