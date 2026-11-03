import type { Section } from '../types'

export const howGcpCharges: Section = {
  id: 'how-gcp-charges',
  title: 'How GCP charges: a month, in billed units',
  scene: 'how-meters',
  narration:
    "Every Google Cloud service bills by some meter, and a platform's cost is mostly a question of which meters it moves, and how far. This frame is a model, and the label says so: one night's real data sizes, multiplied by thirty, plus three assumptions written at the top of the file. It prints quantities, never prices. A price belongs to the pricing page, on the day you read it. The editor shows the assumptions: two hundred dashboard queries a day, a streaming job running six hours a night, and one Dataflow worker with four virtual C P Us. Everything else is measured from the generated data. In the terminal, the month comes out like this. The raw zone stores about forty three megabytes, which is small. Pub Sub carries just over twelve million messages, about three gigabytes. BigQuery scans around six hundred gigabytes, because every dashboard query reads a day of viewing events. And Dataflow runs seven hundred and twenty v C P U hours. The side pane's table repeats those numbers and marks the two that grow fastest. Below it are the three things that move a meter. How much is kept, which is cheap, and cheaper still as data cools. How much is read: BigQuery bills the bytes each query scans, so partitioning, in Course ten, matters more than storage. And how long something runs: workers bill for as long as they exist, so a finished stream job must be drained. With Google Cloud's building blocks in place, the next course meets Sun's sources and makes the first deployment.",
}
