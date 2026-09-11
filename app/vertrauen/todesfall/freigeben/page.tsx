import { redirect } from "next/navigation";
import {
  getAdmin,
  hashToken,
  formatDateTimeVienna,
  GRACE_PERIOD_DAYS,
} from "@/lib/death-flow";
import { VertrauenShell, StatusCard } from "../../shell";

export const metadata = { title: "Nachrichten freigeben" };

// Schritt 3 des Todesbestätigungs-Flows: die ZWEITE Bestätigung (Entscheidung
// 28.08.2026). Die Karenzzeit ist abgelaufen, der Nutzer hat nicht widerrufen.
// Bevor zugestellt wird, bestätigt die Vertrauensperson ein zweites Mal — zwei
// getrennte, bewusste Handlungen eines Menschen, den der Nutzer selbst benannt hat.
//
// Bleibt diese Bestätigung aus, stellt der Scheduler am Rückfalldatum
// (fallback_deliver_at) trotzdem zu. Diese Seite sagt das ausdrücklich, damit
// niemand glaubt, sein Schweigen würde die Nachrichten für immer aufhalten.

async function findRelease(token: string) {
  const admin = getAdmin();
  if (!admin) return { state: "unconfigured" as const };

  const { data } = await admin
    .from("death_reports")
    .select(
      "id, user_id, trusted_person_id, cancelled_at, processed_at, final_confirmed_at, fallback_deliver_at"
    )
    .eq("final_confirm_token_hash", hashToken(token))
    .single();

  if (!data || data.cancelled_at || data.processed_at) {
    return { state: "invalid" as const };
  }
  if (data.final_confirmed_at) return { state: "already" as const };

  const { data: profile } = await admin
    .from("profiles")
    .select("full_name")
    .eq("id", data.user_id)
    .single();

  let personName = "";
  if (data.trusted_person_id) {
    const { data: person } = await admin
      .from("trusted_persons")
      .select("name")
      .eq("id", data.trusted_person_id)
      .single();
    personName = (person?.name as string | null)?.trim() || "";
  }

  return {
    state: "valid" as const,
    personName,
    ownerName:
      (profile?.full_name as string | null)?.trim() || "dieses Aethernal-Mitglied",
    fallbackAt: data.fallback_deliver_at as string | null,
  };
}

