# Aethernal Roadmap

_Letzte Aktualisierung: 2026-06-17 — folgt dem Masterplan (docs/MASTERPLAN.md)._
Ziel des nächsten Meilensteins: **B2C-Launch mit vollem Kernversprechen.** Oben = als Nächstes.

## Phase 1 — Nachrichten-Engine (Launch-Blocker)
1. [x] **E-Mail-Versand über Resend einrichten** + Supabase „Confirm email" aktivieren ✓ (17.06.2026 — Domain aethernal.me verifiziert, Custom SMTP in Supabase aktiv, Confirm email AN)
2. [ ] **Scheduler bauen** (Supabase Edge Function + täglicher Cron): fällige Nachrichten & Erinnerungen finden und versenden  ← **als Nächstes**
3. [ ] **Zeitgesteuerte Nachrichten** real zustellen
4. [ ] **Vertrauenspersonen-Flow**: Einladungs-/Bestätigungsmail + sicherer „Tod bestätigen"-Link → todesgetriggerte Nachrichten auslösen

## Phase 2 — Launch-Reife (Vertrauen, Recht, Politur)
- [ ] Konto-Löschung vollständig (serverseitig inkl. Auth-Account) — DSGVO
- [ ] Echten QR-Code generieren (SpiritLink)
- [ ] GA4 (`G-FT3WYB9Z4T`) + Cookie-Consent (App + Landing)
- [ ] Impressum vervollständigen (Adresse, Bezirksgericht)
- [ ] Aufräumen: `.env.example` korrigieren, toten Link „Gedenkprofile" beheben, Onboarding-Foto-Schritt fixen/entfernen
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
