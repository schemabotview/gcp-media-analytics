import type { TreeEntry } from '@graphlearning/graphl-flow'
import { SPINE_FILES } from './spine-files'
import { projectTree } from './tree'

/** A step's explorer, from its real project files (scripts/spine-files.mjs): `active` open, `fresh`
 *  marked new, `closed` folders folded, sun_gen's data/ and Terraform's .terraform/ muted. */
export function stepTree(step: string, active: string, { fresh = [active], closed = [] as string[], trim = [] as string[] } = {}): TreeEntry[] {
  const files = SPINE_FILES[step]
  if (!files) throw new Error(`files.ts: no step ${step}`)
  if (!files.includes(active)) throw new Error(`files.ts: ${step} has no ${active}`)
  const made: Record<string, string> = { 'data/': 'sun_gen' }
  if (files.some((f) => f.startsWith('infra/'))) made['infra/.terraform/'] = 'providers'
  if (files.includes('requirements.txt')) made['.venv/'] = 'Python 3.14.9'
  return projectTree(files.filter((f) => f !== 'infra/.terraform.lock.hcl'), { active, fresh, closed, trim, made })
}
