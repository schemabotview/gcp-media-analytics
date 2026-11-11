import type { SceneModel } from '@graphlearning/graphl-flow'
import { lineOf, linesFrom } from '../ide'
import { ideFrame2 } from '../frame'
import { outputOf } from '../lab'
import { MOCKED, RECORDED } from '../level'
import { stepTree } from '../files'
import lake1 from '../../../spine/lakehouse/01-datasets/project/infra/modules/lakehouse/main.tf?raw'
import s1 from '../../../spine/lakehouse/01-datasets/session.txt?raw'
import lake2 from '../../../spine/lakehouse/02-external-tables/project/infra/modules/lakehouse/main.tf?raw'
import s2 from '../../../spine/lakehouse/02-external-tables/session.txt?raw'
import bronzeSql from '../../../spine/lakehouse/03-bronze/project/warehouse/bronze.sql?raw'
import s3 from '../../../spine/lakehouse/03-bronze/session.txt?raw'
import peaksSql from '../../../spine/lakehouse/04-how-bigquery/project/warehouse/peaks.sql?raw'
import s4 from '../../../spine/lakehouse/04-how-bigquery/session.txt?raw'
import lake5 from '../../../spine/lakehouse/05-partitioning/project/infra/modules/lakehouse/main.tf?raw'
import s5 from '../../../spine/lakehouse/05-partitioning/session.txt?raw'
import g2Sql from '../../../spine/lakehouse/06-g2/project/warehouse/g2.sql?raw'
import s6 from '../../../spine/lakehouse/06-g2/session.txt?raw'
import silverSql from '../../../spine/lakehouse/07-silver/project/warehouse/silver.sql?raw'
import s7 from '../../../spine/lakehouse/07-silver/session.txt?raw'
import scd2Sql from '../../../spine/lakehouse/08-scd2/project/warehouse/scd2.sql?raw'
import s8 from '../../../spine/lakehouse/08-scd2/session.txt?raw'
import g3Sql from '../../../spine/lakehouse/09-g3/project/warehouse/g3.sql?raw'
import s9 from '../../../spine/lakehouse/09-g3/session.txt?raw'

// Course 8 · BigQuery: Bronze and Silver. Every section recorded on GCP: the night's viewing export
// landed in the real raw zone, then judged, cleaned and conformed in BigQuery.
const CLOSED = ['sources', 'infra', 'extract', 'produce', 'consume', 'stream']
const tree = (step: string, active: string, fresh = [active]) =>
  stepTree(step, active, { fresh, closed: CLOSED.filter((c) => !active.startsWith(c)), trim: active.startsWith('infra') ? ['infra', 'infra/modules'] : [] })
const n = (s: string) => Number(s).toLocaleString('en-GB')

/** The data rows of the last bq table printed after `command`: each a list of cells. */
function bqRows(session: string, command: string): string[][] {
  const out = outputOf(session, command).split('\n')
  const head = out.map((l, i) => (/^\| *[a-z_]+ *\|/.test(l) ? i : -1)).filter((i) => i >= 0).pop()!
  return out.slice(head + 2).filter((l) => l.startsWith('|')).map((l) => l.split('|').slice(1, -1).map((c) => c.trim()))
}

// §8.1 — datasets and location: the four layers, in Terraform.
const datasets = bqRows(s1, 'bq ls --format=pretty').map(([d]) => d)

