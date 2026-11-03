import type { Section } from '../types'

export const externalTables: Section = {
  id: 'external-tables',
  title: 'External tables: schema on read',
  scene: 'lake-external',
  narration:
    "Every night the platform that runs the boxes and the app exports the day's viewing events: four files of JSON lines. This step was recorded on Google Cloud. In the terminal, the four parts are copied into the raw bucket, under source equals viewing, and a folder for the night, the same shape Course 5 gave every source. The editor shows how BigQuery reads them without loading anything. An external table is only a schema laid over files: the column names and types, the bucket path, and one more instruction. Hive partitioning reads the night's date straight out of the path, so d t becomes a column a query can filter on. In the terminal, Terraform adds the table, and a query counts the night by platform, reading the four files as it runs. Four hundred and one thousand, nine hundred and fifty eight rows came back, more than the night's events, and the platform names are the clients' own: S T B, Web, Android and i O S, not the names Sun uses. Nothing is wrong yet; this is what was delivered. The side pane shows the idea: files in the bucket, a schema over them, a query that reads them in place. Next, the night is kept in a real table, exactly as it arrived.",
}
