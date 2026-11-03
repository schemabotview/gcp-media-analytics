import type { Section } from '../types'

export const bronze: Section = {
  id: 'bronze',
  title: 'Bronze: the night as delivered',
  scene: 'lake-bronze',
  narration:
    "An external table rereads the files on every query, and the raw zone keeps them only as long as its rules say. So the night is copied once into a table of its own, Bronze, exactly as delivered. This step was recorded on Google Cloud. The editor shows the copy. It selects every column from the external table and adds two: underscore src file, the object each row was read from, which BigQuery supplies as a hidden column; and underscore ingest t s, when the copy ran. Nothing is fixed on the way in. A retry stays a retry, and a row with a missing field stays missing. Bronze is the evidence: if a number in Gold is ever questioned, the row behind it can be found, with the file it came from. In the terminal, Terraform adds the table, and the script runs with the night as a parameter. Four hundred and one thousand, nine hundred and fifty eight rows are inserted, and the count per file shows all four parts, about a hundred thousand rows each. The side pane follows a row from the files, through the insert, into Bronze with its provenance. Next, a look inside BigQuery: how it ran a query over these rows.",
}
