# Offen für Fabian — Übergabe nach Redesign-Mission (Stand 19.07.2026)

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

## 2. Server-/Secrets-Setup — ✅ ERLEDIGT 16./19.07.2026

Komplett scharfgeschaltet, Details in `docs/DEPLOY_PROTOKOLL_2026-07-19.md`:
VPS-`.env` (echter Ordner: `/opt/aethernal/app`) vollständig, lokale `.env.local`
angelegt, Function-Secrets gesetzt, Edge Function deployed, alle 3 Migrationen
eingespielt + verifiziert, Cron-Job aktiv (täglich 06:00 UTC), App auf aktuellem
Stand (`fb01c89`), Smoke-Test grün.

## 3. Live-Tests — 🟢 BEREIT, NÄCHSTER SCHRITT (sag Bescheid, ich mache sie gern mit dir)

- [x] **Scheduler:** ✅ 19.07. End-to-End getestet — Testnachricht (date-Trigger, heute) UND Test-Erinnerung angelegt, Function manuell getriggert → beide versendet (`sent:1`/`sent:1`, Status-Flip + `last_sent_on` korrekt), Testdaten wieder entfernt. Empfänger-Postfach (Gmail) bitte einmal gegenchecken.
- [ ] **B0 Profilfoto:** hochladen → erscheint auf Detail/Dashboard/SpiritLink? Entfernen → weg (auch im Storage-Bucket prüfen).
- [x] **B2 Einladung:** ✅ 19.07. live getestet (Death-Journey-Probe): Anlegen → Invite-Route → Mail kam → Bestätigungslink → `confirmed=true`, Token einmalig entwertet. **Rest offen:** E-Mail der Person ändern → Status muss auf „Ausstehend" zurückspringen (Trigger-Test).
- [ ] **B4 Konto-Löschung:** mit einem WEGWERF-Testkonto! Danach prüfen: Login unmöglich, keine DB-Zeilen, Storage-Ordner leer.
- [ ] **QR-Code (B5)** einmal mit dem Handy scannen.
- [ ] **Lighthouse** auf Dashboard + SpiritLink: Accessibility ≥ 90 (A8-Akzeptanz).

## 4. B3 Todesbestätigung — GEBAUT (Karenzzeit-Modell) → dein Review

B3 ist nach Modell 2 umgesetzt (Details in `DECISIONS.md`): Melde-Link per
E-Mail-Anforderung (48 h) → Zwei-Schritt-Bestätigung → **7 Tage Karenzzeit**
mit Warn-Mail + Widerrufslink an dich → erst dann versendet der Scheduler die
death-Nachrichten. Deine Punkte:

- [ ] **Karenzzeit-Dauer absegnen oder ändern** (aktuell 7 Tage — eine Konstante: `GRACE_PERIOD_DAYS` in `lib/death-flow.ts`).
- [ ] **Wortlaute reviewen** (alles meine Vorschläge): Seiten unter `app/vertrauen/todesfall/**` (Melden/Bestätigen/Widerruf) + Warn-Mail an den Nutzer (in `…/bestaetigen/page.tsx`) + Melde-Link-Mail (in `…/todesfall/page.tsx`) + B2-Einladungsmail (`app/api/trusted-persons/invite/route.ts`).
- [x] **End-to-End-Test** ✅ 19.07. komplett bestanden (Wegwerf-Konto + Plus-Aliasse, danach rückstandsfrei entfernt): Einladung → Bestätigung → Melde-Link (48h, einmalig) → Meldung → Karenz exakt +7 Tage → Warn-Mail kam an → (a) Widerruf: `cancelled_at` gesetzt, Scheduler ignoriert stornierten Report nachweislich AUCH bei überfälligem `effective_at`; (b) zweiter Report nach Widerruf möglich, `effective_at` vorgezogen → Zustellung an Empfänger (`death sent:1`), `processed_at` gesetzt, zweiter Lauf `sent:0` (kein Doppelversand). Dabei gefundener Bug (profiles leer → „Ein Aethernal-Mitglied") gefixt: Migration `20260719_profiles_signup_trigger.sql` + kasus-sichere Fallbacks (`abf87be`).
- [ ] **Produktfrage offen:** Was passiert mit dem Konto nach verarbeitetem Todesfall (einfrieren? Gedenkmodus? nichts)? Aktuell: nichts — nur die Nachrichten gehen raus.
- [ ] **Rechtlich klären** (siehe Punkt 5): Haftung bei Falschbestätigung.

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
