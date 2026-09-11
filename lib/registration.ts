/**
 * Registrierung bis zum Launch geschlossen.
 *
 * Entscheidung 11.09.2026 (Masterplan 28.08., Empfehlung 1): Solange AGB und
 * Datenschutzerklärung nicht anwaltlich geprüft sind und der Fotospeicher offen
 * ist, darf kein Fremder echte Daten Verstorbener anlegen. Jeder Tag mit offener
 * Registrierung vergrößert den Bestand, der später bereinigt werden müsste.
 *
 * Bewusst "geschlossen, solange nicht ausdrücklich geöffnet": Eine vergessene
 * Umgebungsvariable führt in den sicheren Zustand, nicht in den offenen.
 *
 * Öffnen: REGISTRATION_OPEN=true in der .env auf dem Server, dann
 * `docker compose up -d --force-recreate`. Kein Neubau nötig.
 *
 * Bewusst OHNE das Präfix NEXT_PUBLIC_: Next.js setzt solche Variablen beim
 * Bauen fest ein. Da der Docker-Build die .env mitkopiert, wäre der Wert im
 * Abbild eingebacken und ein späteres Umstellen in der .env wirkungslos —
 * nachgewiesen im Smoke-Test am 11.09.2026.
 *
 * ⚠️ Das hier schließt nur die Oberfläche. Der harte Riegel ist der Schalter
 * "Allow new users to sign up" in den Supabase-Auth-Einstellungen — ohne ihn
 * kann die Registrierungs-Schnittstelle weiterhin direkt angesprochen werden.
 */
export function isRegistrationOpen(): boolean {
  return process.env.REGISTRATION_OPEN === "true";
}
