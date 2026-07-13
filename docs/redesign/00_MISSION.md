# AETHERNAL — REDESIGN- & LAUNCH-MISSION (Claude Code / Fable 5)

*Erstellt 13.07.2026 in Cowork. **Dies ist die Steuer-Datei.** Fable liest zuerst diese Datei, dann die referenzierten Specs, dann arbeitet sie die Arbeitspakete der Reihe nach ab — ein Paket = ein Commit.*

---

## 0. Zuerst lesen (Pflicht-Kontext, in dieser Reihenfolge)
1. `aethernal/CLAUDE.md` · `docs/ROADMAP.md` · `docs/CHANGELOG.md` · `docs/DECISIONS.md`
2. `../00_Projekt/SCHLACHTPLAN.md` + `../00_Projekt/AUDIT_2026-07-01.md` (Richtung & bekannte Befunde)
3. Dieses Paket: `01_DESIGN_SYSTEM.md`, `02_SCREENS.md`, `03_FUNKTIONEN.md`, `04_SCHEMA.md`

## 1. Nordstern (ändert sich nicht)
Aethernal bewahrt die Erinnerung an verstorbene Menschen & Tiere. Kernversprechen: **Eine Person nimmt eine Nachricht auf, und sie kommt zum richtigen Zeitpunkt beim richtigen Empfänger an — auch im Todesfall.** Jedes Arbeitspaket dient entweder (a) diesem Versprechen oder (b) der Würde/Wertigkeit, mit der es erlebt wird. Nichts anderes.

## 2. Harte Regeln (nicht verhandelbar)
1. **Kernversprechen schützen.** Der Zustell-Pfad — Tabelle `messages` + Scheduler-Edge-Function `supabase/functions/send-due-messages` — ist bereits gebaut, gehärtet und logik-getestet. **NICHT neu schreiben.** Nur integrieren/erweitern, und nur mit explizitem Test. Vor jeder Änderung daran: den bestehenden Code lesen.
2. **Scope-Grenze.** KEINE Etappe-4-Features (Stripe/Bezahlung, AI-Textgeneratoren, B2B-Bundle, physische Produkte). Führt ein Paket dorthin → **STOP**, in CHANGELOG notieren, Fabian fragen.
3. **Ein Arbeitspaket = ein Commit.** Aussagekräftige Message (`feat(ui): …`, `fix(auth): …`). Nach jedem Paket muss `npm run build` grün sein. Kein paketübergreifender Riesen-Commit.
4. **Nur Design-Tokens.** Farben/Radius/Spacing ausschließlich aus `app/globals.css`. **Verboten:** `text-yellow-*`, `text-slate-*`, `bg-slate-*` und andere Fremd-Paletten — sie brechen das bewusst *warme* System.
5. **Sicherheit nicht schwächen.** RLS-Policies, Auth-Guards, Redirect-Validierung bleiben intakt. **Niemals** Secrets/Keys/`.env` committen.
6. **Deutsch, konsistent.** UI-Sprache Deutsch; ein Vokabular (siehe `01_DESIGN_SYSTEM.md` → Navigation).
7. **Bei Produkt-/Rechtsentscheidungen fragen, nicht raten** (z. B. Wortlaut Todesbestätigung, Löschfristen, Haftungstexte).
8. **Nichts hart löschen.** Was raus soll → in `_alt/` verschieben, nicht entfernen.

## 3. Checkpoint-Protokoll (pro Paket)
1. Paket-Spec lesen (Ist→Soll + Akzeptanzkriterien).
2. Umsetzen.
3. `npm run build` (grün?) + `npm run dev` kurz sichten.
4. **Ein Commit** für das Paket.
5. Eine Zeile in `docs/CHANGELOG.md`.
6. **HALT für Fabians Review** — außer er hat „autonom bis Track-Ende" freigegeben.

→ Rollback jederzeit: `git revert <commit>` des betroffenen Pakets. Deshalb ein Paket = ein Commit.

## 4. Reihenfolge der Arbeitspakete

### TRACK A — Design (JETZT möglich, braucht KEINE Secrets)
Details/Akzeptanz: `01_DESIGN_SYSTEM.md` (A0) + `02_SCREENS.md` (A1–A8).

- **A0 — Fundament:** Design-System in `globals.css` konsolidieren (eine Token-Wahrheit, Radius-/Icon-/Motion-Skala, sichtbarer Fokus-Ring, `prefers-reduced-motion`). *Alle folgenden Pakete bauen darauf auf.*
- **A1** App-Shell & Navigation (Desktop-Sidebar + Mobile-Bottom-Nav vereinheitlichen)
- **A2** Dashboard · **A3** Auth + Onboarding · **A4** Memorial (new / [id] / edit)
- **A5** Nachrichten + Vertrauenspersonen (nur UI) · **A6** Tagebuch + Termine
- **A7** Öffentliche SpiritLink-Seite `/s/[slug]`
- **A8** Empty States, Motion-Politur, Barrierefreiheits-Durchlauf (global)

### TRACK B — Launch-kritische Funktionen (nach Fabians Key-Rotation & Secrets)
Details/Akzeptanz: `03_FUNKTIONEN.md`.

- **B0** Profilfoto-Upload reparieren *(unabhängig — darf parallel zu Track A laufen)*
- **B1** Navigation-/Route-Fixes: toter „Gedenkprofile"-Link, Mobile „Mehr" *(unabhängig)*
- **B2** Vertrauenspersonen konsolidieren + Einladungs-/Bestätigungs-Mail
- **B3 ★** Todesbestätigungs-Flow (sicherer Token-Link → death-getriggerte Nachrichten). **Das ist der Kern.**
- **B4** Konto-Löschung serverseitig vollständig (Auth-Account + Storage-Fotos). DSGVO.
- **B5** Echter QR-Code + Teilen (Copy/Web-Share) für SpiritLink
- **B6** GA4 (`G-FT3WYB9Z4T`) + Cookie-Consent (App)
- **B7** Echte „Nachrichten"-Statistik + kleinere 🟡-Fixes

## 5. Definition of Done (gesamte Mission)
**Track A:** alle Screens auf einem konsolidierten Design-System, konsistent über Mobile + Desktop, A11y-Grundlagen erfüllt, Build grün. **Track B:** Kernversprechen technisch vollständig (zeitgesteuert **und** Todesfall), DSGVO-konforme Löschung, echter QR, Analytics+Consent. Keine 🔴/🟠-Befunde aus `02_SCREENS.md` / `03_FUNKTIONEN.md` mehr offen.
