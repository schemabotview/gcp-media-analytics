# CLAUDE.md — gcp-media-analytics

> Source of truth: `COURSE-PLAN.md`. On the owner's machine the workspace rules are in
> `../CLAUDE.md`; a cloud session cannot see that file, so the rules this repo needs are copied
> under "Shared rules" below. Keep them in step with it.

## Identity

| | |
|---|---|
| teaches | GCP, by building `viewing-pulse`: Sun's live concurrent-viewers stream (Pub/Sub → Dataflow → BigQuery) and nightly content-performance and QoS batch (GCS → BigQuery Bronze/Silver/Gold, Dataproc), gates G1–G4 |
| cast | Priya (data engineer), Sun (fictional UK pay-TV and broadband provider); the Northbridge v Eastfield derby, 2026-10-31 |
| reference repos | all public under `github.com/schemabotview`: **`azure-trade-finance`** (map + IDE frames, `spine.py` with local and recorded steps, `leaks.py`, the generator pattern, verification levels — port it), **`aws-ecommerce`** (record-once spine), **`sql-bank`** (`setup-postgres.sh`), **`spark-ecommerce-analytics`** (checks, registry, shots, film) |
| engine / shell | `@graphlearning/graphl-flow`, `@graphlearning/shell` from npm: graphl-flow **^0.9.0** (its Google Cloud icon keys: see COURSE-PLAN, "Frames"), shell ^1.1.0 |
| toolchain | see COURSE-PLAN, "Stack and pins": PostgreSQL 18.6, Python 3.14.9, Beam (Python), PySpark 4.2.0 on Java 21, Airflow + Google provider, gcloud + Pub/Sub emulator, fake-gcs-server, Terraform 1.17.0 (`hashicorp/google`) |
| frames | map, IDE, timeline (new, Course 7), ◆ full scenes; `--brand` Google blue `#4285f4` |
| secrets | `GOOGLE_PROJECT_ID`, a recording service account's credentials (environment secret, never committed, never printed) |

## Status

