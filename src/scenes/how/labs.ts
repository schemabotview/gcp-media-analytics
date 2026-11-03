import type { SceneModel } from '@graphlearning/graphl-flow'
import { labFrame, outputOf } from '../lab'
import { RECORDED } from '../level'
import s1 from '../../../spine/how-gcp-runs/01-regions-zones/session.txt?raw'
import s2 from '../../../spine/how-gcp-runs/02-hierarchy/session.txt?raw'
import s3 from '../../../spine/how-gcp-runs/03-apis/session.txt?raw'
import s4 from '../../../spine/how-gcp-runs/04-planes/session.txt?raw'
import s5 from '../../../spine/how-gcp-runs/05-three-clients/session.txt?raw'

// Course 2 §1–§5 — read-only labs recorded on GCP (§2.3 also switches the Compute Engine API on).
// Every value in a diagram is read from the lab's transcript.

// §2.1 — ◆ regions and zones.
const regions = outputOf(s1, 'gcloud compute regions list --format="value(name)" | wc -l').trim()
const status = outputOf(s1, 'gcloud compute regions describe europe-west2 --format="value(status)"').trim()
const zones = outputOf(s1, 'gcloud compute zones list --filter=name~europe-west2 --format="value(name)"').split('\n').filter(Boolean).sort()

export const howRegions: SceneModel = labFrame({
  session: s1,
  side: [
    RECORDED,
    {
      type: 'group', id: 'global', title: `Google’s network: ${regions} regions`, icon: 'globe', tone: 'infra', minH: 560, children: [
        {
          type: 'group', id: 'region', title: `europe-west2 · London · ${status}`, icon: 'building', tone: 'ingest', dir: 'row', children:
            zones.map((z) => ({ type: 'item' as const, id: `z-${z}`, title: z, sub: 'a zone: its own power, cooling, network', icon: 'server' })),
        },
        { type: 'item', id: 'g-others', title: `${Number(regions) - 1} other regions`, sub: 'joined by Google’s private network', icon: 'globe', muted: true },
      ],
    },
    {
      type: 'table', id: 'scope', title: 'Where this platform’s resources live', tone: 'store', columns: ['scope', 'survives', 'here'], rows: [
        { id: 'r-zonal', cells: ['zonal', 'nothing beyond its zone', 'a Dataproc worker'] },
        { id: 'r-regional', cells: ['regional', 'a zone failing', 'buckets, datasets, keys'], tone: 'store' },
        { id: 'r-global', cells: ['global', 'a region failing', 'IAM, the project itself'] },
      ],
    },
  ],
  edges: [{ from: 'region', to: 'g-others', dashed: true }],
})

