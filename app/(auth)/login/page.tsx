import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export const metadata = { title: "Anmelden" };

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  async function signIn(formData: FormData) {
    "use server";

    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const supabase = await createClient();

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      redirect("/login?message=" + encodeURIComponent(error.message));
    }

    redirect("/dashboard");
  }

  return (
    <LoginForm signIn={signIn} searchParams={searchParams} />
  );
}

async function LoginForm({
  signIn,
  searchParams,
}: {
  signIn: (formData: FormData) => Promise<void>;
  searchParams: Promise<{ message?: string }>;
}) {
  const { message } = await searchParams;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-serif font-semibold text-violet">
          Willkommen zurück
        </h2>
        <p className="mt-2 text-sm text-aether-gray">
          Melde dich an, um deine Gedenkprofile zu verwalten.
        </p>
      </div>

      {message && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {message}
        </div>
      )}

      <form action={signIn} className="space-y-5">
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
          <div className="flex items-center justify-between mb-1.5">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-aether-text"
            >
              Passwort
            </label>
            <Link
              href="/reset-password"
              className="text-xs text-amber hover:text-amber-dark transition"
            >
              Passwort vergessen?
            </Link>
          </div>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            placeholder="••••••••"
            className="w-full rounded-lg border border-lavender-dark bg-white px-4 py-2.5 text-sm text-aether-text placeholder:text-aether-gray/50 focus:border-violet focus:ring-2 focus:ring-violet/20 outline-none transition"
          />
        </div>

        <button
          type="submit"
          className="w-full rounded-lg bg-violet px-4 py-2.5 text-sm font-medium text-white hover:bg-violet-light transition shadow-sm"
        >
          Anmelden
        </button>
      </form>

      <p className="text-center text-sm text-aether-gray">
        Noch kein Konto?{" "}
        <Link
          href="/register"
          className="font-medium text-amber hover:text-amber-dark transition"
        >
          Jetzt registrieren
        </Link>
      </p>
    </div>
  );
}
