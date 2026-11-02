import type { SceneModel } from '@graphlearning/graphl-flow'
import { ideFrame, lineOf, linesFrom } from '../ide'
import { outputOf } from '../lab'
import { RECORDED } from '../level'
import { stepTree } from '../files'
import gcpSh from '../../../spine/start/05-signing-in/project/gcp.sh?raw'
import s5 from '../../../spine/start/05-signing-in/session.txt?raw'
import main6 from '../../../spine/start/06-first-terraform/project/infra/main.tf?raw'
import s6 from '../../../spine/start/06-first-terraform/session.txt?raw'
import backend7 from '../../../spine/start/07-state/project/infra/backend.tf?raw'
import s7 from '../../../spine/start/07-state/session.txt?raw'
import budget8 from '../../../spine/start/08-modules-budget/project/infra/budget.tf?raw'
import s8 from '../../../spine/start/08-modules-budget/session.txt?raw'

// Course 3 §5–§8 — recorded on GCP (the owner's project, normalised by scripts/spine.py). Every value
// in a side pane is read from the step's transcript.

// §3.5 — signing in: who, which project, which API, and nothing of ours yet.
const account = outputOf(s5, 'gcloud auth list --format="value(account)"').trim()
const project = outputOf(s5, 'gcloud config get project').trim()
const api = outputOf(s5, 'gcloud services list --enabled --filter=config.name=storage.googleapis.com').split('\n')[1].split(/\s{2,}/)

export const startSigningIn: SceneModel = ideFrame({
  tree: stepTree('start/05-signing-in', 'gcp.sh', { closed: ['sources'] }),
  editor: { file: 'gcp.sh', code: gcpSh, highlight: [lineOf(gcpSh, 'TF_VAR_project_id='), lineOf(gcpSh, 'TF_VAR_operator=')] },
  session: s5,
  side: [
    RECORDED,
    {
      type: 'group', id: 'who', title: 'Before anything is built', icon: 'gcp', tone: 'infra', children: [
        { type: 'item', id: 'w-account', title: account, sub: 'signed in: every call is made as this identity', icon: 'user' },
        { type: 'item', id: 'w-project', title: project, sub: 'the project every resource will live in', icon: 'gcpproject' },
        { type: 'item', id: 'w-api', title: api[0], sub: `${api[1]}: enabled, per project`, icon: 'gcs' },
        { type: 'item', id: 'w-ours', title: 'app=viewing-pulse: 0 resources', sub: 'the label every resource will carry', icon: 'search', tone: 'consume' },
      ],
    },
    {
      type: 'table', id: 'labels', title: 'Three labels on everything (Terraform adds them)', tone: 'store', columns: ['label', 'value', 'answers'], rows: [
        { id: 'l-app', cells: ['app', 'viewing-pulse', 'whose is this?'] },
        { id: 'l-env', cells: ['env', 'dev', 'which copy?'] },
        { id: 'l-owner', cells: ['owner', 'media-data', 'who to ask'] },
      ],
    },
  ],
  edges: [
    { from: 'w-account', to: 'w-project' },
    { from: 'w-project', to: 'w-api' },
    { from: 'w-api', to: 'w-ours', dashed: true },
  ],
})

// §3.6 — a first Terraform file: one bucket, planned and applied.
const [bucketName, location, labels] = outputOf(s6, 'gcloud storage buckets describe $RAW --format="value(name,location,labels)"').replace(/\n/g, '').split('\t')
const planned = /Plan: (\d+) to add/.exec(s6)![1]
const took = /Creation complete after (\d+s)/.exec(s6)![1]

export const startFirstTerraform: SceneModel = ideFrame({
  tree: stepTree('start/06-first-terraform', 'infra/main.tf', { fresh: ['infra/main.tf', 'infra/variables.tf'], closed: ['sources'] }),
  editor: { file: 'infra/main.tf', code: main6, show: [[lineOf(main6, 'provider "google"'), main6.trimEnd().split('\n').length]], highlight: linesFrom(main6, 'resource "google_storage_bucket" "raw"', 'public_access_prevention') },
  session: s6,
  keep: ['$ terraform init', '$ terraform apply', 'Plan: 1 to add', 'Creation complete', ['Apply complete', 'ned=true;owner']],
  side: [
    RECORDED,
    {
      type: 'group', id: 'path', title: 'What terraform apply did', icon: 'terraform', tone: 'infra', children: [
        { type: 'item', id: 'p-code', title: 'main.tf', sub: 'the bucket, as code', icon: 'code' },
        { type: 'item', id: 'p-provider', title: 'hashicorp/google 8.9.0', sub: `planned ${planned} to add`, icon: 'terraform' },
        { type: 'item', id: 'p-api', title: 'storage.googleapis.com', sub: 'the same API gcloud calls', icon: 'gcs' },
        { type: 'item', id: 'p-bucket', title: bucketName, sub: `${location} · created in ${took}`, icon: 'gcs', tone: 'store' },
      ],
    },
    {
      type: 'table', id: 'labels', title: 'The bucket, read back with gcloud', tone: 'store', columns: ['label', 'value'],
      rows: labels.split(';').map((kv) => kv.split('=')).map(([k, v]) => ({ id: `b-${k}`, cells: [k, v] })),
    },
    { type: 'note', id: 'note', tone: 'store', text: 'plan says what would change; apply asks the API to make it so. Nothing existed before this apply, and nothing was clicked.' },
  ],
  edges: [
    { from: 'p-code', to: 'p-provider' },
    { from: 'p-provider', to: 'p-api' },
    { from: 'p-api', to: 'p-bucket' },
  ],
})

