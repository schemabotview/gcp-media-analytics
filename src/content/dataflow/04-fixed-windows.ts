import type { Section } from '../types'

export const fixedWindows: Section = {
  id: 'fixed-windows',
  title: 'Fixed windows: viewers per channel, per minute',
  scene: 'flow-windows',
  narration:
    "To count viewers per minute, the pipeline has to know which minute each event belongs to, by event time, not by when it was heard. Beam does this in two steps, and both are highlighted. First, every event is stamped with its event time, taken from the box's own timestamp. Then the stamped events are placed into fixed windows, sixty seconds each, back to back. From there, every grouping and counting step works within one window at a time. Inside each window, the pipeline pairs the channel with the household and keeps each pair once, so a household with many heartbeats in a minute counts once. Then it counts per channel. In the terminal, six minutes of the sports channel. Eighteen thirty eight has just over two thousand and sixty households. Then two thousand one hundred and thirty nine at every minute from eighteen thirty nine, except eighteen forty one, which has two thousand one hundred and forty: the derby's peak, the same number the first course computed. The side pane plots the six windows as bars, with the counts in the table. These numbers are correct because the whole night was already in the file. In a live stream, the pipeline has to decide when a minute is finished. The slow boxes are still four minutes behind, so if it decides too early, it undercounts. Next, the watermark: how a stream decides.",
}
