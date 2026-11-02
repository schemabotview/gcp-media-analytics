import type { Section } from '../types'

export const permissionDenied: Section = {
  id: 'permission-denied',
  title: 'PERMISSION_DENIED: the identity works, the grant is missing',
  scene: 'secure-permission-denied',
  narration:
    "This is a step that fails on purpose, run once and then set aside. Priya acts as S A ingest and asks for something it can't do yet. The editor shows the raw bucket's code, and there's nothing in it for this account: no binding names S A ingest. In the terminal, the first command proves the impersonation works. A token is minted for the account, and only its length is printed, over a thousand characters. Then, as S A ingest, g cloud lists the raw zone, and Google refuses. The error is precise: S A ingest does not have storage dot objects dot list access to the bucket, permission denied. It even names the identity that asked and the one it impersonated. The side pane tells the story in three steps. The token works. The call needs one specific permission, storage objects list, on the raw bucket. No binding grants it, so the answer is permission denied. This is the normal shape of an I A M failure, and the way to read it: find the permission named in the error, then the narrowest role that holds it. The table maps that out. Listing objects comes with the object viewer role. Creating them comes with object creator. And deleting them comes with a role nobody on this platform will get. Both grants go on the bucket, not the project, in the last section of this course. Next, the first secret.",
}
