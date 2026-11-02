import type { Section } from '../types'

export const theState: Section = {
  id: 'state',
  title: 'State, and where it lives: a bucket, and a lock',
  scene: 'start-state',
  narration:
    "Terraform keeps a state file: its record of what it created and each resource's real i d. On one laptop that file can be lost, and two people running Terraform at once would each work from their own copy. So the state moves into Cloud Storage. The editor shows the new backend file. It says the state lives in a G C S bucket, under a prefix for this environment, env slash dev. The bucket's name is passed in when Terraform starts, because a backend block can't read variables. That bucket has to exist before Terraform can use it, so it's the one thing in the whole platform made with the command line: the bootstrap script creates it, with versioning on, so every earlier state is kept. In the terminal, the script creates the state bucket. Terraform init then migrates: it takes the lock, copies the state into the bucket, and releases the lock. Listing the bucket shows one object, default dot t f state, under env slash dev. The old local files are still on the laptop, and the table in the side pane marks them as copies to delete. The final plan reads the state from the bucket, refreshes the raw bucket, and finds no changes. Notice the plan also takes the lock first. While one run holds it, a second run is refused instead of both writing the state at once. Next, the code grows into modules, and the project gets a budget.",
}
