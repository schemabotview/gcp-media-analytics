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
| engine / shell | `@graphlearning/graphl-flow`, `@graphlearning/shell` from npm: graphl-flow **0.11.0** and shell **1.1.0**, pinned exactly (IDE frame v2, COURSE-PLAN Decision 9; Google Cloud icon keys: see "Frames") |
| toolchain | see COURSE-PLAN, "Stack and pins": PostgreSQL 18.6, Python 3.14.9, Beam (Python), PySpark 4.2.0 on Java 21, Airflow + Google provider, gcloud + Pub/Sub emulator, fake-gcs-server, Terraform 1.17.0 (`hashicorp/google`) |
| frames | map, IDE, timeline (new, Course 7), ◆ full scenes; `--brand` Google blue `#4285f4` |
| secrets | `GOOGLE_PROJECT_ID`, a recording service account's credentials (environment secret, never committed, never printed) |

## Status

Plan v1.2 (2026-11-02), awaiting the owner's review. **All twelve courses authored** (2026-11-03): 92
sections, every one checked and shot at 4K. Courses 1–8 replayed locally or recorded once on GCP
(§8.7's count and §8.8's load corrected by hand, labelled mocked); Courses 9–12 MOCKED on the owner's
call (see below). GCP is torn down in full. `check:spine`: 83 steps, 0 problems. Next:

1. Owner review of `COURSE-PLAN.md` and the 92 routes (`#/intro-a-night-of-viewing` …
   `#/operate-where-next`); the map preview `#/preview-map-land` (the finished map is §1.3).
2. Narration audio: all 92 wavs are in (Colab + Chatterbox, 2026-11-03). **57 sections land under
   82 s** (every one in Courses 8–12, 57–78 s; 1–8 s short in Courses 1–7): lengthen those
   narrations, `npm run gen:audio`, regenerate the changed wavs, `npm run record:all` (unchanged
   sections come from the segment cache), then `npm run film` again.
