import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { TrustedPerson } from "@/lib/types";
import { TrustedPersonList } from "./trusted-person-list";

export const metadata = { title: "Vertrauenspersonen" };

export default async function VertrauenspersonenPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: trustedPersons } = await supabase
    .from("trusted_persons")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .returns<TrustedPerson[]>();

  return (
    <div className="max-w-4xl mx-auto px-4 lg:px-8 py-8 lg:py-12">
      <div className="mb-8">
        <h1 className="font-headline text-3xl font-semibold text-on-surface">
          Vertrauenspersonen
        </h1>
        <p className="mt-2 font-body text-sm text-on-surface-variant">
          Deine Vertrauenspersonen k&ouml;nnen best&auml;tigen, dass du verstorben bist.
          Erst dann werden deine &quot;Nach dem Tod&quot;-Nachrichten versendet.
        </p>
      </div>

      <TrustedPersonList trustedPersons={trustedPersons ?? []} />
    </div>
  );
}
