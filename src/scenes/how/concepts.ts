import type { SceneModel } from '@graphlearning/graphl-flow'
import { lineOf, linesFrom } from '../ide'
import { ideFrame2 } from '../frame'
import { level } from '../level'
import { stepTree } from '../files'
import code from '../../../spine/how-gcp-runs/07-meters/project/model/meters.py?raw'
import session from '../../../spine/how-gcp-runs/07-meters/session.txt?raw'

// Course 2 §6–§7 — the two sections that run nothing on GCP: a doc-cited concept and a labelled model.

// §2.6 — serverless and managed clusters: who runs what, on the responsibility line.
const ROWS: [string, string, string, string][] = [ // layer, BigQuery / Pub/Sub, Dataflow, Dataproc cluster
  ['capacity: how many machines', 'Google', 'Google (autoscaling)', 'you'],
  ['machines: OS, patches', 'Google', 'Google', 'Google (image you pick)'],
  ['the engine: SQL, Beam, Spark', 'Google', 'Google', 'Google (version you pick)'],
  ['your code and its config', 'you', 'you', 'you'],
  ['your data and who may read it', 'you', 'you', 'you'],
]

export const howServerless: SceneModel = {
  title: 'Serverless and managed clusters',
  sub: 'who runs what, for the services this platform uses',
  nodes: [
    level('doc-cited', 'Google Cloud’s own overviews of each service; the pages are listed below'),
    {
      type: 'group', id: 'kinds', bare: true, dir: 'row', children: [
        {
          type: 'group', id: 'serverless', title: 'Serverless: send work, pay per use', icon: 'zap', tone: 'ingest', children: [
            { type: 'item', id: 'k-bq', title: 'BigQuery', sub: 'a query; Google finds the slots', icon: 'bigquery' },
            { type: 'item', id: 'k-ps', title: 'Pub/Sub', sub: 'a message; Google stores and delivers it', icon: 'pubsub' },
            { type: 'item', id: 'k-df', title: 'Dataflow', sub: 'a pipeline; Google starts and scales workers', icon: 'dataflow' },
          ],
        },
        {
          type: 'group', id: 'clusters', title: 'Managed clusters: size it, pay while it runs', icon: 'server', tone: 'infra', children: [
            { type: 'item', id: 'k-dpc', title: 'Dataproc cluster', sub: 'you choose the machines; it runs until you stop it', icon: 'dataproc' },
            { type: 'item', id: 'k-dps', title: 'Dataproc Serverless', sub: 'a batch; no cluster to keep — Course 9 uses this', icon: 'dataproc', tone: 'ingest' },
            { type: 'item', id: 'k-comp', title: 'Composer', sub: 'an Airflow environment, billed by the hour', icon: 'composer' },
          ],
        },
      ],
    },
    {
      type: 'table', id: 'line', title: 'The responsibility line', tone: 'store', columns: ['layer', 'BigQuery · Pub/Sub', 'Dataflow', 'Dataproc cluster'],
      rows: ROWS.map((r, i) => ({ id: `r-${i}`, cells: r, tone: i >= 3 ? 'store' as const : undefined })),
    },
  ],
}

// §2.7 — how GCP charges: a month of the platform in billed units, a model with its assumptions.
const meters = session.split('\n').slice(1).filter(Boolean).map((l) => l.split(/\s{2,}/))

export const howMeters: SceneModel = ideFrame2({
  model: 'Three meters: kept, read, running',
  tree: stepTree('how-gcp-runs/07-meters', 'model/meters.py'),
  editor: { file: 'model/meters.py', code, show: [[lineOf(code, 'NIGHTS = 30'), lineOf(code, 'messages = sum')], [lineOf(code, 'rows = ['), lineOf(code, 'print(f"{service')]], highlight: linesFrom(code, 'DASHBOARD_QUERIES', 'WORKER_VCPUS') },
  session,
  side: [
    level('model', 'one night’s real sizes × 30 and three stated assumptions; no prices'),
    {
      type: 'table', id: 'meters', title: 'A month of viewing-pulse, in billed units', tone: 'store', columns: ['service', 'meter', 'a month'],
      rows: meters.map(([s, m, q]) => ({ id: `m-${m.replace(/\W+/g, '-')}-${s.replace(/\W+/g, '-')}`, cells: [s, m, q], tone: m === 'GB scanned' || m === 'vCPU-hours' ? 'consume' as const : undefined })),
    },
    {
      type: 'group', id: 'drives', bare: true, dir: 'row', children: [
        { type: 'item', id: 'd-data', title: 'how much is kept', sub: 'cheaper as it cools (§5.8)', icon: 'gcs', stack: true },
        { type: 'item', id: 'd-read', title: 'how much is read', sub: 'bytes scanned (§10.4)', icon: 'bigquery', tone: 'consume', stack: true },
        { type: 'item', id: 'd-run', title: 'how long it runs', sub: 'workers bill: drain (§7.9)', icon: 'timer', tone: 'consume', stack: true },
      ],
    },
  ],
  edges: [
    { from: 'meters', to: 'd-data' },
    { from: 'meters', to: 'd-read' },
    { from: 'meters', to: 'd-run' },
  ],
})
