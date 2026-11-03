import type { SceneModel } from '@graphlearning/graphl-flow'
import { ideFrame, lineOf, linesFrom } from '../ide'
import { MOCKED, level } from '../level'
import { stepTree } from '../files'
import gold1 from '../../../spine/serve/01-content-performance/project/warehouse/gold_content.sql?raw'
import s1 from '../../../spine/serve/01-content-performance/session.txt?raw'
import uniq from '../../../spine/serve/02-unique-households/project/warehouse/households.sql?raw'
import s2 from '../../../spine/serve/02-unique-households/session.txt?raw'
import gold3 from '../../../spine/serve/03-g4/project/warehouse/gold_content.sql?raw'
import s3 from '../../../spine/serve/03-g4/session.txt?raw'
import lake4 from '../../../spine/serve/04-query-cost/project/infra/modules/lakehouse/main.tf?raw'
import s4 from '../../../spine/serve/04-query-cost/session.txt?raw'
import lake5 from '../../../spine/serve/05-authorized-view/project/infra/modules/lakehouse/main.tf?raw'
import s5 from '../../../spine/serve/05-authorized-view/session.txt?raw'
import lake6 from '../../../spine/serve/06-mv-bi-engine/project/infra/modules/lakehouse/main.tf?raw'
import s6 from '../../../spine/serve/06-mv-bi-engine/session.txt?raw'
import card from '../../../spine/serve/08-the-answer/project/warehouse/derby_card.sql?raw'
import s8 from '../../../spine/serve/08-the-answer/session.txt?raw'

// Course 10 · The answer, cheaply and safely. MOCKED (the owner's call, 2026-11-03): every number is
// computed from the night's data the way the SQL would; the terminals are authored.
const CLOSED = ['sources', 'infra', 'extract', 'produce', 'consume', 'stream', 'spark']
const tree = (step: string, active: string, fresh = [active]) =>
  stepTree(step, active, { fresh, closed: CLOSED.filter((c) => !active.startsWith(c)), trim: ['warehouse', ...(active.startsWith('infra') ? ['infra', 'infra/modules'] : [])] })
const n = (s: string) => Number(s).toLocaleString('en-GB')

/** The data rows of the bq table printed after `command` (the last table in its output). */
function bqRows(session: string, command: string): string[][] {
  const block = session.split(`$ ${command}\n`)[1].split(/\n\$ /)[0].split('\n')
  const head = block.map((l, i) => (/^\| *[a-z_]+ *\|/.test(l) ? i : -1)).filter((i) => i >= 0).pop()!
  return block.slice(head + 2).filter((l) => l.startsWith('|')).map((l) => l.split('|').slice(1, -1).map((c) => c.trim()))
}
const DT = '$Q --parameter=dt:DATE:2026-10-31 < warehouse/'

// §10.1 — content_performance_daily
const top = bqRows(s1, `${DT}top_titles.sql`)
const written = /Number of affected rows: (\d+)\n\$ /.exec(s1)![1]

export const serveGold: SceneModel = ideFrame({
  tree: tree('serve/01-content-performance', 'warehouse/gold_content.sql', ['warehouse/gold_content.sql', 'warehouse/top_titles.sql', 'infra/modules/lakehouse']),
  editor: { file: 'warehouse/gold_content.sql', code: gold1, show: [[lineOf(gold1, 'INSERT INTO'), lineOf(gold1, 'GROUP BY')]], highlight: linesFrom(gold1, 'COUNTIF(v.channel IS NOT NULL)', 'HLL_COUNT.INIT') },
  session: s1,
  keep: ['Number of affected rows: 601', [`${DT}top_titles.sql`, '| Riverside']],
  side: [
    MOCKED,
    {
      type: 'group', id: 'row', title: 'A Gold row: one title, platform and region, one night', minH: 380, icon: 'bigquery', tone: 'ingest', children: [
        { type: 'item', id: 'r-silver', title: 'silver.viewing_events', sub: 'heartbeats: a box-minute each', icon: 'bigquery' },
        { type: 'item', id: 'r-dims', title: 'titles and households, read in place', sub: 'the title’s name and kind; the household’s region', icon: 'gcs' },
        { type: 'item', id: 'r-gold', title: `Gold: ${written} rows`, sub: 'content_performance_daily: live and catch-up minutes, households (count and sketch)', icon: 'bigquery', tone: 'store' },
      ],
    },
    {
      type: 'table', id: 'top', title: 'The night’s most-watched titles', tone: 'store', columns: ['title', 'live min', 'catch-up min'],
      rows: top.map(([t, l, c]) => ({ id: `t-${t.replace(/\W/g, '')}`, cells: [t, n(l), n(c)], tone: t.startsWith('Northbridge') ? 'ingest' as const : undefined })),
    },
  ],
  edges: [
    { from: 'r-silver', to: 'r-dims' },
    { from: 'r-dims', to: 'r-gold' },
  ],
})

