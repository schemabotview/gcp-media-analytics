import type { SceneModel } from '@graphlearning/graphl-flow'
import { ideFrame, lineOf, linesFrom } from '../ide'
import { outputOf } from '../lab'
import { RECORDED } from '../level'
import { stepTree } from '../files'
import gcpSh from '../../../spine/secure/01-cloud-iam/project/gcp.sh?raw'
import s1 from '../../../spine/secure/01-cloud-iam/session.txt?raw'
import storage2 from '../../../spine/secure/02-inheritance/project/infra/modules/storage/main.tf?raw'
import s2 from '../../../spine/secure/02-inheritance/session.txt?raw'
import iam3 from '../../../spine/secure/03-service-accounts/project/infra/modules/iam/main.tf?raw'
import s3 from '../../../spine/secure/03-service-accounts/session.txt?raw'
import iam4 from '../../../spine/secure/04-no-key-files/project/infra/modules/iam/main.tf?raw'
import s4 from '../../../spine/secure/04-no-key-files/session.txt?raw'
import s5 from '../../../spine/secure/05-permission-denied/session.txt?raw'
import secrets6 from '../../../spine/secure/06-secret-manager/project/infra/modules/secrets/main.tf?raw'
import s6 from '../../../spine/secure/06-secret-manager/session.txt?raw'
import kms7 from '../../../spine/secure/07-kms-cmek/project/infra/modules/kms/main.tf?raw'
import s7 from '../../../spine/secure/07-kms-cmek/session.txt?raw'
import storage8 from '../../../spine/secure/08-least-privilege/project/infra/modules/storage/main.tf?raw'
import s8 from '../../../spine/secure/08-least-privilege/session.txt?raw'

// Course 4 · Identity first — every section recorded on GCP, every side-pane value read from its
// transcript. The project's own policy is shown only as counts and the bindings the course needs.
const CLOSED = ['sources', 'extract']
const json = (session: string, command: string) => JSON.parse(outputOf(session, command))

// §4.1 — Cloud IAM: an allow policy is bindings, each a role and its members.
const bindings = outputOf(s1, "jq '.bindings | length' iam.json").trim()
const editor = json(s1, `jq '.bindings[] | select(.role == "roles/editor")' iam.json`) as { members: string[]; role: string }
const owners = outputOf(s1, `jq '.bindings[] | select(.role == "roles/owner").members | length' iam.json`).trim()

export const secureCloudIam: SceneModel = ideFrame({
  tree: stepTree('secure/01-cloud-iam', 'gcp.sh', { fresh: [], closed: [...CLOSED, 'infra'] }),
  editor: { file: 'gcp.sh', code: gcpSh, highlight: [lineOf(gcpSh, 'TF_VAR_operator=')] },
  session: s1,
  side: [
    RECORDED,
    {
      type: 'group', id: 'policy', title: 'The project’s allow policy', icon: 'gcpiam', tone: 'infra', children: [
        { type: 'item', id: 'p-policy', title: `${bindings} bindings`, sub: 'one policy, attached to the project', icon: 'file' },
        { type: 'item', id: 'p-binding', title: editor.role, sub: 'one binding: a role …', icon: 'shield' },
        { type: 'item', id: 'p-members', title: `${editor.members.length} members`, sub: '… and who holds it: Google’s own service agents here', icon: 'users' },
      ],
    },
    {
      type: 'table', id: 'members', title: 'roles/editor: its members', tone: 'store', columns: ['member'],
      rows: editor.members.map((m, i) => ({ id: `m-${i}`, cells: [m.replace('serviceAccount:', '')] })),
    },
    {
      type: 'table', id: 'owner', title: 'roles/owner', tone: 'consume', columns: ['members', 'means'], rows: [
        { id: 'o-count', cells: [owners, 'can do everything, grant included'] },
      ],
    },
    { type: 'note', id: 'note', tone: 'store', text: 'A role on the project reaches every resource in it. The platform’s own jobs will get theirs on the narrowest resource instead.' },
  ],
  edges: [
    { from: 'p-policy', to: 'p-binding' },
    { from: 'p-binding', to: 'p-members' },
  ],
})

// §4.2 — ◆ IAM inheritance: the bucket's own policy, and what it inherits from the project.
const projectBindings = outputOf(s2, "jq -r '[.bindings[].role] | length' iam.json").trim()
const bucket = json(s2, "jq '.bindings' bucket.json") as { members: string[]; role: string }[]

