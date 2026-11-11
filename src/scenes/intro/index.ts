import type { SceneModel } from '@graphlearning/graphl-flow'
import { lineOf, linesFrom } from '../ide'
import { SIDE_W, ideFrame2 } from '../frame'
import { outputOf } from '../lab'
import { BUILT, mapScene } from '../map'
import { stepTree } from '../files'
import sources from '../../../spine/start/01-five-sources/session.txt?raw'
import life from '../../../spine/start/04-an-events-life/session.txt?raw'
import code from '../../../spine/intro/02-two-clocks/project/answer/derby.py?raw'
import session from '../../../spine/intro/02-two-clocks/session.txt?raw'
import curve from '../../../spine/intro/02-two-clocks/captured/curve.csv?raw'

// Course 1 · Media analytics, and what we'll build.

// §1.1 — a night of viewing, in one picture: the household, its devices, the events they send, and the
// broadband underneath. The counts are sun_gen's, read from §3.1's and §3.4's local runs.
const lines = (file: string) => Number(new RegExp(` (\\d+) data/${file}`).exec(sources)![1])
const events = lines('viewing/2026-10-31.jsonl').toLocaleString('en-GB')
const households = (lines('crm/households.csv') - 1).toLocaleString('en-GB')
const kinds = outputOf(life, "awk '{print $2}' trace.txt | sort | uniq -c").split('\n').map((l) => l.trim().split(/\s+/)[1]).filter(Boolean)
  .sort((a, b) => ['play', 'heartbeat', 'buffer', 'stop'].indexOf(a) - ['play', 'heartbeat', 'buffer', 'stop'].indexOf(b))

export const introNight: SceneModel = {
  nodes: [
    { type: 'group', id: 'top', bare: true, dir: 'row', children: [
    {
      type: 'group', id: 'home', title: 'A household, derby night', icon: 'users', tone: 'ingest', children: [
        { type: 'item', id: 'h-household', title: `one of ${households} households`, sub: 'a Sun TV and broadband customer', icon: 'users' },
        {
          type: 'group', id: 'h-devices', bare: true, dir: 'row', children: [
            { type: 'item', id: 'h-box', title: 'set-top box', sub: 'in the living room', icon: 'screen' },
            { type: 'item', id: 'h-app', title: 'the app', sub: 'phone, tablet, web', icon: 'laptop' },
          ],
        },
      ],
    },
    {
      type: 'group', id: 'wire', title: 'What the devices send', icon: 'activity', tone: 'ingest', children: [
        ...kinds.map((k) => ({ type: 'item' as const, id: `e-${k}`, title: k, sub: { play: 'the picture starts', heartbeat: 'every minute it plays', buffer: 'the picture stalls', stop: 'it ends' }[k] ?? '', icon: k === 'buffer' ? 'timer' : 'zap', tone: k === 'buffer' ? 'consume' as const : undefined })),
        { type: 'item', id: 'e-total', title: `${events} events`, sub: 'one Saturday, every device', icon: 'stream' },
      ],
    },
    {
      type: 'group', id: 'sun', title: 'Sun', sub: 'what it needs to know', icon: 'building', tone: 'store', children: [
        { type: 'item', id: 's-now', title: 'now: who is watching?', sub: 'per channel, per minute, while it plays', icon: 'zap' },
        { type: 'item', id: 's-morning', title: 'next morning: how did it go?', sub: 'per title, per exchange, correct', icon: 'clock' },
      ],
    },
    ] },
    {
      type: 'group', id: 'net', title: 'Underneath: Sun’s broadband', icon: 'network', tone: 'infra', dir: 'row', children: [
        { type: 'item', id: 'n-line', title: 'the household’s line', sub: 'to its exchange', icon: 'network' },
        { type: 'item', id: 'n-exchange', title: '12 exchanges', sub: 'each reports every minute', icon: 'server' },
        { type: 'item', id: 'n-quality', title: 'when an exchange struggles', sub: 'pictures stall in every home it serves', icon: 'timer', tone: 'consume' },
      ],
    },
  ],
  edges: [
    { from: 'h-devices', to: 'wire' },
    { from: 'e-total', to: 's-morning' },
    { from: 'n-line', to: 'n-exchange' },
    { from: 'n-exchange', to: 'n-quality' },
  ],
}

// §1.2 — two questions, two clocks: the answer, computed on a laptop from every event at once.
const points = curve.trim().split('\n').slice(1).map((l) => l.split(',')).map(([m, n]) => {
  const [h, mm] = m.split(':').map(Number)
  return [h * 60 + mm - 17 * 60, Number(n)] as [number, number]
})
const peak = /peak (\d+) households at (\S+)/.exec(session)!
const ratios = outputOf(session, 'python answer/derby.py').split('\n').filter((l) => /^ {2}\S/.test(l)).map((l) => l.trim().split(/\s{2,}/))

export const introTwoClocks: SceneModel = ideFrame2({
  model: 'Two questions, two clocks',
  tree: stepTree('intro/02-two-clocks', 'answer/derby.py'),
  editor: { file: 'answer/derby.py', code, show: [[lineOf(code, 'watching = defaultdict'), lineOf(code, 'stalled[ex] += e')], [lineOf(code, 'peak = max'), lineOf(code, 'print(f"live')]], highlight: [lineOf(code, 'watching[e["event_ts"]'), ...linesFrom(code, 'watched[ex] += e', 'stalled[ex] += e')] },
  session,
  side: [
    {
      type: 'plot', id: 'curve', title: `Derby households watching, per minute — peak ${peak[1]} at ${peak[2]}`, compact: true, w: SIDE_W - 34,
      x: { min: 30, max: 150, step: 30, label: 'minutes after 17:00 UTC' }, y: { min: 0, max: 2400, step: 600, label: 'households' },
      series: [{ kind: 'line', points, tone: 'ingest' }],
    },
    {
      type: 'table', id: 'ratio', title: 'Next morning: buffering ÷ watched, the derby', tone: 'store', columns: ['exchange', 'ratio'],
      rows: ratios.map(([ex, r]) => ({ id: `r-${ex.replace(/\W+/g, '-')}`, cells: [ex, r], tone: ex === 'EX-LDN-04' ? 'consume' as const : undefined })),
    },
    { type: 'item', id: 'laptop', icon: 'laptop', tone: 'consume', title: 'One laptop, after the fact', sub: 'live, then right by morning' },
  ],
})

// §1.3 — what we'll build: the whole platform, both lanes lit.
export const introMap: SceneModel = mapScene(BUILT.operate)

export const introScenes: Record<string, SceneModel> = {
  'intro-night': introNight,
  'intro-two-clocks': introTwoClocks,
  'intro-map': introMap,
}
