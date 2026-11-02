import type { Section } from '../types'

export const fiveSources: Section = {
  id: 'five-sources',
  title: 'Sun’s five sources: two batch, three ways to stream',
  scene: 'start-five-sources',
  narration:
    "Before building anything on Google Cloud, it helps to know exactly what Sun's data looks like and how each piece arrives. The editor holds the project's first file, a readme listing Sun's five sources. The C R M knows the households and their packages. Billing records every charge. The catalogue and the E P G, the programme guide, are files that vendors deliver each day. Viewing events come from every set-top box and every copy of the app: a message when something starts playing, one every minute it plays, and one when it stops. And network telemetry comes from Sun's twelve broadband exchanges, a reading every minute. On Priya's laptop, all five come from a seeded generator, so every number in this course can be produced again exactly. The terminal counts what it wrote. Five thousand households. Over three thousand charges across the last three days. A hundred and four titles. Seventeen thousand two hundred and eighty telemetry readings, one per exchange per minute. And just over four hundred thousand viewing events for one Saturday, derby day. The side pane sorts the sources into the platform's two paths. The C R M, billing and the vendor files change slowly and need to be right, so they travel as a nightly batch, answered next morning. Viewing and telemetry matter while the match is on, so they travel as a live stream, answered in seconds. Next, a closer look at the C R M.",
}
