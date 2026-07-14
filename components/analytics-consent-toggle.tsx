"use client";

import { useEffect, useState } from "react";
import { getStoredConsent, storeConsent } from "@/lib/consent";
import { useToast } from "@/components/toast";

// Widerrufbare Analytics-Einwilligung (B6) — sitzt in den Einstellungen.
export function AnalyticsConsentToggle() {
  const { showToast } = useToast();
  const [analyticsOn, setAnalyticsOn] = useState(false);

  useEffect(() => {
    setAnalyticsOn(getStoredConsent() === "all");
  }, []);

  function toggle() {
    const next = analyticsOn ? "essential" : "all";
    storeConsent(next);
    setAnalyticsOn(!analyticsOn);
    showToast(
      next === "all"
        ? "Analyse-Cookies aktiviert"
        : "Analyse-Cookies deaktiviert"
    );
  }

  return (
    <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/30">
      <div className="flex items-center gap-3 min-w-0">
        <span className="material-symbols-outlined text-on-surface-variant text-xl" aria-hidden="true">
          cookie
        </span>
        <div className="min-w-0">
          <p className="font-body text-sm text-on-surface">Analyse-Cookies</p>
          <p className="font-body text-xs text-on-surface-variant/70">
            Google Analytics — anonymisiert, jederzeit widerrufbar
          </p>
        </div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={analyticsOn}
        aria-label="Analyse-Cookies erlauben"
        onClick={toggle}
        className={`relative shrink-0 w-11 h-6 rounded-full transition-colors duration-250 ease-out ${
          analyticsOn ? "bg-primary" : "bg-surface-container-highest"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-250 ease-out ${
            analyticsOn ? "translate-x-5" : ""
          }`}
        />
      </button>
    </div>
  );
}
