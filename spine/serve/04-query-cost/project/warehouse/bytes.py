"""What a query reads: BigQuery's estimate before it runs (a dry run, free),
then what it really read and billed.

    python warehouse/bytes.py warehouse/derby_minutes.sql
"""
import sys

from google.cloud import bigquery

CAP = 200_000_000  # bytes: past it the query is refused, not billed

client = bigquery.Client()
sql = open(sys.argv[1]).read()
dry = client.query(sql, job_config=bigquery.QueryJobConfig(
    dry_run=True, use_query_cache=False))
job = client.query(sql, job_config=bigquery.QueryJobConfig(
    maximum_bytes_billed=CAP, use_query_cache=False))
for row in job.result():
    print(*row.values())
print(f"estimated {dry.total_bytes_processed:>12,} bytes")
print(f"read      {job.total_bytes_processed:>12,} bytes")
print(f"billed    {job.total_bytes_billed:>12,} bytes")
