import type { SceneModel } from '@graphlearning/graphl-flow'
import { landPartitions } from './partitions'
import { landExtracts } from './extracts'
import { landManifest } from './manifest'
import { landG1Fails } from './g1-fails'

export const landScenes: Record<string, SceneModel> = {
  'land-partitions': landPartitions,
  'land-extracts': landExtracts,
  'land-manifest': landManifest,
  'land-g1-fails': landG1Fails,
}
