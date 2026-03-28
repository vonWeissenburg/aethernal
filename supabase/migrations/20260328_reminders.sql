-- ============================================================
-- AETHERNAL — Sprint 3: Termine & Erinnerungen
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  memorial_id UUID REFERENCES public.memorials(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  reminder_date DATE NOT NULL,
  reminder_type TEXT NOT NULL DEFAULT 'custom'
    CHECK (reminder_type IN ('birthday', 'deathday', 'anniversary', 'custom')),
  repeat_yearly BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own reminders" ON public.reminders
  FOR ALL USING (auth.uid() = user_id);

CREATE TRIGGER reminders_updated_at
  BEFORE UPDATE ON public.reminders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
