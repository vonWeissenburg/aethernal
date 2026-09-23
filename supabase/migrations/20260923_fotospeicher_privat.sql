-- Fotospeicher auf privat (Befund 28.08.2026, Blocker 2; Entscheidung Fabian 23.09.2026: Weg C).
--
-- BEFUND: Der Bucket memorial-photos ist öffentlich. Jedes Foto eines Verstorbenen ist ohne
-- Anmeldung über seine direkte Adresse abrufbar (geprüft: HTTP 200). Die Datenbank speichert
-- nicht die Speicherpfade, sondern die fertigen öffentlichen Adressen
-- (memorials.profile_photo_url, memorial_photos.url) — der Bucket lässt sich deshalb nicht
-- einfach umschalten, sonst werden alle gespeicherten Adressen auf einen Schlag ungültig.
--
-- LÖSUNG (Weg C): Die Zugehörigkeit steht im Speicherpfad {konto}/{gedenkprofil}/{datei}.
-- Daraus wird eine Zugriffsregel direkt auf storage.objects: Unangemeldete dürfen genau die
-- Dateien lesen, die zu einem öffentlichen Gedenkprofil gehören; Eigentümer ihren eigenen
-- Ordner. Die App speichert nur noch Pfade und signiert sie kurz vor dem Anzeigen — mit dem
-- Schlüssel des jeweiligen Aufrufers (anon oder Nutzer), nicht mit dem Service-Role-Key.
-- Dasselbe Muster wie 20260828_public_memorial_no_enumeration: nicht „unerwünscht", sondern
-- strukturell unmöglich. Die Entscheidung vom 02.09. („kein Service-Role-Key im Renderpfad
-- der öffentlichen Seite") bleibt stehen.
--
-- NEBENWIRKUNG, bewusst: Signierte Adressen laufen nach einer Stunde ab. Ein kopierter
-- Bildlink funktioniert morgen nicht mehr. Bei Fotos Verstorbener ist das gewollt.
--
-- ⚠️ REIHENFOLGE — ZWEI SCHRITTE MIT DEM DEPLOY DAZWISCHEN (wie am 11.09.).
--
--   SCHRITT 1  (Abschnitt 1–4)  → Pfadspalten anlegen und aus den Adressen befüllen,
--                                 Hilfsfunktion und neue Lese-Regeln anlegen. Rein additiv:
--                                 der Bucket bleibt öffentlich, der alte Code läuft weiter.
--   DANN       Zweig feature/fotospeicher-privat nach main mergen und deployen. Die App
--              liest ab jetzt Pfade und signiert. Funktioniert auch auf dem noch
--              öffentlichen Bucket — signierte Adressen gelten dort ebenso.
--   SCHRITT 2  (Abschnitt 5–7)  → Bucket auf privat, alte Alles-lesen-Regel entfernen,
--                                 alte Adressen aus der Datenbank nehmen. Ab hier liefert
--                                 die direkte Adresse eines Fotos einen Fehler.
--
-- Idempotent, beide Schritte beliebig oft ausführbar.
-- Einspielen über die Management-API oder den Supabase-SQL-Editor (Projekt nrxeocbokfllrufdbsdx).
--
-- BESTAND beim Schreiben (23.09.2026): 7 Dateien im Bucket, 2 Konten. 2 Profilfotos und
-- 4 Galeriefotos in der Datenbank — davon EIN Galeriefoto eines Bestandskontos (27.03.2026),
-- der Rest Demo-Konto. Die Pfad-Ableitung ist rein mechanisch (Adresse → Teil nach
-- „/memorial-photos/") und fasst keinen Inhalt an.

-- ============================================================
-- SCHRITT 1 — JETZT einspielen (rein additiv, ändert kein Verhalten)
-- ============================================================

-- 1) Pfadspalten. Die alten Adress-Spalten bleiben vorerst stehen (Rückweg), werden aber
--    vom neuen Code nicht mehr beschrieben. url war NOT NULL — das muss weg, sonst kann
--    der neue Code keine Galeriefotos mehr anlegen.
ALTER TABLE public.memorials
  ADD COLUMN IF NOT EXISTS profile_photo_path text;

ALTER TABLE public.memorial_photos
  ADD COLUMN IF NOT EXISTS path text;

ALTER TABLE public.memorial_photos
  ALTER COLUMN url DROP NOT NULL;

COMMENT ON COLUMN public.memorials.profile_photo_path IS
  'Speicherpfad im Bucket memorial-photos ({uid}/{memorialId}/{datei}). Wird beim Anzeigen '
  'signiert. Ersetzt profile_photo_url (23.09.2026).';
COMMENT ON COLUMN public.memorial_photos.path IS
  'Speicherpfad im Bucket memorial-photos ({uid}/{memorialId}/{datei}). Wird beim Anzeigen '
  'signiert. Ersetzt url (23.09.2026).';

-- 2) Befüllen: alles nach „/memorial-photos/" ist der Pfad. Nur Zeilen ohne Pfad, damit
--    der Schritt wiederholbar bleibt und nichts überschreibt, was der neue Code schon
--    geschrieben hat.
UPDATE public.memorials
   SET profile_photo_path = regexp_replace(profile_photo_url, '^.*/memorial-photos/', '')
 WHERE profile_photo_url IS NOT NULL
   AND profile_photo_path IS NULL;

