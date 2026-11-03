"""A month of viewing-pulse, measured in the units Google Cloud bills by.

    python model/meters.py

A MODEL: one night's real data sizes (sun_gen's), times 30, plus three
stated assumptions. It prints quantities, never prices: a price is the
pricing page's, on the day you read it.
"""
import os

NIGHTS = 30
DASHBOARD_QUERIES = 200      # assumption: dashboard queries a day
STREAM_HOURS = 6             # assumption: hours a night the stream job runs
WORKER_VCPUS = 4             # assumption: one Dataflow worker, 4 vCPUs

size = lambda path: os.path.getsize(path)
batch = sum(size(os.path.join(d, f)) for d in ("data/crm", "data/billing",
            "data/catalogue", "data/epg") for f in os.listdir(d))
events = size("data/viewing/2026-10-31.jsonl")
with open("data/viewing/2026-10-31.jsonl") as f:
    messages = sum(1 for _ in f)

GB, MB = 1e9, 1e6
rows = [
    ("Cloud Storage", "MB stored", batch * NIGHTS / MB),
    ("Pub/Sub", "messages", messages * NIGHTS),
    ("Pub/Sub", "GB published", events * NIGHTS / GB),
    ("BigQuery", "GB scanned",
     events * DASHBOARD_QUERIES * NIGHTS / GB),
    ("Dataflow", "vCPU-hours", STREAM_HOURS * WORKER_VCPUS * NIGHTS),
]
for service, meter, qty in rows:
    print(f"{service:<14} {meter:<13} {qty:>14,.{0 if qty > 1e4 else 1}f}")
