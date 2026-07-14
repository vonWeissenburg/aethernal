import { redirect } from "next/navigation";
import { getAdmin, hashToken } from "@/lib/death-flow";
import { VertrauenShell, StatusCard } from "../../shell";

export const metadata = { title: "Meldung widerrufen" };

// Widerruf einer Todesfall-Meldung (B3) durch den Nutzer selbst.
// Zwei-Schritt (Button + POST), damit Mail-Scanner nichts auslösen.

async function findReport(token: string) {
  const admin = getAdmin();
  if (!admin) return { state: "unconfigured" as const };

  const { data } = await admin
    .from("death_reports")
    .select("id, effective_at, cancelled_at, processed_at")
    .eq("cancel_token_hash", hashToken(token))
    .single();

  if (!data || data.cancelled_at || data.processed_at) {
    return { state: "invalid" as const };
  }
  return { state: "valid" as const };
}

export default async function CancelDeathReportPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; status?: string }>;
}) {
  const { token, status } = await searchParams;

  async function cancelAction(formData: FormData) {
    "use server";

    const formToken = formData.get("token");
    if (typeof formToken !== "string" || !formToken) {
      redirect("/vertrauen/todesfall/widerruf?status=ungueltig");
    }

    const admin = getAdmin();
    if (!admin) redirect("/vertrauen/todesfall/widerruf?status=fehler");

    const { data } = await admin
      .from("death_reports")
      .select("id, cancelled_at, processed_at")
      .eq("cancel_token_hash", hashToken(formToken as string))
      .single();

    if (!data || data.cancelled_at || data.processed_at) {
      redirect("/vertrauen/todesfall/widerruf?status=ungueltig");
    }

    const { error } = await admin
      .from("death_reports")
      .update({
        cancelled_at: new Date().toISOString(),
        cancel_token_hash: null,
      })
      .eq("id", data.id);

    redirect(
      error
        ? "/vertrauen/todesfall/widerruf?status=fehler"
        : "/vertrauen/todesfall/widerruf?status=widerrufen"
    );
  }

  let content: React.ReactNode;

  if (status === "widerrufen") {
    content = (
      <StatusCard
        icon="favorite"
        iconClass="text-success"
        title="Schön, dass du da bist"
        text="Die Meldung wurde widerrufen — es wird nichts versendet. Wir empfehlen dir, mit deiner Vertrauensperson zu sprechen und bei Bedarf deine Vertrauenspersonen in den Einstellungen zu überprüfen."
      />
    );
  } else if (status === "fehler") {
    content = (
      <StatusCard
        icon="error"
        iconClass="text-error"
        title="Etwas ist schiefgelaufen"
        text="Der Widerruf konnte nicht gespeichert werden. Bitte versuche es sofort erneut."
      />
    );
  } else if (status === "ungueltig" || !token) {
    content = (
      <StatusCard
        icon="link_off"
        iconClass="text-on-surface-variant"
        title="Dieser Link ist nicht gültig"
        text="Der Widerrufslink ist ungültig, bereits verwendet oder die Frist ist abgelaufen."
      />
    );
  } else {
    const report = await findReport(token);
    if (report.state === "unconfigured") {
      content = (
        <StatusCard
          icon="build"
          iconClass="text-on-surface-variant"
          title="Noch nicht verfügbar"
          text="Diese Funktion ist serverseitig noch nicht eingerichtet. Bitte versuche es später erneut."
        />
      );
    } else if (report.state === "invalid") {
      content = (
        <StatusCard
          icon="link_off"
          iconClass="text-on-surface-variant"
          title="Dieser Link ist nicht gültig"
          text="Der Widerrufslink ist ungültig, bereits verwendet oder die Frist ist abgelaufen."
        />
      );
    } else {
      content = (
        <div className="glass-panel rounded-card border border-outline-variant/30 shadow-2xl p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-error/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-error text-3xl" aria-hidden="true">
              report
            </span>
          </div>
          <h1 className="font-headline text-2xl text-on-surface mb-3">
            Todesfall-Meldung widerrufen
          </h1>
          <p className="font-body text-sm text-on-surface-variant leading-relaxed mb-8">
            Eine Vertrauensperson hat gemeldet, dass du verstorben bist. Wenn
            das nicht stimmt, widerrufe die Meldung jetzt — dann wird nichts
            versendet.
          </p>
          <form action={cancelAction}>
            <input type="hidden" name="token" value={token} />
            <button
              type="submit"
              className="w-full bg-primary text-on-primary font-semibold py-4 rounded-button shadow-lg shadow-primary/20 hover:brightness-110 active:scale-[0.98] transition-all duration-250 ease-out text-sm tracking-widest uppercase"
            >
              Ich lebe — Meldung widerrufen
            </button>
          </form>
        </div>
      );
    }
  }

  return <VertrauenShell>{content}</VertrauenShell>;
}
