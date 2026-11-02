"""Copy one night of a source system into the raw zone.

    python extract/extract.py crm --dt 2026-10-30
    python extract/extract.py billing --dt 2026-10-30
"""
import argparse
import io
from datetime import date, timedelta

import psycopg

from raw import bucket, partition

# A snapshot source is copied whole every night; an incremental one only
# for the rows its window holds: changed after the night began, by its end.
SNAPSHOT = {"crm": ["households", "subscriptions", "packages"]}
INCREMENTAL = {"billing": "charges"}


def window(dt: str) -> tuple[str, str]:
    start = date.fromisoformat(dt)
    end = start + timedelta(days=1)
    return f"{start}T00:00:00Z", f"{end}T00:00:00Z"


def copy(db: psycopg.Connection, query: str, args=None) -> tuple[bytes, int]:
    out = io.BytesIO()
    with db.cursor().copy(f"COPY ({query}) TO STDOUT (FORMAT csv, HEADER)",
                          args) as cp:
        for chunk in cp:
            out.write(chunk)
    data = out.getvalue()
    return data, data.count(b"\n") - 1


def extract(source: str, dt: str) -> None:
    folder = partition(source, dt)
    with psycopg.connect(dbname=source) as db:
        if source in SNAPSHOT:
            tables = {t: f"SELECT * FROM {t}" for t in SNAPSHOT[source]}
            args = None
        else:
            start, end = window(dt)
            print(f"{source}: window ({start}, {end}]")
            table = INCREMENTAL[source]
            tables = {table: f"SELECT * FROM {table}"
                      " WHERE updated_at > %s AND updated_at <= %s"}
            args = [start, end]
        for table, query in tables.items():
            data, rows = copy(db, query, args)
            bucket().blob(f"{folder}{table}.csv").upload_from_string(data)
            print(f"{source}: {table}.csv {rows} rows")
    bucket().blob(folder + "_SUCCESS").upload_from_string(b"")
    print(f"{source}: -> {folder}")


if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("source", choices=[*SNAPSHOT, *INCREMENTAL])
    p.add_argument("--dt", required=True)
    a = p.parse_args()
    extract(a.source, a.dt)
