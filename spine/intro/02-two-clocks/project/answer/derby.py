"""The derby's two answers, straight from the night's raw events.

    python answer/derby.py

What the platform will compute twice, on Google Cloud: live while the match
plays (Course 7) and correct next morning (Course 10). Here it is computed
once, on a laptop, from every event at once - which only works after the
fact, and only because the night is small.
"""
import csv
import json
from collections import defaultdict

DERBY = "T-5001"

with open("data/crm/households.csv") as f:
    exchange = {h["household_id"]: h["exchange_id"]
                for h in csv.DictReader(f)}

watching = defaultdict(set)          # minute -> households seen in it
watched = defaultdict(int)           # exchange -> seconds watched
stalled = defaultdict(int)           # exchange -> ms spent buffering
with open("data/viewing/2026-10-31.jsonl") as f:
    for line in f:
        e = json.loads(line)
        if e["title_id"] != DERBY:
            continue
        watching[e["event_ts"][11:16]].add(e["household_id"])
        ex = exchange[e["household_id"]]
        watched[ex] += e["watched_s"]
        stalled[ex] += e["buffer_ms"]

with open("curve.csv", "w") as f:
    f.write("minute,households\n")
    for minute in sorted(watching):
        f.write(f"{minute},{len(watching[minute])}\n")
peak = max(watching, key=lambda m: len(watching[m]))
print(f"live: peak {len(watching[peak])} households at {peak} UTC")

print("next morning: buffering / watched, the derby")
for ex in sorted(watched, key=lambda x: -stalled[x] / watched[x])[:4]:
    print(f"  {ex}  {stalled[ex] / 1000 / watched[ex]:.1%}")
rest = [x for x in watched if x != "EX-LDN-04"]
ratio = sum(stalled[x] for x in rest) / 1000 / sum(watched[x] for x in rest)
print(f"  the other {len(rest)}  {ratio:.1%}")
