import type { Section } from '../types'

export const backfill: Section = {
  id: 'backfill',
  title: 'Backfill, idempotently',
  scene: 'orch-backfill',
  narration:
    "Sometimes past nights must be run again: a bug fixed, a rule changed, a late delivery. That is a backfill, and it is only safe if running a night twice gives the same tables as running it once. The output is mocked. The editor shows Bronze's script as it now begins: delete the night, then insert it. Every layer does the same, keyed by the run's night: Bronze, the quarantine, Silver, Gold, and the Spark batch's partition overwrite. In the terminal, the D A G is backfilled for the thirty first, resetting the existing run. Thirteen tasks succeed. A query counts the night through every layer: four hundred and one thousand, nine hundred and fifty eight rows in Bronze, seven quarantined, four hundred thousand, nine hundred and forty nine in Silver, three hundred and seventy thousand and forty one minutes in Gold, and twelve exchanges. Then the backfill runs again, and every number is the same. Without the deletes, the second run would have doubled Bronze, and G4 would have caught it, but only after the damage. The side pane shows the pattern: delete the night, insert it again, and a rerun changes nothing. Next, where this D A G would run for real.",
}
