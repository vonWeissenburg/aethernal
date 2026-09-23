import type { SupabaseClient } from "@supabase/supabase-js";

// Fotos liegen in einem PRIVATEN Bucket (Etappe B, Blocker 2 — Entscheidung C, 23.09.2026,
// Migration 20260923_fotospeicher_privat). Die Datenbank speichert nur den Speicherpfad
// {uid}/{memorialId}/{datei}; jede Anzeige signiert ihn kurz vor dem Rendern.
//
// Wer signieren darf, entscheidet allein die RLS auf storage.objects: Eigentümer ihren
// eigenen Ordner, alle (auch anon) die Dateien öffentlicher Gedenkprofile. Deshalb reicht
// hier der Schlüssel des jeweiligen Aufrufers — kein Service-Role-Key, auch nicht auf der
// öffentlichen Gedenkseite (Entscheidung 02.09.2026).

export const PHOTO_BUCKET = "memorial-photos";

/** Gültigkeit einer signierten Adresse in Sekunden. Eine Stunde reicht für jede Seitenansicht. */
export const SIGNED_URL_TTL = 60 * 60;

/**
 * Signiert mehrere Pfade in einem Aufruf. Liefert eine Map Pfad → signierte Adresse.
 * Pfade, die nicht signiert werden dürfen (RLS) oder fehlen, tauchen in der Map nicht auf —
 * die Aufrufer zeigen dann den Platzhalter statt eines kaputten Bildes.
 */
export async function signPhotoPaths(
  supabase: SupabaseClient,
  paths: ReadonlyArray<string | null | undefined>
): Promise<Map<string, string>> {
  const unique = Array.from(new Set(paths.filter((p): p is string => !!p)));
  const result = new Map<string, string>();
  if (unique.length === 0) return result;

  const { data, error } = await supabase.storage
    .from(PHOTO_BUCKET)
    .createSignedUrls(unique, SIGNED_URL_TTL);

  if (error || !data) {
    // Sichtbar machen, nicht schlucken — häufigster Fall: Migration noch nicht eingespielt.
    console.error("Signieren der Fotoadressen fehlgeschlagen:", error?.message);
    return result;
  }

  for (const entry of data) {
    if (entry.path && entry.signedUrl && !entry.error) {
      result.set(entry.path, entry.signedUrl);
    }
  }
  return result;
}

/** Bequemlichkeit für genau einen Pfad. */
export async function signPhotoPath(
  supabase: SupabaseClient,
  path: string | null | undefined
): Promise<string | null> {
  if (!path) return null;
  const signed = await signPhotoPaths(supabase, [path]);
  return signed.get(path) ?? null;
}
