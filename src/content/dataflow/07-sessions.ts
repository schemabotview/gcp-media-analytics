import type { Section } from '../types'

export const sessionsSection: Section = {
  id: 'sessions',
  title: 'Sessions: windows shaped by activity',
  scene: 'flow-sessions',
  narration:
    "Fixed windows cut time into equal slices. Some questions need a window shaped by the viewer instead, like how long someone watched before leaving. A session window does that. It grows while events keep arriving less than a gap apart, and it closes once the gap passes in silence. The file sessions dot p y applies session windows to one device's derby night, with the gap as a parameter, and counts the events in each session. In the terminal it runs three times. Box one zero zero zero two with a thirty minute gap: one session, from nine minutes past five to nineteen thirty seven, a hundred and nine events. The same box with a ten minute gap: two sessions, one ending at eighteen twenty seven and another starting at eighteen thirty nine. This household left at half time and came back twenty two minutes later. With a thirty minute gap the break disappears. With ten minutes it shows. Box one three seven nine five, which never left, stays a single session even at ten minutes. Notice each session ends one gap after its last event, because that's when the window knew it was over. The side pane plots each run as bars, one per session, with the times and counts in the table. The gap is a business decision, not a technical one, so it's stated in the code. Next, the counts go into BigQuery, on Google Cloud.",
}
