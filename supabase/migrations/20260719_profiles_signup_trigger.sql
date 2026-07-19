-- Befund Death-Journey-Probe 19.07.2026: `profiles` ist in Prod KOMPLETT leer
-- (0 Zeilen bei 4 auth.users), obwohl ZWEI Signup-Trigger existieren
-- (on_auth_user_created + Duplikat trg_auth_user_created, gleiche Funktion).
-- Ursache: Schema-Drift — die Prod-Tabelle `profiles` hat eine Spalte
-- `email NOT NULL` (plus display_name/phone/locale/guide_type), die
-- `handle_new_user()` nicht befüllt. Der Insert scheitert bei JEDEM Signup,
-- der Fehler wird vom `exception when others → raise log`-Guard verschluckt.
-- Folge: App-Mails zeigen den Fallback „Ein Aethernal-Mitglied" statt des
-- Namens, Onboarding-Flag greift nie.
-- Fix: Funktion befüllt jetzt auch email; Duplikat-Trigger entfernt; Backfill
-- für Bestandskonten. Idempotent; mehrfaches Ausführen ungefährlich.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Signup darf nie an der Profilanlage scheitern; Fehler landet im DB-Log.
  RAISE LOG 'handle_new_user failed: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Duplikat-Trigger entfernen (rief dieselbe Funktion doppelt auf)
DROP TRIGGER IF EXISTS trg_auth_user_created ON auth.users;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Backfill für Bestandskonten: email aus auth.users, full_name aus den
-- Signup-Metadaten (der Registrier-Flow übergibt full_name als user_metadata).
-- onboarding_done = true, damit Bestandsnutzer nicht nachträglich in den
-- Onboarding-Redirect laufen (app/auth/callback prüft dieses Flag).
INSERT INTO public.profiles (id, email, full_name, onboarding_done)
SELECT id, email, raw_user_meta_data->>'full_name', true
FROM auth.users
ON CONFLICT (id) DO NOTHING;
