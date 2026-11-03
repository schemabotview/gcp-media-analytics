"""The derby's buffering ratio per exchange: seconds spent buffering for
every second watched, over the whole match.

    python spark/buffering.py
"""
from pyspark.sql import SparkSession, functions as F

DERBY = "T-5001"

spark = (SparkSession.builder.master("local[4]").appName("buffering")
         .config("spark.ui.showConsoleProgress", "false").getOrCreate())

events = spark.read.json("data/viewing/2026-10-31.jsonl")
homes = spark.read.option("header", True).csv("data/crm/households.csv")

ratio = (events.where(F.col("title_id") == DERBY)
         .join(homes.select("household_id", "exchange_id"), "household_id")
         .groupBy("exchange_id")
         .agg(F.sum("watched_s").alias("watched_s"),
              (F.sum("buffer_ms") / 1000).alias("buffering_s"))
         .withColumn("ratio", F.col("buffering_s") / F.col("watched_s")))

for r in ratio.orderBy(F.desc("ratio")).collect():
    print(f"{r['exchange_id']}  {r['watched_s']:>9,} s watched  "
          f"{r['buffering_s']:>8,.0f} s buffering  {r['ratio']:6.1%}")
