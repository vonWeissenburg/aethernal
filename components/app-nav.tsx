"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Ein Nav-Vokabular für Desktop + Mobile (01_DESIGN_SYSTEM → Navigation).
const NAV_ITEMS = [
  { href: "/dashboard", label: "Start", icon: "home", match: ["/dashboard"] },
  { href: "/gedenkprofile", label: "Gedenkprofile", icon: "account_circle", match: ["/memorial", "/gedenkprofile"] },
  { href: "/nachrichten", label: "Nachrichten", icon: "mail", match: ["/nachrichten"] },
  { href: "/tagebuch", label: "Tagebuch", icon: "menu_book", match: ["/tagebuch"] },
  { href: "/termine", label: "Termine", icon: "event", match: ["/termine"] },
];

const SECONDARY_NAV = [
  { href: "/vertrauenspersonen", label: "Vertrauenspersonen", icon: "group" },
  { href: "/einstellungen", label: "Einstellungen", icon: "settings" },
];

function matches(pathname: string, prefixes: string[]) {
  return prefixes.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

function NavIcon({ name, filled }: { name: string; filled?: boolean }) {
  return (
    <span
      className="material-symbols-outlined"
      style={filled ? { fontVariationSettings: "'FILL' 1" } : undefined}
      aria-hidden="true"
    >
      {name}
    </span>
  );
}

function Wordmark() {
  return (
    <span className="flex items-center gap-2">
      <span
        className="material-symbols-outlined text-primary text-2xl"
        style={{ fontVariationSettings: "'FILL' 1" }}
        aria-hidden="true"
      >
        auto_awesome
      </span>
      <span className="font-headline italic text-2xl font-bold tracking-tight shimmer-text">
        Aethernal
      </span>
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

  const initial = (userName ?? userEmail)?.charAt(0)?.toUpperCase() ?? "?";

  return (
    <>
      {/* ===== Desktop Sidebar (272px) ===== */}
      <aside className="hidden lg:flex lg:w-72 lg:flex-col h-screen fixed left-0 top-0 bg-sidebar border-r border-outline-variant/30 shadow-2xl z-50">
        {/* Wortmarke */}
        <div className="px-8 pt-10 mb-12">
          <Link href="/dashboard" className="block rounded-lg">
            <Wordmark />
            <p className="text-on-surface-variant/70 text-[10px] tracking-[0.3em] uppercase mt-2">
              Ewige Erinnerung
            </p>
          </Link>
        </div>

        {/* Nav Links */}
        <nav aria-label="Hauptnavigation" className="flex-grow space-y-2 px-6">
          {NAV_ITEMS.map((item) => {
            const active = matches(pathname, item.match);
            return (
              <Link
                key={item.label}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-4 px-4 py-3.5 text-sm tracking-wide transition-colors duration-250 ease-out ${
                  active
                    ? "text-primary font-semibold rounded-l-lg border-r-2 border-primary bg-primary/5"
                    : "text-on-surface-variant hover:text-on-surface hover:bg-white/5 rounded-lg group"
                }`}
              >
                <span
                  className={`material-symbols-outlined ${!active ? "group-hover:text-primary" : ""}`}
                  style={active ? { fontVariationSettings: "'FILL' 1" } : undefined}
                  aria-hidden="true"
                >
                  {item.icon}
                </span>
                <span className="font-body">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Info + Sekundär-Nav + Logout */}
        <div className="mt-auto pt-8 border-t border-outline-variant/30 px-6 pb-10">
          <div className="flex items-center gap-3 px-4 mb-6">
            <div className="w-11 h-11 rounded-full bg-primary/20 flex items-center justify-center text-sm font-semibold text-primary border border-primary/20">
              {initial}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold text-on-surface truncate">
                {userName ?? "Benutzer"}
              </p>
              <p className="text-[10px] text-on-surface-variant/70 truncate">
                {userEmail}
              </p>
            </div>
          </div>
          <div className="space-y-1">
            {SECONDARY_NAV.map((item) => {
              const active = matches(pathname, [item.href]);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center gap-4 px-4 py-2.5 rounded-lg transition-colors duration-250 ease-out ${
                    active
                      ? "text-primary font-semibold"
                      : "text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  <NavIcon name={item.icon} filled={active} />
                  <span className="text-xs">{item.label}</span>
                </Link>
              );
            })}
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-4 px-4 py-2.5 rounded-lg text-on-surface-variant hover:text-on-surface transition-colors duration-250 ease-out"
            >
              <NavIcon name="logout" />
              <span className="text-xs">Abmelden</span>
            </button>
          </div>
        </div>
      </aside>

      {/* ===== Mobile Top Header ===== */}
      <header className="lg:hidden fixed top-0 w-full z-50 bg-background/80 backdrop-blur-xl border-b border-outline-variant/30">
        <div className="flex justify-between items-center px-6 h-16 w-full">
          <Link href="/dashboard" className="rounded-lg">
            <Wordmark />
          </Link>
          <Link
            href="/einstellungen"
            aria-label="Einstellungen"
            className="rounded-full"
          >
            <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-xs font-medium text-primary border border-primary/20">
              {initial}
            </div>
          </Link>
        </div>
      </header>

      {/* ===== Mobile Bottom Nav (Glass, feste 5 Items) ===== */}
      <nav
        aria-label="Hauptnavigation"
        className="lg:hidden fixed bottom-0 left-0 w-full z-50 glass-panel rounded-t-2xl border-t border-outline-variant/30 shadow-[0_-8px_30px_rgba(0,0,0,0.45)] pb-safe"
      >
        <div className="flex justify-around items-stretch h-20 px-2">
          {NAV_ITEMS.map((item) => {
            const active = matches(pathname, item.match);
            return (
              <Link
                key={item.label}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex flex-col items-center justify-center gap-1 flex-1 min-w-11 transition-colors duration-250 ease-out active:scale-95 ${
                  active ? "text-primary" : "text-on-surface-variant hover:text-primary"
                }`}
              >
                <span
                  className={`flex items-center justify-center px-4 py-0.5 rounded-full transition-colors duration-250 ease-out ${
                    active ? "bg-primary/10" : ""
                  }`}
                >
                  <NavIcon name={item.icon} filled={active} />
                </span>
                <span className="font-body text-[10px] font-medium whitespace-nowrap">
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
