import type { TreeEntry } from '@graphlearning/graphl-flow'
import { projectTree } from '../tree'

// Course 3's explorer: viewing-pulse as the spine holds it at each step, and sun_gen's data/, muted.
export function startTree(active: string, files: string[], fresh: string[] = [active]): TreeEntry[] {
  return projectTree(['sources/README.md', ...files], { active, fresh, made: { 'data/': 'sun_gen' } })
}

export const CRM_FILES = ['sources/load.sh', 'sources/crm/schema.sql', 'sources/crm/load.sql', 'sources/crm/mix.sql',
  'sources/crm/history.sql', 'sources/billing/schema.sql', 'sources/billing/load.sql']
