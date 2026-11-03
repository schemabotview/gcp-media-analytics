import type { Section } from '../types'

export const aFirstPipeline: Section = {
  id: 'a-first-pipeline',
  title: 'A first pipeline: read, parse, count',
  scene: 'flow-first',
  narration:
    "The first real pipeline reads derby night's events and counts them, the simplest useful question to ask of the stream. The file is live viewers dot p y, and it will grow through this whole course. Right now the highlighted lines are a straight chain. Read the night's events, one line each. Parse each line from J S O N into an event. Keep only the events in a five minute slice, here half past six to twenty five to seven. Pair each event with its type, and count per type. In the terminal, five minutes of the derby come out as eight and a half thousand heartbeats, five hundred and ten buffer events, a hundred and eighty two plays and eight stops. Almost everything is heartbeats, as expected for a match with households settled in. The side pane draws the pipeline graph, read, parse, keep the slice, count, with the counts in the table below. One step hides a problem. The slice is a filter on each event's timestamp, so the pipeline has to see every event before it can be sure it has them all. That's fine for a file that already holds the whole night. It doesn't work for a stream, where events are still arriving and some arrive late. A stream needs a different idea of time. Next, the two clocks every event has.",
}
