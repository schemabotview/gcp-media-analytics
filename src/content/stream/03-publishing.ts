import type { Section } from '../types'

export const publishing: Section = {
  id: 'publishing',
  title: 'Publishing: the derby, replayed sixty times faster',
  scene: 'stream-publishing',
  narration:
    "To work on the stream without waiting for a real Saturday, the producer replays derby night into Pub Sub, as the boxes sent it. On Priya's laptop, Pub Sub is the emulator that ships with g cloud, and the label says so. The file is settop dot p y. It reads the night's events, waits until each event's moment arrives, sixty times faster than real time, and publishes it to the viewing events topic. Each message carries the event itself, as J S O N, and two attributes, the event type and the device, which a subscriber can read without opening the body. One more line is highlighted on purpose. Every four hundredth event is published twice, the way a network retry sends the same thing again. Pub Sub has no way to know the two are the same event. In the terminal, five minutes from half past five are replayed: just over ten thousand events, mostly heartbeats, with a few hundred buffers, plays and stops. The producer published ten thousand four hundred and seven messages, twenty five of them re sent by a retry. Pulling three back shows their message numbers, types, devices and event times. The side pane draws a box's event becoming a message, data plus attributes, on its way to the topic, and the table counts the replay. Next, what reading a message, and acknowledging it, actually means.",
}