export const lakeDatasets: SceneModel = ideFrame2({
  model: 'A dataset per layer: Bronze, Silver, Gold',
  tree: tree('lakehouse/01-datasets', 'infra/modules/lakehouse/main.tf', ['infra/modules/lakehouse', 'infra/main.tf']),
  editor: { file: 'infra/modules/lakehouse/main.tf', code: lake1, highlight: linesFrom(lake1, 'bronze = ', 'audit  = ') },
  session: s1,
  keep: ['Apply complete', ['$ bq ls --format=pretty', '+-----------+']],
  side: [
    RECORDED,
    {
      type: 'group', id: 'layers', title: 'One project, a dataset per layer', icon: 'gcpproject', tone: 'ingest', children: [
        { type: 'item', id: 'l-bronze', title: 'bronze', sub: 'as delivered, with where it came from', icon: 'bigquery' },
        { type: 'item', id: 'l-silver', title: 'silver', sub: 'one row per real event', icon: 'bigquery' },
        { type: 'item', id: 'l-gold', title: 'gold', sub: 'the answers', icon: 'bigquery', tone: 'store' },
      ],
    },
    {
      type: 'table', id: 'ls', title: 'bq ls: every dataset in europe-west2', tone: 'store', columns: ['dataset', 'holds'],
      rows: datasets.map((d) => ({ id: `d-${d}`, cells: [d, { bronze: 'Bronze', silver: 'Silver', gold: 'Gold', audit: 'every gate’s verdict', live: 'the stream (Course 7)' }[d] ?? ''], tone: d === 'live' || d === 'audit' ? undefined : 'store' as const })),
    },
  ],
  edges: [
    { from: 'l-bronze', to: 'l-silver', label: 'judged, deduped' },
    { from: 'l-silver', to: 'l-gold', label: 'asked' },
  ],
})

// §8.2 — external tables: the raw zone read in place.
const delivered = bqRows(s2, '$Q < warehouse/delivered.sql')
const deliveredTotal = delivered.reduce((t, r) => t + Number(r[2]), 0)

export const lakeExternal: SceneModel = ideFrame2({
  model: 'An external table: a schema over files',
  tree: tree('lakehouse/02-external-tables', 'infra/modules/lakehouse/main.tf', ['infra/modules/lakehouse', 'sources/viewing', 'warehouse/delivered.sql']),
  editor: { file: 'infra/modules/lakehouse/main.tf', code: lake2, show: [[lineOf(lake2, '# The raw zone, read in place'), lineOf(lake2, 'source_uri_prefix') + 4]], highlight: linesFrom(lake2, 'source_uris', 'source_uri_prefix') },
  session: s2,
  keep: ['$ gcloud storage cp', 'Apply complete', '$ $Q < warehouse/delivered.sql', ['| 2026-10-31 | STB', '| 2026-10-31 | iOS']],
  side: [
    RECORDED,
    {
      type: 'group', id: 'read', title: 'Schema on read: no copy, no load', icon: 'gcs', tone: 'ingest', children: [
        { type: 'item', id: 'r-files', title: 'source=viewing/dt=2026-10-31/', sub: 'four JSON-lines parts', icon: 'gcs' },
        { type: 'item', id: 'r-ext', title: 'bronze.viewing_raw', sub: 'an external table: a schema over the files', icon: 'bigquery' },
        { type: 'item', id: 'r-query', title: 'a query', sub: 'reads the files as it runs', icon: 'search', tone: 'store' },
      ],
    },
    {
      type: 'table', id: 'platforms', title: `${n(String(deliveredTotal))} rows delivered, each client naming itself`, tone: 'store', columns: ['platform', 'events'],
      rows: delivered.map(([, p, e]) => ({ id: `p-${p}`, cells: [p, n(e)] })),
    },
  ],
  edges: [
    { from: 'r-files', to: 'r-ext' },
    { from: 'r-ext', to: 'r-query' },
  ],
})

// §8.3 — Bronze: append as delivered, with provenance.
const affected = /Number of affected rows: (\d+)/.exec(s3)![1]
const files = bqRows(s3, '$Q --parameter=dt:DATE:2026-10-31 < warehouse/bronze.sql')

