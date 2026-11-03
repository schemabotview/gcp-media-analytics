"""Join the night's events to the catalogue by title_id, then show how many
rows each task of the join read. The derby is one title: one task gets it.

    python spark/skew.py              adaptive execution off
    python spark/skew.py --aqe        on, with its skew join
    python spark/skew.py --salt 4     off, the hot key split by hand
"""
import argparse
import json
from urllib.request import urlopen

from pyspark.sql import SparkSession, functions as F

p = argparse.ArgumentParser()
p.add_argument("--aqe", action="store_true")
p.add_argument("--salt", type=int, default=1)
a = p.parse_args()

spark = (SparkSession.builder.master("local[4]").appName("skew")
         .config("spark.ui.showConsoleProgress", "false")
         .config("spark.sql.shuffle.partitions", 8)
         .config("spark.sql.autoBroadcastJoinThreshold", -1)  # a real shuffle
         .config("spark.sql.adaptive.enabled", a.aqe)
         .config("spark.sql.adaptive.coalescePartitions.enabled", False)
         # this night is small: call a partition skewed past 1 MB and 3x
         # the median, and split it into 256 KB pieces (the defaults are
         # 256 MB, 5x and 64 MB: sized for a real cluster)
         .config("spark.sql.adaptive.skewJoin.skewedPartitionThresholdInBytes",
                 "1MB")
         .config("spark.sql.adaptive.skewJoin.skewedPartitionFactor", 3)
         .config("spark.sql.adaptive.advisoryPartitionSizeInBytes", "256KB")
         .getOrCreate())

events = spark.read.json("data/viewing/2026-10-31.jsonl")
titles = spark.read.option("header", True).csv("data/catalogue/titles.csv")
# Salting: each event gets one of N salts from its id, and the catalogue is
# copied N times, once per salt; the join key is (title_id, salt), so one
# title's rows spread over N partitions. N = 1 is the plain join.
events = events.withColumn("salt", F.abs(F.hash("event_id")) % a.salt)
titles = titles.crossJoin(spark.range(a.salt).withColumnRenamed("id", "salt"))
joined = (events.join(titles, ["title_id", "salt"]).groupBy("kind")
          .agg(F.count("*").alias("events"),
               F.countDistinct("household_id").alias("households"),
               F.sum("watched_s").alias("watched_s")))
for r in joined.orderBy("kind").collect():
    print(f"{r['kind']:<11}{r['events']:>8,} events {r['households']:>6,}"
          f" households {r['watched_s']:>11,} s")

# Spark's own UI, as JSON: each task of the join's stage, rows it read
api = f"{spark.sparkContext.uiWebUrl}/api/v1/applications/" \
      f"{spark.sparkContext.applicationId}"
stages = json.load(urlopen(f"{api}/stages?details=true&status=complete"))
join = max(stages, key=lambda s: s["shuffleReadBytes"])
reads = sorted((t["taskMetrics"]["shuffleReadMetrics"]["recordsRead"]
                for t in join["tasks"].values()), reverse=True)
print(f"the join's stage: {len(reads)} tasks")
for n in reads:
    print(f"{n:>9,}  {'#' * round(40 * n / reads[0])}")
