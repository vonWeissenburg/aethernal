# Aethernal Roadmap

_Letzte Aktualisierung: 2026-07-01 — folgt dem Masterplan (docs/MASTERPLAN.md)._
Ziel des nächsten Meilensteins: **B2C-Launch mit vollem Kernversprechen.** Oben = als Nächstes.

## Phase 1 — Nachrichten-Engine (Launch-Blocker)
1. [x] **E-Mail-Versand über Resend einrichten** + Supabase „Confirm email" aktivieren ✓ (17.06.2026 — Domain aethernal.me verifiziert, Custom SMTP in Supabase aktiv, Confirm email AN)
2. [~] **Scheduler bauen** (Supabase Edge Function + täglicher Cron): Code gebaut (22.06.), committet + gehärtet (01.07.: Batch-Limit, Jahres-Trigger-Guard, indexnutzende Abfragen). **Offen — nur noch: `project_id` in `supabase/config.toml` eintragen, Secrets setzen (RESEND_API_KEY, FROM_EMAIL, CRON_SECRET), Function deployen, Migration + `setup-cron.sql` einspielen, Live-Test.**
3. [ ] **Zeitgesteuerte Nachrichten** real zustellen
4. [ ] **Vertrauenspersonen-Flow**: Einladungs-/Bestätigungsmail + sicherer „Tod bestätigen"-Link → todesgetriggerte Nachrichten auslösen

## Phase 2 — Launch-Reife (Vertrauen, Recht, Politur)
- [ ] Konto-Löschung vollständig (serverseitig inkl. Auth-Account) — DSGVO
- [ ] Echten QR-Code generieren (SpiritLink)
- [ ] GA4 (`G-FT3WYB9Z4T`) + Cookie-Consent (App + Landing)
- [ ] Impressum vervollständigen (Adresse, Bezirksgericht)
- [ ] Aufräumen: toten Link „Gedenkprofile" beheben, Onboarding-Foto-Schritt fixen/entfernen (`.env.example` ✓ 01.07.)
- [ ] Konto-Löschung erweitern: auch Storage-Fotos entfernen (Audit-Fund 01.07. — aktuell bleiben Uploads liegen)
- [ ] Rechtstexte ausbauen (AGB: Zustellung/Haftung, digitaler Nachlass, Todesbestätigungs-Missbrauch, Preise; Datenschutz: Daten Verstorbener & Dritter) → Anwalts-Review, siehe `00_Projekt/AUDIT_2026-07-01.md`
- [ ] UI-Rebuild nach Stitch-Design abschließen

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
