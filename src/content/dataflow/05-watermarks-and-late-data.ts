import type { Section } from '../types'

export const watermarksAndLateData: Section = {
  id: 'watermarks-and-late-data',
  title: 'Watermarks and late data: on time, then right',
  scene: 'flow-watermarks',
  narration:
    "A stream never knows for certain that a minute is finished, because a slow box might still be sending. Beam's answer has two parts, and this pipeline shows both. The file late dot p y feeds the events in the order they were heard, each stamped with its event time. Alongside them it advances a watermark: the pipeline's running estimate that nothing older than a given time is still on its way. Here the watermark trails what has been heard by ten seconds. The highlighted trigger says when to emit a count. When the watermark passes the end of a window, the window fires on time. Each late event that arrives afterwards fires it again, and the counts accumulate. Allowed lateness keeps the window open for ten minutes past its end. In the terminal are two windows. Eighteen forty fired on time with two thousand and ninety three households, then received fifty three late panes, ending at two thousand one hundred and thirty nine. Eighteen forty one fired on time with two thousand and ninety four. Fifty two late panes followed, each a slow box heard minutes after the fact, and it ended at two thousand one hundred and forty, the true peak. The side pane follows the eighteen forty one window through all of that, and the table lists both windows. A live chart can show the on time number at once and correct it as late data arrives. Next, the retries' second copies.",
}
