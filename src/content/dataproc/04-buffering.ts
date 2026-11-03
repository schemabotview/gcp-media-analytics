import type { Section } from '../types'

export const bufferingRatio: Section = {
  id: 'buffering-ratio',
  title: 'The buffering ratio',
  scene: 'proc-ratio',
  narration:
    "Minute by minute, one exchange looked bad. The report needs a single number per exchange that can be compared fairly, whatever its size. The editor shows it: over the whole derby, the seconds spent buffering divided by the seconds watched. A big exchange and a small one are measured on the same scale. The output is mocked, and matches the facts the generator planted. In the terminal, every exchange is listed, worst first. E X L D N zero four buffered forty one thousand, eight hundred and ninety five seconds for about a million seconds watched: four point one percent. Every other exchange sits at zero point six percent, the baseline of a healthy network. The side pane draws the ratio per exchange, one bar towering over eleven, and the note says what the minutes showed: almost all of zero four's buffering came after eighteen thirty five, in the second half. Before Spark can run this every night on Google Cloud, there is a problem with how the night's work is shared out. Next, the derby, as a straggler.",
}
