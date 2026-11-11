import type { SceneModel } from '@graphlearning/graphl-flow'
import { lineOf, linesFrom } from '../ide'
import { ideFrame2 } from '../frame'
import { outputOf } from '../lab'
import { RECORDED } from '../level'
import { stepTree } from '../files'
import storage1 from '../../../spine/land/01-buckets/project/infra/modules/storage/main.tf?raw'
import s1 from '../../../spine/land/01-buckets/session.txt?raw'
import g1Code from '../../../spine/land/06-retry-safe/project/extract/g1.py?raw'
import s6 from '../../../spine/land/06-retry-safe/session.txt?raw'
import storage7 from '../../../spine/land/07-retention/project/infra/modules/storage/main.tf?raw'
import s7 from '../../../spine/land/07-retention/session.txt?raw'
import storage8 from '../../../spine/land/08-lifecycle/project/infra/modules/storage/main.tf?raw'
import s8 from '../../../spine/land/08-lifecycle/session.txt?raw'

// Course 5 §1, §6–§8 — recorded on GCP, in the owner's project. Every value read from a transcript.
const CLOSED = ['sources', 'infra/modules/iam', 'infra/modules/kms', 'infra/modules/secrets', 'infra/envs']

// §5.1 — buckets and the raw zone: the bucket as Google describes it after Courses 3–4.
const described = Object.fromEntries(outputOf(s1, 'gcloud storage buckets describe $RAW').split('\n')
  .filter((l) => /^\w[\w_]*: /.test(l)).map((l) => [l.split(': ')[0], l.slice(l.indexOf(': ') + 2)]))
const softDays = Number(/retentionDurationSeconds: '(\d+)'/.exec(s1)![1]) / 86400

export const landBuckets: SceneModel = ideFrame2({
  model: 'A bucket holds objects; names only look like folders',
  tree: stepTree('land/01-buckets', 'infra/modules/storage/main.tf', { fresh: [], closed: CLOSED }),
  editor: { file: 'infra/modules/storage/main.tf', code: storage1, show: [[1, lineOf(storage1, '}', lineOf(storage1, 'default_kms_key_name') + 1)]], highlight: [lineOf(storage1, 'location'), lineOf(storage1, 'storage_class'), lineOf(storage1, 'uniform_bucket_level_access')] },
  session: s1,
  keep: ['$ gcloud storage buckets describe', ['default_kms_key', 'default_storage_class'], 'location: ', 'public_access_prevention', 'uniform_bucket_level_access'],
  side: [
    RECORDED,
    {
      type: 'table', id: 'props', title: 'sun-media-dev-raw, as Google describes it', tone: 'store', columns: ['property', 'value', 'means'], rows: [
        { id: 'p-location', cells: ['location', described.location, 'London'] },
        { id: 'p-class', cells: ['class', described.default_storage_class, 'hot data'] },
        { id: 'p-uniform', cells: ['uniform', described.uniform_bucket_level_access, 'IAM only'], tone: 'ingest' },
        { id: 'p-public', cells: ['public', described.public_access_prevention, 'never'], tone: 'ingest' },
        { id: 'p-key', cells: ['default key', 'k-raw', 'Sun’s, §4.7'] },
        { id: 'p-soft', cells: ['soft delete', `${softDays} days`, 'default'] },
      ],
    },
    {
      type: 'group', id: 'flat', title: 'A bucket holds objects; names only look like folders', icon: 'gcs', tone: 'store', children: [
        { type: 'item', id: 'f-bucket', title: 'sun-media-dev-raw', sub: 'one bucket, one region', icon: 'gcs' },
        { type: 'item', id: 'f-object', title: 'one object, one name', sub: 'the slashes are characters', icon: 'file' },
      ],
    },
  ],
  edges: [{ from: 'f-bucket', to: 'f-object', label: 'holds' }],
})

// §5.6 — retry-safe and sealed: on real Cloud Storage now.
const g1Lines = outputOf(s6, 'python extract/g1.py billing --dt 2026-10-31')
const rows = /charges\.csv rows\s+(\d+) of (\d+)/.exec(g1Lines)!
const listed = outputOf(s6, 'gcloud storage ls "$RAW/source=billing/**"').split('\n').filter(Boolean).map((l) => l.split('/').at(-1)!)

export const landRetrySafe: SceneModel = ideFrame2({
  model: 'Retry-safe: a night is sealed once',
  tree: stepTree('land/06-retry-safe', 'extract/g1.py', { fresh: ['extract/g1.py', 'extract/extract.py'], closed: [...CLOSED, 'infra'] }),
  editor: { file: 'extract/g1.py', code: g1Code, show: [[lineOf(g1Code, 'if __name__'), g1Code.trimEnd().split('\n').length]], highlight: linesFrom(g1Code, 'try:  # generation 0', 'refused: {night} is already sealed') },
  session: s6,
  keep: [['$ python extract/extract.py copy', 'charges.csv'], ['$ python extract/extract.py copy', 'charges.csv'], ['charges.csv rows', 'G1 PASS'], 'already sealed', ['$ python extract/extract.py copy', 'is sealed']],
  side: [
    RECORDED,
    {
      type: 'group', id: 'night', title: 'dt=2026-10-31, on Cloud Storage', icon: 'workflow', tone: 'ingest', children: [
        { type: 'item', id: 'n-copy', title: 'copy, then copy again', sub: `a retry rewrites the same name: ${rows[1]} rows both times`, icon: 'database' },
        { type: 'item', id: 'n-seal', title: `G1 PASS · ${rows[1]} of ${rows[2]}`, sub: '_SUCCESS written with ifGenerationMatch=0', icon: 'shield', tone: 'store' },
        {
          type: 'group', id: 'n-refused', bare: true, dir: 'row', children: [
            { type: 'item', id: 'n-reseal', title: 'G1 again', sub: 'refused: already sealed', icon: 'lock', tone: 'consume' },
            { type: 'item', id: 'n-recopy', title: 'copy again', sub: 'refused: the night is sealed', icon: 'lock', tone: 'consume' },
          ],
        },
      ],
    },
    {
      type: 'table', id: 'folder', title: 'The folder, sealed', tone: 'store', columns: ['object', 'written by'],
      rows: listed.map((f) => ({ id: `o-${f}`, cells: [f, f === '_SUCCESS' ? 'G1, once' : f === '_manifest.json' ? 'plan, first' : 'copy'], tone: f === '_SUCCESS' ? 'store' as const : undefined })),
    },
  ],
  edges: [
    { from: 'n-copy', to: 'n-seal' },
    { from: 'n-seal', to: 'n-reseal' },
  ],
})

