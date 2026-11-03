import type { Section } from '../types'

export const whatWellBuild: Section = {
  id: 'what-well-build',
  title: 'What we’ll build: viewing-pulse, both lanes',
  scene: 'intro-map',
  narration:
    "This is the whole platform, called viewing pulse, as it will look at the end of the course. Every part of it is created by Terraform, inside one Google Cloud project in London. On the left are Sun's own systems: the C R M, billing, the vendors' catalogue and programme guide, and the households' devices. The project has two lanes, one for each clock. The top lane is the nightly batch, built for correctness. Each night's extracts land in a raw zone in Cloud Storage. BigQuery loads them into Bronze, exactly as received. Silver holds the cleaned, deduplicated data, and Gold holds the marts the business reads. Dataproc runs the heavy join between viewing and network quality. Gates sit on the arrows, G one to G four, and a night that fails one goes no further. The bottom lane is live, built for speed. Every device's events arrive on Pub Sub. Dataflow counts viewers per channel per minute, in event time, and writes the live table in BigQuery. Both lanes end at Looker, where the business reads the live curve during the match and the reconciled numbers next morning. Along the bottom are the services the whole platform depends on: I A M and its service accounts, Secret Manager, Cloud K M S, Composer to run the nightly schedule, Dataplex, Sensitive Data Protection, Logging, Monitoring, Cloud Build and a budget. Each service is introduced only when the platform first needs it. Next, how Google Cloud itself is built.",
}
