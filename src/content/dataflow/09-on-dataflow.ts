import type { Section } from '../types'

export const onDataflow: Section = {
  id: 'on-dataflow',
  title: 'On Dataflow: the job that never ends',
  scene: 'flow-dataflow',
  narration:
    "Until now every pipeline ran on this laptop and finished. On Dataflow the same file becomes a job that runs on Google's workers and never finishes by itself. This step was recorded on Google Cloud. Terraform adds what the job needs: the Dataflow API, a bucket for its staged code, and grants for its own service account to read the subscription and write the live table. One grant was learned the hard way. A job that reads event time from a message attribute makes a second subscription of its own to track its watermark, and without the right to create one the job ran, read, and never closed a window. The editor shows the change that mattered most. The job's watermark follows the clock, and this is a replay of Saturday, so every event arrives days late. A live feed would keep ten minutes of lateness; the replay keeps three days, and gathers each minute's late events into a firing every thirty seconds. Because a firing repeats what came before, seconds watched are counted once per event, not added again. In the terminal the job starts, the set-top boxes replay twelve minutes of the second half into Pub/Sub, and after five minutes the job is drained. A drain stops reading, closes every open window, writes what it holds, and stops; a cancel would throw that away. The query reads back what the job wrote: every minute fired twice, and eighteen forty one is the peak again. Next course, the batch: the same night, landed and cleaned in BigQuery.",
}
