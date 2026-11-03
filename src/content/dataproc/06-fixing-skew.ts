import type { Section } from '../types'

export const fixingSkew: Section = {
  id: 'fixing-skew',
  title: 'Fixing skew',
  scene: 'proc-fix-skew',
  narration:
    "There are two ways to spread the derby, and the editor shows both. The first is Spark's own. Adaptive query execution watches the shuffle's real sizes, and its skew join splits any partition far larger than the rest into pieces, each joined to a copy of the other side. The thresholds are set low here, because this night is small; the defaults are sized for a real cluster. The second is salting, by hand. Each event gets a salt from zero to three, taken from its event I D, and the catalogue is copied four times, once per salt. The join key becomes the title and the salt, so one title's rows spread over four partitions. In the terminal, with adaptive execution on, the join's stage now runs eleven tasks: the derby's partition was cut in four, and the biggest task reads about a hundred thousand rows. With salting, eight tasks, the largest about ninety one thousand. The answers are identical either way. Adaptive execution needs no change to the query, so it is the first thing to reach for. Salting is for when the hot key is known and the engine can't see it. Next, the batch on Dataproc Serverless.",
}
