import type { SceneModel } from '@graphlearning/graphl-flow'
import { lineOf, linesFrom } from '../ide'
import { ideFrame2 } from '../frame'
import { MOCKED, level } from '../level'
import { stepTree } from '../files'
import dag2 from '../../../spine/orchestrate/02-the-dag/project/dags/viewing_daily.py?raw'
import s2 from '../../../spine/orchestrate/02-the-dag/session.txt?raw'
import s3 from '../../../spine/orchestrate/03-waiting/session.txt?raw'
import dag4 from '../../../spine/orchestrate/04-retries/project/dags/viewing_daily.py?raw'
import s4 from '../../../spine/orchestrate/04-retries/session.txt?raw'
import epg5 from '../../../spine/orchestrate/05-failed-night/project/warehouse/epg.py?raw'
import s5 from '../../../spine/orchestrate/05-failed-night/session.txt?raw'
import bronze6 from '../../../spine/orchestrate/06-backfill/project/warehouse/bronze.sql?raw'
import s6 from '../../../spine/orchestrate/06-backfill/session.txt?raw'
import composer from '../../../spine/orchestrate/07-composer/project/infra/modules/composer/main.tf?raw'
import s7 from '../../../spine/orchestrate/07-composer/session.txt?raw'

// Course 11 · Every night, and the night it fails. MOCKED (the owner's call, 2026-11-03): Airflow
// 2.10.5 on Priya's laptop driving the BigQuery and Dataproc work of Courses 8–10; terminals authored.
const CLOSED = ['sources', 'infra', 'extract', 'produce', 'consume', 'stream', 'spark', 'airflow', 'warehouse']
const tree = (step: string, active: string, fresh = [active]) =>
  stepTree(step, active, { fresh, closed: CLOSED.filter((c) => !active.startsWith(c)), trim: ['warehouse', ...(active.startsWith('infra') ? ['infra', 'infra/modules'] : [])] })

/** The DAG's tasks in order, as `airflow tasks list --tree` printed them. */
const tasks = [...s2.replace(/\n/g, '').matchAll(/<Task\((\w+)\): (\w+)>/g)].map((m) => m.slice(1))

// §11.1 — ◆ Airflow's model
export const orchModel: SceneModel = {
  title: 'Airflow’s model',
  sub: 'a DAG of tasks, each an operator; a scheduler that decides what may run; workers that run it',
  nodes: [
    {
      type: 'group', id: 'top', bare: true, dir: 'row', children: [
        {
          type: 'group', id: 'dag', title: 'A DAG: one night’s work', icon: 'airflow', tone: 'ingest', children: [
            { type: 'item', id: 'd-sensor', title: 'a sensor', sub: 'waits for something outside: the night’s _SUCCESS', icon: 'clock' },
            { type: 'item', id: 'd-op', title: 'operators', sub: 'a BigQuery job, a Dataproc batch, a shell command', icon: 'workflow' },
            { type: 'item', id: 'd-gate', title: 'a check', sub: 'a task that fails when a gate failed', icon: 'check', tone: 'store' },
          ],
        },
        {
          type: 'group', id: 'run', title: 'Who runs it', icon: 'server', tone: 'store', children: [
            { type: 'item', id: 'r-sched', title: 'the scheduler', sub: 'reads the DAG folder; makes a run per night; queues tasks whose upstreams succeeded', icon: 'clock' },
            { type: 'item', id: 'r-workers', title: 'workers', sub: 'run a task, report its state: success, up_for_retry, failed', icon: 'cpu' },
            { type: 'item', id: 'r-db', title: 'the metadata database', sub: 'every run, every try, every state', icon: 'postgresql' },
          ],
        },
      ],
    },
    level('doc-cited', 'Apache Airflow’s core concepts; Cloud Composer’s overview'),
  ],
  edges: [
    { from: 'd-sensor', to: 'd-op' },
    { from: 'd-op', to: 'd-gate' },
    { from: 'r-sched', to: 'r-workers' },
    { from: 'r-workers', to: 'r-db' },
  ],
}

