# 02 — SCREENS: IST → SOLL + Akzeptanz (Track A)

*Design-Pakete A1–A8. Reine UI/UX — Datenlogik bleibt, außer sie ist als Track-B-Fix markiert. Jeder Screen: kurze Ist-Notiz, Soll (Aufwertung nach `01_DESIGN_SYSTEM.md`), Akzeptanz. 🔴/🟠 = Baustelle; Funktions-🔴 mit „→B#" gehören in Track B, hier nur visuell vorbereiten.*

---

## A1 — App-Shell & Navigation
**Ist:** `components/app-nav.tsx` pflegt Desktop-Sidebar + Mobile-Top-Header + Mobile-Bottom-Tabbar getrennt; gemischte Icons/Labels; aktiver Zustand uneinheitlich. 🔴 „Gedenkprofile"-Link zeigt auf `/gedenkprofile` — dafür gibt es keine Route (matcht nur `/memorial`), also effektiv tot → Route-Fix = **B1**. 🟡 Mobile-„Mehr" ohne Route.
**Soll:** Ein Nav-Vokabular (deutsch): *Start · Gedenkprofile · Nachrichten · Tagebuch · Termine* + Einstellungen. Desktop-Sidebar `w-72` mit einheitlichem Aktiv-Zustand (`text-primary` + `border-r-2` + `bg-primary/5`); Top-Bar mit Suche (Pill) + Notifications-Dot + Hilfe. Mobile-Bottom-Nav Glass, feste 5 Items, aktiv = Pill + `FILL 1`, `pb-safe`, Tap-Targets ≥44px. Ein Home-Icon.
**Akzeptanz:** identisches Vokabular Desktop/Mobile; kein toter Menüpunkt sichtbar broken; aktiver Zustand überall gleich; Tastatur-Fokus sichtbar.

## A2 — Dashboard  (`/dashboard`)
**Ist:** Zwei komplett getrennte Layout-Bäume (Desktop/Mobile), doppelter Pflegeaufwand. Memorial-Cards, Termine-Widget (Timeline), Schnellzugriff, FAB. 🟠 Mobile-Quick-Action „SpiritLink" führt irreführend auf `/memorial/new`. 🔴 Statistik „Nachrichten" hart `0` → echte Zählung = **B7**.
**Soll:** Gemeinsame Card-/Widget-Komponenten für beide Breakpoints (kein doppelter Baum). Würdevoller Greeting (Serif), Profilkarten mit Gold-Left-Border + Foto/Icon-Fallback, Termine-Timeline mit Gold-Punkt, echter Empty-State wenn kein Memorial. „SpiritLink"-Quick-Action entfernen oder korrekt verlinken.
**Akzeptanz:** ein Satz Card-Komponenten für Desktop+Mobile; keine irreführende Aktion; Stat-Platzhalter kenntlich bis B7; responsiv sauber.

## A3 — Auth + Onboarding
**Screens:** `/login`, `/register`, `/reset-password`, `(auth)/layout`, `/onboarding`.
**Ist:** Glass-Cards, Radial-Gradient-BG, solide. 🟡 Login „oder"-Divider ohne Alternativ-Login (entfernen). 🟠 **Onboarding Step 2 „Foto-Upload" ist Attrappe** — visuell als optionaler Schritt gestalten; echte Upload-Funktion = **B0**. Passwort-Checks inline dupliziert → `lib/validation` nutzen.
**Soll:** Konsistente Auth-Cards nach Design-System; ruhige, einfühlsame Microcopy; Onboarding mit klarer Progress-Bar, Human/Animal-Auswahlkarten (Trigger-Card-Muster), Foto-Schritt ehrlich als „optional, später möglich" bis B0 greift; Finish-Screen mit Feature-Chips.
**Akzeptanz:** kein toter Divider; Onboarding-Fotoschritt nicht mehr irreführend; Validierung über `lib/validation`; Fokus/Fehlerzustände nach System.

## A4 — Gedenkprofile  (`/memorial/new`, `/memorial/[id]`, `/memorial/[id]/edit`)
**Ist:** new sauber. Detail: Hero, Tabs, SpiritLink-Card, Biografie, Foto-Grid, letzte Tagebucheinträge. 🟠 QR = Icon-Platzhalter + „Teilen" nur `<a>` → echter QR/Share = **B5**. 🔴 Detail-Stat „Nachrichten" = 0 → **B7**. edit: 🔴 **Profilfoto-„ändern"-Kreis ist tote Affordance** (kein File-Input) → **B0**; 🟡 caption/order_index ungenutzt; Slug-Bruch bei Umbenennung.
**Soll:** Würdiger Hero (großes Foto mit Gold-Ring, Serif-Name, Lebensspanne, Zitat), Tabs klar, SpiritLink-Card auf echten QR vorbereiten (Platz + Copy-Button-Layout schon anlegen), Foto-Galerie mit sauberer Dropzone + optional Bildunterschrift/Sortier-UI (Anzeige jetzt, Speichern kann B7 füllen), Danger-Zone visuell abgesetzt.
**Akzeptanz:** Foto-„ändern"-Affordance ist als echter Button gestaltet (Funktion B0); QR-/Teilen-Bereich hat finales Layout (Funktion B5); Detail konsistent mit `/s/[slug]`.

