import type { Course } from '../types'
import { pathsAsPartitions } from './02-paths-as-partitions'
import { theNightlyExtracts } from './03-the-nightly-extracts'
import { theManifest } from './04-the-manifest'
import { g1Fails } from './05-g1-fails'

// Course 5 · Cloud Storage, and a batch you can trust (the pilot). §2–§5 run locally: real
// PostgreSQL, the raw zone on fake-gcs-server. §1 and §6–§8 are recorded on GCP and are not authored
// yet: they need the recording secrets (CLAUDE.md, "Status").
export const land: Course = {
  id: 'land',
  title: 'Cloud Storage, and a batch you can trust',
  sections: [pathsAsPartitions, theNightlyExtracts, theManifest, g1Fails],
}
