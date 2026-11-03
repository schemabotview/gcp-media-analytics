"""Replay derby night's viewing events into Pub/Sub, as the boxes sent them.

    python produce/settop.py --from 18:30 --minutes 5
    python produce/settop.py --device STB-13795 --from 18:30 --minutes 10

Time runs SPEED times faster than on the night. The network is not perfect,
and neither is this replay: a retry re-sends one message in every RESEND,
the same event a second time. Pub/Sub cannot tell the two apart.
"""
import argparse
import json
import os
import time
from collections import Counter
from datetime import datetime

from google.cloud import pubsub_v1

SPEED = 60
RESEND = 400
DAY = "data/viewing/2026-10-31.jsonl"

p = argparse.ArgumentParser()
p.add_argument("--from", dest="start", required=True)
p.add_argument("--minutes", type=int, required=True)
p.add_argument("--device")
p.add_argument("--ordering", action="store_true")
a = p.parse_args()

t0 = datetime.fromisoformat(f"2026-10-31T{a.start}:00+00:00")
at = lambda e: (datetime.fromisoformat(e["event_ts"]) - t0).total_seconds()
with open(DAY) as f:
    events = [e for e in map(json.loads, f)
              if 0 <= at(e) < a.minutes * 60
              and (not a.device or e["device_id"] == a.device)]

options = pubsub_v1.types.PublisherOptions(
    enable_message_ordering=a.ordering)
publisher = pubsub_v1.PublisherClient(publisher_options=options)
topic = publisher.topic_path(os.environ["GOOGLE_CLOUD_PROJECT"],
                             "viewing-events")
sent, resent, futures = Counter(), 0, []
began = time.monotonic()
for i, e in enumerate(events, 1):
    time.sleep(max(0, at(e) / SPEED - (time.monotonic() - began)))
    data = json.dumps(e).encode()
    key = e["device_id"] if a.ordering else ""
    for _ in range(2 if i % RESEND == 0 else 1):
        futures.append(publisher.publish(
            topic, data, ordering_key=key,
            type=e["type"], device_id=e["device_id"], ts=e["event_ts"]))
    sent[e["type"]] += 1
    resent += i % RESEND == 0
for f in futures:
    f.result()
print(f"{len(events)} events, {a.minutes} minutes of the night, "
      f"replayed at {SPEED}x")
print("  " + ", ".join(f"{k} {v}" for k, v in sorted(sent.items())))
print(f"published {len(futures)} messages ({resent} re-sent by a retry)")
