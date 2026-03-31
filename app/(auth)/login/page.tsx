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
      {/* Hero branding */}
      <div className="text-center mb-8">
        <div className="mb-4 inline-flex items-center justify-center w-16 h-16 rounded-full bg-gold-light/10 border border-gold-light/10">
          <span
            className="material-symbols-outlined text-4xl text-gold-light"
          >
            all_inclusive
          </span>
        </div>
        <h1 className="font-serif text-3xl text-text-primary mb-2 tracking-tight">
          Willkommen zurück
        </h1>
        <p className="font-serif italic text-text-secondary text-base opacity-80">
          Erinnerungen für die Ewigkeit
        </p>
      </div>

      {message && (
        <div className="rounded-lg bg-error/10 border border-error/30 px-4 py-3 text-sm text-error-light">
          {message}
        </div>
      )}

      {/* Login card */}
      <div className="bg-surface-container/30 backdrop-blur-xl p-8 rounded-xl border border-outline-variant/10 shadow-2xl">
        <form action={signIn} className="space-y-6">
          <div className="space-y-2">
            <label
              htmlFor="email"
              className="text-xs uppercase tracking-widest text-text-secondary ml-1"
            >
              E-Mail Adresse
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-text-secondary group-focus-within:text-gold-light transition-colors">
                <span className="material-symbols-outlined text-xl">mail</span>
              </div>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="name@beispiel.at"
                className="block w-full pl-11 pr-4 py-4 rounded-lg border-0 ring-1 ring-outline-variant/20 focus:ring-2 focus:ring-gold-light/50 bg-surface-container-low text-text-primary placeholder:text-text-muted/40 transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label
                htmlFor="password"
                className="text-xs uppercase tracking-widest text-text-secondary ml-1"
              >
                Passwort
              </label>
              <Link
                href="/reset-password"
                className="text-xs text-text-secondary hover:text-gold-light transition"
              >
                Passwort vergessen?
              </Link>
            </div>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-text-secondary group-focus-within:text-gold-light transition-colors">
                <span className="material-symbols-outlined text-xl">lock</span>
              </div>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="block w-full pl-11 pr-4 py-4 rounded-lg border-0 ring-1 ring-outline-variant/20 focus:ring-2 focus:ring-gold-light/50 bg-surface-container-low text-text-primary placeholder:text-text-muted/40 transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-gold-light to-gold text-bg-primary font-semibold py-4 rounded-lg shadow-lg hover:brightness-110 active:scale-[0.98] transition-all duration-300 uppercase tracking-widest text-sm"
          >
            Anmelden
          </button>
        </form>
      </div>

      {/* Footer link */}
      <p className="text-center text-sm text-text-secondary/70">
        Noch kein Konto?{" "}
        <Link
          href="/register"
          className="text-gold-light font-medium hover:underline underline-offset-4 ml-1"
        >
          Registrieren
        </Link>
      </p>
    </div>
  );
}
