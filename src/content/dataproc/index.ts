import type { Course } from '../types'
import { shapes } from './01-shapes'
import { pysparkLocally } from './02-pyspark-locally'
import { bigqueryConnector } from './03-bigquery-connector'
import { bufferingRatio } from './04-buffering'
import { skew } from './05-skew'
import { fixingSkew } from './06-fixing-skew'
import { serverless } from './07-serverless'
import { writingBack } from './08-writing-back'

// Course 9 · Spark for the heavy join. MOCKED: no step was recorded (the owner's call, 2026-11-03).
export const dataproc: Course = {
  id: 'dataproc',
  title: 'Spark for the heavy join',
  sections: [shapes, pysparkLocally, bigqueryConnector, bufferingRatio, skew, fixingSkew, serverless, writingBack],
}
