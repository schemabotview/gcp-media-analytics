import type { SceneModel } from '@graphlearning/graphl-flow'
import { startFiveSources } from './five-sources'
import { startCrm } from './crm'
import { startCatalogueEpg } from './catalogue-epg'
import { startEventLife } from './event-life'

export const startScenes: Record<string, SceneModel> = {
  'start-five-sources': startFiveSources,
  'start-crm': startCrm,
  'start-catalogue-epg': startCatalogueEpg,
  'start-event-life': startEventLife,
}