UPDATE public.memorial_photos
   SET path = regexp_replace(url, '^.*/memorial-photos/', '')
 WHERE url IS NOT NULL
   AND path IS NULL;

-- 3) Hilfsfunktion: Gehört diese Datei zu einem öffentlichen Gedenkprofil?
--    SECURITY DEFINER ist nötig, weil anon seit dem 11.09. die Tabelle memorials nicht
--    mehr lesen darf — die Policy unten könnte die Frage sonst nicht beantworten.
--    Die WHERE-Klausel ist die Schranke: Konto UND Profil müssen zum Pfad passen.
--    search_path = '' gegen Verwechslungsangriffe; alle Objekte sind qualifiziert.
CREATE OR REPLACE FUNCTION public.storage_object_is_public(object_name text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
      FROM public.memorials m
     WHERE m.is_public = true
       AND m.user_id::text = (storage.foldername(object_name))[1]
       AND m.id::text      = (storage.foldername(object_name))[2]
  );
$$;

COMMENT ON FUNCTION public.storage_object_is_public(text) IS
  'Storage-RLS: true, wenn der Pfad {uid}/{memorialId}/… zu einem öffentlichen Gedenkprofil '
  'gehört. Grundlage für das Signieren von Fotos auf der öffentlichen Gedenkseite (23.09.2026).';

REVOKE ALL ON FUNCTION public.storage_object_is_public(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.storage_object_is_public(text) TO anon, authenticated;

-- 4) Neue Lese-Regeln — zusätzlich zur alten „Anyone can view", die erst in Schritt 2 fällt.
--    a) Eigentümer lesen (= signieren) ihren eigenen Ordner.
DROP POLICY IF EXISTS "Owners can read own memorial photos" ON storage.objects;
CREATE POLICY "Owners can read own memorial photos"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'memorial-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

--    b) Alle (anon eingeschlossen) lesen Dateien öffentlicher Gedenkprofile.
DROP POLICY IF EXISTS "Public memorial photos are readable" ON storage.objects;
CREATE POLICY "Public memorial photos are readable"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'memorial-photos'
    AND public.storage_object_is_public(name)
  );

--    c) Nebenbefund, gleich mit zu: Die Upload-Regel prüfte nur „angemeldet", nicht den
--       Ordner. Ein angemeldeter Nutzer konnte in den Ordner eines FREMDEN Kontos laden.
--       Jetzt: nur in den eigenen. Der App-Code lädt seit jeher nach {eigene uid}/… .
DROP POLICY IF EXISTS "Authenticated users can upload photos" ON storage.objects;
CREATE POLICY "Authenticated users can upload photos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'memorial-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Gegenprobe Schritt 1 (im SQL-Editor; alle drei müssen stimmen):
--
--   -- Pfade befüllt, keine Adresse ohne Pfad:
--   select count(*) from public.memorials where profile_photo_url is not null and profile_photo_path is null;
--   select count(*) from public.memorial_photos where url is not null and path is null;
--   -- beide 0
--
--   -- Die Pfade sehen aus wie {uuid}/{uuid}/{datei}:
--   select profile_photo_path from public.memorials where profile_photo_path is not null;
--   select path from public.memorial_photos where path is not null;

-- ============================================================
-- SCHRITT 2 — ERST NACH dem Deploy und der Sichtprüfung einspielen
-- ============================================================

-- 5) Bucket auf privat. Ab hier antwortet /storage/v1/object/public/memorial-photos/…
--    mit einem Fehler; nur signierte Adressen funktionieren.
UPDATE storage.buckets
   SET public = false
 WHERE id = 'memorial-photos';

-- 6) Die alte Alles-lesen-Regel entfernen. Lesen dürfen ab hier nur Eigentümer (eigener
--    Ordner) und alle für Dateien öffentlicher Profile — siehe Abschnitt 4.
DROP POLICY IF EXISTS "Anyone can view memorial photos" ON storage.objects;

-- 7) Alte öffentliche Adressen aus der Datenbank nehmen. Sie zeigen ins Leere und würden
--    nur verwirren. Die Spalten selbst bleiben bis zu einer späteren Aufräum-Migration —
--    Löschen ist nicht rückholbar, Leeren schon (Adresse = Bucket-URL + Pfad).
UPDATE public.memorials
   SET profile_photo_url = NULL
 WHERE profile_photo_url IS NOT NULL
   AND profile_photo_path IS NOT NULL;

UPDATE public.memorial_photos
   SET url = NULL
 WHERE url IS NOT NULL
   AND path IS NOT NULL;

-- Gegenprobe Schritt 2:
--
--   -- Bucket privat:
--   select public from storage.buckets where id = 'memorial-photos';   -- false
--
--   -- Nur noch die drei Lese-/Schreib-Regeln + Löschen:
--   select policyname, cmd from pg_policies where schemaname='storage' and tablename='objects' order by 1;
--
--   -- Von außen (Browser, ohne Anmeldung): die alte direkte Adresse eines Fotos liefert
--   -- einen Fehler (400/404), die Gedenkseite /s/<kurzname> zeigt die Fotos weiterhin.
