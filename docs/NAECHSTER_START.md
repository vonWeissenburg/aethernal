# Nächster Start — Resume-Notiz (Stand 19.07.2026, Tagesabschluss)

*Für die erste Session am nächsten Arbeitstag. Alles Untenstehende ist committet
und gepusht (`main` = `origin/main`), Prod läuft stabil.*

## Wo wir stehen (ein Absatz)

Etappe 0+1 ist live UND end-to-end bewiesen: Scheduler + Cron (täglich 06:00 UTC)
versenden date- und death-Nachrichten nachweislich, die komplette Death-Journey
(B2-Einladung → B3-Meldung → Karenz → Widerruf → Zustellung) ist auf Wegwerf-Konten
durchgetestet, B4-Löschung bestanden, Rechtstexte live, Zustell-Mail würdevoll
umgerahmt („{Name} über Aethernal"). Demo-Account „Maria Aigner"
(`fabian.fehervary+demo@gmail.com`) ist voll befüllt und vorzeigbar. Lighthouse-A11y
≥ 90 überall. Sofort-Fixes (Lightbox, Galerie-Tab, A11y) deployed (`0fb5a1e`).
Phase 1 der Roadmap ist damit KOMPLETT; Prod hat 3 echte Bestandskonten (nie anfassen)
+ 1 Demo-Konto.

## Empfohlene Reihenfolge morgen

1. **Kurzer Morgen-Check:** Erster echter Cron-Lauf (06:00 UTC) in
   `cron.job_run_details` / Function-Logs gegenprüfen (sollte leer durchlaufen).
2. **Performance-Etappe (A6):** TTFB bis 1,8 s / LCP ~9,5 s auf Dashboard &
   Memorial-Detail. Ansätze: weniger serielle Supabase-Roundtrips pro SSR-Request,
   `Promise.all`, ggf. Next-Caching/`revalidate` für unkritische Reads, Font-Loading.
3. **B4 Kalender-Export** (Quick-Win, Plan in `BACKLOG.md` C-B4): ICS-Route +
   Google-Kalender-Link auf der Termine-Seite.
4. **„Konto nach Todesfall"-Batch** (DECISIONS 19.07.): `verstorben`-Markierung
   (Migration) + Scheduler stoppt Owner-Reminders + ggf. UI-Kennzeichnung.
   Voraussetzung für die Gästebuch-Moderations-Übergabe.
5. **B2 Gästebuch** (eigene Etappe, Plan in C-B2) → danach B3 Profil-Sektionen,
   B5 Nachrichten-Anhänge.

## Offene Entscheidungen für Fabian

- **Avatar-Graustufen:** Dashboard-Karten zeigen Fotos bis zum Hover in Graustufen
  (Design-Entscheidung aus Track A). Bei echten Porträts Verstorbener gewollt?
  Sonst Ein-Zeiler.
- **Demo-Fotos:** aktuell generierte Landschafts-Platzhalter. Für Verkaufs-Screenshots
  echte (lizenzfreie) Porträts einsetzen? (Stock-Lizenz-Thema beachten,
  siehe OFFEN_FUER_FABIAN Punkt 6.)
- **C-Plan-Detailfragen** (in `BACKLOG.md` Abschnitt C markiert):
  - Gästebuch: Double-Opt-In? Benachrichtigung sofort/Digest? Pro Memorial abschaltbar? Vorteil für registrierte Gäste?
  - Kalender: nur ICS-Download oder zusätzlich Abo-Feed (webcal + Token)?
  - Profil-Sektionen: Start-Typen-Set (Vorschlag: Lied, YouTube, Zitat, Freitext)?
  - Anhänge: Zustellform (Mail-Links vs. Token-Zustellseite)? Limits? Aufbewahrung?
- **Übrig aus OFFEN_FUER_FABIAN:** B5-QR-Scan mit dem Handy (2 Min, braucht dich),
  B0-Foto-Test über die echte UI am Handy (Upload-Pfad ist serverseitig verifiziert),
  GA4 auf der Landing-Page, Impressum-Vervollständigung, Anwalts-Review,
  Legacy-Schema-Aufräumen (SCHEMA_DRIFT_2026-07-19.md), Key-Rotation (deine
  Entscheidung: nein — bleibt dokumentiert).

## Nützliche Fakten (erspart Suchen)

- Deploy: `ssh aether` → `/opt/aethernal/app` → `./deploy.sh` (funktioniert seit `d935cf8`).
- Edge Function manuell triggern: POST mit `Authorization: Bearer <CRON_SECRET>` an
  `https://nrxeocbokfllrufdbsdx.supabase.co/functions/v1/send-due-messages`.
- Migrationen liefen bisher über SQL-Editor/Management-API, NICHT `db push`
  (Historie leer, alles idempotent — Hinweis in SCHEMA_DRIFT).
- Demo-Login: `fabian.fehervary+demo@gmail.com` (Passwort hat Fabian; steht bewusst
  nicht in der Doku).
- Tages-Protokolle: `DEPLOY_PROTOKOLL_2026-07-19.md`, `SCHEMA_DRIFT_2026-07-19.md`,
  CHANGELOG 2026-07-19 (vollständig), DECISIONS 19.07. (3 neue Einträge).
