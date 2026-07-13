# ANLEITUNG — So fährst du die Mission mit Fable 5

*Für dich, Fabian. Kurz und praktisch. Ausführung passiert in **Claude Code** im Repo `aethernal/`, Modell **Fable 5**. Dieses Cowork-Fenster = Planung; hier drin liegt jetzt das fertige Spec-Paket.*

## Was hier liegt (`aethernal/docs/redesign/`)
- **`00_MISSION.md`** — die Steuer-Datei (Regeln, Reihenfolge, Checkpoints). Fable liest die zuerst.
- `01_DESIGN_SYSTEM.md` · `02_SCREENS.md` · `03_FUNKTIONEN.md` · `04_SCHEMA.md` — die Details.

## Vorher (deine To-dos — Reihenfolge zählt)

**Für Track A (Design): NICHTS nötig.** Kann sofort starten.

**Bevor irgendwer/-was neuen Zugriff auf die DB bekommt — und vor Track B:**
1. 🔴 **GitHub-Token widerrufen** (github.com/settings/tokens) — liegt im Klartext in `!zu löschen durchsicht/_LÖSCHEN/…`.
2. 🔴 **Supabase-Keys rotieren** (Anon + Service-Role, Supabase-Dashboard) → neuen Key in die VPS-`.env`. Grund: der alte Service-Role-Key lag zeitweise im GDrive-Sync.

**Zusätzlich für Track B (Nachrichten-Engine live):**
3. `supabase/config.toml`: echte `project_id`/Project-Ref eintragen.
4. Drei Secrets setzen: `RESEND_API_KEY`, `FROM_EMAIL` (`hallo@aethernal.me`), `CRON_SECRET`.
5. Scheduler deployen (Edge-Function + Migration + `setup-cron.sql`) + Live-Test. → dann kann B2/B3 real Mails schicken.

## Start in Claude Code
1. Repo `aethernal/` in Claude Code öffnen, Modell **Fable 5** wählen.
2. Diesen Prompt geben:
   > „Lies `docs/redesign/00_MISSION.md` vollständig, dann die referenzierten Specs. Arbeite **Track A** der Reihe nach ab (A0 zuerst). **Ein Commit pro Paket**, nach jedem Paket `npm run build` grün halten und **anhalten für meinen Review**. Halte alle harten Regeln aus Abschnitt 2 ein."
3. Willst du weniger Unterbrechungen: „… arbeite **autonom bis zum Ende von Track A**, ein Commit pro Paket, halt nur bei Unklarheit oder rotem Build."
4. Track B startest du genauso, aber **erst nach** den To-dos oben — und B3 (Todesbestätigung) wird Fable bewusst mit dir abstimmen, bevor sie baut.

## Dein Review-Rhythmus (pro Paket)
- `git diff` des Paket-Commits überfliegen · `npm run dev` starten, den Screen anschauen · passt es → weiter; passt es nicht → **`git revert <commit>`** und Fable nachbessern lassen. Ein Paket = ein Commit heißt: jeder Schritt ist einzeln zurückrollbar.

## Reihenfolge auf einen Blick
**Jetzt:** Track A (A0→A8), parallel B0/B1 (unabhängig). **Nach Keys/Secrets:** B2 → **B3 ★** → B4 → B5 → B6 → B7. Etappe-4-Features (Stripe/AI/B2B/Plaketten) bleiben bewusst draußen — sag Bescheid, wenn du eins davon doch reinnehmen willst.
