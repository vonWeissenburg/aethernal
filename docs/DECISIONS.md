# Entscheidungen (Decision Log)

_Neueste zuerst. Jede wichtige Richtungsentscheidung hier mit Datum + Begründung festhalten._

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