Plan v1.2 (2026-11-02), awaiting the owner's review. Cloud sessions 2026-11-02/03: infra built;
**Courses 1–5 authored in full** — 34 sections, every one checked and shot at 4K. Local steps replay
here; every GCP step (Course 2's read-only labs, §3.5–3.8, Course 4, §5.1, §5.6–5.8) was recorded
once in the owner's project and normalised. `check:spine`: 31 steps, 0 problems. **Torn down**
(2026-11-02): Courses 3–5's 30 resources destroyed from a reviewed plan; the project keeps the state
bucket, the enabled APIs (Compute Engine now among them, from §2.3) and the undeletable key ring
`kr-media` (a re-recording of §4.7 must `terraform import` it). Next:

1. Owner review of `COURSE-PLAN.md`, the 34 routes (`#/intro-a-night-of-viewing` … `#/land-lifecycle`)
   and the map preview `#/preview-map-land` (the finished map is §1.3).
2. Courses 7–12. **The platform is UP** (2026-11-03): restored for §6.2 (`{"restore": true}`:
   the parent's infra/ applied, `kr-media` imported) and left up across courses; tear down after
   the last GCP recording of the batch (reviewed plan; empty the raw bucket after its retention).
   Pub/Sub's service agent appears a little after the API is first enabled: §6.2's first apply
   failed on its grant and was recorded again.
3. Narration audio once the frames are approved (port the Colab notebook, `audio-manifest.json`).

**Built (infra):** the app (vite, shell `ConceptApp`, `--brand` #4285f4), `check-content`,
`check-render`, `registry`, `shots` (also a bare scene id), `concept.json`, `spine-files.mjs` (the
explorer's file lists, `src/scenes/spine-files.ts`: run it after writing or recording a step); `sun_gen` + `verify`
(20 planted facts, derby-day viewing and telemetry included); `scripts/spine.py` (local steps: PostgreSQL `crm` + `billing`, fake-gcs-server;
GCP steps: recorder, used for Courses 3–5); `leaks.py`; `src/scenes/ide.ts`, `map.ts` (`BUILT` per
course), `level.ts`, `lab.ts` (`labFrame`: terminal beside a diagram, the IDE frame's size, for Course 2's labs), `tree.ts`, `fold.ts`, `csv.ts`; installers `install-toolchain.sh`
(Python 3.14.9, Java 21), `setup-postgres.sh` (PostgreSQL 18.6, OS user `priya`),
`install-gcp-tools.sh` (fake-gcs-server 1.56.1, Terraform 1.17.0). Not yet: `film.mjs`,
`thumb-film.mjs`, the Colab notebook, `audio-manifest.json`, `titles.json` (port from
azure-trade-finance when narration starts).

| # | course | sections | status |
|---|---|---|---|
| 1 | `intro` | 3 | authored, narrated (text), 4K-checked: §1 concept, §2 L (`derby.py` over the raw events), §3 the map |
| 2 | `how-gcp-runs` | 7 | authored, narrated (text), 4K-checked: §1–§5 read-only labs recorded on GCP (lab frame), §6 doc-cited, §7 model |
| 3 | `start` | 8 | authored, narrated (text), 4K-checked: §1–§4 L, §5–§8 recorded on GCP |
| 4 | `secure` | 8 | authored, narrated (text), 4K-checked; all recorded on GCP (§4.2 drawn in the side pane, not a ◆ full scene) |
| 5 | `land` | 8 | authored, narrated (text), 4K-checked: §2–§5 L · E, §1, §6–§8 recorded on GCP |
| 6 | `stream` | 7 | authored, narrated (text), 4K-checked: §1 doc-cited, §2 and §7 recorded on GCP, §3–§6 L · E (gcloud's Pub/Sub emulator) |
| 7 | `dataflow` | 9 | authored, narrated (text), 4K-checked: §1–§7 L (Beam's direct runner), §8–§9 recorded on GCP (§9 a Dataflow streaming job, drained) |
| 8 | `lakehouse` | 9 | planned |
| 9 | `dataproc` | 8 | planned |
| 10 | `serve` | 8 | planned |
| 11 | `orchestrate` | 8 | planned |
| 12 | `operate` | 9 | planned |

## Spine (as built)

- `python scripts/spine.py` checks without running; `--write land/04` restores `land/03`'s state
  (`state/`: `db-crm.sql.gz`, `db-billing.sql.gz`, `gcs.tar.gz`, `work.tar.gz`) and runs only
  `land/04`. Run as root; the shell is OS user `priya` in `/home/priya/viewing-pulse`.
- The raw zone locally is fake-gcs-server on :4443 (`env.sh` points the Python client and gcloud at
  it). It keeps object metadata in an xattr (`user.metadata`): `gcs.tar.gz` is GNU tar with
  `--xattrs`, or a restored object stops being listed. The spine refuses to start if :4443 is taken.
- Off-screen events are `setup`: sun_gen's `day-2026-10-31.sql` (before §5.4) and `rerate.sql`
  (inside the §5.5 branch). §3.2 loads the two databases on screen (`sources/load.sh`).
- The chain: start/01 (`first`) → start/04 local → start/05…secure/08, land/01 GCP → land/02–05
  local → land/06–08 GCP. A local step after GCP steps restores the last LOCAL step's state.
  `data/` is not in `work.tar.gz` (the viewing events are ~100 MB): restore lays sun_gen's parts back
  from its cache. Recording a GCP step changes the key of every step after it: write the local
  ones again (`--write land`, ~20 s); their transcripts should come out identical.
- `capture` takes `gs://<bucket>/<object>`, read back with `gcloud storage cat`.
- Typed commands ≤ 78 columns (`$RAW` is `gs://sun-media-dev-raw`); code ≤ 79; the terminal holds 13 rows.

## Recording (runbook)

Secrets (environment, never committed): `GOOGLE_PROJECT_ID`, `GOOGLE_CREDENTIALS` (the recording
service account's key JSON), `GOOGLE_BILLING_ACCOUNT` (§3.8's budget), optional `GCS_SUFFIX`.
The recorder has never run against a real project: its first recordings are its test.

1. The recording SA needs, on the project: Owner (or Editor + Project IAM Admin + Service Account
   Admin + Secret Manager Admin + Cloud KMS Admin + Storage Admin + Service Usage Admin), and
   Billing Account Costs Manager on the billing account for the budget. Enable
   `cloudresourcemanager`, `iam`, `iamcredentials`, `storage`, `serviceusage` first if the
   project is new (Terraform enables secretmanager, cloudkms, billingbudgets, monitoring).
2. In order, one at a time, reading each transcript: `python scripts/spine.py --record start/05-signing-in`
   … `start/08`, `secure/01` … `secure/08`, `land/01`, then `--write land` (local, re-keyed), then
   `--record land/06`, `land/07`, `land/08`. Run `python scripts/leaks.py` before committing.
3. Recorded (2026-11-02, the owner's project): EVERY GCP step of Courses 3–5. Learned:
   - a fresh impersonation grant takes a minute: §4.4's token is minted in §4.5, recorded later;
   - never list the project unfiltered: §4.1 shows counts and the editor binding, `roles.sh`
     matches the five job accounts by name (`sa-` alone matched the recorder and Google's agents);
   - to record a Terraform step again, put back its PARENT's state first:
     `spine.py --undo <step> 'terraform plan -destroy -target=… -out=tfplan'`, read the plan, then
     `--undo <step> 'terraform apply tfplan'` (a reviewed plan, never a blind destroy);
   - a typed command over 78 columns is refused BEFORE anything runs.
4. Teardown after Course 5: done 2026-11-02 with `--undo land/08 'terraform plan -destroy -out=tfplan'`,
   read, then `--undo land/08 'terraform apply tfplan'` (the blind `--teardown` is refused by the
   session's safety check); the raw bucket emptied first (`gcloud storage rm`, after retention). The raw bucket's retention (§5.7) holds
   objects for an hour; the KMS key ring `kr-media` can never be deleted — the next recording must
   `terraform import` it (and its key) before §4.7 applies.

## Invariants

- **Local steps replay; GCP steps are recorded once** and never re-run to check them.
- **Every resource is Terraform**; the CLI only reads, moves data and bootstraps the state bucket.
  State never enters the spine.
- **Tear down after recording a course.** Never leave a Dataflow job, a Dataproc batch or a
  Composer environment running; Composer is never applied.
- **Normalise in the recorder, never by hand**; never list the owner's project unfiltered on screen
  (filter to `app=viewing-pulse`).
- **Every BigQuery query sets `maximum_bytes_billed`.**
- **No ML or AI is built.** Churn, recommendations and Vertex AI appear only in 12.9.
- "Sun" is fictional: no logo, colour or domain resembling a real Sun brand; `sun.example` only.

## Shared rules (copied from the workspace `../CLAUDE.md`)

**Vocabulary.** Concept = this repo = ONE YouTube film. Course = a chapter group and the owner's
review unit. Section = `(scene, narration)`: one full-screen 16:9 frame, one chapter, 82–120 s.
Scene = a declarative graphl-flow model. ◆ = a detour.

**Pipeline.** plan → infra → spine → author (`src/content/<course>/`, `src/scenes/<course>/`) →
check → `npm run gen:audio` (re-run after ANY narration edit) → Colab + Chatterbox
(`scripts/colab_generate_audio.ipynb` commits each wav to `main`) → `npm run record:all` →
`npm run film` → `npm run gen:desc`, `npm run thumb:film`.

**Commands.**

```sh
npm run dev                                          # :5173 — #/ catalog, #/<course>-<section>
npm run build && npx tsc --noEmit && npm run check   # check = check-content + check-render (4K)
npm run check:spine
npm run shots -- <course>                            # 4K PNGs in out/shots/ — then LOOK
```

**Invariants.**

- `COURSE-PLAN.md` is the source of truth: change it first, never drift.
- Route contract (the shell's, never reimplemented): `#/` catalog, `#/<courseId>-<sectionId>`,
  `#/<sceneId>`, `?capture=1`, `window.__scene.plan()`.
- Scenes are declarative: never `x`/`y`.
- Stylesheets in order: graphl-flow, shell, `./theme.css` last.
- Pin published engine and shell versions; no `file:` installs committed; no `overrides`.
- Every output is real: replayed or recorded, never typed. Scenes READ values from the spine (find
  lines by text with `lineOf`). `volatile` values are masked in comparison and never said in
  narration.
- Narration: `.tts` → `.wav` via Colab + Chatterbox only; audio at `public/audio/<course>/<id>.wav`.
  Flowing prose that walks the frame and ends with a one-line bridge; never reads code aloud; never
  claims the viewer has mastered anything.
- `SiteHeader` on the catalog page only.
- Checks are a floor, not proof: shoot and LOOK at every frame.

**Frames.** Every side pane carries a diagram, never a bullet list, and fills ≥ 2/3 of its height.
No edges between panes. A ◆ that cannot fit the side pane at ≥ 24px body text in the 4K frame is a
full scene, its own section with real output inside. Flows run one direction; arrows do not cross;
a fan-in of 3+ arrows aims at a tall node.

**How a section teaches.** Objective → mental model (side pane) → the code and its real result → a
failure or alternative → bridge. One step per section; a failure is its own step.

**Working agreement.** Author a whole course (spine, scenes, narration), render it, LOOK, then hand
over the routes. No silent scaffolding. Report what was built, verified and left out, and each
frame's verification level. Commit and push to `main` per course.

