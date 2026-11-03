import type { Section } from '../types'

export const threeClients: Section = {
  id: 'three-clients',
  title: 'Console, gcloud, Terraform: one API underneath',
  scene: 'how-three-clients',
  narration:
    "The Cloud Console, the g cloud command line and Terraform look like three different tools, but they're three clients of the same R E S T A P Is. This lab reads one thing, the project, three ways, and shows they all arrive at the same place. First g cloud, with logging on. It sent a G E T request to the Cloud Resource Manager A P I: version one, projects, then the project i d. Then the same request with no tool at all. A short lived access token goes into a shell variable, and is never printed. Curl sends it to that address and gets back the project's i d and number. Last, Terraform. A tiny configuration with a single data source reads the same project, creates nothing, and outputs the same i d and number. The side pane draws all of it. On the left are the clients: g cloud, a bare curl with a token, Terraform's Google provider, and the Console, greyed out, because this course never takes screenshots of it. All four arrows land on one service, Cloud Resource Manager, and one request. The table lines up the answers: the same project, and where it was printed, the same number. This is why the course can use g cloud to read and Terraform to build without them ever disagreeing. Underneath, there's only one source of truth, the A P I. Next, the two families of service this platform is built from.",
}
