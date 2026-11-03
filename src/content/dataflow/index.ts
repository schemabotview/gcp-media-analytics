import type { Course } from '../types'
import { beamsModel } from './01-beams-model'
import { aFirstPipeline } from './02-a-first-pipeline'
import { eventAndProcessingTime } from './03-event-and-processing-time'
import { fixedWindows } from './04-fixed-windows'
import { watermarksAndLateData } from './05-watermarks-and-late-data'
import { dedupeInTheStream } from './06-dedupe-in-the-stream'
import { sessionsSection } from './07-sessions'
import { intoBigquery } from './08-into-bigquery'
import { onDataflow } from './09-on-dataflow'

// Course 7 · Counting viewers while the match plays. §1–§7 run locally (Beam's Python direct
// runner); §8–§9 recorded on GCP.
export const dataflow: Course = {
  id: 'dataflow',
  title: 'Counting viewers while the match plays',
  sections: [beamsModel, aFirstPipeline, eventAndProcessingTime, fixedWindows, watermarksAndLateData, dedupeInTheStream, sessionsSection, intoBigquery, onDataflow],
}
