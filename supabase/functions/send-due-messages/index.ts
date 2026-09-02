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
    // Nie vor dem hinterlegten Erstdatum feuern (z. B. Jahrestag, der erst nächstes Jahr beginnt).
    if (dateStr > today) return false;
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
async function sendEmail(opts: { to: string; subject: string; html: string; from?: string }) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${Deno.env.get("RESEND_API_KEY")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: opts.from ?? Deno.env.get("FROM_EMAIL"),
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

/** Reine Versand-Adresse aus FROM_EMAIL ("Aethernal <noreply@…>" → "noreply@…"). */
function fromAddress(): string {
  const raw = Deno.env.get("FROM_EMAIL") ?? "";
  const m = raw.match(/<([^>]+)>/);
  return m ? m[1] : raw;
}

/** Absender mit persönlichem Anzeigenamen: "Anna Testfall über Aethernal <noreply@…>". */
function personalFrom(ownerName: string | null): string | undefined {
  if (!ownerName) return undefined; // Fallback: FROM_EMAIL ("Aethernal <…>")
  const safe = ownerName.replace(/["<>]/g, "").trim();
  return safe ? `${safe} über Aethernal <${fromAddress()}>` : undefined;
}

/** Deutscher Namens-Genitiv: "Anna" → "Annas", aber "Klaus" → "Klaus'". */
function genitiv(name: string): string {
  return /[sßxz]$/i.test(name.trim()) ? `${name.trim()}’` : `${name.trim()}s`;
}

/** Würdiger Mail-Rahmen (identische Optik wie lib/death-flow.ts mailShell). */
function mailShell(inner: string): string {
  return `<!DOCTYPE html>
<html lang="de">
  <body style="margin:0;padding:0;background:#f6f4ef;font-family:Georgia,'Times New Roman',serif;color:#2e2a20;">
    <div style="max-width:560px;margin:0 auto;padding:40px 24px;">
      <p style="text-align:center;font-style:italic;font-size:20px;color:#8a6d1a;margin:0 0 32px;">&#10024; Aethernal</p>
      <div style="background:#ffffff;border:1px solid #e5dfd0;border-radius:12px;padding:32px;">
        ${inner}
      </div>
    </div>
  </body>
</html>`;
}

/**
 * Zustell-Mail für eine hinterlassene Nachricht (Entscheidung 19.07.2026):
 * benennt die verstorbene Person, macht klar, dass es ihre Worte zu Lebzeiten
 * sind, setzt die Nachricht mit Goldlinie ab und schließt würdig — keine
 * "Paketverfolgungs"-Fußzeile. Ohne Owner-Namen: genitivfreie Formulierung.
 */
function buildDeliveryHtml(opts: {
  recipientName: string;
  body: string;
  ownerName: string | null;
}): string {
  // Erste Nennung voller Name, zweite nur Vorname im Genitiv („nach Annas Tod")
  const firstName = opts.ownerName?.trim().split(/\s+/)[0];
  const intro = opts.ownerName && firstName
    ? `diese Nachricht hat ${escapeHtml(opts.ownerName)} zu Lebzeiten für dich geschrieben — ` +
      `mit dem Wunsch, dass sie dich nach ${escapeHtml(genitiv(firstName))} Tod erreicht. ` +
      `Aethernal überbringt sie dir heute.`
    : `diese Nachricht wurde zu Lebzeiten für dich geschrieben — ` +
      `mit dem Wunsch, dass sie dich nach dem Tod des Absenders erreicht. ` +
      `Aethernal überbringt sie dir heute.`;
  return mailShell(
    `<p style="font-size:16px;line-height:1.6;margin:0 0 16px;">Hallo ${escapeHtml(opts.recipientName)},</p>` +
      `<p style="font-size:16px;line-height:1.6;margin:0 0 24px;">${intro}</p>` +
      `<div style="border-left:3px solid #D4AF37;padding-left:16px;margin:0 0 24px;font-size:16px;line-height:1.7;">` +
      `${escapeHtml(opts.body).replace(/\n/g, "<br>")}</div>` +
      `<p style="font-size:16px;line-height:1.6;margin:0;">In stiller Verbundenheit,<br>Aethernal</p>`,
  );
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// --- Doppelbestätigung: Helfer (Entscheidung 28.08.2026) --------------------

/** Karenzzeit-Rückfall: ohne zweite Bestätigung wird nach so vielen Tagen zugestellt. */
const FINAL_CONFIRM_FALLBACK_DAYS = 14;
/** Bleibt die zweite Bestätigung aus, wird nach so vielen Tagen einmal erinnert. */
const FINAL_CONFIRM_REMINDER_DAYS = 7;

/** Basis-URL der App für Links in E-Mails. Secret APP_URL, mit sicherem Rückfall. */
function appBaseUrl(): string {
  return (Deno.env.get("APP_URL") ?? "https://app.aethernal.me").replace(/\/+$/, "");
}

/** 32 Byte Zufall als Hex — identisch zu Node `randomBytes(32).toString("hex")`. */
function newToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** SHA-256 als Hex — identisch zu Node `createHash("sha256")…digest("hex")`,
 *  damit derselbe Hash wie in lib/death-flow.ts entsteht. */
async function hashToken(token: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Mail-Button in derselben Optik wie lib/death-flow.ts mailButton. */
function mailButton(href: string, label: string, color = "#D4AF37", textColor = "#3C2F00"): string {
  return `<p style="text-align:center;margin:24px 0;">
    <a href="${href}" style="display:inline-block;background:${color};color:${textColor};text-decoration:none;font-weight:bold;padding:14px 32px;border-radius:8px;font-family:Arial,Helvetica,sans-serif;font-size:15px;">
      ${label}
    </a>
  </p>`;
}

/** Datum/Zeit in Wien, ausgeschrieben — wie lib/death-flow.ts formatDateTimeVienna. */
function formatDateTimeVienna(iso: string): string {
  return new Intl.DateTimeFormat("de-AT", {
    timeZone: TZ,
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

/**
 * Bitte an die Vertrauensperson um die zweite Bestätigung.
 * `isReminder` formuliert es als Erinnerung und weist darauf hin, dass der
 * frühere Link durch diesen ersetzt wurde (es wird nur der Hash gespeichert,
 * der alte Link lässt sich deshalb nicht erneut verschicken).
 */
function buildFinalConfirmHtml(opts: {
  personName: string;
  ownerName: string | null;
  releaseUrl: string;
  fallbackAt: string;
  isReminder: boolean;
}): string {
  const owner = opts.ownerName ? escapeHtml(opts.ownerName) : "dem Aethernal-Mitglied";
  const anrede = opts.personName ? `Hallo ${escapeHtml(opts.personName)},` : "Hallo,";
  const einstieg = opts.isReminder
    ? `wir haben dich vor einigen Tagen um eine letzte Bestätigung gebeten und noch keine Antwort erhalten. Deshalb diese eine Erinnerung.`
    : `die Schutzfrist nach deiner Meldung zu ${owner} ist abgelaufen, und die Meldung wurde nicht widerrufen.`;
  return mailShell(
    `<p style="font-size:16px;line-height:1.6;margin:0 0 16px;">${anrede}</p>` +
      `<p style="font-size:16px;line-height:1.6;margin:0 0 16px;">${einstieg}</p>` +
      `<p style="font-size:16px;line-height:1.6;margin:0 0 8px;">Bevor die hinterlassenen Nachrichten an ihre Empfänger gehen, bitten wir dich um eine <strong>zweite, letzte Bestätigung</strong>:</p>` +
      mailButton(opts.releaseUrl, "Nachrichten jetzt freigeben", "#3a4a6b", "#ffffff") +
      `<p style="font-size:13px;line-height:1.6;color:#7a7263;margin:16px 0 0;">Wenn du nichts tust, werden die Nachrichten am <strong>${formatDateTimeVienna(opts.fallbackAt)}</strong> automatisch zugestellt. Dein Schweigen hält sie nicht dauerhaft auf.</p>` +
      (opts.isReminder
        ? `<p style="font-size:13px;line-height:1.6;color:#7a7263;margin:8px 0 0;">Dieser Link ersetzt den aus unserer früheren E-Mail. Bitte benutze nur diesen.</p>`
        : ""),
  );
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
    death: { reports: 0, sent: 0, failed: 0, finalRequested: 0, remindersSent: 0 },
  };

  // Owner-Namen (profiles.full_name) cachen — für Absender-Anzeigenamen
  const nameCache = new Map<string, string | null>();
  async function ownerName(userId: string): Promise<string | null> {
    if (nameCache.has(userId)) return nameCache.get(userId)!;
    const { data } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", userId)
      .single();
    const name = data?.full_name?.trim() || null;
    nameCache.set(userId, name);
    return name;
  }

  // 2) Fällige Nachrichten (datumsgetriggert; 'death' siehe Abschnitt 4)
  const { data: messages, error: msgErr } = await supabase
    .from("messages")
    .select("id, user_id, title, body, recipient_name, recipient_email, trigger_date, repeat_yearly, sent_at")
    .eq("status", "scheduled")
    .eq("trigger_type", "date")
    // Nur bereits erreichte Daten (nutzt messages_due_idx) + Sicherheits-Deckel pro Lauf.
    .lte("trigger_date", today)
    .limit(500);

  if (msgErr) {
    return new Response(`DB error (messages): ${msgErr.message}`, { status: 500 });
  }

  for (const m of messages ?? []) {
    result.messages.checked++;
    const lastSent = m.sent_at ? String(m.sent_at).slice(0, 10) : null;
    if (!isDue(m.trigger_date, m.repeat_yearly, today, lastSent)) continue;
    try {
      await sendEmail({
        to: m.recipient_email,
        subject: m.title,
        from: personalFrom(await ownerName(m.user_id)),
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
    .select("id, user_id, title, description, reminder_date, repeat_yearly, last_sent_on")
    // Nur bereits erreichte Daten (nutzt reminders_due_idx) + Sicherheits-Deckel pro Lauf.
    .lte("reminder_date", today)
    .limit(500);

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
    result.reminders.checked++;
    const lastSent = r.last_sent_on ? String(r.last_sent_on).slice(0, 10) : null;
    if (!isDue(r.reminder_date, r.repeat_yearly, today, lastSent)) continue;
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

  // 4) Doppelbestätigung und Zustellung (Entscheidung 28.08.2026).
  //    A) Karenzzeit abgelaufen → Vertrauensperson um die zweite Bestätigung bitten
  //    B) keine Antwort nach FINAL_CONFIRM_REMINDER_DAYS → genau einmal erinnern
  //    C) freigegeben ODER Rückfalldatum erreicht → zustellen (Schleife darunter)
  //
  //    Die zweite Bestätigung ist bewusst ein BESCHLEUNIGER, keine harte Hürde:
  //    bliebe sie aus, käme nie eine Nachricht an. Deshalb das Rückfalldatum.
  //    Bewusst weich abgesichert: fehlen Tabelle oder Spalten, darf das den
  //    Datums-Versand aus Abschnitt 2 nicht brechen.
  const nowIso = new Date().toISOString();
  const appUrl = appBaseUrl();

  /** Name und E-Mail einer Vertrauensperson laden (kann gelöscht worden sein). */
  async function trustedPerson(id: string | null) {
    if (!id) return null;
    const { data } = await supabase
      .from("trusted_persons")
      .select("name, email")
      .eq("id", id)
      .single();
    if (!data?.email) return null;
    return { name: String(data.name ?? "").trim(), email: data.email as string };
  }

  // --- A) Zweite Bestätigung anfordern ---------------------------------------
  const { data: awaitingReports, error: awErr } = await supabase
    .from("death_reports")
    .select("id, user_id, trusted_person_id")
    .is("cancelled_at", null)
    .is("processed_at", null)
    .is("final_request_sent_at", null)
    .lte("effective_at", nowIso)
    .limit(50);

  if (awErr) {
    console.error(
      "death_reports Schritt A fehlgeschlagen (Migration 20260828 eingespielt?):",
      awErr.message,
    );
  } else {
    for (const report of awaitingReports ?? []) {
      const person = await trustedPerson(report.trusted_person_id);
      const fallbackAt = new Date(
        Date.now() + FINAL_CONFIRM_FALLBACK_DAYS * 24 * 60 * 60 * 1000,
      ).toISOString();

      // Vertrauensperson wurde gelöscht → es gibt niemanden zu fragen. Dann gilt
      // die ursprüngliche Regel: nach Ablauf der Karenzzeit wird zugestellt.
      if (!person) {
        await supabase
          .from("death_reports")
          .update({ final_request_sent_at: nowIso, fallback_deliver_at: nowIso })
          .eq("id", report.id);
        console.warn(
          `Report ${report.id}: keine Vertrauensperson mehr — Zustellung ohne zweite Bestätigung`,
        );
        continue;
      }

      const releaseToken = newToken();
      const { error: updErr } = await supabase
        .from("death_reports")
        .update({
          final_confirm_token_hash: await hashToken(releaseToken),
          final_request_sent_at: nowIso,
          fallback_deliver_at: fallbackAt,
        })
        .eq("id", report.id);

      if (updErr) {
        console.error(
          `Report ${report.id}: Freigabe-Token konnte nicht gesetzt werden:`,
          updErr.message,
        );
        continue; // nichts verschickt, nächster Lauf versucht es erneut
      }

      try {
        await sendEmail({
          to: person.email,
          subject: "Aethernal — eine letzte Bestätigung ist nötig",
          html: buildFinalConfirmHtml({
            personName: person.name,
            ownerName: await ownerName(report.user_id),
            releaseUrl: `${appUrl}/vertrauen/todesfall/freigeben?token=${releaseToken}`,
            fallbackAt,
            isReminder: false,
          }),
        });
        result.death.finalRequested++;
      } catch (e) {
        // Mail fehlgeschlagen: Der Report steht mit Rückfalldatum, die Zustellung
        // erfolgt dort spätestens automatisch. Kein erneuter Versand (sonst würde
        // bei dauerhaft kaputter Mail jeden Tag ein neuer Token gesetzt).
        console.error(`Report ${report.id}: Anfrage-Mail fehlgeschlagen:`, e);
      }
    }
  }

  // --- B) Genau einmal erinnern, wenn die zweite Bestätigung ausbleibt --------
  const reminderCutoff = new Date(
    Date.now() - FINAL_CONFIRM_REMINDER_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();

  const { data: staleReports, error: stErr } = await supabase
    .from("death_reports")
    .select("id, user_id, trusted_person_id, fallback_deliver_at")
    .is("cancelled_at", null)
    .is("processed_at", null)
    .is("final_confirmed_at", null)
    .is("final_reminder_sent_at", null)
    .not("final_request_sent_at", "is", null)
    .lte("final_request_sent_at", reminderCutoff)
    .limit(50);

  if (stErr) {
    console.error("death_reports Schritt B fehlgeschlagen:", stErr.message);
  } else {
    for (const report of staleReports ?? []) {
      const person = await trustedPerson(report.trusted_person_id);
      if (!person) {
        await supabase
          .from("death_reports")
          .update({ final_reminder_sent_at: nowIso })
          .eq("id", report.id);
        continue;
      }

      // Frischer Token: der alte Link lässt sich nicht erneut verschicken, weil nur
      // sein Hash gespeichert ist. Die Mail sagt ausdrücklich, dass er ersetzt wurde.
      const releaseToken = newToken();
      const { error: updErr } = await supabase
        .from("death_reports")
        .update({
          final_confirm_token_hash: await hashToken(releaseToken),
          final_reminder_sent_at: nowIso,
        })
        .eq("id", report.id);

      if (updErr) {
        console.error(`Report ${report.id}: Erinnerungs-Token fehlgeschlagen:`, updErr.message);
        continue;
      }

      try {
        await sendEmail({
          to: person.email,
          subject: "Erinnerung: eine letzte Bestätigung bei Aethernal",
          html: buildFinalConfirmHtml({
            personName: person.name,
            ownerName: await ownerName(report.user_id),
            releaseUrl: `${appUrl}/vertrauen/todesfall/freigeben?token=${releaseToken}`,
            fallbackAt: report.fallback_deliver_at ?? nowIso,
            isReminder: true,
          }),
        });
        result.death.remindersSent++;
      } catch (e) {
        console.error(`Report ${report.id}: Erinnerungs-Mail fehlgeschlagen:`, e);
      }
    }
  }

  // --- C) Zustellen: zweite Bestätigung erteilt ODER Rückfalldatum erreicht ---
  //     Zwei Abfragen statt eines .or() — besser lesbar und ohne
  //     PostgREST-Syntaxrisiko. Danach nach id entdoppeln.
  const [confirmedRes, fallbackRes] = await Promise.all([
    supabase
      .from("death_reports")
      .select("id, user_id")
      .is("cancelled_at", null)
      .is("processed_at", null)
      .not("final_confirmed_at", "is", null)
      .limit(50),
    supabase
      .from("death_reports")
      .select("id, user_id")
      .is("cancelled_at", null)
      .is("processed_at", null)
      .lte("fallback_deliver_at", nowIso)
      .limit(50),
  ]);

  const drErr = confirmedRes.error ?? fallbackRes.error;
  const seenReportIds = new Set<string>();
  const dueReports = [
    ...(confirmedRes.data ?? []),
    ...(fallbackRes.data ?? []),
  ].filter((r) => {
    if (seenReportIds.has(r.id)) return false;
    seenReportIds.add(r.id);
    return true;
  });

  if (drErr) {
    console.error("death_reports query failed (Migration eingespielt?):", drErr.message);
  } else {
    for (const report of dueReports ?? []) {
      result.death.reports++;

      const { data: deathMessages, error: dmErr } = await supabase
        .from("messages")
        .select("id, title, body, recipient_name, recipient_email")
        .eq("user_id", report.user_id)
        .eq("trigger_type", "death")
        .eq("status", "scheduled")
        .limit(200);

      if (dmErr) {
        console.error(`death messages query failed (report ${report.id}):`, dmErr.message);
        continue; // Report bleibt unverarbeitet → nächster Lauf versucht es erneut
      }

      // Name der verstorbenen Person — für Absender ("Anna über Aethernal")
      // und den Rahmen der Zustell-Mail (Entscheidung 19.07.2026).
      const deceasedName = await ownerName(report.user_id);

      for (const m of deathMessages ?? []) {
        try {
          await sendEmail({
            to: m.recipient_email,
            subject: m.title,
            from: personalFrom(deceasedName),
            html: buildDeliveryHtml({
              recipientName: m.recipient_name,
              body: m.body,
              ownerName: deceasedName,
            }),
          });
          // death-Nachrichten sind einmalig → sofort 'sent' (Doppelversand-Schutz,
          // auch wenn der Lauf danach abbricht und der Report offen bleibt).
          await supabase
            .from("messages")
            .update({ status: "sent", sent_at: new Date().toISOString() })
            .eq("id", m.id);
          result.death.sent++;
        } catch (e) {
          result.death.failed++;
          await supabase.from("messages").update({ status: "failed" }).eq("id", m.id);
          console.error(`Death message ${m.id} failed:`, e);
        }
      }

      // Erst nach allen Zustellversuchen abschließen. Fehlgeschlagene Nachrichten
      // stehen auf 'failed' (kein Doppelversand; manuelle Nachsorge möglich).
      await supabase
        .from("death_reports")
        .update({ processed_at: new Date().toISOString() })
        .eq("id", report.id);
    }
  }

  return new Response(JSON.stringify(result), {
    headers: { "Content-Type": "application/json" },
  });
});
