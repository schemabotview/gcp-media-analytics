import type { Section } from '../types'

export const serverlessAndClusters: Section = {
  id: 'serverless-and-clusters',
  title: 'Serverless and managed clusters: who runs what',
  scene: 'how-serverless',
  narration:
    "The services this platform uses fall into two families, and knowing which family a service belongs to tells you what you pay for and what you still have to look after. This is a concept frame, drawn from Google Cloud's documentation, and the label at the top cites the pages. On the left is the serverless family. With BigQuery you send a query, and Google finds the machines to run it. With Pub Sub you send a message, and Google stores it and delivers it. With Dataflow you send a pipeline, and Google starts the workers, scales them up and down, and stops them. You pay for what you use: bytes scanned, messages, worker time. On the right are managed clusters. A Dataproc cluster is a set of machines you choose, and it runs, and bills, until you stop it. Composer is the same idea for Airflow: an environment billed by the hour, which is why this course never leaves one running. Between the two sits Dataproc Serverless, a Spark batch with no cluster to keep, and that's the one Course nine uses. The table draws the responsibility line. Google always runs the machines, their patches and the engine. With a cluster, you also decide how many machines there are. And whichever family a service belongs to, the bottom two rows stay yours: your code and its configuration, and your data and who may read it. Next, a month of this platform, measured in the units Google bills by.",
}
