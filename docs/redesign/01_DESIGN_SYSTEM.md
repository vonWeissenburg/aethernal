# 01 — DESIGN-SYSTEM (Paket A0 + Referenz für alle A-Pakete)

*Motto: **Stitch behalten, gezielt heben.** `app/globals.css` ist die einzige Token-Wahrheit. Ziel-Gefühl: würdig, warm, ruhig, zeitlos — geborgen, nicht düster. Warmes Gold + warme Taupe-/Oliv-Neutrale gegen ein celestiales Nachtblau.*

## Paket A0 — Fundament (zuerst umsetzen)

**Problem heute:** Es existieren drei leicht divergierende Token-Sätze parallel; Radius-, Icon- und Motion-Skalen schwanken pro Screen; der Fokus-Ring wurde global entfernt. Das ist die größte Bremse für „Wertigkeit".

**A0-Aufgaben:**
1. **Eine Token-Wahrheit.** Alles zieht aus `globals.css`. Generische Stitch-Screens, die `surface == background == #11131d` und keine Karten-Elevation haben, auf die echte Hierarchie heben: Canvas `background #0B0D17`, eigenständige `card #1C1F33`.
2. **Primary festnageln:** `#F2CA50` = `primary`, `#D4AF37` = `primary-container`/Hover — überall. (Der Screen `dashboard_consistent` nutzt fälschlich `#D4AF37` als primary → Gold kippt je Screen. Korrigieren.)
3. **Fremd-Paletten entfernen:** kein `text-yellow-*`, `text-slate-*`, `bg-slate-*`. Nur Tokens.
4. **Radius-Skala definieren:** `--radius-card: 12px`, `--radius-button: 8px`, Pills `full`. Schwanken (lg 0.5↔1rem, xl 0.75↔1.5rem) beenden.
5. **Icon-System:** Material Symbols Outlined, **`wght 300` durchgängig** (dünn, edel). `FILL 1` **nur** für aktive/ausgewählte Zustände.
6. **Fokus-Ring wieder einführen:** sichtbarer `ring-primary` auf allen interaktiven Elementen (globaler `:focus-visible`).
7. **Motion-Skala + `prefers-reduced-motion`:** `--motion-fast 150ms`, `--motion-base 250ms`, `--motion-slow 400ms`, `ease-out`. Bei `prefers-reduced-motion` alle Transitions/Animationen aus.
8. **Elevation-Konvention:** Surface-Stufe + optional **eine** warme 1px-Hairline (`outline-variant`); Gold-Left-Border (`border-l-4 border-primary`) **nur** für „Profil"-Objekte.

**A0-Akzeptanz:** `globals.css` enthält Radius-/Motion-Tokens; `grep -rE "yellow-|slate-"` in `app/` liefert 0 Treffer; `:focus-visible` sichtbar; ein Gold-Wert überall identisch; Build grün.

---

## Farb-Tokens (Ist = Soll, aus globals.css)
| Rolle | Token | Hex |
|---|---|---|
| Canvas | `background` | `#0B0D17` |
| Fläche/Basis | `surface` / `surface-dim` | `#11131D` |
| Mulde tiefste | `surface-container-lowest` | `#0C0E18` |
| Karte ruhig | `surface-container-low` | `#191B26` |
| Karte Standard/Input | `surface-container` | `#1D1F2A` |
| Hover / aktiv Segment | `surface-container-high` | `#282934` |
| höchste Fläche | `surface-container-highest` | `#32343F` |
| **Karte (Signatur)** | `card` / `card-hover` | `#1C1F33` / `#25283D` |
| **Primary Gold** | `primary` | `#F2CA50` |
| Gold tief / Hover | `primary-container` | `#D4AF37` |
| Schrift auf Gold | `on-primary` | `#3C2F00` |
| **Tertiär (Nachthimmel)** | `tertiary` | `#BFCDFF` |
| Text primär | `on-surface` | `#E1E1F0` |
| **Text sekundär (warm!)** | `on-surface-variant` | `#D0C5AF` |
| Outline warm | `outline` / `outline-variant` | `#99907C` / `#4D4635` |
| Erfolg / Warnung / Fehler | `success`/`warning`/`error` | `#4CAF7D`/`#EAC249`/`#FFB4AB` |

**Regel:** Neutrale sind bewusst *warm* (Taupe/Oliv), nicht kühles Grau. Gold ist reserviert für echte Aktionen/Marke — für sekundäre Infos/Links das ungenutzte **Tertiär-Blau** aktivieren, dann wirkt Gold wertiger.

