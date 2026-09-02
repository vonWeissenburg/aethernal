-- Doppelbestätigung im Todesfall-Ablauf (Entscheidung Fabian, 28.08.2026).
--
-- Bisher: Vertrauensperson meldet den Tod → Karenzzeit 7 Tage mit Widerrufslink
--         an den Nutzer → Scheduler stellt zu.
-- Neu:    Nach Ablauf der Karenzzeit stellt der Scheduler NICHT sofort zu, sondern
--         bittet die Vertrauensperson um eine ZWEITE, bewusste Bestätigung.
--         Zwei getrennte Handlungen eines Menschen, den der Nutzer selbst benannt hat.
--
-- Wichtig — bewusste Konstruktionsentscheidung: Die zweite Bestätigung ist ein
-- BESCHLEUNIGER, keine harte Hürde. Bliebe sie aus, käme nie eine Nachricht an und
-- das Kernversprechen des Produkts wäre gebrochen (die Vertrauensperson kann
-- überfordert, nicht erreichbar oder selbst verstorben sein). Deshalb:
--   bestätigt  → Zustellung beim nächsten Scheduler-Lauf (< 24 h)
--   schweigt   → Zustellung automatisch nach FINAL_CONFIRM_FALLBACK_DAYS (14 Tage)
-- Das Widerrufsfenster des Nutzers wächst dadurch von 7 auf bis zu 21 Tage.
--
-- Idempotent. Einspielen über den Supabase-SQL-Editor (Projekt nrxeocbokfllrufdbsdx),
-- wie alle Migrationen dieses Projekts — NICHT über `supabase db push`.

ALTER TABLE public.death_reports
  -- Zeitpunkt, an dem die Bitte um zweite Bestätigung verschickt wurde
  ADD COLUMN IF NOT EXISTS final_request_sent_at TIMESTAMPTZ,
  -- SHA-256-Hash des Einmal-Tokens für die zweite Bestätigung (nie im Klartext)
  ADD COLUMN IF NOT EXISTS final_confirm_token_hash TEXT,
  -- Zeitpunkt der zweiten Bestätigung durch die Vertrauensperson
  ADD COLUMN IF NOT EXISTS final_confirmed_at TIMESTAMPTZ,
  -- Zeitpunkt der Erinnerung, falls die zweite Bestätigung ausbleibt
  ADD COLUMN IF NOT EXISTS final_reminder_sent_at TIMESTAMPTZ,
  -- Rückfalldatum: ab hier wird auch ohne zweite Bestätigung zugestellt
  ADD COLUMN IF NOT EXISTS fallback_deliver_at TIMESTAMPTZ;

-- Token-Lookup der Freigabeseite
CREATE UNIQUE INDEX IF NOT EXISTS death_reports_final_token_idx
  ON public.death_reports (final_confirm_token_hash)
  WHERE final_confirm_token_hash IS NOT NULL;

-- Scheduler-Schritt A: Karenzzeit abgelaufen, zweite Bestätigung noch nicht angefragt
CREATE INDEX IF NOT EXISTS death_reports_awaiting_final_idx
  ON public.death_reports (effective_at)
  WHERE cancelled_at IS NULL
    AND processed_at IS NULL
    AND final_request_sent_at IS NULL;

-- Scheduler-Schritt C: zustellbar (bestätigt oder Rückfalldatum erreicht)
CREATE INDEX IF NOT EXISTS death_reports_deliverable_idx
  ON public.death_reports (fallback_deliver_at)
  WHERE cancelled_at IS NULL
    AND processed_at IS NULL;

-- Kein Backfill nötig: Ein bereits laufender Report ohne final_request_sent_at wird
-- vom Scheduler-Schritt A automatisch aufgegriffen, sobald effective_at erreicht ist,
-- und bekommt dort Token und fallback_deliver_at gesetzt.
