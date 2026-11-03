import type { Item } from '@graphlearning/graphl-flow'

// Every frame states its verification level when it is not `runs locally` (COURSE-PLAN.md,
// "Verification levels"): nothing emulated or compiled is presented as Google Cloud's own output. The
// label is the side pane's first node, at the same place in every frame that carries one.
export type Level = 'emulated' | 'recorded on GCP' | 'compiled' | 'doc-cited' | 'model'

const ICON: Record<Level, string> = {
  emulated: 'laptop', 'recorded on GCP': 'gcp', compiled: 'code', 'doc-cited': 'file', model: 'cpu',
}

export function level(kind: Level, sub: string): Item {
  return { type: 'item', id: 'level', icon: ICON[kind], title: kind, sub, tone: kind === 'emulated' ? 'neutral' : 'infra' }
}

/** The usual emulated label: the raw zone on Priya's laptop is fake-gcs-server, Cloud Storage's emulator. */
export const FAKE_GCS = level('emulated', 'the raw zone is fake-gcs-server, Cloud Storage’s emulator; PostgreSQL is real')

/** The recorded label: run once in the owner's project, normalised by the recorder, then torn down. */
export const RECORDED = level('recorded on GCP', 'run once in a real project; ids normalised, then torn down')

/** The stream on Priya's laptop: gcloud's Pub/Sub emulator, its topics made by the step's setup. */
export const PUBSUB_EMU = level('emulated', 'Pub/Sub is gcloud’s emulator; its topics are what §6.2 made on GCP')
