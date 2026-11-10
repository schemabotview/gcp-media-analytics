import type { SceneModel } from '@graphlearning/graphl-flow'
import { lineOf, linesFrom } from '../ide'
import { ideFrame2 } from '../frame'
import { outputOf } from '../lab'
import { PUBSUB_EMU, RECORDED, level } from '../level'
import { stepTree } from '../files'
import curve from '../../../spine/intro/02-two-clocks/captured/curve.csv?raw'
import pubsubTf from '../../../spine/stream/02-topics/project/infra/modules/pubsub/main.tf?raw'
import s2 from '../../../spine/stream/02-topics/session.txt?raw'
import settop from '../../../spine/stream/03-publishing/project/produce/settop.py?raw'
import s3 from '../../../spine/stream/03-publishing/session.txt?raw'
import pull from '../../../spine/stream/04-pull-ack/project/consume/pull.py?raw'
import s4 from '../../../spine/stream/04-pull-ack/session.txt?raw'
import count from '../../../spine/stream/05-at-least-once/project/consume/count.py?raw'
import s5 from '../../../spine/stream/05-at-least-once/session.txt?raw'
import s6 from '../../../spine/stream/06-ordering/session.txt?raw'
import strict from '../../../spine/stream/07-dead-letters/project/consume/strict.py?raw'
import s7 from '../../../spine/stream/07-dead-letters/session.txt?raw'

// Course 6 · Pub/Sub: hearing every box. §2, §7 recorded on GCP; §3–§6 against gcloud's emulator.
const CLOSED = ['sources', 'infra', 'extract']
const tree = (step: string, active: string, fresh = [active]) => stepTree(step, active, { fresh, closed: CLOSED.filter((c) => !active.startsWith(c)), trim: active.startsWith('infra') ? ['infra', 'infra/modules'] : [] })

// §6.1 — why a stream: the same night, answered twice.
const points = curve.trim().split('\n').slice(1).map((l) => l.split(',')).map(([m, n]) => {
  const [h, mm] = m.split(':').map(Number)
  return [h * 60 + mm - 17 * 60, Number(n)] as [number, number]
})

export const streamWhy: SceneModel = {
  title: 'Why a stream',
  sub: 'the derby, as the live lane must draw it — minute by minute, while it plays',
  nodes: [
    {
      type: 'group', id: 'top', bare: true, dir: 'row', children: [
        {
          type: 'plot', id: 'curve', title: 'Derby households watching, per minute (from §1.2)',
          x: { min: 30, max: 150, step: 30, label: 'minutes after 17:00 UTC' }, y: { min: 0, max: 2400, step: 600, label: 'households' },
          series: [{ kind: 'line', points, tone: 'ingest' }],
        },
        {
          type: 'group', id: 'clocks', title: 'Two clocks', icon: 'clock', tone: 'store', children: [
            { type: 'item', id: 'c-batch', title: 'the nightly batch', sub: 'extracts at 02:00; correct by morning; useless at half time', icon: 'clock' },
            { type: 'item', id: 'c-stream', title: 'the stream', sub: 'each box’s event, seconds after it happens', icon: 'zap', tone: 'ingest' },
            { type: 'item', id: 'c-pubsub', title: 'Pub/Sub', sub: 'takes every message, keeps it until a reader acknowledges it', icon: 'pubsub', tone: 'ingest' },
          ],
        },
      ],
    },
    level('doc-cited', 'Google Cloud’s Pub/Sub overview'),
  ],
  edges: [{ from: 'c-stream', to: 'c-pubsub' }],
}

// §6.2 — topics and subscriptions, in Terraform.
const list = (cmd: string) => outputOf(s2, cmd).split('\n').filter(Boolean)
const topics = list('gcloud pubsub topics list --filter=$L --format="$F"')
const subs = list('gcloud pubsub subscriptions list --filter=$L --format="$F"')

