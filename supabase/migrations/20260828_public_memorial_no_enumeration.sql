-- Auflistbarkeit öffentlicher Gedenkprofile schließen (Befund 28.08.2026, Blocker 1).
--
-- BEFUND: Die Policy "Public memorials are viewable by everyone" erlaubt SELECT auf
-- ALLE Zeilen mit is_public = true, ohne Einschränkung auf einen einzelnen Datensatz.
-- Über die öffentliche REST-Schnittstelle liess sich damit die gesamte Tabelle
-- auflisten — Klarnamen, Geburts- und Sterbedaten, Beschreibungen und Biografien
-- realer Verstorbener. Der dafür nötige anon-Key ist bestimmungsgemäss öffentlich.
-- Dasselbe galt für memorial_photos.
--
-- LÖSUNG: Statt alle Profile auf privat zu setzen (das würde Gedenkseiten und
-- gedruckte QR-Codes echter Nutzer töten) wird der Zugriff auf den EINEN legitimen
-- Vorgang eingeengt: ein Profil per Kurzname abrufen. Das erledigt eine
-- SECURITY-DEFINER-Funktion, die genau eine Zeile plus deren Fotos zurückgibt.
-- Danach werden die auflistenden Policies entfernt. Ergebnis:
--   * QR-Code am Grabstein funktioniert unverändert
--   * Durchblättern der Tabelle ist strukturell unmöglich, nicht nur unerwünscht
--   * kein Service-Role-Key im Renderpfad der öffentlichen Seite
--
-- Die Policies für Eigentümer ("Users can view own memorials" und das Pendant für
-- Fotos) bleiben unberührt — im eingeloggten Bereich ändert sich nichts.
--
-- ⚠️ REIHENFOLGE — DIESE MIGRATION HAT ZWEI SCHRITTE MIT DEM DEPLOY DAZWISCHEN.
--
-- Naiv gedacht (alles auf einmal, dann deployen) laufen die Gedenkseiten zwischen
-- Migration und Deploy auf "Nicht gefunden", weil der alte Code gegen entfernte
-- Policies liest. Umgekehrt (erst deployen) bricht es auch, weil die Funktion dann
-- noch nicht existiert. Beides ist vermeidbar:
--
--   SCHRITT 1  (unten, Abschnitt 1+2)  → Funktion anlegen. Rein additiv, ändert
--                                        am Verhalten NICHTS.
--   DANN       Zweig fix/gedenkprofile-nicht-auflistbar nach main mergen und
--              deployen. Die Seite nutzt ab jetzt die Funktion und funktioniert.
--   SCHRITT 2  (unten, Abschnitt 3)    → Policies entfernen. Das Leck ist zu, die
--                                        Seite merkt es nicht.
--
-- Ergebnis: kein einziger Moment, in dem eine Gedenkseite nicht erreichbar ist.
--
-- Idempotent, beide Schritte beliebig oft ausführbar.
-- Einspielen über den Supabase-SQL-Editor (Projekt nrxeocbokfllrufdbsdx).

-- ============================================================
-- SCHRITT 1 — JETZT einspielen (rein additiv, ändert kein Verhalten)
-- ============================================================

-- 1) Genau ein Profil per Kurzname, samt Fotos, als ein JSON-Objekt.
--    SECURITY DEFINER umgeht RLS bewusst — die WHERE-Klausel ist die Schranke.
--    search_path = '' gegen Verwechslungsangriffe; alle Objekte sind qualifiziert.
CREATE OR REPLACE FUNCTION public.get_public_memorial(p_slug text)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
  SELECT jsonb_build_object(
    'memorial', to_jsonb(m),
    'photos', COALESCE(
      (
        SELECT jsonb_agg(to_jsonb(p) ORDER BY p.order_index, p.created_at)
        FROM public.memorial_photos p
        WHERE p.memorial_id = m.id
      ),
      '[]'::jsonb
    )
  )
  FROM public.memorials m
  WHERE m.slug = p_slug
    AND m.is_public = true;
$$;

COMMENT ON FUNCTION public.get_public_memorial(text) IS
  'Öffentliche Gedenkseite: genau ein Profil per Kurzname samt Fotos. Ersetzt die '
  'auflistenden RLS-Policies auf memorials und memorial_photos (Befund 28.08.2026).';

-- 2) Nur ausführen dürfen, nicht mehr auflisten.
REVOKE ALL ON FUNCTION public.get_public_memorial(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_memorial(text) TO anon, authenticated;

-- ============================================================
-- SCHRITT 2 — ERST NACH dem Deploy einspielen
-- ============================================================

-- 3) Die auflistenden Policies entfernen. Ab hier ist die Tabelle für
--    Unangemeldete nicht mehr lesbar — nur noch über die Funktion oben.
DROP POLICY IF EXISTS "Public memorials are viewable by everyone" ON public.memorials;
DROP POLICY IF EXISTS "Public memorial photos are viewable" ON public.memorial_photos;

-- 4) Gegenprobe nach dem Einspielen (im SQL-Editor ausführen, beide müssen stimmen):
--
--    -- muss GENAU EIN Objekt liefern:
--    select public.get_public_memorial('adolf-pp01e2');
--
--    -- muss LEER sein (anon darf die Tabelle nicht mehr lesen):
--    set role anon;
--    select count(*) from public.memorials;
--    reset role;
--
-- HINWEIS: Die Fotos selbst liegen weiter in einem ÖFFENTLICHEN Storage-Bucket und
-- sind über ihre direkte Adresse abrufbar. Das ist Blocker 2 und braucht signierte
-- URLs — eigene Migration, eigener Deploy. Diese hier schliesst nur die Auflistung.
