import { createHash } from "crypto";
import { redirect } from "next/navigation";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { VertrauenShell, StatusCard } from "../shell";

export const metadata = { title: "Vertrauensperson bestätigen" };

// Öffentliche Bestätigungsseite (B2). Bewusst ZWEI Schritte: die Seite zeigt
// erst einen Bestätigen-Button (POST) — Mail-Scanner, die Links vorab
// aufrufen, lösen so keine Bestätigung aus.

const INVITE_VALID_DAYS = 14;

function getAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createAdminClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function isExpired(invitedAt: string | null) {
  if (!invitedAt) return true;
  return Date.now() - new Date(invitedAt).getTime() > INVITE_VALID_DAYS * 24 * 60 * 60 * 1000;
}

async function findInvite(token: string) {
  const admin = getAdmin();
  if (!admin) return { state: "unconfigured" as const };

  const { data } = await admin
    .from("trusted_persons")
    .select("id, name, user_id, invited_at, confirmed")
    .eq("confirmation_token_hash", hashToken(token))
    .single();

  if (!data || data.confirmed) return { state: "invalid" as const };
  if (isExpired(data.invited_at)) return { state: "expired" as const };

  const { data: profile } = await admin
    .from("profiles")
    .select("full_name")
    .eq("id", data.user_id)
    .single();

  return {
    state: "valid" as const,
    personName: data.name as string,
    // Steht auf der Seite als Subjekt („… hat dich eingetragen") — Nominativ
    ownerName: (profile?.full_name as string | null)?.trim() || "Ein Aethernal-Mitglied",
  };
}

export default async function ConfirmTrustedPersonPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; status?: string }>;
}) {
  const { token, status } = await searchParams;

  async function confirmAction(formData: FormData) {
    "use server";

    const formToken = formData.get("token");
    if (typeof formToken !== "string" || !formToken) {
      redirect("/vertrauen/bestaetigen?status=ungueltig");
    }

    const admin = getAdmin();
    if (!admin) redirect("/vertrauen/bestaetigen?status=fehler");

    const { data } = await admin
      .from("trusted_persons")
      .select("id, invited_at, confirmed")
      .eq("confirmation_token_hash", hashToken(formToken as string))
      .single();

    if (!data || data.confirmed) redirect("/vertrauen/bestaetigen?status=ungueltig");
    if (isExpired(data.invited_at)) redirect("/vertrauen/bestaetigen?status=abgelaufen");

    const { error } = await admin
      .from("trusted_persons")
      .update({
        confirmed: true,
        confirmed_at: new Date().toISOString(),
        confirmation_token_hash: null,
      })
      .eq("id", data.id);

    redirect(error ? "/vertrauen/bestaetigen?status=fehler" : "/vertrauen/bestaetigen?status=bestaetigt");
  }

  let content: React.ReactNode;

  if (status === "bestaetigt") {
    content = (
      <StatusCard
        icon="verified"
        iconClass="text-success"
        title="Danke für dein Vertrauen"
        text="Du bist jetzt als Vertrauensperson bestätigt. Es gibt nichts weiter zu tun."
      >
        <p className="mt-4 font-body text-xs text-on-surface-variant/70 leading-relaxed">
          Im Ernstfall kannst du unter{" "}
          <a href="/vertrauen/todesfall" className="text-primary hover:underline">
            app.aethernal.me/vertrauen/todesfall
          </a>{" "}
          einen Todesfall melden.
        </p>
      </StatusCard>
    );
  } else if (status === "abgelaufen") {
    content = (
      <StatusCard
        icon="schedule"
        iconClass="text-warning"
        title="Dieser Link ist abgelaufen"
        text="Bestätigungs-Links sind aus Sicherheitsgründen nur begrenzt gültig. Bitte lass dir eine neue Einladung senden."
      />
    );
  } else if (status === "fehler") {
    content = (
      <StatusCard
        icon="error"
        iconClass="text-error"
        title="Etwas ist schiefgelaufen"
        text="Die Bestätigung konnte nicht gespeichert werden. Bitte versuche es später erneut."
      />
    );
  } else if (status === "ungueltig" || !token) {
    content = (
      <StatusCard
        icon="link_off"
        iconClass="text-on-surface-variant"
        title="Dieser Link ist nicht gültig"
        text="Der Bestätigungs-Link ist ungültig oder wurde bereits verwendet."
      />
    );
  } else {
    const invite = await findInvite(token);
    if (invite.state === "unconfigured") {
      content = (
        <StatusCard
          icon="build"
          iconClass="text-on-surface-variant"
          title="Noch nicht verfügbar"
          text="Die Bestätigung ist serverseitig noch nicht eingerichtet. Bitte versuche es später erneut."
        />
      );
    } else if (invite.state === "expired") {
      content = (
        <StatusCard
          icon="schedule"
          iconClass="text-warning"
          title="Dieser Link ist abgelaufen"
          text="Bestätigungs-Links sind aus Sicherheitsgründen nur begrenzt gültig. Bitte lass dir eine neue Einladung senden."
        />
      );
    } else if (invite.state === "invalid") {
      content = (
        <StatusCard
          icon="link_off"
          iconClass="text-on-surface-variant"
          title="Dieser Link ist nicht gültig"
          text="Der Bestätigungs-Link ist ungültig oder wurde bereits verwendet."
        />
      );
    } else {
      content = (
        <div className="glass-panel rounded-card border border-outline-variant/30 shadow-2xl p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-primary text-3xl" aria-hidden="true">
              handshake
            </span>
          </div>
          <h1 className="font-headline text-2xl text-on-surface mb-3">
            Hallo {invite.personName}
          </h1>
          <p className="font-body text-sm text-on-surface-variant leading-relaxed mb-2">
            <strong className="text-on-surface">{invite.ownerName}</strong> hat
            dich bei Aethernal als Vertrauensperson eingetragen.
          </p>
          <p className="font-body text-sm text-on-surface-variant leading-relaxed mb-8">
            Als Vertrauensperson wirst du im Ernstfall gebeten, den Tod zu
            bestätigen — erst dann werden die dafür vorgesehenen Nachrichten
            zugestellt.
          </p>
          <form action={confirmAction}>
            <input type="hidden" name="token" value={token} />
            <button
              type="submit"
              className="w-full gold-gradient text-on-primary font-semibold py-4 rounded-button shadow-lg shadow-primary/20 hover:brightness-110 active:scale-[0.98] transition-all duration-250 ease-out uppercase tracking-widest text-sm"
            >
              Rolle bestätigen
            </button>
          </form>
          <p className="mt-6 font-body text-xs text-on-surface-variant/70">
            Du möchtest die Rolle nicht übernehmen? Dann schließe diese Seite
            einfach — es passiert nichts weiter.
          </p>
        </div>
      );
    }
  }

  return <VertrauenShell>{content}</VertrauenShell>;
}
