"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/toast";
import { useConfirm } from "@/components/confirm-dialog";
import { uploadProfilePhoto, removeProfilePhoto } from "@/lib/profile-photo";

export function ProfilePhotoUpload({
  memorialId,
  memorialName,
  initialUrl,
}: {
  memorialId: string;
  memorialName: string;
  initialUrl: string | null;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const { confirm } = useConfirm();
  const inputRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState<string | null>(initialUrl);
  const [busy, setBusy] = useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setBusy(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setBusy(false);
      return;
    }

    const result = await uploadProfilePhoto(supabase, user.id, memorialId, file, url);
    if (result.error) {
      showToast(result.error, "error");
    } else {
      setUrl(result.url ?? null);
      showToast("Profilfoto gespeichert");
      router.refresh();
    }
    setBusy(false);
  }

  async function handleRemove() {
    if (!url) return;
    const ok = await confirm({
      title: "Profilfoto entfernen?",
      message: `Möchtest du das Profilfoto von „${memorialName}" wirklich entfernen?`,
      confirmLabel: "Entfernen",
    });
    if (!ok) return;

    setBusy(true);
    const supabase = createClient();
    const result = await removeProfilePhoto(supabase, memorialId, url);
    if (result.error) {
      showToast(result.error, "error");
    } else {
      setUrl(null);
      showToast("Profilfoto entfernt");
      router.refresh();
    }
    setBusy(false);
  }

  return (
    <div className="flex flex-col items-center">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        aria-label={url ? "Profilfoto ändern" : "Profilfoto hochladen"}
        className="relative group rounded-full disabled:opacity-60"
      >
        {url ? (
          <div className="relative w-[120px] h-[120px] rounded-full border-2 border-primary overflow-hidden">
            <Image src={url} alt={memorialName} fill className="object-cover" />
            <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity duration-250 ease-out">
              <span className="material-symbols-outlined text-white text-xl" aria-hidden="true">photo_camera</span>
              <span className="text-xs text-white font-label mt-1">Foto ändern</span>
            </div>
          </div>
        ) : (
          <div className="w-[120px] h-[120px] rounded-full border-2 border-dashed border-primary/40 bg-surface-container-high flex flex-col items-center justify-center group-hover:border-primary transition-colors duration-250 ease-out">
            <span className="material-symbols-outlined text-3xl text-on-surface-variant" aria-hidden="true">photo_camera</span>
            <span className="text-xs text-on-surface-variant font-label mt-1">
              {busy ? "Lädt..." : "Foto wählen"}
            </span>
          </div>
        )}
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFile}
        className="hidden"
        aria-hidden="true"
        tabIndex={-1}
      />

      {url ? (
        <button
          type="button"
          onClick={handleRemove}
          disabled={busy}
          className="mt-3 inline-flex items-center gap-1 text-xs font-label text-on-surface-variant hover:text-error transition-colors duration-250 ease-out disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-sm" aria-hidden="true">delete</span>
          Foto entfernen
        </button>
      ) : (
        <p className="mt-3 text-[10px] font-label uppercase tracking-[0.2em] text-on-surface-variant/70">
          JPG, PNG oder WebP · max. 10 MB
        </p>
      )}
    </div>
  );
}
