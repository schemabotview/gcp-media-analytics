# Learn GCP by building a media & broadband analytics platform: full course, beginner to professional — plan

**Plan status:** v1.2, awaiting owner review (2026-11-02). v1.1: the pilot is Course 5; §5.3–5.5
as built (windows by night, the watermark is the last published night); the facts `sun_gen` froze.
v1.2: Courses 3–4 as prepared (§3.5–3.8 and Course 4 await recording); derby-day viewing and
telemetry generated, their facts exact. Agreed with the owner: Python
throughout (Beam and PySpark), the owner's GCP project for recorded steps, the company is **Sun**
(fictional), no ML or AI features. Shared rules (section shape, ◆ detours, packaging, build order)
are in `../CLAUDE.md`; this plan states only what is specific to this concept.

## The idea

**Sun** is a UK pay-TV and broadband provider (fictional). Its households watch on a set-top box or
the app, over Sun's own broadband. On Saturday night the **Northbridge v Eastfield derby** is the
biggest live event of the month, and the business needs two answers:

- **Live, while it plays:** how many households are watching each channel, minute by minute, and is
  any broadband exchange buffering?
- **Next morning:** how did each title perform yesterday (live vs catch-up minutes, unique
  households, per platform and region), and where did network quality spoil the viewing?

One project, `viewing-pulse`, answers both: a **streaming path** (Pub/Sub → Dataflow → BigQuery)
and a **nightly batch** (GCS raw zone → BigQuery Bronze → Silver → Gold, with Dataproc for the
heavy QoS join), orchestrated by Airflow, governed and monitored, all deployed by Terraform.

The learner learns **GCP and the platform together**: every service is taught **when the platform
first needs it**, and background (how a region is built, how IAM inherits, how BigQuery separates
storage from compute, what a watermark is) appears as a ◆ detour at the moment it answers a question
on screen.

| Sun needs to… | GCP teaches | course |
| --- | --- | --- |
| know where its platform will live | regions, zones, org → folder → project, APIs, billing | 2 |
| create anything at all, repeatably | projects, Terraform and its GCS state, budgets | 3 |
| let a pipeline in without a key file | IAM, service accounts, impersonation, Secret Manager, KMS | 4 |
| land nightly extracts that can be trusted | GCS buckets, path partitions, manifests, retention, lifecycle | 5 |
| hear every set-top box, now | Pub/Sub: topics, subscriptions, ack, ordering, dead letters | 6 |
| count viewers while the match plays | Dataflow / Beam: windows, watermarks, late data, sessions | 7 |
| turn files into tables, once and correctly | BigQuery: datasets, external vs native, partitioning, `MERGE`, SCD2 | 8 |
| join billions of heartbeats to the network | Dataproc: Spark on Serverless, the BigQuery connector, skew | 9 |
| answer the business, cheaply | Gold marts, reconciliation, bytes scanned, authorized views, Looker | 10 |
| run it every night, and recover | Airflow / Composer: DAGs, sensors, retries, backfill | 11 |
| protect, watch and ship it | policy tags, DLP, Dataplex, Logging, Monitoring, dev/prod, Cloud Build | 12 |

Why media and broadband:

- **Two clocks in one business.** The live match needs seconds; the commercial report needs a
  correct number tomorrow. Streaming and batch both have a reason, and the film shows where each
  one's truth comes from.
- **The data misbehaves in teachable ways**: boxes with wrong clocks, duplicated deliveries, an EPG
  that misses a title, one event that is 60% of the night.
- **The scope is an MVP**: no ML, no recommendations, no AI. Churn, recommendations and Vertex AI
  are named in 12.9 and nowhere built.

Prerequisites: SQL (`sql-bank`) and Spark (`spark-ecommerce-analytics`). They are referenced, never
re-taught.

## Packaging

**One film: "Learn GCP by building a media & broadband analytics platform: full course, beginner to
professional"** — 12 courses, 92 sections, ~2 h 10 min (section ~85 s), titled *concept: what the
platform gets* (e.g. "Watermarks: counting the late boxes"). The film opens with the finished
answer: the derby's live concurrent-viewers curve, and the exchange that buffered.

## Stack and pins

Same pins as the sister repos where they overlap; a pin marked *first use* is set when its first
step is recorded, then frozen.

