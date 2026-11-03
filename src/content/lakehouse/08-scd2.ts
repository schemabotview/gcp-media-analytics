import type { Section } from '../types'

export const scd2: Section = {
  id: 'scd2',
  title: 'SCD2: a household over time',
  scene: 'lake-scd2',
  narration:
    "A household's package changes, and the report must know which package it had on the night it watched. The frame's output is mocked: the load in the recording was refused for a missing schema, so the corrected load and the merges after it are authored to match the data. Each night's CRM snapshot is loaded into Bronze, with the night read from its path. The editor shows the merge into a slowly changing dimension, type two. Each household's current package is compared with the dimension's current row. If it is new, it is inserted. If the package changed, two things happen in one statement: the old row is closed, its valid to set to the day of the change, and a new row is opened from that day. The trick is that a changed household arrives twice in the source, once under its key to close the old row, and once with no key, so it can only be inserted. In the terminal, the thirtieth makes five thousand current rows. The thirty first, derby day, closes thirty seven, the households that bought Sports for the match, and opens thirty seven. Household ten one two three shows the result: Essentials until the thirty first, Sports from that day, and Sports is the package it had for the derby. Next, the last gate of the night.",
}