// §10.2 — counting unique households
const [summed, exact, approx, sketches] = bqRows(s2, `${DT}households.sql`)[0]

export const serveUnique: SceneModel = ideFrame({
  tree: tree('serve/02-unique-households', 'warehouse/households.sql'),
  editor: { file: 'warehouse/households.sql', code: uniq, highlight: linesFrom(uniq, '(SELECT HLL_COUNT.MERGE(households_sketch)', 'FROM gold.content_performance_daily WHERE dt = @dt) AS sketches') },
  session: s2,
  side: [
    MOCKED,
    {
      type: 'group', id: 'merge', title: 'Counts cannot be added; sketches can be merged', minH: 500, icon: 'layers', tone: 'ingest', children: [
        { type: 'item', id: 'm-rows', title: 'a sketch per Gold row', sub: 'HLL++: a few kilobytes that remember who was seen', icon: 'layers' },
        { type: 'item', id: 'm-merge', title: 'HLL_COUNT.MERGE', sub: 'over any rows: a title, a region, the night', icon: 'workflow' },
        { type: 'item', id: 'm-answer', title: `${n(sketches)} households`, sub: 'without going back to Silver', icon: 'check', tone: 'store' },
      ],
    },
    {
      type: 'table', id: 'ways', title: 'Households who watched anything, four ways', tone: 'store', columns: ['how', 'households', 'right?'],
      rows: [
        { id: 'w-sum', cells: ['SUM of Gold’s counts', n(summed), 'no: a household counted per title'], tone: 'consume' },
        { id: 'w-exact', cells: ['COUNT(DISTINCT), Silver', n(exact), 'yes: every row read'] },
        { id: 'w-approx', cells: ['APPROX_COUNT_DISTINCT', n(approx), 'yes, within ~1%'] },
        { id: 'w-sketch', cells: ['HLL_COUNT.MERGE, Gold', n(sketches), 'yes: sketches merge'], tone: 'ingest' },
      ],
    },
  ],
  edges: [
    { from: 'm-rows', to: 'm-merge' },
    { from: 'm-merge', to: 'm-answer' },
  ],
})

// §10.3 — G4: the planted bug caught
const [silverMin, goldMin, extra] = bqRows(s3, `${DT}g4.sql`)[0]

export const serveG4: SceneModel = ideFrame({
  tree: tree('serve/03-g4', 'warehouse/gold_content.sql', ['warehouse/gold_content.sql', 'warehouse/g4.sql', 'infra/modules/lakehouse']),
  editor: { file: 'warehouse/gold_content.sql', code: gold3, show: [[lineOf(gold3, 'INSERT INTO'), lineOf(gold3, 'd.package_id;')]], highlight: linesFrom(gold3, 'JOIN silver.dim_subscriber AS d', 'ON d.household_id = v.household_id') },
  session: s3,
  keep: [`${DT}gold_content.sql`, 'Number of affected rows: 1242', `${DT}g4.sql`, ['| silver_minutes', '+----']],
  side: [
    MOCKED,
    {
      type: 'group', id: 'bug', title: 'The join that doubles 37 households', minH: 520, icon: 'users', tone: 'consume', children: [
        { type: 'item', id: 'b-hh', title: 'HH-10123’s minutes', sub: 'watched on derby day', icon: 'screen' },
        { type: 'item', id: 'b-dim', title: 'dim_subscriber: two rows', sub: 'P-ESS, closed; P-SPT, current — the join matches both', icon: 'users', tone: 'consume' },
        { type: 'item', id: 'b-fix', title: 'the fix: the row valid on the night', sub: 'valid_from ≤ dt < valid_to (§10.4)', icon: 'check', tone: 'store' },
      ],
    },
    {
      type: 'table', id: 'g4', title: 'G4: Gold must hold every Silver minute, once', tone: 'consume', columns: ['', 'minutes'],
      rows: [
        { id: 'g-silver', cells: ['Silver', n(silverMin)] },
        { id: 'g-gold', cells: ['Gold', n(goldMin)], tone: 'consume' },
        { id: 'g-extra', cells: ['extra', n(extra)], tone: 'consume' },
      ],
    },
  ],
  edges: [
    { from: 'b-hh', to: 'b-dim', label: 'joined by household only' },
    { from: 'b-dim', to: 'b-fix', dashed: true },
  ],
})

