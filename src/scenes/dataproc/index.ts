import type { SceneModel } from '@graphlearning/graphl-flow'
import { ideFrame, lineOf, linesFrom } from '../ide'
import { MOCKED, level } from '../level'
import { stepTree } from '../files'
import qos from '../../../spine/dataproc/02-pyspark-locally/project/spark/qos_by_exchange.py?raw'
import s2 from '../../../spine/dataproc/02-pyspark-locally/session.txt?raw'
import silverPy from '../../../spine/dataproc/03-bigquery-connector/project/spark/silver.py?raw'
import s3 from '../../../spine/dataproc/03-bigquery-connector/session.txt?raw'
import buffering from '../../../spine/dataproc/04-buffering/project/spark/buffering.py?raw'
import s4 from '../../../spine/dataproc/04-buffering/session.txt?raw'
import skew5 from '../../../spine/dataproc/05-skew/project/spark/skew.py?raw'
import s5 from '../../../spine/dataproc/05-skew/session.txt?raw'
import skew6 from '../../../spine/dataproc/06-fixing-skew/project/spark/skew.py?raw'
import s6 from '../../../spine/dataproc/06-fixing-skew/session.txt?raw'
import job from '../../../spine/dataproc/07-serverless/project/spark/qos_job.py?raw'
import s7 from '../../../spine/dataproc/07-serverless/session.txt?raw'
import s8 from '../../../spine/dataproc/08-writing-back/session.txt?raw'

// Course 9 · Spark for the heavy join. MOCKED from here on (the owner's call, 2026-11-03): local Spark
// outputs are real runs of the same code made while drafting; GCP outputs are authored to match.
const CLOSED = ['sources', 'infra', 'extract', 'produce', 'consume', 'stream', 'warehouse']
const tree = (step: string, active: string, fresh = [active]) =>
  stepTree(step, active, { fresh, closed: CLOSED.filter((c) => !active.startsWith(c)), trim: active.startsWith('infra') ? ['infra', 'infra/modules'] : [] })

