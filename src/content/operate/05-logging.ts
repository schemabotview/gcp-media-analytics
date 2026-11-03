import type { Section } from '../types'

export const logging: Section = {
  id: 'logging',
  title: 'Cloud Logging',
  scene: 'op-logging',
  narration:
    "Every BigQuery job writes an audit entry when it finishes: who ran it, what it was, and how many bytes it billed. Those entries pass through the log router into Cloud Logging, kept thirty days by default. The output is mocked. The editor shows a saved log query. It asks for finished BigQuery jobs whose labels name the viewing daily D A G, from the night's run. The labels came for free: Airflow's BigQuery operator tags every job with the D A G and task that started it. In the terminal, the query and a table format are read from files, and the night's six jobs come back in order, from Bronze to G4, each with the task that ran it and the bytes it billed. Bronze is the largest, reading the raw files in full; the gates bill BigQuery's ten megabyte minimum. Nothing here was built for monitoring: the platform already explained itself, and a query found it. The side pane draws the path from job, to router, to the query. Next, being told when something is wrong, instead of looking.",
}
