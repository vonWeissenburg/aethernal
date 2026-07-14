import "server-only";
import { createHash, randomBytes } from "crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Gemeinsame Server-Helfer für den Todesbestätigungs-Flow (B3).
// Läuft ausschließlich serverseitig (Service-Role).

export const REPORT_LINK_VALID_HOURS = 48;
export const GRACE_PERIOD_DAYS = 7;

export function getAdmin(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export function newToken(): string {
  return randomBytes(32).toString("hex");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function isExpired(sinceIso: string | null, validMs: number): boolean {
  if (!sinceIso) return true;
  return Date.now() - new Date(sinceIso).getTime() > validMs;
}

export function formatDateTimeVienna(iso: string): string {
  return new Intl.DateTimeFormat("de-AT", {
    timeZone: "Europe/Vienna",
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

/** Mail über Resend senden. Liefert false statt zu werfen (Flow soll robust bleiben). */
export async function sendMail(opts: {
  to: string;
  subject: string;
  html: string;
}): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.FROM_EMAIL;
  if (!apiKey || !fromEmail) return false;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromEmail,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
    }),
  });
  if (!res.ok) {
    console.error("death-flow mail failed", res.status, await res.text().catch(() => ""));
  }
  return res.ok;
}

export function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Schlichter, würdiger Mail-Rahmen (hell — E-Mail-Clients). */
export function mailShell(inner: string) {
  return `<!DOCTYPE html>
<html lang="de">
  <body style="margin:0;padding:0;background:#f6f4ef;font-family:Georgia,'Times New Roman',serif;color:#2e2a20;">
    <div style="max-width:560px;margin:0 auto;padding:40px 24px;">
      <p style="text-align:center;font-style:italic;font-size:20px;color:#8a6d1a;margin:0 0 32px;">&#10024; Aethernal</p>
      <div style="background:#ffffff;border:1px solid #e5dfd0;border-radius:12px;padding:32px;">
        ${inner}
      </div>
      <p style="text-align:center;font-size:11px;color:#a09880;margin:24px 0 0;">
        Gesendet über Aethernal · aethernal.me
      </p>
    </div>
  </body>
</html>`;
}

export function mailButton(href: string, label: string, color = "#D4AF37", textColor = "#3C2F00") {
  return `<p style="text-align:center;margin:24px 0;">
    <a href="${href}" style="display:inline-block;background:${color};color:${textColor};text-decoration:none;font-weight:bold;padding:14px 32px;border-radius:8px;font-family:Arial,Helvetica,sans-serif;font-size:15px;">
      ${label}
    </a>
  </p>`;
}