## Typografie
- **Headline/Zitat:** `Noto Serif` (inkl. *Italic* für Wortmarke & Zitate). Gewichte 300/400/600/700.
- **Body/Label:** `Inter` 300–700.
- Skala: Desktop-Greeting 6xl · Mobile-Hero 4xl · Profilname 3xl · Wortmarke/Sektion 2xl · Kartentitel xl · Body 14px `leading-relaxed` · Eyebrow/Meta 10–12px.
- Signatur-Muster: **Eyebrow-Labels** (Inter, uppercase, `tracking-[0.2em]`, `on-surface-variant`); **Zitate** (Noto Serif italic, gedimmt); **Stat-Zahlen** (große Serif + Uppercase-Mini-Label); Mono nur für URLs/Hex.
- Wortmarke „Aethernal" **einheitlich**: Sparkle `auto_awesome` + Noto Serif *Italic*. Eine Tagline, eine Domain (`aethernal.me`). (Alt-Namen „Eternal Sanctuary/Sanctuary/RestInPhotos/Hades" aus der UI entfernen.)

## Kern-Komponenten (Konventionen)
- **Buttons:** (1) Primär solid `bg-primary text-on-primary` `rounded-[button]` + Inset-Highlight + `active:scale-[.98]`; (2) Haupt-CTA Gradient `from-primary to-primary-container` + `shadow-primary/20`; (3) Outline `border-primary text-primary bg-primary/5`; (4) Ghost `text-on-surface-variant → hover:text-primary`; (5) Pill (`rounded-full`); (6) **FAB** Gold + Gold-Glow, mobil `w-14`, Desktop `w-20`.
- **Cards:** Standard `bg-card rounded-[card]` + optional Hairline; **Profilkarte** mit `border-l-4 border-primary`; **Diary-Karte** (Datum-Eyebrow + Serif-Titel + `line-clamp-2` + Mood-Emoji + Hover-„Weiterlesen"); **Stat-Karte** (Serif-Zahlen); **Auswahl-Trigger** (`border-2 border-primary` aktiv + großes gedämpftes Hintergrund-Icon).
- **Navigation:** Desktop-Sidebar `w-72` bg `#0B0D17`, aktiv = `text-primary` + `border-r-2 border-primary` + `bg-primary/5`; Mobile-Bottom-Nav Glass + `rounded-t-2xl` + Aufwärts-Schatten, **feste 5 Items**, aktiv = Pill `bg-primary/10` + `text-primary` + `FILL 1`. **Ein** Home-Icon (nicht church/dashboard/grid_view/temple_hindu mischen). Labels deutsch & einheitlich: *Start · Gedenkprofile · Nachrichten · Tagebuch · Termine* (+ Einstellungen).
- **Inputs:** `bg-surface-container border-none rounded-[button] p-4`, `focus:ring-2 ring-primary/50`, Eyebrow-Label darüber (Fokus → Gold), Fehler = `ring-error` + Icon + Hinweis. Segmented-Toggle (aktiv `surface-container-high` + `text-primary`).
- **Chips/Badges:** Info-Pills (`bg-surface-container-lowest` + Hairline + Icon + Mini-Label); Status „Aktiv" (`primary/10`), „Privat/Geteilt", Verified (Gold-Kreis + `verified`).
- **Empty States:** eigene, würdevolle Komponente (siehe A8) statt nacktem „0 Einträge".

## Bildsprache (Corporate Design)
Quelle `../02_Design/corporate-design/` (noch nicht in Code): warme Natur/Tiere/**Vergissmeinnicht**/ruhiges Meer/goldenes Licht — tröstliches Gegengewicht zum Dark-Theme. Ornamente: Divider = Gradient-Hairline + zentriertes `potted_plant`; radialer Gold-Glow; **`grayscale→Farbe`-Hover** als Signature-Interaktion (breiter nutzen). **Avatar-Platzhalter „raven" ersetzen** (düster, off-brand) → Monogramm oder dezentes Vergissmeinnicht-/`potted_plant`-Motiv in gedämpftem Gold.

## Aufwertungs-Leitplanken (das „Heben" in „Stitch aufwerten")
Tiefe durch echte Surface-Hierarchie · Tertiär-Blau aktivieren · konsistente Radien/Icons · sanftes Kerzen-/Gold-Glow-Pulsieren als *einer* ruhiger Signature-Moment · Shimmer **nur** auf der Wortmarke · CD-Naturbilder als leise Hero-/Empty-Hintergründe · durchgängige, ruhige Motion (`ease-out`, reduzierte Dauern) · sichtbarer Fokus & ausreichende Kontraste (Opacity-Texte `/40–/60` prüfen), Tap-Targets ≥ 44px + `pb-safe`.
