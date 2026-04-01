import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import type { Message, Memorial, TrustedPerson } from "@/lib/types";
import { MessageForm } from "../../message-form";
import Link from "next/link";

export const metadata = { title: "Nachricht bearbeiten" };

export default async function BearbeitenPage({
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

  const { data: message } = await supabase
    .from("messages")
    .select("*, memorials(name)")
    .eq("id", id)
    .eq("user_id", user.id)
    .single<Message>();

  if (!message) notFound();
  if (message.status !== "draft" && message.status !== "scheduled") {
    redirect("/nachrichten");
  }

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
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 lg:px-8 py-8 lg:py-12">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-headline text-3xl font-semibold text-primary">
            Nachricht bearbeiten
          </h1>
          <Link
            href="/nachrichten"
            className="inline-flex items-center gap-1.5 font-label text-sm text-on-surface-variant hover:text-primary transition"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Zurück
          </Link>
        </div>
        <MessageForm
          memorials={memorials ?? []}
          hasTrustedPerson={(trustedPersons?.length ?? 0) > 0}
          trustedPersons={trustedPersons ?? []}
          existingMessage={message}
        />
      </div>
    </div>
  );
}
