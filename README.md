# gcp-media-analytics

**Learn GCP by building a media & broadband analytics platform** — a GraphL concept app
(graphl.in/gcp-media-analytics). Sun, a fictional UK pay-TV and broadband provider, needs two
answers on derby night: how many households are watching each channel right now, and next morning,
how each title performed and where broadband quality spoiled it. One project, `viewing-pulse`,
answers both: a streaming path (Pub/Sub → Dataflow → BigQuery) and a nightly batch (Cloud Storage →
BigQuery Bronze / Silver / Gold, Dataproc for the heavy join), orchestrated by Airflow, governed,
monitored and deployed with Terraform. Every GCP service is taught when the platform first needs
it. Local steps really run; GCP steps are recorded in a real project; every frame says which.
Planned as one film (12 courses, 92 sections). Prerequisites:
[`sql-bank`](https://github.com/schemabotview/sql-bank) and
[`spark-ecommerce-analytics`](https://github.com/schemabotview/spark-ecommerce-analytics).

**Status:** plan v1 awaiting the owner's review; no infra yet.
Plan: [`COURSE-PLAN.md`](COURSE-PLAN.md) · Rules and status: [`CLAUDE.md`](CLAUDE.md).

## Run

Not built yet. Once infra lands:

```sh
npm ci
npm run dev                                # http://localhost:5173 · #/<course>-<section>
npm run check                              # content + 4K render
```

## Layout

```
src/content/<course>/    one file per section (+ narration) and the course index
src/scenes/<course>/     declarative scenes; map.ts, ide.ts, timeline.ts
spine/<course>/<step>/   the real project + transcript at each step (local replay or GCP record)
sun_gen/                 the seeded data generator and its verify
scripts/                 spine.py, checks, registry, shots, film, publishing data
```