export const secureInheritance: SceneModel = ideFrame({
  tree: stepTree('secure/02-inheritance', 'infra/modules/storage/main.tf', { fresh: [], closed: CLOSED }),
  editor: { file: 'infra/modules/storage/main.tf', code: storage2, highlight: [lineOf(storage2, 'uniform_bucket_level_access')] },
  session: s2,
  keep: [['$ gcloud projects', projectBindings], "$ jq '.bindings' bucket.json", 'roles/storage.legacyBucketOwner', 'roles/storage.legacyBucketReader', 'roles/storage.legacyObjectOwner'],
  side: [
    RECORDED,
    {
      type: 'group', id: 'down', title: 'Policies union down the hierarchy', icon: 'gcpiam', tone: 'infra', children: [
        { type: 'item', id: 'h-org', title: 'organization, folders', sub: 'none here: this project stands alone', icon: 'building', muted: true },
        { type: 'item', id: 'h-project', title: 'project sun-media-dev', sub: `${projectBindings} bindings — inherited by every resource below`, icon: 'gcpproject' },
        { type: 'item', id: 'h-bucket', title: 'bucket sun-media-dev-raw', sub: `${bucket.length} bindings of its own`, icon: 'gcs', tone: 'store' },
        { type: 'item', id: 'h-effective', title: 'what a caller may do', sub: 'the union: project’s ∪ bucket’s, never less', icon: 'shield', tone: 'consume' },
      ],
    },
    {
      type: 'table', id: 'convenience', title: 'The bucket’s own bindings', tone: 'store', columns: ['role', 'members'],
      rows: bucket.map((b) => ({ id: `c-${b.role}`, cells: [b.role.replace('roles/storage.', ''), b.members.map((m) => m.split(':')[0]).join(', ')] })),
    },
  ],
  edges: [
    { from: 'h-org', to: 'h-project', dashed: true },
    { from: 'h-project', to: 'h-bucket' },
    { from: 'h-bucket', to: 'h-effective' },
  ],
})

// §4.3 — service accounts: one per job, made by Terraform.
const accounts = [...iam3.matchAll(/^ {4}(sa-\w+)\s+= "(.+)"$/gm)].map((m) => [m[1], m[2]])
const made = outputOf(s3, 'terraform state list | grep google_service_account').split('\n').filter(Boolean)

export const secureServiceAccounts: SceneModel = ideFrame({
  tree: stepTree('secure/03-service-accounts', 'infra/modules/iam/main.tf', { fresh: ['infra/modules/iam'], closed: CLOSED }),
  editor: { file: 'infra/modules/iam/main.tf', code: iam3 },
  session: s3,
  keep: ['$ terraform apply', 'Plan: 5 to add', 'Apply complete', ['$ terraform state list', 'job["sa-ingest"]']],
  side: [
    RECORDED,
    {
      type: 'table', id: 'accounts', title: `One account per job (${made.length} in the state)`, tone: 'infra', columns: ['account', 'who wears it'],
      rows: accounts.map(([a, why]) => ({ id: `a-${a}`, cells: [a, why] })),
    },
    {
      type: 'group', id: 'wear', title: 'A job runs AS its account', icon: 'gcpiam', tone: 'store', children: [
        { type: 'item', id: 'w-job', title: 'the nightly extract', sub: 'a program, not a person', icon: 'terminal' },
        { type: 'item', id: 'w-sa', title: 'sa-ingest', sub: 'its identity on Google Cloud', icon: 'gcpiam' },
        { type: 'item', id: 'w-raw', title: 'the raw zone', sub: 'grants: none yet (§4.8)', icon: 'gcs', muted: true },
      ],
    },
    { type: 'note', id: 'note', tone: 'store', text: 'Creating an identity grants nothing. Each account starts with no roles at all.' },
  ],
  edges: [
    { from: 'w-job', to: 'w-sa' },
    { from: 'w-sa', to: 'w-raw', dashed: true },
  ],
})

// §4.4 — no key files: Priya may impersonate each account; no account has a user-managed key.
const keys = outputOf(s4, 'gcloud iam service-accounts keys list --iam-account=$SA --managed-by=user').trim()