// §11.2 — the DAG
export const orchDag: SceneModel = ideFrame2({
  model: 'A DAG: one night, in order',
  tree: tree('orchestrate/02-the-dag', 'dags/viewing_daily.py', ['dags', 'airflow', 'warehouse/bronze.sql', 'warehouse/g2.sql', 'warehouse/silver.sql']),
  editor: { file: 'dags/viewing_daily.py', code: dag2, show: [[lineOf(dag2, 'def sql(task_id: str)'), lineOf(dag2, '"parameterValue": {"value": "{{ ds }}"}}]}})')], [lineOf(dag2, '# the guide is JSON'), lineOf(dag2, 'dag.get_task("gold_content")')]], highlight: linesFrom(dag2, '(landed >> sql("bronze")', 'dag.get_task("gold_content")') },
  session: s2,
  keep: ['$ airflow variables import', 'No data found', ['$ airflow tasks list viewing_daily --tree', '<Task(BigQueryInsertJobOperator): g2>'], '<Task(DataprocCreateBatchOperator)'],
  side: [
    MOCKED,
    {
      type: 'table', id: 'order', title: `viewing_daily: ${tasks.length} tasks, in order`, tone: 'store', columns: ['task', 'operator'],
      rows: tasks.map(([op, t]) => ({ id: `t-${t}`, cells: [t, op.replace('Operator', '').replace('ObjectExistence', '')], tone: t.startsWith('gate') ? 'ingest' as const : undefined })),
    },
    {
      type: 'group', id: 'flow', title: 'One night, in four moves', icon: 'airflow', tone: 'ingest', dir: 'row', children: [
        { type: 'item', id: 'f-wait', title: 'wait', sub: '_SUCCESS', icon: 'clock', stack: true },
        { type: 'item', id: 'f-load', title: 'load', sub: 'layers', icon: 'bigquery', stack: true },
        { type: 'item', id: 'f-gate', title: 'gate', sub: 'G2–G4', icon: 'shield', stack: true },
        { type: 'item', id: 'f-answer', title: 'answer', sub: 'Gold', icon: 'check', tone: 'store', stack: true },
      ],
    },
  ],
  edges: [
    { from: 'f-wait', to: 'f-load' },
    { from: 'f-load', to: 'f-gate' },
    { from: 'f-gate', to: 'f-answer' },
  ],
})

// §11.3 — waiting for the batch: the sensor
export const orchSensor: SceneModel = ideFrame2({
  model: 'A sensor waits for _SUCCESS',
  tree: tree('orchestrate/03-waiting', 'dags/viewing_daily.py', []),
  editor: { file: 'dags/viewing_daily.py', code: dag2, show: [[lineOf(dag2, 'landed = GCSObjectExistenceSensor('), lineOf(dag2, 'mode="reschedule"')]], highlight: linesFrom(dag2, 'object="source=viewing/dt={{ ds }}/_SUCCESS",', 'mode="reschedule"') },
  session: s3,
  keep: ['$ airflow tasks test', 'Rescheduling task', '$ gcloud storage cp', '$ airflow tasks test', 'Success criteria met', 'Marking task as SUCCESS'],
  side: [
    MOCKED,
    {
      type: 'group', id: 'poke', title: 'Sensor → poke → go', icon: 'clock', tone: 'ingest', children: [
        { type: 'item', id: 'p-poke', title: 'is _SUCCESS there?', sub: 'every 5 minutes, for up to 6 hours', icon: 'search' },
        { type: 'item', id: 'p-wait', title: 'not yet: UP_FOR_RESCHEDULE', sub: 'the worker slot is given back', icon: 'clock', muted: true },
        { type: 'item', id: 'p-go', title: 'there: SUCCESS', sub: 'Bronze may load', icon: 'check', tone: 'store' },
      ],
    },
    {
      type: 'table', id: 'pokes', title: 'Two tests of the sensor, for 2026-10-31', tone: 'store', columns: ['test', 'the night’s folder', 'state'],
      rows: [
        { id: 'k-1', cells: ['1', 'four parts, no _SUCCESS', 'up_for_reschedule'], tone: 'consume' },
        { id: 'k-2', cells: ['2', 'four parts + _SUCCESS', 'success'], tone: 'ingest' },
      ],
    },
  ],
  edges: [
    { from: 'p-poke', to: 'p-wait', label: 'absent' },
    { from: 'p-wait', to: 'p-go', label: '_SUCCESS written' },
  ],
})

