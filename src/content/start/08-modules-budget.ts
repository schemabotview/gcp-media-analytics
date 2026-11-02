import type { Section } from '../types'

export const modulesBudget: Section = {
  id: 'modules-budget',
  title: 'Modules and a budget: code that grows, money that alerts',
  scene: 'start-modules-budget',
  narration:
    "Two things change in this step: the code gets a structure that can grow, and the project gets a budget before it costs anything. The raw bucket moves into a module, a folder of Terraform with its own inputs, and a moved block tells Terraform it's the same bucket under a new address, not a new one to create. The editor shows the budget file. A budget of fifty pounds a month, for this project only, with two threshold rules at eighty percent: one on money already spent, one on the month's forecast. Below them, outside the folded view, every alert is routed to a Monitoring email channel for the media data team. A Google Cloud budget never stops anything. It only warns. In the terminal, terraform fmt checks the formatting before anything touches the cloud, and the code is validated too. Then the apply. The plan reports the bucket moved into the module, and four resources to add: the two A P Is the budget needs, the email channel, and the budget itself, created on the billing account in about a second. The side pane draws both parts. On the left, the root file calling the storage module. Below, the budget, its eighty percent rule, and where the email goes. With the sources known, the code in place and spending watched, the next course turns to identity: who, and what, is allowed to touch any of this.",
}
