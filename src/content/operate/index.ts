import type { Course } from '../types'
import { policyTags } from './01-policy-tags'
import { dlpSection } from './02-dlp'
import { lineageSection } from './03-lineage'
import { dataQuality } from './04-data-quality'
import { logging } from './05-logging'
import { alerts } from './06-alerts'
import { twoEnvironments } from './07-two-environments'
import { cloudBuild } from './08-cloud-build'
import { whereNext } from './09-where-next'

// Course 12 · Protect it, watch it, ship it. MOCKED (the owner's call, 2026-11-03).
export const operate: Course = {
  id: 'operate',
  title: 'Protect it, watch it, ship it',
  sections: [policyTags, dlpSection, lineageSection, dataQuality, logging, alerts, twoEnvironments, cloudBuild, whereNext],
}
