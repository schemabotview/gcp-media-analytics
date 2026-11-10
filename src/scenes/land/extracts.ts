import type { SceneModel } from '@graphlearning/graphl-flow'
import { lineOf, linesFrom } from '../ide'
import { ideFrame2 } from '../frame'
import { outputOf } from '../lab'
import { FAKE_GCS } from '../level'
import { landTree } from './tree'
import code from '../../../spine/land/03-extracts/project/extract/extract.py?raw'
import session from '../../../spine/land/03-extracts/session.txt?raw'

// §5.3 — the nightly extracts (emulated raw zone, real PostgreSQL). The CRM is a SNAPSHOT: all three
// tables, every night. Billing is INCREMENTAL: only the charges its window holds. Both land under
// dt=2026-10-30 (the night before the derby) and end with _SUCCESS, written unconditionally — the
// marker §5.5 takes away from the copy and gives to the gate. Every count is the replay's.
const rows = (out: string, file: string) => new RegExp(`${file.replace('.', '\\.')} (\\d+) rows`).exec(out)![1]
const crm = outputOf(session, 'python extract/extract.py crm --dt 2026-10-30')
const billing = outputOf(session, 'python extract/extract.py billing --dt 2026-10-30')
const [, from, to] = /window \((\S+), (\S+)\]/.exec(billing)!

export const landExtracts: SceneModel = ideFrame2({
  model: 'TODO',
  tree: landTree('extract/extract.py', { extra: ['extract/extract.py'], fresh: ['extract/extract.py'] }),
  editor: {
    file: 'extract/extract.py', code,
    show: [[lineOf(code, 'SNAPSHOT = {'), lineOf(code, 'INCREMENTAL = {')], [lineOf(code, 'folder = partition'), lineOf(code, 'print(f"{source}: -> {folder}")')]],
    highlight: [lineOf(code, 'SNAPSHOT = {'), lineOf(code, 'INCREMENTAL = {'), ...linesFrom(code, '" WHERE updated_at > %s'), lineOf(code, '"_SUCCESS"')],
  },
  session,
  side: [
    FAKE_GCS,
    {
      type: 'group', id: 'flow', title: 'The night of 30 October', icon: 'workflow', tone: 'ingest', dir: 'grid', cols: 2, children: [
        { type: 'item', id: 'f-crm', title: 'CRM', sub: 'PostgreSQL · 3 tables', icon: 'postgresql' },
        { type: 'item', id: 'f-crm-raw', title: 'source=crm/dt=2026-10-30/', sub: 'a snapshot: everything, again', icon: 'gcs', tone: 'store' },
        { type: 'item', id: 'f-billing', title: 'Billing', sub: 'PostgreSQL · charges', icon: 'postgresql' },
        { type: 'item', id: 'f-billing-raw', title: 'source=billing/dt=2026-10-30/', sub: 'a window: one night’s changes', icon: 'gcs', tone: 'store' },
        { type: 'item', id: 'f-trust', title: 'nothing checks the copy', sub: 'what it found is what it marks', icon: 'shield', tone: 'consume' },
        { type: 'item', id: 'f-success', title: '_SUCCESS, in each folder', sub: '“this night is complete”', icon: 'file' },
      ],
    },
    {
      type: 'table', id: 'shapes', title: 'Two shapes of extract', tone: 'store', columns: ['file', 'rows', 'which rows'], rows: [
        { id: 's-households', cells: ['households.csv', rows(crm, 'households.csv'), 'all of them'] },
        { id: 's-subscriptions', cells: ['subscriptions.csv', rows(crm, 'subscriptions.csv'), 'all of them'] },
        { id: 's-packages', cells: ['packages.csv', rows(crm, 'packages.csv'), 'all of them'] },
        { id: 's-charges', cells: ['charges.csv', rows(billing, 'charges.csv'), `updated in (${from.slice(5, 10)}, ${to.slice(5, 10)}]`], tone: 'ingest' },
      ],
    },
  ],
  edges: [
    { from: 'f-crm', to: 'f-crm-raw', label: 'copy all' },
    { from: 'f-billing', to: 'f-billing-raw', label: 'copy window' },
    { from: 'f-billing-raw', to: 'f-success', label: 'then, always' },
    { from: 'f-trust', to: 'f-success', dashed: true },
  ],
})
