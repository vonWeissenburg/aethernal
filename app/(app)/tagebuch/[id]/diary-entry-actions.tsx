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
    <div className="flex items-center gap-1">
      <Link
        href={`/tagebuch/${id}/bearbeiten`}
        className="inline-flex items-center justify-center h-10 w-10 rounded-full text-on-surface-variant hover:text-primary hover:bg-primary/10 transition"
        title="Bearbeiten"
      >
        <span className="material-symbols-outlined text-[20px]">edit</span>
      </Link>
      <button
        onClick={handleDelete}
        className="inline-flex items-center justify-center h-10 w-10 rounded-full text-on-surface-variant hover:text-error hover:bg-error/10 transition"
        title="Löschen"
      >
        <span className="material-symbols-outlined text-[20px]">delete</span>
      </button>
    </div>
  );
}
