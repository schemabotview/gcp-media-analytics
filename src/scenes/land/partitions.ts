import type { SceneModel } from '@graphlearning/graphl-flow'
import { lineOf, linesFrom } from '../ide'
import { ideFrame2 } from '../frame'
import { FAKE_GCS } from '../level'
import { landTree } from './tree'
import code from '../../../spine/land/02-partitions/project/extract/raw.py?raw'
import session from '../../../spine/land/02-partitions/session.txt?raw'

// §5.2 — paths as partitions (emulated). The vendors' two files land under source=…/dt=…/; the
// terminal lists the same two objects flat (`**`: whole names, no folders), by delimiter (the
// "folders" gcloud makes up from the slashes) and by a wildcard over one night: a prefix is a filter.
// The table splits one real name, read from the session, into what each part will become.
const name = session.split('\n').find((l) => l.startsWith('gs://') && l.endsWith('.json'))!
const [bucket, source, dt, file] = name.replace('gs://', '').split('/')

export const landPartitions: SceneModel = ideFrame2({
  model: 'A partition is a naming rule',
  tree: landTree('extract/raw.py', { fresh: ['extract/raw.py', 'env.sh', 'requirements.txt'] }),
  editor: { file: 'extract/raw.py', code, show: [[1, lineOf(code, '"""', 2)], [lineOf(code, 'def partition'), lineOf(code, 'return name')]], highlight: [...linesFrom(code, 'Cloud Storage has no folders', 'list like a folder'), lineOf(code, 'return f"source=')] },
  session,
  side: [
    FAKE_GCS,
    {
      type: 'table', id: 'name', title: 'One object, one name', tone: 'store', columns: ['part', 'is', 'BigQuery column'], rows: [
        { id: 'n-bucket', cells: [`gs://${bucket}/`, 'the bucket', '—'] },
        { id: 'n-source', cells: [`${source}/`, 'a prefix', 'source'], tone: 'ingest' },
        { id: 'n-dt', cells: [`${dt}/`, 'a prefix', 'dt'], tone: 'ingest' },
        { id: 'n-file', cells: [file, 'the rest', 'the rows'] },
      ],
    },
    {
      type: 'group', id: 'listing', title: 'Three ways to list the same two objects', icon: 'search', tone: 'ingest', dir: 'row', children: [
        { type: 'item', id: 'l-objects', title: 'two objects', sub: 'flat names, slashes and all', icon: 'file' },
        {
          type: 'group', id: 'l-ways', bare: true, children: [
            { type: 'item', id: 'l-flat', title: 'ls "$RAW/**"', sub: 'every whole name', icon: 'terminal' },
            { type: 'item', id: 'l-folders', title: 'ls $RAW', sub: '“folders”, from the slashes', icon: 'folder' },
            { type: 'item', id: 'l-prefix', title: 'ls "…/dt=2026-10-31/**"', sub: 'one night: a filter', icon: 'filter' },
          ],
        },
      ],
    },
  ],
  edges: [
    { from: 'l-objects', to: 'l-flat' },
    { from: 'l-objects', to: 'l-folders' },
    { from: 'l-objects', to: 'l-prefix' },
  ],
})
