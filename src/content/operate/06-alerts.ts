import type { Section } from '../types'

export const alerts: Section = {
  id: 'alerts',
  title: 'Alerts',
  scene: 'op-alerts',
  narration:
    "During a match, nobody is reading logs. If the live count goes wrong, someone must be told. The output is mocked. The editor shows one alert policy in Terraform. Its metric is the age of the oldest message on Dataflow's subscription that nobody has acknowledged yet. While the job keeps up, that age stays at seconds. If the job stops, or falls behind, it climbs. The condition opens an incident when the age is over three hundred seconds for two minutes, so a single slow moment doesn't wake anyone. The notification goes to the email channel made with the budget in Course 3, and the documentation field tells whoever reads it the first command to run. In the terminal, Terraform adds the policy, and the list of alert policies shows it enabled. The incident closes itself when the job catches up. The side pane draws the chain: the metric, the policy, the channel. It watches the one thing a viewer would notice: a live number that has stopped moving. Next, the same platform, twice.",
}
