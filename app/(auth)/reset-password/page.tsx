import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export const metadata = { title: "Passwort zurücksetzen" };

export default function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; success?: string }>;
}) {
  async function resetPassword(formData: FormData) {
    "use server";

    const email = formData.get("email") as string;
    const supabase = await createClient();

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?next=/dashboard`,
    });

    if (error) {
      redirect(
        "/reset-password?message=" + encodeURIComponent(error.message)
      );
    }

    redirect(
      "/reset-password?success=" +
        encodeURIComponent(
          "Wir haben dir eine E-Mail mit einem Link zum Zurücksetzen deines Passworts gesendet."
        )
    );
  }

  return (
    <ResetForm resetPassword={resetPassword} searchParams={searchParams} />
  );
}

async function ResetForm({
  resetPassword,
  searchParams,
}: {
  resetPassword: (formData: FormData) => Promise<void>;
  searchParams: Promise<{ message?: string; success?: string }>;
}) {
  const { message, success } = await searchParams;

  return (
    <>
      {/* Heading */}
      <div className="text-center mb-10">
        <div className="mb-6 inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 border border-primary/10">
          <span className="material-symbols-outlined text-3xl text-primary">
            lock_reset
          </span>
        </div>
        <h1 className="font-headline text-3xl text-on-surface mb-2 tracking-tight">
          Passwort zurücksetzen
        </h1>
        <p className="font-body text-on-surface-variant text-sm">
          Gib deine E-Mail-Adresse ein und wir senden dir einen Link zum
          Zurücksetzen.
        </p>
      </div>

      <div className="space-y-8">
        {message && (
          <div className="rounded-lg bg-error/10 border border-error-container/30 px-4 py-3 text-sm text-error">
            {message}
          </div>
        )}

        {success && (
          <div className="rounded-lg bg-success/10 border border-success/30 px-4 py-3 text-sm text-success">
            {success}
          </div>
        )}

        <div className="bg-surface-container/30 backdrop-blur-xl p-8 rounded-xl border border-outline-variant/10 shadow-2xl">
          <form action={resetPassword} className="space-y-6">
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

            <button
              type="submit"
              className="w-full gold-gradient text-on-primary font-semibold py-4 rounded-lg shadow-lg hover:brightness-110 active:scale-[0.98] transition-all duration-300 uppercase tracking-widest text-sm"
            >
              Link senden
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-on-surface-variant">
          <Link
            href="/login"
            className="font-medium text-primary hover:text-primary-fixed-dim transition"
          >
            Zurück zur Anmeldung
          </Link>
        </p>
      </div>
    </>
  );
}