export const lakeBronze: SceneModel = ideFrame2({
  model: 'Bronze: as delivered, with where it came from',
  tree: tree('lakehouse/03-bronze', 'warehouse/bronze.sql', ['warehouse/bronze.sql', 'infra/modules/lakehouse']),
  editor: { file: 'warehouse/bronze.sql', code: bronzeSql, highlight: linesFrom(bronzeSql, 'INSERT INTO', 'WHERE dt = @dt;') },
  session: s3,
  keep: ['Apply complete', 'Number of affected rows', ['| part-00000', '| part-00003']],
  side: [
    RECORDED,
    {
      type: 'group', id: 'prov', title: 'Every row keeps where it came from', icon: 'bigquery', tone: 'ingest', children: [
        { type: 'item', id: 'p-ext', title: 'bronze.viewing_raw', sub: 'the files, read in place', icon: 'gcs' },
        { type: 'item', id: 'p-insert', title: 'INSERT … SELECT', sub: '+ _src_file (its object), _ingest_ts (now)', icon: 'workflow' },
        { type: 'item', id: 'p-bronze', title: 'bronze.viewing_events', sub: `${n(affected)} rows: retries and bad rows kept`, icon: 'bigquery', tone: 'store' },
      ],
    },
    {
      type: 'table', id: 'files', title: 'Rows per delivered file', tone: 'store', columns: ['_src_file', 'rows'],
      rows: files.map(([f, e]) => ({ id: `f-${f}`, cells: [f, n(e)] })),
    },
  ],
  edges: [
    { from: 'p-ext', to: 'p-insert' },
    { from: 'p-insert', to: 'p-bronze' },
  ],
})

// §8.4 — ◆ how BigQuery is built: one query's stages, from its own plan.
const stages = s4.split('\n').filter((l) => /^S\d\d: /.test(l)).map((l) => /^(S\d\d): (\S+)\s+([\d,]+)\s+([\d,]+)\s+([\d,]+)/.exec(l)!.slice(1))
const cost = /^([\d,]+) bytes read, ([\d,]+) slot ms/m.exec(s4)!

export const lakeHow: SceneModel = ideFrame2({
  model: 'Storage and compute, apart',
  tree: tree('lakehouse/04-how-bigquery', 'warehouse/peaks.sql', ['warehouse/peaks.sql', 'warehouse/explain.py', 'requirements.txt']),
  editor: { file: 'warehouse/peaks.sql', code: peaksSql },
  session: s4,
  keep: ['$ python warehouse/explain.py', 'SUN-SPORTS-1 18:41', ['bytes read', 'S04: Output']],
  side: [
    RECORDED,
    {
      type: 'group', id: 'arch', title: 'Storage and compute, apart', icon: 'bigquery', tone: 'ingest', children: [
        { type: 'item', id: 'a-store', title: 'storage', sub: 'Colossus: only the columns asked for', icon: 'layers' },
        { type: 'item', id: 'a-net', title: 'the network', sub: 'Jupiter: petabits between the two', icon: 'network' },
        { type: 'item', id: 'a-slots', title: 'compute: slots', sub: `${cost[2]} slot ms for ${cost[1]} bytes`, icon: 'zap', tone: 'store' },
      ],
    },
    {
      type: 'table', id: 'stages', title: 'This query’s plan, stage by stage', tone: 'store', columns: ['stage', 'rows in', 'rows out'],
      rows: stages.map(([s, name, r, w]) => ({ id: `st-${s}`, cells: [`${s} ${name}`, r, w] })),
    },
  ],
  edges: [
    { from: 'a-store', to: 'a-net' },
    { from: 'a-net', to: 'a-slots' },
  ],
})

// §8.5 — partitioning and clustering: the same query, before and after.
const measured = [...s5.matchAll(/^read +([\d,]+) bytes/gm)].map((m) => m[1])
const estimated = [...s5.matchAll(/^estimated +([\d,]+) bytes/gm)].map((m) => m[1])
const peakLine = s5.split('\n').find((l) => /^2026-10-31 \d\d:\d\d:\d\d\+00:00 \d+$/.test(l))!.split(' ')

