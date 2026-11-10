import type { SceneModel } from '@graphlearning/graphl-flow'
import { lineOf, linesFrom } from '../ide'
import { ideFrame2 } from '../frame'
import { RECORDED } from '../level'
import { stepTree } from '../files'
import hello from '../../../spine/dataflow/01-beam-model/project/stream/hello.py?raw'
import s1 from '../../../spine/dataflow/01-beam-model/session.txt?raw'
import live1 from '../../../spine/dataflow/02-first-pipeline/project/stream/live_viewers.py?raw'
import s2 from '../../../spine/dataflow/02-first-pipeline/session.txt?raw'
import arrivals from '../../../spine/dataflow/03-two-clocks/project/stream/arrivals.py?raw'
import s3 from '../../../spine/dataflow/03-two-clocks/session.txt?raw'
import live2 from '../../../spine/dataflow/04-fixed-windows/project/stream/live_viewers.py?raw'
import s4 from '../../../spine/dataflow/04-fixed-windows/session.txt?raw'
import late from '../../../spine/dataflow/05-watermarks/project/stream/late.py?raw'
import s5 from '../../../spine/dataflow/05-watermarks/session.txt?raw'
import live3 from '../../../spine/dataflow/06-dedupe/project/stream/live_viewers.py?raw'
import s6 from '../../../spine/dataflow/06-dedupe/session.txt?raw'
import sessions from '../../../spine/dataflow/07-sessions/project/stream/sessions.py?raw'
import s7 from '../../../spine/dataflow/07-sessions/session.txt?raw'
import live4 from '../../../spine/dataflow/08-into-bigquery/project/stream/live_viewers.py?raw'
import s8 from '../../../spine/dataflow/08-into-bigquery/session.txt?raw'
import live5 from '../../../spine/dataflow/09-on-dataflow/project/stream/live_viewers.py?raw'
import s9 from '../../../spine/dataflow/09-on-dataflow/session.txt?raw'

// Course 7 · Counting viewers while the match plays. §1–§7 run locally (Beam's Python direct runner
// over sun_gen's events; the arrivals model plants the slow boxes and the retries); §8–§9 recorded.
const CLOSED = ['sources', 'infra', 'extract', 'produce', 'consume']
const tree = (step: string, active: string, fresh = [active]) => stepTree(step, active, { fresh, closed: CLOSED })
const last = (code: string) => code.trimEnd().split('\n').length
const hm = (t: string) => { const [h, m, s = '0'] = t.split(':'); return (Number(h) - 17) * 60 + Number(m) + Number(s) / 60 }

// §7.1 — ◆ Beam's model: the smallest pipeline.
const counts = s1.split('\n')[1]

export const flowModel: SceneModel = ideFrame2({
  model: 'TODO',
  tree: tree('dataflow/01-beam-model', 'stream/hello.py', ['stream/hello.py', 'requirements.txt']),
  editor: { file: 'stream/hello.py', code: hello, show: [[lineOf(hello, 'KINDS ='), last(hello)]], highlight: linesFrom(hello, '| "events"', '| "count"') },
  session: s1,
  side: [
    {
      type: 'group', id: 'model', title: 'Beam: a pipeline is a graph', minH: 500, icon: 'dataflow', tone: 'ingest', children: [
        { type: 'item', id: 'b-in', title: 'PCollection', sub: 'a set of elements: six event kinds', icon: 'layers' },
        { type: 'item', id: 'b-pair', title: 'PTransform: Map', sub: 'each element on its own: kind → (kind, 1)', icon: 'workflow' },
        { type: 'item', id: 'b-count', title: 'PTransform: CombinePerKey', sub: 'all elements of a key together: sum', icon: 'workflow' },
        { type: 'item', id: 'b-out', title: 'PCollection', sub: counts, icon: 'layers', tone: 'store' },
      ],
    },
    {
      type: 'table', id: 'runners', title: 'The same graph, two runners', tone: 'store', columns: ['runner', 'where', 'here'], rows: [
        { id: 'r-direct', cells: ['DirectRunner', 'this laptop', '§7.1–§7.8'], tone: 'store' },
        { id: 'r-dataflow', cells: ['DataflowRunner', 'Google’s workers', '§7.9'] },
      ],
    },
  ],
  edges: [
    { from: 'b-in', to: 'b-pair' },
    { from: 'b-pair', to: 'b-count' },
    { from: 'b-count', to: 'b-out' },
  ],
})

