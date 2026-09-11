import type { MetadataRoute } from "next";

/**
 * BEFUND 11.09.2026: Es gab keine robots.txt. Ein Abruf von
 * https://app.aethernal.me/robots.txt lieferte HTTP 200 mit der Login-Seite —
 * für eine Suchmaschine sieht das aus wie "keine Einschränkungen".
 *
 * Hier gehört nichts in einen Suchindex. Der eingeloggte Bereich ohnehin nicht,
 * und die öffentlichen Gedenkseiten unter /s/… enthalten Klarnamen, Geburts-
 * und Sterbedaten realer Verstorbener. Wer den QR-Code am Grabstein scannt,
 * soll die Seite finden — auffindbar über Google soll sie nicht sein.
 *
 * Zusätzlich trägt jede Gedenkseite `robots: noindex` im Kopf (siehe
 * app/s/[slug]/page.tsx). Doppelt abgesichert: Wer die robots.txt beachtet,
 * kommt nicht herein; wer sie ignoriert, liest wenigstens das noindex.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", disallow: "/" }],
  };
}
