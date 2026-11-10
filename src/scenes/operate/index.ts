import type { SceneModel } from '@graphlearning/graphl-flow'
import { lineOf, linesFrom } from '../ide'
import { ideFrame2 } from '../frame'
import { MOCKED, level } from '../level'
import { stepTree } from '../files'
import gov1 from '../../../spine/operate/01-policy-tags/project/infra/modules/governance/main.tf?raw'
import s1 from '../../../spine/operate/01-policy-tags/session.txt?raw'
import dlp from '../../../spine/operate/02-dlp/project/governance/dlp.py?raw'
import s2 from '../../../spine/operate/02-dlp/session.txt?raw'
import lineage from '../../../spine/operate/03-lineage/project/governance/lineage.py?raw'
import s3 from '../../../spine/operate/03-lineage/session.txt?raw'
import gov4 from '../../../spine/operate/04-data-quality/project/infra/modules/governance/main.tf?raw'
import s4 from '../../../spine/operate/04-data-quality/session.txt?raw'
import logq from '../../../spine/operate/05-logging/project/ops/night_jobs.logq?raw'
import s5 from '../../../spine/operate/05-logging/session.txt?raw'
import alert from '../../../spine/operate/06-alerts/project/infra/modules/alerts/main.tf?raw'
import s6 from '../../../spine/operate/06-alerts/session.txt?raw'
import prod from '../../../spine/operate/07-two-environments/project/infra/envs/prod.tfvars?raw'
import s7 from '../../../spine/operate/07-two-environments/session.txt?raw'
import cb from '../../../spine/operate/08-cloud-build/project/cloudbuild.yaml?raw'
import s8 from '../../../spine/operate/08-cloud-build/session.txt?raw'

// Course 12 · Protect it, watch it, ship it. MOCKED (the owner's call, 2026-11-03).
const CLOSED = ['sources', 'infra', 'extract', 'produce', 'consume', 'stream', 'spark', 'airflow', 'dags', 'warehouse', 'governance', 'ops']
const tree = (step: string, active: string, fresh = [active]) =>
  stepTree(step, active, { fresh, closed: CLOSED.filter((c) => !active.startsWith(c)), trim: ['warehouse', ...(active.startsWith('infra') ? ['infra', 'infra/modules'] : [])] })

// §12.1 — policy tags
export const opPolicyTags: SceneModel = ideFrame2({
  model: 'Policy tags: column access, granted per tag',
  tree: tree('operate/01-policy-tags', 'infra/modules/governance/main.tf', ['infra/modules/governance', 'warehouse/dim_household.sql', 'warehouse/households_open.sql', 'warehouse/households_contact.sql']),
  editor: { file: 'infra/modules/governance/main.tf', code: gov1, show: [[lineOf(gov1, 'resource "google_data_catalog_policy_tag" "contact"'), lineOf(gov1, 'member     = "group:pii-readers@sun.example"') + 1], [lineOf(gov1, '{ name = "email"'), lineOf(gov1, 'policyTags = { names = [google_data_catalog_policy_tag.contact.name] } },')]], highlight: linesFrom(gov1, '{ name = "email"', 'policyTags = { names = [google_data_catalog_policy_tag.contact.name] } },') },
  session: s1,
  keep: ['Number of affected rows: 5000', '$ $Q < warehouse/households_open.sql', ['| HH-10001', '| HH-10003'], '$ $Q < warehouse/households_contact.sql', 'Access Denied'],
  side: [
    MOCKED,
    {
      type: 'group', id: 'tags', title: 'Taxonomy → tag → column → reader', icon: 'shield', tone: 'ingest', children: [
        { type: 'item', id: 't-tax', title: 'sun-pii', sub: 'a taxonomy: what is sensitive', icon: 'layers' },
        { type: 'item', id: 't-tag', title: 'contact', sub: 'a policy tag: a way to reach a person', icon: 'shield' },
        { type: 'item', id: 't-col', title: 'silver.dim_household: email, phone', sub: 'tagged; the rest is open', icon: 'bigquery' },
        { type: 'item', id: 't-reader', title: 'pii-readers@sun.example', sub: 'the only ones who see them', icon: 'users', tone: 'store' },
      ],
    },
  ],
  edges: [
    { from: 't-tax', to: 't-tag' },
    { from: 't-tag', to: 't-col' },
    { from: 't-col', to: 't-reader' },
  ],
})

