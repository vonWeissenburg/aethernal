import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://app.aethernal.me";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Check if onboarding is done
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("onboarding_done")
          .eq("id", user.id)
          .single();

        if (profile && !profile.onboarding_done) {
          return NextResponse.redirect(`${baseUrl}/onboarding`);
        }
      }

      return NextResponse.redirect(`${baseUrl}${next}`);
    }
  }

  // Auth error — redirect to login with error
  return NextResponse.redirect(
    `${baseUrl}/login?message=${encodeURIComponent(
      "Authentifizierung fehlgeschlagen. Bitte versuche es erneut."
    )}`
  );
}