// §7.2 — a first pipeline: read, parse, keep a slice, count by type.
const types = s2.split('\n').slice(1).filter(Boolean).map((l) => l.trim().split(/\s+/))

export const flowFirst: SceneModel = ideFrame2({
  model: 'TODO',
  tree: tree('dataflow/02-first-pipeline', 'stream/live_viewers.py'),
  editor: { file: 'stream/live_viewers.py', code: live1, show: [[lineOf(live1, 'def run'), lineOf(live1, '| "gather"')]], highlight: linesFrom(live1, '| "read"', '| "count"') },
  session: s2,
  side: [
    {
      type: 'group', id: 'graph', title: 'The pipeline graph', minH: 460, icon: 'dataflow', tone: 'ingest', children: [
        { type: 'item', id: 'g-read', title: 'read', sub: 'the night’s events, a line each', icon: 'file' },
        { type: 'item', id: 'g-parse', title: 'parse', sub: 'JSON → an event', icon: 'code' },
        { type: 'item', id: 'g-window', title: 'keep 18:30–18:35', sub: 'a filter on event_ts', icon: 'filter' },
        { type: 'item', id: 'g-count', title: 'count by type', sub: 'one total per kind', icon: 'workflow', tone: 'store' },
      ],
    },
    {
      type: 'table', id: 'types', title: 'Five minutes of the derby', tone: 'store', columns: ['type', 'events'],
      rows: types.map(([t, n]) => ({ id: `t-${t}`, cells: [t, Number(n).toLocaleString('en-GB')] })),
    },
  ],
  edges: [
    { from: 'g-read', to: 'g-parse' },
    { from: 'g-parse', to: 'g-window' },
    { from: 'g-window', to: 'g-count' },
  ],
})

// §7.3 — event time vs processing time: when the box says, when the platform hears.
const heardRows = s3.split('\n').filter((l) => /^\d\d:\d\d:\d\d\s/.test(l)).map((l) => l.trim().split(/\s+/))
const slowBoxes = /(\d+) slow boxes/.exec(s3)![1]

export const flowTwoClocks: SceneModel = ideFrame2({
  model: 'TODO',
  tree: tree('dataflow/03-two-clocks', 'stream/arrivals.py'),
  editor: { file: 'stream/arrivals.py', code: arrivals, show: [[lineOf(arrivals, 'RESEND = 400'), lineOf(arrivals, 'SLOW_LAG')], [lineOf(arrivals, 'def slow'), lineOf(arrivals, 'return timedelta(seconds=1 +')]], highlight: [lineOf(arrivals, 'SLOW_EVERY'), lineOf(arrivals, 'SLOW_LAG'), ...linesFrom(arrivals, 'if slow(e["device_id"])', 'return timedelta(seconds=lo')] },
  session: s3,
  side: [
    {
      type: 'plot', id: 'clocks', title: 'Each dot: when it happened → when it was heard', compact: true,
      x: { min: 98, max: 104, step: 1, label: 'event time, minutes after 17:00' }, y: { min: 98, max: 104, step: 1, label: 'heard at' },
      series: [
        { kind: 'segment', from: [98, 98], to: [104, 104], label: 'on time', tone: 'store' },
        { kind: 'scatter', points: heardRows.map(([ev, at]) => [hm(ev), hm(at)] as [number, number]), tone: 'consume' },
      ],
    },
    {
      type: 'table', id: 'heard', title: `Two clocks: ${slowBoxes} slow boxes, the rest within seconds`, tone: 'store', columns: ['event time', 'heard at', 'late by'],
      rows: heardRows.map(([ev, at, n], i) => ({ id: `h-${i}`, cells: [ev, at, `${n} s`], tone: Number(n) > 60 ? 'consume' as const : undefined })),
    },
  ],
})

// §7.4 — fixed windows: households per minute, in event time.
const perMinute = s4.split('\n').filter((l) => /^\d\d:\d\d\s/.test(l)).map((l) => l.trim().split(/\s+/))

