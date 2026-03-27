import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const next = searchParams.get("next") ?? "/dashboard";
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://app.aethernal.me";

  const supabase = await createClient();

  // PKCE flow — code exchange
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(
        `${baseUrl}/login?message=${encodeURIComponent(
          "Code-Fehler: " + error.message
        )}`
      );
    }
  }
  // Token hash flow — email verification
  else if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as "signup" | "email",
    });
    if (error) {
      return NextResponse.redirect(
        `${baseUrl}/login?message=${encodeURIComponent(
          "Token-Fehler: " + error.message
        )}`
      );
    }
  }
  // No code and no token
  else {
    const allParams = searchParams.toString();
    return NextResponse.redirect(
      `${baseUrl}/login?message=${encodeURIComponent(
        "Keine Auth-Parameter erhalten. URL-Params: " + (allParams || "leer")
      )}`
    );
  }

  // Success — check onboarding
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
