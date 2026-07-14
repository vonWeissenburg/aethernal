# Offen für Fabian — Übergabe nach Redesign-Mission (Stand 14.07.2026)

*Alles, was Claude nicht ohne dich erledigen kann. Sortiert nach Dringlichkeit.
Code-Stand: Track A komplett (A0–A8), Track B: B0, B1, B2*, B4*, B5, B6, B7-Teil
(* = Code fertig, Live-Test ausstehend). Es fehlt nur noch B3 (Todesbestätigung)
und der B7-Rest.*

---

## 1. Sicherheit — Empfehlung Key-Rotation (deine Entscheidung: aktuell NICHT rotieren)

Du hast entschieden, vorerst **keine** Token-/Key-Rotation zu machen. Zur
Einordnung, damit die Entscheidung bewusst bleibt (Audit 01.07., P0):

- Ein GitHub-Token und der **Supabase Service-Role-Key** (= Vollzugriff auf alle
  Nutzerdaten, umgeht RLS) lagen im Klartext in `!zu löschen durchsicht/_LÖSCHEN/`.
- Git-Historie ist sauber (nie committet), **aber** der Ordner lag zeitweise im
  GDrive-Sync. Rotation wäre 10 Minuten Arbeit: GitHub → Settings → Tokens
  (widerrufen); Supabase → Settings → API → „Reset" bei service_role + anon,
  danach neue Keys in VPS-`.env` eintragen.
- Bis zur Rotation gilt: Der alte Service-Role-Key funktioniert weiter — falls
  ihn je jemand aus dem Sync gezogen hat, hat er Vollzugriff.

→ **Meine Empfehlung bleibt: rotieren.** Wenn nicht: den `_LÖSCHEN`-Ordner
endgültig löschen und aus jedem Cloud-Sync nehmen.

## 2. Server-/Secrets-Setup (Voraussetzung für alle Live-Tests)

**A) App-Server (VPS-`.env` bzw. lokale `.env.local`):**
```
NEXT_PUBLIC_SUPABASE_URL=…        (Supabase → Settings → API)
NEXT_PUBLIC_SUPABASE_ANON_KEY=…
NEXT_PUBLIC_APP_URL=https://app.aethernal.me
SUPABASE_SERVICE_ROLE_KEY=…       (NUR Server! Für Konto-Löschung B4 + Bestätigung B2)
RESEND_API_KEY=re_…               (Für Einladungs-Mails B2)
FROM_EMAIL="Aethernal <noreply@aethernal.me>"
```
Eine lokale `.env.local` (gleiche Variablen) brauche ich außerdem, um künftig
im Dev-Server zu sichten und Live-Tests selbst zu fahren.

**B) Supabase (Scheduler, Etappe 0 aus dem Schlachtplan):**
1. `supabase/config.toml`: `project_id` eintragen (steht auf Platzhalter).
2. `supabase secrets set RESEND_API_KEY=… FROM_EMAIL=… CRON_SECRET=…`
3. Edge Function deployen: `supabase functions deploy send-due-messages`
4. Migrationen einspielen: `supabase db push` (bringt `20260622_scheduler.sql`
   **und** die neue `20260714_trusted_person_confirmation.sql`), dann
   `setup-cron.sql` im SQL-Editor ausführen (CRON_SECRET einsetzen).

## 3. Live-Tests (nach Punkt 2 — sag Bescheid, ich mache sie gern mit dir)

- [ ] **Scheduler:** Testnachricht mit Datum „heute" anlegen → kommt die Mail? Erinnerung testen.
- [ ] **B0 Profilfoto:** hochladen → erscheint auf Detail/Dashboard/SpiritLink? Entfernen → weg (auch im Storage-Bucket prüfen).
- [ ] **B2 Einladung:** Vertrauensperson anlegen → Mail kommt → Link öffnen → „Rolle bestätigen" → Status „Bestätigt". Danach E-Mail der Person ändern → Status muss auf „Ausstehend" zurückspringen.
- [ ] **B4 Konto-Löschung:** mit einem WEGWERF-Testkonto! Danach prüfen: Login unmöglich, keine DB-Zeilen, Storage-Ordner leer.
- [ ] **QR-Code (B5)** einmal mit dem Handy scannen.
- [ ] **Lighthouse** auf Dashboard + SpiritLink: Accessibility ≥ 90 (A8-Akzeptanz).

