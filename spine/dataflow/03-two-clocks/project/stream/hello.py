"""The smallest Beam pipeline: a PCollection in, transforms, one out.

    python stream/hello.py

The DirectRunner runs it here, on this laptop. The same pipeline, unchanged,
runs on Dataflow when the runner is DataflowRunner.
"""
import logging

import apache_beam as beam

KINDS = ["play", "heartbeat", "heartbeat", "buffer", "heartbeat", "stop"]

logging.getLogger().setLevel(logging.ERROR)
with beam.Pipeline(runner="BundleBasedDirectRunner") as p:
    (p
     | "events" >> beam.Create(KINDS)            # a PCollection
     | "pair" >> beam.Map(lambda kind: (kind, 1))   # a PTransform
     | "count" >> beam.CombinePerKey(sum)          # another
     | "gather" >> beam.combiners.ToList()
     | "print" >> beam.Map(lambda rows: print(sorted(rows))))
