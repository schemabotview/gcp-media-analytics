import type { Section } from '../types'

export const uniqueHouseholds: Section = {
  id: 'unique-households',
  title: 'Counting unique households',
  scene: 'serve-unique',
  narration:
    "How many households watched anything last night? Gold holds a household count on every row, and adding them up is the obvious answer, and wrong. The output is mocked. The editor shows four ways to ask. Summing Gold's counts gives eight thousand, two hundred and fifty six: a household that watched three titles is counted three times. Counting distinct households in Silver gives three thousand, five hundred and seventy eight, exactly, but it reads every event of the night to do it. Approx count distinct gives the same here; it trades a small, known error, around one percent, for reading and remembering far less, which matters on a billion rows, not on this night. The fourth way uses what Gold stored: a sketch per row, a few kilobytes that summarise which households were seen. Sketches, unlike counts, can be merged, so merging them over every row of the night gives three thousand, five hundred and seventy eight without touching Silver at all. The side pane draws the idea: a sketch per row, one merge, the answer. Every dashboard that asks about households should merge sketches, never add counts. Next, a gate that checks Gold itself.",
}
