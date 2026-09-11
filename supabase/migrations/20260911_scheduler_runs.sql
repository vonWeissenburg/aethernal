-- Ping am Ende jedes Versandlaufs (Etappe A, Masterplan 28.08.2026).
--
-- BEFUND 11.09.2026: Es gab keine Möglichkeit festzustellen, ob der Scheduler
-- überhaupt gelaufen ist. `net._http_response` schien dafür geeignet, wird von
-- pg_net aber nach wenigen Stunden geleert (beim Prüfen: genau 1 Eintrag).
-- Eine Überwachung, die darauf aufbaut, meldet entweder Fehlalarme oder nichts.
--
-- LÖSUNG: Der Versandlauf schreibt am Ende selbst eine Zeile. Fehlt sie, ist der
-- Lauf ausgefallen — das ist der Unterschied zwischen "nichts zu tun" und
-- "nichts passiert", den man von außen sonst nicht sehen kann.
--
-- Ohne diese Überwachung fiele ein Ausfall erst am 03.11.2026 auf, wenn die
-- erste echte Nachricht fällig ist.
--
-- Idempotent.

CREATE TABLE IF NOT EXISTS public.scheduler_runs (
  id          BIGSERIAL PRIMARY KEY,
  ran_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  ok          BOOLEAN     NOT NULL,
  summary     JSONB       NOT NULL
);

CREATE INDEX IF NOT EXISTS scheduler_runs_ran_at_idx
  ON public.scheduler_runs (ran_at DESC);

-- RLS an, aber KEINE Policy: Damit kommt ausschliesslich der Service-Role-Key
-- heran (der umgeht RLS). Weder anon noch angemeldete Nutzer sehen die Tabelle.
ALTER TABLE public.scheduler_runs ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.scheduler_runs IS
  'Ein Eintrag pro Lauf von send-due-messages. Grundlage der Ausfallüberwachung '
  '(/opt/aethernal/watchdog-aethernal.py auf dem VPS). Befund 11.09.2026.';
