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
        <div className="text-text-secondary">Wird geladen...</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 lg:px-8 py-8 lg:py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-serif font-semibold text-gold-light">
            Profil bearbeiten
          </h1>
          <p className="mt-1 text-text-secondary">{memorial?.name}</p>
        </div>
        <button
          onClick={() => router.push(`/memorial/${id}`)}
          className="text-sm text-text-secondary hover:text-gold-light transition"
        >
          Zurück
        </button>
      </div>

      {error && (
        <div className="rounded-lg bg-error/10 border border-error/30 px-4 py-3 text-sm text-error-light mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setType("human")}
            className={`p-3 rounded-xl border-2 text-center transition text-sm ${
              type === "human"
                ? "border-gold bg-gold/10"
                : "border-border-card hover:border-gold/30"
            }`}
          >
            🕊️ Mensch
          </button>
          <button
            type="button"
            onClick={() => setType("animal")}
            className={`p-3 rounded-xl border-2 text-center transition text-sm ${
              type === "animal"
                ? "border-gold bg-gold/10"
                : "border-border-card hover:border-gold/30"
            }`}
          >
            🐾 Tier
          </button>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-1.5">
            Name *
          </label>
          <input
            type="text"
            required
            maxLength={200}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg bg-surface-container-high border-none px-4 py-3 text-sm text-text-primary focus:ring-1 focus:ring-gold-light/50 transition"
          />
          {memorial && name.trim() !== memorial.name && name.trim() && (
            <p className="text-xs text-gold-light mt-1">
              SpiritLink-URL wird beim Speichern aktualisiert.
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">
              Geburtsdatum
            </label>
            <input
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              className="w-full rounded-lg bg-surface-container-high border-none px-4 py-3 text-sm text-text-primary focus:ring-1 focus:ring-gold-light/50 transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">
              Sterbedatum
            </label>
            <input
              type="date"
              value={deathDate}
              onChange={(e) => setDeathDate(e.target.value)}
              className="w-full rounded-lg bg-surface-container-high border-none px-4 py-3 text-sm text-text-primary focus:ring-1 focus:ring-gold-light/50 transition"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-1.5">
            Kurze Beschreibung
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            maxLength={500}
            className="w-full rounded-lg bg-surface-container-high border-none px-4 py-3 text-sm text-text-primary focus:ring-1 focus:ring-gold-light/50 transition resize-none"
          />
          <p className="text-xs text-text-secondary mt-1 text-right">
            {description.length}/500
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-1.5">
            Biografie
          </label>
          <textarea
            value={biography}
            onChange={(e) => setBiography(e.target.value)}
            rows={8}
            maxLength={5000}
            placeholder="Erzähle die Geschichte..."
            className="w-full rounded-lg bg-surface-container-high border-none px-4 py-3 text-sm text-text-primary placeholder:text-text-muted/50 focus:ring-1 focus:ring-gold-light/50 transition resize-y"
          />
          <p className="text-xs text-text-secondary mt-1 text-right">
            {biography.length}/5000
          </p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="is_public"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
            className="rounded border-border-card text-gold-light focus:ring-gold-light/30"
          />
          <label htmlFor="is_public" className="text-sm text-text-primary">
            Profil öffentlich machen (SpiritLink)
          </label>
        </div>

        {/* Photo section */}
        <div id="fotos">
          <label className="block text-sm font-medium text-text-primary mb-3">
            Fotos
          </label>

          {/* Existing photos gallery */}
          {photos.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-4">
              {photos.map((photo) => (
                <div key={photo.id} className="relative group aspect-square">
                  <Image
                    src={photo.url}
                    alt={photo.caption ?? ""}
                    fill
                    className="object-cover rounded-lg"
                    sizes="(max-width: 640px) 33vw, 25vw"
                  />
                  <button
                    type="button"
                    onClick={() => handleDeletePhoto(photo)}
                    className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-error text-white text-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow-md hover:bg-error/80"
                    title="Foto löschen"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Upload */}
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handlePhotoUpload}
            className="w-full text-sm text-text-secondary file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-surface-container-high file:text-gold-light hover:file:bg-surface-bright-dark file:cursor-pointer file:transition"
          />
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-border-card">
          <button
            type="button"
            onClick={handleDelete}
            className="text-sm text-error hover:text-error-light transition"
          >
            Profil löschen
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-gold px-6 py-3 text-sm font-semibold text-bg-primary hover:brightness-110 transition shadow-sm disabled:opacity-50"
          >
            {saving ? "Wird gespeichert..." : "Speichern"}
          </button>
        </div>
      </form>
    </div>
  );
}
