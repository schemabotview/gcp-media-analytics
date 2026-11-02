import type { TreeEntry } from '@graphlearning/graphl-flow'
import { projectTree } from '../tree'

// Course 5's explorer: viewing-pulse as the spine holds it, plus what runs made there — the venv and
// sun_gen's data/ (the source systems' seed and the vendors' files) — drawn muted.
const BASE = ['env.sh', 'requirements.txt', 'sources/crm/schema.sql', 'sources/crm/load.sql', 'sources/billing/schema.sql',
  'sources/billing/load.sql', 'extract/raw.py']

export function landTree(active: string, { extra = [], fresh = [] }: { extra?: string[]; fresh?: string[] } = {}): TreeEntry[] {
  return projectTree([...BASE, ...extra], {
    active, fresh, closed: ['sources/crm', 'sources/billing'],
    made: { '.venv/': 'Python 3.14.9', 'data/': 'sun_gen' },
  })
}
