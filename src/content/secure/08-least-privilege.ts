import type { Section } from '../types'

export const leastPrivilege: Section = {
  id: 'least-privilege',
  title: 'Least privilege: the role matrix, applied',
  scene: 'secure-least-privilege',
  narration:
    "With identities in place, each job gets the narrowest roles its work needs, on the narrowest resource that holds them. The editor shows the storage module's grants on the raw bucket. S A ingest gets object creator, to land files, and object viewer, so the landing gate can read them back. S A dataproc gets object viewer, to read the zone for the quality of service join. Nobody gets a role that can delete or replace an object. On the project, the processing accounts get the worker roles their services require: Dataflow worker, Dataproc worker and Composer worker. In the terminal, the apply adds six grants. Then roles dot sh reads the result back from Google, for the five job accounts only, project and bucket. It's the same matrix the code describes, now as Google holds it. Finally, acting as S A ingest, the raw zone is listed again, the request that was refused two sections ago, and this time it's allowed. The side pane's table is that matrix: each account, the resource, the role. Below, the one grant that fixed the earlier failure, on the bucket and not on the project. That's the end of identity: five accounts, no key files, one secret, Sun's own key, and a written role matrix. The next course goes back to the raw zone, now protected, and builds a nightly batch that can be trusted.",
}
