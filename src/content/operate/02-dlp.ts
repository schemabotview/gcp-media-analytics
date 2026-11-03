import type { Section } from '../types'

export const dlpSection: Section = {
  id: 'dlp',
  title: 'Sensitive Data Protection',
  scene: 'op-dlp',
  narration:
    "Policy tags protect a column in BigQuery. A C S V extract in a bucket has no columns to tag, and extracts get copied, attached and shared. Sensitive Data Protection finds what is personal in any text, and can rewrite it. The output is mocked. The editor shows a small script. It reads the night's households extract from the raw zone and sends it to the service as a table, asking for three kinds of information: email addresses, phone numbers and people's names, reported only when likely or surer. In the terminal the inspection finds them where they are: five thousand emails, five thousand phone numbers, and a person's name in both name columns. The second step de-identifies: every finding is replaced by the name of its kind. The first rows of the redacted file show it: names, email and phone become their labels, while household, postcode and region survive, so the file still serves analysis. The side pane follows a finding from inspection to the masked file. Next, the question every auditor asks first: where did this number come from?",
}
