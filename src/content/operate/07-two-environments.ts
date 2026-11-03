import type { Section } from '../types'

export const twoEnvironments: Section = {
  id: 'two-environments',
  title: 'Two environments',
  scene: 'op-two-envs',
  narration:
    "Everything so far lived in one project, sun media dev. Production is a second project, built by the same code. The output is mocked, and nothing was applied to production. The editor shows all that production needs of its own: a variables file saying prod, and the region. Every module stays exactly as it is. In the terminal, the project variable points at sun media prod, and Terraform is initialised against that project's own state bucket, with reconfigure, so the two states can never mix. The plan for production lists every resource the courses built, to add, and nothing to change or destroy. That plan is the same code reviewed twice: once against dev, where it was applied and tested, and once against prod. Workspaces are not used, and the terminal shows it: separate state buckets in separate projects keep a mistaken command in one environment from touching the other. The side pane shows one root module, two projects, and the table of what differs: only the variables and the state. Next, making every change go through the same checks before anyone applies it.",
}
