# Deploy-Protokoll — Etappe 0 scharfgeschaltet

**Projekt:** Aethernal
**Supabase PROJECT_REF:** `nrxeocbokfllrufdbsdx`
**Bearbeitet:** 2026-07-16 (Claude Code) + 2026-07-19 (Cowork via Browser, Claude Code Schritte 6–9)

Ziel: Etappe 0+1 aus `00_Projekt/SCHLACHTPLAN.md` produktiv scharfschalten —
Nachrichten-Engine (Scheduler + Edge Function + Cron) live bringen.

---

## Erledigt am 2026-07-16 (Claude Code)

- **Backup & Push:** alle Commits auf `github.com/vonWeissenburg/aethernal` (main).
- **Supabase verbunden:** CLI installiert, `supabase link` auf PROJECT_REF `nrxeocbokfllrufdbsdx`.
- **Edge Function deployed:** `send-due-messages`.
- **Function-Secrets gesetzt** (nur Namen, keine Werte hier):
  - `RESEND_API_KEY`
  - `FROM_EMAIL`
  - `CRON_SECRET`

## Erledigt am 2026-07-19 (Cowork, Supabase SQL-Editor im Browser)

- **Idempotenz geprüft:** die 3 Migrationen + Cron-SQL selbst gegengelesen —
  alles `IF NOT EXISTS` / `DROP ... IF EXISTS`, mehrfaches Ausführen ungefährlich.
- **SQL-Block 5a (Struktur) ausgeführt → `Success. No rows returned`.** Enthält:
  - `20260622_scheduler.sql` — `reminders.last_sent_on`, Indizes
    `messages_due_idx` / `reminders_due_idx`, Extensions `pg_cron` + `pg_net`.
  - `20260714_trusted_person_confirmation.sql` — Spalten `confirmation_token_hash` /
    `invited_at` / `confirmed_at`, RLS-Policies (select/insert/update/delete own),
    Trigger `trusted_person_email_change` (Bestätigung verfällt bei E-Mail-Wechsel).
  - `20260714_death_reports.sql` — Tabelle `death_reports` + Indizes + RLS,
    Spalten `death_report_token_hash` / `death_report_requested_at` auf `trusted_persons`.
  - Hinweis: Beim Ausführen erschien Supabases „Potential issue detected"-Modal
    (wegen `DROP POLICY` / `ALTER`) — bestätigt, da idempotent und keine Datenlöschung.
- **SQL-Block 5b (Cron-Job) ausgeführt → Ergebnis `schedule = 1`** (Job-ID).
  Job `aethernal-send-due-messages`, täglich `0 6 * * *` (06:00 UTC = 08:00 Wien Sommerzeit),
  ruft die Edge Function mit `Authorization: Bearer <CRON_SECRET>` auf.
- **Verifiziert (`select ... from cron.job`):**
  | jobid | jobname | schedule | active |
  |---|---|---|---|
  | 1 | aethernal-send-due-messages | `0 6 * * *` | true |

### Wichtiger Hinweis für später
Die Migrationen wurden über den **SQL-Editor** eingespielt, nicht über `supabase db push`.
Supabases interne Migrations-Historie (`supabase_migrations.schema_migrations`) kennt sie
daher **nicht**. Unkritisch, weil alle Blöcke idempotent sind — ein späteres `db push`
würde sie höchstens erneut (gefahrlos) ausführen.

## Erledigt am 2026-07-19 (Claude Code, Schritte 6–8)

### Schritt 6 — VPS aktualisiert
- **Befund: Das echte Deployment liegt in `/opt/aethernal/app`**, NICHT im
  ursprünglich angenommenen `/opt/aether/apps/nextjs` (das ist ein veralteter
  Skeleton-Klon von März, `.env` dort nur `NODE_ENV`). Gefunden über
  `docker inspect aethernal-web` (Compose-Working-Dir-Label).
- Landing-Page wird separat serviert: nginx-Container `aethernal-landingpage`
  mit Bind-Mount `/opt/aethernal/landingpage` — unabhängig vom App-Repo.
- Server-`.env` (`/opt/aethernal/app/.env`): `RESEND_API_KEY` + `FROM_EMAIL`
  ergänzt; `NEXT_PUBLIC_SUPABASE_URL` (= `nrxeocbokfllrufdbsdx`),
  `NEXT_PUBLIC_SUPABASE_ANON_KEY` (sb_publishable), `SUPABASE_SERVICE_ROLE_KEY`,
  `NEXT_PUBLIC_APP_URL=https://app.aethernal.me` waren korrekt vorhanden.
- **Server-Repo hatte lokale Änderungen** an `deploy.sh`, `index.html`,
  `impressum.html` (Live-Edits, u. a. gmail-Adresse im Impressum — nicht im Repo).
  Da die Landing-Page NICHT aus diesem Ordner serviert wird: Dateien gesichert
  nach `/opt/aethernal/!zu löschen durchsicht/2026-07-19-app-repo-edits/` +
  zusätzlich per `git stash` aufgehoben, dann `git pull` → Repo auf `fb01c89`.
