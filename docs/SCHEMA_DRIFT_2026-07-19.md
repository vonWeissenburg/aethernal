# Schema-Drift Repo ↔ Prod — Befund & Abgleich (19.07.2026)

Read-only-Introspektion der Prod-DB (`information_schema`/`pg_catalog` über die
Management-API), ausgelöst durch den profiles-Bug aus der Death-Journey-Probe
(siehe CHANGELOG 19.07.). **An Prod wurde bei diesem Abgleich nichts geändert** —
nur Repo-Dateien wurden nachgezogen.

## Kernbefund

Die Prod-DB enthält **zwei Schema-Generationen übereinander**:

1. **Legacy-Schema der früheren App-Iteration** (März 2026, vor dem heutigen
   Next.js-Stand): 13 Tabellen + 9 Enums + Hilfsfunktionen. Die heutige App
   nutzt davon nichts — mit EINER Ausnahme: **`profiles` wurde weiterverwendet**,
   hat aber die Legacy-Struktur. Genau daran scheiterte der Signup-Trigger
   (`email NOT NULL` wurde nicht befüllt) → profiles blieb seit März leer.
2. **Aktuelles App-Schema** (`memorials`, `memorial_photos`, `diary_entries`,
   `messages`, `trusted_persons`, `reminders`, `death_reports`) — deckt sich
   mit den Repo-Dateien (`migration.sql` §2–5 + `supabase/migrations/*.sql`).

## Abweichungen im Detail (Stand vor dem Abgleich)

### `profiles` — Repo war falsch, jetzt angeglichen
Prod hat zusätzlich/anders als die alte `migration.sql`:

| Spalte | Prod | alte Repo-Baseline |
|---|---|---|
| `email` | `text NOT NULL` + Index `idx_profiles_email` | fehlte |
| `display_name`, `phone` | vorhanden | fehlten |
| `locale` | `text default 'de-AT'` | fehlte |
| `guide_type` | Enum `guide_type (mensch, tier)` | fehlte |

→ `migration.sql` §1 ist jetzt die echte Prod-Definition (inkl. Enum-Guard und
gefixtem `handle_new_user`).

### `profiles` — Doppelte Policies + Extra-Trigger in Prod (belassen)
- Prod trägt ZWEI Policy-Sätze mit gleicher Wirkung: die englischen aus dem Repo
  **und** deutsche Legacy-Policies („profile: eigenes lesen/aktualisieren")
  plus „profile: service role full access" (redundant — Service-Role umgeht RLS
  ohnehin). Harmlos, nur Ballast.
- Extra-Trigger `trg_profiles_updated_at` → `handle_updated_at()` (Legacy-Pendant
  zu `update_updated_at()`). Harmlos.

### Übrige App-Tabellen — deckungsgleich
`memorials`, `memorial_photos`, `diary_entries` (inkl. mood-Check),
`messages`/`trusted_persons`/`reminders` (inkl. `update_updated_at`-Trigger,
Scheduler-Spalten/-Indexe) und `death_reports` entsprechen exakt den
Repo-Dateien. Die B2/B3-Migrationen vom 14.07. sind vollständig und korrekt
in Prod (Policies, Partial-Unique-Indexe, `trusted_person_email_change`-Trigger).

### `lib/types.ts` (`Profile`)
Kennt `email`/`display_name`/`phone`/`locale`/`guide_type` nicht. Unkritisch,
weil die App diese Spalten nirgends liest/schreibt — bewusst NICHT erweitert.

## Legacy-Inventar in Prod (existiert, wird von der App nicht genutzt)

- **Tabellen (alle leer, Stand 19.07.):** `appointments`, `deceased_persons`,
  `deceased_pets`, `family_members`, `grief_journal`, `grief_resources`,
  `memorial_pages`, `memories`, `notifications`, `partner_applications`,
  `partners`, `subscriptions` — sowie `subscription_plans` (**3 Seed-Zeilen**,
  keine Nutzerdaten). RLS ist auf allen Tabellen aktiv.
- **Enums:** `appointment_status`, `guide_type` (von profiles genutzt!),
  `notification_type`, `page_visibility`, `partner_application_status`,
  `partner_type`, `plan_type`, `resource_category`, `subscription_status`
- **Funktionen:** `generate_memorial_slug`, `handle_updated_at`,
  `increment_page_views` (+ `update_updated_at`, das auch das aktuelle Schema nutzt)
- **Extensions über die Basics hinaus:** `pg_trgm`, `unaccent`
  (+ `pg_cron`, `pg_net` vom Scheduler — gewollt)

## Empfehlung (Entscheidung Fabian, NICHT umgesetzt)

Legacy-Tabellen/-Enums/-Funktionen irgendwann per eigener Migration droppen
(alles leer bis auf 3 Seed-Zeilen ohne Nutzerdaten; `guide_type` MUSS bleiben,
solange `profiles` die Spalte hat) und die redundanten profiles-Policies
bereinigen. Kein Handlungsdruck — stört nur beim Lesen des Schemas.

## Hinweis zu `supabase db push`

Die Migrations-Historie (`supabase_migrations.schema_migrations`) kennt die
bisher manuell (SQL-Editor/Management-API) eingespielten Migrationen nicht.
Alle Repo-Migrationen sind idempotent — ein künftiges `db push` würde sie
gefahrlos erneut ausführen. Die Baseline `migration.sql` läuft NICHT über
`db push` (liegt bewusst außerhalb von `supabase/migrations/`).
