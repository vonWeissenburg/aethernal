# Changelog

_Was wann gebaut/geändert wurde. Neueste zuerst._

## 2026-07-13
- **A0 Design-Fundament:** `globals.css` als einzige Token-Wahrheit (Radius-Skala 12/8px, Motion-Skala 150/250/400ms, sichtbarer `:focus-visible`-Gold-Ring, `prefers-reduced-motion` deaktiviert alle Animationen); `slate-*`-Fremdpalette (Dashboard, App-Nav) und hardcodierte Hex-Werte (`#1C1F33`, `#1a1c29`) durch Tokens ersetzt; ungenutzte Doppel-Wahrheit `lib/design-tokens.ts` nach `_alt/`; tsconfig schließt Deno-Function `supabase/functions` vom Next-Typecheck aus (Build war dadurch rot)
- Redesign-/Launch-Mission-Spec-Paket angelegt (`docs/redesign/`): `00_MISSION.md` (Steuer-Datei) + Design-System, Screen-Specs (Ist→Soll), Funktions-Pakete, Schema-Referenz, `ANLEITUNG.md` — für Ausführung in Claude Code mit Fable 5, ein Arbeitspaket = ein Commit
- Scope: alles Launch-Kritische in 2 Tracks (A Design A0–A8 / B Funktionen B0–B7); Etappe-4-Features (Stripe/AI/B2B/Plaketten) bewusst ausgeklammert; Design-Ziel „Stitch aufwerten"
- Spec gegen echten Code verifiziert (Routen/Felder/Fremd-Paletten bestätigt)

## 2026-07-01
- Gesamt-Audit „Kopf bis Fuß" (Code, Sicherheit, Recht/LP, Docs) — Befund + Maßnahmenplan in `00_Projekt/AUDIT_2026-07-01.md`
- Scheduler-Session vom 22.06. abgeschlossen: Code committet + gehärtet (Jahres-Trigger feuert nicht mehr vor Erstdatum, `lte`-Filter nutzen die Indexe, Batch-Deckel 500/Lauf, `checked`-Zähler korrekt)
- Security-Fix: Open-Redirect im Auth-Callback (`next`-Parameter wird jetzt validiert)
- Rechtstexte korrigiert: falsche Aussage „keine Weitergabe an Dritte" ersetzt durch ehrliche Auftragsverarbeiter-Liste (Supabase, Resend, Google) in `datenschutz.html` + LP-FAQ — **Live-Site braucht SCP-Redeploy der LP-Dateien**
- Tote Download-Links repariert: Trauer-Guide-PDFs (Mensch/Tier) ins Deploy aufgenommen (waren 404)
- `.env.example` korrigiert (echte Supabase-Variablen statt NextAuth-Reste)
- ⚠️ Secrets-Funde in Altdateien (GitHub-Token, Supabase Service-Role-Key) → Ordner nach `!zu löschen durchsicht/` verschoben, **Rotation durch Fabian erforderlich** (Git-Historie geprüft: sauber)

## 2026-06-22
- Scheduler gebaut (Roadmap Phase 1, Aufgabe 2): Supabase Edge Function `send-due-messages` (Deno/TS) — findet fällige `messages` (datumsgetriggert) und `reminders`, versendet über Resend, mit Doppelversand-Schutz und `repeat_yearly`-Logik
- Migration `20260622_scheduler.sql`: Spalte `reminders.last_sent_on`, Indexe für Fällig-Abfragen, Extensions `pg_cron` + `pg_net`
- `supabase/config.toml` angelegt (Function mit `verify_jwt=false`, Schutz über CRON_SECRET) + `setup-cron.sql` (täglicher Cron 06:00 UTC) + README
- Noch nicht live: Deploy, Secrets (RESEND_API_KEY, FROM_EMAIL, CRON_SECRET) und Live-Test ausstehend

## 2026-06-17
- E-Mail (Resend) eingerichtet: Domain aethernal.me verifiziert (DNS via Hostinger), Custom SMTP in Supabase aktiv, „Confirm email" aktiviert → App verschickt echte Anmelde-Bestätigungen
- Projektdateien aufgeräumt: aktiver Code nach `~/Projekte/Aethernal/aethernal`, Altes in `_ALT_kann_geloescht_werden/`
- Arbeitsbasis festgelegt: Next.js + Supabase (Laravel-Plan verworfen)
- Projekt-Gehirn-Dateien angelegt: `CLAUDE.md`, `docs/ROADMAP.md`, `docs/DECISIONS.md`, `docs/CHANGELOG.md`
- Gesamt-Review (Code & Strategie) durchgeführt; Masterplan neu definiert (`docs/MASTERPLAN.md`): B2C-first, volles Kernversprechen vor Launch, Monetarisierung später
