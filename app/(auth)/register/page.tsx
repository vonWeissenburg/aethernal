import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { validateRegistration, firstError } from "@/lib/validation";
import Link from "next/link";
import { isRegistrationOpen } from "@/lib/registration";

export const metadata = { title: "Registrieren" };

// Ohne das rendert Next die geschlossene Fassung beim Bauen einmal vor und
// liefert sie danach statisch aus — REGISTRATION_OPEN in der .env hätte dann
// keine Wirkung mehr. Nachgewiesen im Smoke-Test am 11.09.2026.
export const dynamic = "force-dynamic";

const GESCHLOSSEN_HINWEIS =
  "Die Registrierung ist derzeit geschlossen. Bestehende Konten kannst du weiter nutzen.";

export default function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  async function signUp(formData: FormData) {
    "use server";

    // Zweiter Riegel: Server Actions sind adressierbar, auch wenn kein Formular
    // gerendert wird.
    if (!isRegistrationOpen()) {
      redirect("/login?message=" + encodeURIComponent(GESCHLOSSEN_HINWEIS));
    }

    const fullName = formData.get("full_name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirm_password") as string;

    const errors = validateRegistration({
      full_name: fullName,
      email,
      password,
      confirm_password: confirmPassword,
    });
    if (errors.length > 0) {
      redirect("/register?message=" + encodeURIComponent(firstError(errors)));
    }

    const supabase = await createClient();

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
      },
    });

    if (error) {
      redirect("/register?message=" + encodeURIComponent(error.message));
    }

    redirect(
      "/login?message=" +
        encodeURIComponent(
          "Registrierung erfolgreich! Bitte bestätige deine E-Mail-Adresse."
        )
    );
  }

  if (!isRegistrationOpen()) {
    return <RegistrierungGeschlossen />;
  }

  return <RegisterForm signUp={signUp} searchParams={searchParams} />;
}

async function RegisterForm({
  signUp,
  searchParams,
}: {
  signUp: (formData: FormData) => Promise<void>;
  searchParams: Promise<{ message?: string }>;
}) {
  const { message } = await searchParams;

  return (
    <>
      {/* Heading */}
      <div className="text-center mb-10">
        <h1 className="font-headline text-3xl md:text-4xl text-on-surface mb-2 tracking-tight">
          Konto erstellen
        </h1>
        <p className="font-body text-on-surface-variant text-sm">
          Beginne, Erinnerungen zu bewahren.
        </p>
      </div>

      <div className="space-y-8">
        {message && (
          <div className="rounded-button bg-error/10 border border-error-container/30 px-4 py-3 text-sm text-error">
            {message}
          </div>
        )}

        {/* Form Card */}
        <div className="glass-panel p-8 rounded-card border border-outline-variant/30 shadow-2xl relative overflow-hidden">
          {/* Decorative glow */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/5 rounded-full blur-3xl" />

          <form action={signUp} className="space-y-5 relative z-10">
            {/* Full Name */}
            <div className="space-y-2">
              <label
                htmlFor="full_name"
                className="font-label text-xs uppercase tracking-widest text-on-surface-variant ml-1"
              >
                Vollständiger Name
              </label>
              <input
                id="full_name"
                name="full_name"
                type="text"
                required
                autoComplete="name"
                placeholder="Elias Müller"
                className="w-full bg-surface-container border-none rounded-button p-4 text-on-surface placeholder:text-on-surface-variant/40 focus:ring-2 focus:ring-primary/50 transition-all duration-250 ease-out"
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="font-label text-xs uppercase tracking-widest text-on-surface-variant ml-1"
              >
                E-Mail-Adresse
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="name@beispiel.at"
                className="w-full bg-surface-container border-none rounded-button p-4 text-on-surface placeholder:text-on-surface-variant/40 focus:ring-2 focus:ring-primary/50 transition-all duration-250 ease-out"
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label
                htmlFor="password"
                className="font-label text-xs uppercase tracking-widest text-on-surface-variant ml-1"
              >
                Passwort
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                placeholder="••••••••"
                className="w-full bg-surface-container border-none rounded-button p-4 text-on-surface placeholder:text-on-surface-variant/40 focus:ring-2 focus:ring-primary/50 transition-all duration-250 ease-out"
              />
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <label
                htmlFor="confirm_password"
                className="font-label text-xs uppercase tracking-widest text-on-surface-variant ml-1"
              >
                Passwort bestätigen
              </label>
              <input
                id="confirm_password"
                name="confirm_password"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                placeholder="••••••••"
                className="w-full bg-surface-container border-none rounded-button p-4 text-on-surface placeholder:text-on-surface-variant/40 focus:ring-2 focus:ring-primary/50 transition-all duration-250 ease-out"
              />
            </div>

            {/* Terms */}
            <p className="text-xs text-on-surface-variant leading-relaxed px-1">
              Mit der Registrierung akzeptierst du unsere{" "}
              <a
                href="https://aethernal.me/agb"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                AGB
              </a>{" "}
              und{" "}
              <a
                href="https://aethernal.me/datenschutz"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Datenschutzerklärung
              </a>
              .
            </p>

            {/* Submit */}
            <button
              type="submit"
              className="w-full gold-gradient text-on-primary font-semibold py-4 rounded-button shadow-lg shadow-primary/20 hover:brightness-110 active:scale-[0.98] transition-all duration-250 ease-out uppercase tracking-widest text-sm mt-4"
            >
              Registrieren
            </button>
          </form>
        </div>

        {/* Bottom Anchor */}
        <div className="text-center">
          <p className="text-sm font-body text-on-surface-variant/70">
            Bereits ein Konto?{" "}
            <Link
              href="/login"
              className="text-primary font-medium ml-1 hover:underline underline-offset-4"
            >
              Anmelden
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}

function RegistrierungGeschlossen() {
  return (
    <>
      <div className="text-center mb-10">
        <h1 className="font-headline text-3xl md:text-4xl text-on-surface mb-2 tracking-tight">
          Wir öffnen bald
        </h1>
        <p className="font-body text-on-surface-variant text-sm">
          Die Anmeldung für neue Konten ist derzeit geschlossen.
        </p>
      </div>

      <div className="glass-panel p-8 rounded-card border border-outline-variant/30 shadow-2xl relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/5 rounded-full blur-3xl" />
        <div className="relative z-10 space-y-5 text-center">
          <span
            className="material-symbols-outlined text-primary/80 text-4xl"
            aria-hidden="true"
          >
            potted_plant
          </span>
          <p className="font-body text-on-surface-variant leading-relaxed">
            Aethernal bewahrt, was von einem Menschen bleibt. Bevor wir fremde
            Erinnerungen annehmen, bringen wir Datenschutz und Nutzungsbedingungen
            auf den Stand, den dieses Versprechen verdient. Das dauert noch einen
            Moment.
          </p>
          <p className="font-body text-on-surface-variant/70 text-sm leading-relaxed">
            Wenn du bereits ein Konto hast, kannst du dich ganz normal anmelden.
          </p>
          <div className="pt-2">
            <Link
              href="/login"
              className="inline-block bg-primary text-on-primary font-label text-sm uppercase tracking-widest px-8 py-3 rounded-button hover:bg-primary-fixed transition-colors"
            >
              Zur Anmeldung
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
