import type { SupabaseClient } from "@supabase/supabase-js";

// Gemeinsame Profilfoto-Logik (B0) — genutzt von der Edit-Seite und vom
// Onboarding. Pfad-Konvention: {uid}/{memorialId}/profile-{ts}.{ext}

const MAX_SIZE_BYTES = 10 * 1024 * 1024;

const EXT_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export function validateProfilePhoto(file: File): string | null {
  if (!EXT_BY_TYPE[file.type]) {
    return "Bitte wähle ein Bild (JPG, PNG, WebP oder GIF).";
  }
  if (file.size > MAX_SIZE_BYTES) {
    return "Das Bild darf maximal 10 MB groß sein.";
  }
  return null;
}

export function storagePathFromPublicUrl(url: string): string | null {
  try {
    const parts = new URL(url).pathname.split("/memorial-photos/");
    return parts[1] ? decodeURIComponent(parts[1]) : null;
  } catch {
    return null;
  }
}

export async function uploadProfilePhoto(
  supabase: SupabaseClient,
  userId: string,
  memorialId: string,
  file: File,
  oldUrl?: string | null
): Promise<{ url?: string; error?: string }> {
  const invalid = validateProfilePhoto(file);
  if (invalid) return { error: invalid };

  const path = `${userId}/${memorialId}/profile-${Date.now()}.${EXT_BY_TYPE[file.type]}`;

  const { error: uploadError } = await supabase.storage
    .from("memorial-photos")
    .upload(path, file);
  if (uploadError) {
    return { error: "Upload fehlgeschlagen. Bitte versuche es erneut." };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("memorial-photos").getPublicUrl(path);

  const { error: updateError } = await supabase
    .from("memorials")
    .update({ profile_photo_url: publicUrl })
    .eq("id", memorialId);
  if (updateError) {
    await supabase.storage.from("memorial-photos").remove([path]);
    return { error: "Speichern fehlgeschlagen. Bitte versuche es erneut." };
  }

  // Alte Datei ersetzen — Fehler hier sind unkritisch (Waise im Storage)
  if (oldUrl) {
    const oldPath = storagePathFromPublicUrl(oldUrl);
    if (oldPath && oldPath !== path) {
      await supabase.storage.from("memorial-photos").remove([oldPath]);
    }
  }

  return { url: publicUrl };
}

export async function removeProfilePhoto(
  supabase: SupabaseClient,
  memorialId: string,
  currentUrl: string
): Promise<{ error?: string }> {
  const { error } = await supabase
    .from("memorials")
    .update({ profile_photo_url: null })
    .eq("id", memorialId);
  if (error) {
    return { error: "Entfernen fehlgeschlagen. Bitte versuche es erneut." };
  }

  const path = storagePathFromPublicUrl(currentUrl);
  if (path) {
    await supabase.storage.from("memorial-photos").remove([path]);
  }

  return {};
}
