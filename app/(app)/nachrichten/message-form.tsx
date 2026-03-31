"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { validateMessage, firstError } from "@/lib/validation";
import { useToast } from "@/components/toast";
import type { Message, TriggerType, TrustedPerson } from "@/lib/types";

interface MessageFormProps {
  memorials: { id: string; name: string }[];
  hasTrustedPerson: boolean;
  trustedPersons?: Pick<TrustedPerson, "id" | "name" | "email">[];
  existingMessage?: Message;
}

const MAX_BODY = 5000;

export function MessageForm({
  memorials,
  hasTrustedPerson,
  trustedPersons = [],
  existingMessage,
}: MessageFormProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [triggerType, setTriggerType] = useState<TriggerType>(
    existingMessage?.trigger_type ?? "date"
  );
  const [recipientName, setRecipientName] = useState(
    existingMessage?.recipient_name ?? ""
  );
  const [recipientEmail, setRecipientEmail] = useState(
    existingMessage?.recipient_email ?? ""
  );
  const [body, setBody] = useState(existingMessage?.body ?? "");
  const [title, setTitle] = useState(existingMessage?.title ?? "");

  const today = new Date().toISOString().split("T")[0];

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>, asDraft: boolean) {
    e.preventDefault();
    setError("");

    const form = new FormData(e.currentTarget);
    const triggerDate = triggerType === "date" ? (form.get("trigger_date") as string) || null : null;

    const errors = validateMessage({
      title: title.trim(),
      body: body.trim(),
      recipient_name: recipientName.trim(),
      recipient_email: recipientEmail.trim(),
      trigger_type: triggerType,
      trigger_date: triggerDate,
    });

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

    const messageData = {
      user_id: user.id,
      title: title.trim(),
      body: body.trim(),
      recipient_name: recipientName.trim(),
      recipient_email: recipientEmail.trim(),
      memorial_id: (form.get("memorial_id") as string) || null,
      trigger_type: triggerType,
      trigger_date: triggerDate,
      repeat_yearly: triggerType === "date" ? form.get("repeat_yearly") === "on" : false,
      status: asDraft ? "draft" : "scheduled",
    };

    let err;
    if (existingMessage) {
      ({ error: err } = await supabase
        .from("messages")
        .update(messageData)
        .eq("id", existingMessage.id));
    } else {
      ({ error: err } = await supabase.from("messages").insert(messageData));
    }

    if (err) {
      setError("Fehler beim Speichern. Bitte versuche es erneut.");
      setSaving(false);
      return;
    }

    showToast(asDraft ? "Entwurf gespeichert" : "Nachricht geplant");
    router.push("/nachrichten");
    router.refresh();
  }

  return (
    <form
      onSubmit={(e) => {
        const submitter = (e.nativeEvent as SubmitEvent).submitter;
        const asDraft = submitter?.getAttribute("data-draft") === "true";
        handleSubmit(e, asDraft);
      }}
    >
      {error && (
        <p className="text-sm text-error-light mb-6 p-3 bg-error/10 border border-error/30 rounded-lg">{error}</p>
      )}

      {/* Sektion 1: Empfänger */}
      <div className="rounded-xl bg-surface-container-high border-none p-6 mb-6">
        <h2 className="font-serif text-xl font-semibold text-gold-light mb-4">
          Empfänger
        </h2>

        {trustedPersons.length > 0 && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gold-light mb-1">
              Aus Vertrauenspersonen wählen
            </label>
            <select
              onChange={(e) => {
                const tp = trustedPersons.find((t) => t.id === e.target.value);
                if (tp) {
                  setRecipientName(tp.name);
                  setRecipientEmail(tp.email);
                }
              }}
              className="w-full rounded-lg bg-surface-container border-none px-4 py-3 text-sm text-text-primary focus:ring-1 focus:ring-gold-light/50 transition-all"
              defaultValue=""
            >
              <option value="">Manuell eingeben...</option>
              {trustedPersons.map((tp) => (
                <option key={tp.id} value={tp.id}>
                  {tp.name} ({tp.email})
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gold-light mb-1">
              Name des Empfängers *
            </label>
            <input
              name="recipient_name"
              required
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              className="w-full rounded-lg bg-surface-container border-none px-4 py-3 text-sm text-text-primary focus:ring-1 focus:ring-gold-light/50 transition-all"
              placeholder="z.B. Maria"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gold-light mb-1">
              E-Mail-Adresse *
            </label>
            <input
              name="recipient_email"
              type="email"
              required
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              className="w-full rounded-lg bg-surface-container border-none px-4 py-3 text-sm text-text-primary focus:ring-1 focus:ring-gold-light/50 transition-all"
              placeholder="maria@beispiel.at"
            />
          </div>
        </div>
        {memorials.length > 0 && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-gold-light mb-1">
              Gedenkprofil zuordnen (optional)
            </label>
            <select
              name="memorial_id"
              defaultValue={existingMessage?.memorial_id ?? ""}
              className="w-full rounded-lg bg-surface-container border-none px-4 py-3 text-sm text-text-primary focus:ring-1 focus:ring-gold-light/50 transition-all"
            >
              <option value="">Kein Profil</option>
              {memorials.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Sektion 2: Inhalt */}
      <div className="rounded-xl bg-surface-container-high border-none p-6 mb-6">
        <h2 className="font-serif text-xl font-semibold text-gold-light mb-4">
          Inhalt
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gold-light mb-1">
              Betreff *
            </label>
            <input
              name="title"
              required
              maxLength={100}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg bg-surface-container border-none px-4 py-3 text-sm text-text-primary focus:ring-1 focus:ring-gold-light/50 transition-all"
              placeholder="z.B. Zum Geburtstag, mein Schatz"
            />
            <p className="text-xs text-text-secondary mt-1 text-right">
              {title.length}/100
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gold-light mb-1">
              Nachricht *
            </label>
            <textarea
              name="body"
              required
              minLength={10}
              maxLength={MAX_BODY}
              rows={8}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full rounded-lg bg-surface-container border-none px-4 py-3 text-sm text-text-primary focus:ring-1 focus:ring-gold-light/50 transition-all resize-y"
              placeholder={
                recipientName
                  ? `Schreibe hier deine Nachricht an ${recipientName}...`
                  : "Schreibe hier deine Nachricht..."
              }
            />
            <p className="text-xs text-text-secondary mt-1 text-right">
              {body.length}/{MAX_BODY}
            </p>
          </div>
        </div>
      </div>

      {/* Sektion 3: Wann senden? */}
      <div className="rounded-xl bg-surface-container-high border-none p-6 mb-6">
        <h2 className="font-serif text-xl font-semibold text-gold-light mb-4">
          Wann senden?
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setTriggerType("date")}
            className={`rounded-xl border-2 p-5 text-left transition ${
              triggerType === "date"
                ? "border-gold bg-gold/5"
                : "border-border-card bg-bg-card hover:border-gold/30"
            }`}
          >
            <div className="text-2xl mb-2">📅</div>
            <h3 className="font-medium text-gold-light">Zu einem bestimmten Datum</h3>
            <p className="text-xs text-text-secondary mt-1">
              Geburtstag, Jahrestag, Weihnachten...
            </p>
          </button>
          <button
            type="button"
            onClick={() => setTriggerType("death")}
            className={`rounded-xl border-2 p-5 text-left transition ${
              triggerType === "death"
                ? "border-gold bg-gold/5"
                : "border-border-card bg-bg-card hover:border-gold/30"
            }`}
          >
            <div className="text-2xl mb-2">🕊️</div>
            <h3 className="font-medium text-gold-light">Nach meinem Tod</h3>
            <p className="text-xs text-text-secondary mt-1">
              Wird nach Bestätigung durch Vertrauensperson gesendet.
            </p>
          </button>
        </div>

        {triggerType === "date" && (
          <div className="mt-4 space-y-3">
            <div>
              <label className="block text-sm font-medium text-gold-light mb-1">
                Datum *
              </label>
              <input
                name="trigger_date"
                type="date"
                required
                min={today}
                defaultValue={existingMessage?.trigger_date ?? ""}
                className="w-full rounded-lg bg-surface-container border-none px-4 py-3 text-sm text-text-primary focus:ring-1 focus:ring-gold-light/50 transition-all"
              />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                name="repeat_yearly"
                type="checkbox"
                defaultChecked={existingMessage?.repeat_yearly ?? false}
                className="rounded border-border-card text-gold-light focus:ring-gold-light"
              />
              <span className="text-sm text-gold-light">Jährlich wiederholen</span>
            </label>
          </div>
        )}

        {triggerType === "death" && (
          <div className="mt-4">
            {hasTrustedPerson ? (
              <div className="rounded-lg bg-gold/10 p-4">
                <p className="text-sm text-text-secondary">
                  Diese Nachricht wird gesendet, sobald deine Vertrauensperson
                  deinen Tod bestätigt hat.
                </p>
              </div>
            ) : (
              <div className="rounded-lg bg-gold/10 border border-gold/30 p-4">
                <p className="text-sm text-gold-dark font-medium">
                  Du hast noch keine Vertrauensperson festgelegt.
                </p>
                <p className="text-sm text-text-secondary mt-1">
                  Ohne Vertrauensperson können &quot;Nach dem Tod&quot;-Nachrichten nicht
                  ausgelöst werden.
                </p>
                <Link
                  href="/nachrichten?tab=vertrauensperson"
                  className="inline-block mt-2 text-sm text-gold-light font-medium hover:text-gold transition"
                >
                  Vertrauensperson festlegen →
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Sektion 4: Vorschau */}
      {title && body && recipientName && (
        <div className="rounded-xl bg-surface-container-high border-none p-6 mb-6">
          <h2 className="font-serif text-xl font-semibold text-gold-light mb-4">
            Vorschau
          </h2>
          <div className="rounded-lg bg-surface-container-low border border-outline-variant/10 p-5 text-sm">
            <p className="text-xs text-text-secondary mb-3">
              An: {recipientName}
            </p>
            <p className="font-medium text-gold-light mb-3">{title}</p>
            <div className="text-text-secondary whitespace-pre-wrap leading-relaxed">
              {body}
            </div>
            <div className="border-t border-outline-variant/10 mt-4 pt-4 text-xs text-text-secondary">
              Gesendet über Aethernal — aethernal.me
            </div>
          </div>
        </div>
      )}

      {/* Buttons */}
      <div className="flex flex-wrap gap-3 justify-end">
        <Link
          href="/nachrichten"
          className="rounded-lg border border-border-card px-5 py-2.5 text-sm font-medium text-text-secondary hover:bg-surface-container-high transition"
        >
          Abbrechen
        </Link>
        <button
          type="submit"
          data-draft="true"
          disabled={saving}
          className="rounded-lg border border-gold/20 px-5 py-2.5 text-sm font-medium text-gold-light hover:bg-surface-container-high transition disabled:opacity-50"
        >
          Als Entwurf speichern
        </button>
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-gold px-6 py-2.5 text-sm font-medium text-bg-primary hover:brightness-110 transition shadow-sm disabled:opacity-50"
        >
          {saving ? "Wird gespeichert..." : "Nachricht planen"}
        </button>
      </div>
    </form>
  );
}
