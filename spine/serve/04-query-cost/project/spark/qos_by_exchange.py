"""The derby's quality of service, per broadband exchange and minute: what
the boxes saw (watching, buffering) beside what the exchange measured.

    python spark/qos_by_exchange.py --exchange EX-LDN-04 --from 18:33

Local Spark first: the same code runs on Dataproc later, reading BigQuery.
"""
import argparse

from pyspark.sql import SparkSession, functions as F

DERBY = "T-5001"

p = argparse.ArgumentParser()
p.add_argument("--exchange", required=True)
p.add_argument("--from", dest="start", required=True)
p.add_argument("--minutes", type=int, default=6)
a = p.parse_args()

spark = (SparkSession.builder.master("local[4]").appName("qos")
         .config("spark.ui.showConsoleProgress", "false").getOrCreate())

events = spark.read.json("data/viewing/2026-10-31.jsonl")
homes = spark.read.option("header", True).csv("data/crm/households.csv")
lines = spark.read.json("data/telemetry/2026-10-31.jsonl")

minute = F.date_format(F.col("event_ts"), "yyyy-MM-dd'T'HH:mm'Z'")
seen = (events.where(F.col("title_id") == DERBY)
        .join(homes.select("household_id", "exchange_id"), "household_id")
        .groupBy("exchange_id", minute.alias("minute"))
        .agg(F.countDistinct("household_id").alias("households"),
             F.sum("watched_s").alias("watched_s"),
             (F.sum("buffer_ms") / 1000).alias("buffering_s")))

qos = seen.join(lines.select("exchange_id", "minute", "latency_ms",
                             "loss_pct"), ["exchange_id", "minute"])

t0 = f"2026-10-31T{a.start}Z"
(qos.where((F.col("exchange_id") == a.exchange) & (F.col("minute") >= t0))
    .orderBy("minute").limit(a.minutes)
    .select(F.substring("minute", 12, 5).alias("minute"), "households",
            "watched_s", F.round("buffering_s", 1).alias("buffering_s"),
            "latency_ms", "loss_pct")
    .show())
