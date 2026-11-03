"""Run one query, then show how BigQuery ran it: its stages, read in order.

    python warehouse/explain.py warehouse/peaks.sql

Every query here sets maximum_bytes_billed: past the cap it is refused,
not billed.
"""
import sys

from google.cloud import bigquery

CAP = 200_000_000  # bytes

client = bigquery.Client()
config = bigquery.QueryJobConfig(maximum_bytes_billed=CAP,
                                 use_query_cache=False)
job = client.query(open(sys.argv[1]).read(), job_config=config)
for row in job.result():
    print(*row.values())

print(f"{job.total_bytes_processed:,} bytes read, "
      f"{job.slot_millis:,} slot ms, in {job.ended - job.started}")
print(f"{'stage':<22}{'read':>10}{'written':>10}{'slot ms':>10}")
for s in job.query_plan:
    print(f"{s.name:<22}{s.records_read:>10,}{s.records_written:>10,}"
          f"{s.slot_ms or 0:>10,}")
