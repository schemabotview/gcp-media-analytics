import type { Section } from '../types'

export const signingIn: Section = {
  id: 'signing-in',
  title: 'Signing in: one identity, one project, nothing yet',
  scene: 'start-signing-in',
  narration:
    "From here on the commands run against a real Google Cloud project, recorded once, with its real identifiers replaced, and the label at the top of the side pane says so. Before building anything, it's worth knowing three things: who is signed in, which project the commands will touch, and what already exists there. The editor holds a small file Priya sources in every Google Cloud shell. It asks g cloud for the current project and the signed in account, and hands both to Terraform as variables, so no project i d is ever typed into the code. In the terminal, the first command names the account every call will be made as. The second shows the project, sun media dev. The third asks whether the Cloud Storage A P I is switched on. In Google Cloud, every service is an A P I that each project enables separately, and Storage is already on. The last command looks for anything carrying the label app equals viewing pulse, and finds nothing: the project holds none of the platform yet. The side pane draws that chain from identity to project to enabled A P I, ending at an empty search. The table below lists the three labels Terraform will attach to every resource it makes. App says whose it is, env says which copy, and owner says who to ask. Labels are how a shared project gets filtered down to one team's resources. Next, the first resource, written as code.",
}
