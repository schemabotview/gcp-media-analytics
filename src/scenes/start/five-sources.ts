import type { SceneModel } from '@graphlearning/graphl-flow'
import { ideFrame2 } from '../frame'
import { startTree } from './tree'
import readme from '../../../spine/start/01-five-sources/project/sources/README.md?raw'
import session from '../../../spine/start/01-five-sources/session.txt?raw'

// §3.1 — Sun's five sources (runs locally). sun_gen has written every source's data into data/; the
// terminal counts the lines of each file (wc), the README says how each one arrives. The side pane
// sorts them into the platform's two paths, with the counts read from the replay.
const lines = Object.fromEntries(session.split('\n').filter((l) => /^ +\d+ data\//.test(l))
  .map((l) => l.trim().split(/\s+/)).map(([n, f]) => [f, Number(n).toLocaleString('en-GB')]))

export const startFiveSources: SceneModel = ideFrame2({
  model: 'Five sources, two paths',
  tree: startTree('sources/README.md', []),
  editor: { file: 'sources/README.md', code: readme, lang: 'text' },
  session,
  side: [
    {
      type: 'group', id: 'paths', title: 'Five sources, two paths', icon: 'workflow', tone: 'ingest', dir: 'row', children: [
        {
          type: 'group', id: 'from', bare: true, children: [
            { type: 'item', id: 's-crm', title: 'CRM', sub: 'households, packages', icon: 'postgresql' },
            { type: 'item', id: 's-billing', title: 'Billing', sub: 'every charge', icon: 'postgresql' },
            { type: 'item', id: 's-vendor', title: 'Catalogue + EPG', sub: 'vendor files', icon: 'file' },
            { type: 'item', id: 's-boxes', title: 'Viewing events', sub: 'boxes and the app', icon: 'screen' },
            { type: 'item', id: 's-exchanges', title: 'Network telemetry', sub: '12 exchanges', icon: 'network' },
          ],
        },
        {
          type: 'group', id: 'to', bare: true, children: [
            {
              type: 'group', id: 'p-batch', title: 'Nightly batch', sub: 'correct, next morning', icon: 'clock', tone: 'store',
              children: [{ type: 'item', id: 'p-batch-how', title: 'raw zone → BigQuery', sub: 'Courses 5, 8–11', icon: 'gcs' }],
            },
            {
              type: 'group', id: 'p-stream', title: 'Live stream', sub: 'seconds, while it plays', icon: 'zap', tone: 'ingest',
              children: [{ type: 'item', id: 'p-stream-how', title: 'Pub/Sub → Dataflow', sub: 'Courses 6–7', icon: 'pubsub' }],
            },
          ],
        },
      ],
    },
    {
      type: 'table', id: 'counts', title: 'What sun_gen wrote (lines, with headers)', tone: 'store', columns: ['file', 'lines'], rows: [
        { id: 'c-households', cells: ['crm/households.csv', lines['data/crm/households.csv']] },
        { id: 'c-subscriptions', cells: ['crm/subscriptions.csv', lines['data/crm/subscriptions.csv']] },
        { id: 'c-charges', cells: ['billing/charges.csv', lines['data/billing/charges.csv']] },
        { id: 'c-titles', cells: ['catalogue/titles.csv', lines['data/catalogue/titles.csv']] },
        { id: 'c-viewing', cells: ['viewing/2026-10-31.jsonl', lines['data/viewing/2026-10-31.jsonl']], tone: 'ingest' },
        { id: 'c-telemetry', cells: ['telemetry/2026-10-31.jsonl', lines['data/telemetry/2026-10-31.jsonl']], tone: 'ingest' },
      ],
    },
  ],
  edges: [
    { from: 's-crm', to: 'p-batch' },
    { from: 's-billing', to: 'p-batch' },
    { from: 's-vendor', to: 'p-batch' },
    { from: 's-boxes', to: 'p-stream' },
    { from: 's-exchanges', to: 'p-stream' },
  ],
})
