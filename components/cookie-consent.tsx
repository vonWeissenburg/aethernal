"use client";

import { useEffect, useState } from "react";
import {
  getStoredConsent,
  storeConsent,
  enableAnalytics,
  type CookieConsent as CookieConsentValue,
} from "@/lib/consent";

// Consent-Banner (B6): erscheint nur ohne gespeicherte Entscheidung.
// Ablehnen ist gleichwertig gestaltet (gleiche Größe/Gewichtung).
export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = getStoredConsent();
    if (consent === "all") {
      enableAnalytics();
    }
    setVisible(consent === null);
  }, []);

  function choose(value: CookieConsentValue) {
    storeConsent(value);
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie-Einwilligung"
      className="fixed bottom-24 lg:bottom-6 inset-x-4 z-[60] mx-auto max-w-xl glass-panel rounded-card border border-outline-variant/40 shadow-2xl p-5 animate-fade-in-up"
    >
      <div className="flex items-start gap-3 mb-4">
        <span className="material-symbols-outlined text-primary text-xl mt-0.5" aria-hidden="true">
          cookie
        </span>
        <p className="font-body text-sm text-on-surface-variant leading-relaxed">
          Wir möchten anonymisiert verstehen, wie Aethernal genutzt wird
          (Google Analytics) — nur mit deiner Einwilligung. Alle Funktionen
          der App kommen ohne Analyse-Cookies aus.{" "}
          <a
            href="https://aethernal.me/datenschutz"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            Mehr in der Datenschutzerklärung
          </a>
          . Du kannst deine Wahl jederzeit in den Einstellungen ändern.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => choose("essential")}
          className="rounded-button border border-outline-variant/50 px-4 py-3 font-label text-sm font-semibold text-on-surface hover:bg-surface-container-high transition-colors duration-250 ease-out"
        >
          Nur notwendige
        </button>
        <button
          type="button"
          onClick={() => choose("all")}
          className="rounded-button bg-primary px-4 py-3 font-label text-sm font-semibold text-on-primary hover:brightness-110 transition-all duration-250 ease-out"
        >
          Alle akzeptieren
        </button>
      </div>
    </div>
  );
}
