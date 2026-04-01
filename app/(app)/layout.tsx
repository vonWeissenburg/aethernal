import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppNav from "@/components/app-nav";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, onboarding_done")
    .eq("id", user.id)
    .single();

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <AppNav userName={profile?.full_name ?? null} userEmail={user.email} />
      {/* Desktop: offset by sidebar width; Mobile: offset by header + bottom nav */}
      <main className="lg:ml-72 pt-16 lg:pt-0 pb-24 lg:pb-0">
        {children}
      </main>
    </div>
  );
}