// §12.2 — Sensitive Data Protection
const findings = s2.split('\n').filter((l) => /^[A-Z_]+ +\w+ +[\d,]+ findings$/.test(l)).map((l) => l.split(/ +/))

export const opDlp: SceneModel = ideFrame2({
  model: 'Sensitive Data Protection: find, then mask',
  tree: tree('operate/02-dlp', 'governance/dlp.py', ['governance', 'requirements.txt']),
  editor: { file: 'governance/dlp.py', code: dlp, show: [[lineOf(dlp, 'KINDS = '), lineOf(dlp, 'KINDS = ')], [lineOf(dlp, 'config = {"info_types"'), lineOf(dlp, 'print(f"{kind:<15}')], [lineOf(dlp, 'replace = {'), lineOf(dlp, '"deidentify_config": replace')]], highlight: linesFrom(dlp, 'replace = {', '"primitive_transformation": {"replace_with_info_type_config": {}}}]}}') },
  session: s2,
  keep: ['$ python governance/dlp.py inspect $C', ['EMAIL_ADDRESS', 'PHONE_NUMBER'], '$ python governance/dlp.py redact', 'HH-10001'],
  side: [
    MOCKED,
    {
      type: 'group', id: 'flow', title: 'Finding → transform → masked file', icon: 'dlp', tone: 'ingest', children: [
        { type: 'item', id: 'd-find', title: 'inspect', sub: 'email, phone, a name: LIKELY or surer', icon: 'search' },
        { type: 'item', id: 'd-replace', title: 'replace with its kind', sub: 'jack.hughes75@… → [EMAIL_ADDRESS]', icon: 'dlp' },
        { type: 'item', id: 'd-file', title: 'households.redacted.csv', sub: 'shareable', icon: 'file', tone: 'store' },
      ],
    },
    {
      type: 'table', id: 'found', title: 'Found in the CRM’s households.csv', tone: 'consume', columns: ['infoType', 'column', 'findings'],
      rows: findings.map(([k, c, n]) => ({ id: `f-${k}-${c}`, cells: [k, c, n] })),
    },
  ],
  edges: [
    { from: 'd-find', to: 'd-replace' },
    { from: 'd-replace', to: 'd-file' },
  ],
})

// §12.3 — Dataplex: lineage, drawn from what the API returned
const lines3 = s3.split('\n').slice(1).filter(Boolean).map((l) => ({ depth: (l.length - l.trimStart().length) / 4, name: l.trim() }))
const direct = lines3.filter((l) => l.depth === 1).map((l) => l.name)
const below = (name: string) => { const i = lines3.findIndex((l) => l.name === name); return lines3[i + 1]?.depth > lines3[i].depth ? lines3[i + 1].name.replace('gs://sun-media-dev-raw/', 'raw: ') : '—' }
const chain = ['gs://sun-media-dev-raw/source=viewing', 'bronze.viewing_raw', 'bronze.viewing_events', 'silver.viewing_events', 'gold.content_performance_daily']
const path = chain.filter((n) => lines3.some((l) => l.name === n))

export const opLineage: SceneModel = ideFrame2({
  model: 'Lineage: the longest path, Gold back to the raw zone',
  tree: tree('operate/03-lineage', 'governance/lineage.py', ['governance/lineage.py', 'requirements.txt']),
  editor: { file: 'governance/lineage.py', code: lineage, show: [[lineOf(lineage, 'def upstream('), lineOf(lineage, 'upstream(sys.argv[1])')]], highlight: linesFrom(lineage, 'links = client.search_links(', '"parent": parent, "target": {"fully_qualified_name": fqn(table)}})') },
  session: s3,
  keep: ['$ python governance/lineage.py', ['    silver.viewing_events', 'gs://sun-media-dev-raw/source=viewing']],
  side: [
    MOCKED,
    {
      type: 'group', id: 'path', bare: true, children: path.map((n, i) => ({
        type: 'item' as const, id: `p-${i}`, title: n, sub: i === 0 ? 'the delivered files' : i === path.length - 1 ? 'the table asked about' : 'a BigQuery job wrote it',
        icon: n.startsWith('gs://') ? 'gcs' : 'bigquery', tone: i === path.length - 1 ? 'store' as const : undefined,
      })),
    },
    {
      type: 'table', id: 'others', title: 'Its other direct sources', tone: 'store', columns: ['table', 'from'],
      rows: direct.filter((d) => d !== 'silver.viewing_events').map((d) => ({ id: `o-${d.replace(/\W/g, '')}`, cells: [d, below(d)] })),
    },
  ],
  edges: path.slice(1).map((_, i) => ({ from: `p-${i}`, to: `p-${i + 1}` })),
})

