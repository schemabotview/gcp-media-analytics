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

Plan v1 written 2026-11-02, awaiting the owner's review. Nothing built.

| # | course | sections | status |
|---|---|---|---|
| 1 | `intro` | 3 | planned |
| 2 | `how-gcp-runs` | 7 | planned |
| 3 | `start` | 8 | planned |
| 4 | `secure` | 8 | planned |
| 5 | `land` | 8 | planned (pilot) |
| 6 | `stream` | 7 | planned |
| 7 | `dataflow` | 9 | planned |
| 8 | `lakehouse` | 9 | planned |
| 9 | `dataproc` | 8 | planned |
| 10 | `serve` | 8 | planned |
| 11 | `orchestrate` | 8 | planned |
| 12 | `operate` | 9 | planned |

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