- Deploy manuell ausgeführt (`docker compose build --no-cache` + `up -d --force-recreate`),
  weil das Repo-`deploy.sh` auf den falschen Ordner zeigt (siehe „Offen").
- Verifiziert: Container `aethernal-web` läuft, `https://app.aethernal.me` →
  307 auf `/login` (Auth-Middleware), `/login` → **HTTP 200**.

### Schritt 7 — lokale `.env.local`
- `.env.local` im Projekt angelegt (7 Variablen, identisch zur Server-`.env`,
  `chmod 600`); `.gitignore` deckt `.env.local` ab (Zeile 13). Lokale Dev-Tests
  sind damit möglich.

### Schritt 8 — Smoke-Checks
- Edge Function manuell mit `CRON_SECRET` aufgerufen → **HTTP 200**:
  `{"today":"2026-07-19","messages":{"checked":0,"sent":0,"failed":0},"reminders":{"checked":1,"sent":0,"failed":0},"death":{"reports":0,"sent":0,"failed":0}}`
  (erwartetes Bild: nichts fällig). Hinweis: CLI 2.109.1 hat kein
  `functions logs`-Subcommand mehr — Logs übers Dashboard.
- SQL-Verifikation (Fabian im SQL-Editor): 6 neue Spalten ✓, `death_reports` ✓,
  7 Indexe ✓, Cron-Job `aethernal-send-due-messages` aktiv (jobid 1) ✓,
  `cron.job_run_details` leer (Job feuert erstmals 06:00 UTC).

---

## Secrets-Übersicht (nur NAMEN, keine Werte)

| Ort | Variable | Status |
|---|---|---|
| Supabase Function Secrets | `RESEND_API_KEY` | gesetzt (07-16) |
| Supabase Function Secrets | `FROM_EMAIL` | gesetzt (07-16) |
| Supabase Function Secrets | `CRON_SECRET` | gesetzt (07-16) |
| VPS `.env` (`/opt/aethernal/app`) | `SUPABASE_SERVICE_ROLE_KEY` | war gesetzt ✓ |
| VPS `.env` | `RESEND_API_KEY` | gesetzt (07-19) |
| VPS `.env` | `FROM_EMAIL` | gesetzt (07-19) |
| VPS `.env` | `NEXT_PUBLIC_SUPABASE_URL` / `..._ANON_KEY` / `NEXT_PUBLIC_APP_URL` | geprüft ✓ |
| lokal `.env.local` | alle 7 Variablen (Kopie der Server-`.env`) | angelegt (07-19), gitignored |

---

## Aufgetretene Probleme + Lösungen

1. **SSH `root@72.62.156.226` direkt → Permission denied.** Lösung: dedizierter
   Key + Host-Alias `aether` in `~/.ssh/config` (`~/.ssh/aether_vps`).
2. **Falscher App-Ordner in den Unterlagen** (`/opt/aether/apps/nextjs`): echtes
   Deployment ist `/opt/aethernal/app` (siehe oben).
3. **`git pull` auf dem Server blockiert** durch lokale Edits → gesichert
   (Backup-Ordner + Stash), dann gepullt. Nichts gelöscht.
4. **CREATE POLICY nicht idempotent** (Postgres kennt kein `IF NOT EXISTS` bei
   Policies) → in beiden 20260714-Migrationen `DROP POLICY IF EXISTS` davorgesetzt.
5. **`supabase functions logs` existiert in CLI 2.109.1 nicht mehr** → Dashboard.

## Offene Punkte

- [ ] **`deploy.sh` im Repo zeigt auf den falschen Ordner** (`APP_DIR="/opt/aether/apps/nextjs"`
  statt `/opt/aethernal/app`) — Fix liegt bereit, Commit-Freigabe durch Fabian nötig
  (Auftrag war: nur Doku committen). Bis dahin: Deploy-Schritte manuell ausführen.
- [ ] **Idempotenz-Fixes in den zwei 20260714-Migrationen** sind lokal geändert,
  aber noch nicht committet (gleiche Freigabe-Frage).
- [ ] Server-Live-Edits an `index.html`/`impressum.html` (gmail statt eximie,
  „Projekt Aethernal") sind NICHT im Repo — bei Gelegenheit entscheiden, was gilt
  (Backup liegt in `/opt/aethernal/!zu löschen durchsicht/2026-07-19-app-repo-edits/`).
- [ ] Alter Klon `/opt/aether/apps/nextjs` + `nextjs_old_bak` auf dem VPS:
  ungenutzt, zur Durchsicht/Aufräumen markiert (nichts gelöscht).
- [ ] Erster echter Cron-Lauf (06:00 UTC) am Folgetag im Dashboard/`cron.job_run_details` gegenchecken.

## Nächster Schritt
Live-Tests aus `docs/OFFEN_FUER_FABIAN.md` Punkt 3 (Scheduler-Testnachricht,
B0/B2/B4/B5, Lighthouse) — Umgebung ist bereit.
