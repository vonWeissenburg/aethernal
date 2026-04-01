import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { Reminder } from "@/lib/types";
import { REMINDER_TYPE_LABELS, REMINDER_TYPE_ICONS } from "@/lib/types";
import { ReminderList } from "./reminder-list";

export const metadata = { title: "Termine & Erinnerungen" };

export default async function TerminePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: reminders } = await supabase
    .from("reminders")
    .select("*, memorials(name)")
    .eq("user_id", user.id)
    .order("reminder_date", { ascending: true })
    .returns<Reminder[]>();

  return (
    <div className="max-w-4xl mx-auto px-4 lg:px-8 py-8 lg:py-12">
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="font-headline text-3xl font-semibold text-on-surface">
            Termine & Erinnerungen
          </h1>
          <p className="mt-2 font-body text-sm text-on-surface-variant">
            Gedenktage, Jahrestage und besondere Daten.
          </p>
        </div>
      </div>

      <ReminderList reminders={reminders ?? []} />

      {/* FAB */}
      <Link
        href="/termine/neu"
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-on-primary shadow-lg hover:brightness-110 transition-all active:scale-95"
        title="Neuer Termin"
      >
        <span className="material-symbols-outlined text-2xl">add</span>
      </Link>
    </div>
  );
}
