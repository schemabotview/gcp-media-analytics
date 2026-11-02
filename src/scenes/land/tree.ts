import type { TreeEntry } from '@graphlearning/graphl-flow'
import { projectTree } from '../tree'

// Course 5's explorer: viewing-pulse as the spine holds it, plus what runs made there — the venv and
// sun_gen's data/ (the source systems' seed and the vendors' files) — drawn muted. Courses 3–4's
// infra/ and sources/ are there, closed.
const BASE = ['env.sh', 'gcp.sh', 'requirements.txt', 'sources/README.md', 'infra/main.tf', 'extract/raw.py']

export function landTree(active: string, { extra = [], fresh = [] }: { extra?: string[]; fresh?: string[] } = {}): TreeEntry[] {
  return projectTree([...BASE, ...extra], {
    active, fresh, closed: ['infra', 'sources'],
    made: { '.venv/': 'Python 3.14.9', 'data/': 'sun_gen' },
  })
}
