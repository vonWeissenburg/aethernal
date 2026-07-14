import { redirect } from "next/navigation";
import {
  getAdmin,
  newToken,
  hashToken,
  isExpired,
  sendMail,
  mailShell,
  mailButton,
  escapeHtml,
  formatDateTimeVienna,
  REPORT_LINK_VALID_HOURS,
  GRACE_PERIOD_DAYS,
} from "@/lib/death-flow";
import { VertrauenShell, StatusCard } from "../../shell";

export const metadata = { title: "Todesfall bestätigen" };

// Schritt 2 des Todesbestätigungs-Flows (B3): Die Vertrauensperson bestätigt
// den Todesfall bewusst per Button (kein Auto-Trigger durch Mail-Scanner).
// Danach beginnt die Karenzzeit — der Nutzer wird sofort informiert und kann
// widerrufen. Erst nach Ablauf versendet der Scheduler die death-Nachrichten.

async function findReportInvite(token: string) {
  const admin = getAdmin();
  if (!admin) return { state: "unconfigured" as const };

  const { data } = await admin
    .from("trusted_persons")
    .select("id, name, user_id, death_report_requested_at, confirmed")
    .eq("death_report_token_hash", hashToken(token))
    .single();

  if (!data || !data.confirmed) return { state: "invalid" as const };
  if (isExpired(data.death_report_requested_at, REPORT_LINK_VALID_HOURS * 60 * 60 * 1000)) {
    return { state: "expired" as const };
  }

  const { data: profile } = await admin
    .from("profiles")
    .select("full_name")
    .eq("id", data.user_id)
    .single();

  return {
    state: "valid" as const,
    personName: data.name as string,
    ownerName: (profile?.full_name as string | null)?.trim() || "dieses Aethernal-Mitglied",
  };
}