export default async function ReleaseMessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; status?: string }>;
}) {
  const { token, status } = await searchParams;

  async function releaseAction(formData: FormData) {
    "use server";

    const formToken = formData.get("token");
    if (typeof formToken !== "string" || !formToken) {
      redirect("/vertrauen/todesfall/freigeben?status=ungueltig");
    }

    const admin = getAdmin();
    if (!admin) redirect("/vertrauen/todesfall/freigeben?status=fehler");

    const { data } = await admin
      .from("death_reports")
      .select("id, cancelled_at, processed_at, final_confirmed_at")
      .eq("final_confirm_token_hash", hashToken(formToken as string))
      .single();

    if (!data || data.cancelled_at || data.processed_at) {
      redirect("/vertrauen/todesfall/freigeben?status=ungueltig");
    }
    if (data.final_confirmed_at) {
      redirect("/vertrauen/todesfall/freigeben?status=freigegeben");
    }

    // Token entwerten und Freigabe vermerken. Der Scheduler stellt beim nächsten
    // Lauf zu; bis dahin bleibt der Widerrufslink des Nutzers gültig.
    const { error } = await admin
      .from("death_reports")
      .update({
        final_confirmed_at: new Date().toISOString(),
        final_confirm_token_hash: null,
      })
      .eq("id", data.id);

    redirect(
      error
        ? "/vertrauen/todesfall/freigeben?status=fehler"
        : "/vertrauen/todesfall/freigeben?status=freigegeben"
    );
  }

  let content: React.ReactNode;

  if (status === "freigegeben") {
    content = (
      <StatusCard
        icon="check_circle"
        iconClass="text-success"
        title="Danke — die Nachrichten sind freigegeben"
        text="Die hinterlassenen Nachrichten werden innerhalb der nächsten 24 Stunden an ihre Empfänger zugestellt. Du musst nichts weiter tun."
      />
    );
  } else if (status === "fehler") {
    content = (
      <StatusCard
        icon="error"
        iconClass="text-error"
        title="Etwas ist schiefgelaufen"
        text="Die Freigabe konnte nicht gespeichert werden. Bitte versuche es später erneut — die Nachrichten werden auch ohne deine Freigabe zum genannten Termin zugestellt."
      />
    );
  } else if (status === "ungueltig" || !token) {
    content = (
      <StatusCard
        icon="link_off"
        iconClass="text-on-surface-variant"
        title="Dieser Link ist nicht gültig"
        text="Der Link ist ungültig, bereits verwendet, durch einen neueren ersetzt oder die Meldung wurde widerrufen."
      />
    );
  } else {
    const release = await findRelease(token);
    if (release.state === "unconfigured") {
      content = (
        <StatusCard
          icon="build"
          iconClass="text-on-surface-variant"
          title="Noch nicht verfügbar"
          text="Diese Funktion ist serverseitig noch nicht eingerichtet. Bitte versuche es später erneut."
        />
      );
    } else if (release.state === "already") {
      content = (
        <StatusCard
          icon="check_circle"
          iconClass="text-success"
          title="Bereits freigegeben"
          text="Diese Freigabe ist schon erfolgt. Die Nachrichten werden zugestellt — du musst nichts weiter tun."
        />
      );
    } else if (release.state === "invalid") {
      content = (
        <StatusCard
          icon="link_off"
          iconClass="text-on-surface-variant"
          title="Dieser Link ist nicht gültig"
          text="Der Link ist ungültig, bereits verwendet, durch einen neueren ersetzt oder die Meldung wurde widerrufen."
        />
      );
    } else {
      content = (
        <div className="glass-panel rounded-card border border-outline-variant/30 shadow-2xl p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-tertiary/10 flex items-center justify-center">
            <span
              className="material-symbols-outlined text-tertiary text-3xl"
              aria-hidden="true"
            >
              mail
            </span>
          </div>
          <h1 className="font-headline text-2xl text-on-surface mb-3">
            Die letzte Bestätigung
          </h1>
          <p className="font-body text-sm text-on-surface-variant leading-relaxed mb-2">
            {release.personName ? `Hallo ${release.personName}. ` : ""}Die
            Schutzfrist von {GRACE_PERIOD_DAYS} Tagen ist abgelaufen, und die
            Meldung zu{" "}
            <strong className="text-on-surface">{release.ownerName}</strong>{" "}
            wurde nicht widerrufen.
          </p>
          <p className="font-body text-sm text-on-surface-variant leading-relaxed mb-6">
            Bitte bestätige ein zweites Mal. Danach werden die hinterlassenen
            Nachrichten an ihre Empfänger zugestellt.
          </p>
          <form action={releaseAction}>
            <input type="hidden" name="token" value={token} />
            <button
              type="submit"
              className="w-full bg-tertiary-container text-on-tertiary-container font-semibold py-4 rounded-button shadow-lg hover:brightness-110 active:scale-[0.98] transition-all duration-250 ease-out text-sm tracking-widest uppercase"
            >
              Nachrichten jetzt freigeben
            </button>
          </form>
          <p className="mt-6 font-body text-xs text-on-surface-variant/70 leading-relaxed">
            {release.fallbackAt
              ? `Wenn du nichts tust, werden die Nachrichten am ${formatDateTimeVienna(
                  release.fallbackAt
                )} automatisch zugestellt. Dein Schweigen hält sie nicht dauerhaft auf.`
              : "Wenn du nichts tust, werden die Nachrichten zum hinterlegten Termin automatisch zugestellt."}
          </p>
        </div>
      );
    }
  }

  return <VertrauenShell>{content}</VertrauenShell>;
}
