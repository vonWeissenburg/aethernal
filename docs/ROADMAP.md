# Aethernal Roadmap

_Letzte Aktualisierung: 2026-07-19 — folgt dem Masterplan (docs/MASTERPLAN.md)._
Ziel des nächsten Meilensteins: **B2C-Launch mit vollem Kernversprechen.** Oben = als Nächstes.

## Phase 1 — Nachrichten-Engine (Launch-Blocker)
1. [x] **E-Mail-Versand über Resend einrichten** + Supabase „Confirm email" aktivieren ✓ (17.06.2026 — Domain aethernal.me verifiziert, Custom SMTP in Supabase aktiv, Confirm email AN)
2. [x] **Scheduler bauen** (Supabase Edge Function + täglicher Cron) ✓ **SCHARFGESCHALTET 16./19.07.2026** (Etappe 0, `docs/DEPLOY_PROTOKOLL_2026-07-19.md`): Function deployed, Secrets gesetzt, alle 3 Migrationen eingespielt, Cron-Job aktiv (täglich 06:00 UTC), Smoke-Test grün (HTTP 200, manuell mit CRON_SECRET)
3. [~] **Zeitgesteuerte Nachrichten** real zustellen — Infrastruktur LIVE (19.07.), **offen: Live-Test mit echter Testnachricht** (`docs/OFFEN_FUER_FABIAN.md` Punkt 3), danach B7-Rest („Versand nicht aktiv"-Hinweise entfernen)
4. [~] **Vertrauenspersonen-Flow**: ✓ Code komplett 14.07. — Einladung/Bestätigung (B2) UND Todesbestätigung (B3, Karenzzeit-Modell 7 Tage, Scheduler erweitert); Migrationen + Secrets ✓ live 19.07. **Offen: Fabians Wortlaut-Review + End-to-End-Test** (`docs/OFFEN_FUER_FABIAN.md`)

## Phase 2 — Launch-Reife (Vertrauen, Recht, Politur)
- [~] Konto-Löschung vollständig (serverseitig inkl. Auth-Account) — DSGVO — ✓ Code komplett 14.07. (B4, inkl. Storage-Fotos; Live-Test braucht `SUPABASE_SERVICE_ROLE_KEY` am Server)
- [x] Echten QR-Code generieren (SpiritLink) ✓ (14.07.2026 — B5: QR + Download + Web-Share; Slug jetzt stabil, kein Link-Bruch bei Umbenennung)
- [~] GA4 (`G-FT3WYB9Z4T`) + Cookie-Consent — App ✓ 14.07. (B6: Banner + Einstellungs-Toggle, GA lädt erst nach Einwilligung). Landing: Banner existiert, lädt aber noch kein GA — offen
- [ ] Impressum vervollständigen (Adresse, Bezirksgericht)
- [x] Aufräumen: toter Link „Gedenkprofile" ✓ behoben 14.07. (B1 — echte Übersichtsseite `/gedenkprofile`); Onboarding-Foto-Schritt ✓ gefixt 14.07. (B0, Live-Test ausstehend); `.env.example` ✓ 01.07.
- [x] Konto-Löschung erweitern: auch Storage-Fotos entfernen ✓ (14.07.2026 — in B4 enthalten)
- [ ] Rechtstexte ausbauen (AGB: Zustellung/Haftung, digitaler Nachlass, Todesbestätigungs-Missbrauch, Preise; Datenschutz: Daten Verstorbener & Dritter) → Anwalts-Review, siehe `00_Projekt/AUDIT_2026-07-01.md`
- [x] UI-Rebuild nach Stitch-Design abschließen ✓ (14.07.2026 — Redesign Track A, Pakete A0–A8 aus `docs/redesign/`; Lighthouse-A11y-Check nach Deploy noch offen)

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
