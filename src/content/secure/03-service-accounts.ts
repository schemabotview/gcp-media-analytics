import type { Section } from '../types'

export const serviceAccounts: Section = {
  id: 'service-accounts',
  title: 'Service accounts: one identity per job',
  scene: 'secure-service-accounts',
  narration:
    "A pipeline shouldn't run as a person. When it does, it can do everything that person can, and its actions are logged under their name. Google Cloud's answer is the service account: an identity for a program. The new I A M module creates five of them, one per job, and the editor shows the list. S A ingest lands the nightly extracts. S A dataflow runs the live viewer count. S A dataproc runs the quality of service join. S A airflow runs the nightly D A G. And S A C I C D plans and deploys from continuous integration. Each one gets a description saying who wears it, and Terraform creates them all from that one map. In the terminal, the plan has five resources to add, the apply creates them in about twelve seconds each, and listing Terraform's state shows the five accounts, now tracked like any other resource. The side pane's table lists each account and the job that runs as it. Below, the idea in one line: the nightly extract is a program, it runs as S A ingest, and S A ingest is its identity on Google Cloud. The arrow to the raw zone is dashed and the zone is greyed out, because an account starts with no permissions at all. Creating an identity grants nothing. That comes later, role by role. First, though, someone has to be able to act as these accounts, and that should never mean a key file. Next, impersonation.",
}
