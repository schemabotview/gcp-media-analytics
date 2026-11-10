import type { SceneModel } from '@graphlearning/graphl-flow'
import { lineOf, linesFrom } from '../ide'
import { ideFrame2 } from '../frame'
import { outputOf } from '../lab'
import { FAKE_GCS } from '../level'
import { landTree } from './tree'
import code from '../../../spine/land/05-g1-fails/project/extract/g1.py?raw'
import session from '../../../spine/land/05-g1-fails/session.txt?raw'

// §5.5 — ⑂ G1 fails (a branch: run, then discarded; §5.6 starts from §5.4's state). Between `plan`
// (§5.4, 02:00) and the copy, at 02:00:04, billing re-rates three of the night's rentals — the step's
// setup applies sun_gen's rerate.sql, off screen, as billing's own job would. Their updated_at moves
// past the window's end, so the copy reads 1065 rows where the manifest promised 1068.
const g1 = outputOf(session, 'python extract/g1.py billing --dt 2026-10-31').split('\n').filter((l) => /^ {2}\S/.test(l))
  .map((l) => /^ {2}(.+?)\s+(\d+) of (\d+)\s+(PASS|FAIL)$/.exec(l)!.slice(1)) // [check, got, want, verdict]
const latest = outputOf(session, 'psql billing -Atc "SELECT max(updated_at) FROM charges"').trim()
const copied = /billing: (\d+) rows/.exec(session)![1]
const promised = g1.find(([check]) => check.endsWith('rows'))![2]
const published = /last published (\S+)/.exec(session)![1]

export const landG1Fails: SceneModel = ideFrame2({
  model: 'G1: a short night is never published',
  tree: landTree('extract/g1.py', { extra: ['extract/extract.py', 'extract/g1.py'], fresh: ['extract/g1.py'] }),
  editor: { file: 'extract/g1.py', code, show: [[lineOf(code, 'def check'), lineOf(code, 'return all(')]], highlight: [...linesFrom(code, 'results = [("files"', '(f"{file} rows"'), lineOf(code, 'return all(')] },
  session,
  side: [
    FAKE_GCS,
    {
      type: 'group', id: 'night', title: '⑂ The night billing came up short', icon: 'clock', tone: 'consume', children: [
        { type: 'item', id: 'n-plan', title: '02:00:00 plan', sub: `the manifest promises ${promised}`, icon: 'search' },
        { type: 'item', id: 'n-rerate', title: `${latest.slice(11, 19)} billing re-rates ${Number(promised) - Number(copied)} rentals`, sub: 'updated_at moves past the window', icon: 'card', tone: 'infra' },
        { type: 'item', id: 'n-copy', title: 'copy reads the window', sub: `${copied} rows land in charges.csv`, icon: 'database' },
        { type: 'item', id: 'n-g1', title: 'G1 FAIL', sub: `no _SUCCESS · last published stays ${published}`, icon: 'shield', tone: 'consume' },
      ],
    },
    {
      type: 'table', id: 'checks', title: 'G1: the folder against its manifest', tone: 'consume', columns: ['check', 'found', 'promised', ''], rows:
        g1.map(([check, got, want, verdict]) => ({ id: `g-${check.replace(/\W+/g, '-')}`, cells: [check, got, want, verdict], tone: verdict === 'FAIL' ? 'consume' as const : undefined })),
    },
  ],
  edges: [
    { from: 'n-plan', to: 'n-rerate' },
    { from: 'n-rerate', to: 'n-copy' },
    { from: 'n-copy', to: 'n-g1' },
  ],
})
