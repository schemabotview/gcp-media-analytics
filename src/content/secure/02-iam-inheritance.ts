import type { Section } from '../types'

export const iamInheritance: Section = {
  id: 'iam-inheritance',
  title: 'IAM inheritance: a bucket’s policy, and its project’s',
  scene: 'secure-inheritance',
  narration:
    "Policies in Google Cloud stack. A resource has its own policy, and it also inherits every policy above it in the hierarchy: its project, any folders, and the organization. What a caller may do is the union of all of them, and an inherited grant can't be taken away lower down. This project sits alone, with no organization or folders, so there are two levels to read. The editor shows the raw bucket's code, and the highlighted line, uniform bucket level access, means this bucket is governed by I A M policies only, no per-object permissions. In the terminal, the project's sixteen bindings are counted, then the bucket's own policy is read. It has four bindings of its own, and none of them names a person. Their members are projectOwner, projectEditor and projectViewer: convenience bindings that Cloud Storage adds to every new bucket, pointing back up at whoever holds those roles on the project. Owners and editors get the legacy bucket owner and object owner roles. Viewers get the readers. The side pane draws the hierarchy, top to bottom. The organization level is greyed out because it doesn't exist here. The project's bindings flow down to the bucket. The bucket adds its own. The bottom card is the rule: the effective permission is the union, never less. So the way to give a job narrow access is not to subtract anything: it's to leave the job out of the project policy and grant it on the bucket alone. Next, the jobs get identities of their own.",
}
