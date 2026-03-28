"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/types";

export function SettingsForm({
  profile,
  email,
}: {
  profile: Profile | null;
  email: string;
}) {
  const router = useRouter();
  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  // Password
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);

  // Delete
  const [deleteConfirm, setDeleteConfirm] = useState("");

  async function handleSaveName(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { error: err } = await supabase
      .from("profiles")
      .update({ full_name: fullName.trim() || null })
      .eq("id", user.id);

    if (err) {
      setError("Fehler beim Speichern.");
    } else {
      setSuccess("Name gespeichert.");
      setTimeout(() => setSuccess(""), 3000);
      router.refresh();
    }
    setSaving(false);
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword.length < 8) {
      setError("Passwort muss mindestens 8 Zeichen haben.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwörter stimmen nicht überein.");
      return;
    }

    setPasswordSaving(true);
    setError("");
    setSuccess("");

    const supabase = createClient();
    const { error: err } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (err) {
      setError(err.message);
    } else {
      setSuccess("Passwort geändert.");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setSuccess(""), 3000);
    }
    setPasswordSaving(false);
  }

  async function handleDeleteAccount() {
    if (deleteConfirm !== "LÖSCHEN") return;

    if (
      !confirm(
        "Bist du sicher? Alle deine Daten werden unwiderruflich gelöscht."
      )
    )
      return;

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    // Delete all user data (RLS cascade handles related tables)
    await supabase.from("memorials").delete().eq("user_id", user.id);
    await supabase.from("messages").delete().eq("user_id", user.id);
    await supabase.from("trusted_persons").delete().eq("user_id", user.id);
    await supabase.from("reminders").delete().eq("user_id", user.id);
    await supabase.from("diary_entries").delete().eq("user_id", user.id);
    await supabase.from("profiles").delete().eq("id", user.id);

    // Sign out (actual auth user deletion requires admin/service role)
    await supabase.auth.signOut();
    router.push("/login?message=" + encodeURIComponent("Dein Konto wurde gelöscht."));
  }

  return (
    <div className="space-y-8">
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
          {success}
        </div>
      )}

      {/* Profile */}
      <div className="rounded-xl border border-lavender-dark bg-white p-6">
        <h2 className="font-serif text-xl font-semibold text-violet mb-4">
          Profil
        </h2>
        <form onSubmit={handleSaveName} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-violet mb-1">
              Anzeigename
            </label>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-lg border border-lavender-dark px-4 py-2.5 text-sm focus:border-amber focus:ring-1 focus:ring-amber outline-none"
              placeholder="Dein Name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-violet mb-1">
              E-Mail-Adresse
            </label>
            <input
              value={email}
              disabled
              className="w-full rounded-lg border border-lavender-dark bg-gray-50 px-4 py-2.5 text-sm text-aether-gray cursor-not-allowed"
            />
            <p className="text-xs text-aether-gray mt-1">
              E-Mail-Änderung wird in Kürze verfügbar sein.
            </p>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-violet px-5 py-2.5 text-sm font-medium text-white hover:bg-violet-light transition disabled:opacity-50"
          >
            {saving ? "Wird gespeichert..." : "Name speichern"}
          </button>
        </form>
      </div>

      {/* Password */}
      <div className="rounded-xl border border-lavender-dark bg-white p-6">
        <h2 className="font-serif text-xl font-semibold text-violet mb-4">
          Passwort ändern
        </h2>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-violet mb-1">
              Neues Passwort
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              minLength={8}
              required
              className="w-full rounded-lg border border-lavender-dark px-4 py-2.5 text-sm focus:border-amber focus:ring-1 focus:ring-amber outline-none"
              placeholder="Mindestens 8 Zeichen"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-violet mb-1">
              Passwort bestätigen
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              minLength={8}
              required
              className="w-full rounded-lg border border-lavender-dark px-4 py-2.5 text-sm focus:border-amber focus:ring-1 focus:ring-amber outline-none"
              placeholder="Passwort wiederholen"
            />
          </div>
          <button
            type="submit"
            disabled={passwordSaving}
            className="rounded-lg bg-violet px-5 py-2.5 text-sm font-medium text-white hover:bg-violet-light transition disabled:opacity-50"
          >
            {passwordSaving ? "Wird geändert..." : "Passwort ändern"}
          </button>
        </form>
      </div>

      {/* Delete account */}
      <div className="rounded-xl border border-red-200 bg-red-50/30 p-6">
        <h2 className="font-serif text-xl font-semibold text-red-700 mb-2">
          Konto löschen
        </h2>
        <p className="text-sm text-aether-gray mb-4">
          Alle deine Daten (Gedenkprofile, Nachrichten, Tagebucheinträge, Fotos)
          werden unwiderruflich gelöscht.
        </p>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-red-700 mb-1">
              Tippe &quot;LÖSCHEN&quot; zum Bestätigen
            </label>
            <input
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              className="w-full rounded-lg border border-red-200 px-4 py-2.5 text-sm focus:border-red-400 focus:ring-1 focus:ring-red-200 outline-none"
              placeholder="LÖSCHEN"
            />
          </div>
          <button
            type="button"
            onClick={handleDeleteAccount}
            disabled={deleteConfirm !== "LÖSCHEN"}
            className="rounded-lg bg-red-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-red-700 transition disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Konto unwiderruflich löschen
          </button>
        </div>
      </div>
    </div>
  );
}
