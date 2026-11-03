import type { Section } from '../types'

export const progress: Section = {
  id: 'progress',
  title: 'Three kinds of progress',
  scene: 'orch-progress',
  narration:
    "Every part of viewing pulse can stop halfway: a reader crashes, a job is drained, a night fails. Each lane remembers its progress differently, and each needs its own answer to the same question: after a restart, is anything lost, and is anything counted twice? This frame is a model, a summary of the last six courses, and each claim points at the section that showed it. Pub Sub remembers with the acknowledgement. A message stays until a reader acknowledges it, so a reader that dies is sent it again, and a restart can repeat messages; that is why every lane deduplicates by event I D. Dataflow remembers with the watermark and window state, kept by the service; a drain closes the open windows before stopping, and data later than the allowed lateness is dropped on purpose. The batch remembers with the partition. A night is a date, sealed by its success marker, and Airflow's run is that night; running it again replaces the night, never appends to it. Three mechanisms, one rule: a restart may repeat work, so the work must be safe to repeat. Next course, the last: protecting the data, watching it, and shipping changes safely.",
}