// §2.2 — the resource hierarchy: this project has no organization above it.
const described = Object.fromEntries(outputOf(s2, 'gcloud projects describe $P --format="yaml(projectId,projectNumber,parent)"')
  .split('\n').filter(Boolean).map((l) => l.split(': ').map((v) => v.replace(/'/g, ''))))
const ancestors = outputOf(s2, 'gcloud projects get-ancestors $P').split('\n').slice(1).filter(Boolean).map((l) => l.trim().split(/\s+/))

export const howHierarchy: SceneModel = labFrame({
  session: s2,
  side: [
    RECORDED,
    {
      type: 'group', id: 'tree', title: 'Organization → folders → projects → resources', icon: 'boxes', tone: 'infra', minH: 560, children: [
        { type: 'item', id: 'h-org', title: 'organization', sub: 'none: get-ancestors stops at the project', icon: 'building', muted: true },
        { type: 'item', id: 'h-folder', title: 'folders', sub: 'none', icon: 'folder', muted: true },
        { type: 'item', id: 'h-project', title: `project ${described.projectId}`, sub: `number ${described.projectNumber}: the id Google uses internally`, icon: 'gcpproject', tone: 'ingest' },
        { type: 'item', id: 'h-resources', title: 'resources', sub: 'buckets, datasets, topics, keys: each belongs to one project', icon: 'gcs' },
      ],
    },
    {
      type: 'table', id: 'ancestors', title: 'get-ancestors', tone: 'store', columns: ['id', 'type'],
      rows: ancestors.map(([id, type]) => ({ id: `a-${id}`, cells: [id, type] })),
    },
    { type: 'note', id: 'note', tone: 'store', text: 'A project is the unit of billing, APIs and IAM. With an organization above it, policies would flow down from there too.' },
  ],
  edges: [
    { from: 'h-org', to: 'h-folder', dashed: true },
    { from: 'h-folder', to: 'h-project', dashed: true },
    { from: 'h-project', to: 'h-resources' },
  ],
})

// §2.3 — APIs are switched on per project: one refused, then enabled.
const enabled = outputOf(s3, 'gcloud services list --enabled --format="value(config.name)" | wc -l').trim()
const zones3 = outputOf(s3, 'gcloud compute zones list --filter=name~europe-west2 --format="value(name)"').split('\n').filter(Boolean)

export const howApis: SceneModel = labFrame({
  session: s3,
  side: [
    RECORDED,
    {
      type: 'group', id: 'switch', title: 'One project, its switched-on APIs', icon: 'gcpproject', tone: 'infra', minH: 560, children: [
        { type: 'item', id: 'a-project', title: 'sun-media-dev', sub: `${enabled} APIs enabled`, icon: 'gcpproject' },
        { type: 'item', id: 'a-off', title: 'compute.googleapis.com: off', sub: 'the call is refused: SERVICE_DISABLED', icon: 'lock', tone: 'consume' },
        { type: 'item', id: 'a-enable', title: 'gcloud services enable', sub: 'switched on, for this project only', icon: 'zap' },
        { type: 'item', id: 'a-on', title: `the same call: ${zones3.length} zones`, sub: zones3.sort().join(', '), icon: 'server', tone: 'store' },
      ],
    },
    {
      type: 'table', id: 'calls', title: 'The same call, before and after', tone: 'store', columns: ['command', 'answer'], rows: [
        { id: 'c-before', cells: ['compute zones list', 'SERVICE_DISABLED'], tone: 'consume' },
        { id: 'c-enable', cells: ['services enable compute', 'finished successfully'] },
        { id: 'c-after', cells: ['compute zones list', `${zones3.length} zones`], tone: 'store' },
      ],
    },
    { type: 'note', id: 'note', tone: 'store', text: 'An API is switched on per project. From Course 3, Terraform switches on what the platform needs (google_project_service); this one switch is the CLI’s.' },
  ],
  edges: [
    { from: 'a-project', to: 'a-off' },
    { from: 'a-off', to: 'a-enable' },
    { from: 'a-enable', to: 'a-on' },
  ],
})

// §2.4 — control plane vs data plane: the bucket as a resource, and its objects.
const uris = [...s4.replace(/\n(?!\$|uri:)/g, '').matchAll(/^uri: (\S+)/gm)].map((m) => m[1].split('?')[0])
const [loc, cls] = ['location', 'default_storage_class'].map((k) => new RegExp(`${k}: (\\S+)`).exec(s4)![1])
const objects = outputOf(s4, 'gcloud storage ls $B | wc -l').trim()

export const howPlanes: SceneModel = labFrame({
  session: s4,
  side: [
    RECORDED,
    {
      type: 'group', id: 'planes', title: 'One bucket, two kinds of request', icon: 'gcs', tone: 'infra', dir: 'row', children: [
        {
          type: 'group', id: 'control', title: 'control plane', sub: 'the bucket as a resource', icon: 'settings', tone: 'infra', minH: 470, children: [
            { type: 'item', id: 'c-uri', title: '/storage/v1/b/{bucket}', sub: `its settings: ${loc}, ${cls}`, icon: 'settings' },
            { type: 'item', id: 'c-who', title: 'create, configure, set policy', sub: 'what Terraform does', icon: 'terraform' },
          ],
        },
        {
          type: 'group', id: 'data', title: 'data plane', sub: 'what it holds', icon: 'database', tone: 'store', minH: 470, children: [
            { type: 'item', id: 'd-uri', title: '/storage/v1/b/{bucket}/o', sub: `its objects: ${objects} at the top level`, icon: 'file' },
            { type: 'item', id: 'd-who', title: 'read, write, list', sub: 'what the pipeline does', icon: 'workflow' },
          ],
        },
      ],
    },
    {
      type: 'table', id: 'uris', title: 'The two URIs gcloud called (--log-http)', tone: 'store', columns: ['request', 'path'],
      rows: uris.map((u, i) => ({ id: `u-${i}`, cells: [i === 0 ? 'describe' : 'ls', u.replace('https://storage.googleapis.com', '')] })),
    },
    { type: 'note', id: 'note', tone: 'store', text: 'gs://cloud-samples-data is Google’s public sample bucket: anyone may read it, so this lab reads without creating anything.' },
  ],
  edges: [
    { from: 'c-uri', to: 'c-who' },
    { from: 'd-uri', to: 'd-who' },
  ],
})

// §2.5 — Console, gcloud, Terraform: one API underneath.
const gcloudUri = /uri: (\S+)/.exec(s5.replace(/\n(?!\$|uri:|method:)/g, ''))![1].split('?')[0]
const curl = JSON.parse(outputOf(s5, "curl -s -H \"Authorization: Bearer $T\" $U | jq -c '{projectId,projectNumber}'"))
const tfNumber = /"number" = "(\d+)"/.exec(s5)![1]

export const howThreeClients: SceneModel = labFrame({
  session: s5,
  side: [
    RECORDED,
    {
      type: 'group', id: 'clients', title: 'Three clients, one REST API', icon: 'workflow', tone: 'infra', dir: 'row', minH: 560, children: [
        {
          type: 'group', id: 'callers', bare: true, children: [
            { type: 'item', id: 'k-gcloud', title: 'gcloud', sub: 'what Priya types', icon: 'terminal' },
            { type: 'item', id: 'k-curl', title: 'curl + a token', sub: 'the bare HTTP request', icon: 'code' },
            { type: 'item', id: 'k-tf', title: 'Terraform', sub: 'the google provider', icon: 'terraform' },
            { type: 'item', id: 'k-console', title: 'the Console', sub: 'the same calls, from a browser', icon: 'screen', muted: true },
          ],
        },
        {
          type: 'group', id: 'k-api', title: 'one API', sub: 'cloudresourcemanager.googleapis.com', icon: 'gcpproject', tone: 'store', minH: 330,
          children: [{ type: 'item', id: 'k-get', title: 'GET /v1/projects/{id}', sub: 'the same request, whoever sends it', icon: 'code' }],
        },
      ],
    },
    {
      type: 'table', id: 'answers', title: 'The same project, three times', tone: 'store', columns: ['client', 'project', 'number'], rows: [
        { id: 'r-gcloud', cells: ['gcloud', gcloudUri.split('/').at(-1)!, '—'] },
        { id: 'r-curl', cells: ['curl', curl.projectId, curl.projectNumber] },
        { id: 'r-tf', cells: ['Terraform', curl.projectId, tfNumber] },
      ],
    },
  ],
  edges: [
    { from: 'k-gcloud', to: 'k-api' },
    { from: 'k-curl', to: 'k-api' },
    { from: 'k-tf', to: 'k-api' },
    { from: 'k-console', to: 'k-api', dashed: true },
  ],
})