export const secureNoKeyFiles: SceneModel = ideFrame({
  tree: stepTree('secure/04-no-key-files', 'infra/modules/iam/main.tf', { fresh: ['infra/modules/iam/variables.tf'], closed: CLOSED }),
  editor: { file: 'infra/modules/iam/main.tf', code: iam4, show: [[lineOf(iam4, 'resource "google_service_account" "job"'), iam4.trimEnd().split('\n').length]], highlight: linesFrom(iam4, '# Priya may ACT AS', 'member             = var.operator') },
  session: s4,
  keep: ['$ terraform apply', 'Plan: 5 to add', 'Apply complete', ['$ SA=', keys]],
  side: [
    RECORDED,
    {
      type: 'group', id: 'token', title: 'A token, minted on request', icon: 'key', tone: 'infra', children: [
        { type: 'item', id: 't-priya', title: 'Priya', sub: 'serviceAccountTokenCreator on each job account', icon: 'user' },
        { type: 'item', id: 't-iam', title: 'IAM credentials API', sub: 'checks the grant, mints a token', icon: 'gcpiam' },
        { type: 'item', id: 't-token', title: 'an access token as sa-ingest', sub: 'short-lived: it expires within the hour', icon: 'timer', tone: 'store' },
      ],
    },
    {
      type: 'table', id: 'keys', title: 'sa-ingest’s user-managed keys', tone: 'consume', columns: ['gcloud says', 'means'], rows: [
        { id: 'k-none', cells: [keys, 'no key file exists to leak'] },
      ],
    },
    { type: 'note', id: 'note', tone: 'store', text: 'A key file works for anyone holding a copy, for years. A token works for an hour, and only someone with the grant can get one.' },
  ],
  edges: [
    { from: 't-priya', to: 't-iam', label: 'impersonate' },
    { from: 't-iam', to: 't-token' },
  ],
})

// §4.5 — ⑂ PERMISSION_DENIED: the token works; the account holds no role on the bucket.
const tokenChars = outputOf(s5, 'gcloud auth print-access-token --impersonate-service-account=$SA | wc -c').split('\n').filter((l) => /^\d+$/.test(l))[0]
const denied = /does not have (\S+) access/.exec(s5.replace(/\n/g, ''))![1].replace(/ /g, '')

export const securePermissionDenied: SceneModel = ideFrame({
  tree: stepTree('secure/05-permission-denied', 'infra/modules/storage/main.tf', { fresh: [], closed: CLOSED }),
  editor: { file: 'infra/modules/storage/main.tf', code: storage2 },
  session: s5,
  keep: [['$ SA=', '$ gcloud auth print'], tokenChars, '$ gcloud storage ls', ['ERROR:', "dev-raw' (or it may not exist)"]],
  side: [
    RECORDED,
    {
      type: 'group', id: 'denied', title: '⑂ sa-ingest lists the raw zone', icon: 'shield', tone: 'consume', children: [
        { type: 'item', id: 'd-token', title: `a token: ${tokenChars} characters`, sub: 'impersonation works', icon: 'key' },
        { type: 'item', id: 'd-call', title: 'storage.objects.list', sub: 'on sun-media-dev-raw', icon: 'gcs' },
        { type: 'item', id: 'd-refused', title: 'PERMISSION_DENIED', sub: `no binding grants ${denied}`, icon: 'lock', tone: 'consume' },
      ],
    },
    {
      type: 'table', id: 'fix', title: 'storage.objects.* → the role that holds it', tone: 'store', columns: ['permission', 'role', 'on'], rows: [
        { id: 'f-list', cells: [denied.replace('storage.objects', 'objects'), 'objectViewer', 'bucket, §4.8'], tone: 'store' },
        { id: 'f-get', cells: ['objects.get', 'objectViewer', 'bucket, §4.8'] },
        { id: 'f-create', cells: ['objects.create', 'objectCreator', 'bucket, §4.8'] },
        { id: 'f-delete', cells: ['objects.delete', 'nobody’s', 'never'], tone: 'consume' },
      ],
    },
    { type: 'note', id: 'note', tone: 'store', text: 'Read an IAM error for the permission it names, then grant the narrowest role that holds it, on the narrowest resource.' },
  ],
  edges: [
    { from: 'd-token', to: 'd-call' },
    { from: 'd-call', to: 'd-refused' },
  ],
})

