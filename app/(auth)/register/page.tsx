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
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-serif font-semibold text-violet">
          Konto erstellen
        </h2>
        <p className="mt-2 text-sm text-aether-gray">
          Erstelle dein Aethernal-Konto und bewahre Erinnerungen für immer.
        </p>
      </div>

      {message && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {message}
        </div>
      )}

      <form action={signUp} className="space-y-5">
        <div>
          <label
            htmlFor="full_name"
            className="block text-sm font-medium text-aether-text mb-1.5"
          >
            Vollständiger Name
          </label>
          <input
            id="full_name"
            name="full_name"
            type="text"
            required
            autoComplete="name"
            placeholder="Max Mustermann"
            className="w-full rounded-lg border border-lavender-dark bg-white px-4 py-2.5 text-sm text-aether-text placeholder:text-aether-gray/50 focus:border-violet focus:ring-2 focus:ring-violet/20 outline-none transition"
          />
        </div>

        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-aether-text mb-1.5"
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
            className="w-full rounded-lg border border-lavender-dark bg-white px-4 py-2.5 text-sm text-aether-text placeholder:text-aether-gray/50 focus:border-violet focus:ring-2 focus:ring-violet/20 outline-none transition"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-aether-text mb-1.5"
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
            className="w-full rounded-lg border border-lavender-dark bg-white px-4 py-2.5 text-sm text-aether-text placeholder:text-aether-gray/50 focus:border-violet focus:ring-2 focus:ring-violet/20 outline-none transition"
          />
        </div>

        <div>
          <label
            htmlFor="confirm_password"
            className="block text-sm font-medium text-aether-text mb-1.5"
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
            className="w-full rounded-lg border border-lavender-dark bg-white px-4 py-2.5 text-sm text-aether-text placeholder:text-aether-gray/50 focus:border-violet focus:ring-2 focus:ring-violet/20 outline-none transition"
          />
        </div>

        <button
          type="submit"
          className="w-full rounded-lg bg-violet px-4 py-2.5 text-sm font-medium text-white hover:bg-violet-light transition shadow-sm"
        >
          Registrieren
        </button>

        <p className="text-xs text-center text-aether-gray leading-relaxed">
          Mit der Registrierung akzeptierst du unsere{" "}
          <a
            href="https://aethernal.me/agb"
            target="_blank"
            rel="noopener noreferrer"
            className="text-amber hover:text-amber-dark underline"
          >
            AGB
          </a>{" "}
          und{" "}
          <a
            href="https://aethernal.me/datenschutz"
            target="_blank"
            rel="noopener noreferrer"
            className="text-amber hover:text-amber-dark underline"
          >
            Datenschutzerklärung
          </a>
          .
        </p>
      </form>

      <p className="text-center text-sm text-aether-gray">
        Bereits ein Konto?{" "}
        <Link
          href="/login"
          className="font-medium text-amber hover:text-amber-dark transition"
        >
          Anmelden
        </Link>
      </p>
    </div>
  );
}