// §5.7 — immutable by policy: a retention policy, and a delete refused.
const period = /retentionPeriod: '(\d+)'/.exec(s7)![1]
const expiry = /retention_expiration: (\S+)/.exec(s7)![1]

export const landRetention: SceneModel = ideFrame2({
  model: 'Retention: no delete until the object is old enough',
  tree: stepTree('land/07-retention', 'infra/modules/storage/main.tf', { fresh: [], closed: [...CLOSED, 'extract'] }),
  editor: { file: 'infra/modules/storage/main.tf', code: storage7, show: [[1, lineOf(storage7, '}', lineOf(storage7, 'retention_period') + 1)]], highlight: linesFrom(storage7, '# Immutable by policy', 'retention_period') },
  session: s7,
  keep: ['Apply complete', '$ gcloud storage buckets describe', 'retentionPeriod', ['$ O=', 'retention_expiration'], '$ gcloud storage rm', ['ERROR:', 'GcsApiError']],
  side: [
    RECORDED,
    {
      type: 'group', id: 'held', title: 'An object under the bucket’s retention policy', icon: 'lock', tone: 'consume', children: [
        { type: 'item', id: 'h-object', title: 'charges.csv', sub: 'landed in §5.6', icon: 'file' },
        { type: 'item', id: 'h-policy', title: `retention: ${Number(period) / 3600} hour`, sub: 'no delete, no replace, until the object is this old', icon: 'timer' },
        { type: 'item', id: 'h-until', title: `held until ${expiry.slice(11)}`, sub: 'the object’s own expiry, from its creation time', icon: 'clock' },
        { type: 'item', id: 'h-refused', title: 'gcloud storage rm', sub: 'refused, even for the project’s owner', icon: 'lock', tone: 'consume' },
      ],
    },
    { type: 'item', id: 'limit', icon: 'clock', tone: 'ingest', title: 'dev holds an hour; production, years', sub: 'locking a policy makes it permanent: not done here' },
  ],
  edges: [
    { from: 'h-object', to: 'h-policy' },
    { from: 'h-policy', to: 'h-until' },
    { from: 'h-until', to: 'h-refused' },
  ],
})

// §5.8 — hot to cold: lifecycle rules move an object down the storage classes as it ages.
const rules = (JSON.parse(outputOf(s8, 'gcloud storage buckets describe $RAW --format="json(lifecycle_config)"')).lifecycle_config.rule as { action: { storageClass: string }; condition: { age: number } }[])
  .sort((a, b) => a.condition.age - b.condition.age)

export const landLifecycle: SceneModel = ideFrame2({
  model: 'Lifecycle: an object moves to colder classes as it ages',
  tree: stepTree('land/08-lifecycle', 'infra/modules/storage/main.tf', { fresh: [], closed: [...CLOSED, 'extract'] }),
  editor: { file: 'infra/modules/storage/main.tf', code: storage8, show: [[1, 2], [lineOf(storage8, '# Hot to cold'), lineOf(storage8, 'age = lifecycle_rule.value') + 3]], highlight: linesFrom(storage8, '# Hot to cold', 'age = lifecycle_rule.value') },
  session: s8,
  keep: ['Apply complete', '$ gcloud storage buckets describe', '"storageClass": "ARCHIVE"', '"storageClass": "COLDLINE"', '"storageClass": "NEARLINE"'],
  side: [
    RECORDED,
    {
      type: 'group', id: 'age', title: 'One object, as it ages', icon: 'clock', tone: 'store', children: [
        { type: 'item', id: 'a-standard', title: 'STANDARD · day 0', sub: 'the night lands; G1 and the loaders read it', icon: 'gcs' },
        ...rules.map((r) => ({ type: 'item' as const, id: `a-${r.action.storageClass}`, title: `${r.action.storageClass} · day ${r.condition.age}`, sub: r.action.storageClass === 'ARCHIVE' ? 'kept, almost never read' : 'cheaper to keep, dearer to read', icon: 'gcs', tone: r.action.storageClass === 'ARCHIVE' ? 'infra' as const : undefined })),
      ],
    },
    { type: 'item', id: 'trade', icon: 'gauge', tone: 'ingest', title: 'Cheaper to keep, dearer to read', sub: 'the rule fires on age; nobody moves a file' },
  ],
  edges: [
    { from: 'a-standard', to: `a-${rules[0].action.storageClass}`, label: `${rules[0].condition.age} days` },
    { from: `a-${rules[0].action.storageClass}`, to: `a-${rules[1].action.storageClass}`, label: `${rules[1].condition.age} days` },
    { from: `a-${rules[1].action.storageClass}`, to: `a-${rules[2].action.storageClass}`, label: `${rules[2].condition.age} days` },
  ],
})
