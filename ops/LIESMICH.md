# Betriebsskripte (laufen auf dem VPS)

Diese Dateien sind die versionierten Vorlagen. **Auf dem Server liegen die
laufenden Kopien** unter `/opt/aethernal/` — nach einer Änderung hier:

```
scp ops/<datei> aether:/opt/aethernal/<datei>
ssh aether 'chmod 700 /opt/aethernal/<datei>'
```

Es gibt dafür **kein CI/CD**. Ein Commit allein ändert auf dem Server nichts.

| Datei | Auftrag | Zweck |
|---|---|---|
| `backup-aethernal.py` | täglich 03:30 | Alle 8 Tabellen als JSON + alle Storage-Dateien, 14 Generationen, Ablage `/opt/aethernal/backups` (Frankfurt) |
| `watchdog-aethernal.py` | täglich 07:15 | Prüft, ob der Versandlauf stattgefunden hat; Alarm per Mail. Montags zusätzlich ein Lebenszeichen (Kanarienvogel für den Mailweg) |

## Fallstricke, die schon zugeschlagen haben

- **Resend braucht einen eigenen User-Agent.** Ohne den blockt Cloudflare mit
  HTTP 403 / Fehlercode 1010. Ohne diese Zeile scheitert jeder Alarm stumm.
- **`net._http_response` taugt nicht zur Überwachung** — pg_net leert die Tabelle
  nach wenigen Stunden. Deshalb schreibt der Versandlauf selbst eine Zeile in
  `public.scheduler_runs`.
- **Die Sicherung enthält kein Schema und keine Auth-Konten.** Dafür braucht es
  `pg_dump` mit dem Datenbankpasswort (Supabase → Settings → Database).
- **Der Wächter schweigt, wenn der VPS selbst liegt.** Dagegen hilft nur ein
  externer Dienst.

## Empfänger der Alarme

`fabian.fehervary@gmail.com`, überschreibbar mit `WATCHDOG_EMAIL` in
`/opt/aethernal/app/.env`.