// §10.4 — what a query costs
const g4ok = bqRows(s4, `${DT}g4.sql`)[0]
const dry = /process upper bound of (\d+) bytes/.exec(s4)![1]

export const serveCost: SceneModel = ideFrame({
  tree: tree('serve/04-query-cost', 'infra/modules/lakehouse/main.tf', ['infra/modules/lakehouse', 'warehouse/derby_curve.sql', 'warehouse/curve_unfiltered.sql', 'warehouse/gold_content.sql']),
  editor: { file: 'infra/modules/lakehouse/main.tf', code: lake4, show: [[lineOf(lake4, '# Silver: one row per real event'), lineOf(lake4, 'require_partition_filter = true')]], highlight: linesFrom(lake4, '# a query must name the hours it wants', 'require_partition_filter = true') },
  session: s4,
  keep: ['$ bq query --nouse_legacy_sql --dry_run', 'this query will process', '$ $Q < warehouse/curve_unfiltered.sql', 'elimination', '$ bq -q query --nouse_legacy_sql $C', 'or higher required'],
  side: [
    MOCKED,
    {
      type: 'group', id: 'g4', title: `G4, green: ${n(g4ok[1])} minutes in both`, minH: 640, icon: 'check', tone: 'store', children: [
        { type: 'item', id: 'f-join', title: 'the as-of join', sub: 'the package valid on the night: one row per household', icon: 'users' },
        { type: 'item', id: 'f-g4', title: 'Gold = Silver', sub: 'extra: 0', icon: 'check', tone: 'store' },
      ],
    },
    {
      type: 'table', id: 'guards', title: 'Three guards on the bill', tone: 'store', columns: ['guard', 'what it did'],
      rows: [
        { id: 'q-dry', cells: ['--dry_run', `priced the curve: ${n(dry)} bytes, free`] },
        { id: 'q-filter', cells: ['require_partition_filter', 'refused a query with no time filter'], tone: 'consume' },
        { id: 'q-cap', cells: ['maximum_bytes_billed', 'refused a query over 1 MB before it ran'], tone: 'consume' },
      ],
    },
  ],
  edges: [{ from: 'f-join', to: 'f-g4' }],
})

// §10.5 — sharing without exposing: an authorized view
const regions = bqRows(s5, '$Q < warehouse/marketing.sql')

