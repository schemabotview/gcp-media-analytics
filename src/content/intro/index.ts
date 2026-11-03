import type { Course } from '../types'
import { aNightOfViewing } from './01-a-night-of-viewing'
import { twoQuestionsTwoClocks } from './02-two-questions-two-clocks'
import { whatWellBuild } from './03-what-well-build'

// Course 1 · Media analytics, and what we'll build. §1 a concept drawn from sun_gen's counts; §2 a
// local lab over the night's raw events; §3 the finished map.
export const intro: Course = {
  id: 'intro',
  title: 'Media analytics, and what we’ll build',
  sections: [aNightOfViewing, twoQuestionsTwoClocks, whatWellBuild],
}