/** `spark/skew.py`'s per-task rows, in the order printed, for one run (the n-th in the session). */
function tasks(session: string, n = 0): number[] {
  const runs = session.split(/^the join's stage: \d+ tasks$/m).slice(1)
  return runs[n].split('\n').filter((l) => /^ *[\d,]+  #/.test(l)).map((l) => Number(l.trim().split(/\s+/)[0].replace(/,/g, '')))
}
const bars = (rows: number[], id: string, title: string, tone: 'ingest' | 'store' | 'consume') => ({
  type: 'plot' as const, id, title, compact: true,
  x: { min: 0, max: rows.length + 1, step: 1, label: 'task' }, y: { min: 0, max: 280000, step: 70000, label: 'rows read' },
  series: [{ kind: 'bar' as const, points: rows.map((r, i) => [i + 1, r] as [number, number]), tone }],
})

// §9.1 — ◆ Dataproc's shapes: who manages what.
export const procShapes: SceneModel = {
  title: 'Dataproc’s shapes',
  sub: 'the same Spark, three ways to run it on Google Cloud — and what is left for Priya to manage',
  nodes: [
    {
      type: 'group', id: 'top', bare: true, dir: 'row', children: [
        {
          type: 'group', id: 'cluster', title: 'Dataproc on a cluster', icon: 'dataproc', tone: 'infra', children: [
            { type: 'item', id: 'c-vms', title: 'Compute Engine VMs', sub: 'a master and workers; she sizes them, starts them, stops them', icon: 'server' },
            { type: 'item', id: 'c-yarn', title: 'YARN, HDFS, Spark', sub: 'installed and tuned by Dataproc; versions chosen by her image', icon: 'spark' },
            { type: 'item', id: 'c-bill', title: 'billed while it runs', sub: 'idle or busy, until deleted', icon: 'clock', tone: 'consume' },
          ],
        },
        {
          type: 'group', id: 'serverless', title: 'Dataproc Serverless', icon: 'dataproc', tone: 'ingest', children: [
            { type: 'item', id: 's-batch', title: 'a batch', sub: 'her PySpark file and its arguments; nothing else', icon: 'code' },
            { type: 'item', id: 's-exec', title: 'executors on demand', sub: 'scaled by Google for that batch, gone when it ends', icon: 'zap' },
            { type: 'item', id: 's-bill', title: 'billed per batch', sub: 'the compute it used, while it ran', icon: 'clock', tone: 'store' },
          ],
        },
        {
          type: 'group', id: 'gke', title: 'Dataproc on GKE', icon: 'kubernetes', tone: 'neutral', children: [
            { type: 'item', id: 'k-cluster', title: 'her Kubernetes cluster', sub: 'Spark as pods beside other work', icon: 'kubernetes' },
            { type: 'item', id: 'k-why', title: 'when a platform team runs GKE already', sub: 'not this course', icon: 'users', muted: true },
          ],
        },
      ],
    },
    level('doc-cited', 'Google Cloud’s Dataproc and Dataproc Serverless overviews'),
    { type: 'note', id: 'docs', tone: 'infra', text: 'cloud.google.com/dataproc/docs/concepts/overview · cloud.google.com/dataproc-serverless/docs/overview — viewing-pulse runs one batch a night: Serverless (§9.7).' },
  ],
  edges: [
    { from: 'c-vms', to: 'c-yarn' },
    { from: 's-batch', to: 's-exec' },
  ],
}

// §9.2 — PySpark locally first: the derby's QoS per exchange and minute.
const tableAfter = (session: string, cmd: string) => {
  const block = session.split(cmd)[1].split('\n$ ')[0]
  return block.split('\n').filter((l) => /^\| \d\d:\d\d\|/.test(l)).map((l) => l.split('|').slice(1, -1).map((c) => c.trim()))
}
const ldn04 = tableAfter(s2, '--exchange EX-LDN-04')
const ldn01 = tableAfter(s2, '--exchange EX-LDN-01')

export const procLocal: SceneModel = ideFrame({
  tree: tree('dataproc/02-pyspark-locally', 'spark/qos_by_exchange.py', ['spark', 'env.sh', 'requirements.txt']),
  editor: { file: 'spark/qos_by_exchange.py', code: qos, show: [[lineOf(qos, 'events = spark.read.json'), lineOf(qos, '"loss_pct"), ["exchange_id", "minute"])')]], highlight: linesFrom(qos, 'seen = (events.where', '"loss_pct"), ["exchange_id", "minute"])') },
  session: s2,
  keep: ['$ python spark/qos_by_exchange.py --exchange EX-LDN-04', ['| 18:34|', '| 18:36|'], '$ python spark/qos_by_exchange.py --exchange EX-LDN-01', ['| 18:34|', '| 18:36|']],
  side: [
    MOCKED,
    {
      type: 'group', id: 'join', title: 'Two sources, one row per exchange and minute', minH: 380, icon: 'spark', tone: 'ingest', children: [
        {
          type: 'group', id: 'j-src', bare: true, dir: 'row', children: [
            { type: 'item', id: 'j-boxes', title: 'the boxes', sub: 'households, watched s, buffering s', icon: 'screen' },
            { type: 'item', id: 'j-lines', title: 'the exchange', sub: 'latency, packet loss', icon: 'network' },
          ],
        },
        { type: 'item', id: 'j-row', title: 'joined on exchange and minute', sub: 'local[4]: Spark on four cores of the laptop', icon: 'spark', tone: 'store' },
      ],
    },
    {
      type: 'table', id: 'cmp', title: 'From 18:35, EX-LDN-04 and a healthy exchange', tone: 'store', columns: ['minute', '04 buffering s', '04 ms', '01 buffering s', '01 ms'],
      rows: ldn04.map((r, i) => ({ id: `m-${r[0]}`, cells: [r[0], r[3], r[4], ldn01[i][3], ldn01[i][4]], tone: r[0] >= '18:35' ? 'consume' as const : undefined })),
    },
  ],
  edges: [
    { from: 'j-boxes', to: 'j-row' },
    { from: 'j-lines', to: 'j-row' },
  ],
})

// §9.3 — the BigQuery connector: what Spark hands to BigQuery.
const pushed = /^PushedFilters: \[(.*)\]$/m.exec(s3.replace(/\n(?=[^$\n][^\n]*\])/g, ''))![1].split(', ')
const read = /^([\d,]+) derby events read$/m.exec(s3)![1]

export const procConnector: SceneModel = ideFrame({
  tree: tree('dataproc/03-bigquery-connector', 'spark/silver.py'),
  editor: { file: 'spark/silver.py', code: silverPy, show: [[lineOf(silverPy, 'events = (spark.read.format("bigquery")'), lineOf(silverPy, 'print(f"{events.count():,} derby events read")')]], highlight: linesFrom(silverPy, '.where((F.col("dt")', '.select("household_id"') },
  session: s3,
  keep: ['$ python spark/silver.py', 'found com.google.cloud.spark', ['PushedFilters', 'derby events read']],
  side: [
    MOCKED,
    {
      type: 'group', id: 'push', title: 'Spark → Storage Read API → only what was asked', minH: 400, icon: 'bigquery', tone: 'ingest', children: [
        { type: 'item', id: 'p-spark', title: 'Spark, on the laptop', sub: 'a where and a select, in Python', icon: 'spark' },
        { type: 'item', id: 'p-api', title: 'the Storage Read API', sub: 'a read session: filters and columns applied in BigQuery', icon: 'bigquery' },
        { type: 'item', id: 'p-rows', title: `${read} rows, 3 columns`, sub: 'not 400,949 rows of 11', icon: 'layers', tone: 'store' },
      ],
    },
    {
      type: 'table', id: 'filters', title: 'Pushed down, from Spark’s own plan', tone: 'store', columns: ['filter BigQuery applied'],
      rows: pushed.map((f, i) => ({ id: `f-${i}`, cells: [f] })),
    },
  ],
  edges: [
    { from: 'p-spark', to: 'p-api' },
    { from: 'p-api', to: 'p-rows' },
  ],
})

// §9.4 — the buffering ratio per exchange.
const ratios = s4.split('\n').filter((l) => /^EX-/.test(l)).map((l) => /^(\S+) +([\d,]+) s watched +([\d,]+) s buffering +([\d.]+%)/.exec(l)!.slice(1))

export const procRatio: SceneModel = ideFrame({
  tree: tree('dataproc/04-buffering', 'spark/buffering.py'),
  editor: { file: 'spark/buffering.py', code: buffering, show: [[lineOf(buffering, 'ratio = (events.where'), lineOf(buffering, 'f"{r[\'buffering_s\']:>8,.0f} s buffering  {r[\'ratio\']:6.1%}")')]], highlight: linesFrom(buffering, '.agg(F.sum("watched_s")', '.withColumn("ratio"') },
  session: s4,
  keep: ['$ python spark/buffering.py', ['EX-LDN-04', 'EX-MAN-02']],
  side: [
    MOCKED,
    {
      type: 'plot', id: 'ratio', title: 'Buffering seconds per second watched, the whole derby', compact: true,
      x: { min: 0, max: 13, step: 1, label: 'exchange (EX-LDN-04 first)' }, y: { min: 0, max: 5, step: 1, label: '%' },
      series: [{ kind: 'bar', points: ratios.map((r, i) => [i + 1, Number(r[3].replace('%', ''))] as [number, number]), tone: 'consume' }],
    },
    {
      type: 'table', id: 'top', title: 'The answer, per exchange', tone: 'store', columns: ['exchange', 'watched s', 'buffering s', 'ratio'],
      rows: ratios.slice(0, 4).map(([e, w, b, r]) => ({ id: `r-${e}`, cells: [e, w, b, r], tone: e === 'EX-LDN-04' ? 'consume' as const : undefined })),
    },
    { type: 'note', id: 'note', tone: 'store', text: 'Every exchange buffers 0.6% of what it delivers; EX-LDN-04 buffers 4.1%, almost all of it after 18:35.' },
  ],
})

// §9.5 — ⑂ the derby skew: one task reads most of the join.
const t5 = tasks(s5)

export const procSkew: SceneModel = ideFrame({
  tree: tree('dataproc/05-skew', 'spark/skew.py'),
  editor: { file: 'spark/skew.py', code: skew5, show: [[lineOf(skew5, 'spark = (SparkSession.builder'), lineOf(skew5, '.config("spark.sql.adaptive.enabled", a.aqe)')], [lineOf(skew5, 'joined = (events.join(titles'), lineOf(skew5, 'F.sum("watched_s").alias("watched_s")))')]], highlight: linesFrom(skew5, 'joined = (events.join(titles', 'joined = (events.join(titles') },
  session: s5,
  keep: ['$ python spark/skew.py', ['the join\'s stage', '6,691']],
  side: [
    MOCKED,
    bars(t5, 'tasks', 'Rows each task of the join read', 'consume'),
    {
      type: 'group', id: 'why', title: 'One title, one partition', minH: 300, icon: 'spark', tone: 'consume', children: [
        { type: 'item', id: 'w-hash', title: 'hash(title_id) mod 8', sub: 'every row of a title lands in the same task', icon: 'layers' },
        { type: 'item', id: 'w-derby', title: `T-5001: ${t5[0].toLocaleString('en-GB')} rows in one task`, sub: 'the derby is 62% of the night; the stage waits for it', icon: 'clock', tone: 'consume' },
      ],
    },
  ],
  edges: [{ from: 'w-hash', to: 'w-derby' }],
})

// §9.6 — fixing skew: adaptive execution's skew join, then salting by hand.
const aqe = tasks(s6, 0)
const salted = tasks(s6, 1)

export const procFixSkew: SceneModel = ideFrame({
  tree: tree('dataproc/06-fixing-skew', 'spark/skew.py'),
  editor: { file: 'spark/skew.py', code: skew6, show: [[lineOf(skew6, '# this night is small'), lineOf(skew6, '.config("spark.sql.adaptive.advisoryPartitionSizeInBytes", "256KB")')], [lineOf(skew6, '# Salting:'), lineOf(skew6, 'titles = titles.crossJoin')]], highlight: linesFrom(skew6, 'events = events.withColumn("salt"', 'titles = titles.crossJoin') },
  session: s6,
  keep: ['$ python spark/skew.py --aqe', ['the join\'s stage', '99,024'], '$ python spark/skew.py --salt 4', ['the join\'s stage', '90,808']],
  side: [
    MOCKED,
    bars(aqe, 'aqe', `AQE’s skew join: ${aqe.length} tasks, the derby split`, 'store'),
    bars(salted, 'salt', 'Salted by hand, 4 ways: the derby over 4 tasks', 'ingest'),
  ],
})

// §9.7 — on Dataproc Serverless: the same answer, from Silver.
const batchRatio = s7.split('\n').filter((l) => /^EX-/.test(l)).map((l) => /^(\S+) .* ([\d.]+%)$/.exec(l)!.slice(1))

export const procServerless: SceneModel = ideFrame({
  tree: tree('dataproc/07-serverless', 'spark/qos_job.py', ['spark/qos_job.py', 'infra/modules/dataproc', 'gcp.sh']),
  editor: { file: 'spark/qos_job.py', code: job, show: [[lineOf(job, '# Only these columns'), lineOf(job, '.select("household_id", "exchange_id"))')]], highlight: linesFrom(job, 'events = (spark.read.format("bigquery")', '.select("household_id", "watched_s", "buffer_ms"))') },
  session: s7,
  keep: ['Apply complete', '$ gcloud dataproc batches submit', ['Batch [qos-0001] submitted.', 'Using the default container image'], ['EX-LDN-04', 'EX-LDN-03'], 'Batch [qos-0001] finished.'],
  side: [
    MOCKED,
    {
      type: 'group', id: 'batch', title: 'A batch: a file and its arguments', minH: 420, icon: 'dataproc', tone: 'ingest', children: [
        { type: 'item', id: 'b-submit', title: 'gcloud … batches submit pyspark', sub: 'runtime 3.0 · subnet sn-dataproc · sa-dataproc', icon: 'terminal' },
        { type: 'item', id: 'b-exec', title: 'driver and executors', sub: 'started for this batch, scaled by Dataproc, gone after', icon: 'spark' },
        { type: 'item', id: 'b-read', title: 'Silver + the raw zone', sub: 'BigQuery through the connector; households from GCS', icon: 'bigquery', tone: 'store' },
      ],
    },
    {
      type: 'table', id: 'same', title: 'The batch’s answer: the laptop’s, from Silver', tone: 'store', columns: ['exchange', 'ratio'],
      rows: batchRatio.slice(0, 3).map(([e, r]) => ({ id: `b-${e}`, cells: [e, r], tone: e === 'EX-LDN-04' ? 'consume' as const : undefined })),
    },
  ],
  edges: [
    { from: 'b-submit', to: 'b-exec' },
    { from: 'b-exec', to: 'b-read' },
  ],
})

// §9.8 — writing back: Gold, one partition per night, twice.
const counts = [...s8.matchAll(/^\| 2026-10-31 \| +(\d+) \| +([\d.]+) \|$/gm)].map((m) => m.slice(1))

export const procWriteBack: SceneModel = ideFrame({
  tree: tree('dataproc/08-writing-back', 'spark/qos_job.py', ['warehouse/gold_qos.sql', 'infra/modules/lakehouse']),
  editor: { file: 'spark/qos_job.py', code: job, show: [[lineOf(job, 'if a.write:'), lineOf(job, 'print(f"gold.qos_by_exchange: dt={a.dt} written")')]], highlight: linesFrom(job, '(qos.write.format("bigquery").mode("overwrite")', '.save("gold.qos_by_exchange"))') },
  session: s8,
  keep: ['$ gcloud dataproc batches submit', 'gold.qos_by_exchange: dt=2026-10-31 written', '| 2026-10-31', '$ gcloud dataproc batches submit', 'gold.qos_by_exchange: dt=2026-10-31 written', '| 2026-10-31'],
  side: [
    MOCKED,
    {
      type: 'group', id: 'idem', title: 'Idempotent per night', minH: 480, icon: 'bigquery', tone: 'ingest', children: [
        { type: 'item', id: 'i-batch', title: 'the batch, with --write', sub: 'mode overwrite, partitions DYNAMIC', icon: 'spark' },
        { type: 'item', id: 'i-part', title: 'the 2026-10-31 partition', sub: 'of gold.qos_by_exchange: replaced, and only it', icon: 'bigquery', tone: 'store' },
        { type: 'item', id: 'i-other', title: 'every other night', sub: 'untouched', icon: 'layers', muted: true },
      ],
    },
    {
      type: 'table', id: 'twice', title: 'Run twice, the same Gold', tone: 'store', columns: ['run', 'exchanges', 'worst %'],
      rows: counts.map(([n, p], i) => ({ id: `t-${i}`, cells: [`${i + 1}`, n, p] })),
    },
  ],
  edges: [
    { from: 'i-batch', to: 'i-part' },
  ],
})

export const dataprocScenes: Record<string, SceneModel> = {
  'proc-shapes': procShapes,
  'proc-local': procLocal,
  'proc-connector': procConnector,
  'proc-ratio': procRatio,
  'proc-skew': procSkew,
  'proc-fix-skew': procFixSkew,
  'proc-serverless': procServerless,
  'proc-write-back': procWriteBack,
}
