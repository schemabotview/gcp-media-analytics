import type { Section } from '../types'

export const g2: Section = {
  id: 'g2',
  title: 'G2: rows set aside',
  scene: 'lake-g2',
  narration:
    "Bronze keeps everything, including rows that would quietly corrupt an answer. Gate two decides which rows Silver may trust. This step was recorded on Google Cloud. The editor shows the judgement. Every row of the night is checked against two rules: it must carry an event I D, or it can never be deduplicated, and its title must be in the catalogue, which the vendor delivers to the raw zone and BigQuery reads in place. A row that breaks a rule gets a reason. The failing rows are copied to a quarantine table with that reason, and the gate's verdict is written to the audit dataset. G2 does not stop the night for a handful of bad rows; it passes while fewer than one row in a thousand is quarantined, because past that the delivery itself is broken. In the terminal, Terraform adds the quarantine and audit tables and the catalogue's external table. The script quarantines seven rows: four heartbeats that arrived with no event I D, a fault in one batch of firmware, and three that name T nine nine nine nine, a title Sun has never listed. The side pane shows the split: most rows go on to Silver, the seven wait in quarantine, each with its reason. Next, Silver itself.",
}
