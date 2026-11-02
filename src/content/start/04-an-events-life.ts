import type { Section } from '../types'

export const anEventsLife: Section = {
  id: 'an-events-life',
  title: 'An event’s life: one box, one derby',
  scene: 'start-event-life',
  narration:
    "Viewing events are the biggest source by far, so it's worth following one box through the derby, event by event. The editor holds a short j q filter. It picks one device's events on the sports channel that evening and prints each event as a row: the time on the box's clock, the event type, the title, the seconds watched and the milliseconds spent buffering. The comments describe the four kinds of event. A box sends play when the picture starts, a heartbeat every minute it keeps playing, buffer when the picture stalls, and stop at the end. The terminal runs it for set-top box one three seven nine five, which is served by exchange L D N zero four. Counting the event types gives one play, one hundred and thirty six heartbeats, forty buffer events and one stop. The trace itself is folded to its turning points. The box starts at ten past five, during the build-up on Sun News. At half past five the heartbeats' title changes to the derby. For the whole first half, buffering stays at zero. Then, from twenty five to seven, the stalls begin, and they keep coming until the final whistle. About five minutes of the second half went on buffering. The side pane draws this box's night, and the fields every event carries. Note that each event's time comes from the box's own clock, which is not always right. That distinction comes back when we count viewers live. Next, Google Cloud itself: signing in, and finding out what the project holds.",
}