export const streamTopics: SceneModel = ideFrame2({
  model: 'TODO',
  tree: tree('stream/02-topics', 'infra/modules/pubsub/main.tf', ['infra/modules/pubsub']),
  editor: { file: 'infra/modules/pubsub/main.tf', code: pubsubTf, show: [[1, 4], [lineOf(pubsubTf, "# Dataflow's subscriptions"), lineOf(pubsubTf, 'max_delivery_attempts') + 1]], highlight: linesFrom(pubsubTf, 'ack_deadline_seconds = 20', 'max_delivery_attempts') },
  session: s2,
  keep: ['Apply complete', ['$ gcloud pubsub topics list', 'network-telemetry-dataflow']],
  side: [
    RECORDED,
    {
      type: 'group', id: 'fan', title: 'Publisher → topic → subscription → subscriber', icon: 'pubsub', tone: 'ingest', children: [
        { type: 'item', id: 'f-boxes', title: 'the boxes', sub: 'publish every event', icon: 'screen' },
        { type: 'item', id: 'f-topic', title: 'viewing-events', sub: 'a topic: kept a day', icon: 'pubsub' },
        { type: 'item', id: 'f-sub', title: 'viewing-events-dataflow', sub: 'a subscription: ack within 20 s; 5 tries, then dead-letter', icon: 'pubsub', tone: 'store' },
        { type: 'item', id: 'f-reader', title: 'Dataflow', sub: 'the reader, in Course 7', icon: 'dataflow', muted: true },
      ],
    },
    {
      type: 'table', id: 'subs', title: 'Made by the apply, filtered to app=viewing-pulse', tone: 'store', columns: ['topic', 'its subscription'],
      rows: topics.map((t) => ({ id: `s-${t}`, cells: [t, subs.find((x) => x === `${t}-dataflow` || (t === 'dead-letter' && x === 'dead-letter-audit')) ?? '—'], tone: t === 'dead-letter' ? 'consume' as const : undefined })),
    },
  ],
  edges: [
    { from: 'f-boxes', to: 'f-topic', label: 'publish' },
    { from: 'f-topic', to: 'f-sub', label: 'a copy each' },
    { from: 'f-sub', to: 'f-reader', label: 'pull, ack', dashed: true },
  ],
})

