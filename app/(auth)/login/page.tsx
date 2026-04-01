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
      {/* Hero Branding Section */}
      <div className="text-center mb-12">
        <div className="mb-6 inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-tr from-primary/20 to-transparent border border-primary/10">
          <span className="material-symbols-outlined text-5xl text-primary">
            all_inclusive
          </span>
        </div>
        <h1 className="font-headline text-3xl md:text-4xl text-on-surface mb-3 tracking-tight">
          Aethernal
        </h1>
        <p className="font-headline italic text-on-surface-variant text-lg opacity-80">
          Erinnerungen für die Ewigkeit
        </p>
      </div>

      {/* Login Container */}
      <div className="w-full space-y-8">
        {message && (
          <div className="rounded-lg bg-error/10 border border-error-container/30 px-4 py-3 text-sm text-error">
            {message}
          </div>
        )}

        <div className="bg-surface-container/30 backdrop-blur-xl p-8 rounded-xl border border-outline-variant/10 shadow-2xl">
          <form action={signIn} className="space-y-6">
            {/* Email Field */}
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="font-label text-xs uppercase tracking-widest text-on-surface-variant ml-1"
              >
                E-Mail Adresse
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-on-surface-variant group-focus-within:text-primary transition-colors">
                  <span className="material-symbols-outlined text-xl">mail</span>
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="name@beispiel.at"
                  className="glass-input block w-full pl-11 pr-4 py-4 rounded-lg border-0 ring-1 ring-outline-variant/20 focus:ring-2 focus:ring-primary/50 bg-surface-container-low text-on-surface placeholder:text-on-surface-variant/40"
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
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-on-surface-variant group-focus-within:text-primary transition-colors">
                  <span className="material-symbols-outlined text-xl">lock</span>
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="glass-input block w-full pl-11 pr-4 py-4 rounded-lg border-0 ring-1 ring-outline-variant/20 focus:ring-2 focus:ring-primary/50 bg-surface-container-low text-on-surface placeholder:text-on-surface-variant/40"
                />
              </div>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              className="w-full gold-gradient text-on-primary font-semibold py-4 rounded-lg shadow-lg hover:brightness-110 active:scale-[0.98] transition-all duration-300 uppercase tracking-widest text-sm"
            >
              Anmelden
            </button>

            {/* Forgot Password */}
            <div className="text-center">
              <Link
                href="/reset-password"
                className="text-sm text-on-surface-variant hover:text-primary transition-colors"
              >
                Passwort vergessen?
              </Link>
            </div>

            {/* Divider */}
            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-outline-variant/10" />
              <span className="flex-shrink mx-4 text-xs font-label text-on-surface-variant/40 uppercase tracking-widest">
                oder
              </span>
              <div className="flex-grow border-t border-outline-variant/10" />
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
