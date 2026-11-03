import type { SceneModel } from '@graphlearning/graphl-flow'
import { howApis, howHierarchy, howPlanes, howRegions, howThreeClients } from './labs'
import { howMeters, howServerless } from './concepts'

export const howScenes: Record<string, SceneModel> = {
  'how-regions': howRegions,
  'how-hierarchy': howHierarchy,
  'how-apis': howApis,
  'how-planes': howPlanes,
  'how-three-clients': howThreeClients,
  'how-serverless': howServerless,
  'how-meters': howMeters,
}
