# 03 — LAUNCH-KRITISCHE FUNKTIONEN (Track B)

*Logik-Pakete. Reihenfolge grob wie unten, aber B0/B1 sind unabhängig und dürfen parallel zu Track A laufen. B2/B3 brauchen funktionierenden E-Mail-Versand (Resend/Scheduler live = Fabians Secrets). Regel 1 aus `00_MISSION.md` gilt: den bestehenden Zustell-Code lesen und integrieren, nicht neu schreiben.*

---

## B0 — Profilfoto-Upload reparieren  *(unabhängig)*
**Ziel:** `memorials.profile_photo_url` lässt sich setzen. **Ist:** In `memorial/[id]/edit` ist der „Foto ändern"-Kreis eine tote Affordance (kein File-Input); Galerie-Upload füllt nur `memorial_photos`. Folge: Dashboard/Detail/SpiritLink zeigen immer den Icon-Fallback.
**Ansatz:** File-Input am Profilfoto-Kreis; Upload in Bucket `memorial-photos` unter `{uid}/{memorialId}/profile-{ts}.ext`; `memorials.profile_photo_url` updaten; alte Datei ersetzen. Onboarding-Foto (A3) an dieselbe Funktion hängen.
**Akzeptanz:** Foto hochladen → erscheint sofort auf Detail, Dashboard und `/s/[slug]`; Entfernen setzt Feld null + löscht Storage-Objekt.

## B1 — Navigation-/Route-Fixes  *(unabhängig)*
**Ziel:** kein toter Menüpunkt. **Ist:** „Gedenkprofile" (`SIDEBAR_NAV`, `href:/gedenkprofile`, `matchAlso:/memorial`) hat keine eigene Route → effektiv toter Menüpunkt; Mobile-„Mehr" ohne eigene Route.
**Ansatz (Entscheidung Fabian):** entweder echte Übersichtsseite `/gedenkprofile` (Liste aller Memorials des Users) bauen **oder** den Menüpunkt entfernen und Dashboard als Heimat lassen. Mobile-„Mehr" → definierte Route oder raus.
**Akzeptanz:** jeder sichtbare Nav-Punkt führt zu einer echten, passenden Seite.

## B2 — Vertrauenspersonen konsolidieren + Einladung/Bestätigung
**Ziel:** Eine Vertrauenspersonen-Logik; `confirmed` wird real true. **Ist:** zwei divergierende UIs (nur `/vertrauenspersonen` editiert); `confirmed` nie gesetzt (keine Mail).
**Ansatz:** UI-Merge (baut auf A5). Einladungs-Mail (Resend) mit sicherem Bestätigungs-Link (Token) → Klick setzt `confirmed=true`. `trusted_persons`-RLS aus `FOR ALL` in getrennte Policies ziehen (Audit-Hinweis). Token-Speicherung per neuer Migration.
**Akzeptanz:** Person hinzufügen → Mail kommt → Link bestätigt → Status „Bestätigt"; nur bestätigte Personen sind für B3 gültig; **eine** Vertrauenspersonen-Komponente in der Codebase.

## B3 ★ — Todesbestätigungs-Flow  *(der Kern des Kernversprechens)*
**Ziel:** Eine bestätigte Vertrauensperson kann den Tod des Nutzers bestätigen → alle `messages` mit `trigger_type='death'` dieses Nutzers werden zugestellt.
**Ansatz (Fable entwirft Migration + prüft Sicherheit, Wortlaut mit Fabian):**
- Sicherer, einmaliger Bestätigungs-Link pro Vertrauensperson (langes Token, ablaufend/einlösbar). **Missbrauchsschutz zwingend** — eine Falschbestätigung ist der größte denkbare Schaden. Optionen erwägen: Bestätigung durch **mehrere** Vertrauenspersonen und/oder Karenzzeit + Benachrichtigung an den Nutzer, bevor death-Nachrichten rausgehen. **Vor Umsetzung: Ansatz + Wortlaut mit Fabian abstimmen (STOP).**
- Bei bestätigtem Tod: death-Nachrichten in den bestehenden Zustell-Pfad geben (`status` so setzen, dass die vorhandene Scheduler-Function `send-due-messages` sie versendet — **nicht** einen zweiten Versand-Weg bauen).
- Zustand „verstorben" pro Nutzer per neuer Migration; RLS beachten (Vertrauensperson braucht kontrollierten Zugriff genau auf diese Aktion).
**Akzeptanz:** End-to-End-Test: death-Nachricht anlegen → Vertrauensperson bestätigt über Link → Nachricht wird (über den bestehenden Scheduler) an den Empfänger zugestellt; ohne gültige Bestätigung passiert nichts; kein Doppelversand; bestehender date-Zustellpfad unverändert grün.