export const lakePartitions: SceneModel = ideFrame2({
  model: 'Partition and cluster: read only what the filter needs',
  tree: tree('lakehouse/05-partitioning', 'infra/modules/lakehouse/main.tf', ['infra/modules/lakehouse', 'warehouse/bytes.py', 'warehouse/derby_minutes.sql']),
  editor: { file: 'infra/modules/lakehouse/main.tf', code: lake5, show: [[lineOf(lake5, '# Bronze: every delivered row'), lineOf(lake5, 'clustering = ')]], highlight: linesFrom(lake5, 'time_partitioning {', 'clustering = ') },
  session: s5,
  keep: ['$ python warehouse/bytes.py', 'read        12,200,241', 'must be replaced', 'Apply complete', '$ python warehouse/bytes.py', 'read         6,447,874'],
  side: [
    RECORDED,
    {
      type: 'group', id: 'parts', title: 'An hour per partition, sorted inside', icon: 'layers', tone: 'ingest', dir: 'row', children: [
        { type: 'item', id: 'h-17', title: '17:00 – 18:00', sub: 'skipped', icon: 'layers', muted: true, stack: true },
        { type: 'item', id: 'h-18', title: '18:00 – 20:00', sub: 'read: SUN-SPORTS-1’s blocks', icon: 'layers', tone: 'store', stack: true },
        { type: 'item', id: 'h-20', title: '20:00 – 24:00', sub: 'skipped', icon: 'layers', muted: true, stack: true },
      ],
    },
    {
      type: 'table', id: 'bytes', title: `The second half’s busiest minute: ${peakLine[1].slice(0, 5)}, ${peakLine[2]} households`, tone: 'store', columns: ['Bronze', 'estimated', 'read'],
      rows: [
        { id: 'b-flat', cells: ['one block', estimated[0], measured[0]] },
        { id: 'b-part', cells: ['by hour, by channel', estimated[1], measured[1]], tone: 'ingest' },
      ],
    },
  ],
  edges: [{ from: 'h-18', to: 'bytes' }],
})

// §8.6 — G2: rows Silver cannot trust, set aside with a reason.
const g2 = bqRows(s6, '$Q --parameter=dt:DATE:2026-10-31 < warehouse/g2.sql')

export const lakeG2: SceneModel = ideFrame2({
  model: 'G2: judge each row, stop nothing',
  tree: tree('lakehouse/06-g2', 'warehouse/g2.sql', ['warehouse/g2.sql', 'infra/modules/lakehouse']),
  editor: { file: 'warehouse/g2.sql', code: g2Sql, show: [[lineOf(g2Sql, 'CREATE TEMP TABLE judged'), lineOf(g2Sql, 'FROM judged;')]], highlight: linesFrom(g2Sql, 'CASE WHEN v.event_id IS NULL', 'END AS reason') },
  session: s6,
  keep: ['Apply complete', '$ $Q --parameter', ['+---', '+---']],
  side: [
    RECORDED,
    {
      type: 'group', id: 'split', title: 'G2: judge each row, stop nothing', icon: 'filter', tone: 'ingest', children: [
        { type: 'item', id: 'g-bronze', title: 'bronze.viewing_events', sub: 'every delivered row', icon: 'bigquery' },
        { type: 'item', id: 'g-ok', title: 'trusted', sub: 'on to Silver', icon: 'check', tone: 'store' },
        { type: 'item', id: 'g-q', title: 'bronze.viewing_quarantine', sub: 'kept, with its reason', icon: 'shield', tone: 'consume' },
      ],
    },
    {
      type: 'table', id: 'why', title: 'Quarantined, and why', tone: 'consume', columns: ['reason', 'rows', 'a title'],
      rows: g2.map(([r, c, t]) => ({ id: `q-${r.split(' ')[0]}`, cells: [r, c, t === 'NULL' ? '—' : t] })),
    },
  ],
  edges: [
    { from: 'g-bronze', to: 'g-ok' },
    { from: 'g-bronze', to: 'g-q' },
  ],
})

// §8.7 — Silver: one row per real event, in Sun's names.
const counts = bqRows(s7, '$Q --parameter=dt:DATE:2026-10-31 < warehouse/silver.sql')[0]
const silverPeak = bqRows(s7, '$Q --parameter=dt:DATE:2026-10-31 < warehouse/silver_peak.sql')

