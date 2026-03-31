"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/toast";
import { useConfirm } from "@/components/confirm-dialog";

export function DiaryEntryActions({ id, title }: { id: string; title: string | null }) {
  const router = useRouter();
  const { showToast } = useToast();
  const { confirm } = useConfirm();

  async function handleDelete() {
    const ok = await confirm({
      title: "Tagebucheintrag löschen?",
      message: `Möchtest du den Eintrag „${title ?? "Ohne Titel"}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.`,
    });
    if (!ok) return;
    const supabase = createClient();
    await supabase.from("diary_entries").delete().eq("id", id);
    showToast("Eintrag gelöscht");
    router.push("/tagebuch");
    router.refresh();
  }

  return (
    <div className="flex items-center gap-2">
      <Link
        href={`/tagebuch/${id}/bearbeiten`}
        className="text-text-secondary hover:text-gold-light transition p-1"
        title="Bearbeiten"
      >
        ✏️
      </Link>
      <button
        onClick={handleDelete}
        className="text-text-secondary hover:text-error transition p-1"
        title="Löschen"
      >
        🗑️
      </button>
    </div>
  );
}
