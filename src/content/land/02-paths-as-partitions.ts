import type { Section } from '../types'

export const pathsAsPartitions: Section = {
  id: 'paths-as-partitions',
  title: 'Paths as partitions: one folder per source and night',
  scene: 'land-partitions',
  narration:
    "Every night, four sources arrive in Sun's raw zone, and each one needs an address that says what it is and which night it belongs to. On Priya's laptop the raw zone is fake G C S server, Cloud Storage's emulator, and the label at the top of the side pane says so. The new file is raw dot p y. Its docstring holds the idea of the whole section: Cloud Storage has no folders. An object has one flat name, and that name may contain slashes. The partition function builds the start of every name: source equals the system, then d t equals the night. The first two commands land the vendors' files for derby day, the content catalogue and the E P G, the programme guide. Then the terminal lists the same two objects three ways. With two stars, gcloud prints every whole name, slashes and all. With the bucket alone, it groups the names at the first slash and shows what look like folders; the tool made those up. With a wildcard for the source and a fixed date, it lists one night across every source, because a shared prefix is a filter. The table in the side pane splits one real name into its parts. The bucket, then source equals E P G, then d t equals the thirty first of October, then the file. In Course eight, BigQuery will read those two prefixes back as two columns, source and d t, and skip every night a query does not ask for. Next, the source systems themselves: two nightly extracts, shaped two different ways.",
}