// §6.3 — publishing: the derby replayed, 60× faster.
const pub = /^(\d+) events.*\n {2}(.+)\npublished (\d+) messages \((\d+) re-sent/m.exec(s3)!
const sample = outputOf(s3, 'python consume/pull.py viewing-events-dataflow --max 3').split('\n')[0]

export const streamPublishing: SceneModel = ideFrame2({
  model: 'TODO',
  tree: tree('stream/03-publishing', 'produce/settop.py', ['produce', 'consume', 'env.sh', 'requirements.txt']),
  editor: { file: 'produce/settop.py', code: settop, show: [[lineOf(settop, 'SPEED = 60'), lineOf(settop, 'RESEND = 400')], [lineOf(settop, 'sent, resent, futures'), lineOf(settop, 'resent += i % RESEND')]], highlight: [lineOf(settop, 'time.sleep(max(0'), ...linesFrom(settop, 'futures.append(publisher.publish(', 'type=e["type"]')] },
  session: s3,
  side: [
    PUBSUB_EMU,
    {
      type: 'group', id: 'msg', title: 'One event becomes one message', icon: 'pubsub', tone: 'ingest', children: [
        { type: 'item', id: 'm-box', title: 'a box’s event', sub: 'play, heartbeat, buffer, stop', icon: 'screen' },
        { type: 'item', id: 'm-message', title: 'a message', sub: 'data: the event as JSON · attributes: type, device_id', icon: 'file' },
        { type: 'item', id: 'm-topic', title: 'viewing-events', sub: 'the topic: Pub/Sub keeps it, numbers it, fans it out', icon: 'pubsub', tone: 'store' },
      ],
    },
    {
      type: 'table', id: 'replay', title: '17:30–17:35, replayed at 60×', tone: 'store', columns: ['what', 'how many'], rows: [
        { id: 'r-events', cells: ['events in the window', pub[1]] },
        ...pub[2].split(', ').map((kv) => kv.split(' ')).map(([k, v]) => ({ id: `r-${k}`, cells: [`  ${k}`, v] })),
        { id: 'r-messages', cells: ['messages published', pub[3]], tone: 'ingest' as const },
        { id: 'r-resent', cells: ['re-sent by a retry', pub[4]], tone: 'consume' as const },
      ],
    },
  ],
  edges: [
    { from: 'm-box', to: 'm-message' },
    { from: 'm-message', to: 'm-topic', label: 'publish' },
  ],
})

// §6.4 — pull and ack: an unacknowledged message comes back.
const lines4 = s4.split('\n').filter((l) => l.startsWith('message '))
const unacked = outputOf(s4, 'python consume/pull.py viewing-events-dataflow --max 1 --no-ack').split('\n')[0].split(/\s+/)[1]

export const streamPullAck: SceneModel = ideFrame2({
  model: 'TODO',
  tree: tree('stream/04-pull-ack', 'consume/pull.py', []),
  editor: { file: 'consume/pull.py', code: pull, show: [[1, 8], [lineOf(pull, 'got = sub.pull'), pull.trimEnd().split('\n').length]], highlight: linesFrom(pull, 'if got and not a.no_ack', 'sub.acknowledge') },
  session: s4,
  keep: [['$ python consume/pull.py viewing-events-dataflow --max 2', '1 pulled, 1 acknowledged']],
  side: [
    PUBSUB_EMU,
    {
      type: 'group', id: 'lease', title: `Message ${unacked}: pulled, not acknowledged`, icon: 'pubsub', tone: 'ingest', children: [
        { type: 'item', id: 'l-pull', title: 'pulled', sub: 'leased to this reader for 10 s (the ack deadline)', icon: 'timer' },
        { type: 'item', id: 'l-none', title: 'no ack', sub: 'the reader crashed, or forgot', icon: 'lock', tone: 'consume' },
        { type: 'item', id: 'l-again', title: `message ${unacked}, again`, sub: 'the lease ran out: delivered to the next pull', icon: 'pubsub', tone: 'store' },
      ],
    },
    {
      type: 'table', id: 'pulls', title: 'Every message the three pulls returned', tone: 'store', columns: ['message', 'type', 'event time'],
      rows: lines4.map((l) => l.split(/\s+/)).map((p, i) => ({ id: `p-${i}`, cells: [p[1], p[2], p[4]], tone: p[1] === unacked ? 'ingest' as const : undefined })),
    },
  ],
  edges: [
    { from: 'l-pull', to: 'l-none' },
    { from: 'l-none', to: 'l-again', label: 'after 10 s' },
  ],
})

// §6.5 — at-least-once: 23 events arrive twice.
const c5 = /(\d+) messages, (\d+) distinct event_ids\n(\d+) events arrived twice, e.g. event_id (\w+)/.exec(s5)!

export const streamAtLeastOnce: SceneModel = ideFrame2({
  model: 'TODO',
  tree: tree('stream/05-at-least-once', 'consume/count.py'),
  editor: { file: 'consume/count.py', code: count, show: [[lineOf(count, 'sub = pubsub_v1'), count.trimEnd().split('\n').length]], highlight: [lineOf(count, 'messages.add'), lineOf(count, 'events[json.loads'), lineOf(count, 'twice = sorted')] },
  session: s5,
  side: [
    PUBSUB_EMU,
    {
      type: 'table', id: 'counts', title: '18:30–18:35, every message drained', tone: 'store', columns: ['counted', 'how many'], rows: [
        { id: 'k-messages', cells: ['messages (each its own message_id)', c5[1]] },
        { id: 'k-events', cells: ['distinct event_ids', c5[2]] },
        { id: 'k-twice', cells: ['events that arrived twice', c5[3]], tone: 'consume' },
      ],
    },
    {
      type: 'group', id: 'who', title: 'At-least-once: who removes the second copy', icon: 'filter', tone: 'ingest', children: [
        { type: 'item', id: 'w-retry', title: 'a retry re-sends', sub: `event ${c5[4]}: two messages, one event`, icon: 'pubsub', tone: 'consume' },
        { type: 'item', id: 'w-dataflow', title: 'Dataflow, live', sub: 'dedupes by event_id inside each window (§7.6)', icon: 'dataflow' },
        { type: 'item', id: 'w-silver', title: 'Silver, next morning', sub: 'one row per event_id, whatever arrived (§8.7)', icon: 'bigquery', tone: 'store' },
      ],
    },
  ],
  edges: [
    { from: 'w-retry', to: 'w-dataflow' },
    { from: 'w-dataflow', to: 'w-silver' },
  ],
})

// §6.6 — ordering keys: one device, one ordered lane.
const seq = s6.split('\n').filter((l) => l.startsWith('message ')).map((l) => l.split(/\s+/))

export const streamOrdering: SceneModel = ideFrame2({
  model: 'TODO',
  tree: tree('stream/06-ordering', 'produce/settop.py', []),
  editor: { file: 'produce/settop.py', code: settop, show: [[lineOf(settop, 'options = pubsub_v1'), lineOf(settop, 'resent += i % RESEND')]], highlight: [...linesFrom(settop, 'options = pubsub_v1', 'enable_message_ordering'), lineOf(settop, 'key = e["device_id"]')] },
  session: s6,
  keep: [['$ D=', 'published'], ['$ python consume/pull.py', 'message 5 '], '15 pulled'],
  side: [
    PUBSUB_EMU,
    {
      type: 'group', id: 'lanes', title: 'One ordering key, one lane', icon: 'workflow', tone: 'ingest', children: [
        { type: 'item', id: 'o-key', title: 'ordering_key = device_id', sub: 'STB-13795’s messages share a key', icon: 'key' },
        { type: 'item', id: 'o-sub', title: 'viewing-events-ordered', sub: 'a subscription with message ordering on', icon: 'pubsub' },
        { type: 'item', id: 'o-out', title: `${seq.length} messages, in publish order`, sub: 'other keys still flow in parallel', icon: 'check', tone: 'store' },
      ],
    },
    {
      type: 'table', id: 'seq', title: 'STB-13795, 18:40–18:44 as received', tone: 'store', columns: ['message', 'type', 'event time'],
      rows: seq.slice(0, 8).map((p, i) => ({ id: `q-${i}`, cells: [p[1], p[2], p[4]] })),
    },
  ],
  edges: [
    { from: 'o-key', to: 'o-sub' },
    { from: 'o-sub', to: 'o-out' },
  ],
})

// §6.7 — dead letters: a poison message, five attempts, then the dead-letter topic.
const attempts = s7.split('\n').filter((l) => l.startsWith('attempt '))
const attrs = Object.fromEntries([...s7.matchAll(/CloudPubSubDeadLetter(\w+)=(\S+)/g)].map((m) => [m[1], m[2]]))

export const streamDeadLetters: SceneModel = ideFrame2({
  model: 'TODO',
  tree: tree('stream/07-dead-letters', 'consume/strict.py'),
  editor: { file: 'consume/strict.py', code: strict, show: [[lineOf(strict, 'def handle'), strict.trimEnd().split('\n').length]], highlight: [...linesFrom(strict, 'except ValueError', 'message.nack()')] },
  session: s7,
  keep: ['$ gcloud pubsub topics publish', ['$ python consume/strict.py', 'attempt 5'], ['$ gcloud pubsub subscriptions pull', 'SourceSubscription=']],
  side: [
    RECORDED,
    {
      type: 'group', id: 'dl', title: 'A message nobody can read', icon: 'pubsub', tone: 'consume', children: [
        { type: 'item', id: 'd-poison', title: 'not JSON', sub: 'published to viewing-events', icon: 'file', tone: 'consume' },
        { type: 'item', id: 'd-tries', title: `${attempts.length} deliveries, 5 nacks`, sub: 'retried 10 s apart (the retry policy)', icon: 'timer' },
        { type: 'item', id: 'd-dead', title: 'dead-letter', sub: 'moved by Pub/Sub’s own service agent', icon: 'pubsub', tone: 'consume' },
        { type: 'item', id: 'd-audit', title: 'dead-letter-audit', sub: 'a person reads it, with its history', icon: 'search' },
      ],
    },
    {
      type: 'table', id: 'attrs', title: 'What the dead letter carries', tone: 'store', columns: ['attribute', 'value'],
      rows: Object.entries(attrs).map(([k, v]) => ({ id: `a-${k}`, cells: [k.replace(/([A-Z])/g, ' $1').trim().toLowerCase(), v] })),
    },
  ],
  edges: [
    { from: 'd-poison', to: 'd-tries' },
    { from: 'd-tries', to: 'd-dead', label: 'after 5' },
    { from: 'd-dead', to: 'd-audit' },
  ],
})

export const streamScenes: Record<string, SceneModel> = {
  'stream-why': streamWhy,
  'stream-topics': streamTopics,
  'stream-publishing': streamPublishing,
  'stream-pull-ack': streamPullAck,
  'stream-at-least-once': streamAtLeastOnce,
  'stream-ordering': streamOrdering,
  'stream-dead-letters': streamDeadLetters,
}