export const flowWindows: SceneModel = ideFrame2({
  model: 'TODO',
  tree: tree('dataflow/04-fixed-windows', 'stream/live_viewers.py'),
  editor: { file: 'stream/live_viewers.py', code: live2, show: [[lineOf(live2, 'def stamp'), lineOf(live2, 'return window.TimestampedValue')], [lineOf(live2, '| "event time"'), lineOf(live2, '| "count"')]], highlight: [lineOf(live2, '| "event time"'), lineOf(live2, '| "minutes"'), lineOf(live2, '| "once each"')] },
  session: s4,
  side: [
    {
      type: 'plot', id: 'bars', title: 'SUN-SPORTS-1, households per one-minute window', compact: true,
      x: { min: 97.5, max: 104, step: 1, label: 'window start, minutes after 17:00' }, y: { min: 0, max: 2400, step: 600 },
      series: [{ kind: 'bar', points: perMinute.map(([m, , n]) => [hm(m) + 0.5, Number(n)] as [number, number]), tone: 'ingest' }],
    },
    {
      type: 'table', id: 'minutes', title: 'Fixed windows, in event time', tone: 'store', columns: ['window', 'households'],
      rows: perMinute.map(([m, , n]) => ({ id: `m-${m}`, cells: [`${m}–${m.slice(0, 3)}${String(Number(m.slice(3)) + 1).padStart(2, '0')}`, n], tone: m === '18:41' ? 'ingest' as const : undefined })),
    },
  ],
})

// §7.5 — ◆ watermarks and late data: on time, then refined.
const panes = s5.split('\n').filter((l) => /^\d\d:\d\d\s/.test(l)).map((l) => /^(\S+)\s+on time\s+(\d+)\s+late panes\s+(\d+)\s+final\s+(\d+)/.exec(l)!.slice(1))
const lateSeconds = /ALLOWED_LATENESS = (\d+)/.exec(late)![1]

export const flowWatermarks: SceneModel = ideFrame2({
  model: 'TODO',
  tree: tree('dataflow/05-watermarks', 'stream/late.py'),
  editor: { file: 'stream/late.py', code: late, show: [[lineOf(late, 'def night'), lineOf(late, 'return stream.advance_watermark_to_infinity')], [lineOf(late, '| beam.WindowInto('), lineOf(late, 'allowed_lateness=ALLOWED_LATENESS)')]], highlight: [lineOf(late, 'stream.advance_watermark_to(heard'), ...linesFrom(late, 'trigger=trigger.AfterWatermark', 'allowed_lateness=ALLOWED_LATENESS)')] },
  session: s5,
  side: [
    {
      type: 'group', id: 'wm', title: 'The window 18:41–18:42, as the night arrived', minH: 520, icon: 'clock', tone: 'ingest', children: [
        { type: 'item', id: 'w-pass', title: 'the watermark passes 18:42', sub: 'the pipeline’s estimate: nothing older is still coming', icon: 'timer' },
        { type: 'item', id: 'w-on', title: `ON_TIME pane: ${panes[1][1]}`, sub: 'what had been heard by then', icon: 'zap' },
        { type: 'item', id: 'w-late', title: `${panes[1][2]} LATE panes`, sub: 'each a slow box heard after it, minutes later', icon: 'clock', tone: 'consume' },
        { type: 'item', id: 'w-final', title: `final: ${panes[1][3]}`, sub: `the window stays open ${Number(lateSeconds) / 60} minutes late`, icon: 'check', tone: 'store' },
      ],
    },
    {
      type: 'table', id: 'panes', title: 'Every window: on time, then refined', tone: 'store', columns: ['window', 'on time', 'late panes', 'final'],
      rows: panes.map(([m, on, n, fin]) => ({ id: `p-${m}`, cells: [m, on, n, fin] })),
    },
  ],
  edges: [
    { from: 'w-pass', to: 'w-on' },
    { from: 'w-on', to: 'w-late' },
    { from: 'w-late', to: 'w-final' },
  ],
})

// §7.6 — dedupe in the stream: a retry's second copy, dropped by event_id.
const dd = s6.split('\n').filter((l) => /^\d\d:\d\d\s/.test(l)).map((l) => l.trim().split(/\s+/))

