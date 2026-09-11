# Nächster Start — Resume-Notiz (Stand 11.09.2026)

*`main` = `origin/main` = Server. Alles Untenstehende ist live und gegengeprüft.*

## Wo wir stehen

Am 11.09. sind die beiden seit 02.09. liegengebliebenen Zweige ausgerollt worden, dazu die
ersten Punkte aus Etappe A des Masterplans (`00_Projekt/MASTERPLAN_2026-08-28.md`).

**Live seit heute:**
- Auflistbarkeit öffentlicher Gedenkprofile geschlossen — mit dem öffentlichen anon-Key
  liefern `memorials` und `memorial_photos` jetzt **0 Zeilen** statt 5 mit Klarnamen und
  Sterbedaten. Der Einzelabruf per Kurzname läuft über `public.get_public_memorial()`.
- Doppelbestätigung im Todesfall-Ablauf scharf (Migration + App + Edge Function),
  durch einen echten Scheduler-Lauf bestätigt.
- Registrierung geschlossen (`REGISTRATION_OPEN` in der Server-`.env`, Standard zu).
- Tägliche Datensicherung auf dem VPS, 03:30, 14 Generationen, inkl. Bilddateien.
- Serveraltlasten archiviert, `.env` auf `600`.

**Bestand:** 3 Konten, 4 Gedenkprofile (Testkonto `eti.fakler` wurde entfernt).

## Als Nächstes — Rest von Etappe A

1. **Überwachung.** Das ist der wichtigste offene Punkt. Ping am Ende jedes Versandlaufs
   plus ein Kanarienvogel-Termin, der wöchentlich eine echte Mail erzwingt. Ohne das fällt
   ein Ausfall erst am **03.11.2026** auf — dann ist die erste echte Nachricht fällig.
2. **`pg_dump`** für Schema, Policies, Datenbankfunktionen und Auth-Konten. Die tägliche
   Sicherung deckt nur Daten und Dateien ab. Braucht das DB-Passwort aus dem
   Supabase-Dashboard (Settings → Database).
3. **`CRON_SECRET`** in einen Passwortmanager, aus der Drive-Doku entfernen, neu setzen.

Danach Etappe B (Fotospeicher auf privat + signierte Links — der Bucket `memorial-photos`
ist weiterhin öffentlich, das ist Blocker 2), dann C (Ladezeit der Gedenkseite unter 2 s).

## Was auf Fabian wartet

Supabase → Authentication → **„Allow new users to sign up" ausschalten**. Die App-Sperre
schließt nur die Oberfläche. Ansonsten: Abschnitt 7 des Masterplans (AVVs, Formulartest,
Anwältin, Steuerberater).

## Nützliche Fakten

- **Supabase-Zugang:** Ein gültiger Personal Access Token liegt in
  `.claude/settings.local.json` (Berechtigungsregel `export SUPABASE_ACCESS_TOKEN=sbp_…`).
  `supabase login` funktioniert aus Claude Code NICHT (kein TTY). SQL läuft über
  `POST https://api.supabase.com/v1/projects/nrxeocbokfllrufdbsdx/database/query`.
- **Scheduler von Hand anstoßen, ohne das Secret zu sehen:**
  `do $$ declare cmd text; begin select command into cmd from cron.job
  where jobname='aethernal-send-due-messages'; execute cmd; end $$;`
  Antwort danach in `net._http_response` nachlesen.
- **Landing Page hat KEIN CI/CD.** Nach jeder Änderung `scp datei aether:/opt/aethernal/landingpage/`.
- **LP-CSS neu bauen:**
  `npx tailwindcss -c landingpage.tailwind.config.js -i landingpage.input.css -o styles.css --minify`
- **Neues Icon im Code?** Namen in `app/fonts/ICONS.txt` ergänzen und den Subset neu ziehen.
- App-Deploy: push auf `main` → GitHub Actions (~2,5 min). Edge Function separat:
  `supabase functions deploy send-due-messages --project-ref nrxeocbokfllrufdbsdx`.
- Migrationen laufen über die Management-API bzw. den SQL-Editor, NICHT `db push`
  (Historie ist leer, alles idempotent — siehe SCHEMA_DRIFT).
- Demo-Login: `fabian.fehervary+demo@gmail.com`. Die verbliebenen Bestandskonten nicht anfassen.
- Sicherungen: täglich `/opt/aethernal/backups` auf dem VPS, einmalig lokal unter
  `~/Projekte/Aethernal/backups/`.
- Rollback Landing Page: `/opt/aethernal/_archiv-2026-09-11/index.html.bak-2026-08-13-vor-perf`.
