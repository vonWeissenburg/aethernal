import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { Profile } from "@/lib/types";
import { SettingsForm } from "./settings-form";

export const metadata = { title: "Einstellungen" };

export default async function EinstellungenPage() {
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

  return (
    <div className="max-w-2xl mx-auto px-4 lg:px-8 py-8 lg:py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-serif font-semibold text-violet">
          Einstellungen
        </h1>
        <p className="mt-2 text-aether-gray">
          Verwalte dein Konto und deine Daten.
        </p>
      </div>

      <SettingsForm
        profile={profile}
        email={user.email ?? ""}
      />
    </div>
  );
}
