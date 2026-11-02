import type { Course } from '../types'
import { buckets } from './01-buckets'
import { pathsAsPartitions } from './02-paths-as-partitions'
import { theNightlyExtracts } from './03-the-nightly-extracts'
import { theManifest } from './04-the-manifest'
import { g1Fails } from './05-g1-fails'
import { retrySafe } from './06-retry-safe'
import { retention } from './07-retention'
import { lifecycle } from './08-lifecycle'

// Course 5 · Cloud Storage, and a batch you can trust (the pilot). §2–§5 run locally: real
// PostgreSQL, the raw zone on fake-gcs-server. §1 and §6–§8 are recorded on GCP.
export const land: Course = {
  id: 'land',
  title: 'Cloud Storage, and a batch you can trust',
  sections: [buckets, pathsAsPartitions, theNightlyExtracts, theManifest, g1Fails, retrySafe, retention, lifecycle],
}
