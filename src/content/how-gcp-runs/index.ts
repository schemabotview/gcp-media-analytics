import type { Course } from '../types'
import { regionsAndZones } from './01-regions-and-zones'
import { theResourceHierarchy } from './02-the-resource-hierarchy'
import { apisPerProject } from './03-apis-per-project'
import { controlAndDataPlanes } from './04-control-and-data-planes'
import { threeClients } from './05-three-clients'
import { serverlessAndClusters } from './06-serverless-and-clusters'
import { howGcpCharges } from './07-how-gcp-charges'

// Course 2 · How Google Cloud is built. §1–§5 read-only labs recorded on GCP (§3 switches the
// Compute Engine API on); §6 doc-cited; §7 a labelled model run locally.
export const howGcpRuns: Course = {
  id: 'how-gcp-runs',
  title: 'How Google Cloud is built',
  sections: [regionsAndZones, theResourceHierarchy, apisPerProject, controlAndDataPlanes, threeClients, serverlessAndClusters, howGcpCharges],
}
