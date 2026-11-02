import type { Section } from '../types'

export const cloudIam: Section = {
  id: 'cloud-iam',
  title: 'Cloud IAM: roles, members, and one policy',
  scene: 'secure-cloud-iam',
  narration:
    "Every request to Google Cloud is checked against an allow policy, and before granting anything new it's worth reading the one the project already has. The editor shows the shell file again, because its last line matters now: Terraform runs as Priya's signed in identity, and that identity is what every policy decides about. In the terminal, the project's policy is saved as J S O N, and three small queries read it. It holds sixteen bindings. A binding is the unit of I A M: one role, and the list of members who hold it. The editor role, for example, is held by two members, and both are Google's own service agents, accounts Google Cloud creates to run services on this project's behalf. The owner role has two members. Owner can do anything in the project, including granting itself more. The side pane draws the shape. One policy is attached to the project, a binding names a role, and the role lists its members. The tables repeat the editor's two members and the owner count. Notice what's missing: nothing here says which bucket or which secret. A role granted on a project applies to everything in it. That's convenient, and it's also why the platform's own jobs will get their roles on the narrowest resource instead. Next, how a policy on a project reaches a bucket inside it.",
}
