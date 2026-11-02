import type { Section } from '../types'

export const secretManager: Section = {
  id: 'secret-manager',
  title: 'Secret Manager: one password, one reader',
  scene: 'secure-secret-manager',
  narration:
    "The nightly extract needs the C R M's database password, and that password must not live in the code, in a config file, or on anyone's laptop. Secret Manager holds it. The new secrets module does three things, and the editor highlights them. Terraform generates the password itself, thirty two random characters that nobody ever types. It stores them as the first version of a secret called C R M D B password, replicated in London only. And it grants exactly one identity the secret accessor role: S A ingest. In the terminal, the apply creates five resources. Listing the secret's versions shows version one, enabled. Then the two reads. Acting as S A ingest, the latest version is read and only its length is counted: thirty two characters, the value itself never printed. Acting as S A dataflow, the same request is refused with permission denied, because that account has no reason to know the C R M's password. The side pane draws the secret, its one version, and the two readers: S A ingest allowed, S A dataflow refused. A note records the rule. At run time the extract will read the password as S A ingest and hold it only in memory, and rotating it later means adding a new version, not editing any code. Next, the raw zone gets Sun's own encryption key.",
}
