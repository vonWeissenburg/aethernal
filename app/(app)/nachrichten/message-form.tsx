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
        <div className="flex items-start gap-3 rounded-button bg-error/10 border border-error/30 p-4 mb-6">
          <span className="material-symbols-outlined text-error text-[20px] mt-0.5" aria-hidden="true">error</span>
          <p className="font-body text-sm text-error">{error}</p>
        </div>
      )}

      {/* Section 1: Empfaenger */}
      <div className="rounded-card bg-card border border-outline-variant/30 p-6 mb-4">
        <div className="flex items-center gap-2 mb-5">
          <span className="material-symbols-outlined text-primary text-[22px]">person</span>
          <h2 className="font-headline text-xl font-semibold text-on-surface">
            Empfänger
          </h2>
        </div>

        {trustedPersons.length > 0 && (
          <div className="mb-4">
            <label className="block font-label text-sm font-medium text-on-surface-variant mb-1.5">
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
              className="w-full rounded-button bg-surface-container border-none px-4 py-3.5 font-body text-sm text-on-surface focus:ring-2 focus:ring-primary/50 transition-all duration-250 ease-out"
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
            <label className="block font-label text-sm font-medium text-on-surface-variant mb-1.5">
              Name des Empfängers *
            </label>
            <input
              name="recipient_name"
              required
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              className="w-full rounded-button bg-surface-container border-none px-4 py-3.5 font-body text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:ring-2 focus:ring-primary/50 transition-all duration-250 ease-out"
              placeholder="z.B. Maria"
            />
          </div>
          <div>
            <label className="block font-label text-sm font-medium text-on-surface-variant mb-1.5">
              E-Mail-Adresse *
            </label>
            <input
              name="recipient_email"
              type="email"
              required
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              className="w-full rounded-button bg-surface-container border-none px-4 py-3.5 font-body text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:ring-2 focus:ring-primary/50 transition-all duration-250 ease-out"
              placeholder="maria@beispiel.at"
            />
          </div>
        </div>
        {memorials.length > 0 && (
          <div className="mt-4">
            <label className="block font-label text-sm font-medium text-on-surface-variant mb-1.5">
              Gedenkprofil zuordnen (optional)
            </label>
            <select
              name="memorial_id"
              defaultValue={existingMessage?.memorial_id ?? ""}
              className="w-full rounded-button bg-surface-container border-none px-4 py-3.5 font-body text-sm text-on-surface focus:ring-2 focus:ring-primary/50 transition-all duration-250 ease-out"
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

      {/* Section 2: Inhalt */}
      <div className="rounded-card bg-card border border-outline-variant/30 p-6 mb-4">
        <div className="flex items-center gap-2 mb-5">
          <span className="material-symbols-outlined text-primary text-[22px]">edit_note</span>
          <h2 className="font-headline text-xl font-semibold text-on-surface">
            Inhalt
          </h2>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block font-label text-sm font-medium text-on-surface-variant mb-1.5">
              Betreff *
            </label>
            <input
              name="title"
              required
              maxLength={100}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-button bg-surface-container border-none px-4 py-3.5 font-body text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:ring-2 focus:ring-primary/50 transition-all duration-250 ease-out"
              placeholder="z.B. Zum Geburtstag, mein Schatz"
            />
            <p className="font-label text-xs text-outline mt-1.5 text-right">
              {title.length}/100
            </p>
          </div>
          <div>
            <label className="block font-label text-sm font-medium text-on-surface-variant mb-1.5">
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
              className="w-full rounded-button bg-surface-container border-none px-4 py-3.5 font-body text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:ring-2 focus:ring-primary/50 transition-all duration-250 ease-out resize-y"
              placeholder={
                recipientName
                  ? `Schreibe hier deine Nachricht an ${recipientName}...`
                  : "Schreibe hier deine Nachricht..."
              }
            />
            <p className="font-label text-xs text-outline mt-1.5 text-right">
              {body.length}/{MAX_BODY}
            </p>
          </div>
        </div>
      </div>

      {/* Section 3: Wann senden? */}
      <div className="rounded-card bg-card border border-outline-variant/30 p-6 mb-4">
        <div className="flex items-center gap-2 mb-5">
          <span className="material-symbols-outlined text-primary text-[22px]">schedule_send</span>
          <h2 className="font-headline text-xl font-semibold text-on-surface">
            Wann senden?
          </h2>
        </div>
        {/* Trigger-Karten: Datum = Gold, „Nach dem Tod" = Tertiär-Blau */}
        <div className="grid gap-4 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setTriggerType("date")}
            aria-pressed={triggerType === "date"}
            className={`relative overflow-hidden rounded-card border-2 p-5 text-left transition-colors duration-250 ease-out ${
              triggerType === "date"
                ? "border-primary bg-primary/5"
                : "border-outline-variant/40 bg-surface hover:border-primary/30"
            }`}
          >
            <span
              className="material-symbols-outlined absolute -bottom-4 -right-4 text-[80px] text-on-surface/5 pointer-events-none"
              aria-hidden="true"
            >
              calendar_today
            </span>
            <span
              className={`material-symbols-outlined text-[28px] mb-2 block ${
                triggerType === "date" ? "text-primary" : "text-on-surface-variant"
              }`}
              style={triggerType === "date" ? { fontVariationSettings: "'FILL' 1" } : undefined}
              aria-hidden="true"
            >
              calendar_today
            </span>
            <h3 className="font-label font-medium text-on-surface relative">Zu einem bestimmten Datum</h3>
            <p className="font-body text-xs text-on-surface-variant mt-1 relative">
              Geburtstag, Jahrestag, Weihnachten...
            </p>
          </button>
          <button
            type="button"
            onClick={() => setTriggerType("death")}
            aria-pressed={triggerType === "death"}
            className={`relative overflow-hidden rounded-card border-2 p-5 text-left transition-colors duration-250 ease-out ${
              triggerType === "death"
                ? "border-tertiary bg-tertiary/5"
                : "border-outline-variant/40 bg-surface hover:border-tertiary/40"
            }`}
          >
            <span
              className="material-symbols-outlined absolute -bottom-4 -right-4 text-[80px] text-on-surface/5 pointer-events-none"
              aria-hidden="true"
            >
              volunteer_activism
            </span>
            <span
              className={`material-symbols-outlined text-[28px] mb-2 block ${
                triggerType === "death" ? "text-tertiary" : "text-on-surface-variant"
              }`}
              style={triggerType === "death" ? { fontVariationSettings: "'FILL' 1" } : undefined}
              aria-hidden="true"
            >
              volunteer_activism
            </span>
            <h3 className="font-label font-medium text-on-surface relative">Nach meinem Tod</h3>
            <p className="font-body text-xs text-on-surface-variant mt-1 relative">
              Wird nach Bestätigung durch Vertrauensperson gesendet.
            </p>
          </button>
        </div>

        {triggerType === "date" && (
          <div className="mt-5 space-y-4">
            <div>
              <label className="block font-label text-sm font-medium text-on-surface-variant mb-1.5">
                Datum *
              </label>
              <input
                name="trigger_date"
                type="date"
                required
                min={today}
                defaultValue={existingMessage?.trigger_date ?? ""}
                className="w-full rounded-button bg-surface-container border-none px-4 py-3.5 font-body text-sm text-on-surface focus:ring-2 focus:ring-primary/50 transition-all duration-250 ease-out"
              />
            </div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                name="repeat_yearly"
                type="checkbox"
                defaultChecked={existingMessage?.repeat_yearly ?? false}
                className="h-5 w-5 rounded border-outline-variant bg-surface-container-low text-primary focus:ring-primary focus:ring-offset-0"
              />
              <span className="font-label text-sm text-on-surface">Jährlich wiederholen</span>
            </label>
          </div>
        )}

        {triggerType === "death" && (
          <div className="mt-5">
            {hasTrustedPerson ? (
              <div className="flex items-start gap-3 rounded-button bg-tertiary/5 border border-tertiary/20 p-4">
                <span className="material-symbols-outlined text-tertiary text-[20px] mt-0.5" aria-hidden="true">check_circle</span>
                <p className="font-body text-sm text-on-surface-variant">
                  Diese Nachricht wird gesendet, sobald deine Vertrauensperson
                  deinen Tod bestätigt hat.
                </p>
              </div>
            ) : (
              <div className="rounded-button bg-tertiary/5 border border-tertiary/20 p-4">
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-tertiary text-[20px] mt-0.5" aria-hidden="true">warning</span>
                  <div>
                    <p className="font-label text-sm text-tertiary font-medium">
                      Du hast noch keine Vertrauensperson festgelegt.
                    </p>
                    <p className="font-body text-sm text-on-surface-variant mt-1">
                      Ohne Vertrauensperson können &quot;Nach dem Tod&quot;-Nachrichten nicht
                      ausgelöst werden.
                    </p>
                    <Link
                      href="/nachrichten?tab=vertrauensperson"
                      className="inline-flex items-center gap-1 mt-2 font-label text-sm text-tertiary font-medium hover:underline"
                    >
                      Vertrauensperson festlegen
                      <span className="material-symbols-outlined text-[16px]" aria-hidden="true">arrow_forward</span>
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Section 4: Live-Vorschau als würdige E-Mail-Karte */}
      {title && body && recipientName && (
        <div className="rounded-card bg-card border border-outline-variant/30 p-6 mb-4">
          <div className="flex items-center gap-2 mb-5">
            <span className="material-symbols-outlined text-primary text-[22px]" aria-hidden="true">preview</span>
            <h2 className="font-headline text-xl font-semibold text-on-surface">
              So kommt deine Nachricht an
            </h2>
          </div>
          <div className="rounded-card bg-surface-container-lowest border border-outline-variant/40 overflow-hidden">
            {/* Mail-Kopf */}
            <div className="px-6 py-4 border-b border-outline-variant/30 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="material-symbols-outlined text-primary text-lg"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                  aria-hidden="true"
                >
                  auto_awesome
                </span>
                <span className="font-headline italic text-primary text-sm">Aethernal</span>
              </div>
              <p className="font-label text-[10px] uppercase tracking-[0.15em] text-on-surface-variant/70 truncate">
                An: {recipientName}
              </p>
            </div>
            {/* Mail-Inhalt */}
            <div className="px-6 py-6">
              <p className="font-headline text-lg text-on-surface mb-4">{title}</p>
              <div className="font-body text-sm text-on-surface-variant whitespace-pre-wrap leading-relaxed">
                {body}
              </div>
            </div>
            {/* Mail-Fuß mit Ornament-Divider */}
            <div className="px-6 pb-5">
              <div className="flex items-center gap-3 mb-3" aria-hidden="true">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-outline-variant/60 to-transparent" />
                <span className="material-symbols-outlined text-primary/50 text-base">potted_plant</span>
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-outline-variant/60 to-transparent" />
              </div>
              <p className="text-center font-body text-xs text-on-surface-variant/70">
                Gesendet über Aethernal · aethernal.me
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Buttons */}
      <div className="flex flex-wrap gap-3 justify-end pt-2">
        <Link
          href="/nachrichten"
          className="rounded-full border border-outline-variant px-5 py-2.5 font-label text-sm font-medium text-on-surface-variant hover:bg-surface-container-high transition"
        >
          Abbrechen
        </Link>
        <button
          type="submit"
          data-draft="true"
          disabled={saving}
          className="rounded-full border border-primary/30 px-5 py-2.5 font-label text-sm font-medium text-primary hover:bg-primary/10 transition disabled:opacity-50"
        >
          <span className="inline-flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[18px]">save</span>
            Als Entwurf speichern
          </span>
        </button>
        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-primary px-6 py-2.5 font-label text-sm font-medium text-on-primary hover:brightness-110 transition shadow-md disabled:opacity-50"
        >
          <span className="inline-flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[18px]">send</span>
            {saving ? "Wird gespeichert..." : "Nachricht planen"}
          </span>
        </button>
      </div>
    </form>
  );
}