// §12.4 — Dataplex data quality
const rows4 = /rowCount: '(\d+)'/.exec(s4)![1]

export const opQuality: SceneModel = ideFrame2({
  model: 'A scan for one table’s rules; a gate for two',
  tree: tree('operate/04-data-quality', 'infra/modules/governance/main.tf', ['infra/modules/governance']),
  editor: { file: 'infra/modules/governance/main.tf', code: gov4, show: [[lineOf(gov4, '# A data-quality scan on Silver'), lineOf(gov4, '# table cannot do.')], [lineOf(gov4, 'data_quality_spec {'), lineOf(gov4, 'uniqueness_expectation {}') + 1]], highlight: linesFrom(gov4, 'uniqueness_expectation {}', 'uniqueness_expectation {}') },
  session: s4,
  keep: ['$ gcloud dataplex datascans run $D $R', '$ gcloud dataplex datascans jobs describe', ['dataQualityResult:', 'state: SUCCEEDED']],
  side: [
    MOCKED,
    {
      type: 'group', id: 'scan', title: `The scan: ${Number(rows4).toLocaleString('en-GB')} rows, 4 rules, passed`, icon: 'dataplex', tone: 'ingest', children: [
        { type: 'item', id: 'q-scan', title: 'silver-viewing-events', sub: 'on demand here; after the DAG in prod', icon: 'dataplex' },
        { type: 'item', id: 'q-result', title: 'a result per rule, kept', sub: 'beside the table in the catalog', icon: 'check', tone: 'store' },
      ],
    },
    {
      type: 'table', id: 'where', title: 'Where a rule lives', tone: 'store', columns: ['rule', 'lives in'],
      rows: [
        { id: 'w-null', cells: ['event_id present, unique', 'the scan: one table'], tone: 'ingest' },
        { id: 'w-set', cells: ['platform in Sun’s four', 'the scan: one table'], tone: 'ingest' },
        { id: 'w-g2', cells: ['G2: title in the catalogue', 'the DAG: two tables'] },
        { id: 'w-g3', cells: ['G3: the EPG covers it', 'the DAG: two tables'] },
        { id: 'w-g4', cells: ['G4: Gold = Silver', 'the DAG: two layers'] },
      ],
    },
  ],
  edges: [{ from: 'q-scan', to: 'q-result' }],
})

// §12.5 — Cloud Logging
const jobs5 = s5.split('\n').filter((l) => /^\d\d:\d\d:\d\d +\w+ +\d+$/.test(l)).map((l) => l.split(/ +/))

export const opLogging: SceneModel = ideFrame2({
  model: 'Audit logs: every job, routed and queryable',
  tree: tree('operate/05-logging', 'ops/night_jobs.logq', ['ops']),
  editor: { file: 'ops/night_jobs.logq', code: logq, highlight: [lineOf(logq, 'airflow-dag="viewing_daily"')] },
  session: s5,
  side: [
    MOCKED,
    {
      type: 'group', id: 'router', title: 'Sources → log router → where it is kept', icon: 'cloudlogging', tone: 'ingest', children: [
        { type: 'item', id: 'l-src', title: 'every BigQuery job', sub: 'an audit entry: who, what, bytes', icon: 'bigquery' },
        { type: 'item', id: 'l-router', title: 'the log router', sub: '_Default: 30 days, queryable', icon: 'cloudlogging' },
        { type: 'item', id: 'l-q', title: 'a query', sub: 'the night’s jobs, by Airflow’s labels', icon: 'search', tone: 'store' },
      ],
    },
    {
      type: 'table', id: 'jobs', title: 'The night’s BigQuery jobs, from the logs', tone: 'store', columns: ['at', 'task', 'billed bytes'],
      rows: jobs5.map(([t, k, b]) => ({ id: `j-${k}`, cells: [t, k, Number(b).toLocaleString('en-GB')] })),
    },
  ],
  edges: [
    { from: 'l-src', to: 'l-router' },
    { from: 'l-router', to: 'l-q' },
  ],
})

