import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import type { Reminder, Memorial } from "@/lib/types";
import { ReminderForm } from "../../reminder-form";
import Link from "next/link";

export const metadata = { title: "Termin bearbeiten" };

export default async function TerminBearbeitenPage({
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

  const { data: reminder } = await supabase
    .from("reminders")
    .select("*, memorials(name)")
    .eq("id", id)
    .eq("user_id", user.id)
    .single<Reminder>();

  if (!reminder) notFound();

  const { data: memorials } = await supabase
    .from("memorials")
    .select("id, name")
    .eq("user_id", user.id)
    .order("name")
    .returns<Pick<Memorial, "id" | "name">[]>();

  return (
    <div className="max-w-3xl mx-auto px-4 lg:px-8 py-8 lg:py-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-headline text-3xl font-semibold text-on-surface">
          Termin bearbeiten
        </h1>
        <Link
          href="/termine"
          className="inline-flex items-center gap-1.5 font-label text-sm text-on-surface-variant hover:text-primary transition"
        >
          <span className="material-symbols-outlined text-lg">arrow_back</span>
          Zur&uuml;ck
        </Link>
      </div>
      <ReminderForm memorials={memorials ?? []} existingReminder={reminder} />
    </div>
  );
}
