import type { Section } from '../types'

export const deadLetters: Section = {
  id: 'dead-letters',
  title: 'Dead letters: five attempts, then set aside',
  scene: 'stream-dead-letters',
  narration:
    "Sooner or later something publishes a message no reader can understand. If the reader refuses it, Pub Sub delivers it again, and again, forever, and it blocks nothing else but wastes everything. The dead letter policy from this course's Terraform puts a limit on that. This was recorded on Google Cloud. The editor shows a strict subscriber. Anything that isn't valid J S O N, it refuses with a negative acknowledgement, a nack, and it prints which delivery attempt it was. In the terminal, a broken message is published to viewing events: a J S O N object cut off halfway. The strict subscriber watches for seventy five seconds. Attempt one, not J S O N, nack. Attempts two, three and four the same, ten seconds apart, the subscription's retry policy. Attempt five, nack, and then nothing: the subscription has given up on it. The last command pulls from dead letter audit, and there it is. The broken body, plus attributes Pub Sub added when it moved the message: the delivery count, five, the subscription and project it came from, and when it was first published. The side pane draws that path: a poison message, five deliveries, the dead letter topic, and a person reading it with its history attached. The table lists those attributes. With every box's events arriving and nothing lost, the next course counts viewers while the match plays.",
}
