"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Reminder } from "@/lib/types";
import { REMINDER_TYPE_LABELS, REMINDER_TYPE_ICONS } from "@/lib/types";

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("de-AT", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
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

  async function handleDelete(id: string) {
    if (!confirm("Termin wirklich löschen?")) return;
    const supabase = createClient();
    await supabase.from("reminders").delete().eq("id", id);
    router.refresh();
  }

  if (reminders.length === 0) {
    return (
      <div className="rounded-xl border-2 border-dashed border-lavender-dark bg-white p-12 text-center">
        <div className="text-4xl mb-4">📅</div>
        <h3 className="text-lg font-serif font-semibold text-violet mb-2">
          Noch keine Termine
        </h3>
        <p className="text-sm text-aether-gray mb-6 max-w-md mx-auto">
          Erstelle deinen ersten Termin, um an wichtige Gedenktage und
          Jahrestage erinnert zu werden.
        </p>
        <Link
          href="/termine/neu"
          className="inline-flex items-center gap-2 rounded-lg bg-amber px-6 py-2.5 text-sm font-medium text-white hover:bg-amber-dark transition shadow-sm"
        >
          + Neuer Termin
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {reminders.map((r) => {
        const upcoming = isUpcoming(r.reminder_date);
        return (
          <div
            key={r.id}
            className={`rounded-xl border bg-white p-5 transition ${
              upcoming
                ? "border-amber/40 shadow-sm"
                : "border-lavender-dark hover:shadow-sm"
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <span className="text-2xl mt-0.5">
                  {REMINDER_TYPE_ICONS[r.reminder_type]}
                </span>
                <div className="flex-1 min-w-0">
                  <h3 className="font-serif text-lg font-semibold text-violet truncate">
                    {r.title}
                  </h3>
                  <p className="text-sm text-aether-gray mt-0.5">
                    {formatDate(r.reminder_date)}
                    {r.repeat_yearly && " · Jährlich"}
                  </p>
                  {r.description && (
                    <p className="text-sm text-aether-gray mt-1 line-clamp-2">
                      {r.description}
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span className="text-xs bg-lavender text-violet px-2 py-0.5 rounded-full">
                      {REMINDER_TYPE_LABELS[r.reminder_type]}
                    </span>
                    {r.memorials?.name && (
                      <span className="text-xs text-aether-gray">
                        · {r.memorials.name}
                      </span>
                    )}
                    {upcoming && (
                      <span className="text-xs bg-amber/10 text-amber px-2 py-0.5 rounded-full font-medium">
                        Bald
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Link
                  href={`/termine/${r.id}/bearbeiten`}
                  className="text-aether-gray hover:text-violet transition p-1"
                  title="Bearbeiten"
                >
                  ✏️
                </Link>
                <button
                  onClick={() => handleDelete(r.id)}
                  className="text-aether-gray hover:text-red-600 transition p-1"
                  title="Löschen"
                >
                  🗑️
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