export default async function DeathReportConfirmPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; status?: string }>;
}) {
  const { token, status } = await searchParams;

  async function reportAction(formData: FormData) {
    "use server";

    const formToken = formData.get("token");
    if (typeof formToken !== "string" || !formToken) {
      redirect("/vertrauen/todesfall/bestaetigen?status=ungueltig");
    }

    const admin = getAdmin();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!admin || !appUrl) redirect("/vertrauen/todesfall/bestaetigen?status=fehler");

    const { data: person } = await admin
      .from("trusted_persons")
      .select("id, name, user_id, death_report_requested_at, confirmed")
      .eq("death_report_token_hash", hashToken(formToken as string))
      .single();

    if (!person || !person.confirmed) {
      redirect("/vertrauen/todesfall/bestaetigen?status=ungueltig");
    }
    if (isExpired(person.death_report_requested_at, REPORT_LINK_VALID_HOURS * 60 * 60 * 1000)) {
      redirect("/vertrauen/todesfall/bestaetigen?status=abgelaufen");
    }

    const cancelToken = newToken();
    const effectiveAt = new Date(
      Date.now() + GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000
    ).toISOString();

    const { error: insertError } = await admin.from("death_reports").insert({
      user_id: person.user_id,
      trusted_person_id: person.id,
      effective_at: effectiveAt,
      cancel_token_hash: hashToken(cancelToken),
    });

    // Unique-Index: es existiert bereits ein aktiver Report → wie Erfolg behandeln
    if (insertError) {
      if (insertError.code === "23505") {
        await admin
          .from("trusted_persons")
          .update({ death_report_token_hash: null })
          .eq("id", person.id);
        redirect("/vertrauen/todesfall/bestaetigen?status=gemeldet");
      }
      redirect("/vertrauen/todesfall/bestaetigen?status=fehler");
    }

    // Melde-Token entwerten
    await admin
      .from("trusted_persons")
      .update({ death_report_token_hash: null })
      .eq("id", person.id);

    // Warn-Mail mit Widerrufslink an den Nutzer — der wichtigste Schutz.
    const { data: owner } = await admin.auth.admin.getUserById(person.user_id);
    const ownerEmail = owner?.user?.email;
    if (ownerEmail) {
      const cancelUrl = `${appUrl}/vertrauen/todesfall/widerruf?token=${cancelToken}`;
      await sendMail({
        to: ownerEmail,
        subject: "Wichtig: Bei Aethernal wurde dein Tod gemeldet",
        html: mailShell(
          `<p style="font-size:16px;line-height:1.6;margin:0 0 16px;"><strong>${escapeHtml(person.name)}</strong> hat als deine Vertrauensperson gemeldet, dass du verstorben bist.</p>` +
            `<p style="font-size:16px;line-height:1.6;margin:0 0 16px;">Wenn diese Meldung zutrifft, musst du nichts tun. Deine „Nach dem Tod"-Nachrichten werden am <strong>${formatDateTimeVienna(effectiveAt)}</strong> zugestellt.</p>` +
            `<p style="font-size:16px;line-height:1.6;margin:0 0 8px;"><strong>Wenn du lebst und diese Meldung falsch ist</strong>, widerrufe sie bitte sofort:</p>` +
            mailButton(cancelUrl, "Ich lebe — Meldung widerrufen", "#b3261e", "#ffffff") +
            `<p style="font-size:13px;line-height:1.6;color:#7a7263;margin:16px 0 0;">Der Widerrufslink ist bis zum genannten Zeitpunkt gültig. Bis dahin wird keine einzige Nachricht versendet.</p>`
        ),
      });
    }

    redirect("/vertrauen/todesfall/bestaetigen?status=gemeldet");
  }

  let content: React.ReactNode;

  if (status === "gemeldet") {
    content = (
      <StatusCard
        icon="check_circle"
        iconClass="text-success"
        title="Danke — die Meldung ist eingegangen"
        text={`In Gedenken. Aus Sicherheitsgründen gilt nun eine Schutzfrist von ${GRACE_PERIOD_DAYS} Tagen, in der die Meldung widerrufen werden kann. Danach werden die hinterlassenen Nachrichten zugestellt. Du musst nichts weiter tun.`}
      />
    );
  } else if (status === "abgelaufen") {
    content = (
      <StatusCard
        icon="schedule"
        iconClass="text-warning"
        title="Dieser Link ist abgelaufen"
        text="Melde-Links sind aus Sicherheitsgründen nur kurz gültig. Bitte fordere einen neuen Link an."
      />
    );
  } else if (status === "fehler") {
    content = (
      <StatusCard
        icon="error"
        iconClass="text-error"
        title="Etwas ist schiefgelaufen"
        text="Die Meldung konnte nicht gespeichert werden. Bitte versuche es später erneut."
      />
    );
  } else if (status === "ungueltig" || !token) {
    content = (
      <StatusCard
        icon="link_off"
        iconClass="text-on-surface-variant"
        title="Dieser Link ist nicht gültig"
        text="Der Melde-Link ist ungültig oder wurde bereits verwendet."
      />
    );
  } else {
    const invite = await findReportInvite(token);
    if (invite.state === "unconfigured") {
      content = (
        <StatusCard
          icon="build"
          iconClass="text-on-surface-variant"
          title="Noch nicht verfügbar"
          text="Diese Funktion ist serverseitig noch nicht eingerichtet. Bitte versuche es später erneut."
        />
      );
    } else if (invite.state === "expired") {
      content = (
        <StatusCard
          icon="schedule"
          iconClass="text-warning"
          title="Dieser Link ist abgelaufen"
          text="Melde-Links sind aus Sicherheitsgründen nur kurz gültig. Bitte fordere einen neuen Link an."
        />
      );
    } else if (invite.state === "invalid") {
      content = (
        <StatusCard
          icon="link_off"
          iconClass="text-on-surface-variant"
          title="Dieser Link ist nicht gültig"
          text="Der Melde-Link ist ungültig oder wurde bereits verwendet."
        />
      );
    } else {
      content = (
        <div className="glass-panel rounded-card border border-outline-variant/30 shadow-2xl p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-tertiary/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-tertiary text-3xl" aria-hidden="true">
              volunteer_activism
            </span>
          </div>
          <h1 className="font-headline text-2xl text-on-surface mb-3">
            In stillem Gedenken
          </h1>
          <p className="font-body text-sm text-on-surface-variant leading-relaxed mb-2">
            Hallo {invite.personName}. Du bist dabei zu bestätigen, dass{" "}
            <strong className="text-on-surface">{invite.ownerName}</strong>{" "}
            verstorben ist.
          </p>
          <p className="font-body text-sm text-on-surface-variant leading-relaxed mb-8">
            Nach deiner Bestätigung beginnt eine Schutzfrist von{" "}
            {GRACE_PERIOD_DAYS} Tagen. Danach werden die hinterlassenen
            Nachrichten an ihre Empfänger zugestellt. Bitte bestätige nur, wenn
            du dir sicher bist.
          </p>
          <form action={reportAction}>
            <input type="hidden" name="token" value={token} />
            <button
              type="submit"
              className="w-full bg-tertiary-container text-on-tertiary-container font-semibold py-4 rounded-button shadow-lg hover:brightness-110 active:scale-[0.98] transition-all duration-250 ease-out text-sm tracking-widest uppercase"
            >
              Ich bestätige den Todesfall
            </button>
          </form>
          <p className="mt-6 font-body text-xs text-on-surface-variant/70">
            Falsch hier? Schließe diese Seite einfach — es passiert nichts.
          </p>
        </div>
      );
    }
  }

  return <VertrauenShell>{content}</VertrauenShell>;
}
