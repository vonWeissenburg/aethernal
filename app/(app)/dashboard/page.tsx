import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getGreeting, formatLifespan } from "@/lib/utils";
import type { Memorial, Profile, Message, Reminder } from "@/lib/types";
import { STATUS_STYLES, STATUS_LABELS, REMINDER_TYPE_ICONS } from "@/lib/types";
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

  const { count: messageCount } = await supabase
    .from("messages")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .in("status", ["draft", "scheduled"]);

  const { data: draftMessages } = await supabase
    .from("messages")
    .select("id, title, recipient_name, status")
    .eq("user_id", user.id)
    .eq("status", "draft")
    .order("created_at", { ascending: false })
    .limit(3)
    .returns<Pick<Message, "id" | "title" | "recipient_name" | "status">[]>();

  const { data: upcomingReminders } = await supabase
    .from("reminders")
    .select("id, title, reminder_date, reminder_type")
    .eq("user_id", user.id)
    .gte("reminder_date", new Date().toISOString().split("T")[0])
    .order("reminder_date", { ascending: true })
    .limit(3)
    .returns<Pick<Reminder, "id" | "title" | "reminder_date" | "reminder_type">[]>();

  const { count: reminderCount } = await supabase
    .from("reminders")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  const firstName = profile?.full_name?.split(" ")[0] ?? "";

  return (
    <div className="max-w-5xl mx-auto px-4 lg:px-8 py-8 lg:py-12">
      {/* Greeting */}
      <div className="mb-10">
        <h1 className="text-3xl font-serif font-semibold text-gold-light">
          {getGreeting()}
          {firstName ? `, ${firstName}` : ""}
        </h1>
        <p className="mt-2 text-text-secondary">
          Verwalte deine Gedenkprofile und halte Erinnerungen lebendig.
        </p>
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-3 mb-10">
        <Link
          href="/memorial/new"
          className="inline-flex items-center gap-2 rounded-lg bg-gold px-5 py-3 text-sm font-semibold text-bg-primary hover:brightness-110 transition shadow-sm"
        >
          <span className="text-lg">+</span>
          Neues Gedenkprofil
        </Link>
        <Link
          href="/nachrichten/neu"
          className="inline-flex items-center gap-2 rounded-lg bg-gold px-5 py-2.5 text-sm font-medium text-bg-primary hover:brightness-110 transition shadow-sm"
        >
          💌 Nachricht planen
        </Link>
        <Link
          href="/tagebuch/neu"
          className="inline-flex items-center gap-2 rounded-lg border border-gold/20 bg-bg-card px-5 py-2.5 text-sm font-medium text-gold-light hover:bg-surface-container-high transition"
        >
          Tagebucheintrag schreiben
        </Link>
      </div>

      {/* Stats */}
      <div className="flex flex-wrap gap-4 mb-10">
        <div className="rounded-xl bg-bg-card border border-border-card px-5 py-3">
          <p className="text-2xl font-serif font-semibold text-gold-light">
            {memorials?.length ?? 0}
          </p>
          <p className="text-xs text-text-secondary">Gedenkprofile</p>
        </div>
        <div className="rounded-xl bg-bg-card border border-border-card px-5 py-3">
          <p className="text-2xl font-serif font-semibold text-gold-light">
            {messageCount ?? 0}
          </p>
          <p className="text-xs text-text-secondary">Nachrichten geplant</p>
        </div>
        <div className="rounded-xl bg-bg-card border border-border-card px-5 py-3">
          <p className="text-2xl font-serif font-semibold text-gold-light">
            {reminderCount ?? 0}
          </p>
          <p className="text-xs text-text-secondary">Termine</p>
        </div>
      </div>

      {/* Widgets */}
      <div className="grid gap-6 sm:grid-cols-2 mb-10">
        {/* Draft messages */}
        {draftMessages && draftMessages.length > 0 && (
          <div className="rounded-xl bg-surface-container-high border-none p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-serif text-base font-semibold text-gold-light">
                💌 Nachrichten-Entwürfe
              </h3>
              <Link href="/nachrichten" className="text-xs text-gold-light hover:text-gold">
                Alle →
              </Link>
            </div>
            <div className="space-y-2">
              {draftMessages.map((m) => (
                <Link
                  key={m.id}
                  href={`/nachrichten/${m.id}/bearbeiten`}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition"
                >
                  <div className="min-w-0">
                    <p className="text-sm text-gold-light truncate">{m.title}</p>
                    <p className="text-xs text-text-secondary">An {m.recipient_name}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${STATUS_STYLES.draft}`}>
                    {STATUS_LABELS.draft}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Upcoming reminders */}
        {upcomingReminders && upcomingReminders.length > 0 && (
          <div className="rounded-xl bg-surface-container-high border-none p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-serif text-base font-semibold text-gold-light">
                📅 Anstehende Termine
              </h3>
              <Link href="/termine" className="text-xs text-gold-light hover:text-gold">
                Alle →
              </Link>
            </div>
            <div className="space-y-2">
              {upcomingReminders.map((r) => (
                <Link
                  key={r.id}
                  href={`/termine/${r.id}/bearbeiten`}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span>{REMINDER_TYPE_ICONS[r.reminder_type]}</span>
                    <p className="text-sm text-gold-light truncate">{r.title}</p>
                  </div>
                  <span className="text-xs text-text-secondary shrink-0">
                    {new Date(r.reminder_date).toLocaleDateString("de-AT", {
                      day: "numeric",
                      month: "short",
                    })}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Memorial cards */}
      {memorials && memorials.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {memorials.map((m) => (
            <Link
              key={m.id}
              href={`/memorial/${m.id}`}
              className="group rounded-xl bg-surface-container-high border-none p-5 hover:bg-bg-card-hover transition"
            >
              <div className="flex items-start gap-4">
                {m.profile_photo_url ? (
                  <Image
                    src={m.profile_photo_url}
                    alt={m.name}
                    width={56}
                    height={56}
                    className="w-14 h-14 rounded-full object-cover border-2 border-border-card"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-surface-container-high flex items-center justify-center text-xl">
                    {m.type === "animal" ? "🐾" : "🕊️"}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-serif text-lg font-semibold text-gold-light group-hover:text-gold transition truncate">
                    {m.name}
                  </h3>
                  {(m.birth_date || m.death_date) && (
                    <p className="text-sm text-text-secondary mt-0.5">
                      {formatLifespan(m.birth_date, m.death_date)}
                    </p>
                  )}
                  {m.description && (
                    <p className="text-sm text-text-secondary mt-1.5 line-clamp-2">
                      {m.description}
                    </p>
                  )}
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    m.is_public
                      ? "bg-success/10 text-success"
                      : "bg-surface-container-high text-text-secondary"
                  }`}
                >
                  {m.is_public ? "Öffentlich" : "Privat"}
                </span>
                {m.is_public && m.slug && (
                  <span className="text-xs text-gold-light">
                    SpiritLink aktiv
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border-2 border-dashed border-outline-variant bg-bg-card p-12 text-center">
          <div className="text-4xl mb-4">🕊️</div>
          <h3 className="text-lg font-serif font-semibold text-gold-light mb-2">
            Noch keine Gedenkprofile
          </h3>
          <p className="text-sm text-text-secondary mb-6 max-w-md mx-auto">
            Erstelle dein erstes Gedenkprofil, um die Erinnerung an einen
            geliebten Menschen oder ein Tier zu bewahren.
          </p>
          <Link
            href="/memorial/new"
            className="inline-flex items-center gap-2 rounded-lg bg-gold px-6 py-3 text-sm font-semibold text-bg-primary hover:brightness-110 transition shadow-sm"
          >
            Erstes Gedenkprofil erstellen
          </Link>
        </div>
      )}
    </div>
  );
}
