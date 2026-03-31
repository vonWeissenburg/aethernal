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
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-serif font-semibold text-gold-light">
          Passwort zurücksetzen
        </h2>
        <p className="mt-2 text-sm text-text-secondary">
          Gib deine E-Mail-Adresse ein und wir senden dir einen Link zum
          Zurücksetzen.
        </p>
      </div>

      {message && (
        <div className="rounded-lg bg-error/10 border border-error/30 px-4 py-3 text-sm text-error-light">
          {message}
        </div>
      )}

      {success && (
        <div className="rounded-lg bg-success/10 border border-success/30 px-4 py-3 text-sm text-success">
          {success}
        </div>
      )}

      <form action={resetPassword} className="space-y-5">
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-text-primary mb-1.5"
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
            className="w-full rounded-lg bg-surface-container-high border-none p-4 text-sm text-text-primary placeholder:text-text-muted/40 focus:ring-1 focus:ring-gold-light/50 transition-all"
          />
        </div>

        <button
          type="submit"
          className="w-full rounded-lg bg-gradient-to-r from-gold-light to-gold px-4 py-4 text-sm font-semibold text-bg-primary hover:brightness-110 transition-all shadow-lg uppercase tracking-widest"
        >
          Link senden
        </button>
      </form>

      <p className="text-center text-sm text-text-secondary">
        <Link
          href="/login"
          className="font-medium text-gold-light hover:text-gold transition"
        >
          Zurück zur Anmeldung
        </Link>
      </p>
    </div>
  );
}
