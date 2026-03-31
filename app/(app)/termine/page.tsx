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
          <h1 className="text-3xl font-serif font-semibold text-gold-light">
            Termine & Erinnerungen
          </h1>
          <p className="mt-2 text-text-secondary">
            Gedenktage, Jahrestage und besondere Daten.
          </p>
        </div>
        <Link
          href="/termine/neu"
          className="shrink-0 inline-flex items-center gap-2 rounded-lg bg-gold px-5 py-2.5 text-sm font-medium text-bg-primary hover:brightness-110 transition shadow-sm"
        >
          + Neuer Termin
        </Link>
      </div>

      <ReminderList reminders={reminders ?? []} />
    </div>
  );
}