export const flowDedupe: SceneModel = ideFrame2({
  model: 'TODO',
  tree: tree('dataflow/06-dedupe', 'stream/live_viewers.py'),
  editor: { file: 'stream/live_viewers.py', code: live3, show: [[lineOf(live3, 'def run'), lineOf(live3, '| "count once"')]], highlight: linesFrom(live3, '| "by event_id"', '| "keep one"') },
  session: s6,
  side: [
    {
      type: 'table', id: 'dd', title: 'Seconds watched, per minute: as delivered, and once per event', tone: 'store', columns: ['minute', 'households', 'delivered', 'deduped'],
      rows: dd.map(([m, n, raw, once]) => ({ id: `d-${m}`, cells: [m, n, raw, once], tone: raw !== once ? 'consume' as const : undefined })),
    },
    {
      type: 'group', id: 'once', title: 'Inside each window', minH: 420, icon: 'filter', tone: 'ingest', children: [
        { type: 'item', id: 'o-in', title: 'events, retries included', sub: 'keyed by event_id', icon: 'pubsub' },
        { type: 'item', id: 'o-group', title: 'group by event_id', sub: 'a retry lands beside its first copy', icon: 'layers' },
        { type: 'item', id: 'o-one', title: 'keep one', sub: 'then add up seconds watched', icon: 'check', tone: 'store' },
      ],
    },
  ],
  edges: [
    { from: 'o-in', to: 'o-group' },
    { from: 'o-group', to: 'o-one' },
  ],
})

// §7.7 — sessions: a window that ends after a quiet gap.
const runs = [...s7.matchAll(/^\$ python stream\/sessions.py (\S+) --gap (\d+)\n((?:session .*\n?)+)/gm)]
  .map((m) => ({ device: m[1], gap: m[2], spans: [...m[3].matchAll(/session (\S+)-(\S+)\s+(\d+) events/g)].map((x) => [x[1], x[2], x[3]]) }))

export const flowSessions: SceneModel = ideFrame2({
  model: 'TODO',
  tree: tree('dataflow/07-sessions', 'stream/sessions.py'),
  editor: { file: 'stream/sessions.py', code: sessions, show: [[1, 7], [lineOf(sessions, 'with beam.Pipeline'), last(sessions)]], highlight: [lineOf(sessions, 'window.Sessions(a.gap * 60)')] },
  session: s7,
  side: [
    {
      type: 'plot', id: 'spans', title: 'Each bar: one session window', compact: true,
      x: { min: 0, max: 160, step: 40, label: 'minutes after 17:00' }, y: { min: 0, max: 4, step: 1, labels: ['', ...runs.map((r) => `${r.device.slice(4)} · ${r.gap}′`)] },
      series: runs.flatMap((r, i) => r.spans.map(([a, b]) => ({ kind: 'segment' as const, from: [hm(a), i + 1] as [number, number], to: [hm(b), i + 1] as [number, number], dashed: false, tone: r.spans.length > 1 ? 'consume' as const : 'ingest' as const }))),
    },
    {
      type: 'table', id: 'sess', title: 'Sessions: activity, then a quiet gap', tone: 'store', columns: ['device', 'gap', 'session', 'events'],
      rows: runs.flatMap((r, i) => r.spans.map(([a, b, n], j) => ({ id: `s-${i}-${j}`, cells: [r.device, `${r.gap} min`, `${a}–${b}`, n] }))),
    },
  ],
})

// §7.8 — into BigQuery: every minute of the derby, streamed into live.concurrent_viewers.
const peak = s8.split('\n').filter((l) => /^\| \d\d:\d\d/.test(l)).map((l) => l.split('|').map((c) => c.trim()).filter(Boolean))
const written = s8.split('\n').filter((l) => /^\d\d:\d\d\s+\d/.test(l)).length

