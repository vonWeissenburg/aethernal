import type { SupabaseClient } from "@supabase/supabase-js";
import { PHOTO_BUCKET, signPhotoPath } from "@/lib/photo-urls";

// Gemeinsame Profilfoto-Logik (B0) — genutzt von der Edit-Seite und vom
// Onboarding. Pfad-Konvention: {uid}/{memorialId}/profile-{ts}.{ext}
//
// Seit 23.09.2026 wird nur der PFAD gespeichert (memorials.profile_photo_path), nie eine
// Adresse — der Bucket ist privat, Adressen werden beim Anzeigen signiert (lib/photo-urls.ts).

const MAX_SIZE_BYTES = 10 * 1024 * 1024;

// Muss zur Bucket-Regel passen (allowed_mime_types, gesetzt 11.09.2026). GIF ist dort nicht
// erlaubt — stand hier aber noch drin, der Upload scheiterte dann erst am Server.
const EXT_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

/** Für das accept-Attribut der Datei-Eingabe — eine Quelle für beide Upload-Stellen. */
export const PROFILE_PHOTO_ACCEPT = Object.keys(EXT_BY_TYPE).join(",");

export function validateProfilePhoto(file: File): string | null {
  if (!EXT_BY_TYPE[file.type]) {
    return "Bitte wähle ein Bild (JPG, PNG oder WebP).";
  }
  if (file.size > MAX_SIZE_BYTES) {
    return "Das Bild darf maximal 10 MB groß sein.";
  }
  return null;
}

export async function uploadProfilePhoto(
  supabase: SupabaseClient,
  userId: string,
  memorialId: string,
  file: File,
  oldPath?: string | null
): Promise<{ path?: string; signedUrl?: string | null; error?: string }> {
  const invalid = validateProfilePhoto(file);
  if (invalid) return { error: invalid };

  const path = `${userId}/${memorialId}/profile-${Date.now()}.${EXT_BY_TYPE[file.type]}`;

  const { error: uploadError } = await supabase.storage.from(PHOTO_BUCKET).upload(path, file);
  if (uploadError) {
    return { error: "Upload fehlgeschlagen. Bitte versuche es erneut." };
  }

  const { error: updateError } = await supabase
    .from("memorials")
    .update({ profile_photo_path: path })
    .eq("id", memorialId);
  if (updateError) {
    await supabase.storage.from(PHOTO_BUCKET).remove([path]);
    return { error: "Speichern fehlgeschlagen. Bitte versuche es erneut." };
  }

  // Alte Datei ersetzen — Fehler hier sind unkritisch (Waise im Storage)
  if (oldPath && oldPath !== path) {
    await supabase.storage.from(PHOTO_BUCKET).remove([oldPath]);
  }

  // Signieren für die sofortige Anzeige; scheitert es, zeigt die Oberfläche den
  // Platzhalter und beim nächsten Laden stimmt alles wieder.
  const signedUrl = await signPhotoPath(supabase, path);
  return { path, signedUrl };
}

export async function removeProfilePhoto(
  supabase: SupabaseClient,
  memorialId: string,
  currentPath: string
): Promise<{ error?: string }> {
  const { error } = await supabase
    .from("memorials")
    .update({ profile_photo_path: null })
    .eq("id", memorialId);
  if (error) {
    return { error: "Entfernen fehlgeschlagen. Bitte versuche es erneut." };
  }

  await supabase.storage.from(PHOTO_BUCKET).remove([currentPath]);
  return {};
}
