-- ============================================================
-- AETHERNAL — Scheduler (Roadmap Phase 1, Aufgabe 2)
-- Vorbereitung der DB für die Edge Function `send-due-messages`.
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor).
-- ============================================================

-- 1) Reminders: Versand-Status nachrüsten ----------------------------------
-- `reminders` hatte bisher KEIN Feld, um zu merken, ob die Erinnerung
-- schon verschickt wurde. Ohne das würde der tägliche Cron jede fällige
-- Erinnerung jeden Tag erneut versenden. `last_sent_on` schließt diese Lücke
-- (für einmalige UND jährlich wiederkehrende Erinnerungen).
ALTER TABLE public.reminders
  ADD COLUMN IF NOT EXISTS last_sent_on DATE;

-- 2) Indexe für die "fällig?"-Abfragen --------------------------------------
-- Der Scheduler filtert messages nach (status, trigger_type, trigger_date)
-- und reminders nach (reminder_date). Indexe halten das auch bei vielen
-- Datensätzen schnell.
CREATE INDEX IF NOT EXISTS messages_due_idx
  ON public.messages (status, trigger_type, trigger_date);

CREATE INDEX IF NOT EXISTS reminders_due_idx
  ON public.reminders (reminder_date);

-- 3) Extensions für den geplanten Versand -----------------------------------
-- pg_cron  = zeitgesteuerte Jobs in Postgres (täglicher Trigger)
-- pg_net   = HTTP-Requests aus Postgres heraus (ruft die Edge Function auf)
-- Werden im Supabase-Schema `extensions` installiert (Supabase-Konvention).
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net  WITH SCHEMA extensions;

-- Der eigentliche Cron-Job (er enthält Projekt-URL + Secret) wird NICHT hier
-- angelegt, sondern einmalig über supabase/functions/send-due-messages/setup-cron.sql,
-- weil er umgebungsspezifische Werte (Function-URL, CRON_SECRET) braucht.
