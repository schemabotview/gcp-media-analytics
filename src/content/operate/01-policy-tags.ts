import type { Section } from '../types'

export const policyTags: Section = {
  id: 'policy-tags',
  title: 'Policy tags',
  scene: 'op-policy-tags',
  narration:
    "The C R M holds every household's email and phone number. Analysts need households; almost nobody needs to contact them. The output is mocked. The editor shows column-level security in Terraform. A taxonomy, sun p i i, names what Sun treats as sensitive. A policy tag inside it, contact, means a way to reach a person. Only one group, p i i readers, is granted fine-grained read on that tag. Then Silver gains a households table, and its email and phone columns carry the tag. In the terminal, the table is filled with the night's five thousand households. A query for household, region and exchange works as always. The same query asking for email is refused, naming the tag and the column. Priya owns this project and is still refused: access to a tagged column is granted per tag, never inherited from a role on the table or the project. The side pane draws the chain: taxonomy, tag, column, reader. The table stays useful to everyone; the two columns that identify a person stay with the few who need them. Next, the same data as a file, outside BigQuery.",
}
