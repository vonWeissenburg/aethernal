"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Memorial } from "@/lib/types";

export default function EditMemorialPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [memorial, setMemorial] = useState<Memorial | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

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
    setLoading(false);
  }, [id, router]);

  useEffect(() => {
    loadMemorial();
  }, [loadMemorial]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Name ist erforderlich.");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(false);

    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("memorials")
      .update({
        name: name.trim(),
        type,
        birth_date: birthDate || null,
        death_date: deathDate || null,
        description: description.trim() || null,
        biography: biography.trim() || null,
        is_public: isPublic,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (updateError) {
      setError(updateError.message);
    } else {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }

    setSaving(false);
  }

  async function handleDelete() {
    if (!confirm("Möchtest du dieses Gedenkprofil wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.")) {
      return;
    }

    const supabase = createClient();
    await supabase.from("memorials").delete().eq("id", id);
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
        setError(`Upload fehlgeschlagen: ${uploadError.message}`);
        continue;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("memorial-photos").getPublicUrl(filePath);

      await supabase.from("memorial_photos").insert({
        memorial_id: id,
        url: publicUrl,
      });
    }

    // Reset input
    e.target.value = "";
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-aether-gray">Wird geladen...</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 lg:px-8 py-8 lg:py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-serif font-semibold text-violet">
            Profil bearbeiten
          </h1>
          <p className="mt-1 text-aether-gray">{memorial?.name}</p>
        </div>
        <button
          onClick={() => router.push(`/memorial/${id}`)}
          className="text-sm text-aether-gray hover:text-violet transition"
        >
          Zurück
        </button>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 mb-6">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700 mb-6">
          Erfolgreich gespeichert!
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setType("human")}
            className={`p-3 rounded-xl border-2 text-center transition text-sm ${
              type === "human"
                ? "border-violet bg-lavender/50"
                : "border-lavender-dark hover:border-violet/30"
            }`}
          >
            🕊️ Mensch
          </button>
          <button
            type="button"
            onClick={() => setType("animal")}
            className={`p-3 rounded-xl border-2 text-center transition text-sm ${
              type === "animal"
                ? "border-violet bg-lavender/50"
                : "border-lavender-dark hover:border-violet/30"
            }`}
          >
            🐾 Tier
          </button>
        </div>

        <div>
          <label className="block text-sm font-medium text-aether-text mb-1.5">
            Name
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-lavender-dark bg-white px-4 py-2.5 text-sm text-aether-text focus:border-violet focus:ring-2 focus:ring-violet/20 outline-none transition"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-aether-text mb-1.5">
              Geburtsdatum
            </label>
            <input
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              className="w-full rounded-lg border border-lavender-dark bg-white px-4 py-2.5 text-sm text-aether-text focus:border-violet focus:ring-2 focus:ring-violet/20 outline-none transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-aether-text mb-1.5">
              Sterbedatum
            </label>
            <input
              type="date"
              value={deathDate}
              onChange={(e) => setDeathDate(e.target.value)}
              className="w-full rounded-lg border border-lavender-dark bg-white px-4 py-2.5 text-sm text-aether-text focus:border-violet focus:ring-2 focus:ring-violet/20 outline-none transition"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-aether-text mb-1.5">
            Kurze Beschreibung
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full rounded-lg border border-lavender-dark bg-white px-4 py-2.5 text-sm text-aether-text focus:border-violet focus:ring-2 focus:ring-violet/20 outline-none transition resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-aether-text mb-1.5">
            Biografie
          </label>
          <textarea
            value={biography}
            onChange={(e) => setBiography(e.target.value)}
            rows={8}
            placeholder="Erzähle die Geschichte..."
            className="w-full rounded-lg border border-lavender-dark bg-white px-4 py-2.5 text-sm text-aether-text placeholder:text-aether-gray/50 focus:border-violet focus:ring-2 focus:ring-violet/20 outline-none transition resize-y"
          />
        </div>

        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="is_public"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
            className="rounded border-lavender-dark text-violet focus:ring-violet/20"
          />
          <label htmlFor="is_public" className="text-sm text-aether-text">
            Profil öffentlich machen (SpiritLink)
          </label>
        </div>

        {/* Photo upload */}
        <div>
          <label className="block text-sm font-medium text-aether-text mb-1.5">
            Fotos hochladen
          </label>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handlePhotoUpload}
            className="w-full text-sm text-aether-gray file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-lavender file:text-violet hover:file:bg-lavender-dark file:cursor-pointer file:transition"
          />
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-lavender-dark">
          <button
            type="button"
            onClick={handleDelete}
            className="text-sm text-red-500 hover:text-red-700 transition"
          >
            Profil löschen
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-violet px-6 py-2.5 text-sm font-medium text-white hover:bg-violet-light transition shadow-sm disabled:opacity-50"
          >
            {saving ? "Wird gespeichert..." : "Speichern"}
          </button>
        </div>
      </form>
    </div>
  );
}