export const lakeSilver: SceneModel = ideFrame2({
  model: 'Silver: one row per real event',
  tree: tree('lakehouse/07-silver', 'warehouse/silver.sql', ['warehouse/silver.sql', 'warehouse/silver_peak.sql', 'infra/modules/lakehouse']),
  editor: { file: 'warehouse/silver.sql', code: silverSql, show: [[lineOf(silverSql, 'INSERT INTO'), lineOf(silverSql, 'ORDER BY _ingest_ts, _src_file) = 1;')]], highlight: linesFrom(silverSql, 'QUALIFY ROW_NUMBER()', 'ORDER BY _ingest_ts, _src_file) = 1;') },
  session: s7,
  keep: ['Apply complete', ['| bronze_rows', '+-----'], ['$ $Q --parameter=dt:DATE:2026-10-31 < warehouse/silver_peak.sql', '| 18:41']],
  side: [
    MOCKED,
    {
      type: 'group', id: 'once', title: 'Many deliveries → one event', icon: 'filter', tone: 'ingest', children: [
        { type: 'item', id: 'o-bronze', title: `Bronze: ${n(counts[0])} rows`, sub: `retries included; ${counts[1]} quarantined by G2`, icon: 'bigquery' },
        { type: 'item', id: 'o-silver', title: `Silver: ${n(counts[2])} events`, sub: 'the first copy of each event_id', icon: 'bigquery', tone: 'store' },
      ],
    },
    {
      type: 'table', id: 'peak', title: 'The derby’s peak, from Silver', tone: 'store', columns: ['minute', 'households'],
      rows: silverPeak.map(([m, h]) => ({ id: `k-${m}`, cells: [m, h], tone: m === '18:41' ? 'ingest' as const : undefined })),
    },
  ],
  edges: [
    { from: 'o-bronze', to: 'o-silver', label: 'QUALIFY: one per event_id' },
  ],
})

// §8.8 — SCD2 subscribers: the derby-day upgrades merged in.
const merged = [...s8.matchAll(/^\| (2026-10-3\d) \| +(\d+) \| +(\d+) \|$/gm)].map((m) => m.slice(1))
const history = bqRows(s8, '$Q --parameter=hh::HH-10123 < warehouse/history.sql')

export const lakeScd2: SceneModel = ideFrame2({
  model: 'SCD type 2: every version, one current',
  tree: tree('lakehouse/08-scd2', 'warehouse/scd2.sql', ['warehouse/scd2.sql', 'warehouse/history.sql', 'infra/modules/lakehouse']),
  editor: { file: 'warehouse/scd2.sql', code: scd2Sql, show: [[lineOf(scd2Sql, 'MERGE silver.dim_subscriber'), lineOf(scd2Sql, 'VALUES (n.household_id')]], highlight: linesFrom(scd2Sql, 'WHEN MATCHED AND', 'VALUES (n.household_id') },
  session: s8,
  keep: ['$ bq -q load', 'Number of affected rows: 74', '| 2026-10-31 |', ['| package_id', '| P-SPT']],
  side: [
    MOCKED,
    {
      type: 'group', id: 'merge', bare: true, children: [
        { type: 'item', id: 'm-old', title: 'P-ESS, was current', sub: 'MERGE closes it: valid_to = the upgrade', icon: 'user', muted: true },
        { type: 'item', id: 'm-new', title: 'P-SPT, now current', sub: 'inserted: valid_from = the upgrade', icon: 'user', tone: 'store' },
        { type: 'item', id: 'm-ask', title: 'any night’s report, joined by date', sub: 'valid_from ≤ night < valid_to', icon: 'search' },
      ],
    },
    {
      type: 'table', id: 'hh', title: 'HH-10123: two versions, one current', tone: 'store', columns: ['package', 'valid_from', 'valid_to', 'derby day'],
      rows: history.map(([p, f, t, , d]) => ({ id: `h-${p}`, cells: [p, f, t === 'NULL' ? '—' : t, d === 'true' ? 'yes' : 'no'], tone: d === 'true' ? 'ingest' as const : undefined })),
    },
    {
      type: 'table', id: 'nights', title: 'The dimension after each night’s MERGE', tone: 'store', columns: ['night', 'current rows', 'closed rows'],
      rows: merged.map(([d, c, x]) => ({ id: `m-${d}`, cells: [d, n(c), x] })),
    },
  ],
  edges: [
    { from: 'm-old', to: 'm-new' },
    { from: 'm-new', to: 'm-ask' },
    { from: 'm-ask', to: 'hh' },
  ],
})

