"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/toast";
import { useConfirm } from "@/components/confirm-dialog";
import type { Message } from "@/lib/types";
import { STATUS_STYLES, STATUS_LABELS } from "@/lib/types";

export function MessageList({ messages }: { messages: Message[] }) {
  const router = useRouter();
  const { showToast } = useToast();
  const { confirm } = useConfirm();

  async function handleDelete(m: Message) {
    const ok = await confirm({
      title: "Nachricht löschen?",
      message: `Möchtest du die Nachricht „${m.title}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.`,
    });
    if (!ok) return;
    const supabase = createClient();
    await supabase.from("messages").delete().eq("id", m.id);
    showToast("Nachricht gelöscht");
    router.refresh();
  }

  if (messages.length === 0) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-outline-variant bg-surface p-12 text-center">
        <span className="material-symbols-outlined text-5xl text-on-surface-variant mb-4 block">
          drafts
        </span>
        <h3 className="font-headline text-lg font-semibold text-on-surface mb-2">
          Noch keine Nachrichten geplant
        </h3>
        <p className="font-body text-sm text-on-surface-variant mb-6 max-w-md mx-auto">
          Schreibe deine erste Nachricht an einen geliebten Menschen. Sie wird
          zugestellt, wenn die Zeit gekommen ist.
        </p>
        <Link
          href="/nachrichten/neu"
          className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 font-label text-sm font-medium text-on-primary hover:brightness-110 transition shadow-md"
        >
          <span className="material-symbols-outlined text-[20px]">add</span>
          Neue Nachricht
        </Link>
      </div>
    );
  }

  return (
    <div className="relative pb-20">
      {/* Message cards */}
      <div className="space-y-3">
        {messages.map((m) => (
          <div
            key={m.id}
            className="group rounded-2xl bg-card p-5 transition hover:bg-surface-container-high"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="font-headline text-base font-semibold text-on-surface truncate">
                    {m.title}
                  </h3>
                  <span
                    className={`shrink-0 font-label text-xs px-2.5 py-0.5 rounded-full font-medium ${STATUS_STYLES[m.status]}`}
                  >
                    {STATUS_LABELS[m.status]}
                  </span>
                </div>
                <p className="font-body text-sm text-on-surface-variant">
                  An: {m.recipient_name}
                </p>
                <div className="flex flex-wrap items-center gap-3 mt-2">
                  <span className="inline-flex items-center gap-1 font-body text-xs text-outline">
                    <span className="material-symbols-outlined text-[16px]">
                      {m.trigger_type === "date" ? "calendar_today" : "volunteer_activism"}
                    </span>
                    {m.trigger_type === "date"
                      ? m.trigger_date
                        ? new Date(m.trigger_date).toLocaleDateString("de-AT")
                        : "Kein Datum"
                      : "Nach meinem Tod"}
                  </span>
                  {m.repeat_yearly && (
                    <span className="inline-flex items-center gap-1 font-label text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                      <span className="material-symbols-outlined text-[14px]">repeat</span>
                      Jährlich
                    </span>
                  )}
                  {m.memorials?.name && (
                    <span className="font-body text-xs text-outline">
                      {m.memorials.name}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {(m.status === "draft" || m.status === "scheduled") && (
                  <Link
                    href={`/nachrichten/${m.id}/bearbeiten`}
                    className="rounded-full p-2 text-on-surface-variant hover:text-primary hover:bg-primary/10 transition"
                    title="Bearbeiten"
                  >
                    <span className="material-symbols-outlined text-[20px]">edit</span>
                  </Link>
                )}
                <button
                  onClick={() => handleDelete(m)}
                  className="rounded-full p-2 text-on-surface-variant hover:text-error hover:bg-error/10 transition"
                  title="Löschen"
                >
                  <span className="material-symbols-outlined text-[20px]">delete</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* FAB */}
      <Link
        href="/nachrichten/neu"
        className="fixed bottom-8 right-8 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-on-primary shadow-lg hover:brightness-110 transition z-10"
        title="Neue Nachricht"
      >
        <span className="material-symbols-outlined text-[28px]">add</span>
      </Link>
    </div>
  );
}
