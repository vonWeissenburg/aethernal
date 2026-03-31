"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: "dashboard" },
  { href: "/tagebuch", label: "Tagebuch", icon: "menu_book" },
  { href: "/nachrichten", label: "Nachrichten", icon: "chat_bubble" },
  { href: "/termine", label: "Termine", icon: "event_note" },
];

const MORE_ITEMS = [
  { href: "/vertrauenspersonen", label: "Vertrauenspersonen", icon: "group" },
  { href: "/memorial/new", label: "Neues Gedenkprofil", icon: "add_circle" },
];

function NavIcon({ name, filled }: { name: string; filled?: boolean }) {
  return (
    <span
      className="material-symbols-outlined text-[22px]"
      style={filled ? { fontVariationSettings: "'FILL' 1" } : undefined}
    >
      {name}
    </span>
  );
}

export default function AppNav({
  userName,
  userEmail,
}: {
  userName: string | null;
  userEmail?: string | null;
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
      {/* Material Symbols font */}
      <link
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
        rel="stylesheet"
      />

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:w-72 lg:flex-col bg-bg-primary border-r border-white/5 min-h-screen">
        <div className="p-6 mb-4">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span
              className="material-symbols-outlined text-gold-light text-2xl"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              auto_awesome
            </span>
            <h1 className="font-serif text-2xl font-bold text-gold-light italic tracking-tight">
              Aethernal
            </h1>
          </Link>
          <p className="text-text-muted text-[10px] tracking-[0.2em] uppercase mt-1 ml-9">
            Digital Memorial
          </p>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-4 px-4 py-3.5 rounded-lg text-sm transition-all duration-300 ${
                  isActive
                    ? "text-gold-light font-semibold bg-gold-light/5 border-r-2 border-gold-light"
                    : "text-text-muted hover:text-text-primary hover:bg-white/5"
                }`}
              >
                <NavIcon name={item.icon} filled={isActive} />
                <span className="tracking-wide">{item.label}</span>
              </Link>
            );
          })}

          <div className="my-3 border-t border-white/5" />

          {MORE_ITEMS.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-4 px-4 py-3.5 rounded-lg text-sm transition-all duration-300 ${
                  isActive
                    ? "text-gold-light font-semibold bg-gold-light/5"
                    : "text-text-muted hover:text-text-primary hover:bg-white/5"
                }`}
              >
                <NavIcon name={item.icon} filled={isActive} />
                <span className="tracking-wide">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto p-4 border-t border-white/5">
          <Link
            href="/einstellungen"
            className="flex items-center gap-3 px-4 py-2 mb-2 rounded-lg hover:bg-white/5 transition group"
          >
            <div className="w-9 h-9 rounded-full bg-gold/20 flex items-center justify-center text-sm font-medium text-gold-light">
              {(userName ?? userEmail)?.charAt(0)?.toUpperCase() ?? "?"}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-text-primary truncate">
                {userName ?? "Benutzer"}
              </p>
              <p className="text-[10px] text-text-muted truncate">
                {userEmail}
              </p>
            </div>
          </Link>
          <div className="space-y-1">
            <Link
              href="/einstellungen"
              className="flex items-center gap-3 px-4 py-2 text-text-muted hover:text-text-primary transition text-xs"
            >
              <NavIcon name="settings" />
              <span>Einstellungen</span>
            </Link>
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-4 py-2 text-text-muted hover:text-text-primary transition text-xs"
            >
              <NavIcon name="logout" />
              <span>Abmelden</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile header */}
      <header className="lg:hidden bg-bg-primary/80 backdrop-blur-xl text-text-primary px-4 py-3 flex items-center justify-between sticky top-0 z-50 border-b border-gold-light/10">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span
            className="material-symbols-outlined text-gold-light"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            auto_awesome
          </span>
          <h1 className="font-serif text-xl font-bold text-gold-light italic tracking-tight">
            Aethernal
          </h1>
        </Link>
        <Link href="/einstellungen">
          <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center text-xs font-medium text-gold-light border border-gold/20">
            {(userName ?? userEmail)?.charAt(0)?.toUpperCase() ?? "?"}
          </div>
        </Link>
      </header>

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-bg-primary/90 backdrop-blur-xl border-t border-gold-light/10 z-50 rounded-t-2xl shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
        <div className="flex justify-around py-2 pb-safe">
          {[...NAV_ITEMS, { href: "/einstellungen", label: "Mehr", icon: "more_horiz" }].map((item) => {
            const isActive =
              item.href === "/einstellungen"
                ? pathname.startsWith("/einstellungen") || pathname.startsWith("/vertrauenspersonen")
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-0.5 px-3 py-1.5 transition-all duration-300 ${
                  isActive
                    ? "text-gold-light scale-105"
                    : "text-text-primary/40 hover:text-gold-light/80"
                }`}
              >
                <NavIcon name={item.icon} filled={isActive} />
                <span className="text-[10px] font-medium tracking-wide">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
