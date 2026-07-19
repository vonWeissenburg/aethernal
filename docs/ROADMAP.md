# Aethernal Roadmap

_Letzte Aktualisierung: 2026-07-19 — folgt dem Masterplan (docs/MASTERPLAN.md)._
Ziel des nächsten Meilensteins: **B2C-Launch mit vollem Kernversprechen.** Oben = als Nächstes.

## Phase 1 — Nachrichten-Engine (Launch-Blocker)
1. [x] **E-Mail-Versand über Resend einrichten** + Supabase „Confirm email" aktivieren ✓ (17.06.2026 — Domain aethernal.me verifiziert, Custom SMTP in Supabase aktiv, Confirm email AN)
2. [x] **Scheduler bauen** (Supabase Edge Function + täglicher Cron) ✓ **SCHARFGESCHALTET 16./19.07.2026** (Etappe 0, `docs/DEPLOY_PROTOKOLL_2026-07-19.md`): Function deployed, Secrets gesetzt, alle 3 Migrationen eingespielt, Cron-Job aktiv (täglich 06:00 UTC), Smoke-Test grün (HTTP 200, manuell mit CRON_SECRET)
3. [x] **Zeitgesteuerte Nachrichten** real zustellen ✓ **END-TO-END BEWIESEN 19.07.2026** — date-Trigger UND death-Trigger live getestet (Zustellung, Status-Flip, kein Doppelversand); B7-Rest erledigt (Hinweise entfernt, `0fb5a1e`); Zustell-Mail würdevoll umgerahmt (Absender „{Name} über Aethernal", DECISIONS 19.07.)
4. [x] **Vertrauenspersonen-Flow** ✓ **END-TO-END BEWIESEN 19.07.2026** (Death-Journey-Probe): Einladung → Bestätigung → Melde-Link → Todesmeldung → Karenz (7 Tage bestätigt) → Widerruf greift nachweislich → Zustellung; E-Mail-Änderungs-Trigger verifiziert. Dabei gefixt: leerer profiles-Signup-Trigger (`abf87be`). **Phase 1 damit KOMPLETT.**

## Phase 2 — Launch-Reife (Vertrauen, Recht, Politur)
- [x] Konto-Löschung vollständig (serverseitig inkl. Auth-Account) — DSGVO — ✓ Code 14.07., **Live-Test bestanden 19.07.** (echte Route, Wegwerf-Konto: Auth 404, 0 DB-Zeilen, Storage leer, Login unmöglich)
- [x] Echten QR-Code generieren (SpiritLink) ✓ (14.07.2026 — B5: QR + Download + Web-Share; Slug jetzt stabil, kein Link-Bruch bei Umbenennung)
- [~] GA4 (`G-FT3WYB9Z4T`) + Cookie-Consent — App ✓ 14.07. (B6: Banner + Einstellungs-Toggle, GA lädt erst nach Einwilligung). Landing: Banner existiert, lädt aber noch kein GA — offen
- [ ] Impressum vervollständigen (Adresse, Bezirksgericht)
- [x] Aufräumen: toter Link „Gedenkprofile" ✓ behoben 14.07. (B1 — echte Übersichtsseite `/gedenkprofile`); Onboarding-Foto-Schritt ✓ gefixt 14.07. (B0, Live-Test ausstehend); `.env.example` ✓ 01.07.
- [x] Konto-Löschung erweitern: auch Storage-Fotos entfernen ✓ (14.07.2026 — in B4 enthalten)
- [ ] Rechtstexte ausbauen (AGB: Zustellung/Haftung, digitaler Nachlass, Todesbestätigungs-Missbrauch, Preise; Datenschutz: Daten Verstorbener & Dritter) → Anwalts-Review, siehe `00_Projekt/AUDIT_2026-07-01.md`
- [x] UI-Rebuild nach Stitch-Design abschließen ✓ (14.07.2026 — Redesign Track A, Pakete A0–A8; **Lighthouse-A11y ✓ 19.07.: 94/94/92 ≥ 90**) + Sofort-Fixes 19.07. (Lightbox, Galerie-Tab, A11y-Einzeiler, `0fb5a1e`)
- [x] Rechtstexte-Fixes vom 01.07. + private Kontakt-Mail ✓ **LIVE deployt 19.07.** (`46876da`, Landing-Server hatte April-Stand)
- [ ] **Performance-Etappe** (aus Lighthouse 19.07.): TTFB bis 1,8 s / LCP ~9,5 s auf Dashboard & Memorial — Caching / weniger Live-SSR gegen Supabase (`docs/BACKLOG.md` A6)
- [ ] **„Konto nach Todesfall"-Batch** (Entscheidung 19.07., DECISIONS): Profil „verstorben" markieren + jährliche Owner-Reminders im Scheduler stoppen — Voraussetzung für Gästebuch-Moderations-Übergabe
- [ ] **Feature-Backlog priorisieren** (`docs/BACKLOG.md` Abschnitt C): B4 Kalender-Export (Quick-Win) → B3 Profil-Sektionen → B2 Gästebuch → B5 Nachrichten-Anhänge

## Phase 3 — Launch & erste Nutzer (B2C)
- [ ] Landing Page scharfstellen (Hero-Wasserzeichen weg, Waitlist → Anmeldung)
- [ ] Soft-Launch, erste Nutzer, Feedback
- [ ] (Parallel, GF) erste Bestatter-/Steinmetz-Gespräche

## Phase 4 — Monetarisierung & Ökosystem (später)
- [ ] Stripe + Freemium-Pläne (Pricing final entscheiden)
- [ ] B2B-Bestatter-Paket (Pitch + Konditionen)
- [ ] QR-Plaketten / Tierprodukte
- [ ] AI-Features (Biografie- & Trauertext-Generator)

## Erledigt
- [x] 2026-06-17 — Projekt aufgeräumt, Stack festgelegt, Gehirn-Dateien + Workflow eingerichtet, Gesamt-Review (Code & Strategie), Masterplan neu definiert
