"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { generateSlug } from "@/lib/utils";
import { validateMemorial, firstError } from "@/lib/validation";
import { useToast } from "@/components/toast";
import { useConfirm } from "@/components/confirm-dialog";
import type { Memorial, MemorialPhoto } from "@/lib/types";

export default function EditMemorialPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { showToast } = useToast();
  const { confirm } = useConfirm();
  const [memorial, setMemorial] = useState<Memorial | null>(null);
  const [photos, setPhotos] = useState<MemorialPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [type, setType] = useState<"human" | "animal">("human");
  const [birthDate, setBirthDate] = useState("");
  const [deathDate, setDeathDate] = useState("");
  const [description, setDescription] = useState("");
  const [biography, setBiography] = useState("");
  const [isPublic, setIsPublic] = useState(true);

  const loadMemorial = useCallback(async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("memorials")
      .select("*")
      .eq("id", id)
      .single<Memorial>();

    if (error || !data) {
      router.push("/dashboard");
      return;
    }

    setMemorial(data);
    setName(data.name);
    setType(data.type);
    setBirthDate(data.birth_date ?? "");
    setDeathDate(data.death_date ?? "");
    setDescription(data.description ?? "");
    setBiography(data.biography ?? "");
    setIsPublic(data.is_public);

    // Load photos
    const { data: photoData } = await supabase
      .from("memorial_photos")
      .select("*")
      .eq("memorial_id", id)
      .order("order_index")
      .returns<MemorialPhoto[]>();

    setPhotos(photoData ?? []);
    setLoading(false);
  }, [id, router]);

  useEffect(() => {
    loadMemorial();
  }, [loadMemorial]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const errors = validateMemorial({
      name: name.trim(),
      description: description.trim() || null,
      biography: biography.trim() || null,
      birth_date: birthDate || null,
      death_date: deathDate || null,
    });

    if (errors.length > 0) {
      setError(firstError(errors));
      return;
    }

    setSaving(true);

    const supabase = createClient();

    const updateData: Record<string, unknown> = {
      name: name.trim(),
      type,
      birth_date: birthDate || null,
      death_date: deathDate || null,
      description: description.trim() || null,
      biography: biography.trim() || null,
      is_public: isPublic,
      updated_at: new Date().toISOString(),
    };

    if (memorial && name.trim() !== memorial.name) {
      updateData.slug = generateSlug(name.trim());
    }

    const { error: updateError } = await supabase
      .from("memorials")
      .update(updateData)
      .eq("id", id);

    if (updateError) {
      setError(updateError.message);
    } else {
      showToast("Gedenkprofil gespeichert");
    }

    setSaving(false);
  }

  async function handleDelete() {
    const ok = await confirm({
      title: "Gedenkprofil löschen?",
      message: `Möchtest du das Gedenkprofil „${memorial?.name}" wirklich löschen? Alle zugehörigen Fotos, Tagebucheinträge und Daten werden unwiderruflich entfernt.`,
    });
    if (!ok) return;

    const supabase = createClient();
    await supabase.from("memorials").delete().eq("id", id);
    showToast("Gedenkprofil gelöscht");
    router.push("/dashboard");
    router.refresh();
  }

  // Photo upload
  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    for (const file of Array.from(files)) {
      const fileExt = file.name.split(".").pop();
      const filePath = `${user.id}/${id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("memorial-photos")
        .upload(filePath, file);

      if (uploadError) {
        showToast(`Upload fehlgeschlagen: ${uploadError.message}`, "error");
        continue;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("memorial-photos").getPublicUrl(filePath);

      const { data: newPhoto } = await supabase
        .from("memorial_photos")
        .insert({
          memorial_id: id,
          url: publicUrl,
        })
        .select()
        .single<MemorialPhoto>();

      if (newPhoto) {
        setPhotos((prev) => [...prev, newPhoto]);
      }
    }

    showToast("Foto hochgeladen");
    e.target.value = "";
  }

  async function handleDeletePhoto(photo: MemorialPhoto) {
    const ok = await confirm({
      title: "Foto löschen?",
      message: "Möchtest du dieses Foto wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.",
    });
    if (!ok) return;

    const supabase = createClient();

    // Delete from storage
    const url = new URL(photo.url);
    const pathParts = url.pathname.split("/memorial-photos/");
    if (pathParts[1]) {
      await supabase.storage
        .from("memorial-photos")
        .remove([decodeURIComponent(pathParts[1])]);
    }

    // Delete from DB
    await supabase.from("memorial_photos").delete().eq("id", photo.id);
    setPhotos((prev) => prev.filter((p) => p.id !== photo.id));
    showToast("Foto gelöscht");
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-on-surface-variant font-body text-sm">Wird geladen...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Fixed top bar */}
      <div className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-surface/80 backdrop-blur-xl border-b border-outline-variant/10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push(`/memorial/${id}`)}
            className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-surface-container-high transition"
          >
            <span className="material-symbols-outlined text-on-surface">close</span>
          </button>
          <h1 className="font-body text-base font-medium text-on-surface">Profil bearbeiten</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Profile photo section */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative group cursor-pointer">
            {memorial?.profile_photo_url ? (
              <div className="relative w-[120px] h-[120px] rounded-full border-2 border-primary overflow-hidden">
                <Image
                  src={memorial.profile_photo_url}
                  alt={memorial.name}
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition">
                  <span className="material-symbols-outlined text-white text-xl">photo_camera</span>
                  <span className="text-xs text-white font-label mt-1">Foto ändern</span>
                </div>
              </div>
            ) : (
              <div className="w-[120px] h-[120px] rounded-full border-2 border-primary bg-surface-container-high flex flex-col items-center justify-center group-hover:bg-surface-container-high/80 transition">
                <span className="material-symbols-outlined text-3xl text-on-surface-variant">photo_camera</span>
                <span className="text-xs text-on-surface-variant font-label mt-1">Foto ändern</span>
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-xl bg-error/10 border border-error/20 px-4 py-3 text-sm text-error font-body mb-6">
            <span className="material-symbols-outlined text-lg">error</span>
            {error}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-5">
          {/* Type selection */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setType("human")}
              className={`flex items-center justify-center gap-2 p-3.5 rounded-xl border transition text-sm font-label ${
                type === "human"
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-outline-variant/20 text-on-surface-variant hover:border-primary/30"
              }`}
            >
              <span className="material-symbols-outlined text-lg">person</span>
              Mensch
            </button>
            <button
              type="button"
              onClick={() => setType("animal")}
              className={`flex items-center justify-center gap-2 p-3.5 rounded-xl border transition text-sm font-label ${
                type === "animal"
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-outline-variant/20 text-on-surface-variant hover:border-primary/30"
              }`}
            >
              <span className="material-symbols-outlined text-lg">pets</span>
              Tier
            </button>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-label font-medium text-on-surface-variant mb-1.5">
              Name *
            </label>
            <input
              type="text"
              required
              maxLength={200}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#1C1F33] border-none rounded-xl px-4 py-3.5 text-sm font-body text-on-surface focus:ring-2 focus:ring-primary/50 transition placeholder:text-on-surface-variant/40"
            />
            {memorial && name.trim() !== memorial.name && name.trim() && (
              <p className="text-xs text-primary font-label mt-1.5">
                SpiritLink-URL wird beim Speichern aktualisiert.
              </p>
            )}
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-label font-medium text-on-surface-variant mb-1.5">
                Geburtsdatum
              </label>
              <input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="w-full bg-[#1C1F33] border-none rounded-xl px-4 py-3.5 text-sm font-body text-on-surface focus:ring-2 focus:ring-primary/50 transition"
              />
            </div>
            <div>
              <label className="block text-sm font-label font-medium text-on-surface-variant mb-1.5">
                Sterbedatum
              </label>
              <input
                type="date"
                value={deathDate}
                onChange={(e) => setDeathDate(e.target.value)}
                className="w-full bg-[#1C1F33] border-none rounded-xl px-4 py-3.5 text-sm font-body text-on-surface focus:ring-2 focus:ring-primary/50 transition"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-label font-medium text-on-surface-variant mb-1.5">
              Kurze Beschreibung
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              maxLength={500}
              className="w-full bg-[#1C1F33] border-none rounded-xl px-4 py-3.5 text-sm font-body text-on-surface focus:ring-2 focus:ring-primary/50 transition resize-none placeholder:text-on-surface-variant/40"
            />
            <p className="text-xs font-label text-on-surface-variant mt-1 text-right">
              {description.length}/500
            </p>
          </div>

          {/* Biography */}
          <div>
            <label className="block text-sm font-label font-medium text-on-surface-variant mb-1.5">
              Biografie
            </label>
            <textarea
              value={biography}
              onChange={(e) => setBiography(e.target.value)}
              rows={8}
              maxLength={5000}
              placeholder="Erzähle die Geschichte..."
              className="w-full bg-[#1C1F33] border-none rounded-xl px-4 py-3.5 text-sm font-body text-on-surface focus:ring-2 focus:ring-primary/50 transition resize-y placeholder:text-on-surface-variant/40"
            />
            <p className="text-xs font-label text-on-surface-variant mt-1 text-right">
              {biography.length}/5000
            </p>
          </div>

          {/* Public toggle */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="is_public"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="rounded border-outline-variant text-primary focus:ring-primary/30"
            />
            <label htmlFor="is_public" className="text-sm font-body text-on-surface">
              Profil öffentlich machen (SpiritLink)
            </label>
          </div>

          {/* Photo section */}
          <div id="fotos" className="pt-2">
            <label className="block text-sm font-label font-medium text-on-surface-variant mb-3">
              Fotos
            </label>

            {/* Existing photos gallery */}
            {photos.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-4">
                {photos.map((photo) => (
                  <div key={photo.id} className="relative group aspect-square rounded-xl overflow-hidden">
                    <Image
                      src={photo.url}
                      alt={photo.caption ?? ""}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 33vw, 25vw"
                    />
                    <button
                      type="button"
                      onClick={() => handleDeletePhoto(photo)}
                      className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 backdrop-blur-sm text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow-md hover:bg-error/80"
                      title="Foto löschen"
                    >
                      <span className="material-symbols-outlined text-lg">delete</span>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Upload */}
            <label className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-outline-variant/30 p-6 cursor-pointer hover:bg-surface-container-high/30 transition">
              <span className="material-symbols-outlined text-2xl text-on-surface-variant">add_photo_alternate</span>
              <span className="text-sm font-label text-on-surface-variant">Fotos hochladen</span>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </label>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="gold-gradient w-full rounded-xl px-6 py-3.5 text-sm font-label font-semibold text-on-primary transition shadow-sm disabled:opacity-50"
            >
              {saving ? "Wird gespeichert..." : "Speichern"}
            </button>

            <button
              type="button"
              onClick={() => router.push(`/memorial/${id}`)}
              className="w-full rounded-xl px-6 py-3 text-sm font-label font-medium text-on-surface-variant hover:text-on-surface transition"
            >
              Abbrechen
            </button>
          </div>

          {/* Danger zone */}
          <div className="pt-4 border-t border-outline-variant/10">
            <button
              type="button"
              onClick={handleDelete}
              className="flex items-center gap-2 text-sm font-label text-error hover:text-error/80 transition"
            >
              <span className="material-symbols-outlined text-lg">delete_forever</span>
              Profil löschen
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
