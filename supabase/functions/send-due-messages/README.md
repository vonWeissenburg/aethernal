# Scheduler: `send-due-messages`

Tägliche Edge Function, die fällige **Nachrichten** (`messages`) und
**Erinnerungen** (`reminders`) findet und über **Resend** versendet.

## Was sie tut

- **Messages:** `status='scheduled'` und `trigger_type='date'`, fällig wenn
  `trigger_date <= heute` (Europe/Vienna). Nach Versand → `status='sent'`.
  Bei `repeat_yearly` bleibt der Status `scheduled`; es wird nur einmal pro Jahr
  am passenden Tag/Monat versendet (über `sent_at` getrackt).
- **Reminders:** fällig analog; gehen an die E-Mail des Konto-Inhabers.
  Doppelversand-Schutz über die neue Spalte `last_sent_on`.
- **Nicht enthalten:** `trigger_type='death'` — kommt mit Roadmap-Aufgabe 4
  (Todesbestätigung).

## Einrichtung (einmalig)

1. **Migration einspielen** (Supabase SQL Editor):
   `supabase/migrations/20260622_scheduler.sql`

2. **Secrets setzen** (Supabase CLI):
   ```bash
   supabase secrets set RESEND_API_KEY=re_xxx
   supabase secrets set FROM_EMAIL="Aethernal <noreply@aethernal.me>"
   supabase secrets set CRON_SECRET=<langes-zufalls-secret>
   ```
   `SUPABASE_URL` und `SUPABASE_SERVICE_ROLE_KEY` werden automatisch injiziert.

3. **Function deployen:**
   ```bash
   supabase functions deploy send-due-messages
   ```

4. **Cron anlegen:** `setup-cron.sql` öffnen, `<PROJECT_REF>` und
   `<CRON_SECRET>` ersetzen, im SQL Editor ausführen.

## Manuell testen

```bash
curl -i -X POST \
  "https://<PROJECT_REF>.supabase.co/functions/v1/send-due-messages" \
  -H "Authorization: Bearer <CRON_SECRET>"
```
Antwort ist ein JSON mit Zählern (`checked`/`sent`/`failed`) je Typ.
Zum gefahrlosen Testen eine Test-Message mit `status='scheduled'`,
`trigger_type='date'`, `trigger_date` = heute und eigener `recipient_email` anlegen.
