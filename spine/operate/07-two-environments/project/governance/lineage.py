"""Where a table came from, as Dataplex's lineage recorded it: every
BigQuery job that wrote a table left a link from its sources.

    python governance/lineage.py gold.content_performance_daily
"""
import os
import sys

from google.cloud import datacatalog_lineage_v1 as lineage

project = os.environ["GOOGLE_CLOUD_PROJECT"]
client = lineage.LineageClient()
parent = f"projects/{project}/locations/europe-west2"


def fqn(table: str) -> str:
    return f"bigquery:{project}.{table}"


def upstream(table: str, depth: int = 0, seen: set = set()) -> None:
    print("    " * depth + table)
    if table in seen:
        return
    seen.add(table)
    links = client.search_links(request={
        "parent": parent, "target": {"fully_qualified_name": fqn(table)}})
    for source in sorted({l.source.fully_qualified_name for l in links}):
        upstream(source.split(f"{project}.")[-1], depth + 1)


upstream(sys.argv[1])
