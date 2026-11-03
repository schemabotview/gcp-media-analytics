"""Households and seconds watched, per channel and minute, in EVENT time -
from the events as they were DELIVERED, duplicates and all.

    python stream/live_viewers.py --from 18:38 --minutes 6
    python stream/live_viewers.py --from 17:30 --minutes 120 --table T

A retry delivers some events twice (arrivals.py). A household still counts
once a minute, but seconds watched would be counted twice: each event is
kept once per event_id, inside its window, before anything is added up.
"""
import argparse
import json
import logging
import os

import apache_beam as beam
from apache_beam.options.pipeline_options import PipelineOptions
from apache_beam.transforms import trigger, window

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


def row(minute: str, j: dict) -> dict:
    """one minute, as a row of live.concurrent_viewers"""
    households, watched = j["once"][0]
    return {"minute": f"2026-10-31T{minute}:00Z", "channel": CHANNEL,
            "households": households, "watched_s": watched}


def run(start: str, minutes: int, table: str | None = None) -> None:
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
        joined = {"raw": raw, "once": once} | "join" >> beam.CoGroupByKey()
        if table:  # streaming inserts: each row queryable as soon as it lands
            (joined
             | "rows" >> beam.MapTuple(row)
             | "to BigQuery" >> beam.io.WriteToBigQuery(
                 f"{os.environ['GOOGLE_CLOUD_PROJECT']}:{table}",
                 method=beam.io.WriteToBigQuery.Method.STREAMING_INSERTS,
                 create_disposition="CREATE_NEVER"))
        (joined
         | "all minutes" >> beam.WindowInto(window.GlobalWindows())
         | "gather" >> beam.combiners.ToList()
         | "print" >> beam.Map(show))


class Once(beam.CombineFn):
    """Minute, for a job that fires again and again: each firing re-sends
    what came before, so seconds are kept per event_id, not added up."""
    def create_accumulator(self):
        return set(), {}

    def add_input(self, acc, e):
        seconds = {**acc[1], e["event_id"]: e["watched_s"]}
        return acc[0] | {e["household_id"]}, seconds

    def merge_accumulators(self, accs):
        accs = list(accs)
        return (set().union(*(a[0] for a in accs)),
                {k: v for a in accs for k, v in a[1].items()})

    def extract_output(self, acc):
        return len(acc[0]), sum(acc[1].values())


def stream_row(kv, w=beam.DoFn.WindowParam) -> dict:
    households, watched = kv[1]
    return {"minute": w.start.to_rfc3339(), "channel": kv[0],
            "households": households, "watched_s": watched,
            "writer": "dataflow"}


# The job's watermark follows the clock, and this replays Saturday: every
# event is days late. A live feed would keep 600 s; the replay keeps 3 days,
# and gathers each minute's late events into a firing every 30 s.
REPLAY_LATENESS = 3 * 24 * 3600


def live(subscription: str, table: str) -> None:
    """The same counting, as a streaming job on Dataflow, fed by Pub/Sub."""
    project = os.environ["GOOGLE_CLOUD_PROJECT"]
    options = PipelineOptions(
        runner="DataflowRunner", project=project, region="europe-west2",
        streaming=True, job_name="live-viewers", max_num_workers=1,
        temp_location=os.environ["STAGING"] + "/tmp",
        service_account_email=os.environ["DATAFLOW_SA"])
    p = beam.Pipeline(options=options)
    (p
     | "read" >> beam.io.ReadFromPubSub(
         subscription=f"projects/{project}/subscriptions/{subscription}",
         timestamp_attribute="ts")        # event time, from the box
     | "parse" >> beam.Map(json.loads)
     | "channel" >> beam.Filter(lambda e: e["channel"] == CHANNEL)
     | "minutes" >> beam.WindowInto(
         window.FixedWindows(60), allowed_lateness=REPLAY_LATENESS,
         trigger=trigger.AfterWatermark(
             late=trigger.AfterProcessingTime(30)),
         accumulation_mode=trigger.AccumulationMode.ACCUMULATING)
     | "by event_id" >> beam.Map(lambda e: (e["event_id"], e))
     | "group" >> beam.GroupByKey()
     | "keep one" >> beam.Map(lambda kv: next(iter(kv[1])))
     | "key" >> beam.Map(lambda e: (CHANNEL, e))
     | "count" >> beam.CombinePerKey(Once())
     | "rows" >> beam.Map(stream_row)
     | "to BigQuery" >> beam.io.WriteToBigQuery(
         f"{project}:{table}", create_disposition="CREATE_NEVER",
         method=beam.io.WriteToBigQuery.Method.STREAMING_INSERTS))
    job = p.run()
    print(f"job {job.job_id()}: {job.state}")


def show(rows) -> None:
    print("minute  households  watched s (delivered)  watched s (deduped)")
    for minute, j in sorted(rows):
        (n, raw), (_, once) = j["raw"][0], j["once"][0]
        print(f"{minute}   {n:>9}   {raw:>19,}   {once:>18,}")


if __name__ == "__main__":
    logging.getLogger().setLevel(logging.ERROR)
    a = argparse.ArgumentParser()
    a.add_argument("--from", dest="start")
    a.add_argument("--minutes", type=int)
    a.add_argument("--table")
    a.add_argument("--subscription")
    args = a.parse_args()
    if args.subscription:
        live(args.subscription, args.table)
    else:
        run(args.start, args.minutes, args.table)
