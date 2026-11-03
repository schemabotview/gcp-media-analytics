import type { Section } from '../types'

export const cloudBuild: Section = {
  id: 'cloud-build',
  title: 'CI with Cloud Build',
  scene: 'op-cloud-build',
  narration:
    "A change to viewing pulse should never reach a project because someone remembered to check it. Cloud Build runs the checks on every push. The output is mocked. The editor shows the build file. It runs as s a c i c d, the service account made for this in Course 4, in four steps: Terraform's format check, a validation of the configuration, a lint of every S Q L file in the warehouse, and finally a plan against dev, written into the build's log. There is no apply step, on purpose. C I proposes; a person reads the plan and applies it. In the terminal, the build is submitted by hand to show it end to end: the source is uploaded, the four steps run, the plan reports no changes, and the build succeeds in a little over two minutes. In production, a trigger connected to the GitHub repository starts the same build on every push to main. The side pane follows a push from GitHub, through the build, to a plan waiting for review. Next, the end of the film, and what could be built on top of all this.",
}
