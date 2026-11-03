import type { Section } from '../types'

export const pullAndAck: Section = {
  id: 'pull-and-ack',
  title: 'Pull and ack: a message comes back until it is handled',
  scene: 'stream-pull-ack',
  narration:
    "Pub Sub hands a message to a reader on loan. The reader has until the acknowledgement deadline to say it was handled. If it doesn't, the message is delivered again. That rule is what makes losing a message so hard, and this lab watches it happen. The editor shows the subscriber. It pulls up to a given number of messages, prints each one, and acknowledges them all, unless told not to. In the terminal, three of one box's heartbeats are published. The first pull takes two and acknowledges them. The second pull takes the third, message three, and doesn't acknowledge it, as if the reader had crashed. The terminal then waits twelve seconds, longer than this subscription's ten second deadline. The last pull asks for up to five messages and gets exactly one: message three again, the same message number and the same event. This time it's acknowledged, and it won't come back. The side pane follows message three: pulled and leased for ten seconds, never acknowledged, and delivered again once the lease ran out. The table lists every message the three pulls returned, with message three appearing twice. So Pub Sub keeps a message until someone acknowledges it. The flip side follows directly. A message can arrive more than once, and a reader has to be ready for that. Next, duplicates on purpose.",
}