// §12.6 — alerts
export const opAlerts: SceneModel = ideFrame2({
  model: 'An alert: metric, policy, channel',
  tree: tree('operate/06-alerts', 'infra/modules/alerts/main.tf', ['infra/modules/alerts', 'infra/main.tf']),
  editor: { file: 'infra/modules/alerts/main.tf', code: alert, show: [[1, lineOf(alert, 'display_name = "oldest unacked')], [lineOf(alert, 'comparison      ='), lineOf(alert, 'content = ')]], highlight: linesFrom(alert, 'comparison      =', 'duration        =') },
  session: s6,
  keep: ['Apply complete', ['$ gcloud alpha monitoring policies list', 'viewing-events: Dataflow falling behind']],
  side: [
    MOCKED,
    {
      type: 'group', id: 'alert', title: 'Metric → policy → channel', icon: 'cloudmonitoring', tone: 'ingest', children: [
        { type: 'item', id: 'a-metric', title: 'oldest_unacked_message_age', sub: 'how far behind the job is', icon: 'pubsub' },
        { type: 'item', id: 'a-policy', title: 'over 300 s for 2 minutes', sub: 'an incident opens, and closes itself', icon: 'cloudmonitoring' },
        { type: 'item', id: 'a-channel', title: 'media-data@sun.example', sub: 'the budget’s channel (§3.8)', icon: 'bell', tone: 'store' },
      ],
    },
    {
      type: 'table', id: 'policy', title: 'The policy, as Terraform wrote it', tone: 'store', columns: ['setting', 'value'],
      rows: [
        { id: 'p-metric', cells: ['metric', 'oldest_unacked_message_age'] },
        { id: 'p-align', cells: ['aligned', 'the max, each 60 s'] },
        { id: 'p-when', cells: ['fires when', 'over 300 s for 120 s'], tone: 'ingest' },
        { id: 'p-tell', cells: ['tells', 'media-data@sun.example'] },
      ],
    },
  ],
  edges: [
    { from: 'a-metric', to: 'a-policy' },
    { from: 'a-policy', to: 'a-channel' },
  ],
})

// §12.7 — two environments
const plan7 = /^Plan: (.+)$/m.exec(s7)![1]

export const opTwoEnvs: SceneModel = ideFrame2({
  model: 'Two environments, one root module',
  tree: tree('operate/07-two-environments', 'infra/envs/prod.tfvars', ['infra/envs/prod.tfvars']),
  editor: { file: 'infra/envs/prod.tfvars', code: prod },
  session: s7,
  keep: ['$ export TF_VAR_project_id', '$ terraform init -reconfigure', 'Terraform has been successfully initialized!', '$ terraform plan', 'Plan:', '$ terraform workspace show', 'default'],
  side: [
    MOCKED,
    {
      type: 'group', id: 'envs', title: 'One root module, two projects', icon: 'gcpproject', tone: 'ingest', dir: 'row', children: [
        { type: 'item', id: 'e-dev', title: 'sun-media-dev', sub: 'envs/dev.tfvars', stack: true, icon: 'gcpproject' },
        { type: 'item', id: 'e-prod', title: 'sun-media-prod', sub: 'envs/prod.tfvars', stack: true, icon: 'gcpproject', tone: 'store' },
      ],
    },
    {
      type: 'table', id: 'differ', title: 'What differs, and what never does', tone: 'store', columns: ['', 'dev', 'prod'],
      rows: [
        { id: 'd-code', cells: ['infra/ modules', 'the same files', 'the same files'] },
        { id: 'd-vars', cells: ['variables', 'env = dev', 'env = prod'] },
        { id: 'd-state', cells: ['state bucket', 'per project', 'per project'] },
        { id: 'd-plan', cells: ['terraform plan', '—', plan7.replace(', 0 to change, 0 to destroy.', '')], tone: 'ingest' },
      ],
    },
  ],
  edges: [{ from: 'e-dev', to: 'e-prod', label: 'the same modules' }],
})

