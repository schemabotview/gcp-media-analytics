import type { Section } from '../types'

export const bigqueryConnector: Section = {
  id: 'bigquery-connector',
  title: 'The BigQuery connector',
  scene: 'proc-connector',
  narration:
    "On Dataproc, the night will come from Silver, not a file, and Spark reads BigQuery through a connector. The terminal's output is mocked. The editor shows the read. The connector is a package Spark fetches on first use. The table is silver viewing events; the where clause keeps the night and the derby, and the select keeps three columns. None of that is done by Spark. The connector hands the filters and the column list to BigQuery's Storage Read API, which applies them inside BigQuery and streams back only the rows and columns asked for. The script prints what Spark's own plan says it pushed down: the filters on the night and the title, and a read schema of three columns. Two hundred and forty seven thousand, three hundred and two derby events arrive, not four hundred thousand rows of eleven columns. That is the difference between paying to move the whole night and paying to move the match. The side pane traces the request from Spark, through the read session, to the rows that come back. Next, the night's real question: how much each exchange buffered.",
}
