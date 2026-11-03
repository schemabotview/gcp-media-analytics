import type { Code, Edge, Group, Item, SceneModel, SceneNode } from '@graphlearning/graphl-flow'
import { keepLines, terminal, trim, type Keep } from './ide'

// THE PLATFORM'S MAP — azure-trade-finance's map.ts (from aws-ecommerce), drawn the way Google Cloud
// draws its own: the project as the boundary, its region in the subtitle; inside, two lanes — the
// NIGHTLY batch (raw zone → Bronze → Silver → Gold, the gates G1–G3 on the arrows, G4 into Looker)
// and the LIVE path (Pub/Sub → Dataflow → `live`) — and the platform's services along the bottom.
// Sun's own systems sit outside, to the left.
//
// It is the WHOLE finished platform from its first appearance to the end. A part not built yet is
// drawn — same size, same place — greyed (graphl-flow's `muted`), so the map never moves and a
// section shows what it ADDS by colour and by its `focus` ring, not by layout. check-render asserts
// every map frame lands on one fit.
//
// `BUILT[course]` is what exists at the END of that course — extend it as courses are authored, and
// never rename a part: section focus and later scenes name these ids.

interface Part { id: string; icon: string; title: string; sub?: string }
const p = (id: string, icon: string, title: string, sub?: string): Part => ({ id, icon, title, sub })

const SUN = [
  p('crm', 'postgresql', 'CRM', 'PostgreSQL'),
  p('billing', 'postgresql', 'Billing', 'PostgreSQL'),
  p('vendors', 'file', 'Catalogue, EPG', 'vendor files'),
  p('households', 'users', 'Households', '5,000 · box and app'),
]
const LIVE = [
  p('pubsub', 'pubsub', 'Pub/Sub', 'viewing-events'),
  p('dataflow', 'dataflow', 'Dataflow', 'per channel, per minute'),
  p('live', 'bigquery', 'live', 'concurrent_viewers'),
]
const NIGHTLY = [
  p('raw', 'gcs', 'Raw zone', 'sun-media-dev-raw'),
  p('bronze', 'bigquery', 'bronze', 'as received'),
  p('silver', 'bigquery', 'silver', 'deduped, SCD2'),
  p('gold', 'bigquery', 'gold', 'marts'),
]
const DATAPROC = p('dataproc', 'dataproc', 'Dataproc', 'QoS by exchange')
const LOOKER = p('looker', 'looker', 'Looker', 'the derby card')
const PLATFORM = [
  p('iam', 'gcpiam', 'IAM', 'five sa-* accounts'),
  p('secrets', 'secretmanager', 'Secret Manager', 'crm-db-password'),
  p('kms', 'cloudkms', 'Cloud KMS', 'kr-media / k-raw'),
  p('composer', 'composer', 'Composer', 'viewing_daily'),
  p('budget', 'gcpbilling', 'Budget', '80% → email'),
  p('dataplex', 'dataplex', 'Dataplex', 'catalog, lineage'),
  p('dlp', 'dlp', 'Sensitive Data', 'Protection'),
  p('logging', 'cloudlogging', 'Logging', 'job logs'),
  p('monitoring', 'cloudmonitoring', 'Monitoring', 'alerts'),
  p('cloudbuild', 'cloudbuild', 'Cloud Build', 'plan, test, deploy'),
]

/** What exists at the end of each course (cumulative). Courses 1–2 build nothing. */
export const BUILT: Record<string, string[]> = { intro: [], 'how-gcp-runs': [] }
BUILT.start = ['households', 'crm', 'billing', 'vendors', 'project', 'raw', 'budget']
BUILT.secure = [...BUILT.start, 'iam', 'secrets', 'kms']
BUILT.land = [...BUILT.secure, 'nightly']
BUILT.stream = [...BUILT.land, 'pubsub', 'live-lane']
BUILT.dataflow = [...BUILT.stream, 'dataflow', 'live']
BUILT.lakehouse = [...BUILT.dataflow, 'bronze', 'silver']
BUILT.dataproc = [...BUILT.lakehouse, 'dataproc']
BUILT.serve = [...BUILT.dataproc, 'gold', 'looker']
BUILT.orchestrate = [...BUILT.serve, 'composer']
BUILT.operate = [...BUILT.orchestrate, 'dataplex', 'dlp', 'logging', 'monitoring', 'cloudbuild']