// §12.8 — CI with Cloud Build
const steps8 = [...s8.matchAll(/^Step #(\d) - "(\w+)": (.+)$/gm)].map((m) => m.slice(1))

export const opCloudBuild: SceneModel = ideFrame2({
  model: 'CI: every push formatted, validated, planned',
  tree: tree('operate/08-cloud-build', 'cloudbuild.yaml'),
  editor: { file: 'cloudbuild.yaml', code: cb, show: [[1, lineOf(cb, 'args: [fmt, -check, -recursive]')], [lineOf(cb, '- id: plan'), lineOf(cb, 'args:')]], highlight: [lineOf(cb, '- id: fmt'), lineOf(cb, '- id: plan')] },
  session: s8,
  keep: ['$ gcloud builds submit', ['Step #0', 'DONE']],
  side: [
    MOCKED,
    {
      type: 'group', id: 'ci', title: 'GitHub → trigger → build → plan', icon: 'cloudbuild', tone: 'ingest', children: [
        { type: 'item', id: 'c-push', title: 'a push to main', sub: 'the repository', icon: 'github' },
        { type: 'item', id: 'c-build', title: 'Cloud Build, as sa-cicd', sub: 'fmt, validate, lint the SQL', icon: 'cloudbuild' },
        { type: 'item', id: 'c-plan', title: 'a plan, in the build log', sub: 'a person applies; CI never does', icon: 'check', tone: 'store' },
      ],
    },
    {
      type: 'table', id: 'steps', title: 'The build, step by step', tone: 'store', columns: ['#', 'step', 'said'],
      rows: steps8.map(([i, n, said]) => ({ id: `s-${n}`, cells: [i, n, said.length > 30 ? said.slice(0, 29) + '…' : said] })),
    },
  ],
  edges: [
    { from: 'c-push', to: 'c-build' },
    { from: 'c-build', to: 'c-plan' },
  ],
})

// §12.9 — ◆ where next
export const opWhereNext: SceneModel = {
  title: 'Where next',
  sub: 'what viewing-pulse makes possible — none of it built here: no ML or AI in this film',
  nodes: [
    {
      type: 'group', id: 'top', bare: true, dir: 'row', children: [
        {
          type: 'group', id: 'built', title: 'Built: the platform', icon: 'gcp', tone: 'store', children: [
            { type: 'item', id: 'b-live', title: 'the live lane', sub: 'Pub/Sub → Dataflow → live.concurrent_viewers', icon: 'dataflow' },
            { type: 'item', id: 'b-batch', title: 'the nightly lane', sub: 'raw zone → Bronze → Silver → Gold, gated', icon: 'bigquery' },
            { type: 'item', id: 'b-ops', title: 'run and guarded', sub: 'Airflow, policy tags, lineage, alerts, CI', icon: 'shield' },
          ],
        },
        {
          type: 'group', id: 'next', title: 'Next: on top of it, unbuilt', icon: 'brain', tone: 'neutral', children: [
            { type: 'item', id: 'n-rt', title: 'real-time personalisation', sub: 'the live lane feeding a model while the match plays', icon: 'zap', muted: true },
            { type: 'item', id: 'n-churn', title: 'churn', sub: 'who will leave: dim_subscriber + viewing, in BigQuery ML or Vertex AI', icon: 'users', muted: true },
            { type: 'item', id: 'n-recs', title: 'recommendations', sub: 'what to watch next, from Silver’s viewing', icon: 'chart', muted: true },
          ],
        },
      ],
    },
    level('model', 'a map of what comes after; COURSE-PLAN.md, “No ML or AI is built”'),
  ],
  edges: [
    { from: 'b-batch', to: 'n-churn', dashed: true },
    { from: 'b-live', to: 'n-rt', dashed: true },
  ],
}

export const operateScenes: Record<string, SceneModel> = {
  'op-policy-tags': opPolicyTags,
  'op-dlp': opDlp,
  'op-lineage': opLineage,
  'op-quality': opQuality,
  'op-logging': opLogging,
  'op-alerts': opAlerts,
  'op-two-envs': opTwoEnvs,
  'op-cloud-build': opCloudBuild,
  'op-where-next': opWhereNext,
}
