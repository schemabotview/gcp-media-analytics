import type { Section } from '../types'

export const whyAStream: Section = {
  id: 'why-a-stream',
  title: 'Why a stream: the match, while it plays',
  scene: 'stream-why',
  narration:
    "The last course built a nightly batch that can be trusted. It extracts at two in the morning and is correct by breakfast. During the derby, though, nobody at Sun can wait until breakfast. The curve on the left is the answer the live lane has to draw: households watching the match, minute by minute, rising from kick off, dipping at half time and peaking in the second half. It was computed in the first course, after the fact, from every event at once. Drawn live, each point has to appear within seconds of the minute it describes. The batch can't do that. At half time it hasn't even started. On the right, the two clocks side by side. The nightly batch: extracts at two, correct by morning, no use at half time. The stream: each box's event, seconds after it happens. Between the boxes and anything that counts them sits Pub Sub, Google Cloud's messaging service. It accepts every message a publisher sends, keeps it, and hands it to every reader that has subscribed. It holds on to each message until that reader acknowledges it. This is a concept frame, and the label cites Google's Pub Sub overview. Pub Sub doesn't count anything itself. It makes sure no box's message is lost while the counting happens somewhere else, in the next course. Next, the topics and subscriptions, written in Terraform.",
}
