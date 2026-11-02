"""Copy one night of a source system into the raw zone, in two steps.

    python extract/extract.py plan billing --dt 2026-10-31
    python extract/extract.py copy billing --dt 2026-10-31
    python extract/extract.py published billing
"""
import argparse
import io
import json
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


def queries(source: str, dt: str) -> tuple[dict[str, str], list | None]:
    if source in SNAPSHOT:
        return {t: f"SELECT * FROM {t}" for t in SNAPSHOT[source]}, None
    table = INCREMENTAL[source]
    return ({table: f"SELECT * FROM {table}"
             " WHERE updated_at > %s AND updated_at <= %s"}, list(window(dt)))


def plan(source: str, dt: str) -> None:
    """The manifest, written FIRST: what the copy must deliver."""
    tables, args = queries(source, dt)
    files, columns = {}, {}
    with psycopg.connect(dbname=source) as db:
        for table, query in tables.items():
            cur = db.execute(f"SELECT * FROM ({query}) q LIMIT 0", args)
            columns[f"{table}.csv"] = [c.name for c in cur.description]
            files[f"{table}.csv"] = db.execute(
                f"SELECT count(*) FROM ({query}) q", args).fetchone()[0]
    manifest = {"source": source, "dt": dt, "files": files,
                "columns": columns}
    if args:
        manifest["window"] = {"from": args[0], "to": args[1]}
        print(f"{source}: window ({args[0]}, {args[1]}]")
    name = partition(source, dt) + "_manifest.json"
    bucket().blob(name).upload_from_string(json.dumps(manifest, indent=1))
    for file, rows in files.items():
        print(f"{source}: {file} expects {rows} rows")
    print(f"manifest -> {name}")


def copy(source: str, dt: str) -> None:
    tables, args = queries(source, dt)
    with psycopg.connect(dbname=source) as db:
        for table, query in tables.items():
            out = io.BytesIO()
            with db.cursor().copy(
                    f"COPY ({query}) TO STDOUT (FORMAT csv, HEADER)",
                    args) as cp:
                for chunk in cp:
                    out.write(chunk)
            data = out.getvalue()
            name = f"{partition(source, dt)}{table}.csv"
            bucket().blob(name).upload_from_string(data)
            print(f"{source}: {data.count(b'\n') - 1} rows -> {name}")


def published(source: str, _dt=None) -> None:
    """The newest night G1 published: the loaders' watermark."""
    nights = sorted(o.name.split("/")[1] for o in
                    bucket().list_blobs(prefix=f"source={source}/")
                    if o.name.endswith("/_SUCCESS"))
    print(f"{source}: last published {nights[-1] if nights else 'none'}")


if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("step", choices=["plan", "copy", "published"])
    p.add_argument("source", choices=[*SNAPSHOT, *INCREMENTAL])
    p.add_argument("--dt")
    a = p.parse_args()
    steps = {"plan": plan, "copy": copy, "published": published}
    steps[a.step](a.source, a.dt)
