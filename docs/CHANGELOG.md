# Changelog

_Was wann gebaut/geändert wurde. Neueste zuerst._

## 2026-07-14
- **A6 Tagebuch + Termine:** EIN gemeinsames `DiaryForm` (`components/diary-form.tsx`) ersetzt die zwei fast identischen neu/bearbeiten-Formulare; beide Wrapper-Seiten laden Memorials jetzt serverseitig → kein Selector-Flash mehr; Tagebuch-Liste als Diary-Karten (Datum-Eyebrow, Serif-Titel, gerahmter Mood-Marker statt roher Emojis, Hover-„Weiterlesen"); Detail-Seite konsistent; Termine: typ-farbige Left-Border entfernt (Gold-Left-Border bleibt Profil-Objekten vorbehalten), Karten/Formular auf Konvention, Empty-States auf `EmptyState`, FABs über der Mobile-Nav; latenter Bug entfernt (Bearbeiten bot „Kein Profil" an, obwohl `memorial_id` NOT NULL ist, und schrieb ein nicht existentes `updated_at`)
- **A5 Nachrichten + Vertrauenspersonen (UI):** EINE gemeinsame `TrustedPersons`-Komponente (`components/trusted-persons.tsx`, mit Bearbeiten/Menü) ersetzt die zwei divergierenden UIs — alte Varianten nach `_alt/`; Trigger-Karten nach Muster (Datum = Gold, „Nach dem Tod" = Tertiär-Blau, gedämpftes Hintergrund-Icon, `aria-pressed`); Live-Vorschau als würdige E-Mail-Karte (Wortmarken-Kopf, Serif-Betreff, Ornament-Divider); Platzhalter-Banner neutral formuliert (kein „in Kürze"-Versprechen); Nachrichten-Empty-State auf `EmptyState`; FAB über der Mobile-Nav positioniert; Inputs auf Konvention
- **A4 Gedenkprofile:** Detail-Hero würdiger (Gold-Ring + Glow, Serif-Name, Lebensspanne als Eyebrow, Beschreibung als Serif-Zitat, `potted_plant`-Fallback); SpiritLink-Card aufs B5-Layout vorbereitet: QR-Platz mit ehrlichem „QR folgt", Mono-URL, funktionierender „Link kopieren"-Button (neue `CopyLinkButton`-Komponente), „Teilen"-Attrappe → ehrliches „Öffnen"; Stats als Serif-Stat-Karte, Nachrichten-Platzhalter kenntlich („–" bis B7), Tagebuch-Zahl jetzt echte DB-Zählung (war fälschlich auf 5 gedeckelt); Galerie mit `grayscale→Farbe`-Hover + Caption-Anzeige; Edit: Foto-ändern als echter (ehrlich deaktivierter) Button „bald verfügbar", Danger-Zone als abgesetzte Karte, Foto-Löschen auf Touch sichtbar; new/edit-Inputs auf Konvention (`bg-surface-container`, Radius-Tokens)
- **A3 Auth + Onboarding:** toter „oder"-Divider im Login entfernt; drei Auth-Cards auf eine Konvention vereinheitlicht (Glass-Card, Eyebrow-Labels, `bg-surface-container`-Inputs, `rounded-card/button`, Gold-Gradient-CTA); Registrierungs-Validierung nach `lib/validation` (`validateRegistration`); Onboarding: ein gemeinsamer Progress-Header, Validierung schon bei Schritt 2 (`validateMemorial`), Foto-Schritt ehrlich als „Optional / bald verfügbar" ohne tote Klick-Affordance, „Später einrichten" funktioniert jetzt wirklich (setzt `onboarding_done` statt in den kaputten Finish-Pfad zu laufen), kaputter Icon-Name `spark_` + letzte `raven`-Platzhalter ersetzt
- **A2 Dashboard:** die zwei getrennten Desktop-/Mobile-Layout-Bäume durch einen responsiven Baum ersetzt; gemeinsame Komponenten `MemorialCard` (Gold-Left-Border, `grayscale→Farbe`-Hover, `potted_plant`-Fallback statt „raven"), `ReminderTimeline` (Gold-Punkt) und `EmptyState` (A8-Fundament) angelegt; irreführende „SpiritLink"-Quick-Action durch ehrliches „Neues Profil" ersetzt; Greeting nach Typo-Skala (4xl/6xl) + korrekte Singular-/Plural-Grammatik
- **A1 App-Shell & Navigation:** ein Nav-Vokabular Desktop+Mobile (*Start · Gedenkprofile · Nachrichten · Tagebuch · Termine*), einheitliche Aktiv-Zustände (Desktop `border-r-2`+`bg-primary/5`, Mobile Pill+`FILL 1`), Wortmarke vereinheitlicht (Sparkle + Serif-Italic + Shimmer), Mobile-Bottom-Nav als Glass mit `rounded-t-2xl` + echtem `pb-safe` (Utility war vorher undefiniert), toter „Mehr"-Tab entfernt (Einstellungen via Avatar), Vertrauenspersonen/Einstellungen als Sekundär-Nav in der Sidebar, `aria-current`/`aria-label` ergänzt. „Gedenkprofile" zeigt bis B1 auf `/dashboard` (aktiv auf `/memorial*`).

## 2026-07-13
- **A0 Design-Fundament:** `globals.css` als einzige Token-Wahrheit (Radius-Skala 12/8px, Motion-Skala 150/250/400ms, sichtbarer `:focus-visible`-Gold-Ring, `prefers-reduced-motion` deaktiviert alle Animationen); `slate-*`-Fremdpalette (Dashboard, App-Nav) und hardcodierte Hex-Werte (`#1C1F33`, `#1a1c29`) durch Tokens ersetzt; ungenutzte Doppel-Wahrheit `lib/design-tokens.ts` nach `_alt/`; tsconfig schließt Deno-Function `supabase/functions` vom Next-Typecheck aus (Build war dadurch rot)
- Redesign-/Launch-Mission-Spec-Paket angelegt (`docs/redesign/`): `00_MISSION.md` (Steuer-Datei) + Design-System, Screen-Specs (Ist→Soll), Funktions-Pakete, Schema-Referenz, `ANLEITUNG.md` — für Ausführung in Claude Code mit Fable 5, ein Arbeitspaket = ein Commit
- Scope: alles Launch-Kritische in 2 Tracks (A Design A0–A8 / B Funktionen B0–B7); Etappe-4-Features (Stripe/AI/B2B/Plaketten) bewusst ausgeklammert; Design-Ziel „Stitch aufwerten"
- Spec gegen echten Code verifiziert (Routen/Felder/Fremd-Paletten bestätigt)

## 2026-07-01
- Gesamt-Audit „Kopf bis Fuß" (Code, Sicherheit, Recht/LP, Docs) — Befund + Maßnahmenplan in `00_Projekt/AUDIT_2026-07-01.md`
- Scheduler-Session vom 22.06. abgeschlossen: Code committet + gehärtet (Jahres-Trigger feuert nicht mehr vor Erstdatum, `lte`-Filter nutzen die Indexe, Batch-Deckel 500/Lauf, `checked`-Zähler korrekt)
- Security-Fix: Open-Redirect im Auth-Callback (`next`-Parameter wird jetzt validiert)
- Rechtstexte korrigiert: falsche Aussage „keine Weitergabe an Dritte" ersetzt durch ehrliche Auftragsverarbeiter-Liste (Supabase, Resend, Google) in `datenschutz.html` + LP-FAQ — **Live-Site braucht SCP-Redeploy der LP-Dateien**
- Tote Download-Links repariert: Trauer-Guide-PDFs (Mensch/Tier) ins Deploy aufgenommen (waren 404)
- `.env.example` korrigiert (echte Supabase-Variablen statt NextAuth-Reste)
- ⚠️ Secrets-Funde in Altdateien (GitHub-Token, Supabase Service-Role-Key) → Ordner nach `!zu löschen durchsicht/` verschoben, **Rotation durch Fabian erforderlich** (Git-Historie geprüft: sauber)

## 2026-06-22
- Scheduler gebaut (Roadmap Phase 1, Aufgabe 2): Supabase Edge Function `send-due-messages` (Deno/TS) — findet fällige `messages` (datumsgetriggert) und `reminders`, versendet über Resend, mit Doppelversand-Schutz und `repeat_yearly`-Logik
- Migration `20260622_scheduler.sql`: Spalte `reminders.last_sent_on`, Indexe für Fällig-Abfragen, Extensions `pg_cron` + `pg_net`
- `supabase/config.toml` angelegt (Function mit `verify_jwt=false`, Schutz über CRON_SECRET) + `setup-cron.sql` (täglicher Cron 06:00 UTC) + README
- Noch nicht live: Deploy, Secrets (RESEND_API_KEY, FROM_EMAIL, CRON_SECRET) und Live-Test ausstehend

## 2026-06-17
- E-Mail (Resend) eingerichtet: Domain aethernal.me verifiziert (DNS via Hostinger), Custom SMTP in Supabase aktiv, „Confirm email" aktiviert → App verschickt echte Anmelde-Bestätigungen
- Projektdateien aufgeräumt: aktiver Code nach `~/Projekte/Aethernal/aethernal`, Altes in `_ALT_kann_geloescht_werden/`
- Arbeitsbasis festgelegt: Next.js + Supabase (Laravel-Plan verworfen)
- Projekt-Gehirn-Dateien angelegt: `CLAUDE.md`, `docs/ROADMAP.md`, `docs/DECISIONS.md`, `docs/CHANGELOG.md`
- Gesamt-Review (Code & Strategie) durchgeführt; Masterplan neu definiert (`docs/MASTERPLAN.md`): B2C-first, volles Kernversprechen vor Launch, Monetarisierung später
