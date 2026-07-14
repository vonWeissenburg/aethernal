-- Redesign B2: Einladungs-/Bestätigungs-Flow für Vertrauenspersonen.
-- Es wird NUR der SHA-256-Hash des Bestätigungs-Tokens gespeichert —
-- ein DB-Leak verrät damit keine gültigen Bestätigungs-Links.

ALTER TABLE public.trusted_persons
  ADD COLUMN IF NOT EXISTS confirmation_token_hash TEXT,
  ADD COLUMN IF NOT EXISTS invited_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS trusted_persons_token_hash_idx
  ON public.trusted_persons (confirmation_token_hash)
  WHERE confirmation_token_hash IS NOT NULL;

-- Audit-Hinweis 01.07.: FOR ALL in getrennte Policies ziehen.
-- Die Bestätigung selbst läuft serverseitig mit Service-Role (umgeht RLS),
-- daher braucht es KEINE anonyme Policy.
DROP POLICY IF EXISTS "Users see own trusted persons" ON public.trusted_persons;

CREATE POLICY "trusted_persons_select_own" ON public.trusted_persons
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "trusted_persons_insert_own" ON public.trusted_persons
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "trusted_persons_update_own" ON public.trusted_persons
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "trusted_persons_delete_own" ON public.trusted_persons
  FOR DELETE USING (auth.uid() = user_id);

-- Sicherheit: Ändert der Inhaber die E-Mail-Adresse, verfällt eine bereits
-- erteilte Bestätigung (sonst ließe sich eine bestätigte Person durch
-- E-Mail-Tausch unterschieben — relevant für die Todesbestätigung, B3).
CREATE OR REPLACE FUNCTION public.reset_trusted_person_confirmation()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.email IS DISTINCT FROM OLD.email THEN
    NEW.confirmed := false;
    NEW.confirmed_at := NULL;
    NEW.confirmation_token_hash := NULL;
    NEW.invited_at := NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trusted_person_email_change ON public.trusted_persons;
CREATE TRIGGER trusted_person_email_change
  BEFORE UPDATE ON public.trusted_persons
  FOR EACH ROW EXECUTE FUNCTION public.reset_trusted_person_confirmation();
