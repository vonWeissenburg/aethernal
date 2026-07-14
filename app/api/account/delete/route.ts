import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

// Vollständige Konto-Löschung (B4, DSGVO):
// 1) Storage-Fotos unter {uid}/ entfernen
// 2) Auth-User über die Admin-API löschen — FK-Cascades räumen alle DB-Zeilen
// Der Service-Role-Key existiert NUR hier serverseitig, nie im Client-Bundle.
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return NextResponse.json(
      {
        error:
          "Die Konto-Löschung ist serverseitig noch nicht konfiguriert. Bitte wende dich an hallo@aethernal.me.",
      },
      { status: 503 }
    );
  }

  const admin = createAdminClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Storage-Objekte einsammeln ({uid}/{memorialId}/{datei}) und löschen.
  // Ein Fehler hier darf die Kontolöschung nicht verhindern.
  try {
    const paths: string[] = [];
    const { data: topLevel } = await admin.storage
      .from("memorial-photos")
      .list(user.id, { limit: 1000 });

    for (const entry of topLevel ?? []) {
      if (entry.id) {
        paths.push(`${user.id}/${entry.name}`);
      } else {
        // Ordner (memorialId) — Dateien darunter einsammeln
        const { data: files } = await admin.storage
          .from("memorial-photos")
          .list(`${user.id}/${entry.name}`, { limit: 1000 });
        for (const file of files ?? []) {
          paths.push(`${user.id}/${entry.name}/${file.name}`);
        }
      }
    }

    if (paths.length > 0) {
      await admin.storage.from("memorial-photos").remove(paths);
    }
  } catch (e) {
    console.error("Konto-Löschung: Storage-Aufräumen fehlgeschlagen", e);
  }

  // Auth-User löschen — profiles/memorials/messages/… fallen per ON DELETE CASCADE
  const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);
  if (deleteError) {
    console.error("Konto-Löschung: Auth-Delete fehlgeschlagen", deleteError);
    return NextResponse.json(
      { error: "Löschen fehlgeschlagen. Bitte versuche es später erneut." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
