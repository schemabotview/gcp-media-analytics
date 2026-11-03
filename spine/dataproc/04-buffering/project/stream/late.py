"""Viewers per minute as the night ARRIVED: windows, a watermark, late data.

    python stream/late.py --from 18:38 --minutes 6

The events are fed in the order they were heard (arrivals.py), each stamped
with its EVENT time. The watermark - the pipeline's estimate that nothing
older is still on its way - trails what has been heard by WATERMARK_LAG.
A window fires ON_TIME when the watermark passes its end; an event heard
after that is LATE, and fires the window again, up to ALLOWED_LATENESS.
"""
import argparse
import logging
import os

import apache_beam as beam
from apache_beam.options.pipeline_options import PipelineOptions
from apache_beam.testing.test_stream import TestStream
from apache_beam.transforms import trigger, window

from arrivals import delivered, events, ts

WATERMARK_LAG = 10          # seconds
ALLOWED_LATENESS = 600      # seconds: a window stays open ten minutes late


class Households(beam.CombineFn):
    def create_accumulator(self):
        return set()

    def add_input(self, seen, e):
        return seen | {e["household_id"]}

    def merge_accumulators(self, many):
        return set().union(*many)

    def extract_output(self, seen):
        return len(seen)


def night(start: str, minutes: int) -> TestStream:
    stream, clock = TestStream(), None
    for heard, e in delivered(events(start, minutes, "SUN-SPORTS-1")):
        if heard != clock:
            stream.advance_watermark_to(heard.timestamp() - WATERMARK_LAG)
            clock = heard
        stream.add_elements([window.TimestampedValue(
            e, ts(e["event_ts"]).timestamp())])
    return stream.advance_watermark_to_infinity()


PANES = "out/panes.txt"


def record(kv, w=beam.DoFn.WindowParam, pane=beam.DoFn.PaneInfoParam):
    """Every time a window fires: its minute, why it fired, its count."""
    timing = {0: "EARLY", 1: "ON_TIME", 2: "LATE"}.get(pane.timing, "?")
    with open(PANES, "a") as f:
        print(w.start.to_utc_datetime().strftime("%H:%M"), timing, kv[1],
              file=f)


if __name__ == "__main__":
    logging.getLogger().setLevel(logging.ERROR)
    p = argparse.ArgumentParser()
    p.add_argument("--from", dest="start", required=True)
    p.add_argument("--minutes", type=int, required=True)
    a = p.parse_args()
    os.makedirs("out", exist_ok=True)
    open(PANES, "w").close()
    opts = PipelineOptions(streaming=True)
    with beam.Pipeline(options=opts) as pipe:
        (pipe
         | night(a.start, a.minutes)
         | beam.WindowInto(
             window.FixedWindows(60),
             trigger=trigger.AfterWatermark(late=trigger.AfterCount(1)),
             accumulation_mode=trigger.AccumulationMode.ACCUMULATING,
             allowed_lateness=ALLOWED_LATENESS)
         | beam.Map(lambda e: ("SUN-SPORTS-1", e))
         | beam.CombinePerKey(Households())
         | beam.Map(record))
    panes = [line.split() for line in open(PANES)]
    for minute in sorted({m for m, _, _ in panes}):
        mine = [(t, int(n)) for m, t, n in panes if m == minute]
        on = [n for t, n in mine if t == "ON_TIME"]
        late = [n for t, n in mine if t == "LATE"]
        print(f"{minute}  on time {on[0] if on else '-':>5}  "
              f"late panes {len(late):>3}  final {mine[-1][1]:>5}")
