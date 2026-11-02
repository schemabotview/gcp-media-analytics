import type { Section } from '../types'

export const theNightlyExtracts: Section = {
  id: 'the-nightly-extracts',
  title: 'The nightly extracts: a snapshot and a window',
  scene: 'land-extracts',
  narration:
    "Sun's C R M and its billing system are PostgreSQL databases, running here for real, and each night their data has to reach the raw zone. Extract dot p y copies them, and the top of the editor declares the two shapes an extract can take. The C R M is a snapshot: households, subscriptions and packages are small enough to copy whole, every night. Billing is incremental: it posts charges all day, so each night copies only the charges updated inside that night's window, after midnight and up to the next midnight. The highlighted where clause is that window, and getting its two boundaries right is most of the work. Both extracts stream the rows out of PostgreSQL as C S V, upload one file per table under the night's partition, and finish by writing an empty object called underscore success, which says the night is complete. The terminal runs both for the thirtieth of October, the night before the derby. The C R M lands five thousand households, five thousand and one subscription versions and four packages. Billing prints its window, then lands one thousand and fifty one charges. The last command lists every marker in the raw zone: both folders are closed. The side pane draws the two paths: the C R M copied whole, billing copied by window. The table repeats the counts and says which rows each file holds. One thing in this code is too trusting. The marker is written whatever the copy delivered, and nothing checks that the copy was complete. Next, before copying the derby night, we write down what the copy is supposed to deliver.",
}
