import type { SceneModel } from '@graphlearning/graphl-flow'
import { ideFrame, lineOf, linesFrom } from '../ide'
import { outputOf } from '../lab'
import { CRM_FILES, startTree } from './tree'
import schema from '../../../spine/start/02-the-crm/project/sources/crm/schema.sql?raw'
import session from '../../../spine/start/02-the-crm/session.txt?raw'

// §3.2 — the CRM (runs locally, PostgreSQL 18.6). load.sh loads both systems; the queries show the
// package mix and HH-10042's two versions — the mid-month upgrade Silver keeps as SCD2 in §8.8.
const rowsOf = (out: string) => out.split('\n').slice(2).filter(Boolean).map((l) => l.split('|').map((c) => c.trim()))
const mix = rowsOf(outputOf(session, 'psql crm -P footer=off -f sources/crm/mix.sql'))
const versions = rowsOf(outputOf(session, 'psql crm -P footer=off -v hh=HH-10042 -f sources/crm/history.sql'))
const households = mix.reduce((n, r) => n + Number(r[2]), 0)

export const startCrm: SceneModel = ideFrame({
  tree: startTree('sources/crm/schema.sql', CRM_FILES, CRM_FILES),
  editor: { file: 'sources/crm/schema.sql', code: schema, show: [[lineOf(schema, 'CREATE TABLE households'), schema.trimEnd().split('\n').length]], highlight: [lineOf(schema, 'household_id    text NOT NULL REFERENCES'), lineOf(schema, 'package_id      text NOT NULL REFERENCES'), ...linesFrom(schema, 'valid_from', 'valid_to')] },
  session,
  side: [
    {
      type: 'group', id: 'er', title: 'The CRM, as tables', icon: 'database', tone: 'store', children: [
        { type: 'item', id: 'e-households', title: `households · ${households.toLocaleString('en-GB')}`, sub: 'who: name, email, phone, region, exchange_id', icon: 'users' },
        { type: 'item', id: 'e-subscriptions', title: 'subscriptions', sub: 'one row per version: valid_from, valid_to', icon: 'table' },
        { type: 'item', id: 'e-packages', title: `packages · ${mix.length}`, sub: 'what: name, monthly_price', icon: 'package' },
      ],
    },
    {
      type: 'table', id: 'mix', title: 'Households by current package', tone: 'store', columns: ['package', '£ a month', 'households'],
      rows: mix.map(([name, price, n]) => ({ id: `m-${name}`, cells: [name, price, n] })),
    },
    {
      type: 'table', id: 'versions', title: 'HH-10042: two versions', tone: 'ingest', columns: ['package_id', 'valid_from', 'valid_to'],
      rows: versions.map(([p, from, to], i) => ({ id: `v-${i}`, cells: [p, from, to || 'current'], tone: to ? undefined : 'ingest' as const })),
    },
    { type: 'note', id: 'note', tone: 'store', text: 'The CRM keeps every version of a household’s package. Upgrading closes the old row and opens a new one, so the history is in the source.' },
  ],
  edges: [
    { from: 'e-households', to: 'e-subscriptions', label: '1 : many' },
    { from: 'e-subscriptions', to: 'e-packages', label: 'many : 1' },
  ],
})
