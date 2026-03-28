import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { Memorial } from "@/lib/types";
import { ReminderForm } from "../reminder-form";

export const metadata = { title: "Neuer Termin" };

export default async function NeuerTerminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: memorials } = await supabase
    .from("memorials")
    .select("id, name")
    .eq("user_id", user.id)
    .order("name")
    .returns<Pick<Memorial, "id" | "name">[]>();

  return (
    <div className="max-w-3xl mx-auto px-4 lg:px-8 py-8 lg:py-12">
      <h1 className="text-3xl font-serif font-semibold text-violet mb-8">
        Neuer Termin
      </h1>
      <ReminderForm memorials={memorials ?? []} />
    </div>
  );
}
