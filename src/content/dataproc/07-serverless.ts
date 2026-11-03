import type { Section } from '../types'

export const serverless: Section = {
  id: 'serverless',
  title: 'On Dataproc Serverless',
  scene: 'proc-serverless',
  narration:
    "The laptop's answer has to run every night without the laptop. The terminal's output is mocked. Terraform adds what a Serverless batch needs: the Dataproc A P I, a network and subnet whose machines reach Google's services with no public address, a firewall rule so Spark's driver and executors can talk, a bucket for the batch's files, and grants for the batch's service account to read Silver and write Gold. The editor shows the batch's code. It reads Silver through the connector, with the night and the derby pushed down, takes households from the C R M's file in the raw zone, and computes the buffering ratio per exchange. In the terminal, a few variables hold the region, subnet, runtime and service account, and one command submits the batch. Dataproc starts a driver and executors for it, streams the driver's output back, and removes them when it finishes. The answer is the laptop's: E X L D N zero four at four point one percent, every other exchange at zero point six. The side pane shows the batch: a file and its arguments, executors started for it, Silver and the raw zone read. Next, the answer written to Gold, safely.",
}
