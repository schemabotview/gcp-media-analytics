"""One channel's evening from the EPG, each slot joined to its title.

    python sources/epg/slots.py SUN-SPORTS-1 --from 16:00 --to 22:00

A stretch of the evening the guide has no slot for is printed too: the
boxes still showed something then, but the EPG cannot say what.
"""
import argparse
import csv
import json

p = argparse.ArgumentParser()
p.add_argument("channel")
p.add_argument("--from", dest="start", default="00:00")
p.add_argument("--to", dest="end", default="24:00")
a = p.parse_args()

with open("data/catalogue/titles.csv") as f:
    titles = {t["title_id"]: t["title"] for t in csv.DictReader(f)}
with open("data/epg/2026-10-31.json") as f:
    guide = json.load(f)

hhmm = lambda ts: ts[11:16]  # 2026-10-31T17:30:00Z -> 17:30
slots = guide["channels"][a.channel]
for s, after in zip(slots, slots[1:] + [None]):
    if a.start <= hhmm(s["start"]) < a.end:
        t = s["title_id"]
        print(f"{hhmm(s['start'])}-{hhmm(s['end'])}  {t}  {titles[t]}")
    if after and after["start"] != s["end"] and hhmm(s["end"]) < a.end:
        print(f"{hhmm(s['end'])}-{hhmm(after['start'])}  no slot in the EPG")