/** The map, given what exists. What a section adds is ringed by the section's `focus`. */
export function platformMap(built: string[]): SceneNode {
  const later = (id: string) => !built.includes(id) || undefined
  const it = (part: Part): Item => ({ type: 'item', id: part.id, title: part.title, sub: part.sub, icon: part.icon, muted: later(part.id) })
  const sun: Group = { type: 'group', id: 'sun', icon: 'building', title: 'Sun', sub: 'its own systems', dashed: true, children: SUN.map(it) }
  const live: Group = {
    type: 'group', id: 'live-lane', icon: 'zap', title: 'Live', sub: 'seconds, while it plays', dir: 'row', tone: 'ingest',
    muted: later('live-lane'), children: LIVE.map(it),
  }
  const nightly: Group = {
    type: 'group', id: 'nightly', icon: 'clock', title: 'Nightly', sub: 'correct, next morning', dir: 'row', tone: 'store',
    muted: later('nightly'),
    // Gold is built twice over: BigQuery SQL from Silver, and Dataproc's QoS join above it
    children: [{ ...it(NIGHTLY[0]), minH: 150 }, ...NIGHTLY.slice(1, 3).map(it), { type: 'group', id: 'gold-stack', bare: true, children: [it(DATAPROC), it(NIGHTLY[3])] }],
  }
  const lanes: Group = { type: 'group', id: 'lanes', bare: true, children: [nightly, live] }
  const platform: Group = { type: 'group', id: 'platform', bare: true, dir: 'grid', cols: 5, span: 'all', children: PLATFORM.map(it) }
  // The business reads both lanes: a tall card, so the two arrows land on its face at their own heights
  const bi: Group = { type: 'group', id: 'bi', icon: 'users', title: 'The business', sub: 'live and next morning', tone: 'consume', minH: 350, muted: later('looker'), children: [it(LOOKER)] }
  const project: Group = {
    type: 'group', id: 'project', icon: 'gcpproject', title: 'sun-media-dev', sub: 'project · europe-west2', dir: 'grid', cols: 2,
    muted: later('project'), children: [lanes, bi, platform],
  }
  return { type: 'group', id: 'map', bare: true, dir: 'row', children: [sun, project] }
}

/** The data's path, always drawn: an arrow into a part not built yet is still where it will run. */
export const MAP_EDGES: Edge[] = [
  { from: 'households', to: 'pubsub' },
  { from: 'pubsub', to: 'dataflow' },
  { from: 'dataflow', to: 'live' },
  { from: 'crm', to: 'raw' },
  { from: 'billing', to: 'raw' },
  { from: 'vendors', to: 'raw' },
  { from: 'raw', to: 'bronze', label: 'G1' },
  { from: 'bronze', to: 'silver', label: 'G2' },
  { from: 'silver', to: 'gold', label: 'G3' },
  { from: 'silver', to: 'dataproc' },
  { from: 'dataproc', to: 'gold' },
  { from: 'live', to: 'bi' },
  { from: 'gold', to: 'bi', label: 'G4' },
]

/** A full-frame map (Course 1's "what we'll build"; the previews). */
export function mapScene(built: string[]): SceneModel {
  return { nodes: [platformMap(built)], edges: MAP_EDGES }
}

// ── the map frame ─────────────────────────────────────────────────────────────────────────────────
//
//   the map (MAP_W × MAP_H, fixed)  |  side pane (MAP_SIDE_W): an 80-column terminal, and a diagram
//
// Both columns are FIXED, width AND height, so every map frame has the same natural box and the same
// fit (check-render asserts it), and the map's parts sit at the same pixels in every section.

export const MAP_W = 1400
export const MAP_H = 1190
export const MAP_SIDE_W = 787

export interface MapFrame {
  built: string[]
  side: SceneNode[]
  edges?: Edge[]
}

export function mapFrame({ built, side, edges = [] }: MapFrame): SceneModel {
  return {
    dir: 'row',
    nodes: [
      { type: 'group', id: 'map-pane', bare: true, w: MAP_W, h: MAP_H, children: [platformMap(built)] },
      { type: 'group', id: 'map-side', bare: true, w: MAP_SIDE_W, h: MAP_H, children: side },
    ],
    edges: [...MAP_EDGES, ...edges],
  }
}

/** A map side pane's terminal: an 80-column pane, the session's lines folded to `keep`. */
export function mapTerminal(session: string, keep?: Keep[]): Code {
  const rows = terminal(session)
  return { type: 'code', id: 'terminal', terminal: true, filename: 'terminal — viewing-pulse', code: rows, fill: true, show: keep && keepLines(rows, keep) }
}

/** A map side pane's editor: a file from the step, its lines folded to `show`. */
export function mapEditor(file: string, code: string, show?: [number, number][], highlight?: number[]): Code {
  return { type: 'code', id: 'editor', filename: file, lang: 'hcl', code: trim(code), show, highlight, tone: 'ingest', fill: true }
}
