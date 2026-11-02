import type { Section } from '../types'

export const g1Fails: Section = {
  id: 'g1-fails',
  title: 'G1 fails: the night billing came up short',
  scene: 'land-g1-fails',
  narration:
    "This is a night that goes wrong, run once and then thrown away, so the course carries on from the manifest. The new file is g one dot p y, the landing gate. It reads the manifest, lists the night's folder, and checks three things: every promised file is there, its columns are the declared ones in order, and its rows add up to the expected count. Each check prints what it found against what was promised. Only when all of them match does the gate publish the night, by writing the underscore success marker. The copy no longer writes that marker itself. In the terminal, the copy lands one thousand and sixty five rows. G one compares: one file of one, eight columns of eight, and one thousand and sixty five rows of one thousand and sixty eight. Fail. The night is not published, and asking for the last published night still answers the thirtieth of October. The last command shows why: the newest change in billing is stamped four seconds past two in the morning, after the window closed. The side pane tells the story in order. At two o'clock, plan counted one thousand and sixty eight charges. Four seconds later, billing's own job re-rated three of the night's rentals, and their updated time moved past the window's end, out of tonight's copy. Nothing crashed and no error was raised. Without the gate, a short night would have flowed on to BigQuery and into the morning's numbers. Next, on Google Cloud itself: making a rerun safe, and sealing a night so nothing can overwrite it.",
}
