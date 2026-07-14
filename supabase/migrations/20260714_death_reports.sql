-- Redesign B3: Todesbestätigungs-Flow (Karenzzeit-Modell, siehe DECISIONS.md).
-- Ablauf: bestätigte Vertrauensperson fordert Link an → meldet den Todesfall →
-- Karenzzeit (7 Tage) mit Warn-Mails + Widerrufslink an den Nutzer → erst danach
-- versendet der bestehende Scheduler die death-Nachrichten.

CREATE TABLE IF NOT EXISTS public.death_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trusted_person_id UUID REFERENCES public.trusted_persons(id) ON DELETE SET NULL,
  reported_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  effective_at TIMESTAMPTZ NOT NULL,
  cancel_token_hash TEXT,
  cancelled_at TIMESTAMPTZ,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Nur EIN aktiver Report pro Nutzer
CREATE UNIQUE INDEX IF NOT EXISTS death_reports_active_idx
  ON public.death_reports (user_id)
  WHERE cancelled_at IS NULL AND processed_at IS NULL;

-- Fällig-Abfrage des Schedulers
CREATE INDEX IF NOT EXISTS death_reports_due_idx
  ON public.death_reports (effective_at)
  WHERE cancelled_at IS NULL AND processed_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS death_reports_cancel_token_idx
  ON public.death_reports (cancel_token_hash)
  WHERE cancel_token_hash IS NOT NULL;

ALTER TABLE public.death_reports ENABLE ROW LEVEL SECURITY;

-- Der Inhaber darf eigene Reports lesen (z. B. für einen künftigen Warn-Banner);
-- ALLE Schreibzugriffe laufen serverseitig mit Service-Role.
CREATE POLICY "death_reports_select_own" ON public.death_reports
  FOR SELECT USING (auth.uid() = user_id);

-- Einmal-Token, mit dem die Vertrauensperson den Melde-Link anfordert
ALTER TABLE public.trusted_persons
  ADD COLUMN IF NOT EXISTS death_report_token_hash TEXT,
  ADD COLUMN IF NOT EXISTS death_report_requested_at TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS trusted_persons_death_token_idx
  ON public.trusted_persons (death_report_token_hash)
  WHERE death_report_token_hash IS NOT NULL;
