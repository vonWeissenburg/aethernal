# Changelog

_Was wann gebaut/geändert wurde. Neueste zuerst._

## 2026-08-28
- **Doppelbestätigung im Todesfall-Ablauf** (Entscheidung 28.08., siehe `DECISIONS.md`).
  Karenzzeit bleibt 7 Tage; danach stellt der Scheduler nicht mehr direkt zu, sondern bittet
  die Vertrauensperson um eine zweite, bewusste Bestätigung. Bleibt sie aus, wird nach einer
  Erinnerung (7 Tage) am Rückfalldatum (14 Tage) automatisch zugestellt — die zweite
  Bestätigung ist bewusst ein Beschleuniger, keine harte Hürde. Widerrufsfenster des Nutzers
  damit bis zu 21 Tage.
- **Migration `supabase/migrations/20260828_death_report_second_confirmation.sql`** (idempotent):
  `death_reports` erhält `final_request_sent_at`, `final_confirm_token_hash`,
  `final_confirmed_at`, `final_reminder_sent_at`, `fallback_deliver_at` plus Unique-Index auf
  den Token-Hash und zwei Teil-Indizes für die Scheduler-Abfragen. Kein Backfill nötig.
  **⚠️ REIHENFOLGE: Migration im Supabase-SQL-Editor einspielen, BEVOR der Code deployt wird.**
  Ohne die Spalten schlagen alle drei Todesfall-Abfragen fehl und die Zustellung von
  death-Nachrichten stünde bis zum Einspielen still.
- **Neue Seite `/vertrauen/todesfall/freigeben`** (`app/vertrauen/todesfall/freigeben/page.tsx`):
  zweite Bestätigung per Token, Zwei-Schritt (Button + POST, kein Auslösen durch Mail-Scanner),
  benennt das Rückfalldatum ausdrücklich, damit niemand glaubt, sein Schweigen halte die
  Nachrichten dauerhaft auf.
- **Scheduler `send-due-messages` Abschnitt 4 in drei Schritte zerlegt:**
  A) Karenzzeit abgelaufen → Freigabe-Token setzen, Rückfalldatum setzen, Bitte um zweite
  Bestätigung an die Vertrauensperson. B) nach 7 Tagen ohne Antwort genau eine Erinnerung mit
  FRISCHEM Token (der alte verfällt, weil nur der Hash gespeichert ist — die Mail sagt das).
  C) Zustellung, wenn freigegeben ODER Rückfalldatum erreicht (zwei Abfragen + Entdoppelung
  statt `.or()`). Token-Erzeugung und SHA-256 in Deno über Web Crypto, hashgleich zu
  `lib/death-flow.ts`. Neue Zähler `finalRequested`/`remindersSent` in der Antwort.
- **Sonderfall abgedeckt:** ist die Vertrauensperson gelöscht (`trusted_person_id` NULL),
  gibt es niemanden zu fragen → es gilt die alte Regel, Zustellung direkt nach der Karenzzeit.
- **Neues Secret nötig:** `APP_URL` für die Edge Function (Links in den Mails). Fällt weich auf
  `https://app.aethernal.me` zurück, wenn nicht gesetzt.
- Konstanten `FINAL_CONFIRM_FALLBACK_DAYS = 14` und `FINAL_CONFIRM_REMINDER_DAYS = 7` in
  `lib/death-flow.ts` (und spiegelbildlich in der Edge Function, die keine Imports aus `lib/` hat).
- Texte im ersten Bestätigungsschritt angepasst: die Vertrauensperson erfährt jetzt vorab,
  dass eine zweite Bestätigung kommt.
- Geprüft: `npx tsc --noEmit` sauber, `next build` sauber (Route `/vertrauen/todesfall/freigeben`
  registriert), `deno check` der Edge Function sauber. **Noch nicht committet, nicht deployt,
  Migration noch nicht eingespielt.**

