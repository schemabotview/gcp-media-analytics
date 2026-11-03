"""Silver, read by Spark on this laptop through the BigQuery connector,
and what the connector asked BigQuery for.

    python spark/silver.py --dt 2026-10-31
"""
import argparse
import os
import re

from pyspark.sql import SparkSession, functions as F

DERBY = "T-5001"
CONNECTOR = "com.google.cloud.spark:spark-4.0-bigquery:0.46.0"

p = argparse.ArgumentParser()
p.add_argument("--dt", required=True)
a = p.parse_args()

spark = (SparkSession.builder.master("local[4]").appName("silver")
         .config("spark.ui.showConsoleProgress", "false")
         .config("spark.jars.packages", CONNECTOR)
         .getOrCreate())

events = (spark.read.format("bigquery")
          .option("parentProject", os.environ["GOOGLE_CLOUD_PROJECT"])
          .load("silver.viewing_events")
          .where((F.col("dt") == a.dt) & (F.col("title_id") == DERBY))
          .select("household_id", "watched_s", "buffer_ms"))

# The scan as Spark planned it: what it handed to BigQuery, not what it
# will filter itself
plan = events._jdf.queryExecution().executedPlan().toString()
scan = next(line for line in plan.splitlines() if "BatchScan" in line)
for key in ("PushedFilters", "ReadSchema"):
    print(re.search(key + r": (\[[^\]]*\]|\S+)", scan).group(0))
print(f"{events.count():,} derby events read")
