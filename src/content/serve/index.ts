import type { Course } from '../types'
import { contentPerformance } from './01-content-performance'
import { uniqueHouseholds } from './02-unique-households'
import { g4 } from './03-g4'
import { queryCost } from './04-query-cost'
import { authorizedView } from './05-authorized-view'
import { mvBiEngine } from './06-mv-bi-engine'
import { looker } from './07-looker'
import { theAnswer } from './08-the-answer'

// Course 10 · The answer, cheaply and safely. MOCKED (the owner's call, 2026-11-03).
export const serve: Course = {
  id: 'serve',
  title: 'The answer, cheaply and safely',
  sections: [contentPerformance, uniqueHouseholds, g4, queryCost, authorizedView, mvBiEngine, looker, theAnswer],
}
