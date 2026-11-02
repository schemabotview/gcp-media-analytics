import type { SceneModel } from '@graphlearning/graphl-flow'
import { startFiveSources } from './five-sources'
import { startCrm } from './crm'
import { startCatalogueEpg } from './catalogue-epg'
import { startEventLife } from './event-life'
import { startFirstTerraform, startModulesBudget, startSigningIn, startState } from './gcp'

export const startScenes: Record<string, SceneModel> = {
  'start-five-sources': startFiveSources,
  'start-crm': startCrm,
  'start-catalogue-epg': startCatalogueEpg,
  'start-event-life': startEventLife,
  'start-signing-in': startSigningIn,
  'start-first-terraform': startFirstTerraform,
  'start-state': startState,
  'start-modules-budget': startModulesBudget,
}
