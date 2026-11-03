import type { Section } from '../types'

export const writingBack: Section = {
  id: 'writing-back',
  title: 'Writing back to Gold',
  scene: 'proc-write-back',
  narration:
    "A nightly job will one day run twice for the same night, after a retry or a fix, and the second run must not double anything. The terminal's output is mocked. Terraform adds Gold's table for the answer: one row per exchange, partitioned by night. The editor shows the write. With the write flag, the batch saves its result to gold q o s by exchange in overwrite mode, with partition overwrite set to dynamic. Overwrite alone would replace the whole table, every night ever written. Dynamic overwrite replaces only the partitions the result contains: this night, and nothing else. In the terminal the batch runs with write, and a query counts what Gold holds: twelve exchanges for the thirty first, the worst at four point one percent. Then the same batch runs again, exactly as before, and the query returns the same twelve rows, not twenty four. That is what idempotent means for a nightly job: running it again gives the same table. The side pane shows the night's partition replaced, and every other night left alone. The heavy join is done. Next course, the answers themselves: Gold, served cheaply and safely.",
}
