#!/usr/bin/env python3
"""Ausfallwaechter Aethernal (laeuft auf dem VPS, taeglich nach dem Versandlauf).

Prueft, ob der Scheduler gelaufen ist, und schlaegt per E-Mail Alarm, wenn nicht.
Einmal pro Woche geht ausserdem ein Lebenszeichen raus — das ist zugleich der
Kanarienvogel: Es beweist, dass der ganze Mailweg (Resend, Schluessel, Absender-
domain) noch funktioniert. Ohne ihn wuerde ein kaputter Mailversand erst am
03.11.2026 auffallen, wenn die erste echte Nachricht faellig ist.

GRENZE DIESER UEBERWACHUNG: Liegt der VPS selbst still, kommt auch kein Alarm.
Gegen diesen Fall hilft nur ein externer Dienst.
"""
import json, sys, datetime, pathlib, urllib.request, urllib.error

ENV = pathlib.Path("/opt/aethernal/app/.env")
MAX_ALTER_STUNDEN = 26          # Lauf ist taeglich 06:00 UTC
LEBENSZEICHEN_WOCHENTAG = 0     # Montag

cfg = {}
for line in ENV.read_text().splitlines():
    if "=" in line and not line.strip().startswith("#"):
        k, v = line.split("=", 1)
        cfg[k.strip()] = v.strip().strip('"').strip("'")

URL = cfg["NEXT_PUBLIC_SUPABASE_URL"].rstrip("/")
KEY = cfg["SUPABASE_SERVICE_ROLE_KEY"]
RESEND = cfg["RESEND_API_KEY"]
ABSENDER = cfg.get("FROM_EMAIL", "Aethernal <hallo@aethernal.me>")
EMPFAENGER = cfg.get("WATCHDOG_EMAIL", "fabian.fehervary@gmail.com")


def letzter_lauf():
    r = urllib.request.Request(
        URL + "/rest/v1/scheduler_runs?select=ran_at,ok,summary&order=ran_at.desc&limit=1",
        headers={"apikey": KEY, "Authorization": "Bearer " + KEY})
    with urllib.request.urlopen(r, timeout=60) as resp:
        rows = json.loads(resp.read().decode())
    return rows[0] if rows else None


def mail(betreff, text):
    r = urllib.request.Request(
        "https://api.resend.com/emails",
        data=json.dumps({"from": ABSENDER, "to": [EMPFAENGER],
                         "subject": betreff, "text": text}).encode(),
        headers={"Authorization": "Bearer " + RESEND,
                 "Content-Type": "application/json",
                 # OHNE eigenen User-Agent blockt Cloudflare vor Resend die
                 # Anfrage mit HTTP 403 / Fehlercode 1010 (Standard-UA von
                 # urllib ist gesperrt). Nachgewiesen am 11.09.2026 — ohne
                 # diese Zeile waere JEDER Alarm stillschweigend gescheitert.
                 "User-Agent": "aethernal-watchdog/1.0"}, method="POST")
    with urllib.request.urlopen(r, timeout=60) as resp:
        return resp.status


jetzt = datetime.datetime.now(datetime.timezone.utc)
lauf = letzter_lauf()
probleme = []

if lauf is None:
    probleme.append("Es gibt ueberhaupt keinen protokollierten Versandlauf.")
    alter = None
else:
    ran = datetime.datetime.fromisoformat(lauf["ran_at"].replace("Z", "+00:00"))
    alter = (jetzt - ran).total_seconds() / 3600
    if alter > MAX_ALTER_STUNDEN:
        probleme.append(
            "Der letzte Versandlauf ist %.1f Stunden her (erlaubt: %d). "
            "Der taegliche Auftrag um 06:00 UTC scheint auszufallen."
            % (alter, MAX_ALTER_STUNDEN))
    if not lauf.get("ok"):
        probleme.append("Der letzte Lauf meldet Fehler: "
                        + json.dumps(lauf.get("summary"), ensure_ascii=False))

zeitstempel = jetzt.isoformat(timespec="seconds")

if probleme:
    text = ("Der Ausfallwaechter von Aethernal schlaegt Alarm.\n\n"
            + "\n\n".join("- " + p for p in probleme)
            + "\n\nWas tun:\n"
              "1. Supabase -> Edge Functions -> send-due-messages -> Logs ansehen.\n"
              "2. Cron-Auftrag pruefen: select * from cron.job;\n"
              "3. Von Hand anstossen:\n"
              "   do $$ declare cmd text; begin\n"
              "     select command into cmd from cron.job\n"
              "     where jobname='aethernal-send-due-messages'; execute cmd; end $$;\n"
              "\nAb 03.11.2026 ist die erste echte Nachricht faellig. Bis dahin\n"
              "verliert ein Ausfall keine Zustellung, danach schon.\n"
            + "\nGeprueft: " + zeitstempel + " UTC\n")
    try:
        mail("Aethernal: Versandlauf faellt aus", text)
        print(zeitstempel, "ALARM versendet:", "; ".join(probleme))
    except urllib.error.HTTPError as e:
        print(zeitstempel, "ALARM KONNTE NICHT VERSENDET WERDEN:", e.code, e.read().decode()[:200])
        sys.exit(1)
    sys.exit(1)

if jetzt.weekday() == LEBENSZEICHEN_WOCHENTAG:
    text = ("Alles in Ordnung.\n\n"
            "Letzter Versandlauf: vor %.1f Stunden, ohne Fehler.\n"
            "Zusammenfassung: %s\n\n"
            "Diese Mail kommt einmal woechentlich. Sie ist kein Bericht, sondern ein\n"
            "Test: Sie beweist, dass der Mailweg (Resend, Schluessel, Absenderdomain)\n"
            "funktioniert. Bleibt sie aus, stimmt etwas nicht — auch wenn sonst nichts\n"
            "auffaellt.\n\nGeprueft: %s UTC\n"
            % (alter, json.dumps(lauf.get("summary"), ensure_ascii=False), zeitstempel))
    try:
        mail("Aethernal: woechentliches Lebenszeichen", text)
        print(zeitstempel, "OK - Lebenszeichen versendet (letzter Lauf vor %.1f h)" % alter)
    except urllib.error.HTTPError as e:
        print(zeitstempel, "Lebenszeichen fehlgeschlagen:", e.code, e.read().decode()[:200])
        sys.exit(1)
else:
    print(zeitstempel, "OK - letzter Lauf vor %.1f h, keine Fehler" % alter)