## 2026-08-13
- **Performance-Etappe (A6), Teil 1 — Fonts & Landing-Page-Assets.** Vorher gemessen statt geraten:
  Der VPS ist NICHT die Bremse (Frankfurt, Load 0.00; statische LP direkt aus nginx in **28 ms**,
  App-SSR `/login` warm in **17 ms**, VPS→Supabase Ping **1 ms**). Die 8–9 s entstanden im Client:
  externe Roundtrips und Bytes.
- **App: Google Fonts entfernt, alles selbst gehostet** (`app/layout.tsx` + `app/globals.css`).
  3 render-blockierende Stylesheets von `fonts.googleapis.com`/`fonts.gstatic.com` sind weg
  (= 2 fremde Hosts × DNS+TLS+CSS+Font aus dem kritischen Pfad). Fonts jetzt über `next/font/local`
  mit `size-adjust`-Fallbacks (weniger Layout-Shift). **Material-Symbols-Icon-Font auf die
  66 tatsächlich benutzten Icons subgesetzt: 3 868 KB → 85 KB (−97,8 %)**; alle 66 Ligaturen mit
  HarfBuzz gegengeprüft, Icon-Namen liegen in `app/fonts/ICONS.txt`. Achtung: Die Regeln
  `font-family`/`font-feature-settings`/… für `.material-symbols-outlined` kamen früher aus dem
  Google-Stylesheet und stehen jetzt in `globals.css` — ohne sie rendern Icons als Klartext.
- **Landing Page: Tailwind-Play-CDN raus.** `cdn.tailwindcss.com` (~400 KB JS, das im Browser
  erst CSS kompilieren muss, bevor irgendetwas gestaltet ist) ersetzt durch statisch kompiliertes
  `styles.css` (**28 KB**). Config-Nachbau in `landingpage.tailwind.config.js`, Build:
  `npx tailwindcss -c landingpage.tailwind.config.js -i input.css -o styles.css --minify`.
- **Landing Page: 8 Hero-/Sektionsbilder waren von `lh3.googleusercontent.com` gehotlinkt**
  (temporäre Google-Stitch-URLs — hätten jederzeit verschwinden können und die Seite zerlegt).
  Jetzt lokal als WebP: **2,98 MB → 191 KB (−93,7 %)**, mit `width`/`height` gegen Layout-Shift,
  Hero `fetchpriority=high`, Rest `loading=lazy`.
- **Ergebnis Landing Page live:** 17 externe Requests → **0**, Seitengewicht ~3,5 MB → **280 KB**,
  10 Requests gesamt. Optisch geprüft (Vollseiten-Screenshot alt/neu): mittlere Pixelabweichung
  2,4/255. Icon-Größen (`text-5xl/6xl/7xl`) verhalten sich identisch wie vorher — dafür braucht die
  Default-Größe `:where(.material-symbols-outlined)` (Spezifität 0), sonst schlägt sie die
  Tailwind-Klassen.
- **Nebenbefund, live mitgefixt:** Auf dem Server lag noch die April-Fassung von `index.html`.
  Deren DSGVO-FAQ behauptete „Keine US-Cloud-Dienste für personenbezogene Daten", obwohl Warteliste
  (Google Apps Script) und Mailversand (Resend) laufen. Die korrigierte Fassung lag seit 01.07.
  ungenutzt im Repo und ist jetzt mit ausgeliefert.
- **Offener Bugfund (nicht angefasst, vorher schon so):** Das Icon `qr_code_2` in der
  SpiritLink-Sektion ligiert nicht und rendert als Text (245 px breit statt 60). Identisch in alt
  und neu — also keine Regression, aber zu fixen.
- Backup der Live-Fassung auf dem Server: `/opt/aethernal/landingpage/index.html.bak-2026-08-13-vor-perf`.

