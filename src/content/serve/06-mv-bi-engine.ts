import type { Section } from '../types'

export const mvBiEngine: Section = {
  id: 'mv-bi-engine',
  title: 'Materialized views and BI Engine',
  scene: 'serve-mv',
  narration:
    "A dashboard asks the same question all day: the derby's curve, households per minute. Scanning Silver for it each time is wasteful. The output is mocked. The editor shows two additions. A materialized view in Gold keeps the curve itself, a row per minute and channel, and BigQuery refreshes it as Silver changes, so a query reads the small stored result, plus only rows newer than the last refresh. And a BI Engine reservation of one gigabyte in London keeps hot tables in memory for dashboard queries. In the terminal, the curve is asked twice through the bytes script, which now also reports BI Engine's mode. From Silver, it reads six and a half million bytes, billed at the ten megabyte minimum, and BI Engine is not used. From the materialized view, BI Engine serves the whole query from memory: nothing read from storage, nothing billed. The side pane follows the curve from the base table, into the view, into memory. A materialized view earns its place when one query shape dominates; BI Engine when dashboards ask it often. Next, a model of the numbers themselves.",
}
