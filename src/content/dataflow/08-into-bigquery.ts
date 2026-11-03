import type { Section } from '../types'

export const intoBigquery: Section = {
  id: 'into-bigquery',
  title: 'Into BigQuery: the live table',
  scene: 'flow-bigquery',
  narration:
    "Counts printed in a terminal help nobody watching the match, so the pipeline now writes every minute into BigQuery, where a dashboard can read it. This step was recorded on Google Cloud. Terraform adds the live dataset and its table, concurrent viewers: a minute, a channel, households and seconds watched, partitioned by day, so a query reads only the nights it asks for. The editor shows the change to the pipeline. Each minute's deduplicated count becomes a row, and a new sink writes the rows to BigQuery with streaming inserts, so each one can be queried as soon as it lands. The table isn't created by the pipeline. Terraform made it, and the pipeline refuses to create one. In the terminal, the apply creates the dataset and table. The pipeline then runs over the whole derby, from half past five to half past seven. A hundred and twenty minutes go into BigQuery, ending as the audience drifts away after the final whistle. The last command queries the table with b q, with a cap on bytes billed, as every query in this course has. The top three minutes come back, led by eighteen forty one: two thousand one hundred and forty households, the derby's peak, now in a table. The side pane follows the rows from pipeline to table, and repeats the query's answer. One thing is still local: the pipeline ran on this laptop. Next, the same file on Dataflow.",
}