## 4. B3 Todesbestätigung — deine Entscheidungen (der Kern, danach baue ich)

Die Spec verlangt ausdrücklich Abstimmung vor Umsetzung. Entscheide bitte:

**A) Missbrauchsschutz-Modell** — mein Vorschlag ist Modell 2:
1. *Einfach:* 1 bestätigte Vertrauensperson bestätigt → Nachrichten gehen sofort raus. (Schnell, aber eine Falschbestätigung wirkt sofort — größter anzunehmender Schaden.)
2. *Karenzzeit (Empfehlung):* Bestätigung startet eine **Frist von z. B. 7 Tagen**. Der Nutzer bekommt sofort E-Mails („Dein Tod wurde gemeldet — wenn das falsch ist, klicke hier"). Ein Login oder Widerrufs-Klick bricht ab. Erst nach Ablauf gehen die Nachrichten raus. (Guter Schutz, moderater Aufwand.)
3. *Mehrere Personen:* ≥ 2 bestätigte Vertrauenspersonen müssen unabhängig bestätigen. (Stärkster Schutz, aber viele Nutzer haben nur 1 Person → Feature faktisch tot. Ggf. als Option pro Konto.)

**B) Karenzzeit-Dauer** (wenn Modell 2): 3 / 7 / 14 Tage?

**C) Wortlaut** (Texte, die ich dir zur Freigabe vorlege, sobald A/B feststehen):
Bestätigungsseite für die Vertrauensperson (pietätvoll, aber unmissverständlich),
Warn-Mails an den Nutzer, Widerrufsseite, Mail an Empfänger der Nachrichten.

**D) Rechtlich klären** (siehe Punkt 5): Haftung bei Falschbestätigung, was
passiert mit dem Konto nach bestätigtem Tod (einfrieren? Gedenkmodus?).

## 5. Recht & Texte (Mensch/Anwalt, aus Audit P3 — vor Launch)

- [ ] **Anwalts-Review** (~1–2 h): Datenschutz (Daten Verstorbener, Daten Dritter — Nachrichten-Empfänger & Vertrauenspersonen!), AGB (Zustellung/Haftung, digitaler Nachlass, Missbrauch Todesbestätigung), Widerruf. Textentwürfe kann ich liefern.
- [ ] **Impressum** vervollständigen (Adresse, Bezirksgericht); WKO/BH Baden wegen Gewerbe-Frage als Privatperson.
- [ ] **B2-Mail-Wortlaut reviewen**: Betreff „{Name} möchte dich als Vertrauensperson eintragen" + Text in `app/api/trusted-persons/invite/route.ts` — ist ein Vorschlag von mir.
- [ ] **Landing Page**: Rechtstexte-Fixes vom 01.07. brauchen noch den SCP-Redeploy; GA4 lädt auf der LP noch gar nicht (Banner existiert nur) — sag Bescheid, ob ich das LP-HTML ergänzen soll.

## 6. Kleineres / Gelegenheiten

- [ ] **CD-Naturbild für die SpiritLink-Seite:** In `02_Design/corporate-design/Bilderwelten` liegen Envato-/AdobeStock-Dateien (teils „Preview"). Prüfe die Web-Lizenz und gib mir EIN Bild frei (Empfehlung: Vergissmeinnicht) — Einbau-Platz ist im Code vorbereitet.
- [ ] **B7-Rest:** Sobald der Scheduler live ist, sag Bescheid → ich entferne die „Versand ist noch nicht aktiv"-Hinweise (Nachrichten-Seite).
- [ ] **Markenschutz „Aethernal"** beim ÖPA (Klassen 35, 42, 45) — vor öffentlichem Launch sinnvoll (Schlachtplan).
- [ ] **Pricing-Entscheidung** bleibt bewusst offen bis Etappe 4.

---

*Wenn Punkt 2 erledigt ist, ist die Reihenfolge: Live-Tests (3) → B3-Entscheidungen (4) → ich baue B3 → B7-Rest → Launch-Politur (Etappe 3).*
