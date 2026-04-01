"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const SIDEBAR_NAV = [
  { href: "/dashboard", label: "Dashboard", icon: "dashboard" },
  { href: "/gedenkprofile", label: "Gedenkprofile", icon: "account_circle", matchAlso: "/memorial" },
  { href: "/tagebuch", label: "Tagebuch", icon: "menu_book" },
  { href: "/nachrichten", label: "Nachrichten", icon: "mail" },
  { href: "/vertrauenspersonen", label: "Vertrauenspersonen", icon: "group" },
  { href: "/termine", label: "Termine", icon: "event" },
];

const BOTTOM_NAV = [
  { href: "/dashboard", label: "Dashboard", icon: "dashboard" },
  { href: "/tagebuch", label: "Tagebuch", icon: "menu_book" },
  { href: "/nachrichten", label: "Nachrichten", icon: "chat_bubble" },
  { href: "/termine", label: "Termine", icon: "event_note" },
  { href: "/mehr", label: "Mehr", icon: "more_horiz" },
];

function NavIcon({ name, filled }: { name: string; filled?: boolean }) {
  return (
    <span
      className="material-symbols-outlined"
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

  function isActive(href: string, matchAlso?: string) {
    if (pathname === href || pathname.startsWith(href + "/")) return true;
    if (matchAlso && (pathname === matchAlso || pathname.startsWith(matchAlso + "/"))) return true;
    // Special: /gedenkprofile matches /memorial routes
    if (href === "/gedenkprofile" && pathname.startsWith("/memorial")) return true;
    return false;
  }

  function isMobileActive(href: string) {
    if (href === "/mehr") {
      return pathname.startsWith("/einstellungen") ||
        pathname.startsWith("/vertrauenspersonen") ||
        pathname.startsWith("/memorial/new") ||
        pathname.startsWith("/gedenkprofile");
    }
    return pathname === href || pathname.startsWith(href + "/");
  }

  const mobileMoreHref = pathname.startsWith("/vertrauenspersonen")
    ? "/vertrauenspersonen"
    : pathname.startsWith("/einstellungen")
    ? "/einstellungen"
    : "/einstellungen";

  return (
    <>
      {/* ===== Desktop Sidebar (272px) ===== */}
      <aside className="hidden lg:flex lg:w-72 lg:flex-col h-screen fixed left-0 top-0 bg-sidebar border-r border-white/5 shadow-2xl z-50">
        {/* Logo */}
        <div className="px-10 pt-10 mb-14">
          <Link href="/dashboard" className="block">
            <h1 className="font-headline text-2xl font-bold text-primary tracking-tight">
              Aethernal
            </h1>
            <p className="text-slate-500 text-[10px] tracking-[0.3em] uppercase mt-1.5">
              Digital Memorial
            </p>
          </Link>
        </div>

        {/* Nav Links */}
        <nav className="flex-grow space-y-2 px-6">
          {SIDEBAR_NAV.map((item) => {
            const active = isActive(item.href, item.matchAlso);
            return (
              <Link
                key={item.href}
                href={item.href === "/gedenkprofile" ? "/dashboard" : item.href}
                className={`flex items-center gap-4 px-4 py-3.5 text-sm tracking-wide transition-all duration-300 rounded-lg ${
                  active
                    ? "text-primary font-semibold border-r-2 border-primary bg-primary/5"
                    : "text-slate-400 hover:text-slate-200 hover:bg-white/5 group"
                }`}
              >
                <span
                  className={`material-symbols-outlined ${!active ? "group-hover:text-primary" : ""}`}
                  style={active ? { fontVariationSettings: "'FILL' 1" } : undefined}
                >
                  {item.icon}
                </span>
                <span className="font-body">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Info + Settings + Logout */}
        <div className="mt-auto pt-8 border-t border-white/5 px-6 pb-10">
          <div className="flex items-center gap-3 px-4 mb-8">
            <div className="w-11 h-11 rounded-full bg-primary/20 flex items-center justify-center text-sm font-semibold text-primary border border-white/10">
              {(userName ?? userEmail)?.charAt(0)?.toUpperCase() ?? "?"}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold text-on-surface truncate">
                {userName ?? "Benutzer"}
              </p>
              <p className="text-[10px] text-slate-500 truncate">
                {userEmail}
              </p>
            </div>
          </div>
          <div className="space-y-1">
            <Link
              href="/einstellungen"
              className="flex items-center gap-4 px-4 py-2 text-slate-400 hover:text-slate-200 transition-colors duration-300"
            >
              <span className="material-symbols-outlined text-lg">settings</span>
              <span className="text-xs">Einstellungen</span>
            </Link>
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-4 px-4 py-2 text-slate-400 hover:text-slate-200 transition-colors duration-300"
            >
              <span className="material-symbols-outlined text-lg">logout</span>
              <span className="text-xs">Abmelden</span>
            </button>
          </div>
        </div>
      </aside>

      {/* ===== Mobile Top Header ===== */}
      <header className="lg:hidden fixed top-0 w-full z-50 bg-background/80 backdrop-blur-xl border-b border-primary/10">
        <div className="flex justify-between items-center px-6 h-16 w-full">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">auto_awesome</span>
            <h1 className="text-2xl font-headline text-primary italic font-bold tracking-tight">
              Aethernal
            </h1>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/einstellungen">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-medium text-primary border border-primary/20">
                {(userName ?? userEmail)?.charAt(0)?.toUpperCase() ?? "?"}
              </div>
            </Link>
          </div>
        </div>
      </header>

      {/* ===== Mobile Bottom Tab Bar ===== */}
      <nav className="lg:hidden fixed bottom-0 left-0 w-full h-20 flex justify-around items-center px-4 pb-safe bg-background/90 backdrop-blur-xl border-t border-primary/10 z-50 rounded-t-lg">
        {BOTTOM_NAV.map((item) => {
          const active = isMobileActive(item.href);
          const href = item.href === "/mehr" ? mobileMoreHref : item.href;
          return (
            <Link
              key={item.href}
              href={href}
              className={`flex flex-col items-center justify-center transition-all duration-300 active:scale-90 ${
                active
                  ? "text-primary"
                  : "text-on-surface/40 hover:text-primary"
              }`}
            >
              <NavIcon name={item.icon} filled={active} />
              <span className="font-body text-[10px] font-medium mt-1">
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
