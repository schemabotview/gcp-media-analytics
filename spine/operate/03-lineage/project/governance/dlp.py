"""Sensitive Data Protection on one CRM extract: find what is personal,
then write a copy with it replaced by its kind.

    python governance/dlp.py inspect gs://.../households.csv
    python governance/dlp.py redact gs://... --out redacted.csv
"""
import argparse
import csv
import io
import os
from collections import Counter

from google.cloud import dlp_v2, storage

KINDS = ["EMAIL_ADDRESS", "PHONE_NUMBER", "PERSON_NAME"]

p = argparse.ArgumentParser()
p.add_argument("step", choices=["inspect", "redact"])
p.add_argument("uri")
p.add_argument("--out")
a = p.parse_args()

bucket, name = a.uri.removeprefix("gs://").split("/", 1)
text = storage.Client().bucket(bucket).blob(name).download_as_text()
rows = list(csv.reader(io.StringIO(text)))
dlp = dlp_v2.DlpServiceClient()
project = os.environ["GOOGLE_CLOUD_PROJECT"]
parent = f"projects/{project}/locations/europe-west2"
item = {"table": {
    "headers": [{"name": h} for h in rows[0]],
    "rows": [{"values": [{"string_value": v} for v in r]} for r in rows[1:]]}}
config = {"info_types": [{"name": k} for k in KINDS],
          "min_likelihood": dlp_v2.Likelihood.LIKELY}

if a.step == "inspect":
    found = dlp.inspect_content(request={
        "parent": parent, "inspect_config": config, "item": item}).result
    seen = Counter((f.info_type.name, f.location.content_locations[0]
                    .record_location.field_id.name) for f in found.findings)
    for (kind, column), n in sorted(seen.items()):
        print(f"{kind:<15} {column:<12} {n:>6,} findings")
else:
    replace = {"info_type_transformations": {"transformations": [{
        "primitive_transformation": {"replace_with_info_type_config": {}}}]}}
    done = dlp.deidentify_content(request={
        "parent": parent, "inspect_config": config,
        "deidentify_config": replace, "item": item}).item.table
    with open(a.out, "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(rows[0])
        w.writerows([v.string_value for v in r.values] for r in done.rows)
    print(f"{len(done.rows):,} rows -> {a.out}")