3. Recorded (2026-11-03): every course at 4K (`scripts/out/<course>.mp4`), and a first cut of the
   film, `scripts/out/film.mp4` (1:57:52, −14 LUFS). Publish kit in `output/`: `film-description.txt`
   (92 chapters, 4,949 bytes of YouTube's 5,000), `descriptions/<course>.txt`, `thumbnails/film.png`
   (the answer card from §1.2, `runs locally`) and `film-map.png`. Fix before publishing: §8.7's
   mocked top minutes (18:02, 18:43) disagree with §7.8's recording (17:51, 17:52); §9.4's mocked
   output has 12 exchanges where §1.2 has 15; §2.3's side-pane diagram uses a third of its width;
   a stray glyph before §4.5's side-pane title.
4. Re-recording mocked steps for real is optional: remove `mocked` from a step.json, then `--record`.

**Built (infra):** the app (vite, shell `ConceptApp`, `--brand` #4285f4), `check-content`,
`check-render`, `registry`, `shots` (also a bare scene id), `concept.json`, `spine-files.mjs` (the
explorer's file lists, `src/scenes/spine-files.ts`: run it after writing or recording a step); `sun_gen` + `verify`
(20 planted facts, derby-day viewing and telemetry included); `scripts/spine.py` (local steps: PostgreSQL `crm` + `billing`, fake-gcs-server;
GCP steps: recorder, used for Courses 3–5); `leaks.py`; `src/scenes/ide.ts`, `map.ts` (`BUILT` per
course), `level.ts`, `lab.ts` (`labFrame`: terminal beside a diagram, the IDE frame's size, for Course 2's labs), `tree.ts`, `fold.ts`, `csv.ts`; installers `install-toolchain.sh`
(Python 3.14.9, Java 21), `setup-postgres.sh` (PostgreSQL 18.6, OS user `priya`),
`install-gcp-tools.sh` (fake-gcs-server 1.56.1, Terraform 1.17.0). `film.mjs` and
`thumb-film.mjs` (ported from azure-trade-finance), `titles.json`. `scripts/audio-manifest.json` is
generated. The Colab notebook is not in this repo.

**2026-11-10: ported to IDE frame v2** (COURSE-PLAN Decision 9). All 83 IDE and lab sections are on
graphl-flow 0.11's shared grid (`src/scenes/frame.ts` `ideFrame2` / `labFrame2`, workbench id
`ide-bench`): compact explorer 175 | editor over a 72-column terminal | side pane 434, titled with
the section's mental model (spark-ecommerce-analytics' layout; the explorer restored 2026-11-11). Map and full-scene frames are unchanged. 9 narrations changed: their wavs are
removed and the manifest regenerated; Colab regenerated them. 2026-11-12: every course re-recorded at 4K on v2 (segment cache and `scripts/out/` cleared first:
the cache's fingerprint covers audio and encoding, not the scene, so a frame change needs
`--force` or an empty cache) and the film re-cut, 1:57:57.

**IDE frame v2, as built:** 26 rows shared by editor and terminal (terminal at least 6, editor at least
8), the editor windowed around its highlight; a hand-picked `show` only when the highlight does not
fit, and then the highlighted lines alone, grown to fill; it THROWS naming the scene when none fits.
The 80-column transcripts are re-wrapped at 72 when drawn (`rewrap`; `keep`/`shown` name original
rows); labs have no explorer and keep 80 columns across both left columns. Side pane: ONE diagram
(edges or a plot), at most one table outside it, no notes or bullets (check-content), filled ≥ 1/2
(check-render). An edge label widens every gap of its column: a
vertical chain of 3+ labelled steps rarely fits. A second table joins the diagram by an edge to the
table itself, outside any titled group. Plots are `compact` with `w: SIDE_W - 34`. A table fits ~36
monospace characters a row; a 3-item row needs `stack: true` and short subs.

| # | course | sections | status |
|---|---|---|---|
| 1 | `intro` | 3 | authored, narrated (text), 4K-checked: §1 concept, §2 L (`derby.py` over the raw events), §3 the map |
| 2 | `how-gcp-runs` | 7 | authored, narrated (text), 4K-checked: §1–§5 read-only labs recorded on GCP (lab frame), §6 doc-cited, §7 model |
| 3 | `start` | 8 | authored, narrated (text), 4K-checked: §1–§4 L, §5–§8 recorded on GCP |
| 4 | `secure` | 8 | authored, narrated (text), 4K-checked; all recorded on GCP (§4.2 drawn in the side pane, not a ◆ full scene) |
| 5 | `land` | 8 | authored, narrated (text), 4K-checked: §2–§5 L · E, §1, §6–§8 recorded on GCP |
| 6 | `stream` | 7 | authored, narrated (text), 4K-checked: §1 doc-cited, §2 and §7 recorded on GCP, §3–§6 L · E (gcloud's Pub/Sub emulator) |
| 7 | `dataflow` | 9 | authored, narrated (text), 4K-checked: §1–§7 L (Beam's direct runner), §8–§9 recorded on GCP (§9 a Dataflow streaming job, drained) |
| 8 | `lakehouse` | 9 | authored, narrated (text), 4K-checked: all recorded on GCP; §7's count and §8's load+MERGE output MOCKED (the recording's own SQL failed; corrected by hand, labelled) |
| 9 | `dataproc` | 8 | authored, narrated (text), 4K-checked, MOCKED: §1 doc-cited; §2, §4–§6 local Spark outputs from real runs of the same code made while drafting; §3, §7, §8 authored |
| 10 | `serve` | 8 | authored, narrated (text), 4K-checked, MOCKED: numbers computed from the night's data as the SQL would; §7 doc-cited (Looker) |
| 11 | `orchestrate` | 8 | authored, narrated (text), 4K-checked, MOCKED: Airflow 2.10.5 in its own Python 3.12 venv (Composer 3's image); §1 doc-cited, §8 model; Composer planned, never applied |
| 12 | `operate` | 9 | authored, narrated (text), 4K-checked, MOCKED: §9 a model (no ML or AI built) |

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

## From Course 9 on: MOCKED (the owner's call, 2026-11-03)

**Torn down, all of it** (2026-11-03, after Course 8's recordings): every Terraform resource of
Courses 3–8 destroyed from reviewed plans (65, then the emptied raw bucket and the KMS key, 5), and
the state bucket deleted. What GCP keeps by design: the key ring `kr-media` (never deletable; its
one key version DESTROY_SCHEDULED) and the enabled APIs. No Dataflow job, bucket, dataset, topic,
subscription, service account or network of the course remains.

GCP was torn down after Course 8 and nothing more is recorded. Every step from §9.1 on is
`{"mocked": true}`: its session.txt is AUTHORED to match the code and the facts (sun_gen's numbers,
the local Spark runs made while drafting), sealed with `python scripts/spine.py --mock <step>`, and
its frame carries the `mocked` level (`MOCKED` in `level.ts`), never `recorded on GCP`. `--reseal`
re-keys a step that ran after a mocked ancestor changed (§8.9). Re-recording a mocked step for real
later is `--record` after removing `mocked` from its step.json.

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

