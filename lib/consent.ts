// Cookie-Consent + GA4 (B6). Gleiche localStorage-Keys/Werte wie die
// Landing Page (index.html): aethernal_cookie_consent = "all" | "essential".
// GA4 wird ERST nach Einwilligung geladen — vorher kein Netzwerkcall.

export const GA_MEASUREMENT_ID = "G-FT3WYB9Z4T";

const CONSENT_KEY = "aethernal_cookie_consent";
const CONSENT_DATE_KEY = "aethernal_cookie_date";

export type CookieConsent = "all" | "essential";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export function getStoredConsent(): CookieConsent | null {
  if (typeof window === "undefined") return null;
  const value = localStorage.getItem(CONSENT_KEY);
  return value === "all" || value === "essential" ? value : null;
}

export function storeConsent(value: CookieConsent) {
  localStorage.setItem(CONSENT_KEY, value);
  localStorage.setItem(CONSENT_DATE_KEY, new Date().toISOString());
  if (value === "all") {
    enableAnalytics();
  } else {
    disableAnalytics();
  }
}

let scriptLoaded = false;

export function enableAnalytics() {
  if (typeof window === "undefined") return;

  // Opt-out-Flag zurücknehmen (falls zuvor widerrufen)
  (window as unknown as Record<string, unknown>)[`ga-disable-${GA_MEASUREMENT_ID}`] = false;

  if (scriptLoaded) return;
  scriptLoaded = true;

  window.dataLayer = window.dataLayer || [];
  // gtag MUSS das arguments-Objekt pushen (kein Array) — GA4-Anforderung
  window.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer!.push(arguments);
  } as (...args: unknown[]) => void;

  window.gtag("js", new Date());
  window.gtag("config", GA_MEASUREMENT_ID, { anonymize_ip: true });

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script);
}

export function disableAnalytics() {
  if (typeof window === "undefined") return;
  // Offizielles GA-Opt-out-Flag: verhindert weitere Messungen sofort;
  // nach Reload wird das Script gar nicht mehr geladen.
  (window as unknown as Record<string, unknown>)[`ga-disable-${GA_MEASUREMENT_ID}`] = true;
}
