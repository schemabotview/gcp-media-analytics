import type { Section } from '../types'

export const dataQuality: Section = {
  id: 'data-quality',
  title: 'Dataplex data quality',
  scene: 'op-quality',
  narration:
    "The gates live inside the nightly D A G. Dataplex offers another place for rules: a data quality scan, kept and reported beside the table itself. The output is mocked. The editor shows a scan of Silver's viewing events for the night, in Terraform, with four rules: every event has an I D, no I D appears twice, the platform is one of Sun's four names, and seconds watched lie between zero and sixty. In the terminal the scan runs on demand, and its result comes back: four hundred thousand, nine hundred and forty nine rows, and every rule passed. The comment above the scan says why the gates did not move here. G2 checks titles against the catalogue, G3 checks the guide against the minutes, G4 checks Gold against Silver: each compares two tables, and a scan looks at one. The side pane sorts the rules by where they belong. A rule about one table's own shape fits a scan, visible to anyone browsing the catalog. A rule that compares tables stays a gate, where it can stop the night. Next, watching the platform as it runs.",
}
