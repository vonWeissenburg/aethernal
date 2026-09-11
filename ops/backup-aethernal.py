#!/usr/bin/env python3
"""Taegliche Datensicherung Aethernal (laeuft auf dem VPS, Frankfurt).

Sichert alle Tabellen als JSON und alle Storage-Dateien als Kopie.
KEIN Schema, KEINE Policies, KEINE Auth-Nutzer - dafuer braucht es pg_dump
mit dem Datenbankpasswort. Siehe /opt/aethernal/backups/LIESMICH.txt
"""
import json, os, sys, urllib.request, urllib.error, datetime, pathlib, shutil

ENV = pathlib.Path("/opt/aethernal/app/.env")
BASE = pathlib.Path("/opt/aethernal/backups")
KEEP = 14
TABLES = ["profiles", "memorials", "memorial_photos", "messages",
          "reminders", "trusted_persons", "death_reports", "diary_entries"]
BUCKET = "memorial-photos"

cfg = {}
for line in ENV.read_text().splitlines():
    if "=" in line and not line.strip().startswith("#"):
        k, v = line.split("=", 1)
        cfg[k.strip()] = v.strip().strip('"').strip("'")
URL = cfg["NEXT_PUBLIC_SUPABASE_URL"].rstrip("/")
KEY = cfg["SUPABASE_SERVICE_ROLE_KEY"]
H = {"apikey": KEY, "Authorization": f"Bearer {KEY}"}

def req(path, body=None, raw=False):
    hdr = dict(H)
    data = None
    if body is not None:
        hdr["Content-Type"] = "application/json"
        data = json.dumps(body).encode()
    r = urllib.request.Request(f"{URL}{path}", data=data, headers=hdr,
                               method="POST" if body is not None else "GET")
    with urllib.request.urlopen(r, timeout=120) as resp:
        return resp.read() if raw else json.loads(resp.read().decode())

stamp = datetime.datetime.now().strftime("%Y-%m-%d_%H%M")
out = BASE / stamp
(out / "dateien").mkdir(parents=True, exist_ok=True)
summary, fehler = {}, []

for t in TABLES:
    rows, off = [], 0
    while True:
        try:
            chunk = req(f"/rest/v1/{t}?select=*&order=id.asc&limit=1000&offset={off}")
        except urllib.error.HTTPError as e:
            fehler.append(f"{t}: HTTP {e.code}")
            rows = None
            break
        rows.extend(chunk)
        if len(chunk) < 1000:
            break
        off += 1000
    if rows is None:
        continue
    (out / f"{t}.json").write_text(json.dumps(rows, indent=2, ensure_ascii=False))
    summary[t] = len(rows)

# Storage: Inventar + echte Dateien
files, stack = [], [""]
while stack:
    p = stack.pop()
    try:
        items = req(f"/storage/v1/object/list/{BUCKET}",
                    {"prefix": p, "limit": 1000, "offset": 0,
                     "sortBy": {"column": "name", "order": "asc"}})
    except urllib.error.HTTPError as e:
        fehler.append(f"storage '{p}': HTTP {e.code}")
        continue
    for it in items:
        name = f"{p}{it['name']}"
        if it.get("id") is None:
            stack.append(name + "/")
        else:
            files.append(name)
            try:
                blob = req(f"/storage/v1/object/{BUCKET}/{name}", raw=True)
                dest = out / "dateien" / name
                dest.parent.mkdir(parents=True, exist_ok=True)
                dest.write_bytes(blob)
            except urllib.error.HTTPError as e:
                fehler.append(f"datei '{name}': HTTP {e.code}")

summary["storage_dateien"] = len(files)
(out / "_manifest.json").write_text(json.dumps(
    {"erstellt": datetime.datetime.now().isoformat(timespec="seconds"),
     "inhalt": summary, "fehler": fehler}, indent=2, ensure_ascii=False))

# Rotation
alt = sorted([d for d in BASE.iterdir() if d.is_dir() and d.name[0].isdigit()])
for d in alt[:-KEEP]:
    shutil.rmtree(d, ignore_errors=True)

status = "OK" if not fehler else f"MIT FEHLERN ({len(fehler)})"
print(f"{datetime.datetime.now().isoformat(timespec='seconds')}  {status}  "
      f"{sum(v for k, v in summary.items() if k != 'storage_dateien')} Zeilen, "
      f"{len(files)} Dateien -> {out}")
for f in fehler:
    print(f"    FEHLER: {f}")
sys.exit(1 if fehler else 0)
