import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { Message, TrustedPerson } from "@/lib/types";
import { STATUS_STYLES, STATUS_LABELS } from "@/lib/types";
import { MessageList } from "./message-list";
import { TrustedPersonSection } from "./trusted-person-section";

export const metadata = { title: "Nachrichten" };

export default async function NachrichtenPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const params = await searchParams;
  const activeTab = params.tab === "vertrauensperson" ? "vertrauensperson" : "nachrichten";

  const { data: messages } = await supabase
    .from("messages")
    .select("*, memorials(name)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .returns<Message[]>();

  const { data: trustedPersons } = await supabase
    .from("trusted_persons")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .returns<TrustedPerson[]>();

  return (
    <div className="max-w-4xl mx-auto px-4 lg:px-8 py-8 lg:py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-serif font-semibold text-violet">
          Nachrichten aus dem Jenseits
        </h1>
        <p className="mt-2 text-aether-gray">
          Zeitgesteuerte Nachrichten an deine Liebsten.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-8 border-b border-lavender-dark">
        <Link
          href="/nachrichten"
          className={`px-4 py-2.5 text-sm font-medium transition border-b-2 -mb-px ${
            activeTab === "nachrichten"
              ? "border-amber text-violet"
              : "border-transparent text-aether-gray hover:text-violet"
          }`}
        >
          💌 Meine Nachrichten
        </Link>
        <Link
          href="/nachrichten?tab=vertrauensperson"
          className={`px-4 py-2.5 text-sm font-medium transition border-b-2 -mb-px ${
            activeTab === "vertrauensperson"
              ? "border-amber text-violet"
              : "border-transparent text-aether-gray hover:text-violet"
          }`}
        >
          🤝 Vertrauensperson
        </Link>
      </div>

      {/* Email notice */}
      {activeTab === "nachrichten" && (
        <div className="rounded-lg bg-amber/5 border border-amber/20 p-4 mb-6">
          <p className="text-xs text-aether-gray">
            📬 Der E-Mail-Versand wird in Kürze aktiviert. Du kannst bereits
            Nachrichten erstellen und planen.
          </p>
        </div>
      )}

      {activeTab === "nachrichten" ? (
        <MessageList messages={messages ?? []} />
      ) : (
        <TrustedPersonSection trustedPersons={trustedPersons ?? []} />
      )}
    </div>
  );
}
