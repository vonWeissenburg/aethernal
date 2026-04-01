import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export const metadata = { title: "Registrieren" };

export default function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  async function signUp(formData: FormData) {
    "use server";

    const fullName = formData.get("full_name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirm_password") as string;

    if (password !== confirmPassword) {
      redirect(
        "/register?message=" +
          encodeURIComponent("Die Passwörter stimmen nicht überein.")
      );
    }

    if (password.length < 8) {
      redirect(
        "/register?message=" +
          encodeURIComponent("Das Passwort muss mindestens 8 Zeichen lang sein.")
      );
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
        <h1 className="font-headline text-4xl text-on-surface mb-2 tracking-tight">
          Konto erstellen
        </h1>
        <p className="font-body text-on-surface-variant text-sm">
          Beginne deine Reise im ewigen Gedenkraum.
        </p>
      </div>

      <div className="space-y-8">
        {message && (
          <div className="rounded-lg bg-error/10 border border-error-container/30 px-4 py-3 text-sm text-error">
            {message}
          </div>
        )}

        {/* Form Card */}
        <div className="bg-surface-container-low/60 p-8 rounded-xl shadow-2xl relative overflow-hidden">
          {/* Decorative glow */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/5 rounded-full blur-3xl" />

          <form action={signUp} className="space-y-5 relative z-10">
            {/* Full Name */}
            <div className="space-y-1.5">
              <label
                htmlFor="full_name"
                className="font-headline text-xs text-on-surface-variant px-1"
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
                className="w-full bg-surface-container-high border-none rounded-lg p-4 text-on-surface placeholder:text-on-surface-variant/30 focus:ring-1 focus:ring-primary transition-all duration-300"
              />
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="font-headline text-xs text-on-surface-variant px-1"
              >
                E-Mail Adresse
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="name@beispiel.at"
                className="w-full bg-surface-container-high border-none rounded-lg p-4 text-on-surface placeholder:text-on-surface-variant/30 focus:ring-1 focus:ring-primary transition-all duration-300"
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label
                htmlFor="password"
                className="font-headline text-xs text-on-surface-variant px-1"
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
                className="w-full bg-surface-container-high border-none rounded-lg p-4 text-on-surface placeholder:text-on-surface-variant/30 focus:ring-1 focus:ring-primary transition-all duration-300"
              />
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <label
                htmlFor="confirm_password"
                className="font-headline text-xs text-on-surface-variant px-1"
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
                className="w-full bg-surface-container-high border-none rounded-lg p-4 text-on-surface placeholder:text-on-surface-variant/30 focus:ring-1 focus:ring-primary transition-all duration-300"
              />
            </div>

            {/* Terms */}
            <p className="text-xs text-on-surface-variant leading-relaxed px-1">
              Mit der Registrierung akzeptierst du unsere{" "}
              <a
                href="https://aethernal.me/agb"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline transition-all"
              >
                AGB
              </a>{" "}
              und{" "}
              <a
                href="https://aethernal.me/datenschutz"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline transition-all"
              >
                Datenschutzerklärung
              </a>
              .
            </p>

            {/* Submit */}
            <button
              type="submit"
              className="w-full gold-gradient py-4 rounded-lg font-label font-bold text-on-primary tracking-widest uppercase text-sm mt-4 hover:brightness-110 active:scale-[0.98] transition-all shadow-lg shadow-primary/10"
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
              className="text-primary font-medium ml-1 hover:text-primary-fixed-dim transition-colors"
            >
              Anmelden
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}
