import type { Section } from '../types'

export const dedupeInTheStream: Section = {
  id: 'dedupe-in-the-stream',
  title: 'Dedupe in the stream: once per event_id',
  scene: 'flow-dedupe',
  narration:
    "The last course showed Pub Sub delivering some events twice. Counting households hides the problem, because a household counts once a minute however many copies arrive. Adding up seconds watched doesn't hide it. A duplicate heartbeat adds sixty seconds that nobody watched. The pipeline now reads the events as they were delivered, retries included, and counts each minute twice: once as delivered, and once after dropping the duplicates. The highlighted lines do the dropping. Inside each window, every event is keyed by its event i d. Grouping brings a retry next to its first copy, and only one is kept. Only then are the seconds added up. In the terminal, the same six minutes. The household counts are unchanged, as expected. Seconds watched, though, are higher as delivered, by three hundred seconds in most minutes and three hundred and sixty in some: five or six duplicate heartbeats per minute. The table in the side pane lists all six minutes, and every row where the two disagree is marked. Below, the three steps of the dedupe: events arrive keyed by event i d, grouping puts copies together, one is kept. Dedupe happens inside the window because that's where the copies meet. A retry arrives seconds after its first copy, so the two land in the same minute. Next, a different kind of window, one that follows a household's own viewing.",
}
