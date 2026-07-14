# Entscheidungen (Decision Log)

_Neueste zuerst. Jede wichtige Richtungsentscheidung hier mit Datum + Begründung festhalten._

## 2026-07-14 — Todesbestätigung: Karenzzeit-Modell, 7 Tage (Redesign B3)
Umgesetzt nach dem in `docs/OFFEN_FUER_FABIAN.md` vorgeschlagenen **Modell 2**
(Fabian folgte der Empfehlung; Wortlaute stehen zum finalen Review):

1. Bestätigte Vertrauensperson fordert unter `/vertrauen/todesfall` per
   E-Mail einen Melde-Link an (48 h gültig, nur Token-Hash in der DB,
   identische Antwort bei unbekannter Adresse — kein Enumeration-Leck).
2. Meldung per Zwei-Schritt-Bestätigung → `death_reports`-Zeile mit
   `effective_at = jetzt + 7 Tage` (nur EIN aktiver Report pro Nutzer).
3. Der Nutzer bekommt sofort eine Warn-Mail mit Widerrufslink
   („Ich lebe — Meldung widerrufen", gültig bis `effective_at`).
4. Erst nach Ablauf versendet die BESTEHENDE Scheduler-Function die
   `death`-Nachrichten (neue Sektion 4, gleiche Send-Routine, Status-Flip
   als Doppelversand-Schutz; fehlende Tabelle bricht den Datums-Versand
   nicht). Kein zweiter Versand-Weg.

**Verworfen:** Sofort-Auslösung (eine Falschbestätigung wäre irreversibel)
und Pflicht-Mehrfachbestätigung (viele Nutzer haben nur eine Vertrauensperson
→ Kernversprechen faktisch tot; kann später als Option pro Konto kommen).
**Offen:** Was mit dem Konto nach verarbeitetem Todesfall passiert
(Gedenkmodus/Einfrieren) — Produktentscheidung Fabian.

## 2026-07-14 — Vertrauenspersonen-Bestätigung: Token-Hash + Zwei-Schritt-Confirm (Redesign B2)
Einladungs-Flow gebaut: Mail über Resend (Next-API-Route, kein zweiter
Versand-Weg neben dem Scheduler nötig — Einladungen sind interaktiv, nicht
zeitgesteuert), Bestätigung über öffentliche Seite `/vertrauen/bestaetigen`.

**Sicherheitsentscheidungen:**
- In der DB liegt nur der **SHA-256-Hash** des Tokens — ein DB-Leak verrät keine gültigen Links. Token: 32 Zufalls-Bytes, 14 Tage gültig, einmalig (Hash wird bei Bestätigung genullt).
- **Zwei-Schritt-Bestätigung** (Seite zeigt Button, erst POST bestätigt) — Mail-Scanner, die Links vorab abrufen, lösen nichts aus.
- **E-Mail-Änderung resettet die Bestätigung** (DB-Trigger): verhindert, dass eine bestätigte Person durch E-Mail-Tausch untergeschoben wird — wichtig für die Todesbestätigung (B3).
- `trusted_persons`-RLS von `FOR ALL` in getrennte Policies gezogen (Audit-Hinweis); die Bestätigung läuft serverseitig mit Service-Role, keine anonyme Policy nötig.
- Bewusste Restlücke: Der Inhaber kann `confirmed` seiner eigenen Vertrauensperson per Update theoretisch selbst setzen (RLS kann Spalten nicht ausnehmen). Schadenspotenzial betrifft nur ihn selbst; B3 kann das bei Bedarf über einen Trigger härten.

## 2026-07-14 — SpiritLink-Slug bleibt nach Erstellung stabil (Redesign B5)
Bisher wurde der Slug bei jeder Namensänderung neu generiert → alle geteilten
Links und QR-Codes brachen still. Entschieden: **Slug ist nach Erstellung
unveränderlich**; das Edit-Formular weist bei Namensänderung darauf hin.

**Begründung:** Die SpiritLink-URL ist ein dauerhafter Identifikator. Gedruckte
QR-Codes (Phase 4: physische Plaketten auf Grabsteinen!) dürfen niemals brechen —
das wiegt schwerer als eine URL, die dem neuen Namen entspricht. Verworfene
Alternative: Alias-Tabelle mit Redirects (Migration + mehr Komplexität; kann
später nachgerüstet werden, falls umbenennbare Slugs gewünscht sind).

## 2026-07-14 — „Gedenkprofile" bekommt eine echte Übersichtsseite (Redesign B1)
Der Nav-Punkt „Gedenkprofile" zeigte mangels Route per Workaround auf `/dashboard`.
Entschieden: eigene Seite `/gedenkprofile` (Grid aller Memorials des Users,
baut auf der bestehenden `MemorialCard` aus A2) statt den Menüpunkt zu entfernen.

**Begründung:** Gibt dem Nav-Vokabular (Start · Gedenkprofile · …) eine ehrliche
Heimat, entlastet das Dashboard und kostet dank vorhandener Komponenten fast
nichts. Fabian hat der Empfehlung im Review zugestimmt. Revert wäre trivial
(Seite löschen + Nav-Href zurückdrehen).

## 2026-06-22 — Scheduler als Supabase Edge Function + pg_cron
Der tägliche Versand fälliger Nachrichten/Erinnerungen läuft als Supabase Edge
Function (`send-due-messages`), getriggert per `pg_cron` (+ `pg_net`).

**Begründung:** Alles bleibt in Supabase (keine zweite Infrastruktur), trifft den
Roadmap-Wortlaut, schnellster Weg zum funktionierenden Versand. Verworfene
Alternative: Next.js API-Route + Vercel Cron + Outbox-Tabelle — wäre „alles in
einem TS-Repo" und mit Retry/Audit, hängt aber an der noch offenen Vercel-Entscheidung
und ist mehr Bau. Kann später migriert werden, falls der Vercel-Umzug kommt.

**Begleitentscheidungen:** Erinnerungen gehen an die E-Mail des Konto-Inhabers
(`reminders` hat keinen eigenen Empfänger). `reminders.last_sent_on` neu eingeführt,
weil die Tabelle keinen Versand-Status hatte (sonst täglicher Doppelversand).
Function-Schutz über `CRON_SECRET` im Header statt JWT. `death`-getriggerte
Nachrichten bewusst ausgeklammert → Roadmap-Aufgabe 4 (Todesbestätigung).

## 2026-06-17 — Produkt-Strategie & Launch-Plan festgelegt
- **Go-to-Market:** B2C zuerst (funktionierendes Produkt live, Nutzer + Feedback). B2B (Bestatter/Steinmetze) als nächste Wachstumsphase.
- **Launch-Umfang:** Das volle Kernversprechen (Nachrichten-Engine: E-Mail + Scheduler + Todesbestätigung) muss zum Launch funktionieren — nicht nur das Gedenken.
- **Monetarisierung:** später (Phase 4). Erst wachsen, Stripe danach.

Details im Masterplan (`docs/MASTERPLAN.md`).

## 2026-06-17 — Bleiben bei Next.js + Supabase, Laravel verworfen
Der im April 2026 angedachte Rewrite auf Laravel wird **nicht** weiterverfolgt.

**Begründung:** Er wurde nie als Code umgesetzt (nur ein Plan-Dokument). Laravel
erfordert einen eigenen Server + eigene PostgreSQL (mehr Wartung) und ist nicht das,
was moderne AI-App-Builder (z. B. Lovable) erzeugen. Next.js + Supabase skaliert
managed auf Millionen, passt zum Ziel "so wenig Infrastruktur wie möglich" und die
App existiert bereits funktionsfähig.

## 2026-06-17 — Offen / zu entscheiden: Hosting-Umzug auf Vercel
Aktuell läuft die App per Docker + Traefik auf einem Hostinger-VPS (GitHub Actions
CI/CD). **Kandidat:** Frontend auf Vercel umziehen (auto-skaliert, keine
Server-Wartung), Supabase als Backend behalten. Noch nicht entschieden.
