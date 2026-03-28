-- ============================================================
-- AETHERNAL — Sprint 3: Nachrichten aus dem Jenseits
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- Nachrichten-Tabelle
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  memorial_id UUID REFERENCES public.memorials(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  recipient_name TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('date', 'death')),
  trigger_date DATE,
  repeat_yearly BOOLEAN DEFAULT false,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'scheduled', 'sent', 'failed')),
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Vertrauenspersonen
CREATE TABLE IF NOT EXISTS public.trusted_persons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  relationship TEXT,
  confirmed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS aktivieren
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trusted_persons ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users see own messages" ON public.messages
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users see own trusted persons" ON public.trusted_persons
  FOR ALL USING (auth.uid() = user_id);

-- Updated_at Trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$ BEGIN
  NEW.updated_at = now(); RETURN NEW;
END; $$ LANGUAGE plpgsql;

CREATE TRIGGER messages_updated_at
  BEFORE UPDATE ON public.messages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
