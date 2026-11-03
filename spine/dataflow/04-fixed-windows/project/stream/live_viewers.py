"""Households watching each channel, minute by minute, in EVENT time.

    python stream/live_viewers.py --from 18:38 --minutes 6

Each event is stamped with the time the box says it happened. Fixed windows
cut that timeline into minutes; a household counts once per minute, however
many events it sent in it.
"""
import argparse
import json
import logging
from datetime import datetime

import apache_beam as beam
from apache_beam.transforms import window

DAY = "data/viewing/2026-10-31.jsonl"
CHANNEL = "SUN-SPORTS-1"


def stamp(e: dict) -> window.TimestampedValue:
    at = datetime.fromisoformat(e["event_ts"].replace("Z", "+00:00"))
    return window.TimestampedValue(e, at.timestamp())


def minute(kv, w=beam.DoFn.WindowParam) -> str:
    start = w.start.to_utc_datetime().strftime("%H:%M")
    return f"{start}  {kv[0]}  {kv[1]:>5} households"


def run(start: str, minutes: int) -> None:
    lo = f"2026-10-31T{start}"
    h, m = map(int, start.split(":"))
    hi = f"2026-10-31T{h + (m + minutes) // 60:02d}:{(m + minutes) % 60:02d}"
    with beam.Pipeline(runner="BundleBasedDirectRunner") as p:
        (p
         | "read" >> beam.io.ReadFromText(DAY)
         | "parse" >> beam.Map(json.loads)
         | "slice" >> beam.Filter(lambda e: lo <= e["event_ts"] < hi
                                  and e["channel"] == CHANNEL)
         | "event time" >> beam.Map(stamp)
         | "minutes" >> beam.WindowInto(window.FixedWindows(60))
         | "who" >> beam.Map(lambda e: (e["channel"], e["household_id"]))
         | "once each" >> beam.Distinct()
         | "count" >> beam.combiners.Count.PerKey()
         | "label" >> beam.Map(minute)
         | "all minutes" >> beam.WindowInto(window.GlobalWindows())
         | "gather" >> beam.combiners.ToList()
         | "print" >> beam.Map(lambda rows: print("\n".join(sorted(rows)))))


if __name__ == "__main__":
    logging.getLogger().setLevel(logging.ERROR)
    a = argparse.ArgumentParser()
    a.add_argument("--from", dest="start", required=True)
    a.add_argument("--minutes", type=int, required=True)
    args = a.parse_args()
    run(args.start, args.minutes)
