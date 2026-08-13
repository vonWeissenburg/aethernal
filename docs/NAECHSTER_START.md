# Nächster Start — Resume-Notiz (Stand 13.08.2026)

*Alles Untenstehende ist committet und gepusht (`main` = `origin/main`), App und
Landing Page laufen live. Die Vorgängerfassung dieser Datei (19.07.) ist im
CHANGELOG vollständig abgebildet.*

## Wo wir stehen (ein Absatz)

Phase 1 ist seit 19.07. komplett und end-to-end bewiesen (Scheduler + Cron,
Death-Journey inkl. Karenz und Widerruf, DSGVO-Löschung, Rechtstexte,
Lighthouse-A11y ≥ 90). Danach lag das Projekt 25 Tage still. Am **13.08.** ist
die Performance-Etappe (A6) zur Hälfte erledigt: Google Fonts raus, Icon-Font
subgesetzt, Tailwind-CDN von der Landing Page geworfen, LP-Bilder lokalisiert
(`3feb852`, live). Der Engpass sind jetzt Fabians offene Entscheidungen —
gesammelt in `00_Projekt/Aethernal_ToDos_Fabian_2026-08-13.docx` im Drive-Ordner.

## Wichtig vor jeder Performance-Arbeit

**Erst auf dem Server messen, nicht im Browser.** Von Fabians Mac aus liegt die
RTT nach Frankfurt bei 220–450 ms (normal: 15–25 ms). Der VPS selbst liefert die
statische LP in **28 ms**, App-SSR `/login` warm in **17 ms**, VPS→Supabase
**1 ms Ping**. Client-Urteile deshalb über pagespeed.web.dev holen.

## Empfohlene Reihenfolge

1. **Performance Teil 2 (A6-Rest):** Dashboard und Memorial-Detail machen pro
   SSR-Request zu viele serielle Supabase-Roundtrips. Bündeln (`Promise.all`),
   ggf. `revalidate` für unkritische Reads. Das ist der letzte Teil der Ladezeit,
   den wir selbst beeinflussen.
2. **Bugfix `qr_code_2`:** Das Icon in der SpiritLink-Sektion der Landing Page
   ligiert nicht und rendert als Text (245 px breit statt 60). Bestand schon vor
   dem 13.08., also keine Regression — trotzdem offen.
3. **B4 Kalender-Export** (Quick-Win, Plan in `BACKLOG.md` C-B4) — sobald Fabian
   „nur ICS“ vs. „auch Abo-Feed“ entschieden hat (To-do 11).
4. **„Konto nach Todesfall“-Batch** — braucht Fabians Antwort auf To-do 09
   (Gedenkmodus / Einfrieren / nichts). Voraussetzung für die
   Gästebuch-Moderations-Übergabe.
5. **B2 Gästebuch** (eigene Etappe, Plan in C-B2, 4 offene Fragen = To-do 10)
   → danach B3 Profil-Sektionen, B5 Nachrichten-Anhänge.

## Was auf Fabian wartet

Vollständig und mit Anleitung in
`Meine Ablage/Projekte/Aethernal/00_Projekt/Aethernal_ToDos_Fabian_2026-08-13.docx`.
Kurzfassung: GitHub-Token widerrufen · Alt-Ordner mit Klartext-Keys löschen ·
Internetleitung prüfen · Anwaltstermin · Impressum vervollständigen ·
Markenschutz ÖPA · Karenzzeit absegnen · Todesfall-Wortlaute lesen ·
Konto-nach-Todesfall entscheiden · Gästebuch-Detailfragen · Kalender-Export-Umfang ·
Profil-Sektionen-Set · Bild-Lizenz freigeben · Graustufen/Demo-Fotos · GA4 auf der LP ·
QR-Scan am Handy · Foto-Upload am Handy.

## Nützliche Fakten (erspart Suchen)

- **Landing Page hat KEIN CI/CD.** Nach jeder Änderung an `index.html`,
  `styles.css`, `img/` oder `fonts/`:
  `scp <datei> aether:/opt/aethernal/landingpage/`. Ein Commit allein ändert
  live nichts. (Genau diese Falle hatte dazu geführt, dass bis 13.08. die
  April-Fassung mit einer falschen DSGVO-Aussage live war.)
- **LP-CSS neu bauen:**
  `npx tailwindcss -c landingpage.tailwind.config.js -i landingpage.input.css -o styles.css --minify`
  (braucht `tailwindcss@3` + `@tailwindcss/forms` + `@tailwindcss/container-queries`).
- **Neues Icon im Code?** Namen in `app/fonts/ICONS.txt` ergänzen und den Subset
  neu ziehen, sonst rendert es als Klartext:
  `https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&icon_names=<liste>` →
  woff2-URL aus der CSS ziehen, Datei nach `app/fonts/material-symbols-subset.woff2`.
- **Icon-Größen:** In der App gewinnt `.material-symbols-outlined { font-size: 24px }`
  über Tailwind-`text-*`-Klassen (so war es auch vorher). Auf der Landing Page ist
  es bewusst umgekehrt gelöst (`:where(...)`, Spezifität 0), weil dort
  `text-5xl/6xl/7xl` gebraucht werden.
- App-Deploy: push auf `main` → GitHub Actions baut und deployt (~2,5 min).
  Manuell: `ssh aether` → `/opt/aethernal/app` → `./deploy.sh`.
- Edge Function manuell triggern: POST mit `Authorization: Bearer <CRON_SECRET>` an
  `https://nrxeocbokfllrufdbsdx.supabase.co/functions/v1/send-due-messages`.
- Migrationen liefen bisher über SQL-Editor/Management-API, NICHT `db push`
  (Historie leer, alles idempotent — Hinweis in SCHEMA_DRIFT).
- Demo-Login: `fabian.fehervary+demo@gmail.com` (Passwort hat Fabian; steht bewusst
  nicht in der Doku). Die 3 Bestandskonten nie anfassen.
- Rollback Landing Page: `/opt/aethernal/landingpage/index.html.bak-2026-08-13-vor-perf`.
