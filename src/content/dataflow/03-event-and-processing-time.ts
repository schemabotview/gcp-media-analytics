import type { Section } from '../types'

export const eventAndProcessingTime: Section = {
  id: 'event-and-processing-time',
  title: 'Event time and processing time: two clocks',
  scene: 'flow-two-clocks',
  narration:
    "Every event carries two times. Event time is when the box says something happened. Processing time is when the platform actually hears about it. Usually they're seconds apart. Not always. The file arrivals dot p y models how derby night's events arrived, and it plants a known fault. Most boxes are heard one to four seconds after the event. One device in every thirty seven is slow, because of a clock that runs minutes behind or a connection that buffers, and is heard four to six minutes late. It also re sends one event in every four hundred, as the producer did in the last course. It's deterministic: the same night always arrives the same way. In the terminal, the sports channel from eighteen thirty eight, six minutes of it: just over fourteen thousand deliveries, from forty six slow boxes. The first rows show three late ones: events from eighteen thirty eight, heard at eighteen forty two, about four and a half minutes late. The next three show normal boxes, heard within a second. The side pane plots event time against processing time. The diagonal line is on time. Most dots would sit on it, while the slow boxes sit well above it. The table repeats the six rows. So if a pipeline counts by the time it hears an event, a slow box's viewing lands in the wrong minute. Next, counting by event time, in windows.",
}
