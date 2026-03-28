"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
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

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>, asDraft: boolean) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const form = new FormData(e.currentTarget);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const messageData = {
      user_id: user.id,
      title: form.get("title") as string,
      body: form.get("body") as string,
      recipient_name: form.get("recipient_name") as string,
      recipient_email: form.get("recipient_email") as string,
      memorial_id: (form.get("memorial_id") as string) || null,
      trigger_type: triggerType,
      trigger_date: triggerType === "date" ? (form.get("trigger_date") as string) || null : null,
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
        <p className="text-sm text-red-600 mb-6 p-3 bg-red-50 rounded-lg">{error}</p>
      )}

      {/* Sektion 1: Empfänger */}
      <div className="rounded-xl border border-lavender-dark bg-white p-6 mb-6">
        <h2 className="font-serif text-xl font-semibold text-violet mb-4">
          Empfänger
        </h2>

        {trustedPersons.length > 0 && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-violet mb-1">
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
              className="w-full rounded-lg border border-lavender-dark px-4 py-2.5 text-sm focus:border-amber focus:ring-1 focus:ring-amber outline-none bg-white"
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
            <label className="block text-sm font-medium text-violet mb-1">
              Name des Empfängers *
            </label>
            <input
              name="recipient_name"
              required
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              className="w-full rounded-lg border border-lavender-dark px-4 py-2.5 text-sm focus:border-amber focus:ring-1 focus:ring-amber outline-none"
              placeholder="z.B. Maria"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-violet mb-1">
              E-Mail-Adresse *
            </label>
            <input
              name="recipient_email"
              type="email"
              required
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              className="w-full rounded-lg border border-lavender-dark px-4 py-2.5 text-sm focus:border-amber focus:ring-1 focus:ring-amber outline-none"
              placeholder="maria@beispiel.at"
            />
          </div>
        </div>
        {memorials.length > 0 && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-violet mb-1">
              Gedenkprofil zuordnen (optional)
            </label>
            <select
              name="memorial_id"
              defaultValue={existingMessage?.memorial_id ?? ""}
              className="w-full rounded-lg border border-lavender-dark px-4 py-2.5 text-sm focus:border-amber focus:ring-1 focus:ring-amber outline-none bg-white"
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
      <div className="rounded-xl border border-lavender-dark bg-white p-6 mb-6">
        <h2 className="font-serif text-xl font-semibold text-violet mb-4">
          Inhalt
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-violet mb-1">
              Betreff *
            </label>
            <input
              name="title"
              required
              maxLength={100}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-lavender-dark px-4 py-2.5 text-sm focus:border-amber focus:ring-1 focus:ring-amber outline-none"
              placeholder="z.B. Zum Geburtstag, mein Schatz"
            />
            <p className="text-xs text-aether-gray mt-1 text-right">
              {title.length}/100
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-violet mb-1">
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
              className="w-full rounded-lg border border-lavender-dark px-4 py-3 text-sm focus:border-amber focus:ring-1 focus:ring-amber outline-none resize-y"
              placeholder={
                recipientName
                  ? `Schreibe hier deine Nachricht an ${recipientName}...`
                  : "Schreibe hier deine Nachricht..."
              }
            />
            <p className="text-xs text-aether-gray mt-1 text-right">
              {body.length}/{MAX_BODY}
            </p>
          </div>
        </div>
      </div>

      {/* Sektion 3: Wann senden? */}
      <div className="rounded-xl border border-lavender-dark bg-white p-6 mb-6">
        <h2 className="font-serif text-xl font-semibold text-violet mb-4">
          Wann senden?
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setTriggerType("date")}
            className={`rounded-xl border-2 p-5 text-left transition ${
              triggerType === "date"
                ? "border-amber bg-amber/5"
                : "border-lavender-dark bg-white hover:border-violet/30"
            }`}
          >
            <div className="text-2xl mb-2">📅</div>
            <h3 className="font-medium text-violet">Zu einem bestimmten Datum</h3>
            <p className="text-xs text-aether-gray mt-1">
              Geburtstag, Jahrestag, Weihnachten...
            </p>
          </button>
          <button
            type="button"
            onClick={() => setTriggerType("death")}
            className={`rounded-xl border-2 p-5 text-left transition ${
              triggerType === "death"
                ? "border-amber bg-amber/5"
                : "border-lavender-dark bg-white hover:border-violet/30"
            }`}
          >
            <div className="text-2xl mb-2">🕊️</div>
            <h3 className="font-medium text-violet">Nach meinem Tod</h3>
            <p className="text-xs text-aether-gray mt-1">
              Wird nach Bestätigung durch Vertrauensperson gesendet.
            </p>
          </button>
        </div>

        {triggerType === "date" && (
          <div className="mt-4 space-y-3">
            <div>
              <label className="block text-sm font-medium text-violet mb-1">
                Datum *
              </label>
              <input
                name="trigger_date"
                type="date"
                required
                defaultValue={existingMessage?.trigger_date ?? ""}
                className="w-full rounded-lg border border-lavender-dark px-4 py-2.5 text-sm focus:border-amber focus:ring-1 focus:ring-amber outline-none"
              />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                name="repeat_yearly"
                type="checkbox"
                defaultChecked={existingMessage?.repeat_yearly ?? false}
                className="rounded border-lavender-dark text-amber focus:ring-amber"
              />
              <span className="text-sm text-violet">Jährlich wiederholen</span>
            </label>
          </div>
        )}

        {triggerType === "death" && (
          <div className="mt-4">
            {hasTrustedPerson ? (
              <div className="rounded-lg bg-lavender/50 p-4">
                <p className="text-sm text-aether-gray">
                  Diese Nachricht wird gesendet, sobald deine Vertrauensperson
                  deinen Tod bestätigt hat.
                </p>
              </div>
            ) : (
              <div className="rounded-lg bg-amber/10 border border-amber/30 p-4">
                <p className="text-sm text-amber-dark font-medium">
                  Du hast noch keine Vertrauensperson festgelegt.
                </p>
                <p className="text-sm text-aether-gray mt-1">
                  Ohne Vertrauensperson können &quot;Nach dem Tod&quot;-Nachrichten nicht
                  ausgelöst werden.
                </p>
                <Link
                  href="/nachrichten?tab=vertrauensperson"
                  className="inline-block mt-2 text-sm text-amber font-medium hover:text-amber-dark transition"
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
        <div className="rounded-xl border border-lavender-dark bg-white p-6 mb-6">
          <h2 className="font-serif text-xl font-semibold text-violet mb-4">
            Vorschau
          </h2>
          <div className="rounded-lg bg-gray-50 border border-gray-200 p-5 text-sm">
            <p className="text-xs text-aether-gray mb-3">
              An: {recipientName}
            </p>
            <p className="font-medium text-violet mb-3">{title}</p>
            <div className="text-aether-gray whitespace-pre-wrap leading-relaxed">
              {body}
            </div>
            <div className="border-t border-gray-200 mt-4 pt-4 text-xs text-aether-gray">
              Gesendet über Aethernal — aethernal.me
            </div>
          </div>
        </div>
      )}

      {/* Buttons */}
      <div className="flex flex-wrap gap-3 justify-end">
        <Link
          href="/nachrichten"
          className="rounded-lg border border-lavender-dark px-5 py-2.5 text-sm font-medium text-aether-gray hover:bg-lavender transition"
        >
          Abbrechen
        </Link>
        <button
          type="submit"
          data-draft="true"
          disabled={saving}
          className="rounded-lg border border-violet/20 px-5 py-2.5 text-sm font-medium text-violet hover:bg-lavender transition disabled:opacity-50"
        >
          Als Entwurf speichern
        </button>
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-amber px-6 py-2.5 text-sm font-medium text-white hover:bg-amber-dark transition shadow-sm disabled:opacity-50"
        >
          {saving ? "Wird gespeichert..." : "Nachricht planen"}
        </button>
      </div>
    </form>
  );
}