export const serveView: SceneModel = ideFrame({
  tree: tree('serve/05-authorized-view', 'infra/modules/lakehouse/main.tf', ['infra/modules/lakehouse', 'warehouse/marketing.sql']),
  editor: { file: 'infra/modules/lakehouse/main.tf', code: lake5, show: [[lineOf(lake5, '# Marketing'), lineOf(lake5, 'resource "google_bigquery_dataset" "marketing"')], [lineOf(lake5, 'resource "google_bigquery_dataset_access" "title_audience"'), lineOf(lake5, 'member     = "group:marketing@sun.example"') + 1]], highlight: linesFrom(lake5, 'resource "google_bigquery_dataset_access" "title_audience"', 'table_id   = google_bigquery_table.title_audience.table_id') },
  session: s5,
  keep: [['$ $Q < warehouse/marketing.sql', '| Midlands'], '$ bq show --format=prettyjson gold | jq -c \'.access[] | select(.view)\'', '{"view"'],
  side: [
    MOCKED,
    {
      type: 'group', id: 'auth', title: 'Dataset → view → reader', minH: 520, icon: 'shield', tone: 'ingest', children: [
        { type: 'item', id: 'a-gold', title: 'gold', sub: 'households, sketches: not shared', icon: 'bigquery', tone: 'consume' },
        { type: 'item', id: 'a-view', title: 'marketing.title_audience', sub: 'authorized on gold: minutes and household counts per title and region', icon: 'bigquery' },
        { type: 'item', id: 'a-reader', title: 'marketing@sun.example', sub: 'reads the view; a query on gold itself is refused', icon: 'users', tone: 'store' },
      ],
    },
    {
      type: 'table', id: 'derby', title: 'What marketing sees of the derby', tone: 'store', columns: ['region', 'minutes', 'households'],
      rows: regions.map(([r, m, h]) => ({ id: `r-${r.replace(/\W/g, '')}`, cells: [r, n(m), n(h)] })),
    },
  ],
  edges: [
    { from: 'a-gold', to: 'a-view', label: 'authorized' },
    { from: 'a-view', to: 'a-reader', label: 'dataViewer' },
  ],
})

// §10.6 — materialized views and BI Engine
const runs = [...s6.matchAll(/^read +([\d,]+) bytes\nbilled +([\d,]+) bytes\nBI Engine (.+)$/gm)].map((m) => m.slice(1))

export const serveMv: SceneModel = ideFrame({
  tree: tree('serve/06-mv-bi-engine', 'infra/modules/lakehouse/main.tf', ['infra/modules/lakehouse', 'warehouse/derby_curve_mv.sql', 'warehouse/bytes.py']),
  editor: { file: 'infra/modules/lakehouse/main.tf', code: lake6, show: [[lineOf(lake6, '# The dashboard'), lineOf(lake6, 'refresh_interval_ms')], [lineOf(lake6, '# BI Engine'), lineOf(lake6, 'size     = 1073741824') + 1]], highlight: linesFrom(lake6, 'materialized_view {', 'refresh_interval_ms') },
  session: s6,
  keep: ['$ python warehouse/bytes.py warehouse/derby_curve.sql', 'read ', 'BI Engine', '$ python warehouse/bytes.py warehouse/derby_curve_mv.sql', 'read ', 'BI Engine'],
  side: [
    MOCKED,
    {
      type: 'group', id: 'mv', title: 'Base table → materialized view → cache', minH: 520, icon: 'bigquery', tone: 'ingest', children: [
        { type: 'item', id: 'v-silver', title: 'silver.viewing_events', sub: 'every event: what the dashboard used to scan', icon: 'bigquery' },
        { type: 'item', id: 'v-mv', title: 'gold.derby_curve', sub: 'a row per minute and channel, refreshed by BigQuery', icon: 'layers' },
        { type: 'item', id: 'v-bi', title: 'BI Engine, 1 GB', sub: 'the view in memory, for the dashboard', icon: 'zap', tone: 'store' },
      ],
    },
    {
      type: 'table', id: 'cost', title: 'The dashboard’s curve, twice', tone: 'store', columns: ['from', 'read', 'billed', 'BI Engine'],
      rows: runs.map(([r, b, bi], i) => ({ id: `c-${i}`, cells: [i ? 'the view' : 'Silver', r, b, bi], tone: i ? 'ingest' as const : undefined })),
    },
  ],
  edges: [
    { from: 'v-silver', to: 'v-mv' },
    { from: 'v-mv', to: 'v-bi' },
  ],
})

// §10.7 — ◆ Looker's semantic model (a concept frame: the LookML is shown, nothing runs).
const LOOKML = `view: content_performance_daily {
  sql_table_name: gold.content_performance_daily ;;
  dimension: title { sql: \${TABLE}.title ;; }
  dimension: region { sql: \${TABLE}.region ;; }
  dimension_group: night { type: time timeframes: [date]
    sql: \${TABLE}.dt ;; }
  measure: live_minutes { type: sum sql: \${TABLE}.live_minutes ;; }
  measure: households { type: number
    sql: HLL_COUNT.MERGE(\${TABLE}.households_sketch) ;; }
}

explore: content_performance_daily {
  label: "Content performance"
  always_filter: { filters: [night_date: "7 days"] }
}`

