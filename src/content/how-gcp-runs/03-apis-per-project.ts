import type { Section } from '../types'

export const apisPerProject: Section = {
  id: 'apis-per-project',
  title: 'APIs are switched on per project',
  scene: 'how-apis',
  narration:
    "Every Google Cloud service is an A P I, and a project can only call the A P Is switched on for it. This lab shows a call refused, then the switch flipped, then the same call working. The first command counts the A P Is already enabled on the project: fifty two. Compute Engine is not one of them. So the second command, a request to list London's zones, is refused. The error is long but precise. The Compute Engine A P I has not been used in this project before, or it's disabled. It gives the reason, service disabled, and a link to enable it. The third command switches it on, and the operation finishes successfully. The fourth repeats the first call, and now it returns London's three zones. The side pane draws that sequence. The project and its enabled A P Is. Compute switched off, and the call refused. The switch flipped, for this project only. Then the same call answered. Switching on an A P I creates nothing and costs nothing by itself. It only allows the project to make the calls. The card at the bottom records a rule this course keeps. This one switch is made with the command line, while the course is still exploring. From the next course on, Terraform switches on whatever A P Is the platform needs, as code, alongside the resources that use them. Next, two different kinds of request to the same service.",
}
