"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/toast";
import { useConfirm } from "@/components/confirm-dialog";
import type { Reminder } from "@/lib/types";
import { REMINDER_TYPE_LABELS } from "@/lib/types";
import EmptyState from "@/components/empty-state";

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("de-AT", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatDay(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("de-AT", { day: "numeric" });
}

function formatMonth(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("de-AT", { month: "short" }).toUpperCase();
}

function isUpcoming(dateStr: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const date = new Date(dateStr);
  const diffDays = Math.ceil(
    (date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );
  return diffDays >= 0 && diffDays <= 30;
}

export function ReminderList({ reminders }: { reminders: Reminder[] }) {
  const router = useRouter();
  const { showToast } = useToast();
  const { confirm } = useConfirm();

  async function handleDelete(r: Reminder) {
    const ok = await confirm({
      title: "Termin l\u00F6schen?",
      message: `M\u00F6chtest du den Termin \u201E${r.title}\u201C wirklich l\u00F6schen? Diese Aktion kann nicht r\u00FCckg\u00E4ngig gemacht werden.`,
    });
    if (!ok) return;
    const supabase = createClient();
    await supabase.from("reminders").delete().eq("id", r.id);
    showToast("Termin gel\u00F6scht");
    router.refresh();
  }

  if (reminders.length === 0) {
    return (
      <EmptyState
        icon="calendar_month"
        title="Noch keine Termine"
        description="Erstelle deinen ersten Termin, um an wichtige Gedenktage und Jahrestage erinnert zu werden."
        actionHref="/termine/neu"
        actionLabel="Neuer Termin"
      />
    );
  }

  return (
    <div className="space-y-3">
      {reminders.map((r) => {
        const upcoming = isUpcoming(r.reminder_date);
        return (
          <div
            key={r.id}
            className="rounded-card bg-card border border-outline-variant/30 p-4 transition-colors duration-250 ease-out hover:bg-card-hover"
          >
            <div className="flex items-center gap-4">
              {/* Date block */}
              <div className="flex flex-col items-center justify-center shrink-0 w-14 h-14 rounded-button bg-surface-container-low">
                <span className="font-headline text-xl font-bold text-on-surface leading-none">
                  {formatDay(r.reminder_date)}
                </span>
                <span className="font-label text-[10px] font-semibold text-on-surface-variant tracking-wider mt-0.5">
                  {formatMonth(r.reminder_date)}
                </span>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <h3 className="font-headline text-base font-semibold text-on-surface truncate">
                  {r.title}
                </h3>
                {r.description && (
                  <p className="font-body text-xs text-on-surface-variant mt-0.5 line-clamp-1">
                    {r.description}
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-2 mt-1.5">
                  <span className="inline-flex items-center gap-1 rounded-full bg-surface-container-high px-2 py-0.5 font-label text-xs text-on-surface-variant">
                    {REMINDER_TYPE_LABELS[r.reminder_type]}
                  </span>
                  {r.repeat_yearly && (
                    <span className="inline-flex items-center gap-0.5 font-label text-xs text-on-surface-variant/70">
                      <span className="material-symbols-outlined text-xs" aria-hidden="true">repeat</span>
                      J&auml;hrlich
                    </span>
                  )}
                  {r.memorials?.name && (
                    <span className="font-label text-xs text-on-surface-variant/70">
                      {r.memorials.name}
                    </span>
                  )}
                  {upcoming && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 font-label text-xs font-medium text-primary">
                      <span className="material-symbols-outlined text-xs">upcoming</span>
                      Bald
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 shrink-0">
                <Link
                  href={`/termine/${r.id}/bearbeiten`}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-low transition"
                  aria-label={`Termin „${r.title}" bearbeiten`}
                >
                  <span className="material-symbols-outlined text-lg">edit</span>
                </Link>
                <button
                  onClick={() => handleDelete(r)}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-on-surface-variant hover:text-error hover:bg-error/10 transition"
                  title="L&ouml;schen"
                >
                  <span className="material-symbols-outlined text-lg">delete</span>
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
