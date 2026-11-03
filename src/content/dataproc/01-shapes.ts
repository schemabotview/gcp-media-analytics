import type { Section } from '../types'

export const shapes: Section = {
  id: 'shapes',
  title: 'Dataproc’s shapes',
  scene: 'proc-shapes',
  narration:
    "BigQuery answers most of the night's questions in S Q L. One question is heavier: joining every box's viewing to the network's own measurements, exchange by exchange, minute by minute, to see where the picture broke. That is a job for Spark, and on Google Cloud Spark runs on Dataproc. Dataproc comes in three shapes, and the difference is what is left to manage. On the left, a cluster: virtual machines that Dataproc installs Spark on. Priya chooses how many and how big, and pays while they are up, busy or idle, until she deletes them. In the middle, Dataproc Serverless: she hands over a PySpark file and its arguments, Google starts the executors that batch needs, scales them, and removes them when it ends; the bill is the compute the batch used. On the right, Dataproc on G K E, for teams that already run Kubernetes and want Spark as pods beside everything else. This frame is a concept, and its label cites Google's Dataproc overviews. viewing pulse runs one heavy batch a night, so it uses Serverless: no cluster sits idle between derbies. From this course on, the frames' outputs are mocked: written to match the code and the night's facts, and labelled as such. Next, the same Spark code, on this laptop first.",
}
