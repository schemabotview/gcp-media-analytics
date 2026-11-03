import type { Section } from '../types'

export const beamsModel: Section = {
  id: 'beams-model',
  title: 'Beam’s model: a pipeline is a graph',
  scene: 'flow-model',
  narration:
    "Dataflow runs programs written with Apache Beam, so the first step is Beam's model itself, shown here with the smallest pipeline that does anything. The file is hello dot p y. It starts from six event kinds and turns them into a P Collection, Beam's name for a set of elements flowing through a pipeline. A Map transform turns each kind into a pair: the kind, and the number one. A Combine Per Key transform then brings together every pair with the same key and adds them up. Each step is a P Transform, and each one produces a new P Collection. Nothing changes in place. In the terminal, it prints the totals: one buffer, three heartbeats, one play and one stop. The side pane draws the same thing as a graph: a P Collection, two transforms, a P Collection out. Map works on each element independently, so its work can be split across any number of machines. Combine Per Key needs every element with the same key brought together first, and that grouping is the expensive part on a real cluster. Below the graph is the most useful idea in Beam. The pipeline doesn't say where it runs. The table names two runners. The DirectRunner runs it on this laptop, which is where the rest of this course works. The DataflowRunner hands the identical graph to Google's workers, in the last section. Next, a first real pipeline over derby night's events.",
}
