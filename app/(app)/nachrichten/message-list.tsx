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
      <div className="rounded-xl border-2 border-dashed border-lavender-dark bg-white p-12 text-center">
        <div className="text-4xl mb-4">💌</div>
        <h3 className="text-lg font-serif font-semibold text-violet mb-2">
          Noch keine Nachrichten geplant
        </h3>
        <p className="text-sm text-aether-gray mb-6 max-w-md mx-auto">
          Schreibe deine erste Nachricht an einen geliebten Menschen. Sie wird
          zugestellt, wenn die Zeit gekommen ist.
        </p>
        <Link
          href="/nachrichten/neu"
          className="inline-flex items-center gap-2 rounded-lg bg-amber px-6 py-2.5 text-sm font-medium text-white hover:bg-amber-dark transition shadow-sm"
        >
          + Neue Nachricht
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-end mb-6">
        <Link
          href="/nachrichten/neu"
          className="inline-flex items-center gap-2 rounded-lg bg-amber px-5 py-2.5 text-sm font-medium text-white hover:bg-amber-dark transition shadow-sm"
        >
          + Neue Nachricht
        </Link>
      </div>

      <div className="space-y-4">
        {messages.map((m) => (
          <div
            key={m.id}
            className="rounded-xl border border-lavender-dark bg-white p-5 hover:shadow-sm transition"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h3 className="font-serif text-lg font-semibold text-violet truncate">
                  {m.title}
                </h3>
                <p className="text-sm text-aether-gray mt-1">
                  An {m.recipient_name} &lt;{m.recipient_email}&gt;
                </p>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <span className="text-sm text-aether-gray">
                    {m.trigger_type === "date" ? "📅" : "🕊️"}{" "}
                    {m.trigger_type === "date"
                      ? m.trigger_date
                        ? new Date(m.trigger_date).toLocaleDateString("de-AT")
                        : "Kein Datum"
                      : "Nach meinem Tod"}
                  </span>
                  {m.repeat_yearly && (
                    <span className="text-xs bg-violet/10 text-violet px-2 py-0.5 rounded-full">
                      Jährlich
                    </span>
                  )}
                  {m.memorials?.name && (
                    <span className="text-xs text-aether-gray">
                      · {m.memorials.name}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span
                  className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_STYLES[m.status]}`}
                >
                  {STATUS_LABELS[m.status]}
                </span>
                {(m.status === "draft" || m.status === "scheduled") && (
                  <Link
                    href={`/nachrichten/${m.id}/bearbeiten`}
                    className="text-aether-gray hover:text-violet transition p-1"
                    title="Bearbeiten"
                  >
                    ✏️
                  </Link>
                )}
                <button
                  onClick={() => handleDelete(m)}
                  className="text-aether-gray hover:text-red-600 transition p-1"
                  title="Löschen"
                >
                  🗑️
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
