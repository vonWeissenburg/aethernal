import { redirect } from "next/navigation";
import {
  getAdmin,
  newToken,
  hashToken,
  sendMail,
  mailShell,
  mailButton,
  escapeHtml,
  REPORT_LINK_VALID_HOURS,
} from "@/lib/death-flow";
import { VertrauenShell, StatusCard } from "../shell";

export const metadata = { title: "Todesfall melden" };

// Schritt 1 des Todesbestätigungs-Flows (B3): Die Vertrauensperson fordert
// mit ihrer E-Mail-Adresse einen Melde-Link an. Die Antwort ist bewusst
// immer gleich (kein E-Mail-Enumeration-Leck).

export default async function DeathReportRequestPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;

  async function requestAction(formData: FormData) {
    "use server";

    const email = String(formData.get("email") ?? "").trim();
    if (!email) redirect("/vertrauen/todesfall");

    const admin = getAdmin();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;

    if (admin && appUrl) {
      const { data: persons } = await admin
        .from("trusted_persons")
        .select("id, name, email, user_id")
        .ilike("email", email)
        .eq("confirmed", true)
        .limit(10);

      if (persons && persons.length > 0) {
        const links: string[] = [];
        for (const person of persons) {
          const token = newToken();
          const { error } = await admin
            .from("trusted_persons")
            .update({
              death_report_token_hash: hashToken(token),
              death_report_requested_at: new Date().toISOString(),
            })
            .eq("id", person.id);
          if (error) continue;

          const { data: profile } = await admin
            .from("profiles")
            .select("full_name")
            .eq("id", person.user_id)
            .single();
          const ownerName = profile?.full_name?.trim() || "einem Aethernal-Mitglied";

          links.push(
            `<p style="font-size:15px;line-height:1.6;margin:0 0 8px;">Für <strong>${escapeHtml(ownerName)}</strong>:</p>` +
              mailButton(
                `${appUrl}/vertrauen/todesfall/bestaetigen?token=${token}`,
                "Todesfall melden",
                "#3a4a6b",
                "#ffffff"
              )
          );
        }

        if (links.length > 0) {
          await sendMail({
            to: persons[0].email,
            subject: "Aethernal — dein Link zur Todesfall-Meldung",
            html: mailShell(
              `<p style="font-size:16px;line-height:1.6;margin:0 0 16px;">Hallo ${escapeHtml(persons[0].name)},</p>` +
                `<p style="font-size:16px;line-height:1.6;margin:0 0 16px;">du hast einen Link angefordert, um als Vertrauensperson einen Todesfall zu melden. Unser aufrichtiges Mitgefühl, falls du diesen Schritt gehen musst.</p>` +
                links.join("") +
                `<p style="font-size:13px;line-height:1.6;color:#7a7263;margin:16px 0 0;">Der Link ist ${REPORT_LINK_VALID_HOURS} Stunden gültig. Wenn du diese Anfrage nicht gestellt hast, ignoriere diese E-Mail — es passiert nichts.</p>`
            ),
          });
        }
      }
    }

    redirect("/vertrauen/todesfall?status=gesendet");
  }

  if (status === "gesendet") {
    return (
      <VertrauenShell>
        <StatusCard
          icon="mark_email_read"
          iconClass="text-success"
          title="Wenn wir dich kennen, hast du Post"
          text={`Ist deine E-Mail-Adresse als bestätigte Vertrauensperson hinterlegt, haben wir dir soeben einen Link geschickt (gültig ${REPORT_LINK_VALID_HOURS} Stunden). Prüfe auch den Spam-Ordner.`}
        />
      </VertrauenShell>
    );
  }

  return (
    <VertrauenShell>
      <div className="glass-panel rounded-card border border-outline-variant/30 shadow-2xl p-8">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-tertiary/10 flex items-center justify-center">
          <span className="material-symbols-outlined text-tertiary text-3xl" aria-hidden="true">
            volunteer_activism
          </span>
        </div>
        <h1 className="font-headline text-2xl text-on-surface mb-3 text-center">
          Einen Todesfall melden
        </h1>
        <p className="font-body text-sm text-on-surface-variant leading-relaxed mb-6 text-center">
          Unser aufrichtiges Mitgefühl. Wenn du als Vertrauensperson eingetragen
          bist, senden wir dir einen sicheren Link an deine E-Mail-Adresse.
        </p>
        <form action={requestAction} className="space-y-4">
          <div>
            <label
              htmlFor="tp-email"
              className="font-label text-xs uppercase tracking-widest text-on-surface-variant ml-1 mb-2 block"
            >
              Deine E-Mail-Adresse
            </label>
            <input
              id="tp-email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="name@beispiel.at"
              className="block w-full px-4 py-4 rounded-button border-none bg-surface-container text-on-surface placeholder:text-on-surface-variant/40 focus:ring-2 focus:ring-primary/50 transition-all duration-250 ease-out"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-tertiary-container text-on-tertiary-container font-semibold py-4 rounded-button shadow-lg hover:brightness-110 active:scale-[0.98] transition-all duration-250 ease-out text-sm tracking-widest uppercase"
          >
            Link anfordern
          </button>
        </form>
      </div>
    </VertrauenShell>
  );
}
