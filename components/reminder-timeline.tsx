import Link from "next/link";
import type { Reminder } from "@/lib/types";

type TimelineReminder = Pick<Reminder, "id" | "title" | "reminder_date" | "description">;

export default function ReminderTimeline({ reminders }: { reminders: TimelineReminder[] }) {
  if (reminders.length === 0) {
    return <p className="text-on-surface-variant/70 text-sm">Keine anstehenden Termine.</p>;
  }
  return (
    <div className="space-y-8">
      {reminders.map((r, i) => {
        const date = new Date(r.reminder_date);
        return (
          <Link
            key={r.id}
            href={`/termine/${r.id}/bearbeiten`}
            className={`group flex gap-6 relative pl-8 border-l-2 ${
              i === 0 ? "border-primary/30" : "border-outline-variant/40"
            }`}
          >
            <div
              className={`absolute -left-[7px] top-0 w-3 h-3 rounded-full ${
                i === 0 ? "bg-primary ring-8 ring-primary/5" : "bg-surface-container-highest"
              }`}
              aria-hidden="true"
            />
            <div>
              <p
                className={`text-[10px] font-bold tracking-[0.2em] mb-2 uppercase ${
                  i === 0 ? "text-primary" : "text-on-surface-variant/70"
                }`}
              >
                {date.toLocaleDateString("de-AT", { day: "2-digit", month: "short" }).toUpperCase()}
              </p>
              <p className="text-on-surface font-semibold mb-1 group-hover:text-primary transition-colors duration-250 ease-out">
                {r.title}
              </p>
              {r.description && (
                <p className="text-on-surface-variant/70 text-sm leading-relaxed">{r.description}</p>
              )}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
