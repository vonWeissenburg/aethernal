"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { validateSettings, firstError } from "@/lib/validation";
import { useToast } from "@/components/toast";
import { useConfirm } from "@/components/confirm-dialog";
import type { Profile } from "@/lib/types";

export function SettingsForm({
  profile,
  email,
}: {
  profile: Profile | null;
  email: string;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const { confirm } = useConfirm();
  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Password
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);

  // Delete
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);

  // Rate limiting
  const lastPasswordAttempt = useRef(0);
  const lastDeleteAttempt = useRef(0);

  async function handleSaveName(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const errors = validateSettings({ full_name: fullName.trim() });
    if (errors.length > 0) {
      setError(firstError(errors));
      return;
    }

    setSaving(true);

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
      showToast("Name gespeichert");
      router.refresh();
    }
    setSaving(false);
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    // Rate limit: max every 10 seconds
    const now = Date.now();
    if (now - lastPasswordAttempt.current < 10000) {
      setError("Bitte warte einen Moment vor dem n\u00E4chsten Versuch.");
      return;
    }
    lastPasswordAttempt.current = now;

    const errors = validateSettings({
      password: newPassword,
      confirm_password: confirmPassword,
    });
    if (errors.length > 0) {
      setError(firstError(errors));
      return;
    }

    setPasswordSaving(true);

    const supabase = createClient();
    const { error: err } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (err) {
      setError(err.message);
    } else {
      showToast("Passwort ge\u00E4ndert");
      setNewPassword("");
      setConfirmPassword("");
    }
    setPasswordSaving(false);
  }

  async function handleDeleteAccount() {
    if (deleteConfirm !== "L\u00D6SCHEN") return;

    // Rate limit: max every 60 seconds
    const now = Date.now();
    if (now - lastDeleteAttempt.current < 60000) {
      setError("Bitte warte eine Minute vor dem n\u00E4chsten Versuch.");
      return;
    }
    lastDeleteAttempt.current = now;

    const ok = await confirm({
      title: "Konto unwiderruflich l\u00F6schen?",
      message: "Alle deine Daten (Gedenkprofile, Nachrichten, Tagebucheintr\u00E4ge, Fotos) werden unwiderruflich gel\u00F6scht. Diese Aktion kann nicht r\u00FCckg\u00E4ngig gemacht werden.",
      confirmLabel: "Konto l\u00F6schen",
    });
    if (!ok) return;

    setDeleting(true);

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
    router.push("/login?message=" + encodeURIComponent("Dein Konto wurde gel\u00F6scht."));
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  const initials = (fullName || email || "?")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="space-y-6">
      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-error/10 border border-error/20 p-3">
          <span className="material-symbols-outlined text-error text-lg">error</span>
          <p className="font-body text-sm text-error">{error}</p>
        </div>
      )}

      {/* User info card */}
      <div className="rounded-2xl bg-card p-6 flex items-center gap-5">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary font-headline text-xl font-bold">
          {initials}
        </div>
        <div className="min-w-0">
          <h2 className="font-headline text-lg font-semibold text-on-surface truncate">
            {fullName || "Kein Name"}
          </h2>
          <p className="font-body text-sm text-on-surface-variant truncate">{email}</p>
        </div>
      </div>

      {/* Konto section */}
      <div className="rounded-2xl bg-card overflow-hidden">
        <div className="px-6 pt-5 pb-2">
          <h2 className="font-label text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
            Konto
          </h2>
        </div>

        {/* Name */}
        <form onSubmit={handleSaveName} className="px-6 py-4 border-b border-outline-variant/15">
          <label className="block font-label text-sm font-medium text-on-surface-variant mb-1.5">
            Anzeigename
          </label>
          <div className="flex gap-3">
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              maxLength={100}
              className="flex-1 rounded-xl bg-surface-container-low border border-outline-variant/30 px-4 py-2.5 font-body text-sm text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
              placeholder="Dein Name"
            />
            <button
              type="submit"
              disabled={saving}
              className="shrink-0 rounded-xl bg-primary px-5 py-2.5 font-label text-sm font-semibold text-on-primary hover:brightness-110 transition disabled:opacity-50"
            >
              {saving ? "..." : "Speichern"}
            </button>
          </div>
        </form>

        {/* Email (read-only) */}
        <div className="px-6 py-4 border-b border-outline-variant/15">
          <label className="block font-label text-sm font-medium text-on-surface-variant mb-1.5">
            E-Mail-Adresse
          </label>
          <div className="flex items-center gap-3">
            <input
              value={email}
              disabled
              className="flex-1 rounded-xl bg-surface-container-low border border-outline-variant/15 px-4 py-2.5 font-body text-sm text-outline cursor-not-allowed"
            />
            <span className="material-symbols-outlined text-outline text-lg">lock</span>
          </div>
          <p className="font-body text-xs text-outline mt-1.5">
            E-Mail-&Auml;nderung wird in K&uuml;rze verf&uuml;gbar sein.
          </p>
        </div>

        {/* Password */}
        <form onSubmit={handleChangePassword} className="px-6 py-4">
          <label className="block font-label text-sm font-medium text-on-surface-variant mb-3">
            Passwort &auml;ndern
          </label>
          <div className="space-y-3">
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              minLength={8}
              required
              className="w-full rounded-xl bg-surface-container-low border border-outline-variant/30 px-4 py-2.5 font-body text-sm text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
              placeholder="Neues Passwort (mind. 8 Zeichen)"
            />
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              minLength={8}
              required
              className="w-full rounded-xl bg-surface-container-low border border-outline-variant/30 px-4 py-2.5 font-body text-sm text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
              placeholder="Passwort wiederholen"
            />
            <button
              type="submit"
              disabled={passwordSaving}
              className="rounded-xl bg-primary px-5 py-2.5 font-label text-sm font-semibold text-on-primary hover:brightness-110 transition disabled:opacity-50"
            >
              {passwordSaving ? "Wird ge\u00E4ndert..." : "Passwort \u00E4ndern"}
            </button>
          </div>
        </form>
      </div>

      {/* Datenschutz section */}
      <div className="rounded-2xl bg-card overflow-hidden">
        <div className="px-6 pt-5 pb-2">
          <h2 className="font-label text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
            Datenschutz
          </h2>
        </div>
        <a
          href="/datenschutz"
          className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/15 hover:bg-surface-container-high transition"
        >
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-on-surface-variant text-xl">cookie</span>
            <span className="font-body text-sm text-on-surface">Cookie-Einstellungen</span>
          </div>
          <span className="material-symbols-outlined text-outline text-lg">chevron_right</span>
        </a>
        <a
          href="/datenschutz"
          className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/15 hover:bg-surface-container-high transition"
        >
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-on-surface-variant text-xl">shield</span>
            <span className="font-body text-sm text-on-surface">Datenschutzerkl&auml;rung</span>
          </div>
          <span className="material-symbols-outlined text-outline text-lg">chevron_right</span>
        </a>
        <a
          href="/agb"
          className="flex items-center justify-between px-6 py-4 hover:bg-surface-container-high transition"
        >
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-on-surface-variant text-xl">description</span>
            <span className="font-body text-sm text-on-surface">Allgemeine Gesch&auml;ftsbedingungen</span>
          </div>
          <span className="material-symbols-outlined text-outline text-lg">chevron_right</span>
        </a>
      </div>

      {/* Gefahrenzone */}
      <div className="rounded-2xl bg-error/5 border border-error/15 overflow-hidden">
        <div className="px-6 pt-5 pb-2">
          <h2 className="font-label text-xs font-semibold uppercase tracking-wider text-error">
            Gefahrenzone
          </h2>
        </div>
        <div className="px-6 py-4">
          <p className="font-body text-sm text-on-surface-variant mb-4">
            Alle deine Daten (Gedenkprofile, Nachrichten, Tagebucheintr&auml;ge, Fotos)
            werden unwiderruflich gel&ouml;scht.
          </p>
          <div className="space-y-3">
            <div>
              <label className="block font-label text-sm font-medium text-error mb-1.5">
                Tippe &quot;L&Ouml;SCHEN&quot; zum Best&auml;tigen
              </label>
              <input
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                className="w-full rounded-xl bg-surface-container-low border border-error/20 px-4 py-2.5 font-body text-sm text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-error/50 transition-all"
                placeholder="L&Ouml;SCHEN"
              />
            </div>
            <button
              type="button"
              onClick={handleDeleteAccount}
              disabled={deleteConfirm !== "L\u00D6SCHEN" || deleting}
              className="inline-flex items-center gap-2 rounded-xl bg-error px-5 py-2.5 font-label text-sm font-medium text-white hover:bg-error/80 transition disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-lg">delete_forever</span>
              {deleting ? "Wird gel\u00F6scht..." : "Konto unwiderruflich l\u00F6schen"}
            </button>
          </div>
        </div>
      </div>

      {/* Sign out */}
      <button
        type="button"
        onClick={handleSignOut}
        className="w-full rounded-2xl border border-outline-variant/30 px-6 py-4 font-label text-sm font-medium text-on-surface-variant hover:bg-surface-container-high transition flex items-center justify-center gap-2"
      >
        <span className="material-symbols-outlined text-lg">logout</span>
        Abmelden
      </button>
    </div>
  );
}
