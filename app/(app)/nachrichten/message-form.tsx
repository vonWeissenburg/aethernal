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
        <div className="flex items-start gap-3 rounded-xl bg-error/10 border border-error/30 p-4 mb-6">
          <span className="material-symbols-outlined text-error text-[20px] mt-0.5">error</span>
          <p className="font-body text-sm text-error">{error}</p>
        </div>
      )}

      {/* Section 1: Empfaenger */}
      <div className="rounded-2xl bg-card p-6 mb-4">
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
              className="w-full rounded-xl bg-surface-container-low border border-outline-variant px-4 py-3 font-body text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
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
              className="w-full rounded-xl bg-surface-container-low border border-outline-variant px-4 py-3 font-body text-sm text-on-surface placeholder:text-outline focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
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
              className="w-full rounded-xl bg-surface-container-low border border-outline-variant px-4 py-3 font-body text-sm text-on-surface placeholder:text-outline focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
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
              className="w-full rounded-xl bg-surface-container-low border border-outline-variant px-4 py-3 font-body text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
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
      <div className="rounded-2xl bg-card p-6 mb-4">
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
              className="w-full rounded-xl bg-surface-container-low border border-outline-variant px-4 py-3 font-body text-sm text-on-surface placeholder:text-outline focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
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
              className="w-full rounded-xl bg-surface-container-low border border-outline-variant px-4 py-3 font-body text-sm text-on-surface placeholder:text-outline focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-y"
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
      <div className="rounded-2xl bg-card p-6 mb-4">
        <div className="flex items-center gap-2 mb-5">
          <span className="material-symbols-outlined text-primary text-[22px]">schedule_send</span>
          <h2 className="font-headline text-xl font-semibold text-on-surface">
            Wann senden?
          </h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setTriggerType("date")}
            className={`rounded-2xl border-2 p-5 text-left transition ${
              triggerType === "date"
                ? "border-primary bg-primary/5"
                : "border-outline-variant bg-surface hover:border-primary/30"
            }`}
          >
            <span className="material-symbols-outlined text-primary text-[28px] mb-2 block">
              calendar_today
            </span>
            <h3 className="font-label font-medium text-on-surface">Zu einem bestimmten Datum</h3>
            <p className="font-body text-xs text-on-surface-variant mt-1">
              Geburtstag, Jahrestag, Weihnachten...
            </p>
          </button>
          <button
            type="button"
            onClick={() => setTriggerType("death")}
            className={`rounded-2xl border-2 p-5 text-left transition ${
              triggerType === "death"
                ? "border-primary bg-primary/5"
                : "border-outline-variant bg-surface hover:border-primary/30"
            }`}
          >
            <span className="material-symbols-outlined text-primary text-[28px] mb-2 block">
              volunteer_activism
            </span>
            <h3 className="font-label font-medium text-on-surface">Nach meinem Tod</h3>
            <p className="font-body text-xs text-on-surface-variant mt-1">
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
                className="w-full rounded-xl bg-surface-container-low border border-outline-variant px-4 py-3 font-body text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
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
              <div className="flex items-start gap-3 rounded-xl bg-primary/5 border border-primary/20 p-4">
                <span className="material-symbols-outlined text-primary text-[20px] mt-0.5">check_circle</span>
                <p className="font-body text-sm text-on-surface-variant">
                  Diese Nachricht wird gesendet, sobald deine Vertrauensperson
                  deinen Tod bestätigt hat.
                </p>
              </div>
            ) : (
              <div className="rounded-xl bg-primary/5 border border-primary/20 p-4">
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-primary text-[20px] mt-0.5">warning</span>
                  <div>
                    <p className="font-label text-sm text-primary font-medium">
                      Du hast noch keine Vertrauensperson festgelegt.
                    </p>
                    <p className="font-body text-sm text-on-surface-variant mt-1">
                      Ohne Vertrauensperson können &quot;Nach dem Tod&quot;-Nachrichten nicht
                      ausgelöst werden.
                    </p>
                    <Link
                      href="/nachrichten?tab=vertrauensperson"
                      className="inline-flex items-center gap-1 mt-2 font-label text-sm text-primary font-medium hover:underline transition"
                    >
                      Vertrauensperson festlegen
                      <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Section 4: Vorschau */}
      {title && body && recipientName && (
        <div className="rounded-2xl bg-card p-6 mb-4">
          <div className="flex items-center gap-2 mb-5">
            <span className="material-symbols-outlined text-primary text-[22px]">preview</span>
            <h2 className="font-headline text-xl font-semibold text-on-surface">
              Vorschau
            </h2>
          </div>
          <div className="rounded-xl bg-surface-container-low border border-outline-variant p-5">
            <p className="font-label text-xs text-outline mb-3">
              An: {recipientName}
            </p>
            <p className="font-headline font-medium text-on-surface mb-3">{title}</p>
            <div className="font-body text-sm text-on-surface-variant whitespace-pre-wrap leading-relaxed">
              {body}
            </div>
            <div className="border-t border-outline-variant mt-4 pt-4 font-body text-xs text-outline">
              Gesendet über Aethernal — aethernal.me
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
