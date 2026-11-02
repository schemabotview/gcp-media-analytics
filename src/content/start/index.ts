import type { Course } from '../types'
import { fiveSources } from './01-five-sources'
import { theCrm } from './02-the-crm'
import { catalogueAndEpg } from './03-catalogue-and-epg'
import { anEventsLife } from './04-an-events-life'
import { signingIn } from './05-signing-in'
import { firstTerraform } from './06-first-terraform'
import { theState } from './07-state'
import { modulesBudget } from './08-modules-budget'

// Course 3 · The sources, and a first deployment. §1–§4 run locally (PostgreSQL 18.6, sun_gen's
// data); §5–§8 are recorded on GCP, in the owner's project.
export const start: Course = {
  id: 'start',
  title: 'The sources, and a first deployment',
  sections: [fiveSources, theCrm, catalogueAndEpg, anEventsLife, signingIn, firstTerraform, theState, modulesBudget],
}
