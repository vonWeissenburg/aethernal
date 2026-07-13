# 04 — SCHEMA & DATENFLUSS (authoritativ)

*Direkt aus `supabase/migration.sql` + `supabase/migrations/*.sql` gezogen (13.07.2026). Fable: keine Felder erfinden, die hier nicht stehen. Neue Felder/Tabellen nur per neuer Migration in `supabase/migrations/` + Eintrag in `docs/DECISIONS.md`.*

## Überblick
7 Tabellen + 1 Storage-Bucket. RLS auf **allen** Tabellen aktiv. Autorisierung trägt RLS; der App-Code filtert zusätzlich `.eq('user_id', …)`.

## Tabellen

### `profiles`  (1:1 zu auth.users)
`id` uuid PK → auth.users (cascade) · `full_name` text · `avatar_url` text · `onboarding_done` bool=false · `created_at`/`updated_at` timestamptz.
Auto-Insert per Trigger `on_auth_user_created` (`handle_new_user`, nimmt `full_name` aus User-Metadaten).
RLS: select/update/insert nur eigenes (`auth.uid() = id`).

### `memorials`  (Gedenkprofil)
`id` uuid PK · `user_id` → auth.users (cascade, not null) · `name` not null · `slug` text **unique** not null · `type` ∈ {`human`,`animal`}=human · `birth_date`/`death_date` date · `description` text · `biography` text · `profile_photo_url` text · `is_public` bool=**true** · timestamps.
RLS: Owner alles; **zusätzlich** öffentlich lesbar wenn `is_public=true` (trägt `/s/[slug]`).

### `memorial_photos`  (Galerie)
`id` uuid PK · `memorial_id` → memorials (cascade, not null) · `url` not null · `caption` text · `order_index` int=0 · `created_at`.
RLS: Owner (via memorial-Ownership) alles; öffentlich lesbar wenn Memorial public.
⚠️ `caption` & `order_index` werden von der App aktuell nie befüllt → Potenzial (Bildunterschrift/Sortierung).

### `diary_entries`  (Tagebuch)
`id` uuid PK · `user_id` (cascade) · `memorial_id` → memorials (cascade, **not null**) · `title` text · `content` text not null · `mood` ∈ {`sad`,`reflective`,`grateful`,`loving`,`joyful`} · `entry_date` date=today · `created_at`.
RLS: `FOR ALL` eigenes.

### `messages`  ★ Kernversprechen
`id` uuid PK · `user_id` (cascade) · `memorial_id` → memorials (**ON DELETE SET NULL**) · `title` not null · `body` not null · `recipient_name` not null · `recipient_email` not null · `trigger_type` ∈ {`date`,`death`} not null · `trigger_date` date · `repeat_yearly` bool=false · `status` ∈ {`draft`,`scheduled`,`sent`,`failed`}=draft · `sent_at` timestamptz · timestamps (`updated_at` per Trigger).
RLS: `FOR ALL` eigenes. Index `messages_due_idx (status, trigger_type, trigger_date)` für den Scheduler.
**Zustell-Logik:** Der Scheduler versendet fällige `date`-Nachrichten (status `scheduled`, `trigger_date`≤heute). `death`-Nachrichten warten auf die Todesbestätigung (Track B3) — bis dahin gibt es keinen Auslöser.

### `trusted_persons`  (Vertrauenspersonen)
`id` uuid PK · `user_id` (cascade) · `name` not null · `email` not null · `relationship` text · `confirmed` bool=**false** · `created_at`.
RLS: `FOR ALL` eigenes (Audit-Hinweis: bei Track B3 in getrennte Policies ziehen).
⚠️ `confirmed` wird aktuell **nie** true — es fehlt der Einladungs-/Bestätigungs-Flow (Track B2/B3).

### `reminders`  (Termine)
`id` uuid PK · `user_id` (cascade) · `memorial_id` → memorials (SET NULL) · `title` not null · `description` text · `reminder_date` date not null · `reminder_type` ∈ {`birthday`,`deathday`,`anniversary`,`custom`}=custom · `repeat_yearly` bool=false · `last_sent_on` date · timestamps.
RLS: `FOR ALL` eigenes. Index `reminders_due_idx (reminder_date)`.

## Storage
Bucket **`memorial-photos`** (public). Policies: jeder darf lesen; authentifizierte dürfen hochladen; löschen nur Owner, erkannt am Ordner-Präfix `{user_id}/…`. App-Pfad: `{uid}/{memorialId}/{timestamp}.ext`.
⚠️ Konto-Löschung entfernt diese Objekte aktuell NICHT (Track B4).

## Extensions / Scheduler-Infra
`pg_cron` + `pg_net` (Schema `extensions`) für den täglichen Cron, der die Edge-Function `send-due-messages` aufruft. Deploy = Fabian (project_ref + Secrets).

## Datenfluss-Notizen (für Redesign relevant)
- Client-Mutationen über `lib/supabase/client.ts`; Server-Reads/Actions über `lib/supabase/server.ts`.
- `memorials.slug` wird bei Namensänderung neu generiert → bricht bestehende SpiritLink-URLs still (kein Alias). Bei Track B/QR beachten.
- `memorials.profile_photo_url` bleibt derzeit immer leer (Upload-Bug, Track B0) → überall Icon-Fallback.
