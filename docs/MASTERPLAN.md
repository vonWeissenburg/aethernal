# Aethernal — Masterplan

_Stand: 2026-06-17. **Dies ist der EINE gültige Plan.** Ältere Strategiepapiere (Laravel-Bezug, „Tech Spec v1", alte Übergabe-Dokumente) sind überholt und nicht mehr maßgeblich._

## Vision
Aethernal ist eine digitale Gedenkplattform für verstorbene Menschen und Tiere. Sie bewahrt Erinnerungen — und schlägt eine Brücke in die Zukunft: zeitgesteuerte und todesgetriggerte „Nachrichten aus dem Jenseits". Premium-, emotionale Marke („Celestial Aesthetic"). Markt: Grief-Tech / Digital Legacy, im DACH-Raum noch wenig digitalisiert — Timing-Vorteil.

## Strategische Entscheidungen (2026-06-17)
- **Stack:** Next.js + Supabase (Laravel verworfen).
- **Go-to-Market:** B2C zuerst — funktionierendes Produkt live bringen, echte Nutzer & Feedback. B2B (Bestatter/Steinmetze) als nächste Wachstumsphase, mit vorzeigbarem Produkt.
- **Launch-Umfang:** Das **volle Kernversprechen** muss zum Launch funktionieren (Nachrichten-Engine), nicht nur das Gedenken.
- **Monetarisierung:** später (Phase 4). Erst wachsen, Stripe danach.

## Der ehrliche Stand (aus Code-Review 2026-06-17)
**Fertig & funktioniert:** Auth (Login/Register/Reset), Gedenkprofile inkl. Foto-Upload, Tagebuch, Termine, Vertrauenspersonen, öffentliche Gedenkseite, sichere Datenbank (RLS sauber).

**Fehlt fürs Kernversprechen:** E-Mail-Versand, Scheduler („Wecker"), Todesbestätigungs-Flow, echter QR-Code, vollständige Konto-Löschung. Kein Stripe, kein Analytics.

## Phasen

### Phase 1 — Die Nachrichten-Engine (Launch-Blocker #1)
Ziel: Das Alleinstellungsmerkmal funktioniert wirklich.
- E-Mail-Versand über Resend einrichten; Supabase „Confirm email" aktivieren (Anmelde-Bestätigung)
- Scheduler: Supabase Edge Function + täglicher Cron, der fällige Nachrichten & Erinnerungen findet und per Resend versendet
- Zeitgesteuerte Nachrichten real zustellen
- Vertrauenspersonen-Flow: Einladungs-/Bestätigungsmail + sicherer „Tod bestätigen"-Link → löst todesgetriggerte Nachrichten aus

### Phase 2 — Launch-Reife (Vertrauen, Recht, Politur)
- Konto-Löschung vollständig (serverseitig, auch Auth-Account) — DSGVO
- Echten QR-Code generieren (SpiritLink am Grabstein)
- GA4 + Cookie-Consent (App + Landing)
- Impressum vervollständigen (Adresse, Bezirksgericht)
- Aufräumen: `.env.example` korrigieren, toten Menü-Link „Gedenkprofile" beheben, Onboarding-Foto-Schritt fixen oder entfernen
- UI-Rebuild nach Stitch-Design abschließen (Konsistenz)

### Phase 3 — Launch & erste Nutzer (B2C)
- Landing Page scharfstellen (Hero-Wasserzeichen weg, Waitlist → Anmeldung)
- Soft-Launch, erste echte Nutzer, Feedback einsammeln
- Parallel (du als GF): erste Bestatter-/Steinmetz-Gespräche mit echtem Produkt zum Vorzeigen

### Phase 4 — Monetarisierung & Ökosystem (später)
- Stripe + Freemium-Pläne (Pricing-Entscheidung, siehe unten)
- B2B-Bestatter-Paket (Pitch, Partner-Konditionen)
- QR-Plaketten / Tierprodukte
- AI-Features (Biografie- & Trauertext-Generator) — zugleich Verkaufsargument

## Offene Entscheidungen für später
- **Pricing:** Alte Doku widersprüchlich (49 € einmalig vs. 5 €/Monat). Empfehlung: Free + Premium als **Einmalkauf pro Gedenkprofil** (ein Abo wirkt im Trauerkontext emotional unpassend); optional ein kleines Jahresabo. In Phase 4 final entscheiden.