// §3.7 — state, and where it lives: the CLI makes the state bucket, Terraform moves its state in.
const stateObject = outputOf(s7, 'gcloud storage ls "gs://$B/**"').trim()
const locals = outputOf(s7, 'ls terraform.tfstate*').split('\n').filter(Boolean)

export const startState: SceneModel = ideFrame({
  tree: stepTree('start/07-state', 'infra/backend.tf', { fresh: ['infra/backend.tf', 'infra/bootstrap.sh'], closed: ['sources'] }),
  editor: { file: 'infra/backend.tf', code: backend7, highlight: linesFrom(backend7, 'backend "gcs"', 'prefix') },
  session: s7,
  keep: ['$ terraform init', ['$ gcloud storage ls', 'terraform.tfstate.backup'], '$ terraform plan', 'No changes.'],
  side: [
    RECORDED,
    {
      type: 'group', id: 'state', title: 'Code, state, and the cloud', icon: 'terraform', tone: 'infra', children: [
        { type: 'item', id: 's-code', title: 'infra/*.tf', sub: 'what should exist', icon: 'code' },
        {
          type: 'group', id: 's-mid', bare: true, dir: 'row', children: [
            { type: 'item', id: 's-state', title: 'env/dev/default.tfstate', sub: 'what Terraform made, and its ids', icon: 'gcs', tone: 'store' },
            { type: 'item', id: 's-lock', title: 'the lock', sub: 'taken by every plan and apply', icon: 'lock', tone: 'consume' },
          ],
        },
        { type: 'item', id: 's-gcp', title: 'sun-media-dev', sub: 'what does exist', icon: 'gcpproject' },
      ],
    },
    {
      type: 'table', id: 'where', title: 'Where the state was, and is', tone: 'store', columns: ['file', 'now'], rows: [
        ...locals.map((f) => ({ id: `l-${f}`, cells: [`infra/${f}`, 'the laptop’s old copy: delete it'] })),
        { id: 'l-gcs', cells: [stateObject.split('/').slice(3).join('/'), 'the one Terraform reads'], tone: 'store' as const },
      ],
    },
    { type: 'note', id: 'note', tone: 'store', text: 'The state bucket is the one thing the CLI makes: Terraform needs somewhere to keep its state before it can make anything else.' },
  ],
  edges: [
    { from: 's-code', to: 's-state', label: 'compared with' },
    { from: 's-state', to: 's-gcp', label: 'refreshed from' },
    { from: 's-state', to: 's-lock', dashed: true },
  ],
})

// §3.8 — modules, and a budget: the bucket moves into a module, and 80% of the month alerts.
const added = /Plan: (\d+) to add/.exec(s8)![1]

export const startModulesBudget: SceneModel = ideFrame({
  tree: stepTree('start/08-modules-budget', 'infra/budget.tf', { fresh: ['infra/budget.tf', 'infra/modules/storage', 'infra/envs/dev.tfvars'], closed: ['sources'] }),
  editor: { file: 'infra/budget.tf', code: budget8, show: [[lineOf(budget8, '# 80%'), lineOf(budget8, 'all_updates_rule') - 1]], highlight: linesFrom(budget8, 'threshold_rules {', 'spend_basis') },
  session: s8,
  keep: [['$ terraform fmt', 'formatted'], '$ terraform apply', 'has moved to', 'Plan: 4 to add', 'google_billing_budget.month: Creation complete', 'Apply complete'],
  side: [
    RECORDED,
    {
      type: 'group', id: 'tree', title: 'One root, one module', icon: 'boxes', tone: 'infra', children: [
        { type: 'item', id: 't-root', title: 'infra/main.tf', sub: 'provider, module calls', icon: 'code' },
        { type: 'item', id: 't-storage', title: 'modules/storage', sub: 'the raw bucket, moved', icon: 'gcs' },
      ],
    },
    {
      type: 'group', id: 'budget', title: `The budget (${added} resources added)`, icon: 'gcpbilling', tone: 'consume', children: [
        { type: 'item', id: 'b-budget', title: 'viewing-pulse-dev', sub: '£50 a month, this project only', icon: 'gcpbilling' },
        { type: 'item', id: 'b-rule', title: '80%, spent or forecast', sub: 'an alert, never a cut-off', icon: 'gauge' },
        { type: 'item', id: 'b-email', title: 'media-data@sun.example', sub: 'a Monitoring email channel; mail goes to the channel, not to people with billing roles', icon: 'bell' },
      ],
    },
    { type: 'note', id: 'note', tone: 'store', text: 'moved {} says the bucket in the module is the bucket that was at the root. Without it, Terraform would plan to destroy one and create the other.' },
  ],
  edges: [
    { from: 't-root', to: 't-storage', label: 'module "storage"' },
    { from: 'b-budget', to: 'b-rule' },
    { from: 'b-rule', to: 'b-email' },
  ],
})