## A5 — Nachrichten + Vertrauenspersonen (nur UI)  (`/nachrichten`, `/vertrauenspersonen`)
**Ist:** `/nachrichten` mit Tabs (Meine/Vertrauensperson), `MessageList`, `MessageForm` (Empfänger, Trigger-Karten Datum/„Nach meinem Tod", Live-Vorschau), `TrustedPersonSection`. 🔴 **Zwei divergierende Vertrauenspersonen-UIs** (nur `/vertrauenspersonen` kann editieren) → konsolidieren = **B2**. 🟠 Platzhalter-Banner „Versand in Kürze". 🔴 „Nach dem Tod"-Trigger ohne Auslöser → **B3**.
**Soll:** Eine gemeinsame Vertrauenspersonen-Komponente (visuell vereinheitlicht, hier vorbereiten). Nachrichten-Editor aufwerten: Trigger-Karten als Trigger-Card-Muster (Datum = Gold, „Nach dem Tod" = Tertiär-Blau), Live-Vorschau als würdige E-Mail-Karte, Status-Badges konsistent. Platzhalter-Banner nur zeigen, solange technisch zutreffend (Text neutral halten, kein falsches Versprechen).
**Akzeptanz:** eine Vertrauenspersonen-UI-Komponente (Logik-Merge = B2); Trigger-Typen visuell klar unterschieden; keine irreführende Statusaussage.

## A6 — Tagebuch + Termine  (`/tagebuch*`, `/termine*`)
**Ist:** Tagebuch-Liste (Mood-Emoji, Auszug), neu/bearbeiten mit **nahezu dupliziertem** Formular → gemeinsame Komponente. Termine-Liste (Datums-Block, „Bald"-Badge), reminder-form. 🟡 Tagebuch-Selector lädt clientseitig (leerer Flash).
**Soll:** Gemeinsames Diary-Formular (neu+bearbeiten). Würdige Listen-Cards, Mood als gestaltete Marker (nicht rohe Emojis, oder konsistent gerahmt). Termine-Timeline wie Dashboard. Empty-States (A8).
**Akzeptanz:** ein Diary-Formular-Komponente statt zwei; Listen konsistent mit Dashboard-Cards; kein Selector-Flash (oder Skeleton).

## A7 — Öffentliche SpiritLink-Seite  (`/s/[slug]`)
**Ist:** öffentlich, Profilfoto (meist leer → Icon), Name, Lebensspanne, Beschreibungs-Zitat, Biografie, Foto-Galerie, Footer-CTA.
**Soll:** Das visuelle Aushängeschild — höchste Sorgfalt. Ruhige, sakrale Komposition, CD-Naturbild als leiser Hintergrund, `grayscale→Farbe`-Hover in der Galerie, würdiger Footer-CTA zu `aethernal.me`. Muss mit A4-Detail konsistent wirken. Kein Login-Chrome.
**Akzeptanz:** konsistent mit A4; funktioniert ohne Profilfoto (eleganter Fallback); mobil + Desktop schön; Ladezustand sauber.

## A8 — Empty States, Motion-Politur, Barrierefreiheit (global)
**Soll:** Eine `EmptyState`-Komponente (Vergissmeinnicht-/`potted_plant`-Ornament, einfühlsamer Satz, **eine** klare Aktion) für Dashboard/Memorials/Tagebuch/Termine/Nachrichten. Motion nach A0-Skala vereinheitlichen (Fade-in, sanftes Glow-Pulsieren als einziger Signature-Moment). A11y-Durchlauf: Fokus-Ringe, Kontraste der `/40–/60`-Texte, `aria`-Labels an Icon-Buttons, `prefers-reduced-motion`.
**Akzeptanz:** kein nackter „0 Einträge"-Zustand mehr; Lighthouse-Accessibility ≥ 90 auf Kern-Screens; keine Motion bei `prefers-reduced-motion`.

---

### Track-B-Verweise (hier nur visuell vorbereiten, Logik in `03_FUNKTIONEN.md`)
B0 Profilfoto · B1 „Gedenkprofile"-Route · B2 Vertrauenspersonen-Merge + Mail · B3 Todesbestätigung · B5 QR/Share · B7 echte Statistik.
