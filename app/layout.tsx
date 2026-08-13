import type { Metadata } from "next";
import localFont from "next/font/local";
import { Providers } from "@/components/providers";
import { CookieConsent } from "@/components/cookie-consent";
import "./globals.css";

import type { Viewport } from "next";

// Fonts liegen selbst gehostet in app/fonts (kein Google-Fonts-Abruf beim Nutzer:
// spart 3 externe Roundtrips im kritischen Pfad und vermeidet die DSGVO-Frage
// „US-Datentransfer ohne Einwilligung").
const notoSerif = localFont({
  src: [
    { path: "./fonts/noto-serif-var-latin.woff2", weight: "100 900", style: "normal" },
    { path: "./fonts/noto-serif-italic-var-latin.woff2", weight: "100 900", style: "italic" },
  ],
  variable: "--font-noto-serif",
  display: "swap",
  fallback: ["Georgia", "serif"],
});

const inter = localFont({
  src: "./fonts/inter-var-latin.woff2",
  weight: "100 900",
  style: "normal",
  variable: "--font-inter",
  display: "swap",
  fallback: ["ui-sans-serif", "system-ui", "sans-serif"],
});

// Auf die 66 tatsächlich benutzten Icons reduziert (Liste: app/fonts/ICONS.txt).
// Neues Icon im Code? → Name dort ergänzen und den Subset neu ziehen,
// sonst rendert es als Klartext.
const materialSymbols = localFont({
  src: "./fonts/material-symbols-subset.woff2",
  weight: "100 700",
  style: "normal",
  variable: "--font-material-symbols",
  display: "block",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: {
    default: "Aethernal",
    template: "%s | Aethernal",
  },
  description:
    "Aethernal – Das digitale Gedenkprofil für Menschen und Tiere.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="de"
      className={`dark ${notoSerif.variable} ${inter.variable} ${materialSymbols.variable}`}
    >
      <body className="antialiased overflow-x-hidden">
        <Providers>
          {children}
          <CookieConsent />
        </Providers>
      </body>
    </html>
  );
}
