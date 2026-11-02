import type { SceneModel } from '@graphlearning/graphl-flow'
import { landPartitions } from './partitions'
import { landExtracts } from './extracts'
import { landManifest } from './manifest'
import { landG1Fails } from './g1-fails'
import { landBuckets, landLifecycle, landRetention, landRetrySafe } from './gcp'

export const landScenes: Record<string, SceneModel> = {
  'land-buckets': landBuckets,
  'land-partitions': landPartitions,
  'land-extracts': landExtracts,
  'land-manifest': landManifest,
  'land-g1-fails': landG1Fails,
  'land-retry-safe': landRetrySafe,
  'land-retention': landRetention,
  'land-lifecycle': landLifecycle,
}
