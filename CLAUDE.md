# Aethernal — Projektkontext für Claude Code

> Diese Datei wird bei jeder Session automatisch gelesen. Sie ist die "Spielregeln"-Datei.
> Der lebende Projektzustand steht in `docs/ROADMAP.md`, `docs/DECISIONS.md`, `docs/CHANGELOG.md`.

## Was ist Aethernal
Digitale Gedenkplattform — bewahrt die Erinnerung an verstorbene Menschen und Tiere.
Privatprojekt von Fabian Fehervary (NICHT Eximie). Impressum: nur Privatperson,
keine Firma, keine UID.

## Tech-Stack (fix)
- Next.js 15.2 (App Router) + React 19 + TypeScript
- Supabase (`@supabase/ssr`, `@supabase/supabase-js`) — Auth, PostgreSQL (Frankfurt), Storage, Row Level Security
- Tailwind CSS v4
- Geplant, noch nicht integriert: Stripe (Bezahlung), Resend (E-Mail-Versand)
- App-Sprache: Deutsch, du-Form. Locale `de`, Timezone `Europe/Vienna`.

## Befehle
- `npm run dev` — Entwicklungsserver
- `npm run build` — Production-Build
- `npm run start` — Production starten
- `npm run lint` — Linting
- Tests: aktuell keine.

## Ordnerstruktur (Kurzüberblick)
- `app/(auth)/` — `login`, `register`, `reset-password`; `app/auth/callback` — Auth-Callback
- `app/(app)/` — eingeloggter Bereich: `dashboard`, `memorial`, `nachrichten`, `tagebuch`, `termine`, `vertrauenspersonen`, `onboarding`, `einstellungen`
- `app/s/[slug]` — öffentliche Gedenkseite (SpiritLink)
- `lib/supabase/` — `client.ts`, `server.ts`, `middleware.ts` (Supabase-Zugriff)
- `lib/` — `types.ts`, `validation.ts`, `utils.ts` (Design-Tokens: einzige Wahrheit ist `app/globals.css`)
- `supabase/migrations/` — Datenbank-Migrationen (Format `YYYYMMDD_beschreibung.sql`)
- Landing-Page liegt als statische HTMLs im Root (`index.html`, `impressum.html`, `datenschutz.html`, `agb.html`, `partner-apply.html`)

## Arbeitsregeln (WICHTIG)
1. **Eine Aufgabe = eine Session = ein Commit.** Kleine, abgeschlossene Schritte. Wird eine Session lang/unübersichtlich, war die Aufgabe zu groß → aufteilen.
2. **Am Ende JEDER Session:** `docs/ROADMAP.md` aktualisieren (Erledigtes abhaken, Nächstes markieren) und `docs/CHANGELOG.md` ergänzen, dann committen.
3. **Richtungsentscheidungen** in `docs/DECISIONS.md` festhalten (Datum + Begründung).
4. **Datenbank-Änderungen NUR** als Migrationsdatei in `supabase/migrations/`. Niemals manuell im Supabase-Dashboard klicken.
5. **Secrets/Keys NIE committen.** `.env` bleibt lokal (`.env.example` listet die Variablen).
6. **Commit-Messages auf Englisch**, conventional commits (`feat:`, `fix:`, `docs:`, `chore:`, `refactor:`).
7. **Alle nutzersichtbaren Texte auf Deutsch, du-Form.**
8. Bei Unsicherheit über die Richtung: in `docs/DECISIONS.md` nachsehen, nicht raten.

## Festgelegte Richtung
Der Stack ist fix: **Next.js + Supabase.** Der frühere Laravel-Rewrite-Plan ist
verworfen (siehe `docs/DECISIONS.md`).
