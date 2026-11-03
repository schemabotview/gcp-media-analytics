import type { Section } from '../types'

export const controlAndDataPlanes: Section = {
  id: 'control-and-data-planes',
  title: 'Control plane and data plane: a bucket and its objects',
  scene: 'how-planes',
  narration:
    "Every service has two kinds of request. Some manage the resource itself, and some use what it holds. They're called the control plane and the data plane, and they're often governed by different permissions. This lab uses Google's public sample bucket, which anyone may read, so nothing in the project is touched. The first describe asks for the bucket's settings: it's in the U S, in the multi regional storage class. Then the same describe runs with dash dash log H T T P, which prints every request g cloud sends, filtered to the address. It went to storage slash v one slash b, then the bucket's name: the bucket as a resource. Listing the bucket the same way went somewhere else: the same path, followed by slash o, the bucket's objects. The last command counts forty six entries at the top level. The side pane splits the two planes. On the left, the control plane: the bucket's own address, and the kind of work done there, which is creating, configuring and setting policy. That's what Terraform does. On the right, the data plane: the objects' address, and reading, writing and listing. That's what the pipeline does. The table shows the two addresses g cloud called. This split comes back throughout the course. The extract's service account will be allowed to write objects into the raw zone, but never to change the bucket's settings. Next, three different clients, all calling the same A P I.",
}
