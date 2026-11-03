import type { Section } from '../types'

export const orderingKeys: Section = {
  id: 'ordering-keys',
  title: 'Ordering keys: one device, one ordered lane',
  scene: 'stream-ordering',
  narration:
    "Pub Sub delivers messages in parallel, and by default in no particular order. That's how it scales. For a single device, though, order can matter: a stop that arrives before its play makes a confusing session. Ordering keys give one lane to each key. The highlighted lines turn ordering on in the publisher, and give every message an ordering key, the device i d. On the reading side, the subscription viewing events ordered has message ordering switched on. Together they guarantee that messages with the same key are delivered in the order they were published, while messages with different keys still flow in parallel. In the terminal, eight minutes of box one three seven nine five are published with ordering on: fifteen events, buffers and heartbeats from its stalling second half. The ordered subscription returns all fifteen, in publish order: a buffer, the heartbeat that follows it, the next buffer, and so on, minute by minute. The side pane draws the lane. The ordering key is the device. The ordered subscription preserves the key's order, and the table shows the first eight messages as they arrived. One limit is worth stating. An ordering key preserves the order in which messages were published. A box that sends late, or with a wrong clock, still publishes out of event time order, and that's a problem for the counting itself, in the next course. Next, the message nobody can read.",
}
