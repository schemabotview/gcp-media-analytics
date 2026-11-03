"""The derby's buffering ratio per exchange, as a Dataproc Serverless batch:
Silver read from BigQuery, households from the raw zone.

    gcloud dataproc batches submit pyspark spark/qos_job.py ... \
        -- --dt 2026-10-31 --raw $RAW [--write]
"""
import argparse

from pyspark.sql import SparkSession, functions as F

DERBY = "T-5001"

p = argparse.ArgumentParser()
p.add_argument("--dt", required=True)
p.add_argument("--raw", required=True)
p.add_argument("--write", action="store_true")
a = p.parse_args()

spark = SparkSession.builder.appName("qos-by-exchange").getOrCreate()

# Only these columns, and only the derby's rows, leave BigQuery: the
# connector hands the filter and the column list to the Storage Read API.
events = (spark.read.format("bigquery").load("silver.viewing_events")
          .where((F.col("dt") == a.dt) & (F.col("title_id") == DERBY))
          .select("household_id", "watched_s", "buffer_ms"))
homes = (spark.read.option("header", True)
         .csv(f"{a.raw}/source=crm/dt={a.dt}/households.csv")
         .select("household_id", "exchange_id"))

qos = (events.join(homes, "household_id").groupBy("exchange_id")
       .agg(F.sum("watched_s").alias("watched_s"),
            (F.sum("buffer_ms") / 1000).alias("buffering_s"))
       .withColumn("ratio", F.round(F.col("buffering_s")
                                    / F.col("watched_s"), 4))
       .withColumn("dt", F.lit(a.dt).cast("date")))

for r in qos.orderBy(F.desc("ratio")).collect():
    print(f"{r['exchange_id']}  {r['watched_s']:>9,} s watched  "
          f"{r['buffering_s']:>8,.0f} s buffering  {r['ratio']:6.1%}")

if a.write:  # replace this night's partition, and only it
    (qos.write.format("bigquery").mode("overwrite")
        .option("writeMethod", "direct")
        .option("spark.sql.sources.partitionOverwriteMode", "DYNAMIC")
        .save("gold.qos_by_exchange"))
    print(f"gold.qos_by_exchange: dt={a.dt} written")
