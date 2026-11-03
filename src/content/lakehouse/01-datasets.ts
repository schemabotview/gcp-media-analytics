import type { Section } from '../types'

export const datasets: Section = {
  id: 'datasets',
  title: 'Datasets and location',
  scene: 'lake-datasets',
  narration:
    "The stream answers while the match is on. The batch answers next morning, and checks its answer, and that work happens in BigQuery. This step was recorded on Google Cloud. In BigQuery, tables live in datasets, and a dataset fixes two things for good: where its data is stored, and who may read it. The editor shows the module Terraform applies: one dataset per layer. Bronze holds the night as it was delivered, with a note of where every row came from. Silver holds what it means: one row per real event, in Sun's own names. Gold holds the answers the business asks for. And audit holds every gate's verdict, every night, so a number in Gold can always be traced to the checks it passed. All four sit in London, beside the raw bucket, because a query cannot join tables stored in different locations. In the terminal, the apply adds the four datasets, and b q l s lists them, with Course 7's live dataset beside them. The side pane shows the path the night will take: from Bronze, judged and deduplicated, into Silver; from Silver, into the answers. Next, the night's viewing arrives, and BigQuery reads it where it lies.",
}