// §4.6 — Secret Manager: a generated password, one reader.
const versions = outputOf(s6, 'gcloud secrets versions list crm-db-password').split('\n').filter(Boolean).slice(1).length
const length = outputOf(s6, 'gcloud secrets versions access latest --secret=crm-db-password $AS=$SA | wc -c').split('\n').filter((l) => /^\d+$/.test(l))[0]

export const secureSecretManager: SceneModel = ideFrame({
  tree: stepTree('secure/06-secret-manager', 'infra/modules/secrets/main.tf', { fresh: ['infra/modules/secrets'], closed: CLOSED }),
  editor: { file: 'infra/modules/secrets/main.tf', code: secrets6, show: [[lineOf(secrets6, '# The CRM'), lineOf(secrets6, 'special = false') + 1], [lineOf(secrets6, 'resource "google_secret_manager_secret_version"'), secrets6.trimEnd().split('\n').length]], highlight: [lineOf(secrets6, 'random_password'), lineOf(secrets6, 'secret_data'), ...linesFrom(secrets6, '# Only the extract', 'member    =')] },
  session: s6,
  keep: ['Apply complete', '1     enabled', '$ gcloud secrets versions access latest --secret=crm-db-password $AS=$SA', length, '$ gcloud secrets versions access latest --secret=crm-db-password $AS=$DF', 'PERMISSION_DENIED'],
  side: [
    RECORDED,
    {
      type: 'group', id: 'secret', title: 'crm-db-password', icon: 'secretmanager', tone: 'infra', children: [
        { type: 'item', id: 's-secret', title: 'the secret', sub: 'replicated in europe-west2 only', icon: 'secretmanager' },
        { type: 'item', id: 's-version', title: `${versions} version, enabled`, sub: 'generated by Terraform, never typed', icon: 'key' },
        { type: 'item', id: 's-iam', title: 'secretAccessor', sub: 'granted on this secret, to one account', icon: 'gcpiam' },
        {
          type: 'group', id: 's-readers', bare: true, dir: 'row', children: [
            { type: 'item', id: 's-ingest', title: 'sa-ingest', sub: `reads it: ${length} characters`, icon: 'check', tone: 'store' },
            { type: 'item', id: 's-dataflow', title: 'sa-dataflow', sub: 'PERMISSION_DENIED', icon: 'lock', tone: 'consume' },
          ],
        },
      ],
    },
    {
      type: 'table', id: 'asked', title: 'Who asked for the latest version', tone: 'store', columns: ['as', 'got'], rows: [
        { id: 'a-ingest', cells: ['sa-ingest', `${length} characters (counted, never printed)`], tone: 'store' },
        { id: 'a-dataflow', cells: ['sa-dataflow', 'PERMISSION_DENIED'], tone: 'consume' },
      ],
    },
    { type: 'note', id: 'note', tone: 'store', text: 'The value is never printed — only its length. The extract will read it at run time as sa-ingest; no password lives in the code or on a laptop.' },
  ],
  edges: [
    { from: 's-secret', to: 's-version' },
    { from: 's-version', to: 's-iam' },
    { from: 's-iam', to: 's-ingest' },
  ],
})

// §4.7 — Cloud KMS and CMEK: Sun's own key encrypts the raw zone.
const kmsKey = outputOf(s7, 'gcloud storage buckets describe $RAW --format="value(default_kms_key)"').replace(/\n/g, '').trim()