| what | pin | role |
| --- | --- | --- |
| PostgreSQL | **18.6** (`sql-bank`'s `setup-postgres.sh`) | the CRM and billing source systems |
| Python | **3.14.9** | the generator, extractors, producers, gates |
| Apache Beam (Python SDK) | *first use* (the newest release supporting Python 3.14) | the streaming and batch Dataflow pipelines; DirectRunner locally |
| PySpark | **4.2.0** on Java **21** | the QoS job, run locally; the same file runs on Dataproc Serverless |
| Dataproc Serverless runtime | *first use* | the recorded Spark batch |
| spark-bigquery-connector | *first use* (matching the runtime) | Spark ↔ BigQuery |
| Apache Airflow + `apache-airflow-providers-google` | *first use* (matching a Composer 3 image) | the nightly DAG, run with `airflow dags test` |
| Google Cloud CLI (`gcloud`, `bq`, `gcloud storage`) | **570.0.0** (the image's) | reads, the data plane, the state bootstrap |
| Pub/Sub emulator | (from the CLI's components) | local publish / pull |
| fake-gcs-server | **1.56.1** | GCS, emulated, for local landing |
| google-cloud-* client libraries | `google-cloud-storage` **3.17.1**, `psycopg[binary]` **3.3.6**; the rest *first use* (`requirements.txt`) | storage, pubsub, bigquery, secret-manager |
| Terraform | **1.17.0** (as `aws-ecommerce`, `azure-trade-finance`) | every resource; `.terraform.lock.hcl` committed |
| `hashicorp/google` provider | *first use* | GCP resources |
| GCP project | the owner's | every "recorded on GCP" step |

Region **`europe-west2`** (London), zones a–c. Infrastructure is **Terraform** from the first
resource (Course 3) to prod (Course 12). The CLI reads and moves data; it creates nothing except the
state bucket's bootstrap.

## The app: `viewing-pulse`

```
viewing-pulse/
  infra/              Terraform: main.tf, variables.tf, backend.tf + modules/ (iam, storage,
                      kms, pubsub, bigquery, dataflow, dataproc, composer, governance,
                      monitoring), envs/dev.tfvars, envs/prod.tfvars                  (3 → 12)
  sources/            crm/schema.sql, billing/schema.sql; catalogue/titles.csv, epg/   (3)
  extract/            extract.py: CRM + billing → raw zone, manifest; g1.py            (5)
  produce/            settop.py: replays the night's events into Pub/Sub              (6)
  stream/             live_viewers.py (Beam), its tests                                (7)
  sql/                bronze/, silver/, gold/ (BigQuery SQL), gates/ g2.sql g3.sql g4.sql (8, 10)
  spark/              qos_by_exchange.py (PySpark)                                     (9)
  dags/               viewing_daily.py (Airflow)                                       (11)
  tests/              gate, transform and pipeline tests                               (7 →)
  cloudbuild.yaml     plan, test, deploy                                               (12)
```

| After course | The platform can… |
| --- | --- |
| 3 Start | read the CRM; deploy a bucket from Terraform, state in GCS |
| 4 Secure | run as service accounts with no key file; read a secret; encrypt with Sun's own key |
| 5 Land | land the night's extracts in an immutable, partitioned raw zone, refusing a short batch (G1) |
| 6 Stream | receive every box's events on three topics, with redelivery and dead letters |
| 7 Dataflow | count concurrent viewers per channel per minute, live, into BigQuery |
| 8 Lakehouse | hold Bronze as received, and a deduplicated, conformed Silver with SCD2 subscribers (G2, G3) |
| 9 Dataproc | compute buffering ratio per exchange per title, at scale, despite the derby's skew |
| 10 Serve | publish reconciled Gold marts (G4), cheap to query, safe to share, modelled for Looker |
| 11 Orchestrate | run nightly end to end, wait for the batch, retry, backfill, block on a failed gate |
| 12 Operate | protect personal data, show lineage, alert, and deploy to prod from CI |

## The data

Synthetic, owned and seeded: `sun_gen` (built like `tradebook_gen`), standard library only, every
planted fault a named constant asserted by `python -m sun_gen verify`. Business date **Saturday
2026-10-31**; the derby kicks off at **17:30 UTC**. Small enough to replay locally in seconds.

| planted fault | caught by | section |
| --- | --- | --- |
| the billing extract copied short: three rentals re-rated at 02:00:04, after the plan counted 1,068 | G1: do not publish (no `_SUCCESS`); the last published night stays 2026-10-30 | 5.5 |
| the same event delivered twice (at-least-once) | dedupe by `event_id` in the window, again in Silver | 6.5, 7.6, 8.7 |
| boxes with clocks minutes behind; events arriving late | event time, the watermark, allowed lateness | 7.3, 7.5 |
| events out of order for one device | ordering keys; session windows | 6.6, 7.7 |
| a poison message (not JSON) | the dead-letter topic after 5 attempts | 6.7 |
| a heartbeat with no `event_id`; a `title_id` not in the EPG | G2 quarantine | 8.6 |
| a household's package upgraded mid-month | SCD2 `MERGE` | 8.8 |
| an EPG slot missing for one channel | G3; an inner join would lose its minutes | 8.9 |
| the derby is ~60% of the night's events | a Spark straggler; AQE / salting | 9.5, 9.6 |
| one exchange buffering during the second half | the answer, live and next morning | 7.8, 9.4, 10.8 |
| Gold minutes ≠ Silver minutes (a bug planted in 10.3) | G4 reconciliation | 10.3 |
| emails and phone numbers in the CRM | policy tags, DLP de-identification | 12.1, 12.2 |

## Facts

Frozen: frames quote them. Extend; never change a value a frame already quotes. Real ids from the
owner's project are never shown: the recorder normalises them to the values below. Numeric targets
marked † are what `sun_gen` is built to produce; they are frozen when its `verify` passes.

| fact | value |
| --- | --- |
| company | Sun (fictional UK pay-TV and broadband provider), `sun.example`; Priya, data engineer |
| projects | `sun-media-dev`, `sun-media-prod`; numbers shown as `100000000001` / `100000000002` |
| region | `europe-west2` (London), zones `a`, `b`, `c` |
| labels | `app=viewing-pulse`, `env`, `owner=media-data` |
| buckets | `sun-media-dev-raw`, `sun-media-dev-tfstate` (prefix `env/dev`, `env/prod`): Terraform names them `<project>-raw`, `<project>-tfstate`, so the recorder's project normalisation shows these |
| billing account | shown as `000000-000000-000001`; the recorder's host as `priya-laptop` |
| raw paths | `source=<crm\|billing\|catalogue\|epg>/dt=2026-10-31/` + `_manifest.json`, `_SUCCESS` |
| service accounts | `sa-ingest`, `sa-dataflow`, `sa-dataproc`, `sa-airflow`, `sa-cicd` `@sun-media-dev.iam.gserviceaccount.com` |
| secret / key | secret `crm-db-password`; key ring `kr-media`, key `k-raw` |
| topics | `viewing-events`, `network-telemetry`, `device-events`, `dead-letter`; subscriptions `*-dataflow` |
| datasets | `bronze`, `silver`, `gold`, `live`, `audit` (all `europe-west2`) |
| tables | `bronze.viewing_events`, `bronze.subscribers`, `bronze.billing`, `silver.viewing_sessions`, `silver.dim_subscriber` (SCD2), `silver.dim_title`, `silver.epg_slots`, `gold.content_performance_daily`, `gold.qos_by_exchange`, `live.concurrent_viewers`, `audit.gate_results` |
| derby | "Northbridge v Eastfield", title `T-5001`, channel `SUN-SPORTS-1`, 2026-10-31 17:30–19:25 UTC |
| households | 5,000 (`HH-10001` … `HH-15000`), emails `@mail.example`, phones in Ofcom's drama range `07700 900xxx`; platforms `settop`, `app-ios`, `app-android`, `web` |
| CRM | `packages` (`P-ESS` Essentials, `P-ENT` Entertainment, `P-SPT` Sports, `P-ULT` Ultimate), `households`, `subscriptions` (one row per version); `HH-10042` Entertainment → Sports on 2026-10-15; 37 households buy Sports on derby day |
| billing | `charges` (`subscription`, `rental`, `upgrade`); a night's window is (dt 00:00, dt+1 00:00] on `updated_at`: dt=2026-10-30 holds 1,051, dt=2026-10-31 holds 1,068 |
| EPG | six channels (`SUN-ONE`, `SUN-SPORTS-1/2`, `SUN-MOVIES-1/2`, `SUN-NEWS`); the gap: `SUN-MOVIES-2` 20:00–22:00 |
| exchanges | 12: `EX-LDN-01`…`06`, `EX-BHM-01`…`03`, `EX-MAN-01`…`03`; `EX-LDN-04` buffers in the second half |
| the answer | derby peak 2,140 concurrent households at 18:41 (no other minute reaches it); `EX-LDN-04` buffering ratio 4.1% vs 0.6% on every other exchange (buffering seconds ÷ watched seconds, the derby's events) |
| viewing | 400,956 events on 31 October (`play`, `heartbeat` a minute, `buffer`, `stop`), the derby 62% of them; §3.4 traces `STB-13795` (EX-LDN-04: 136 heartbeats, 40 stalls, all after 18:35) |
| telemetry | 12 exchanges × 1,440 minutes; `EX-LDN-04`'s latency and loss climb 18:35–19:25 |
| alerts | notification channel `media-data@sun.example` |
| ids | any other id (job, operation, run) as `…000NN` in order of first appearance |

**Name note:** "Sun" collides with real brands (The Sun newspaper, Sun TV). On screen it is always
"Sun", the fictional provider, with no logo, colour or domain resembling either; `sun.example` only.

## Frames

- **Map frame** (ported from `azure-trade-finance`'s `map.ts`): the platform's WHOLE final
  architecture drawn the GCP way — project → region, then two lanes: **batch** (Sources | Raw |
  Bronze | Silver | Gold | Looker) and **stream** (Producers | Pub/Sub | Dataflow | `live` |
  dashboard), with G1–G4 as badges. A part not built yet is `muted`; `BUILT[course]` is what exists;
  what a section adds is ringed by its `focus`. Every map frame shares one fit.
- **IDE frame** (ported from `azure-trade-finance`'s `ide.ts`): explorer | editor over terminal |
  fixed side pane. HCL, Python (Beam, PySpark, Airflow), BigQuery SQL and YAML are all shown here.
- **◆ full scene**: a canonical big picture (regions and zones, IAM inheritance, Beam's model,
  watermarks, BigQuery's architecture, Dataproc's shapes, Airflow's model, three kinds of progress),
  its own section, with real output inside it.
- **Timeline frame** (new, for Course 7): event time on one axis, processing time on the other;
  windows, the watermark line and late events drawn on it. Built as a frame so 7.3–7.7 share a fit.
- The Cloud Console is never screenshotted: what a page would show is drawn from the CLI's or API's
  own output.
- **Icons:** graphl-flow **0.9.0** adds Google Cloud's own icons — `gcs bigquery pubsub dataflow
  dataproc composer cloudkms secretmanager gcpiam dataplex dlp cloudlogging cloudmonitoring
  cloudbuild gcpproject gcpbilling` — plus brand marks `gcp` and `looker`. A key a scene needs that is
  not there is added in graphl-flow (`scripts/gen-gcp-icons.mjs`), never drawn locally. ui-shell's
  peer range (`>=0.2.0 <1`) already admits it.

## The spine

`spine/<course>/<NN-step>/` = `project/` + `session.txt` + `step.json`, one cumulative chain, as
`azure-trade-finance`. Each step has exactly one of `first`, `from` + `changes`, or `lab`.

- **Local** (`{}`): replayed every time, deterministically — PostgreSQL, the generator, fake-gcs,
  the Pub/Sub emulator, Beam DirectRunner, local Spark, the gates.
- **GCP** (`{"gcp": true}`): **recorded once, never replayed**. Its normalised transcript and a key
  (hash of the step and its ancestors) are committed; `check:spine` runs nothing and fails when a
  step changed without a re-record. A course's resources are deployed at its first GCP step and
  destroyed after its last; the project holds nothing between recordings except the state bucket.
- **Normalisation** in the recorder, never by hand: project ids and numbers, service-account
  unique ids, job / operation / run ids, hostnames, emails, timestamps. A transcript holding a
  fragment of a real id is refused (`scripts/leaks.py`, as azure-trade-finance).
- **Terraform state never enters the spine**: GCS backend only; `.terraform.lock.hcl` committed.
- **BigQuery's numbers are deterministic**: the data is seeded, so a recorded query's result is the
  same each time it is recorded. A scene that quotes a number reads it from a transcript.
- **Streaming runs are bounded**: the producer replays the derby at 60× (the match in ~2 minutes),
  and the Dataflow job is drained after it. Event time is the business date; processing time is
  `volatile`.
- A step that breaks things on purpose is `"branch": true` and discarded.

## Verification levels

Every frame is in one level, and says so when it is not the first:

| level | means |
| --- | --- |
| `runs locally` | really run here: PostgreSQL, Beam DirectRunner, Spark, Python |
| `recorded on GCP` | run once in the owner's project; the transcript is the record |
| `emulated` | Pub/Sub emulator, fake-gcs-server; labelled, never presented as GCP's own output |
| `compiled` | `terraform validate` / `plan`: real, not applied (Composer, the prod project) |
| `doc-cited` | Google Cloud documentation says so; the URL is in the scene |
| `model` | a documented rule reproduced as a small program; proves nothing about GCP |

**Cost rules:** Composer is never deployed (its environment is billed by the hour): the DAG runs
under local Airflow against the real project (`recorded on GCP`), and the Composer environment is
`compiled`. Dataflow and Dataproc run only bounded jobs, drained / finished and destroyed in the
same recording. Every query sets `maximum_bytes_billed`. No prices are quoted as facts: cost frames
show the project's own billing export or a labelled model.

## How a section teaches

Differences from the shared shape: a failure is its own step with real output (a
`PERMISSION_DENIED`, a gate's `DQ_GATE_FAILED`, a late pane). Acronyms are spelled for the speech
engine (G C S, B Q, D L P, K M S, Q o S). A ◆ detour returns to the platform.

## The courses

Side pane = the diagram. ◆ = detour. ⑂ = a branch step. Level: L runs locally · G recorded on GCP ·
E emulated · C compiled · D doc-cited · M model. `L · E`: local code against an emulator.

**1. `intro` · Media analytics, and what we'll build · 3**

| # | Section | Step | Side pane | Level |
| --- | --- | --- | --- | --- |
| 1 | A night of viewing, in one picture | concept | household → box / app → events → Sun; broadband underneath | D |
| 2 | Two questions, two clocks | lab: `derby.py` computes both answers from the raw events (the platform recomputes them in 7 and 10) | the derby curve; ratio per exchange | L |
| 3 | What we'll build | concept | **the map**, both lanes lit (full frame) | D |

**2. `how-gcp-runs` · How Google Cloud is built · 7**

| # | Section | Step | Side pane | Level |
| --- | --- | --- | --- | --- |
| 1 | ◆ full scene: regions and zones | `gcloud compute regions describe europe-west2` | region → zones → the global network | G |
| 2 | The resource hierarchy | `gcloud projects describe`, `get-ancestors` | organization → folders → projects → resources | G |
| 3 | APIs are switched on per project | `gcloud services list --enabled`; a Compute Engine call refused (SERVICE_DISABLED), the API enabled — the one switch the CLI makes; recorded before §2.1, which needs it | project → enabled services → endpoints | G |
| 4 | Control plane vs data plane | Google's public `gs://cloud-samples-data`: the bucket's settings vs its objects, both URIs from `--log-http` | `storage.googleapis.com` JSON API: bucket vs object resources | G |
| 5 | Console, gcloud, Terraform: three clients | one read three ways, `--log-http` | three clients, one REST API | G |
| 6 | Serverless and managed clusters | concept | BigQuery, Pub/Sub, Dataflow vs Dataproc clusters on the responsibility line | D |
| 7 | How GCP charges | lab: `meters.py`, a month in billed units from sun_gen's sizes and three stated assumptions; no prices | meters: GB stored, bytes scanned, messages, vCPU-hours | M · L |

**3. `start` · The sources, and a first deployment · 8**

| # | Section | Step | Side pane | Level |
| --- | --- | --- | --- | --- |
| 1 | Sun's five sources | `wc -l` over sun_gen's data; the sources' README | five sources → nightly batch / live stream | L |
| 2 | The CRM | `psql`: households, subscriptions, packages | ER: household → subscription → package | L |
| 3 | The catalogue and the EPG | `titles.csv`, `epg/2026-10-31.json` | channel × slot → title | L |
| 4 | An event's life | `trace.jq` over `STB-13795`'s derby: `play` → heartbeats → `buffer` → `stop` | the event sequence on one device | L |
| 5 | Signing in | `gcloud auth list`, `config list`; nothing labelled `app=viewing-pulse` yet | the empty map; naming and labels | G |
| 6 | A first Terraform file | `main.tf`: the raw bucket; `init`, `plan`, `apply` | Terraform → google provider → API → bucket | G |
| 7 | State, and where it lives | `backend "gcs"`, bootstrapped by the CLI (`bootstrap.sh`); the state moves into the bucket; every run takes the lock (a refused plan needs a waiting apply, so it is not shown) | code ↔ state ↔ GCP; the lock object | G |
| 8 | Variables, modules, a budget | `modules/`, `fmt -check`, `validate`; a billing budget at 80% | the module tree; budget → email | G |

**4. `secure` · Identity first · 8**

| # | Section | Step | Side pane | Level |
| --- | --- | --- | --- | --- |
| 1 | Cloud IAM | `get-iam-policy`, filtered: the binding count, `roles/editor`'s members, the owner count | an allow policy: role → members | G |
| 2 | IAM inheritance (drawn in the side pane: it fits) | the project's policy and the bucket's (`projectOwner:` convenience members) | policies union down the hierarchy | G |
| 3 | Service accounts | the five `sa-*` accounts in Terraform, listed from its state | one account per job, who wears it | G |
| 4 | No key files | Priya may impersonate each SA (Terraform); no user-managed keys; a token minted on request. The org-policy refusal only if the project sits in an organization (Open) | person → token for the SA, short-lived | G |
| 5 | ⑂ PERMISSION_DENIED | `sa-ingest` lists the raw zone: refused (`storage.objects.list`); §4.8 grants the narrow role | missing permission → the role that holds it | G |
| 6 | Secret Manager | `crm-db-password` (a generated value, never printed: `wc -c`); `sa-ingest` reads it, `sa-dataflow` is refused | secret → versions → accessor | G |
| 7 | Cloud KMS and CMEK | `kr-media` / `k-raw`; the raw bucket's default key; rotation | key ring → key → versions → bucket | G |
| 8 | Least privilege | the platform's role matrix applied | matrix: service account × resource × role | G |

**5. `land` · Cloud Storage, and a batch you can trust · 8** — the pilot

| # | Section | Step | Side pane | Level |
| --- | --- | --- | --- | --- |
| 1 | Buckets and the raw zone | location, storage class, uniform bucket-level access | bucket → objects; flat names that look like folders | G |
| 2 | Paths as partitions | `source=…/dt=2026-10-31/` | the raw zone's tree | L · E |
| 3 | The nightly extracts | `extract.py`: the CRM as a snapshot, billing by window, dt=2026-10-30; each folder closed by `_SUCCESS`, unchecked | source → extract → raw; snapshot vs window | L · E |
| 4 | The manifest | `plan` writes dt=2026-10-31's `_manifest.json` FIRST: window, expected rows, columns | plan → manifest → copy → G1 | L · E |
| 5 | ⑂ G1 fails | the copy lands 1,065 of 1,068; G1 FAIL; only G1 writes `_SUCCESS` now | the night in order; G1's checks | L · E |
| 6 | Retry-safe and sealed | a retried copy rewrites the same names; G1 seals with `ifGenerationMatch=0` (a second seal refused); a sealed night refuses a copy | a retry lands on the same path until sealed | G |
| 7 | Immutable by policy | a retention policy (dev: one hour, so a recording can be torn down the same day); a delete refused | object → retention → refused | G |
| 8 | Hot to cold | lifecycle rules in Terraform: Standard → Nearline → Coldline → Archive | an object's age on a timeline | G |

**6. `stream` · Pub/Sub: hearing every box · 7**

| # | Section | Step | Side pane | Level |
| --- | --- | --- | --- | --- |
| 1 | Why a stream | concept, the §1.2 curve | tomorrow's batch vs the match now | D |
| 2 | Topics and subscriptions | the three topics in Terraform | publisher → topic → subscriptions → subscribers | G |
| 3 | Publishing | `settop.py` replays the derby into the emulator at 60×; a retry re-sends one message in 400 | box → message (data + attributes) → topic | L · E |
| 4 | Pull and ack | a subscriber; the ack deadline; an unacked message redelivered | message → lease → ack / redeliver | L · E |
| 5 | At-least-once | the same `event_id` twice | why duplicates are normal; who dedupes | L · E |
| 6 | Ordering keys | per-device order with `device_id` as key (STB-13795) | one key, one ordered lane | L · E |
| 7 | Dead letters | a poison message → `dead-letter` after 5 attempts | subscription → attempts → dead-letter topic | G |

**7. `dataflow` · Counting viewers while the match plays · 9**

| # | Section | Step | Side pane | Level |
| --- | --- | --- | --- | --- |
| 1 | ◆ full scene: Beam's model | concept + the smallest pipeline | Pipeline → PCollection → PTransform; runners | L |
| 2 | A first pipeline | DirectRunner: read, parse, count | the pipeline graph | L · E |
| 3 | Event time vs processing time | boxes minutes behind | **timeline**: two clocks | L |
| 4 | Fixed windows | viewers per channel per minute | **timeline**: one-minute windows | L |
| 5 | ◆ full scene: watermarks and late data | allowed lateness, triggers; a late pane fires | **timeline**: the watermark line | L |
| 6 | Dedupe in the stream | by `event_id` within the window | duplicates dropped before counting | L |
| 7 | Sessions | session windows, 30-minute gap | **timeline**: a device's sessions | L |
| 8 | Into BigQuery | streaming inserts into `live.concurrent_viewers` (made by Terraform, `CREATE_NEVER`) | pipeline → inserts → table; the peak read back | G |
| 9 | On Dataflow | the same file as a streaming job fed by Pub/Sub (`timestamp_attribute`); the replay's lateness; drain vs cancel | subscription → job → table; each minute's firings | G |

**8. `lakehouse` · BigQuery: Bronze and Silver · 9**

| # | Section | Step | Side pane | Level |
| --- | --- | --- | --- | --- |
| 1 | ◆ full scene: how BigQuery is built | a query's execution details | storage (Colossus) ↔ network ↔ compute (slots) | G |
| 2 | Datasets and location | the five datasets in Terraform | project → datasets → tables | G |
| 3 | External tables: schema on read | the raw zone queried in place | GCS files → external table | G |
| 4 | Bronze: load jobs | append as received, `_src_file`, `_ingest_ts` | Bronze rows with provenance | G |
| 5 | Partitioning and clustering | a dry run before and after: bytes scanned | partitions by `dt`, clustered by `title_id` | G |
| 6 | G2 | no `event_id`, unknown `title_id` → quarantine | rows split: valid / quarantined | G |
| 7 | Silver: dedupe and conform | `QUALIFY ROW_NUMBER()`; platforms standardised | many deliveries → one event | G |
| 8 | SCD2 subscribers | `MERGE`: the mid-month upgrade | one household, two versions, `valid_from` / `valid_to` | G |
| 9 | G3 | EPG coverage; the inner join that loses minutes | missing slot → missing minutes | G |

**9. `dataproc` · Spark for the heavy join · 8**

| # | Section | Step | Side pane | Level |
| --- | --- | --- | --- | --- |
| 1 | ◆ full scene: Dataproc's shapes | concept | clusters vs Serverless batches; who manages what | D |
| 2 | PySpark locally first | `qos_by_exchange.py` on local Spark | heartbeats ⋈ telemetry by exchange and minute | L |
| 3 | The BigQuery connector | reading Silver; predicate and column pushdown | Spark → Storage Read API → only the columns asked | G |
| 4 | Buffering ratio | buffering seconds / watched seconds per exchange | the ratio per exchange, `EX-LDN-04` high | L |
| 5 | ⑂ The derby skew | one task takes most of the stage | tasks per partition, one straggler | L |
| 6 | Fixing skew | AQE skew join; salting compared | the split partition | L |
| 7 | On Dataproc Serverless | `gcloud dataproc batches submit pyspark`; properties | batch → executors → autoscaling | G |
| 8 | Writing back | `gold.qos_by_exchange`, partition overwrite | Spark → BigQuery, idempotent per `dt` | G |

**10. `serve` · The answer, cheaply and safely · 8**

| # | Section | Step | Side pane | Level |
| --- | --- | --- | --- | --- |
| 1 | `content_performance_daily` | live vs catch-up minutes per title, platform, region | the Gold row shape | G |
| 2 | Counting unique households | `COUNT(DISTINCT)` vs `APPROX_COUNT_DISTINCT` | exact vs sketch, the error | G |
| 3 | G4 | Gold minutes = Silver minutes; a planted bug caught | the totals that must match | G |
| 4 | What a query costs | `--dry_run`, `require_partition_filter`, `maximum_bytes_billed` refusing | bytes scanned per query shape | G |
| 5 | Sharing without exposing | an authorized view: marketing sees titles, not households | dataset → view → reader | G |
| 6 | Materialized views and BI Engine | a dashboard query, before and after | base table → MV → cache | G |
| 7 | ◆ full scene: Looker's semantic model | a LookML view and explore | tables → views → explore → dashboard | D |
| 8 | The answer | the derby card, live and Gold side by side | peak, the exchange, the ratio | G |

**11. `orchestrate` · Every night, and the night it fails · 8**

| # | Section | Step | Side pane | Level |
| --- | --- | --- | --- | --- |
| 1 | ◆ full scene: Airflow's model | concept | DAG → task → operator; scheduler, workers | D |
| 2 | The DAG | `viewing_daily.py`, `airflow dags test` against the project | sensor → load → G2 → Silver → G3 → Dataproc → Gold → G4 | G |
| 3 | Waiting for the batch | a GCS sensor on `_SUCCESS` | sensor → poke → go | G |
| 4 | Retries and SLAs | a transient failure retried; an SLA miss email | task states | G |
| 5 | Backfill, idempotently | `dt` as the logical date; partition overwrite | three nights, same result twice | G |
| 6 | ⑂ A failed night | G3 fails; the EPG fixed; the task cleared; green | the run, red then green | G |
| 7 | Composer | the Composer 3 environment in Terraform, planned not applied | managed Airflow: what Google runs | C |
| 8 | ◆ full scene: three kinds of progress | lab: restart at each point | ack (Pub/Sub) / watermark (Dataflow) / partition (batch) | L |

**12. `operate` · Protect it, watch it, ship it · 9**

| # | Section | Step | Side pane | Level |
| --- | --- | --- | --- | --- |
| 1 | Policy tags | column-level security on `email`, `phone`; a read refused | taxonomy → tag → column → reader | G |
| 2 | Sensitive Data Protection | inspect a CRM extract; de-identify | finding → transform → masked file | G |
| 3 | Dataplex: catalog and lineage | lineage of `gold.content_performance_daily` | sources → tables → Gold, drawn from the API | G |
| 4 | Dataplex data quality | a scan on Silver vs our gates | where a rule lives | G |
| 5 | Cloud Logging | the night's job logs, a log query | sources → log router → sinks | G |
| 6 | Alerts | oldest-unacked-message age on `viewing-events` → email | metric → policy → channel | G |
| 7 | Two environments | dev and prod from one root module, two state prefixes | one module, two projects | C |
| 8 | CI with Cloud Build | `cloudbuild.yaml`: fmt, validate, tests, plan; a trigger from GitHub | GitHub → trigger → build → plan | G |
| 9 | Where next | concept | churn, recommendations, Vertex AI, real-time personalisation — each on the map, unbuilt | D |

## Decisions

1. Concept: GCP, taught through Sun (fictional) — a live derby and next morning's content and QoS
   report; batch + streaming; no ML or AI (2026-11-02).
2. Python throughout: Beam Python SDK and PySpark (2026-11-02).
3. Runtime as `azure-trade-finance`: local steps replay; GCP steps are recorded once in the owner's
   project and torn down (2026-11-02).
4. Infrastructure as Terraform from Course 3 (2026-11-02).
5. Repo `gcp-media-analytics`, public, under `schemabotview`; published at
   `graphl.in/gcp-media-analytics`.
6. The pilot is Course 5, `land`, as azure-trade-finance (2026-11-02). Courses 3–4 were authored
   next; the chain runs start → secure → land.
7. A night's window is fixed by its `dt` — (dt 00:00, dt+1 00:00] on `updated_at` — and the
   loaders' watermark is the newest night with a `_SUCCESS`. No mutable watermark object: the raw
   bucket gets a retention policy in §5.7, which would refuse overwriting one (2026-11-02).

## Open

- The *first use* pins.
- Whether the owner's project sits in an organization: 2.2 (folders), 4.4 (the org policy refusing
  key files) and 12.7 (a second project) need one. Without it, 2.2 shows the project only and 4.4
  becomes doc-cited.
- 12.7 needs a second project (`sun-media-prod`), or stays compiled.
- 12.8 needs a GitHub connection for Cloud Build: this repo, or a separate demo repo.
- 10.7: Looker is not deployed (licensed). Doc-cited with LookML on screen, or Looker Studio
  (free) against the Gold table, recorded.