// §8.9 — G3: EPG coverage, and the minutes an inner join loses.
const coverage = bqRows(s9, '$Q --parameter=dt:DATE:2026-10-31 < warehouse/g3.sql')
const gates = bqRows(s9, '$Q --parameter=dt:DATE:2026-10-31 < warehouse/gates.sql')
const gap = coverage.find(([c, , , from]) => c !== 'NULL' && from !== 'NULL')!

export const lakeG3: SceneModel = ideFrame2({
  model: 'G3: an inner join that loses minutes',
  tree: tree('lakehouse/09-g3', 'warehouse/g3.sql', ['warehouse/g3.sql', 'warehouse/epg.py', 'warehouse/gates.sql', 'infra/modules/lakehouse']),
  editor: { file: 'warehouse/g3.sql', code: g3Sql, show: [[lineOf(g3Sql, 'CREATE TEMP TABLE slotted'), lineOf(g3Sql, 'FROM slotted;')]], highlight: linesFrom(g3Sql, 'LEFT JOIN silver.epg_slots', 'AND l.minute >= s.slot_start') },
  session: s9,
  keep: ['$ python warehouse/epg.py', ['| SUN-MOVIES-2', '| NULL'], ['$ $Q --parameter=dt:DATE:2026-10-31 < warehouse/gates.sql', '| G3']],
  side: [
    RECORDED,
    {
      type: 'group', id: 'gap', bare: true, dir: 'row', children: [
        { type: 'item', id: 'x-watch', title: `${gap[0]} from ${gap[3]}: no slot`, sub: `${n(gap[1])} box-minutes watched`, icon: 'screen', stack: true },
        { type: 'item', id: 'x-lost', title: 'an inner join drops it', sub: `${n(String(Number(gap[1]) - Number(gap[2])))} gone, silently`, icon: 'filter', tone: 'consume', stack: true },
      ],
    },
    {
      type: 'table', id: 'cov', title: 'Box-minutes per channel, and what an inner join keeps', tone: 'store', columns: ['channel', 'watched', 'inner join'],
      rows: coverage.map(([c, w, k]) => ({ id: `c-${c.replace(/\W/g, '')}`, cells: [c === 'NULL' ? 'all channels' : c, n(w), n(k)], tone: c === gap[0] ? 'consume' as const : undefined })),
    },
    {
      type: 'table', id: 'gates', title: 'audit.gate_results, dt=2026-10-31', tone: 'store', columns: ['gate', 'passed', 'detail'],
      rows: gates.map(([g, p, d]) => ({ id: `gt-${g}`, cells: [g, p, d.replace(' channel minutes have no EPG slot', ' min without a slot').replace(' rows quarantined', ' quarantined')], tone: p === 'false' ? 'consume' as const : undefined })),
    },
  ],
  edges: [
    { from: 'x-watch', to: 'x-lost' },
    { from: 'x-lost', to: 'cov' },
  ],
})

export const lakehouseScenes: Record<string, SceneModel> = {
  'lake-datasets': lakeDatasets,
  'lake-external': lakeExternal,
  'lake-bronze': lakeBronze,
  'lake-how': lakeHow,
  'lake-partitions': lakePartitions,
  'lake-g2': lakeG2,
  'lake-silver': lakeSilver,
  'lake-scd2': lakeScd2,
  'lake-g3': lakeG3,
}
