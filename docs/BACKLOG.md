# Aethernal — Backlog & Befunde

*Stand 19.07.2026. Gefundene Bugs aus dem Browser-Rundgang (Demo-Account „Maria Aigner") + Feature-Wünsche von Fabian. Damit nichts verloren geht.*

---

## A) Gefundene Bugs / Verbesserungen (Browser-Test 19.07.)

Sortiert nach Impact.

1. [x] ~~🔴 Hauptfoto (Avatar) rendert nicht~~ **AUFGEKLÄRT + BEHOBEN 19.07.:** Das Avatar-Rendering war nie kaputt (SSR-`<img>` vorhanden, `/_next/image`-Optimizer liefert 200 in allen Breiten, remotePatterns korrekt). Zwei echte Ursachen: (a) Die Demo-Platzhalter waren konturlose Farbverläufe — im Kreis mit Graustufen-Filter sahen sie wie „leere Kreise" aus → durch erkennbare Landschafts-Motive ersetzt. (b) Die Bestandskonten (Adolf, Gato, Erich Schruf) haben schlicht `profile_photo_url = NULL` — es wurde nie ein Foto gespeichert; der leere Kreis ist dort der korrekte Icon-Fallback. **Der B0-Upload-Pfad wurde dabei end-to-end unter RLS verifiziert** (Storage-Insert + memorials-Update mit User-Token → 200): Upload über die App funktioniert; die echten Profile brauchen einfach ein Foto.
2. [x] **Veralteter Versand-Hinweis entfernt** (19.07., der „B7-Rest") — `/nachrichten` ist bannerfrei.
3. [x] **„Fotos"-Tab** zeigt jetzt im View-Modus auf die Galerie-Sektion (`#fotos`) statt in den Editor; „Verwalten"-Link zum Editor bleibt (19.07.).
4. [x] **Foto-Lightbox** (19.07.): Galerie-Fotos auf Gedenkprofil-Detail UND öffentlicher SpiritLink-Seite sind klickbar → Vollbild-Viewer mit Bildunterschrift, Pfeiltasten/ESC, Vor/Zurück. (Kommentar-Funktion → B1/B2-Plan unten.)
5. [x] **A11y-Fixes** (19.07.): Zoom erlaubt (maximum-scale/user-scalable entfernt), Karten-Titel h3→h2 auf /nachrichten, /termine und Vertrauenspersonen-Tab.
6. **🟠 Performance:** 8–9 s bis zum ersten Bild auf Dashboard/Memorial (TTFB bis 1,8 s, LCP ~9,5 s). Größter eigener Brocken — eigene Etappe (Caching / weniger Live-SSR gegen Supabase).

**Was gut ist (nicht anfassen):** Layout durchgehend wertig und würdig, dunkel mit Gold-Akzenten. Öffentliche Gedenkseite elegant und ruhig. QR/SpiritLink sauber. Nachrichten-Liste klar mit guten Status-Badges. Warme, glaubwürdige Inhalte.

---

## B) Feature-Backlog (Fabians Vision)

1. **Fotos anklickbar + kommentierbar.** Foto per Klick vergrößern (Lightbox). Zusätzlich: Fotos sollen von allen Nutzern kommentiert werden können.
2. **Öffentliche QR-Seite: Gästebuch mit Moderation.** Die Seite hinter dem QR-Code soll Gästebuch-Einträge anzeigen. Gast-Funktion: Besucher werden *aufgefordert*, einen Account anzulegen, *müssen* aber nicht (Kommentieren als Gast möglich). **E-Mail-Angabe ist Pflicht**, um kommentieren zu können. **Die Vertrauensperson des Verstorbenen muss jeden Eintrag freigeben, bevor er öffentlich sichtbar ist** (Moderation).
3. **Profil ausführlicher — optionale Sektionen.** Verschiedene Bereiche, die man ausfüllen *kann*, aber nicht *muss*: z.B. **Lieblingslied**, **YouTube-Links**, weitere Medien/Abschnitte.
4. **Termine/Todestage → Kalender-Export.** Termine und Todestage sollen per Klick in den Google-Kalender (o.ä.) übertragen werden können (z.B. `.ics`-Datei / Kalender-Link).
5. **Langfristig: Nachrichten aus dem Jenseits mit Anhängen.** An eine death-/date-Nachricht sollen **Fotos, Videos, Audio-Nachrichten und Dateien** angehängt werden können.

---

## C) Umsetzungspläne für die großen Features (19.07., zur Priorisierung — noch NICHTS gebaut)

### C-B2: Gästebuch auf der SpiritLink-Seite (mit Gast-Kommentaren + Moderation)

**Datenmodell (neue Migration):** `guestbook_entries(id, memorial_id FK→memorials ON DELETE CASCADE, author_name, author_email, body, status 'pending'|'approved'|'rejected', created_at, moderated_at, moderated_by_kind 'owner'|'trusted_person', confirm_token_hash, confirmed_at)` + Indexe auf `(memorial_id, status)`.
**Sicherheit/RLS:** KEINE anonyme Insert-Policy — Einträge laufen über eine Server-Route (Service-Role) mit Validierung, Rate-Limit pro IP+Memorial, Honeypot-Feld und Längen-Limits. Öffentlich lesbar (auf `/s/…`) sind ausschließlich `status='approved'`-Einträge (serverseitig gefiltert, keine anonyme Select-Policy nötig). E-Mail-Pflicht → Empfehlung **Double-Opt-In**: Eintrag wird erst nach Klick auf Bestätigungslink (Token-Hash, wie B2-Invites) zur Moderation vorgelegt — filtert Spam und beweist die E-Mail.
**Moderation:** Solange der Konto-Inhaber lebt, moderiert **er** (neue Sektion im eingeloggten Bereich + optionale Benachrichtigungs-Mail). Die Vertrauensperson übernimmt erst **nach verarbeitetem Todesfall** — via Token-Link in einer Benachrichtigungs-Mail (VP hat kein Konto!), analog zum Melde-Link-Muster. Das koppelt an den „Konto nach Todesfall"-Batch (verstorben-Markierung ist Voraussetzung für die Übergabe).
**DSGVO:** E-Mails Dritter werden gespeichert → Datenschutzerklärung ergänzen (Zweck, Speicherdauer), Löschung via Memorial-Cascade + eigener Lösch-Möglichkeit pro Eintrag.
**Offene Entscheidungen für Fabian:** (1) Double-Opt-In ja/nein? (2) Moderations-Benachrichtigung per Mail sofort oder Digest? (3) Gästebuch pro Memorial abschaltbar (Toggle)? (4) „Account anlegen"-Aufforderung: nur Hinweis-Box oder echter Vorteil (z. B. ohne erneutes Double-Opt-In)?
**Aufwand:** groß (Migration + öffentliche Formular-UI + Double-Opt-In-Mail + Moderations-UI + Todesfall-Übergabe). Eigene Etappe.

### C-B3: Profil-Sektionen (Lieblingslied, YouTube, …)

**Datenmodell:** EINE flexible Tabelle `memorial_sections(id, memorial_id FK CASCADE, kind 'song'|'youtube'|'quote'|'link'|'text', title, content jsonb, order_index)` statt immer neuer Spalten — neue Sektionstypen brauchen dann keinen Schema-Change. RLS exakt wie `memorial_photos` (Owner ALL, öffentliches SELECT nur wenn Memorial public).
**YouTube/Spotify-Datenschutz:** Kein Auto-Embed (lädt Google/Spotify-Ressourcen ohne Consent). Empfehlung: **Click-to-Load-Fassade** — Vorschaukarte lokal gerendert, iframe erst nach Klick + Hinweis. Passt zur bestehenden Consent-Logik (B6).
**Offene Entscheidungen:** Start-Set der Typen (Vorschlag: Lieblingslied-Link, YouTube-Video, Zitat/Motto, freier Textabschnitt), max. Anzahl, Reihenfolge per Drag oder simple Pfeile.
**Aufwand:** mittel (Migration + Editor-UI + Renderer auf Detail/SpiritLink).

### C-B4: Kalender-Export (.ics / Google)

**Kein neues Datenmodell.** Route `app/api/reminders/[id]/ics` erzeugt eine iCalendar-Datei (VEVENT, bei `repeat_yearly` mit `RRULE:FREQ=YEARLY`, ganztägig, TZ Europe/Vienna, UID = reminder-id@aethernal.me); dazu pro Termin ein „Zu Google Kalender"-Link (vorbefüllte `calendar.google.com/render?action=TEMPLATE`-URL — reiner Link, lädt nichts Externes). Buttons auf der Termine-Seite ins Karten-Menü.
**Offene Entscheidung:** Nur Einzel-Download (einfach, empfohlen) oder zusätzlich ein Abo-Feed (`webcal://`-Token-URL, hält Kalender synchron — braucht Token-Verwaltung + Widerruf)?
**Aufwand:** klein (1 Route + 2 Buttons). Idealer nächster Quick-Win.

### C-B5: Nachrichten-Anhänge (Foto/Video/Audio/Datei) — langfristig

**Datenmodell:** `message_attachments(id, message_id FK CASCADE, storage_path, mime, size_bytes, original_name, created_at)`; **neuer PRIVATER Storage-Bucket** `message-attachments` (nicht public — Inhalte sind bis zur Zustellung geheim!), Pfad `{uid}/{message_id}/…`, Owner-only-Policies.
**Zustellung (Kernentscheidung):** Echte E-Mail-Anhänge scheitern an Größenlimits (Video!). Empfehlung: Die Zustell-Mail enthält **zeitlich begrenzte signierte Download-Links** (Supabase signed URLs, Edge Function erzeugt sie beim Versand) — oder eine Stufe schöner: eine **Token-Zustellseite** („Deine Nachricht von Anna") mit eingebettetem Player/Galerie, Mail enthält nur den Link. Letzteres passt zum würdigen Mail-Reframe vom 19.07.
**Offene Entscheidungen:** (1) Anhang-Links in der Mail vs. Token-Zustellseite? (2) Limits (Vorschlag: 5 Anhänge, 100 MB gesamt, Whitelist Bild/Video/Audio/PDF)? (3) Wie lange bleiben Anhänge nach Zustellung abrufbar (30/90 Tage/für immer)? (4) Speicherkosten-Deckel pro Konto?
**Aufwand:** groß (Bucket + Policies + Upload-UI im Nachrichten-Formular + Edge-Function-Erweiterung + ggf. Zustellseite). Nach B2/B3/B4 einplanen.

## Reihenfolge-Empfehlung (Cowork)
- **Zuerst Sofort-Fixes:** A1 (Avatar-Foto), A2 (veralteter Versand-Hinweis), A5 (A11y-Ein-Zeiler). Schnell, hoher Effekt, kein Risiko.
- **Dann kleine UX:** A3+A4 / B1 (Foto-Lightbox + Galerie-Ansicht) — hängen zusammen.
- **Dann als eigene, spezifizierte Etappen:** B2 Gästebuch+Moderation (größtes Stück, echte Design-Entscheidungen), B3 Profil-Sektionen, B4 Kalender-Export, A6 Performance.
- **Langfristig:** B5 Nachrichten-Anhänge.
