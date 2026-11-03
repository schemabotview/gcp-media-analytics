import type { Section } from '../types'

export const lineageSection: Section = {
  id: 'lineage',
  title: 'Dataplex: catalog and lineage',
  scene: 'op-lineage',
  narration:
    "When the derby's audience is questioned, someone has to show where it came from. Nobody kept that map by hand, and nobody needed to. The output is mocked. Dataplex records lineage automatically: every BigQuery job that writes a table leaves a link from the tables it read. The editor shows a script that walks those links backwards. For a table, it asks the lineage A P I for every link that ends there, prints each source, and walks on from it, until it reaches files. In the terminal, Gold's content table leads back to four sources: the households and titles read in place from the raw zone, the subscriber dimension, and Silver's viewing events. Silver leads to Bronze, Bronze to the external table, and that to the device platform's export in the raw bucket. The quarantine appears too, because Silver reads it to leave the bad rows out. The side pane draws the longest path, from the raw files to Gold, and lists the other sources. Next, a different kind of check, kept beside the table instead of inside the D A G.",
}
