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
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 lg:px-8 py-8 lg:py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-headline text-3xl font-semibold text-primary">
            Nachrichten aus dem Jenseits
          </h1>
          <p className="mt-2 font-body text-sm text-on-surface-variant">
            Zeitgesteuerte Nachrichten an deine Liebsten.
          </p>
        </div>

        {/* Tab Bar */}
        <div className="flex border-b border-outline-variant mb-8">
          <Link
            href="/nachrichten"
            className={`relative flex items-center gap-2 px-5 py-3 font-label text-sm font-medium transition-colors ${
              activeTab === "nachrichten"
                ? "text-primary"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">mail</span>
            Meine Nachrichten
            {activeTab === "nachrichten" && (
              <span className="absolute bottom-0 left-0 right-0 h-[3px] rounded-t-full bg-primary" />
            )}
          </Link>
          <Link
            href="/nachrichten?tab=vertrauensperson"
            className={`relative flex items-center gap-2 px-5 py-3 font-label text-sm font-medium transition-colors ${
              activeTab === "vertrauensperson"
                ? "text-primary"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">handshake</span>
            Vertrauensperson
            {activeTab === "vertrauensperson" && (
              <span className="absolute bottom-0 left-0 right-0 h-[3px] rounded-t-full bg-primary" />
            )}
          </Link>
        </div>

        {/* Email notice */}
        {activeTab === "nachrichten" && (
          <div className="flex items-start gap-3 rounded-xl bg-primary/5 border border-primary/20 p-4 mb-6">
            <span className="material-symbols-outlined text-primary text-[20px] mt-0.5">info</span>
            <p className="font-body text-xs text-on-surface-variant">
              Der E-Mail-Versand wird in Kürze aktiviert. Du kannst bereits
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
    </div>
  );
}
