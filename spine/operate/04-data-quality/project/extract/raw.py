"""The raw zone: one bucket, one folder per source and night.

    python extract/raw.py land SOURCE FILE --dt YYYY-MM-DD

Cloud Storage has no folders. An object's name may hold slashes, and
source=epg/dt=2026-10-31/ is only the start of a name: a prefix that tools
list like a folder, and that BigQuery reads back as two columns.
"""
import argparse
import os
from pathlib import Path

from google.cloud import storage

BUCKET = os.environ["RAW"].removeprefix("gs://")
SOURCES = ("crm", "billing", "catalogue", "epg")


def bucket() -> storage.Bucket:
    return storage.Client().bucket(BUCKET)


def partition(source: str, dt: str) -> str:
    if source not in SOURCES:
        raise SystemExit(f"unknown source: {source}")
    return f"source={source}/dt={dt}/"


def land(source: str, file: Path, dt: str) -> str:
    name = partition(source, dt) + file.name
    bucket().blob(name).upload_from_filename(file)
    return name


if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("step", choices=["land"])
    p.add_argument("source")
    p.add_argument("file", type=Path)
    p.add_argument("--dt", required=True)
    a = p.parse_args()
    print(f"{a.source}: {a.file.name} -> {land(a.source, a.file, a.dt)}")
