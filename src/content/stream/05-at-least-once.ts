import type { Section } from '../types'

export const atLeastOnce: Section = {
  id: 'at-least-once',
  title: 'At-least-once: the same event, twice',
  scene: 'stream-at-least-once',
  narration:
    "Pub Sub promises that every message is delivered at least once. It doesn't promise exactly once, and the replay's retries make that visible. The editor shows a counter. It drains a subscription, acknowledging everything, and counts two things separately: message numbers, which Pub Sub gives every message it accepts, and event i ds, which the box gave the event. In the terminal, five minutes from half past six are published, and the producer reports twenty three retries. The counter drained nine thousand two hundred and fifty five messages, but only nine thousand two hundred and thirty two distinct events. Twenty three events arrived twice, as two different messages carrying the same event i d, and one is printed as an example. Nothing failed here. Each copy was a valid message, delivered and acknowledged once. The duplication happened before Pub Sub, at the publisher, and from Pub Sub's point of view there are simply two messages. The side pane's table lays out the three counts. Below it, who removes the second copy. Pub Sub doesn't. The Dataflow job will drop repeated event i ds inside each counting window, so the live curve isn't inflated. And next morning, Silver keeps exactly one row per event i d, whatever arrived. Counting messages instead of events would have overstated the derby. Next, keeping one device's events in order.",
}
