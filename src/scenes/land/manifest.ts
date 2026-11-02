import type { SceneModel } from '@graphlearning/graphl-flow'
import { ideFrame, lineOf, linesFrom } from '../ide'
import { FAKE_GCS } from '../level'
import { landTree } from './tree'
import code from '../../../spine/land/04-manifest/project/extract/extract.py?raw'
import session from '../../../spine/land/04-manifest/session.txt?raw'
import manifest from '../../../spine/land/04-manifest/captured/sun-media-dev-raw/source=billing/dt=2026-10-31/_manifest.json?raw'

// §5.4 — the manifest (emulated). The derby day has happened (the step's setup applies sun_gen's
// day-2026-10-31.sql for both systems, off screen). `plan` writes dt=2026-10-31's _manifest.json
// BEFORE anything is copied: the window, each file's expected rows, its columns — what the copy must
// deliver. The JSON in the side pane is the object itself, read back from the raw zone by the replay.
const m = manifest.trimEnd()
const fold = [[1, lineOf(m, '"charge_id"')], [lineOf(m, '"updated_at"'), m.split('\n').length]] as [number, number][]

export const landManifest: SceneModel = ideFrame({
  tree: landTree('extract/extract.py', { extra: ['extract/extract.py'] }),
  editor: { file: 'extract/extract.py', code, show: [[lineOf(code, 'def plan'), lineOf(code, 'print(f"manifest')]], highlight: [lineOf(code, 'The manifest, written FIRST'), ...linesFrom(code, 'manifest = {', '"columns": columns}'), lineOf(code, 'bucket().blob(name).upload_from_string(json')] },
  session,
  side: [
    FAKE_GCS,
    {
      type: 'group', id: 'order', title: 'dt=2026-10-31, in order', icon: 'workflow', tone: 'ingest', dir: 'grid', cols: 2, children: [
        { type: 'item', id: 'o-plan', title: 'plan', sub: 'counts the window', icon: 'search' },
        { type: 'item', id: 'o-manifest', title: '_manifest.json', sub: 'the promise, written first', icon: 'file', tone: 'store' },
        { type: 'item', id: 'o-copy', title: 'copy', sub: 'writes charges.csv', icon: 'database', muted: true },
        { type: 'item', id: 'o-g1', title: 'G1', sub: 'holds the folder to the promise', icon: 'shield', muted: true },
      ],
    },
    { type: 'code', id: 'manifest', filename: 'source=billing/dt=2026-10-31/_manifest.json', lang: 'js', code: m, show: fold, tone: 'store', fill: true },
  ],
  edges: [
    { from: 'o-plan', to: 'o-manifest' },
    { from: 'o-manifest', to: 'o-g1', dashed: true },
    { from: 'o-copy', to: 'o-g1', dashed: true },
  ],
})
