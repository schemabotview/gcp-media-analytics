"""Households and seconds watched, per channel and minute, in EVENT time -
from the events as they were DELIVERED, duplicates and all.

    python stream/live_viewers.py --from 18:38 --minutes 6

A retry delivers some events twice (arrivals.py). A household still counts
once a minute, but seconds watched would be counted twice: each event is
kept once per event_id, inside its window, before anything is added up.
"""
import argparse
import logging

import apache_beam as beam
from apache_beam.transforms import window

from arrivals import delivered, events, ts

CHANNEL = "SUN-SPORTS-1"


def stamp(e: dict) -> window.TimestampedValue:
    return window.TimestampedValue(e, ts(e["event_ts"]).timestamp())


class Minute(beam.CombineFn):
    """households seen, and seconds watched, in one window"""
    def create_accumulator(self):
        return set(), 0

    def add_input(self, acc, e):
        return acc[0] | {e["household_id"]}, acc[1] + e["watched_s"]

    def merge_accumulators(self, accs):
        accs = list(accs)
        return set().union(*(a[0] for a in accs)), sum(a[1] for a in accs)

    def extract_output(self, acc):
        return len(acc[0]), acc[1]


def label(kv, w=beam.DoFn.WindowParam) -> tuple:
    return w.start.to_utc_datetime().strftime("%H:%M"), kv[1]


def count() -> beam.PTransform:
    return (beam.Map(lambda e: (CHANNEL, e)) | beam.CombinePerKey(Minute())
            | beam.Map(label))


def run(start: str, minutes: int) -> None:
    got = [e for _, e in delivered(events(start, minutes, CHANNEL))]
    with beam.Pipeline(runner="BundleBasedDirectRunner") as p:
        stream = (p | "as delivered" >> beam.Create(got)
                  | "event time" >> beam.Map(stamp)
                  | "minutes" >> beam.WindowInto(window.FixedWindows(60)))
        raw = stream | "count raw" >> count()
        once = (stream
                | "by event_id" >> beam.Map(lambda e: (e["event_id"], e))
                | "group" >> beam.GroupByKey()
                | "keep one" >> beam.Map(lambda kv: next(iter(kv[1])))
                | "count once" >> count())
        ({"raw": raw, "once": once}
         | "join" >> beam.CoGroupByKey()
         | "all minutes" >> beam.WindowInto(window.GlobalWindows())
         | "gather" >> beam.combiners.ToList()
         | "print" >> beam.Map(show))


def show(rows) -> None:
    print("minute  households  watched s (delivered)  watched s (deduped)")
    for minute, j in sorted(rows):
        (n, raw), (_, once) = j["raw"][0], j["once"][0]
        print(f"{minute}   {n:>9}   {raw:>19,}   {once:>18,}")


if __name__ == "__main__":
    logging.getLogger().setLevel(logging.ERROR)
    a = argparse.ArgumentParser()
    a.add_argument("--from", dest="start", required=True)
    a.add_argument("--minutes", type=int, required=True)
    args = a.parse_args()
    run(args.start, args.minutes)
