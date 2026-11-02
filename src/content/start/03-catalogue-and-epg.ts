import type { Section } from '../types'

export const catalogueAndEpg: Section = {
  id: 'catalogue-and-epg',
  title: 'The catalogue and the EPG: what aired, and when',
  scene: 'start-catalogue-epg',
  narration:
    "Two of Sun's sources aren't databases at all: they are files that vendors deliver every day. The catalogue is a C S V file, one row per title, with an i d, a name, a kind and a running time. The E P G, the electronic programme guide, is a J S O N file listing every channel's slots for the day, each slot pointing at a title i d. Neither file is useful alone, so the new script, slots dot p y, joins them: for one channel and a stretch of the evening, it prints each slot with its title's name. It also does one more thing, highlighted at the bottom: when one slot ends and the next does not start straight away, it prints the hole. In the terminal, the catalogue's header and first rows. On SUN SPORTS ONE the evening reads cleanly: Sun News until half past five, then Northbridge versus Eastfield, the derby, from five thirty to seven twenty five, then live football. On SUN MOVIES TWO, two films, and then from eight to ten o'clock, no slot at all. The boxes were showing a film during those two hours, but the feed never said which. The side pane draws the join. A slot plus a title i d gives a title name. A missing slot gives nothing, and any viewing joined to the guide in those hours will find no match. Nothing fails here. The gap only matters once someone counts minutes by title, and we'll meet it again in Course eight. Next, the busiest source: one box's night of events.",
}
