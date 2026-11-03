"""Load one night's EPG into silver.epg_slots, a row per channel slot.

    python warehouse/epg.py --dt 2026-10-31

The vendor's file is one JSON object of channels, each a list of slots:
a shape BigQuery cannot read in place. A load job takes the rows.
"""
import argparse
import json
import os

from google.cloud import bigquery, storage

p = argparse.ArgumentParser()
p.add_argument("--dt", required=True)
a = p.parse_args()

raw = storage.Client().bucket(os.environ["RAW"].removeprefix("gs://"))
guide = json.loads(raw.blob(f"source=epg/dt={a.dt}/{a.dt}.json")
                   .download_as_text())
rows = [{"channel": ch, "title_id": s["title_id"], "slot_start": s["start"],
         "slot_end": s["end"], "dt": a.dt}
        for ch, slots in guide["channels"].items() for s in slots]

job = bigquery.Client().load_table_from_json(
    rows, "silver.epg_slots", job_config=bigquery.LoadJobConfig(
        write_disposition="WRITE_TRUNCATE"))  # the night, replaced whole
job.result()
print(f"{len(rows)} slots, {len(guide['channels'])} channels "
      f"-> silver.epg_slots ({job.output_rows} rows)")
