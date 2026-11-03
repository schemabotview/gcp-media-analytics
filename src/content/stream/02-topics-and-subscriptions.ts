import type { Section } from '../types'

export const topicsAndSubscriptions: Section = {
  id: 'topics-and-subscriptions',
  title: 'Topics and subscriptions: three streams, in Terraform',
  scene: 'stream-topics',
  narration:
    "Pub Sub has two kinds of resource, and the new Terraform module creates both. A topic is where publishers send messages. A subscription is a reader's own queue on a topic, and every subscription gets its own copy of every message. The editor shows the module. Three topics, one for each kind of message: viewing events, network telemetry and device events. Each keeps its messages for a day, so a night can be replayed. A fourth topic, dead letter, is for messages nobody can read. Then Dataflow's subscriptions, one per topic, with two settings that matter. The acknowledgement deadline is twenty seconds: a reader that takes a message must confirm it within that time, or it's delivered again. And the dead letter policy: after five failed deliveries, a message is moved aside instead of being retried forever. In the terminal, the apply adds thirteen resources: the A P I, the four topics, the four subscriptions, and the grants that let Pub Sub's own service agent move dead letters. The two listings, filtered to this platform's label, show the topics and the subscriptions. The side pane draws the fan out. The boxes publish to topics. The table below lists each subscription and who reads it: Dataflow in the next course, and a person for the dead letters. Next, the boxes publish, on Priya's laptop.",
}