export const serveLooker: SceneModel = {
  title: 'Looker’s semantic model',
  sub: 'one definition of every number, between the tables and every dashboard that shows them',
  nodes: [
    {
      type: 'group', id: 'top', bare: true, dir: 'row', children: [
        { type: 'code', id: 'lookml', filename: 'views/content_performance_daily.view.lkml', lang: 'text', code: LOOKML },
        {
          type: 'group', id: 'layers', title: 'Tables → views → explore → dashboard', icon: 'looker', tone: 'ingest', children: [
            { type: 'item', id: 'l-table', title: 'gold.content_performance_daily', sub: 'BigQuery: the rows', icon: 'bigquery' },
            { type: 'item', id: 'l-view', title: 'a LookML view', sub: 'dimensions and measures, named once; households merged from sketches', icon: 'code' },
            { type: 'item', id: 'l-explore', title: 'an explore', sub: 'what a business user may slice, always filtered to recent nights', icon: 'search' },
            { type: 'item', id: 'l-dash', title: 'the derby dashboard', sub: 'Looker writes the SQL; the numbers agree everywhere', icon: 'chart', tone: 'store' },
          ],
        },
      ],
    },
    level('doc-cited', 'Google Cloud’s Looker and LookML documentation'),
    { type: 'note', id: 'docs', tone: 'infra', text: 'cloud.google.com/looker/docs/what-is-lookml · cloud.google.com/looker/docs/reference/param-explore — viewing-pulse has no Looker instance: this frame shows the model, nothing runs.' },
  ],
  edges: [
    { from: 'l-table', to: 'l-view' },
    { from: 'l-view', to: 'l-explore' },
    { from: 'l-explore', to: 'l-dash' },
  ],
}

// §10.8 — the answer: the derby card
const [peakAt, livePeak, goldHh, liveMin, worst, worstPct, nextPct] = bqRows(s8, '$Q < warehouse/derby_card.sql')[0]

export const serveAnswer: SceneModel = ideFrame({
  tree: tree('serve/08-the-answer', 'warehouse/derby_card.sql'),
  editor: { file: 'warehouse/derby_card.sql', code: card, show: [[lineOf(card, 'WITH live AS ('), lineOf(card, 'FROM live, gold, qos')]], highlight: linesFrom(card, 'SELECT live.peak_at', 'FROM live, gold, qos') },
  session: s8,
  side: [
    MOCKED,
    {
      type: 'group', id: 'card', title: 'Northbridge v Eastfield, 31 October', minH: 560, icon: 'chart', tone: 'ingest', children: [
        { type: 'item', id: 'c-live', title: `${n(livePeak)} households at ${peakAt}`, sub: 'the live lane: Dataflow, while the match played (§7.9)', icon: 'dataflow' },
        { type: 'item', id: 'c-gold', title: `${n(goldHh)} households, ${n(liveMin)} minutes`, sub: 'the batch: Gold, next morning, every gate passed (§10.4)', icon: 'bigquery', tone: 'store' },
        { type: 'item', id: 'c-qos', title: `${worst}: ${worstPct}% buffering`, sub: `every other exchange ${nextPct}%; from 18:35, the second half (§9.4)`, icon: 'network', tone: 'consume' },
      ],
    },
    { type: 'note', id: 'note', tone: 'store', text: 'Two lanes, one answer: the live peak and Gold’s audience agree, and one London exchange explains the complaints.' },
  ],
  edges: [
    { from: 'c-live', to: 'c-gold', label: 'agree' },
    { from: 'c-gold', to: 'c-qos', label: 'and why it stuttered' },
  ],
})

export const serveScenes: Record<string, SceneModel> = {
  'serve-gold': serveGold,
  'serve-unique': serveUnique,
  'serve-g4': serveG4,
  'serve-cost': serveCost,
  'serve-view': serveView,
  'serve-mv': serveMv,
  'serve-looker': serveLooker,
  'serve-answer': serveAnswer,
}
