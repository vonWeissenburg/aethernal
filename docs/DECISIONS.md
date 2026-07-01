# Entscheidungen (Decision Log)

_Neueste zuerst. Jede wichtige Richtungsentscheidung hier mit Datum + Begründung festhalten._

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
