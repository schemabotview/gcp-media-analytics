import type { Section } from '../types'

export const g3: Section = {
  id: 'g3',
  title: 'G3: the minutes the guide forgot',
  scene: 'lake-g3',
  narration:
    "Viewing becomes content performance only when each watched minute is tied to what was on air, and that comes from the programme guide. Gate three asks whether the guide covers every minute boxes watched a channel. This step was recorded on Google Cloud. The vendor's guide is one JSON document of channels and slots, a shape BigQuery cannot read in place, so a small loader flattens it into eighty slots in Silver. The editor shows the check. Each channel's minutes of heartbeats are joined to the slots with a left join, which keeps a minute even when no slot matches, and a minute with no title is counted. In the terminal the answer is plain. Five channels are fully covered. SUN MOVIES two loses three thousand, seven hundred and eighty one box minutes from eight o'clock, two hours the guide has no slot for. An inner join would have dropped them without a word, and the night's film audience would be quietly short. The last query reads the audit table: G2 passed with seven rows quarantined; G3 failed, a hundred and twenty channel minutes without a slot. Gold must not be built on that failure until the guide is fixed. Next course, Spark for the heaviest join of the night.",
}