## B4 — Konto-Löschung serverseitig vollständig (DSGVO)
**Ziel:** „Konto löschen" entfernt wirklich alles. **Ist:** löscht nur DB-Zeilen clientseitig — **Auth-Account bleibt, Storage-Fotos bleiben liegen** (`einstellungen/settings-form.tsx`).
**Ansatz:** serverseitige Route/Server-Action mit Supabase **Admin-API** (Service-Role **serverseitig**, nie im Client): Auth-User löschen (Cascade räumt DB), zusätzlich alle Storage-Objekte unter `{uid}/` entfernen. Bestätigungs-Dialog + optional Re-Auth.
**Akzeptanz:** nach Löschung existieren weder Auth-User noch DB-Zeilen noch Storage-Objekte des Nutzers; Login unmöglich; kein Service-Role-Key im Client-Bundle.

## B5 — Echter QR-Code + Teilen
**Ziel:** SpiritLink teilbar. **Ist:** QR = Icon-Platzhalter; „Teilen" nur `<a>`.
**Ansatz:** QR aus der `/s/[slug]`-URL generieren (leichte Lib, z. B. `qrcode`), auf Detail + als Download; „Teilen" = Web-Share-API mit Copy-Link-Fallback. Slug-Bruch bei Umbenennung bedenken (Alias/Redirect oder Warnung).
**Akzeptanz:** QR zeigt auf die echte öffentliche URL und ist scannbar; Teilen kopiert/teilt den Link; nach Namensänderung kein toter Link.

## B6 — GA4 + Cookie-Consent (App)
**Ziel:** Analytics rechtskonform. **Ist:** fehlt in der App; „Cookie-Einstellungen" verlinkt nur statisches `/datenschutz`.
**Ansatz:** GA4 (`G-FT3WYB9Z4T`) erst **nach** Einwilligung laden; Consent-Banner (Ablehnen gleichwertig), Auswahl speicherbar/änderbar. Mit Landing-Page-Consent konsistent.
**Akzeptanz:** ohne Einwilligung kein GA4-Netzwerkcall; Einwilligung widerrufbar; Zustand persistent.

## B7 — Echte „Nachrichten"-Statistik + kleine 🟡-Fixes
**Ziel:** keine hart codierten/irreführenden Werte. **Ansatz:** Dashboard- & Detail-Stat „Nachrichten" real aus `messages` zählen; Platzhalter-Banner „Versand in Kürze" entfernen, sobald Scheduler live; optional `memorial_photos.caption/order_index` nutzbar machen.
**Akzeptanz:** angezeigte Zahlen entsprechen der DB; keine „in Kürze"-Aussage mehr, die nicht stimmt.

---

### Bewusst NICHT in dieser Mission (Etappe 4 — nur mit Fabians Freigabe)
Stripe/Bezahlung · AI-Textgeneratoren · B2B-Bestatter-Bundle · physische QR-Plaketten. Sowie: Rechtstexte-Ausbau (Anwalts-Review, `AUDIT` P3) und Scheduler-**Deploy** (Fabians Secrets) — kein Code-Paket für Fable.
