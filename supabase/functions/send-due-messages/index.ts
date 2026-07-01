// ============================================================
// AETHERNAL — Edge Function: send-due-messages
// ------------------------------------------------------------
// Läuft täglich (per pg_cron). Findet fällige Nachrichten und
// Erinnerungen und versendet sie über Resend.
//
// Sicherheit: Diese Function ist mit `verify_jwt = false` deployed
// (siehe config.toml). Stattdessen prüfen wir einen geheimen Header
// `Authorization: Bearer <CRON_SECRET>` — den kennt nur der Cron-Job.
//
// Secrets (via `supabase secrets set ...`):
//   RESEND_API_KEY   – API-Key von Resend (re_...)
//   FROM_EMAIL       – verifizierter Absender, z. B. "Aethernal <noreply@aethernal.me>"
//   CRON_SECRET      – frei gewähltes langes Zufalls-Secret
// Automatisch von Supabase injiziert:
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
// ============================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const TZ = "Europe/Vienna";

// --- Hilfsfunktionen --------------------------------------------------------

/** Heutiges Datum in Europe/Vienna als "YYYY-MM-DD". */
function todayInVienna(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/**
 * Ist ein datumsgetriggerter Eintrag heute fällig?
 * @param dateStr     Fälligkeitsdatum "YYYY-MM-DD"
 * @param repeatYearly jährliche Wiederholung?
 * @param today       heutiges Datum "YYYY-MM-DD" (Vienna)
 * @param lastSent    zuletzt versendet "YYYY-MM-DD" oder null
 */
function isDue(
  dateStr: string | null,
  repeatYearly: boolean,
  today: string,
  lastSent: string | null,
): boolean {
  if (!dateStr) return false;
  if (repeatYearly) {
    // Feuert jedes Jahr am selben Tag/Monat ...
    if (dateStr.slice(5) !== today.slice(5)) return false;
    // ... aber nur einmal pro Jahr.
    if (lastSent && lastSent.slice(0, 4) === today.slice(0, 4)) return false;
    return true;
  }
  // Einmalig: fällig sobald das Datum erreicht/überschritten ist und noch nicht versendet.
  if (dateStr > today) return false;
  if (lastSent) return false;
  return true;
}

/** Eine E-Mail über Resend versenden. Wirft bei Fehler. */
async function sendEmail(opts: { to: string; subject: string; html: string }) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${Deno.env.get("RESEND_API_KEY")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: Deno.env.get("FROM_EMAIL"),
      to: [opts.to],
      subject: opts.subject,
      html: opts.html,
    }),
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Resend ${res.status}: ${detail}`);
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// --- Handler ----------------------------------------------------------------

Deno.serve(async (req) => {
  // 1) Authentifizierung gegen das Cron-Secret
  const auth = req.headers.get("Authorization");
  if (auth !== `Bearer ${Deno.env.get("CRON_SECRET")}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, // umgeht RLS — rein serverseitig
  );

  const today = todayInVienna();
  const result = {
    today,
    messages: { checked: 0, sent: 0, failed: 0 },
    reminders: { checked: 0, sent: 0, failed: 0 },
  };

  // 2) Fällige Nachrichten (nur datumsgetriggert; 'death' kommt mit Aufgabe 4)
  const { data: messages, error: msgErr } = await supabase
    .from("messages")
    .select("id, title, body, recipient_name, recipient_email, trigger_date, repeat_yearly, sent_at")
    .eq("status", "scheduled")
    .eq("trigger_type", "date");

  if (msgErr) {
    return new Response(`DB error (messages): ${msgErr.message}`, { status: 500 });
  }

  for (const m of messages ?? []) {
    const lastSent = m.sent_at ? String(m.sent_at).slice(0, 10) : null;
    if (!isDue(m.trigger_date, m.repeat_yearly, today, lastSent)) continue;
    result.messages.checked++;
    try {
      await sendEmail({
        to: m.recipient_email,
        subject: m.title,
        html: `<p>Hallo ${escapeHtml(m.recipient_name)},</p>` +
          `<div>${escapeHtml(m.body).replace(/\n/g, "<br>")}</div>` +
          `<p style="margin-top:24px;color:#888;font-size:12px">` +
          `Diese Nachricht wurde über Aethernal zugestellt.</p>`,
      });
      // Einmalig → 'sent'. Wiederkehrend → bleibt 'scheduled', nur sent_at aktualisieren.
      await supabase
        .from("messages")
        .update({
          status: m.repeat_yearly ? "scheduled" : "sent",
          sent_at: new Date().toISOString(),
        })
        .eq("id", m.id);
      result.messages.sent++;
    } catch (e) {
      result.messages.failed++;
      await supabase.from("messages").update({ status: "failed" }).eq("id", m.id);
      console.error(`Message ${m.id} failed:`, e);
    }
  }

  // 3) Fällige Erinnerungen → an den Konto-Inhaber
  const { data: reminders, error: remErr } = await supabase
    .from("reminders")
    .select("id, user_id, title, description, reminder_date, repeat_yearly, last_sent_on");

  if (remErr) {
    return new Response(`DB error (reminders): ${remErr.message}`, { status: 500 });
  }

  // E-Mail-Adressen der Inhaber cachen (mehrere Reminder pro User möglich)
  const emailCache = new Map<string, string | null>();
  async function ownerEmail(userId: string): Promise<string | null> {
    if (emailCache.has(userId)) return emailCache.get(userId)!;
    const { data } = await supabase.auth.admin.getUserById(userId);
    const email = data?.user?.email ?? null;
    emailCache.set(userId, email);
    return email;
  }

  for (const r of reminders ?? []) {
    const lastSent = r.last_sent_on ? String(r.last_sent_on).slice(0, 10) : null;
    if (!isDue(r.reminder_date, r.repeat_yearly, today, lastSent)) continue;
    result.reminders.checked++;
    try {
      const to = await ownerEmail(r.user_id);
      if (!to) throw new Error(`Keine E-Mail für user ${r.user_id}`);
      await sendEmail({
        to,
        subject: `Erinnerung: ${r.title}`,
        html: `<p>Eine Erinnerung von Aethernal:</p>` +
          `<h2 style="margin:8px 0">${escapeHtml(r.title)}</h2>` +
          (r.description ? `<p>${escapeHtml(r.description).replace(/\n/g, "<br>")}</p>` : ""),
      });
      await supabase.from("reminders").update({ last_sent_on: today }).eq("id", r.id);
      result.reminders.sent++;
    } catch (e) {
      result.reminders.failed++;
      console.error(`Reminder ${r.id} failed:`, e);
    }
  }

  return new Response(JSON.stringify(result), {
    headers: { "Content-Type": "application/json" },
  });
});
