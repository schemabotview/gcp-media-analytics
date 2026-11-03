import type { Course } from '../types'
import { datasets } from './01-datasets'
import { externalTables } from './02-external-tables'
import { bronze } from './03-bronze'
import { howBigquery } from './04-how-bigquery'
import { partitioning } from './05-partitioning'
import { g2 } from './06-g2'
import { silver } from './07-silver'
import { scd2 } from './08-scd2'
import { g3 } from './09-g3'

// Course 8 · BigQuery: Bronze and Silver. Every section recorded on GCP.
export const lakehouse: Course = {
  id: 'lakehouse',
  title: 'BigQuery: Bronze and Silver',
  sections: [datasets, externalTables, bronze, howBigquery, partitioning, g2, silver, scd2, g3],
}
