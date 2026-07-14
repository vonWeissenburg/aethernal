import { NextResponse } from "next/server";
import { createHash, randomBytes } from "crypto";
import { createClient } from "@/lib/supabase/server";

// Einladungs-Mail an eine Vertrauensperson (B2).
// Es wird nur der SHA-256-Hash des Tokens gespeichert; der Klartext-Token
// existiert ausschließlich im Bestätigungs-Link der E-Mail.

// Muss zur Prüfung in app/vertrauen/bestaetigen synchron bleiben
const INVITE_VALID_DAYS = 14;

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const id = body?.id;
  if (!id || typeof id !== "string") {
    return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 400 });
  }

  const { data: tp } = await supabase
    .from("trusted_persons")
    .select("id, name, email, confirmed")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();
  if (!tp) {
    return NextResponse.json({ error: "Vertrauensperson nicht gefunden." }, { status: 404 });
  }
  if (tp.confirmed) {
    return NextResponse.json({ error: "Diese Vertrauensperson ist bereits bestätigt." }, { status: 409 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.FROM_EMAIL;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!apiKey || !fromEmail || !appUrl) {
    return NextResponse.json(
      { error: "Der E-Mail-Versand ist noch nicht konfiguriert." },
      { status: 503 }
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();
  const ownerName = profile?.full_name?.trim() || "Ein Aethernal-Mitglied";

  const token = randomBytes(32).toString("hex");
  const tokenHash = createHash("sha256").update(token).digest("hex");

  const { error: updateError } = await supabase
    .from("trusted_persons")
    .update({
      confirmation_token_hash: tokenHash,
      invited_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (updateError) {
    return NextResponse.json(
      { error: "Der Einladungs-Flow ist serverseitig noch nicht eingerichtet (Migration ausstehend)." },
      { status: 503 }
    );
  }

  const confirmUrl = `${appUrl}/vertrauen/bestaetigen?token=${token}`;

  const mailRes = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromEmail,
      to: tp.email,
      subject: `${ownerName} möchte dich als Vertrauensperson eintragen`,
      html: buildInviteHtml({ personName: tp.name, ownerName, confirmUrl }),
    }),
  });

  if (!mailRes.ok) {
    console.error("Einladungs-Mail fehlgeschlagen", mailRes.status, await mailRes.text().catch(() => ""));
    return NextResponse.json(
      { error: "Die Einladungs-Mail konnte nicht gesendet werden. Bitte versuche es später erneut." },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true });
}

function buildInviteHtml({
  personName,
  ownerName,
  confirmUrl,
}: {
  personName: string;
  ownerName: string;
  confirmUrl: string;
}) {
  return `<!DOCTYPE html>
<html lang="de">
  <body style="margin:0;padding:0;background:#f6f4ef;font-family:Georgia,'Times New Roman',serif;color:#2e2a20;">
    <div style="max-width:560px;margin:0 auto;padding:40px 24px;">
      <p style="text-align:center;font-style:italic;font-size:20px;color:#8a6d1a;margin:0 0 32px;">&#10024; Aethernal</p>
      <div style="background:#ffffff;border:1px solid #e5dfd0;border-radius:12px;padding:32px;">
        <p style="font-size:16px;line-height:1.6;margin:0 0 16px;">Hallo ${escapeHtml(personName)},</p>
        <p style="font-size:16px;line-height:1.6;margin:0 0 16px;">
          <strong>${escapeHtml(ownerName)}</strong> hat dich bei Aethernal als
          Vertrauensperson eingetragen.
        </p>
        <p style="font-size:16px;line-height:1.6;margin:0 0 24px;">
          Aethernal bewahrt Erinnerungen und Nachrichten an geliebte Menschen.
          Als Vertrauensperson wirst du im Ernstfall gebeten, den Tod von
          ${escapeHtml(ownerName)} zu bestätigen — erst dann werden die dafür
          vorgesehenen Nachrichten zugestellt.
        </p>
        <p style="text-align:center;margin:0 0 24px;">
          <a href="${confirmUrl}" style="display:inline-block;background:#D4AF37;color:#3C2F00;text-decoration:none;font-weight:bold;padding:14px 32px;border-radius:8px;font-family:Arial,Helvetica,sans-serif;font-size:15px;">
            Rolle als Vertrauensperson bestätigen
          </a>
        </p>
        <p style="font-size:13px;line-height:1.6;color:#7a7263;margin:0;">
          Der Link ist ${INVITE_VALID_DAYS} Tage gültig. Wenn du diese Rolle
          nicht übernehmen möchtest, kannst du diese E-Mail einfach ignorieren.
        </p>
      </div>
      <p style="text-align:center;font-size:11px;color:#a09880;margin:24px 0 0;">
        Gesendet über Aethernal · aethernal.me
      </p>
    </div>
  </body>
</html>`;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
