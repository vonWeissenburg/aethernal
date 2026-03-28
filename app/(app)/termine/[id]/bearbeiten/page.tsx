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
        <h1 className="text-3xl font-serif font-semibold text-violet">
          Termin bearbeiten
        </h1>
        <Link
          href="/termine"
          className="text-sm text-aether-gray hover:text-violet transition"
        >
          ← Zurück
        </Link>
      </div>
      <ReminderForm memorials={memorials ?? []} existingReminder={reminder} />
    </div>
  );
}