// §11.4 — retries and SLAs
const tries = (t: string) => (s4.match(new RegExp(`starting task_id=${t}$`, 'gm')) ?? []).length
const failedTasks = [...s4.replace(/\n/g, '').matchAll(/Marking task as UPSTREAM_FAILED\. task_id=(\w+?)(?=\[|$)/g)].map((m) => m[1])

export const orchRetries: SceneModel = ideFrame2({
  model: 'A blip is retried; a fact is not',
  tree: tree('orchestrate/04-retries', 'dags/viewing_daily.py'),
  editor: { file: 'dags/viewing_daily.py', code: dag4, show: [[lineOf(dag4, 'default_args={'), lineOf(dag4, '"sla": timedelta(hours=4)}) as dag:')]], highlight: linesFrom(dag4, '"retries": 2, "retry_delay"', '"sla": timedelta(hours=4)}) as dag:') },
  session: s4,
  keep: ['ServiceUnavailable', 'UP_FOR_RETRY. task_id=bronze', 'SUCCESS. task_id=bronze', 'FAILED. task_id=gate_g3', 'Sending email', 'state: failed'],
  side: [
    MOCKED,
    {
      type: 'group', id: 'why', title: 'A blip is retried; a fact is not', icon: 'clock', tone: 'ingest', children: [
        { type: 'item', id: 'w-503', title: '503 from BigQuery', sub: 'gone a minute later: try 2 succeeds', icon: 'zap' },
        { type: 'item', id: 'w-g3', title: 'G3 false', sub: 'the same every try: fails after 3, emails', icon: 'shield', tone: 'consume' },
      ],
    },
    {
      type: 'table', id: 'states', title: 'The run, task by task', tone: 'store', columns: ['task', 'tries', 'state'],
      rows: [
        { id: 's-bronze', cells: ['bronze', String(tries('bronze')), 'success, after a 503'] },
        { id: 's-g3', cells: ['g3', String(tries('g3')), 'success: the query ran'] },
        { id: 's-gate', cells: ['gate_g3', String(tries('gate_g3')), 'failed: G3 is false'], tone: 'consume' },
        ...failedTasks.map((t) => ({ id: `s-${t}`, cells: [t, '0', 'upstream_failed'], tone: 'consume' as const })),
      ],
    },
  ],
  edges: [{ from: 'w-503', to: 'w-g3', dashed: true }],
})

// §11.5 — ⑂ a failed night, fixed: re-delivered EPG, cleared, green
const gates = s5.split('\n').filter((l) => /^\| G\d/.test(l)).map((l) => l.split('|').slice(1, -1).map((c) => c.trim()))

export const orchFailed: SceneModel = ideFrame2({
  model: 'A failed night: red, fixed, green',
  tree: tree('orchestrate/05-failed-night', 'warehouse/epg.py'),
  editor: { file: 'warehouse/epg.py', code: epg5, show: [[lineOf(epg5, 'raw = storage.Client()'), lineOf(epg5, 'job.result()')]], highlight: linesFrom(epg5, 'latest = sorted(raw.list_blobs(', 'key=lambda b: b.name)[-1]') },
  session: s5,
  keep: ['$ gcloud storage cp $E', '$ airflow tasks clear', '$ airflow dags test', 'state: success', '| G3   | true'],
  side: [
    MOCKED,
    {
      type: 'table', id: 'gates', title: 'audit.gate_results for the night, every verdict kept', tone: 'store', columns: ['gate', 'passed', 'detail'],
      rows: gates.map(([g, p, d], i) => ({ id: `g-${i}`, cells: [g, p, d], tone: p === 'false' ? 'consume' as const : g === 'G3' ? 'ingest' as const : undefined })),
    },
    {
      type: 'group', id: 'fix', title: 'Red, then green', icon: 'workflow', tone: 'ingest', children: [
        { type: 'item', id: 'f-red', title: 'gate_g3 failed', sub: 'SUN-MOVIES-2, 20:00–22:00: no slot', icon: 'shield', tone: 'consume' },
        { type: 'item', id: 'f-fix', title: 'the vendor re-delivers: .r2.json', sub: 'a new object; the old one kept', icon: 'gcs' },
        { type: 'item', id: 'f-green', title: 'clear epg and downstream', sub: 'only those re-run: green', icon: 'check', tone: 'store' },
      ],
    },
  ],
  edges: [
    { from: 'f-red', to: 'f-fix' },
    { from: 'f-fix', to: 'f-green' },
  ],
})

// §11.6 — backfill, idempotently
const nights = s6.split('\n').filter((l) => /^\| +401958/.test(l)).map((l) => l.split('|').slice(1, -1).map((c) => Number(c.trim()).toLocaleString('en-GB')))

export const orchBackfill: SceneModel = ideFrame2({
  model: 'A backfill: a night replaced, never doubled',
  tree: tree('orchestrate/06-backfill', 'warehouse/bronze.sql', ['warehouse/night.sql']),
  editor: { file: 'warehouse/bronze.sql', code: bronze6, highlight: [lineOf(bronze6, 'DELETE FROM bronze.viewing_events WHERE dt = @dt;')] },
  session: s6,
  keep: ['$ airflow dags backfill', 'Backfill done', '| 401958', '$ airflow dags backfill', 'Backfill done', '| 401958'],
  side: [
    MOCKED,
    {
      type: 'group', id: 'idem', title: 'dt is the logical date; a night is replaced', icon: 'layers', tone: 'ingest', children: [
        { type: 'item', id: 'i-delete', title: 'DELETE … WHERE dt = @dt', sub: 'every layer: the night goes', icon: 'workflow' },
        { type: 'item', id: 'i-insert', title: 'INSERT the night again', sub: 'from the same files: the same rows', icon: 'bigquery' },
        { type: 'item', id: 'i-same', title: 'a rerun changes nothing', sub: 'so a backfill can never double a night', icon: 'check', tone: 'store' },
      ],
    },
    {
      type: 'table', id: 'twice', title: 'The night through every layer, run twice', tone: 'store', columns: ['run', 'bronze', 'silver', 'gold min', 'exchanges'],
      rows: nights.map((r, i) => ({ id: `n-${i}`, cells: [String(i + 1), r[0], r[2], r[3], r[4]] })),
    },
  ],
  edges: [
    { from: 'i-delete', to: 'i-insert' },
    { from: 'i-insert', to: 'i-same' },
  ],
})

// §11.7 — Composer: planned, never applied
const plan = /^Plan: (.+)$/m.exec(s7)![1]

export const orchComposer: SceneModel = ideFrame2({
  model: 'Composer: the same DAG, Airflow run by Google',
  tree: tree('orchestrate/07-composer', 'infra/modules/composer/main.tf', ['infra/modules/composer', 'infra/main.tf']),
  editor: { file: 'infra/modules/composer/main.tf', code: composer, show: [[1, 3], [lineOf(composer, 'resource "google_composer_environment" "media"'), lineOf(composer, 'depends_on')]], highlight: linesFrom(composer, 'image_version = ', 'environment_size = ') },
  session: s7,
  keep: ['$ terraform plan', 'google_composer_environment.media will be created', 'image_version', 'Plan:'],
  side: [
    MOCKED,
    {
      type: 'group', id: 'managed', title: 'Managed Airflow: what Google runs', icon: 'composer', tone: 'ingest', children: [
        { type: 'item', id: 'm-dags', title: 'the same dags/ folder', sub: 'synced to the environment’s bucket', icon: 'file' },
        { type: 'item', id: 'm-env', title: 'Composer 3, small', sub: 'scheduler, workers, web server, database', icon: 'composer' },
        { type: 'item', id: 'm-sa', title: 'sa-airflow', sub: 'the DAG’s identity on Google Cloud', icon: 'gcpiam', tone: 'store' },
      ],
    },
    { type: 'item', id: 'plan', icon: 'terraform', tone: 'consume', title: `terraform plan: ${plan}`, sub: 'it bills every hour it exists: planned, never applied' },
  ],
  edges: [
    { from: 'm-dags', to: 'm-env' },
    { from: 'm-env', to: 'm-sa' },
  ],
})

// §11.8 — ◆ three kinds of progress
export const orchProgress: SceneModel = {
  title: 'Three kinds of progress',
  sub: 'what each lane remembers, so that a restart picks up where it stopped — and nothing is counted twice',
  nodes: [
    {
      type: 'group', id: 'top', bare: true, dir: 'row', children: [
        {
          type: 'group', id: 'ack', title: 'Pub/Sub: the ack', icon: 'pubsub', tone: 'ingest', children: [
            { type: 'item', id: 'a-msg', title: 'unacked messages stay', sub: 'a reader that dies is sent them again (§6.4)', icon: 'pubsub' },
            { type: 'item', id: 'a-dup', title: 'so a restart may repeat', sub: 'dedupe by event_id (§7.6, §8.7)', icon: 'filter', tone: 'store' },
          ],
        },
        {
          type: 'group', id: 'wm', title: 'Dataflow: the watermark', icon: 'dataflow', tone: 'ingest', children: [
            { type: 'item', id: 'w-state', title: 'windows and their state', sub: 'kept by the service; a drain closes them (§7.9)', icon: 'clock' },
            { type: 'item', id: 'w-late', title: 'late data, until allowed lateness', sub: 'then dropped, by design (§7.5)', icon: 'timer', tone: 'store' },
          ],
        },
        {
          type: 'group', id: 'part', title: 'The batch: the partition', icon: 'bigquery', tone: 'ingest', children: [
            { type: 'item', id: 'p-night', title: 'a night is a dt', sub: '_SUCCESS sealed it (§5.6); the DAG’s run is that night', icon: 'gcs' },
            { type: 'item', id: 'p-again', title: 'rerun = replace the night', sub: 'never append twice (§11.6)', icon: 'check', tone: 'store' },
          ],
        },
      ],
    },
    level('model', 'a summary of Courses 6–11: each claim cites the section that showed it'),
  ],
  edges: [
    { from: 'a-msg', to: 'a-dup' },
    { from: 'w-state', to: 'w-late' },
    { from: 'p-night', to: 'p-again' },
  ],
}

export const orchestrateScenes: Record<string, SceneModel> = {
  'orch-model': orchModel,
  'orch-dag': orchDag,
  'orch-sensor': orchSensor,
  'orch-retries': orchRetries,
  'orch-failed': orchFailed,
  'orch-backfill': orchBackfill,
  'orch-composer': orchComposer,
  'orch-progress': orchProgress,
}
