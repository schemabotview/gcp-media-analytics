"""The device platform's nightly export of viewing events, as it delivers it.

    python sources/viewing/export.py --dt 2026-10-31

Not Priya's code: this is what the boxes and the app hand over, into
data/export/dt=2026-10-31/. It is imperfect the way real deliveries are,
and every flaw is a named constant here:

  - at least once: every RESEND-th event is delivered twice;
  - each client names its own platform (PLATFORM_AS_SENT);
  - a firmware bug drops event_id from NO_ID heartbeats;
  - UNKNOWN events carry a title the catalogue has never heard of.
"""
import argparse
import json
from pathlib import Path

RESEND = 400
PLATFORM_AS_SENT = {"settop": "STB", "app-ios": "iOS",
                    "app-android": "Android", "web": "Web"}
NO_ID = 4             # heartbeats delivered with no event_id (G2)
UNKNOWN = 3           # heartbeats delivered with title_id UNKNOWN_TITLE (G2)
UNKNOWN_TITLE = "T-9999"
PARTS = 4

p = argparse.ArgumentParser()
p.add_argument("--dt", required=True)
a = p.parse_args()

src = Path(f"data/viewing/{a.dt}.jsonl")
out = Path(f"data/export/dt={a.dt}")
out.mkdir(parents=True, exist_ok=True)
events = [json.loads(line) for line in src.open()]
beats = [i for i, e in enumerate(events) if e["type"] == "heartbeat"]
no_id = set(beats[1000:1000 + 2000 * NO_ID:2000])
unknown = set(beats[1500:1500 + 2000 * UNKNOWN:2000])

delivered = []
for i, e in enumerate(events):
    e = dict(e, platform=PLATFORM_AS_SENT[e["platform"]])
    if i in no_id:
        e["event_id"] = None
    if i in unknown:
        e["title_id"] = UNKNOWN_TITLE
    delivered.append(e)
    if i % RESEND == RESEND - 1:
        delivered.append(e)

size = -(-len(delivered) // PARTS)
for n in range(PARTS):
    rows = delivered[n * size:(n + 1) * size]
    with (out / f"part-{n:05d}.jsonl").open("w") as f:
        f.writelines(json.dumps(r) + "\n" for r in rows)
print(f"{len(events)} events, {len(delivered)} delivered in {PARTS} parts")
