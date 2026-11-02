"""G1, the landing gate: is a night's folder exactly what its manifest
promised? Only then is it published.

    python extract/g1.py billing --dt 2026-10-31      exit 1 when it is not

PASS writes an empty _SUCCESS, the one object the loaders downstream wait
for. FAIL writes nothing: the last published night stays the newest.
"""
import argparse
import csv
import io
import json
import sys

from raw import bucket, partition


def check(source: str, dt: str) -> bool:
    folder, raw = partition(source, dt), bucket()
    manifest = json.loads(raw.blob(folder + "_manifest.json")
                          .download_as_bytes())
    there = {b.name.removeprefix(folder)
             for b in raw.list_blobs(prefix=folder)}
    promised = manifest["files"]
    results = [("files", len(there & set(promised)), len(promised))]
    for file in sorted(there & set(promised)):
        lines = list(csv.reader(io.StringIO(
            raw.blob(folder + file).download_as_text())))
        declared = manifest["columns"][file]
        found = sum(a == b for a, b in zip(lines[0], declared))
        results += [(f"{file} columns", found, len(declared)),
                    (f"{file} rows", len(lines) - 1, promised[file])]
    for name, got, want in results:
        verdict = "PASS" if got == want else "FAIL"
        print(f"  {name:<20} {got:>5} of {want:<5} {verdict}")
    return all(got == want for _, got, want in results)


if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("source")
    p.add_argument("--dt", required=True)
    a = p.parse_args()
    night = f"{a.source} dt={a.dt}"
    if not check(a.source, a.dt):
        sys.exit(f"G1 FAIL: {night} is not published")
    seal = bucket().blob(partition(a.source, a.dt) + "_SUCCESS")
    seal.upload_from_string(b"")
    print(f"G1 PASS: {night} published (_SUCCESS)")
