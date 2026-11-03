"""Count derby night's viewing events, the Beam way.

    python stream/live_viewers.py --from 18:30 --minutes 5
"""
import argparse
import json
import logging

import apache_beam as beam

DAY = "data/viewing/2026-10-31.jsonl"


def run(start: str, minutes: int) -> None:
    lo = f"2026-10-31T{start}"
    h, m = map(int, start.split(":"))
    hi = f"2026-10-31T{h + (m + minutes) // 60:02d}:{(m + minutes) % 60:02d}"
    with beam.Pipeline(runner="BundleBasedDirectRunner") as p:
        (p
         | "read" >> beam.io.ReadFromText(DAY)
         | "parse" >> beam.Map(json.loads)
         | "window" >> beam.Filter(lambda e: lo <= e["event_ts"] < hi)
         | "by type" >> beam.Map(lambda e: (e["type"], 1))
         | "count" >> beam.CombinePerKey(sum)
         | "gather" >> beam.combiners.ToList()
         | "print" >> beam.Map(lambda rows: [print(f"{k:<10}{n:>7}")
                                             for k, n in sorted(rows)]))


if __name__ == "__main__":
    logging.getLogger().setLevel(logging.ERROR)
    a = argparse.ArgumentParser()
    a.add_argument("--from", dest="start", required=True)
    a.add_argument("--minutes", type=int, required=True)
    args = a.parse_args()
    run(args.start, args.minutes)
