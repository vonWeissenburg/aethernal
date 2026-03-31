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

  const inputClasses =
    "w-full bg-surface-container-high border-none rounded-lg p-4 text-text-primary placeholder:text-text-muted/40 focus:ring-1 focus:ring-gold-light/50 transition-all";

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="font-serif text-3xl text-text-primary mb-2 tracking-tight">
          Konto erstellen
        </h1>
        <p className="text-text-secondary text-sm">
          Beginne deine Reise im ewigen Gedenkraum.
        </p>
      </div>

      {message && (
        <div className="rounded-lg bg-error/10 border border-error/30 px-4 py-3 text-sm text-error-light">
          {message}
        </div>
      )}

      <div className="bg-surface-container/30 backdrop-blur-xl p-8 rounded-xl border border-outline-variant/10 shadow-2xl">
        <form action={signUp} className="space-y-5">
          <div className="space-y-1.5">
            <label
              htmlFor="full_name"
              className="font-serif text-xs text-text-secondary px-1"
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
              className={inputClasses}
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="email"
              className="font-serif text-xs text-text-secondary px-1"
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
              className={inputClasses}
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="password"
              className="font-serif text-xs text-text-secondary px-1"
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
              placeholder="Mindestens 8 Zeichen"
              className={inputClasses}
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="confirm_password"
              className="font-serif text-xs text-text-secondary px-1"
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
              placeholder="Passwort wiederholen"
              className={inputClasses}
            />
          </div>

          <p className="text-xs text-text-secondary/60 leading-relaxed px-1">
            Mit der Registrierung akzeptierst du unsere{" "}
            <a
              href="https://aethernal.me/agb"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gold-light hover:underline"
            >
              AGB
            </a>{" "}
            und{" "}
            <a
              href="https://aethernal.me/datenschutz"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gold-light hover:underline"
            >
              Datenschutzerklärung
            </a>
            .
          </p>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-gold-light to-gold py-4 rounded-lg font-semibold text-bg-primary tracking-widest uppercase text-sm mt-2 hover:brightness-110 active:scale-[0.98] transition-all shadow-lg shadow-gold/10"
          >
            Registrieren
          </button>
        </form>
      </div>

      <p className="text-center text-sm text-text-secondary/70">
        Bereits ein Konto?{" "}
        <Link
          href="/login"
          className="text-gold-light font-medium hover:underline underline-offset-4 ml-1"
        >
          Anmelden
        </Link>
      </p>
    </div>
  );
}
