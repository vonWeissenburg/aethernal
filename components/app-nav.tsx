"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: "🏠" },
  { href: "/tagebuch", label: "Tagebuch", icon: "📖" },
  {
    href: "/nachrichten",
    label: "Nachrichten",
    icon: "💌",
    comingSoon: true,
  },
  { href: "/termine", label: "Termine", icon: "📅", comingSoon: true },
];

export default function AppNav({
  userName,
}: {
  userName: string | null;
}) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col bg-violet text-white min-h-screen">
        <div className="p-6 border-b border-white/10">
          <Link href="/dashboard">
            <h1 className="font-serif text-2xl font-light tracking-wide">
              Aethernal
            </h1>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.comingSoon ? "#" : item.href}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition ${
                  item.comingSoon
                    ? "opacity-50 cursor-default"
                    : isActive
                      ? "bg-white/15 text-white"
                      : "text-lavender/70 hover:bg-white/10 hover:text-white"
                }`}
                onClick={item.comingSoon ? (e) => e.preventDefault() : undefined}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
                {item.comingSoon && (
                  <span className="ml-auto text-[10px] bg-amber/80 text-white px-1.5 py-0.5 rounded-full font-medium">
                    Bald
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 px-4 py-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-amber/20 flex items-center justify-center text-sm font-medium text-amber-light">
              {userName?.charAt(0)?.toUpperCase() ?? "?"}
            </div>
            <span className="text-sm text-lavender/80 truncate">
              {userName ?? "Benutzer"}
            </span>
          </div>
          <button
            onClick={handleSignOut}
            className="w-full text-left px-4 py-2 text-sm text-lavender/60 hover:text-white hover:bg-white/10 rounded-lg transition"
          >
            Abmelden
          </button>
        </div>
      </aside>

      {/* Mobile header */}
      <header className="lg:hidden bg-violet text-white px-4 py-3 flex items-center justify-between sticky top-0 z-50">
        <Link href="/dashboard">
          <h1 className="font-serif text-xl font-light tracking-wide">
            Aethernal
          </h1>
        </Link>
        <button
          onClick={handleSignOut}
          className="text-sm text-lavender/70 hover:text-white transition"
        >
          Abmelden
        </button>
      </header>

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-lavender-dark z-50">
        <div className="flex justify-around py-2">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.comingSoon ? "#" : item.href}
                className={`flex flex-col items-center gap-0.5 px-3 py-1 text-xs transition ${
                  item.comingSoon
                    ? "opacity-40"
                    : isActive
                      ? "text-violet"
                      : "text-aether-gray"
                }`}
                onClick={item.comingSoon ? (e) => e.preventDefault() : undefined}
              >
                <span className="text-lg">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
