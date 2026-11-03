import type { Course } from '../types'
import { whyAStream } from './01-why-a-stream'
import { topicsAndSubscriptions } from './02-topics-and-subscriptions'
import { publishing } from './03-publishing'
import { pullAndAck } from './04-pull-and-ack'
import { atLeastOnce } from './05-at-least-once'
import { orderingKeys } from './06-ordering-keys'
import { deadLetters } from './07-dead-letters'

// Course 6 · Pub/Sub: hearing every box. §2, §7 recorded on GCP; §3–§6 against gcloud's Pub/Sub emulator.
export const stream: Course = {
  id: 'stream',
  title: 'Pub/Sub: hearing every box',
  sections: [whyAStream, topicsAndSubscriptions, publishing, pullAndAck, atLeastOnce, orderingKeys, deadLetters],
}
