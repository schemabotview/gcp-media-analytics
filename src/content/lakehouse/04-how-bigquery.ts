import type { Section } from '../types'

export const howBigquery: Section = {
  id: 'how-bigquery',
  title: 'How BigQuery runs a query',
  scene: 'lake-how',
  narration:
    "BigQuery has no server to size and no index to build, and it still reads a night of events in under a second. This step was recorded on Google Cloud. BigQuery keeps storage and compute apart. Tables are stored by column in Google's distributed file system, so a query reads only the columns it names. The work is done by slots, units of compute borrowed for the length of a query, connected to storage by a very fast network. The editor shows the query: each channel's busiest minute of the night, a count of distinct households per channel and minute, then the top minute per channel. In the terminal a small script runs it with a cap on bytes billed and prints the plan BigQuery made. The rows come first: SUN-SPORTS-1 peaks at eighteen forty one with two thousand one hundred and forty households, far above every other channel. Then the cost: about twelve million bytes, only the four columns the query names, and just over a second of slot time. The plan reads in stages. The input stage scans every row and passes on the ones it needs; the aggregate stages shrink them to one per channel and minute, then one per channel. The side pane shows the plan beside the machine that ran it. Next, making the same question read less.",
}
