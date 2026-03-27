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
        <h2 className="text-2xl font-serif font-semibold text-violet">
          Passwort zurücksetzen
        </h2>
        <p className="mt-2 text-sm text-aether-gray">
          Gib deine E-Mail-Adresse ein und wir senden dir einen Link zum
          Zurücksetzen.
        </p>
      </div>

      {message && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {message}
        </div>
      )}

      {success && (
        <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
          {success}
        </div>
      )}

      <form action={resetPassword} className="space-y-5">
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

        <button
          type="submit"
          className="w-full rounded-lg bg-violet px-4 py-2.5 text-sm font-medium text-white hover:bg-violet-light transition shadow-sm"
        >
          Link senden
        </button>
      </form>

      <p className="text-center text-sm text-aether-gray">
        <Link
          href="/login"
          className="font-medium text-amber hover:text-amber-dark transition"
        >
          Zurück zur Anmeldung
        </Link>
      </p>
    </div>
  );
}
