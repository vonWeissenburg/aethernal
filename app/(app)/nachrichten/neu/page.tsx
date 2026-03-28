import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { Memorial, TrustedPerson } from "@/lib/types";
import { MessageForm } from "../message-form";

export const metadata = { title: "Neue Nachricht" };

export default async function NeueNachrichtPage() {
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

  const { data: trustedPersons } = await supabase
    .from("trusted_persons")
    .select("id, name, email")
    .eq("user_id", user.id)
    .returns<Pick<TrustedPerson, "id" | "name" | "email">[]>();

  return (
    <div className="max-w-3xl mx-auto px-4 lg:px-8 py-8 lg:py-12">
      <h1 className="text-3xl font-serif font-semibold text-violet mb-8">
        Neue Nachricht
      </h1>
      <MessageForm
        memorials={memorials ?? []}
        hasTrustedPerson={(trustedPersons?.length ?? 0) > 0}
        trustedPersons={trustedPersons ?? []}
      />
    </div>
  );
}
