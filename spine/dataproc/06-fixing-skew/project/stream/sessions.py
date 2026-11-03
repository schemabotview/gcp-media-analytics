"""One device's viewing as SESSIONS: activity separated by a quiet gap.

    python stream/sessions.py STB-10002 --gap 30

A session window has no fixed length. It grows while events keep arriving
less than GAP minutes apart, and closes after GAP minutes of silence.
"""
import argparse
import logging

import apache_beam as beam
from apache_beam.transforms import window

from arrivals import events, ts

p = argparse.ArgumentParser()
p.add_argument("device")
p.add_argument("--gap", type=int, required=True)
a = p.parse_args()
logging.getLogger().setLevel(logging.ERROR)


def describe(kv, w=beam.DoFn.WindowParam):
    start = w.start.to_utc_datetime().strftime("%H:%M")
    end = w.end.to_utc_datetime().strftime("%H:%M")
    return f"session {start}-{end}  {kv[1]:>4} events"


with beam.Pipeline(runner="BundleBasedDirectRunner") as pipe:
    (pipe
     | beam.Create(events("17:00", 150, "SUN-SPORTS-1", a.device))
     | beam.Map(lambda e: window.TimestampedValue(
         (e["device_id"], 1), ts(e["event_ts"]).timestamp()))
     | "sessions" >> beam.WindowInto(window.Sessions(a.gap * 60))
     | beam.CombinePerKey(sum)
     | beam.Map(describe)
     | "together" >> beam.WindowInto(window.GlobalWindows())
     | beam.combiners.ToList()
     | beam.Map(lambda rows: print("\n".join(sorted(rows)))))
