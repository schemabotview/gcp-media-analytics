import type { Course } from '../types'
import { airflowModel } from './01-airflow-model'
import { theDag } from './02-the-dag'
import { waiting } from './03-waiting'
import { retries } from './04-retries'
import { failedNight } from './05-failed-night'
import { backfill } from './06-backfill'
import { composerSection } from './07-composer'
import { progress } from './08-progress'

// Course 11 · Every night, and the night it fails. MOCKED (the owner's call, 2026-11-03).
export const orchestrate: Course = {
  id: 'orchestrate',
  title: 'Every night, and the night it fails',
  sections: [airflowModel, theDag, waiting, retries, failedNight, backfill, composerSection, progress],
}