## 2026-07-19
- **UI-Fixes aus dem Browser-Rundgang** (`0fb5a1e`, deployed): Foto-**Lightbox** (klickbare Galerien mit Vollbild, Pfeiltasten/ESC — Gedenkprofil + SpiritLink, neue `components/photo-lightbox.tsx`); „Fotos"-Tab zeigt View-Galerie statt Editor; veralteter „Versand nicht aktiv"-Hinweis entfernt (B7-Rest ✓); Zoom erlaubt + Heading-Reihenfolge gefixt (A11y). **Avatar-„Bug" aufgeklärt:** Rendering war intakt — Demo-Platzhalter waren konturlos (ersetzt durch Landschafts-Motive), Bestandskonten haben schlicht nie ein Foto gespeichert (`profile_photo_url` NULL); B0-Upload-Pfad dabei end-to-end unter RLS verifiziert. Umsetzungspläne für Gästebuch/Profil-Sektionen/Kalender-Export/Nachrichten-Anhänge in `docs/BACKLOG.md` ergänzt (nichts davon gebaut)
- **Vorzeige-Demo-Account angelegt** (`fabian.fehervary+demo@gmail.com`, „Maria Aigner"): Profil komplett (Avatar, Anzeigename, Onboarding), 2 Memorials (Elisabeth Aigner/Mensch + Balu/Tier, beide öffentlich mit Biografien + 5 Verlaufs-Platzhalterfotos im Storage), 4 herzliche Nachrichten (2× date weit in der Zukunft, 2× death — nichts davon versendet), 2 bestätigte Vertrauenspersonen, 3 Tagebucheinträge, 2 Jahrestage. Hinweis: „Über mich"-Bio/Ort existieren im Datenmodell nicht (profiles hat keine solchen Spalten)
- **Lighthouse (authentifiziert, Prod):** Accessibility 94/94/92 auf Dashboard/Memorial-Detail/Nachrichten → **A8-Ziel ≥ 90 erfüllt** (einziger wiederkehrender Befund: `user-scalable=no`/`maximum-scale` im Viewport-Meta; Nachrichten zusätzlich 1× Heading-Reihenfolge). Performance 55/66/83 — Hauptbremsen: Server-TTFB bis 1,8 s (Frankfurt→VPS SSR ohne Caching) und LCP bis 9,5 s, dazu ~44 KiB ungenutztes JS
- **B4 Konto-Löschung end-to-end bestanden:** Wegwerf-Konto mit Memorial + Nachricht + Tagebuch + Storage-Foto über die ECHTE Route `/api/account/delete` gelöscht → Auth-User 404, 0 DB-Zeilen (Cascade), Storage-Ordner leer, Login danach unmöglich. Bestandskonten + Demo unberührt
- **death-Zustellmail würdevoll umrahmt** (Entscheidung Fabian, siehe DECISIONS): Absender-Anzeigename „{Name} über Aethernal", Intro „…hat {Name} zu Lebzeiten für dich geschrieben…" (Genitiv-Helper, genitivfreier Fallback ohne Profilname), Nachricht mit Goldlinie abgesetzt, Abschluss „In stiller Verbundenheit, Aethernal" statt Paketverfolgungs-Fußzeile; date-Zweig bekommt ebenfalls den persönlichen Absendernamen; Owner-Name aus `profiles.full_name` (gecacht). Function redeployt, Live-Testversand über echten death-Pfad ok (`sent:1`, Wegwerf-Daten danach entfernt — dabei nebenbei live bestätigt: der 20260719-Signup-Trigger legt Profile korrekt an)
- **Schema-Drift Repo ↔ Prod behoben (nur Repo-Dateien):** Prod read-only introspiziert — Befund: zwei Schema-Generationen übereinander; die frühere App-Iteration hinterließ 13 Legacy-Tabellen + 9 Enums (alle leer bis auf 3 Seed-Zeilen `subscription_plans`), und die heutige App nutzt deren `profiles` weiter. `supabase/migration.sql` §1 auf die echte Prod-Definition gebracht (email NOT NULL + Index, display_name/phone/locale/guide_type, Enum-Guard, gefixter `handle_new_user`); vollständiger Befund + Legacy-Inventar + Empfehlung in `docs/SCHEMA_DRIFT_2026-07-19.md`. Übrige App-Tabellen waren deckungsgleich. An Prod nichts geändert
- **B2-Rest-Test bestanden:** E-Mail-Änderungs-Trigger verifiziert (Wegwerf-Daten, danach entfernt) — E-Mail-Wechsel einer bestätigten Vertrauensperson resettet `confirmed`/`confirmed_at`/`invited_at`/Token automatisch; Updates ohne E-Mail-Änderung lassen die Bestätigung unberührt
- **★ Death-Journey-Probe end-to-end BESTANDEN** (B2+B3 live, Wegwerf-Konto + Plus-Aliasse, danach rückstandsfrei entfernt): Einladung über echte Invite-Route → Bestätigung (`confirmed`, Einmal-Token) → Melde-Link → Todesmeldung (Karenz exakt +7 Tage, Melde-Token einmalig) → Warn-Mail mit Widerrufslink → Widerruf greift: Scheduler ignoriert stornierten Report nachweislich auch bei künstlich überfälligem `effective_at` (Adversarial-Check, `death: reports:0`) → zweiter Report nach Widerruf möglich → `effective_at` vorgezogen → Zustellung an Empfänger (`death sent:1`, Status-Flip, `processed_at`), zweiter Lauf `sent:0` = kein Doppelversand. Prod danach wieder Clean Room (3 Nutzer, 0 messages/trusted_persons/death_reports)
- **Bugfix aus der Probe — `profiles` war in Prod seit März LEER** (`abf87be`): Schema-Drift — Prod-`profiles` hat `email NOT NULL` (+ display_name/phone/locale/guide_type), die zwei(!) vorhandenen Signup-Trigger scheiterten daran bei jedem Signup, der `exception`-Guard verschluckte es still → alle Mails/Seiten fielen auf „Ein Aethernal-Mitglied" zurück, Onboarding-Flag griff nie. Migration `20260719_profiles_signup_trigger.sql` (eingespielt + verifiziert): Funktion befüllt `email`, Duplikat-Trigger entfernt, Backfill aller Bestandskonten (4 Zeilen, `onboarding_done=true`). Dazu kasus-sichere Namens-Fallbacks (Nominativ/Dativ nach „von"/Akkusativ nach „für") in Invite-Mail, Melde-Link-Mail und B2-Bestätigungsseite. **Offen: Repo-Basis-Schema (`supabase/migration.sql`) spiegelt das echte Prod-Schema nicht** — bei Gelegenheit abgleichen
- **Live-End-to-End-Test Nachrichten-Engine bestanden:** Test-Nachricht (date-Trigger, heute fällig) + Test-Erinnerung in Prod angelegt, Edge Function manuell getriggert → `messages sent:1`, `reminders sent:1`, 0 failed; Status-Flip (`sent` + `sent_at`) und `last_sent_on` korrekt gesetzt, kein Doppelversand-Risiko; Testdaten danach rückstandsfrei entfernt. (Resend-Key ist send-only, Zustell-Log per API nicht lesbar — finale Bestätigung: Posteingang)
- **Rechtstexte live deployt** (`46876da`): Kontakt-E-Mail in `impressum.html` + `datenschutz.html` von der Firmen-Adresse (eximie.at) auf die private Gmail umgestellt (Aethernal ist Privatprojekt) und per scp nach `/opt/aethernal/landingpage` gebracht (Backup der Alt-Fassungen in `!zu löschen durchsicht/`); damit sind auch die Rechtstext-Fixes vom 01.07. erstmals live (Server-Stand war von April); `supabase/.temp/` in `.gitignore`
- **★ Etappe 0 SCHARFGESCHALTET — Nachrichten-Engine live** (Start 16.07., Abschluss 19.07.; Details in `docs/DEPLOY_PROTOKOLL_2026-07-19.md`): Edge Function `send-due-messages` deployed; Function-Secrets gesetzt (RESEND_API_KEY, FROM_EMAIL, CRON_SECRET — nur Namen dokumentiert); alle 3 Migrationen (`20260622_scheduler`, `20260714_trusted_person_confirmation`, `20260714_death_reports`) im SQL-Editor eingespielt + verifiziert (6 Spalten, `death_reports`, 7 Indexe); Cron-Job `aethernal-send-due-messages` aktiv (täglich 06:00 UTC); VPS auf `fb01c89` aktualisiert (echter App-Ordner ist `/opt/aethernal/app`), Server-`.env` um RESEND_API_KEY + FROM_EMAIL ergänzt, Container neu gebaut, `app.aethernal.me` erreichbar; lokale `.env.local` angelegt (Dev-Tests jetzt möglich); Smoke-Test der Function grün (HTTP 200, nichts fällig)
- Migrationen `20260714_*` idempotent gemacht (`DROP POLICY IF EXISTS` vor `CREATE POLICY` — Postgres kennt dort kein `IF NOT EXISTS`); Commit ausstehend (Freigabe Fabian)
- Befunde auf dem VPS: Repo-`deploy.sh` zeigt auf falschen Ordner (Fix ausstehend); Live-Edits an `index.html`/`impressum.html` lagen nur auf dem Server → gesichert nach `/opt/aethernal/!zu löschen durchsicht/2026-07-19-app-repo-edits/` + git stash

## 2026-07-14
- **B3 ★ Todesbestätigungs-Flow (Code komplett, Live-Test + Wortlaut-Review ausstehend):** Karenzzeit-Modell (7 Tage, siehe `DECISIONS.md`); Migration `20260714_death_reports.sql` (Report-Tabelle, ein aktiver Report pro Nutzer, RLS); öffentliche Seiten `/vertrauen/todesfall` (Link anfordern, Enumeration-sicher), `…/bestaetigen` (Zwei-Schritt-Meldung, startet Karenz + Warn-Mail mit Widerrufslink an den Nutzer), `…/widerruf` („Ich lebe"); Scheduler-Function um Sektion 4 erweitert: fällige Reports lösen `death`-Nachrichten über DIESELBE Send-Routine aus (Doppelversand-Schutz via Status-Flip, weich abgesichert falls Migration fehlt, `deno check` grün); gemeinsame `/vertrauen`-Shell für B2+B3
- **B2 Vertrauenspersonen-Einladung/Bestätigung (Code komplett, Live-Test ausstehend):** Migration `20260714_trusted_person_confirmation.sql` (Token-Hash-Spalten, getrennte RLS-Policies statt `FOR ALL`, Trigger: E-Mail-Änderung resettet Bestätigung); Invite-Route `api/trusted-persons/invite` (Resend, nur Token-Hash in der DB, 14 Tage gültig); öffentliche Bestätigungsseite `/vertrauen/bestaetigen` mit Zwei-Schritt-Confirm (Mail-Scanner-sicher); UI: Einladung automatisch nach Anlegen + „Einladung senden" im Menü + Re-Invite nach E-Mail-Änderung; Mail-Wortlaut = Vorschlag, Review Fabian
- **B7 (Teil):** Nachrichten-Statistik auf der Memorial-Detailseite zählt jetzt echt aus der DB (Platzhalter ersetzt); „Versand"-Banner bleiben bis Scheduler live
- **B4 Konto-Löschung serverseitig (DSGVO):** neue Route `app/api/account/delete` (Service-Role-Key NUR serverseitig): löscht alle Storage-Fotos unter `{uid}/`, dann den Auth-User via Admin-API (Cascade räumt alle DB-Zeilen); `settings-form` ruft die Route statt der unvollständigen Client-Löschung; klare Fehlermeldung, falls Server noch nicht konfiguriert (503); `SUPABASE_SERVICE_ROLE_KEY` in `.env.example` dokumentiert. **Live-Test + Server-Env durch Fabian ausstehend**
- **B6 GA4 + Cookie-Consent (App):** Consent-Banner (Ablehnen gleichwertig, Wahl persistent in `aethernal_cookie_consent` — gleiche Keys/Werte wie die Landing Page); GA4 `G-FT3WYB9Z4T` wird ERST nach „Alle akzeptieren" geladen (`lib/consent.ts`, `anonymize_ip`), Widerruf über echten Schalter in den Einstellungen (setzt `ga-disable`-Flag sofort); dabei gefixt: „Cookie-Einstellungen"/Datenschutz/AGB in den Einstellungen zeigten auf App-interne `/datenschutz`+`/agb`-Routen, die nicht existieren (404) → jetzt Toggle bzw. absolute LP-Links
- **B5 Echter QR-Code + Teilen:** QR wird serverseitig aus der `/s/[slug]`-URL generiert (`qrcode`-Lib, dunkles Aethernal-Blau auf Weiß) und auf der Detailseite angezeigt + als PNG-Download angeboten; „Teilen" nutzt die Web-Share-API mit Copy-Fallback (`ShareLinkButton`); Slug-Bruch behoben: Slug bleibt nach Erstellung stabil (kein Neu-Generieren bei Umbenennung mehr, Hinweis im Edit-Formular; Entscheidung in `DECISIONS.md`)
- **B1 Navigation-/Route-Fix:** echte Übersichtsseite `/gedenkprofile` (Grid aller Memorials via `MemorialCard`, EmptyState, FAB); Nav-Punkt „Gedenkprofile" verlinkt jetzt dorthin statt per Workaround auf `/dashboard` — kein toter Menüpunkt mehr (Entscheidung in `DECISIONS.md`)
- **B0 Profilfoto-Upload repariert:** gemeinsame Logik in `lib/profile-photo.ts` (Validierung JPG/PNG/WebP/GIF ≤ 10 MB, Pfad `{uid}/{memorialId}/profile-{ts}.ext`, alte Datei wird ersetzt, Entfernen setzt Feld null + löscht Storage-Objekt); neue `ProfilePhotoUpload`-Komponente ersetzt den deaktivierten Button in `memorial/[id]/edit`; Onboarding-Schritt 3 ist jetzt ein echter Foto-Picker mit lokaler Vorschau — Upload läuft beim Abschluss über dieselbe Funktion (Fehler blockiert das Onboarding nicht). **Live-Test steht aus** (lokal keine Supabase-Env)
- **A8 Empty States, Motion, A11y (global):** sanftes Gold-Glow-Pulsieren (`animate-glow-pulse`, 4s) als einziger Signature-Moment (Memorial-Hero, SpiritLink, Onboarding-Finish); Toast mit `role="status"`/`aria-live`, Confirm-Dialog als `alertdialog` mit `aria-modal`/labelledby + Escape + Kontrast-Fix (Lösch-Button war Weiß-auf-Rosa → `text-on-error`); alle Icon-only-Buttons mit `aria-label` (statt `title`, inkl. kaputtem `L&ouml;schen`-Entity); `not-found`: nicht existentes `dove`-Icon → `potted_plant`, verbotener Alt-Name „Digital Sanctuary" → „Ewige Erinnerung"; `/40`-Microtexte auf `/60` angehoben; letzte Off-Scale-Durations entfernt. **Track A (A0–A8) damit abgeschlossen.** Offen zur Verifikation durch Fabian: Lighthouse-A11y ≥ 90 (lokal ohne Supabase-Env nicht messbar)
- **A7 SpiritLink-Seite (`/s/[slug]`):** Desktop-Layout ergänzt (breitere Komposition, Galerie als 3er-Grid, mobil weiter Snap-Scroll); Galerie mit `grayscale→Farbe`-Hover + Caption-Overlay; Ornament-Divider jetzt `potted_plant` statt `diamond`; Fallback-Icon konsistent mit A4 (`potted_plant`/`pets` in gedämpftem Gold); Sektions-Eyebrows („Lebensgeschichte"/„Erinnerungen"); Footer mit Wortmarke (Sparkle + Serif-Italic), Gold-Gradient-CTA und einheitlicher Tagline „Ewige Erinnerung"; sauberer Ladezustand (`loading.tsx`); Gold-Left-Border an der Biografie entfernt (Profil-Objekten vorbehalten). CD-Naturbild bewusst NICHT eingebaut (Stock-Lizenz unklar) — Layer-Platz im Code vorbereitet
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
