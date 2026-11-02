import type { Course } from '../types'
import { fiveSources } from './01-five-sources'
import { theCrm } from './02-the-crm'
import { catalogueAndEpg } from './03-catalogue-and-epg'
import { anEventsLife } from './04-an-events-life'

// Course 3 · The sources, and a first deployment. §1–§4 run locally (PostgreSQL 18.6, sun_gen's
// data). §5–§8 are recorded on GCP: their steps are prepared in spine/start/05… and are authored
// once recorded (CLAUDE.md, "Status").
export const start: Course = {
  id: 'start',
  title: 'The sources, and a first deployment',
  sections: [fiveSources, theCrm, catalogueAndEpg, anEventsLife],
}
