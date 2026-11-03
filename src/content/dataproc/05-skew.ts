import type { Section } from '../types'

export const skew: Section = {
  id: 'skew',
  title: 'The derby skew',
  scene: 'proc-skew',
  narration:
    "This is a failure step: the job is right, and slower than it needs to be. The editor shows a join of the night's events to the catalogue, by title, with Spark's adaptive execution switched off and the shuffle in eight partitions. A shuffle sends every row to a partition chosen by its key's hash, so all the rows of one title land in the same task. The terminal shows the result, and then, from Spark's own monitoring A P I, how many rows each of the eight tasks read. One task read two hundred and fifty nine thousand, six hundred and twenty three rows. The next read under thirty nine thousand. The derby is one title and sixty two percent of the night, so one task carries it, and the whole stage waits for that task while the others sit finished. On a laptop that costs seconds. On a busy night on Dataproc it costs the batch's whole schedule, and more executors don't help, because a single partition can only run on one. The side pane draws the eight tasks: one bar, and seven stubs. Next, two ways to split the derby's partition.",
}