export const secureKms: SceneModel = ideFrame({
  tree: stepTree('secure/07-kms-cmek', 'infra/modules/kms/main.tf', { fresh: ['infra/modules/kms'], closed: CLOSED }),
  editor: { file: 'infra/modules/kms/main.tf', code: kms7, show: [[lineOf(kms7, '# A key ring'), lineOf(kms7, 'role          = "roles/cloudkms')]], highlight: [lineOf(kms7, 'rotation_period'), lineOf(kms7, 'roles/cloudkms.cryptoKeyEncrypterDecrypter')] },
  session: s7,
  keep: ['Plan: 4 to add, 1 to change', 'google_kms_key_ring.media: Creation complete', 'google_storage_bucket.raw: Modifications complete', 'Apply complete', ['$ gcloud storage buckets describe', '/cryptoKeys/k-raw']],
  side: [
    RECORDED,
    {
      type: 'group', id: 'kms', title: 'Sun’s key, on the raw zone', icon: 'cloudkms', tone: 'infra', children: [
        { type: 'item', id: 'k-ring', title: 'key ring kr-media', sub: 'europe-west2 · can never be deleted', icon: 'cloudkms' },
        { type: 'item', id: 'k-key', title: 'key k-raw', sub: 'rotates every 90 days', icon: 'key' },
        { type: 'item', id: 'k-version', title: 'version 1, primary', sub: 'new objects use the newest version', icon: 'key' },
        { type: 'item', id: 'k-bucket', title: 'sun-media-dev-raw', sub: 'default key: k-raw', icon: 'gcs', tone: 'store' },
      ],
    },
    {
      type: 'table', id: 'agent', title: 'Who encrypts', tone: 'store', columns: ['who', 'role on k-raw'], rows: [
        { id: 'a-gcs', cells: ['Cloud Storage’s service agent', 'cryptoKeyEncrypterDecrypter'] },
        { id: 'a-key', cells: [kmsKey.split('/').slice(-3).join('/'), 'the bucket’s default key'] },
      ],
    },
  ],
  edges: [
    { from: 'k-ring', to: 'k-key' },
    { from: 'k-key', to: 'k-version' },
    { from: 'k-version', to: 'k-bucket', label: 'encrypts' },
  ],
})

// §4.8 — least privilege: the role matrix, as Google holds it (roles.sh).
const matrix = outputOf(s8, 'bash roles.sh').split('\n')
const project = matrix.slice(1, matrix.findIndex((l) => l.startsWith('bucket'))).map((l) => l.trim().split(/\s+/))
const onBucket = matrix.slice(matrix.findIndex((l) => l.startsWith('bucket')) + 1).filter(Boolean).map((l) => l.trim().split(/\s+/))

export const secureLeastPrivilege: SceneModel = ideFrame({
  tree: stepTree('secure/08-least-privilege', 'infra/modules/storage/main.tf', { fresh: ['infra/roles.sh'], closed: CLOSED }),
  editor: { file: 'infra/modules/storage/main.tf', code: storage8, show: [[lineOf(storage8, '# Who may touch'), storage8.trimEnd().split('\n').length]], highlight: linesFrom(storage8, '"ingest-create"', '"dataproc-view"') },
  session: s8,
  keep: ['$ bash roles.sh', ['bucket gs://', 'sa-ingest  roles/storage.objectViewer'], '$ gcloud storage ls', 'allowed'],
  side: [
    RECORDED,
    {
      type: 'table', id: 'matrix', title: 'The role matrix: account × resource × role', tone: 'infra', columns: ['account', 'on', 'role'], rows: [
        ...project.map(([a, r]) => ({ id: `p-${a}`, cells: [a, 'project', r.replace('roles/', '')] })),
        ...onBucket.map(([a, r]) => ({ id: `b-${a}-${r}`, cells: [a, 'raw bucket', r.replace('roles/', '')], tone: 'store' as const })),
      ],
    },
    {
      type: 'group', id: 'narrow', title: 'The grant that fixed §4.5', icon: 'shield', tone: 'store', children: [
        { type: 'item', id: 'n-ingest', title: 'sa-ingest', sub: 'create and read; no delete', icon: 'gcpiam' },
        { type: 'item', id: 'n-raw', title: 'sun-media-dev-raw', sub: 'listing it: allowed', icon: 'gcs', tone: 'store' },
        { type: 'item', id: 'n-rest', title: 'the rest of the project', sub: 'no grant: nothing', icon: 'gcpproject', muted: true },
      ],
    },
    { type: 'note', id: 'note', tone: 'store', text: 'On the bucket, not the project: sa-ingest can touch the raw zone and nothing else in sun-media-dev.' },
  ],
  edges: [{ from: 'n-ingest', to: 'n-raw', label: 'objectCreator + objectViewer' }],
})

export const secureScenes: Record<string, SceneModel> = {
  'secure-cloud-iam': secureCloudIam,
  'secure-inheritance': secureInheritance,
  'secure-service-accounts': secureServiceAccounts,
  'secure-no-key-files': secureNoKeyFiles,
  'secure-permission-denied': securePermissionDenied,
  'secure-secret-manager': secureSecretManager,
  'secure-kms': secureKms,
  'secure-least-privilege': secureLeastPrivilege,
}
