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
    <div className="flex flex-col lg:flex-row min-h-screen bg-[#fafaf7]">
      <AppNav userName={profile?.full_name ?? null} />
      <main className="flex-1 pb-20 lg:pb-0">{children}</main>
    </div>
  );
}
