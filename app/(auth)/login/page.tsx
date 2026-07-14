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

  return <LoginForm signIn={signIn} searchParams={searchParams} />;
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
    <>
      {/* Heading */}
      <div className="text-center mb-10">
        <h1 className="font-headline text-3xl md:text-4xl text-on-surface mb-2 tracking-tight">
          Willkommen zurück
        </h1>
        <p className="font-body text-on-surface-variant text-sm">
          Melde dich an, um deinen Gedenkraum zu öffnen.
        </p>
      </div>

      <div className="w-full space-y-8">
        {message && (
          <div className="rounded-button bg-error/10 border border-error-container/30 px-4 py-3 text-sm text-error">
            {message}
          </div>
        )}

        <div className="glass-panel p-8 rounded-card border border-outline-variant/30 shadow-2xl">
          <form action={signIn} className="space-y-6">
            {/* Email Field */}
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="font-label text-xs uppercase tracking-widest text-on-surface-variant ml-1"
              >
                E-Mail-Adresse
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-on-surface-variant group-focus-within:text-primary transition-colors duration-250 ease-out">
                  <span className="material-symbols-outlined text-xl" aria-hidden="true">mail</span>
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="name@beispiel.at"
                  className="block w-full pl-11 pr-4 py-4 rounded-button border-none bg-surface-container text-on-surface placeholder:text-on-surface-variant/40 focus:ring-2 focus:ring-primary/50 transition-all duration-250 ease-out"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label
                htmlFor="password"
                className="font-label text-xs uppercase tracking-widest text-on-surface-variant ml-1"
              >
                Passwort
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-on-surface-variant group-focus-within:text-primary transition-colors duration-250 ease-out">
                  <span className="material-symbols-outlined text-xl" aria-hidden="true">lock</span>
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="block w-full pl-11 pr-4 py-4 rounded-button border-none bg-surface-container text-on-surface placeholder:text-on-surface-variant/40 focus:ring-2 focus:ring-primary/50 transition-all duration-250 ease-out"
                />
              </div>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              className="w-full gold-gradient text-on-primary font-semibold py-4 rounded-button shadow-lg shadow-primary/20 hover:brightness-110 active:scale-[0.98] transition-all duration-250 ease-out uppercase tracking-widest text-sm"
            >
              Anmelden
            </button>

            {/* Forgot Password */}
            <div className="text-center">
              <Link
                href="/reset-password"
                className="text-sm text-on-surface-variant hover:text-primary transition-colors duration-250 ease-out"
              >
                Passwort vergessen?
              </Link>
            </div>
          </form>
        </div>

        {/* Footer Link */}
        <div className="text-center">
          <p className="text-on-surface-variant/70">
            Noch kein Konto?{" "}
            <Link
              href="/register"
              className="text-primary font-medium hover:underline underline-offset-4 ml-1"
            >
              Registrieren
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}