export const flowBigQuery: SceneModel = ideFrame2({
  model: 'TODO',
  tree: tree('dataflow/08-into-bigquery', 'stream/live_viewers.py', ['stream/live_viewers.py', 'stream/peak.sql', 'infra/modules/live']),
  editor: { file: 'stream/live_viewers.py', code: live4, show: [[lineOf(live4, 'def row'), lineOf(live4, '"households": households')], [lineOf(live4, 'joined = {'), lineOf(live4, 'create_disposition="CREATE_NEVER"))')]], highlight: linesFrom(live4, '| "to BigQuery"', 'create_disposition="CREATE_NEVER"))') },
  session: s8,
  keep: ['$ python stream/live_viewers.py', ['$ $Q', '17:52']],
  side: [
    RECORDED,
    {
      type: 'group', id: 'path', title: 'Every minute, into BigQuery', minH: 420, icon: 'bigquery', tone: 'ingest', children: [
        { type: 'item', id: 'p-beam', title: 'the pipeline, on the laptop', sub: `${written} minutes of the derby, deduped`, icon: 'dataflow' },
        { type: 'item', id: 'p-insert', title: 'streaming inserts', sub: 'each row queryable as it lands', icon: 'zap' },
        { type: 'item', id: 'p-table', title: 'live.concurrent_viewers', sub: 'made by Terraform; partitioned by day', icon: 'bigquery', tone: 'store' },
      ],
    },
    {
      type: 'table', id: 'peak', title: 'The live peak, read back with bq', tone: 'store', columns: ['minute', 'households', 'watched s'],
      rows: peak.map(([m, n, w]) => ({ id: `k-${m}`, cells: [m, n, w], tone: m === '18:41' ? 'ingest' as const : undefined })),
    },
  ],
  edges: [
    { from: 'p-beam', to: 'p-insert' },
    { from: 'p-insert', to: 'p-table' },
  ],
})

// §7.9 — on Dataflow: the same counting as a streaming job, fed by Pub/Sub, drained.
const fired = s9.split('\n').filter((l) => /^\| \d\d:\d\d/.test(l)).map((l) => l.split('|').map((c) => c.trim()).filter(Boolean))
const top = [...fired].sort((a, b) => Number(b[1]) - Number(a[1]))[0]
const published = /published (\d+) messages/.exec(s9)![1]

export const flowDataflow: SceneModel = ideFrame2({
  model: 'TODO',
  tree: tree('dataflow/09-on-dataflow', 'stream/live_viewers.py', ['stream/live_viewers.py', 'stream/stream_peak.sql', 'infra/modules/dataflow']),
  editor: { file: 'stream/live_viewers.py', code: live5, show: [[lineOf(live5, '# The job\'s watermark'), lineOf(live5, 'REPLAY_LATENESS = ')], [lineOf(live5, '| "read" >> beam.io.ReadFromPubSub('), lineOf(live5, '| "count" >> beam.CombinePerKey(Once())')]], highlight: linesFrom(live5, '| "minutes" >> beam.WindowInto(', 'accumulation_mode=trigger.AccumulationMode.ACCUMULATING)') },
  session: s9,
  keep: ['$ python stream/live_viewers.py', 'published', '$ gcloud dataflow jobs drain', 'JOB_STATE_DRAINED', '| 18:41'],
  side: [
    RECORDED,
    {
      type: 'group', id: 'job', title: 'The same file, on Google’s workers', minH: 400, icon: 'dataflow', tone: 'ingest', children: [
        { type: 'item', id: 'j-sub', title: 'viewing-events-dataflow', sub: `${Number(published).toLocaleString('en-GB')} messages, ts = event time`, icon: 'pubsub' },
        { type: 'item', id: 'j-job', title: 'live-viewers', sub: 'one worker; windows, dedupe, count', icon: 'dataflow' },
        { type: 'item', id: 'j-table', title: 'live.concurrent_viewers', sub: 'a row per minute per firing', icon: 'bigquery', tone: 'store' },
      ],
    },
    {
      type: 'table', id: 'fired', title: 'What the job wrote: each minute’s last firing', tone: 'store', columns: ['minute', 'households', 'firings'],
      rows: fired.filter(([m]) => m >= '18:39' && m <= '18:45').map(([m, n, f]) => ({ id: `f-${m}`, cells: [m, n, f], tone: m === top[0] ? 'ingest' as const : undefined })),
    },
  ],
  edges: [
    { from: 'j-sub', to: 'j-job' },
    { from: 'j-job', to: 'j-table' },
  ],
})

export const dataflowScenes: Record<string, SceneModel> = {
  'flow-model': flowModel,
  'flow-first': flowFirst,
  'flow-two-clocks': flowTwoClocks,
  'flow-windows': flowWindows,
  'flow-watermarks': flowWatermarks,
  'flow-dedupe': flowDedupe,
  'flow-sessions': flowSessions,
  'flow-bigquery': flowBigQuery,
  'flow-dataflow': flowDataflow,
}
