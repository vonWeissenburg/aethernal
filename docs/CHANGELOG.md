# Changelog

_Was wann gebaut/geändert wurde. Neueste zuerst._

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
