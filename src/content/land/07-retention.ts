import type { Section } from '../types'

export const retention: Section = {
  id: 'retention',
  title: 'Immutable by policy: a delete the bucket refuses',
  scene: 'land-retention',
  narration:
    "The seal stops this pipeline from rewriting a night, but it can't stop a person, a script or a wrong command from deleting one. A retention policy can. It's set on the bucket, and it applies to every object in it, whoever asks. The editor shows the new block in the storage module. Each object must reach a minimum age before it can be deleted or replaced. In this development project the age is one hour, so a recording can be torn down the same day. A production raw zone would hold its nights for years. In the terminal, the apply updates the bucket in place, and describing it shows the policy: a retention period of three thousand six hundred seconds. Then one object is chosen, the night's charges file, and Cloud Storage reports its own retention expiry, an hour after it was created. Finally, the delete. G cloud tries to remove the object and the task fails. The refusal comes from the bucket's policy. It isn't about I A M: the account asking is the project's owner. The side pane follows that chain: the object, the policy, the object's own expiry time, and the refused delete. A note records the limit. This policy is unlocked, so it can still be shortened or removed. Locking it makes it permanent, even for the owner, and that isn't done in a course project. Next, the last rule for the raw zone: what happens as nights get old.",
}
